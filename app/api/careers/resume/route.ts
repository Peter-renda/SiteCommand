import { NextRequest, NextResponse } from "next/server";
import { buildConstructionResume, CareerToolsNotConfigured, type ResumeInput } from "@/lib/career-tools";
import { checkRateLimit, clientIpFrom } from "@/lib/rate-limit";

export const maxDuration = 60;

// Public endpoint backing the Career Center "Resume Builder" section.
export async function POST(req: NextRequest) {
  // Unauthenticated + calls a paid model — throttle per client.
  if (!checkRateLimit(`careers-resume:${clientIpFrom(req.headers)}`, 10, 10 * 60 * 1000)) {
    return NextResponse.json({ error: "Too many requests — give it a few minutes and try again." }, { status: 429 });
  }

  let body: Partial<ResumeInput>;
  try {
    body = (await req.json()) as Partial<ResumeInput>;
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const targetRole = (body.targetRole || "").trim();
  if (!targetRole) {
    return NextResponse.json({ error: "A target role is required." }, { status: 400 });
  }

  try {
    const result = await buildConstructionResume({
      name: body.name,
      targetRole,
      yearsExperience: body.yearsExperience,
      currentTitle: body.currentTitle,
      location: body.location,
      highlights: body.highlights,
      skills: body.skills,
    });
    if (!result.markdown) {
      return NextResponse.json({ error: "Couldn't generate a resume. Try adding more detail." }, { status: 502 });
    }
    return NextResponse.json(result);
  } catch (err) {
    if (err instanceof CareerToolsNotConfigured) {
      return NextResponse.json({ error: "The resume builder isn't available right now." }, { status: 503 });
    }
    console.error("[careers/resume] failed:", err);
    return NextResponse.json({ error: "Couldn't generate a resume right now. Try again in a moment." }, { status: 502 });
  }
}
