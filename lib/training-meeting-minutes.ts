/**
 * Meeting minutes + effectiveness scoring for training-sandbox meetings.
 *
 * When an interactive text meeting (lib/training-meetings.ts) adjourns, the
 * transcript is turned into formal minutes (summary, decisions, action items)
 * and scored against the meeting's hidden checkpoints — the planted "tests"
 * the PM was expected to catch (e.g. the 30-day slab-pour milestone). Both are
 * persisted to training_meeting_minutes (migration 174) by the minutes API
 * route so the meeting hyperlink and the phase Job Review can reopen them.
 *
 * Gemini does the writing/scoring; without GEMINI_API_KEY (or on any failure)
 * a deterministic fallback assembles serviceable minutes and scores each
 * checkpoint by keyword match against the PM's turns.
 */

import { GoogleGenAI, Type } from "@google/genai";
import {
  type TrainingMeeting,
  type MeetingTurn,
  type WalkQuestion,
} from "@/lib/training-meetings";

export type CheckpointResult = {
  id: string;
  title: string;
  expectation: string;
  caught: boolean;
  /** One sentence on how the PM handled (or missed) it. */
  note: string;
};

export type MinutesContent = {
  summary: string;
  decisions: string[];
  actionItems: string[];
};

export type GeneratedMinutes = {
  minutes: MinutesContent;
  checkpoints: CheckpointResult[];
  scoreCaught: number;
  scoreTotal: number;
};

/** The trainee's raw answer to one site-walk question (client-recorded). */
export type WalkResponseInput = {
  id: string;
  answer: string;
  elapsedMs: number;
  expired: boolean;
};

export type WalkCredit = "full" | "half" | "none";

export type WalkResult = {
  id: string;
  title: string;
  question: string;
  credit: WalkCredit;
  /** One sentence on why the answer earned that credit. */
  note: string;
  answer: string;
  elapsedMs: number;
  expired: boolean;
  /** Skill the question evidences (copied from the definition for competency rollup). */
  skill: string;
};

export type GradedWalk = {
  results: WalkResult[];
  /** full = 1.0, half = 0.5. */
  points: number;
  total: number;
};

const MAX_TURN_CHARS = 2000;

function clip(text: string, max: number): string {
  return text.length > max ? text.slice(0, max) + "…" : text;
}

/** Keyword heuristic used when Gemini is unavailable. */
function keywordScore(meeting: TrainingMeeting, transcript: MeetingTurn[]): CheckpointResult[] {
  const pmText = transcript
    .filter((t) => t.speaker === "user")
    .map((t) => t.text.toLowerCase())
    .join("\n");
  return meeting.checkpoints.map((c) => {
    const caught = c.keywords.some((k) => pmText.includes(k.toLowerCase()));
    return {
      id: c.id,
      title: c.title,
      expectation: c.expectation,
      caught,
      note: caught
        ? "The PM addressed this during the meeting."
        : "The PM did not address this during the meeting.",
    };
  });
}

/** Deterministic minutes used when Gemini is unavailable. */
function fallbackMinutes(meeting: TrainingMeeting, transcript: MeetingTurn[]): MinutesContent {
  const pmTurns = transcript.filter((t) => t.speaker === "user");
  return {
    summary:
      `The ${meeting.title} meeting was held with ${meeting.speakers
        .map((s) => `${s.name} (${s.title})`)
        .join(", ")} and the project manager. ` +
      `The team worked through the full agenda: ${meeting.agenda.map((a) => a.title.toLowerCase()).join("; ")}. ` +
      `The PM contributed ${pmTurns.length} response${pmTurns.length === 1 ? "" : "s"} and the meeting adjourned with the ${meeting.deliverable.toLowerCase()} agreed.`,
    decisions: pmTurns.slice(-3).map((t) => clip(t.text, 240)),
    actionItems: meeting.agenda[meeting.agenda.length - 1].points.slice(0, 4),
  };
}

function normalizeResult(
  meeting: TrainingMeeting,
  raw: { id?: string; caught?: boolean; note?: string }[],
): CheckpointResult[] | null {
  const results: CheckpointResult[] = [];
  for (const c of meeting.checkpoints) {
    const hit = raw.find((r) => r.id === c.id);
    if (!hit) return null; // model skipped a checkpoint — fall back entirely
    results.push({
      id: c.id,
      title: c.title,
      expectation: c.expectation,
      caught: !!hit.caught,
      note: clip((hit.note ?? "").trim(), 400) || (hit.caught ? "Caught." : "Missed."),
    });
  }
  return results;
}

/**
 * Generates minutes + checkpoint scoring for a completed meeting. Never
 * throws — degrades to the deterministic fallback.
 */
