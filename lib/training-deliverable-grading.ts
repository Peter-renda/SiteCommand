/**
 * Grading + simulated-email content for training deliverable submissions.
 *
 * The deliverable workspace uploads the trainee's completed workbook; this
 * module extracts its text (SheetJS), grades it against the deliverable's
 * criteria (Gemini structured output — same pattern as meeting minutes and
 * scenario judging), and builds the outbound email + the recipient's
 * grade-aware acknowledgment reply written into the sandbox inbox. Without
 * GEMINI_API_KEY (or on any failure) a keyword heuristic grades instead, so
 * the flow always completes.
 */

import { GoogleGenAI, Type } from "@google/genai";
import * as XLSX from "xlsx";
import type { TrainingDeliverable, ResolvedRecipient } from "@/lib/training-deliverables";
import { letterForScore } from "@/lib/training-deliverables";

export type CriterionResult = {
  id: string;
  title: string;
  met: boolean;
  /** One sentence on how the submission met (or missed) the criterion. */
  note: string;
};

export type DeliverableGrade = {
  score: number;
  letter: string;
  summary: string;
  strengths: string[];
  gaps: string[];
  criteria: CriterionResult[];
  /** True when the keyword fallback graded (no Gemini). */
  degraded: boolean;
};

const MAX_EXTRACT_CHARS = 14_000;

function clip(text: string, max: number): string {
  const t = String(text ?? "").trim();
  return t.length > max ? t.slice(0, max) + "…" : t;
}

/* ── workbook text extraction ────────────────────────────────────────────── */

/**
 * Extract the submitted workbook's content as CSV-ish text. Template
 * boilerplate rows (title, how-to line, instruction bullets, the example-row
 * marker, and the untouched sample row) are stripped so grading sees the
 * trainee's own entries plus the header row. Throws with a user-facing
 * message when the file can't be parsed.
 */
