import { NextRequest, NextResponse } from "next/server";
import { estimateConstructionSalary, CareerToolsNotConfigured, type SalaryInput } from "@/lib/career-tools";
import { checkRateLimit, clientIpFrom } from "@/lib/rate-limit";

export const maxDuration = 45;

// Public endpoint backing the Career Center "Salary Benchmarks" section.
export async function POST(req: NextRequest) {
  // Unauthenticated + calls a paid model — throttle per client.
  if (!checkRateLimit(`careers-salary:${clientIpFrom(req.headers)}`, 15, 10 * 60 * 1000)) {
    return NextResponse.json({ error: "Too many requests — give it a few minutes and try again." }, { status: 429 });
  }

  let body: Partial<SalaryInput>;
  try {
    body = (await req.json()) as Partial<SalaryInput>;
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const role = (body.role || "").trim();
  if (!role) {
    return NextResponse.json({ error: "A role is required." }, { status: 400 });
  }

  try {
    const result = await estimateConstructionSalary({
      role,
      location: body.location,
      yearsExperience: body.yearsExperience,
    });
    return NextResponse.json(result);
  } catch (err) {
    if (err instanceof CareerToolsNotConfigured) {
      return NextResponse.json({ error: "Salary benchmarks aren't available right now." }, { status: 503 });
    }
    console.error("[careers/salary] failed:", err);
    return NextResponse.json({ error: "Couldn't estimate salary right now. Try again in a moment." }, { status: 502 });
  }
}