export async function generateMeetingMinutes(opts: {
  meeting: TrainingMeeting;
  transcript: MeetingTurn[];
  projectName: string;
  traineeName: string;
}): Promise<GeneratedMinutes> {
  const { meeting, transcript } = opts;

  const fallback = (): GeneratedMinutes => {
    const checkpoints = keywordScore(meeting, transcript);
    return {
      minutes: fallbackMinutes(meeting, transcript),
      checkpoints,
      scoreCaught: checkpoints.filter((c) => c.caught).length,
      scoreTotal: checkpoints.length,
    };
  };

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return fallback();

  const transcriptBlock = transcript
    .map((t) => {
      const who =
        t.speaker === "user"
          ? `${opts.traineeName || "PM"} (the project manager — the person being scored)`
          : meeting.speakers.find((s) => s.key === t.speaker)?.name ?? t.speaker;
      return `${who}: ${clip(t.text, MAX_TURN_CHARS)}`;
    })
    .join("\n\n");

  const checkpointBlock = meeting.checkpoints
    .map((c) => `- id "${c.id}": ${c.title}. Caught means: ${c.expectation}`)
    .join("\n");

  const systemInstruction = `You are the minute-taker for a general contractor's "${meeting.title}" meeting on the project "${opts.projectName}". Attendees: ${meeting.speakers
    .map((s) => `${s.name} (${s.title})`)
    .join(", ")}, plus the project manager. Produce two things from the transcript:

1. FORMAL MINUTES — a concise summary paragraph (3-6 sentences), the concrete decisions made (one per line, e.g. short-list picks by trade), and the action items with owners where stated.

2. CHECKPOINT SCORING — the meeting contained planted tests the PM was expected to catch. For each checkpoint decide, strictly from the transcript, whether the PM caught it (raised it, acted on it, or made the safe call it points at). Give a one-sentence note quoting or paraphrasing the PM's handling — or stating what they missed.

CHECKPOINTS:
${checkpointBlock || "(none — score no checkpoints, return an empty checkpoints array)"}

${meeting.facts ? `REFERENCE FACTS:\n${meeting.facts}\n\n` : ""}Rules:
- Score only on what the PM actually said. Attendees mentioning a risk does not count as the PM catching it.
- Be fair but strict: a vague "sounds good" after the team's recommendation is weaker than the PM naming the risk — but accepting a recommendation that resolves the risk still counts as caught.
- Return every checkpoint id exactly once.`;

  const userPrompt = `=== MEETING TRANSCRIPT (oldest first) ===
${transcriptBlock}

Produce the minutes and checkpoint scoring now.`;

  try {
    const ai = new GoogleGenAI({ apiKey });
    const result = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [{ role: "user", parts: [{ text: userPrompt }] }],
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: { type: Type.STRING, description: "Minutes summary paragraph." },
            decisions: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Concrete decisions made, one per entry.",
            },
            actionItems: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Action items, with owners where stated.",
            },
            checkpoints: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: {
                    type: Type.STRING,
                    // An empty enum is invalid — only constrain when there are
                    // checkpoints to score (normalizeResult ignores strays).
                    ...(meeting.checkpoints.length > 0
                      ? { enum: meeting.checkpoints.map((c) => c.id) }
                      : {}),
                  },
                  caught: { type: Type.BOOLEAN },
                  note: { type: Type.STRING },
                },
                required: ["id", "caught", "note"],
              },
            },
          },
          required: ["summary", "decisions", "actionItems", "checkpoints"],
        },
      },
    });

    const parsed = JSON.parse((result.text ?? "").trim() || "{}") as {
      summary?: string;
      decisions?: string[];
      actionItems?: string[];
      checkpoints?: { id?: string; caught?: boolean; note?: string }[];
    };
    const summary = (parsed.summary ?? "").trim();
    const checkpoints = normalizeResult(meeting, parsed.checkpoints ?? []);
    if (!summary || !checkpoints) return fallback();

    return {
      minutes: {
        summary: clip(summary, 3000),
        decisions: (parsed.decisions ?? []).map((d) => clip(String(d), 400)).slice(0, 15),
        actionItems: (parsed.actionItems ?? []).map((a) => clip(String(a), 400)).slice(0, 15),
      },
      checkpoints,
      scoreCaught: checkpoints.filter((c) => c.caught).length,
      scoreTotal: checkpoints.length,
    };
  } catch {
    return fallback();
  }
}

/* ── Site-walk Q&A grading ─────────────────────────────────────────────── */

function walkKeywordGrade(q: WalkQuestion, answer: string, expired: boolean): { credit: WalkCredit; note: string } {
  if (expired || !answer.trim()) {
    return { credit: "none", note: "The clock ran out before an answer came." };
  }
  const lower = answer.toLowerCase();
  if (q.fullKeywords.some((k) => lower.includes(k.toLowerCase()))) {
    return { credit: "full", note: "Answered on the spot with the substance the question called for." };
  }
  if (q.sourceKeywords.some((k) => lower.includes(k.toLowerCase()))) {
    return { credit: "half", note: "Didn't have the fact cold, but correctly pointed to where it lives." };
  }
  // A substantive engagement without keyword hits still shows command of the
  // moment — split the difference rather than zeroing a real attempt.
  if (answer.trim().split(/\s+/).length >= 25) {
    return { credit: "half", note: "Engaged the question substantively; couldn't verify full accuracy offline." };
  }
  return { credit: "none", note: "The answer was too vague to satisfy the asker." };
}

