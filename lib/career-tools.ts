/**
 * AI helpers backing the Career Center's construction-focused job-seeker tools:
 * a resume builder, a mock-interview simulator, and salary benchmarks. All
 * three are grounded in construction-management context (RFIs, submittals,
 * buyout, change events, superintendents, budgets, contract types) so the
 * output speaks the trade rather than generic office-work boilerplate.
 *
 * Every generator uses Gemini `gemini-2.5-flash` with structured output and
 * degrades gracefully: with no GEMINI_API_KEY (or on any API failure) the
 * caller receives a clear "unavailable" signal instead of an exception.
 */

import { GoogleGenAI, Type } from "@google/genai";

const MODEL = "gemini-2.5-flash";

/** Thrown when GEMINI_API_KEY is not configured — routes map this to a 503. */
export class CareerToolsNotConfigured extends Error {
  constructor() {
    super("AI career tools are not configured (missing GEMINI_API_KEY).");
    this.name = "CareerToolsNotConfigured";
  }
}

function client(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new CareerToolsNotConfigured();
  return new GoogleGenAI({ apiKey });
}

function clip(text: string, max: number): string {
  const t = (text ?? "").trim();
  return t.length > max ? t.slice(0, max) + "…" : t;
}

// ---------------------------------------------------------------------------
// Resume Builder
// ---------------------------------------------------------------------------

export type ResumeInput = {
  name?: string;
  targetRole: string;
  yearsExperience?: string;
  currentTitle?: string;
  location?: string;
  /** Freeform brain-dump: projects, responsibilities, wins, tools. */
  highlights?: string;
  /** Comma/line separated skills, software, certifications. */
  skills?: string;
};

export type ResumeResult = {
  /** A complete, formatted resume in Markdown, ready to copy or download. */
  markdown: string;
  /** A 2-3 sentence professional summary (also embedded in the markdown). */
  summary: string;
  /** Actionable tips to strengthen the resume further. */
  suggestions: string[];
};

export async function buildConstructionResume(input: ResumeInput): Promise<ResumeResult> {
  const ai = client();

  const systemInstruction = `You are an expert resume writer who specializes in commercial construction careers (general contractors, project management, field operations, estimating, and construction accounting).

Write resumes that hiring managers and GC recruiters respond to:
- Use construction-specific language and metrics: contract value managed, square footage, project delivery method (design-build, CM at risk, GMP, lump sum), RFIs/submittals processed, change order value, schedule/budget performance, self-perform scope, safety record (EMR, recordables), crew size supervised.
- Lead each experience bullet with a strong action verb and quantify impact wherever the candidate's input allows. Never invent specific numbers the candidate didn't provide — when a metric is unknown, write a strong qualitative bullet instead of a fabricated figure.
- Reflect real construction tooling when relevant (Procore, Bluebeam, MS Project / P6, AIA billing, Sage/QuickBooks, BIM/Navisworks).
- Keep it truthful and grounded strictly in what the candidate provided; do not fabricate employers, dates, or credentials.

Output a single ATS-friendly resume in clean Markdown with these sections in order: a name heading, a Professional Summary, Core Competencies (a compact skills list), Professional Experience (reverse-chronological where dates exist, each role with bullet points), and Education & Certifications. Omit any section for which there is genuinely no input.`;

  const userPrompt = `Build a construction-tailored resume from this candidate input.

Name: ${clip(input.name || "", 120) || "(not provided — use a neutral \"Name\" placeholder heading)"}
Target role: ${clip(input.targetRole, 160)}
Years of experience: ${clip(input.yearsExperience || "", 40) || "(not provided)"}
Current / most recent title: ${clip(input.currentTitle || "", 160) || "(not provided)"}
Location: ${clip(input.location || "", 120) || "(not provided)"}

Experience, projects, and accomplishments (freeform):
${clip(input.highlights || "", 6000) || "(none provided — write a strong entry-level resume aimed at the target role and note in the suggestions what the candidate should add)"}

Skills, software, and certifications:
${clip(input.skills || "", 2000) || "(none provided)"}

Return the full resume as Markdown, a standalone professional summary, and a few concrete suggestions for strengthening it.`;

  const result = await ai.models.generateContent({
    model: MODEL,
    contents: [{ role: "user", parts: [{ text: userPrompt }] }],
    config: {
      systemInstruction,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          markdown: { type: Type.STRING, description: "The complete resume in Markdown." },
          summary: { type: Type.STRING, description: "A 2-3 sentence professional summary." },
          suggestions: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "3-6 concrete ways to strengthen the resume.",
          },
        },
        required: ["markdown", "summary", "suggestions"],
      },
    },
  });

  const parsed = JSON.parse((result.text ?? "").trim() || "{}") as Partial<ResumeResult>;
  return {
    markdown: (parsed.markdown ?? "").trim(),
    summary: (parsed.summary ?? "").trim(),
    suggestions: Array.isArray(parsed.suggestions) ? parsed.suggestions.filter(Boolean).slice(0, 6) : [],
  };
}