export function extractWorkbookText(
  buffer: Buffer,
  filename: string,
  deliverable: TrainingDeliverable,
): { text: string; dataRowCount: number } {
  const lower = filename.toLowerCase();
  let raw: string;

  if (lower.endsWith(".csv") || lower.endsWith(".txt")) {
    raw = buffer.toString("utf-8");
  } else if (lower.endsWith(".xlsx") || lower.endsWith(".xls") || lower.endsWith(".xlsm")) {
    let wb: XLSX.WorkBook;
    try {
      wb = XLSX.read(buffer, { type: "buffer" });
    } catch {
      throw new Error("That file couldn't be read as a spreadsheet. Re-save it as .xlsx and try again.");
    }
    raw = wb.SheetNames.map((name) => XLSX.utils.sheet_to_csv(wb.Sheets[name])).join("\n");
  } else {
    throw new Error("Upload the completed Excel template (.xlsx) or a .csv export of it.");
  }

  const sampleSignature = deliverable.sampleRow.map((v) => String(v).trim().toLowerCase()).filter(Boolean);
  const headerLine = deliverable.columns.join(",").toLowerCase();

  const kept: string[] = [];
  let sawHeader = false;
  let dataRowCount = 0;

  for (const line of raw.split(/\r?\n/)) {
    const bare = line.replace(/,+$/g, "").trim();
    if (!bare) continue;
    const lowerLine = bare.toLowerCase();
    // sheet_to_csv quotes cells containing commas — compare without the quotes.
    const unquoted = lowerLine.replace(/^"+|"+$/g, "");

    // Template boilerplate.
    if (unquoted.startsWith("sitecommand training template")) continue;
    if (bare.replace(/^"+|"+$/g, "") === deliverable.title) continue;
    if (unquoted === "instructions:") continue;
    if (unquoted.startsWith("• ")) continue;
    if (lowerLine.includes("example row — replace")) continue;
    // The untouched sample row (all its cell values still present).
    if (
      sampleSignature.length > 0 &&
      sampleSignature.every((cell) => lowerLine.includes(cell))
    ) {
      continue;
    }

    const isHeader = lowerLine.replace(/"/g, "").startsWith(headerLine.split(",")[0].toLowerCase()) &&
      deliverable.columns.slice(0, 3).every((c) => lowerLine.includes(c.toLowerCase()));
    if (isHeader && !sawHeader) {
      sawHeader = true;
      kept.push(line.trim());
      continue;
    }
    kept.push(line.trim());
    dataRowCount += 1;
  }

  return { text: clip(kept.join("\n"), MAX_EXTRACT_CHARS), dataRowCount };
}

/* ── grading ─────────────────────────────────────────────────────────────── */

/** Degraded-mode heuristic used when Gemini is unavailable. */
function keywordGrade(
  deliverable: TrainingDeliverable,
  text: string,
  dataRowCount: number,
): DeliverableGrade {
  const lower = text.toLowerCase();
  const criteria: CriterionResult[] = deliverable.criteria.map((c) => {
    const met =
      c.keywords.length === 0
        ? dataRowCount >= 6
        : c.keywords.some((k) => lower.includes(k.toLowerCase()));
    return {
      id: c.id,
      title: c.title,
      met,
      note: met
        ? "The submission shows evidence of this."
        : "No clear evidence of this was found in the workbook.",
    };
  });
  const metCount = criteria.filter((c) => c.met).length;
  const ratio = deliverable.criteria.length > 0 ? metCount / deliverable.criteria.length : 0;
  const score = dataRowCount === 0 ? 25 : Math.round(40 + 60 * ratio);
  return {
    score,
    letter: letterForScore(score),
    summary:
      dataRowCount === 0
        ? "The workbook came back essentially empty — fill the template out and resubmit."
        : `Auto-graded ${metCount}/${criteria.length} criteria met across ${dataRowCount} entries.`,
    strengths: criteria.filter((c) => c.met).map((c) => c.title),
    gaps: criteria.filter((c) => !c.met).map((c) => c.title),
    criteria,
    degraded: true,
  };
}

export async function gradeDeliverableSubmission(opts: {
  deliverable: TrainingDeliverable;
  extractedText: string;
  dataRowCount: number;
  projectLabel: string;
  projectType?: string | null;
  traineeName: string;
}): Promise<DeliverableGrade> {
  const { deliverable } = opts;
  const fallback = () => keywordGrade(deliverable, opts.extractedText, opts.dataRowCount);

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || opts.dataRowCount === 0) return fallback();

  const criteriaBlock = deliverable.criteria
    .map((c) => `- id "${c.id}": ${c.title}. Met means: ${c.detail}`)
    .join("\n");
  const facts = deliverable.facts?.(opts.projectType) ?? "";

  const systemInstruction = `You are a construction operations executive grading a project manager trainee's "${deliverable.title}" deliverable on the "${opts.projectLabel}" training project. The trainee filled out an Excel template with these columns: ${deliverable.columns.join(" | ")}.

Grade strictly from the submitted content below. Judge substance: specific, realistic, internally consistent construction entries score well; vague filler, copied instructions, or a handful of throwaway rows score poorly. The template shipped with one example row — if remnants of it appear, ignore them.

CRITERIA (score each):
${criteriaBlock}

${facts ? `REFERENCE FACTS about this project (use to judge accuracy):\n${facts}\n\n` : ""}Also produce:
- score: an overall 0-100 grade (90+ = award-ready professional work; 70s = serviceable with gaps; below 60 = would not survive review).
- summary: 2-3 sentences a mentor would say about this submission.
- strengths / gaps: short bullet phrases.
Return every criterion id exactly once.`;

  const userPrompt = `=== SUBMITTED WORKBOOK (${opts.dataRowCount} entries, by ${opts.traineeName || "the trainee"}) ===\n${opts.extractedText}\n\nGrade it now.`;

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
            score: { type: Type.INTEGER, description: "Overall grade 0-100." },
            summary: { type: Type.STRING },
            strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
            gaps: { type: Type.ARRAY, items: { type: Type.STRING } },
            criteria: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: {
                    type: Type.STRING,
                    ...(deliverable.criteria.length > 0
                      ? { enum: deliverable.criteria.map((c) => c.id) }
                      : {}),
                  },
                  met: { type: Type.BOOLEAN },
                  note: { type: Type.STRING },
                },
                required: ["id", "met", "note"],
              },
            },
          },
          required: ["score", "summary", "strengths", "gaps", "criteria"],
        },
      },
    });

    const parsed = JSON.parse((result.text ?? "").trim() || "{}") as {
      score?: number;
      summary?: string;
      strengths?: string[];
      gaps?: string[];
      criteria?: { id?: string; met?: boolean; note?: string }[];
    };

    // Every criterion exactly once, in definition order; strays dropped.
    const byId = new Map((parsed.criteria ?? []).map((c) => [c.id, c]));
    const criteria: CriterionResult[] = deliverable.criteria.map((c) => {
      const r = byId.get(c.id);
      return {
        id: c.id,
        title: c.title,
        met: !!r?.met,
        note: clip(r?.note || (r?.met ? "Met." : "Not evidenced."), 300),
      };
    });

    const rawScore = Number(parsed.score);
    if (!Number.isFinite(rawScore) || !parsed.summary) return fallback();
    const score = Math.max(0, Math.min(100, Math.round(rawScore)));

    return {
      score,
      letter: letterForScore(score),
      summary: clip(parsed.summary, 900),
      strengths: (parsed.strengths ?? []).map((s) => clip(String(s), 160)).slice(0, 6),
      gaps: (parsed.gaps ?? []).map((g) => clip(String(g), 160)).slice(0, 6),
      criteria,
      degraded: false,
    };
  } catch {
    return fallback();
  }
}

