import { NextRequest, NextResponse } from "next/server";
import { runInterviewTurn, CareerToolsNotConfigured, type InterviewTurn } from "@/lib/career-tools";
import { checkRateLimit, clientIpFrom } from "@/lib/rate-limit";

export const maxDuration = 60;

const MAX_TURNS = 40;

// Public endpoint backing the Career Center "Interview Simulator" section.
// The client sends the full transcript each turn; an empty transcript starts
// a new interview.
export async function POST(req: NextRequest) {
  // Unauthenticated + calls a paid model — throttle per client. Interviews are
  // multi-turn (7 calls per complete run), so the window is more generous.
  if (!checkRateLimit(`careers-interview:${clientIpFrom(req.headers)}`, 30, 10 * 60 * 1000)) {
    return NextResponse.json({ error: "Too many requests — give it a few minutes and try again." }, { status: 429 });
  }

  let body: { targetRole?: string; transcript?: InterviewTurn[] };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const targetRole = (body.targetRole || "").trim() || "Construction Project Manager";
  const rawTranscript = Array.isArray(body.transcript) ? body.transcript : [];
  const transcript: InterviewTurn[] = rawTranscript
    .filter((t) => t && (t.role === "interviewer" || t.role === "candidate") && typeof t.text === "string")
    .slice(-MAX_TURNS)
    .map((t) => ({ role: t.role, text: t.text }));

  try {
    const result = await runInterviewTurn({ targetRole, transcript });
    return NextResponse.json(result);
  } catch (err) {
    if (err instanceof CareerToolsNotConfigured) {
      return NextResponse.json({ error: "The interview simulator isn't available right now." }, { status: 503 });
    }
    console.error("[careers/interview] failed:", err);
    return NextResponse.json({ error: "The interviewer couldn't respond right now. Try again in a moment." }, { status: 502 });
  }
}