/**
 * Grades the trainee's site-walk answers: FULL credit for a confident,
 * substantively correct answer within the time limit; HALF credit for
 * correctly telling the asker where the information lives; none for
 * expired/vague/wrong. Never throws — degrades to the keyword heuristic.
 */
export async function gradeWalkResponses(opts: {
  meeting: TrainingMeeting;
  responses: WalkResponseInput[];
  projectName: string;
  traineeName: string;
}): Promise<GradedWalk> {
  const walk = opts.meeting.walk;
  if (!walk) return { results: [], points: 0, total: 0 };

  const byId = new Map(opts.responses.map((r) => [r.id, r]));
  const rows = walk.questions.map((q) => {
    const r = byId.get(q.id);
    return {
      question: q,
      answer: clip((r?.answer ?? "").trim(), 1500),
      elapsedMs: Math.max(0, Math.round(r?.elapsedMs ?? walk.timeLimitSeconds * 1000)),
      expired: r ? !!r.expired : true,
    };
  });

  const finish = (graded: { credit: WalkCredit; note: string }[]): GradedWalk => {
    const results: WalkResult[] = rows.map((row, i) => ({
      id: row.question.id,
      title: row.question.title,
      question: row.question.ask,
      credit: graded[i].credit,
      note: clip(graded[i].note, 400),
      answer: row.answer,
      elapsedMs: row.elapsedMs,
      expired: row.expired,
      skill: row.question.skill,
    }));
    const points = results.reduce(
      (sum, r) => sum + (r.credit === "full" ? 1 : r.credit === "half" ? 0.5 : 0),
      0,
    );
    return { results, points, total: results.length };
  };

  const fallback = () => finish(rows.map((r) => walkKeywordGrade(r.question, r.answer, r.expired)));

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return fallback();

  // Expired/empty answers need no model judgment.
  const judgeable = rows.filter((r) => !r.expired && r.answer.length > 0);
  if (judgeable.length === 0) return fallback();

  const questionBlock = judgeable
    .map(
      (r) => `QUESTION id "${r.question.id}" — asked by ${
        opts.meeting.speakers.find((s) => s.key === r.question.speakerKey)?.name ?? "the owner"
      }: ${r.question.ask}
FULL credit means: ${r.question.fullAnswer}
HALF credit means: correctly directing the asker to the source — ${r.question.sourceHint}
The PM answered (in ${Math.round(r.elapsedMs / 1000)}s): "${r.answer}"`,
    )
    .join("\n\n---\n\n");

  try {
    const ai = new GoogleGenAI({ apiKey });
    const result = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [{ role: "user", parts: [{ text: `=== SITE-WALK ANSWERS TO GRADE ===\n\n${questionBlock}\n\nGrade each answer now.` }] }],
      config: {
        systemInstruction: `You are grading ${opts.traineeName || "a trainee"}, a construction PM trainee, on questions the owner and architect asked during an OAC site walk on "${opts.projectName}". Each answer had a ${walk.timeLimitSeconds}-second clock and all answers you see came in on time. Grade each:
- "full" — a confident, substantively correct, professional answer that addresses the question directly (specifics, status, and a plan where the question calls for one). Judge plausibility and command, not trivia: a specific, professionally coherent answer counts.
- "half" — the PM doesn't have the fact but correctly tells the asker where the information lives (the right document, log, schedule, or party) and commits to following up. Also use "half" for an answer with real substance that only partly addresses the question.
- "none" — vague, wrong, or a deflection without a source ("I'll get back to you" alone).
Give a one-sentence note per answer, written as feedback to the PM. Return every question id exactly once.`,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            grades: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING, enum: judgeable.map((r) => r.question.id) },
                  credit: { type: Type.STRING, enum: ["full", "half", "none"] },
                  note: { type: Type.STRING },
                },
                required: ["id", "credit", "note"],
              },
            },
          },
          required: ["grades"],
        },
      },
    });

    const parsed = JSON.parse((result.text ?? "").trim() || "{}") as {
      grades?: { id?: string; credit?: string; note?: string }[];
    };
    const graded = rows.map((row) => {
      if (row.expired || !row.answer) {
        return { credit: "none" as WalkCredit, note: "The clock ran out before an answer came." };
      }
      const hit = (parsed.grades ?? []).find((g) => g.id === row.question.id);
      if (hit && (hit.credit === "full" || hit.credit === "half" || hit.credit === "none")) {
        return { credit: hit.credit as WalkCredit, note: (hit.note ?? "").trim() || "Graded." };
      }
      return walkKeywordGrade(row.question, row.answer, row.expired);
    });
    return finish(graded);
  } catch {
    return fallback();
  }
}
