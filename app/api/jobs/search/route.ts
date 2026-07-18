import { NextRequest, NextResponse } from "next/server";
import { searchJobs } from "@/lib/jobs";

export const maxDuration = 30;

// Public endpoint backing the marketing-site Career Center page.
// Results are cached server-side (see lib/jobs.ts) to protect provider quotas.
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  const query = (searchParams.get("q") || "construction project manager").slice(0, 80);
  const location = (searchParams.get("location") || "").slice(0, 80);
  const remoteOnly = searchParams.get("remote") === "1";

  try {
    const result = await searchJobs({ query, location: location || undefined, remoteOnly });
    // Diagnostics: provider failures are captured (not thrown) so the request
    // still succeeds, but they must be visible somewhere. Log them to the
    // function logs so JSearch vs. Adzuna outages can be told apart at a glance.
    if (result.errors.length > 0) {
      console.warn(
        `[jobs/search] q="${query}" loc="${location}" providers=${JSON.stringify(result.providers)} jobs=${result.jobs.length} errors: ${result.errors.join(" | ")}`
      );
    }
    return NextResponse.json({
      jobs: result.jobs,
      providers: result.providers,
      configured: result.providers.jsearch || result.providers.adzuna,
      errors: result.errors,
    });
  } catch (err) {
    console.error("[jobs/search] request failed:", err);
    return NextResponse.json({ error: "Job search failed" }, { status: 502 });
  }
}