// ---------------------------------------------------------------------------
// Interview Simulator
// ---------------------------------------------------------------------------

export type InterviewTurn = { role: "interviewer" | "candidate"; text: string };

export type InterviewResult = {
  /** The interviewer's message: feedback on the last answer (if any) + the next question, or the final wrap-up. */
  message: string;
  /** True once the interview is complete and `message` is a final assessment. */
  done: boolean;
  /** 1-based index of the question just asked (0 on the closing turn). */
  questionNumber: number;
};

const INTERVIEW_TOTAL_QUESTIONS = 5;

export async function runInterviewTurn(opts: {
  targetRole: string;
  /** Full conversation so far, oldest first. Empty to start the interview. */
  transcript: InterviewTurn[];
}): Promise<InterviewResult> {
  const ai = client();
  const role = clip(opts.targetRole, 160) || "Construction Project Manager";

  const answersGiven = opts.transcript.filter((t) => t.role === "candidate").length;
  const questionsAsked = opts.transcript.filter((t) => t.role === "interviewer").length;
  const isFirst = opts.transcript.length === 0;
  const shouldClose = answersGiven >= INTERVIEW_TOTAL_QUESTIONS;

  const systemInstruction = `You are a seasoned hiring manager at a commercial general contractor conducting a realistic mock job interview for a "${role}" position. Your goal is to help the candidate practice and improve.

Interview design:
- Ask ONE question at a time. Ask a total of ${INTERVIEW_TOTAL_QUESTIONS} questions across the interview, mixing behavioral ("tell me about a time…"), situational (RFIs, submittals, schedule slips, subcontractor conflicts, change orders, safety incidents, owner/architect communication), and role/technical questions appropriate to a "${role}".
- On every turn AFTER the first question, begin with brief, specific, encouraging coaching feedback on the candidate's previous answer (1-3 sentences: what was strong, and one concrete way to sharpen it — reference the STAR method or construction specifics where useful). THEN ask the next question.
- Ground everything in real commercial-construction practice. Be professional, warm, and concise.
- When the interview is complete, do NOT ask another question. Instead give a short overall assessment: 2-3 strengths, 2-3 areas to improve, and one closing tip.

Return the message you would say next, whether the interview is now done, and the number of the question you just asked (use 0 for the closing assessment).`;

  const transcriptText = opts.transcript
    .map((t) => `${t.role === "interviewer" ? "Interviewer" : "Candidate"}: ${clip(t.text, 2000)}`)
    .join("\n\n");

  const instruction = isFirst
    ? `Start the interview. Give a one-sentence welcome, then ask your first question (this is question 1 of ${INTERVIEW_TOTAL_QUESTIONS}).`
    : shouldClose
      ? `The candidate has now answered ${answersGiven} questions. Give feedback on their last answer, then close the interview with your overall assessment. Set done=true and questionNumber=0.`
      : `Give feedback on the candidate's last answer, then ask question ${questionsAsked + 1} of ${INTERVIEW_TOTAL_QUESTIONS}.`;

  const userPrompt = `Role being interviewed for: ${role}

=== INTERVIEW SO FAR ===
${transcriptText || "(the interview has not started yet)"}

${instruction}`;

  const result = await ai.models.generateContent({
    model: MODEL,
    contents: [{ role: "user", parts: [{ text: userPrompt }] }],
    config: {
      systemInstruction,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          message: { type: Type.STRING, description: "What the interviewer says next." },
          done: { type: Type.BOOLEAN, description: "True when the interview is finished." },
          questionNumber: { type: Type.INTEGER, description: "1-based number of the question just asked, or 0 on the closing turn." },
        },
        required: ["message", "done", "questionNumber"],
      },
    },
  });

  const parsed = JSON.parse((result.text ?? "").trim() || "{}") as Partial<InterviewResult>;
  const message = (parsed.message ?? "").trim();
  if (!message) throw new Error("Empty interview response");
  return {
    message,
    done: Boolean(parsed.done) || shouldClose,
    questionNumber: typeof parsed.questionNumber === "number" ? parsed.questionNumber : questionsAsked + 1,
  };
}