/* ── simulated email bodies ──────────────────────────────────────────────── */

function esc(text: string): string {
  return String(text ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/** The trainee's outbound email carrying the completed workbook. */
export function buildDeliverableEmailHtml(opts: {
  deliverable: TrainingDeliverable;
  recipients: ResolvedRecipient[];
  pmFirst: string;
  projectLabel: string;
  note: string;
  fileName: string;
  fileUrl: string;
}): string {
  const { deliverable, recipients } = opts;
  const greeting =
    recipients.length === 1
      ? `Hi ${esc(recipients[0].name.split(" ")[0])},`
      : `Hi ${recipients.map((r) => esc(r.name.split(" ")[0])).join(", ")},`;
  const noteBlock = opts.note.trim()
    ? `<p>${esc(opts.note.trim()).replace(/\n/g, "<br/>")}</p>`
    : "";
  return `
<p>${greeting}</p>

<p>Please find attached my completed <strong>${esc(deliverable.title)}</strong> for the ${esc(opts.projectLabel)} project.</p>
${noteBlock}
<p>📎 <a href="${opts.fileUrl}" target="_blank" rel="noopener noreferrer">${esc(opts.fileName)}</a></p>

<p>Let me know if you have any questions or need anything revised.</p>

<p>Thanks,<br/>${esc(opts.pmFirst)}</p>
`.trim();
}

/**
 * The lead recipient's acknowledgment reply, toned by the grade — a strong
 * submission gets a clean thank-you, a weak one gets pushback naming the top
 * gap. No extra model call: the grade result drives the wording.
 */
export function buildRecipientAckHtml(opts: {
  deliverable: TrainingDeliverable;
  recipient: ResolvedRecipient;
  grade: DeliverableGrade;
  pmFirst: string;
}): string {
  const { recipient, grade, deliverable } = opts;
  const topGap = grade.gaps[0] ?? "";
  const topStrength = grade.strengths[0] ?? "";

  let body: string;
  if (grade.score >= 85) {
    body = `<p>Thanks ${esc(opts.pmFirst)} — received the ${esc(deliverable.title.toLowerCase())}. This is thorough work${topStrength ? ` — ${esc(topStrength.toLowerCase())} in particular` : ""}. We'll review on our end and come back if anything needs a second pass.</p>`;
  } else if (grade.score >= 60) {
    body = `<p>Thanks ${esc(opts.pmFirst)} — got the ${esc(deliverable.title.toLowerCase())} and took a first pass. Overall workable, but ${topGap ? `one thing to tighten up: ${esc(topGap.toLowerCase())}.` : "a few areas could use more detail."} Can you take another look and resend when updated?</p>`;
  } else {
    body = `<p>${esc(opts.pmFirst)} — I looked through the ${esc(deliverable.title.toLowerCase())} and, candidly, it's not where it needs to be yet${topGap ? ` — ${esc(topGap.toLowerCase())}` : ""}. Let's get a more complete pass before we move forward; happy to jump on a call if it helps.</p>`;
  }

  return `
${body}

<p>Best,<br/>${esc(recipient.name)}<br/>${esc(recipient.title)}${recipient.internal ? "" : `<br/>${esc(recipient.company)}`}</p>
`.trim();
}