// ---------------------------------------------------------------------------
// Salary Benchmarks
// ---------------------------------------------------------------------------

export type SalaryInput = {
  role: string;
  location?: string;
  yearsExperience?: string;
};

export type SalaryResult = {
  role: string;
  location: string;
  currency: string;
  /** Annual base salary estimates in whole dollars. */
  low: number;
  median: number;
  high: number;
  /** Typical total-comp note (bonus, truck/vehicle allowance, per diem, etc.). */
  totalCompNote: string;
  /** 1-2 sentence narrative about the market for this role. */
  summary: string;
  /** Factors that move a candidate up or down the range. */
  factors: string[];
};

export async function estimateConstructionSalary(input: SalaryInput): Promise<SalaryResult> {
  const ai = client();
  const role = clip(input.role, 160) || "Construction Project Manager";
  const location = clip(input.location || "", 120) || "United States (national average)";

  const systemInstruction = `You are a compensation analyst specializing in the U.S. commercial construction industry (general contractors, subcontractors, and construction managers). You provide realistic annual base-salary benchmarks for construction roles.

Guidance:
- Base your ranges on typical current U.S. market compensation for commercial construction roles, adjusted for the given location's cost of labor and the candidate's experience level.
- Provide a low (roughly 25th percentile), median (50th), and high (roughly 90th percentile) annual BASE salary in whole US dollars. Keep low < median < high and keep them realistic (do not exaggerate).
- Note typical additional compensation for the role (annual/project bonus, vehicle or truck allowance, per diem for travel, phone, profit sharing) separately from base.
- Call out the main factors that move pay within the range (project size/contract value, delivery method, self-perform vs. management-only, certifications like PMP/OSHA/LEED, union vs. open shop, market/region).
- These are estimates for orientation, not a guarantee. Be honest and grounded.`;

  const userPrompt = `Estimate compensation for this construction role.

Role / title: ${role}
Location / market: ${location}
Years of experience: ${clip(input.yearsExperience || "", 40) || "(not specified — assume a typical mid-level candidate)"}

Return low/median/high annual base salary (whole US dollars), a total-compensation note, a short market summary, and the factors that move pay within the range.`;

  const result = await ai.models.generateContent({
    model: MODEL,
    contents: [{ role: "user", parts: [{ text: userPrompt }] }],
    config: {
      systemInstruction,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          low: { type: Type.INTEGER },
          median: { type: Type.INTEGER },
          high: { type: Type.INTEGER },
          currency: { type: Type.STRING },
          totalCompNote: { type: Type.STRING },
          summary: { type: Type.STRING },
          factors: { type: Type.ARRAY, items: { type: Type.STRING } },
        },
        required: ["low", "median", "high", "currency", "totalCompNote", "summary", "factors"],
      },
    },
  });

  const parsed = JSON.parse((result.text ?? "").trim() || "{}") as Partial<SalaryResult>;
  let low = Math.max(0, Math.round(Number(parsed.low) || 0));
  let median = Math.max(0, Math.round(Number(parsed.median) || 0));
  let high = Math.max(0, Math.round(Number(parsed.high) || 0));
  // Keep the ordering sane even if the model returns them out of order.
  [low, median, high] = [low, median, high].sort((a, b) => a - b);

  return {
    role,
    location,
    currency: (parsed.currency ?? "USD").trim() || "USD",
    low,
    median,
    high,
    totalCompNote: (parsed.totalCompNote ?? "").trim(),
    summary: (parsed.summary ?? "").trim(),
    factors: Array.isArray(parsed.factors) ? parsed.factors.filter(Boolean).slice(0, 8) : [],
  };
}
