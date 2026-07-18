/**
 * Diagnostic for the Career Center job aggregation (lib/jobs.ts).
 *
 * Run:  npx tsx scripts/check-jobs.ts  ["optional query"]
 *
 * Loads .env.local then .env, runs a real search against whichever providers
 * are configured (JSearch / Adzuna), and prints exactly what each returned so
 * you can tell a healthy-but-empty result apart from a provider failure
 * (bad/expired key, exhausted quota, outage) without redeploying.
 *
 * Exit code: 0 if at least one provider is configured AND returned jobs with
 * no errors; 1 otherwise (so it can gate CI/health checks).
 */

import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });
dotenv.config();

import { searchJobs } from "../lib/jobs";

async function main() {
  const query = process.argv[2] || "construction project manager";

  // Mirror lib/jobs.ts credential resolution so we can report what's set
  // WITHOUT printing the secrets themselves.
  const jsearchKey = process.env.JSEARCH_API_KEY || process.env.RAPIDAPI_KEY || "";
  const adzunaId = process.env.ADZUNA_APP_ID || "";
  const adzunaKey = process.env.ADZUNA_APP_KEY || "";

  console.log("Career Center job-search diagnostic");
  console.log("===================================");
  console.log(`Query:            "${query}"`);
  console.log("");
  console.log("Configured credentials (values hidden):");
  console.log(`  JSEARCH_API_KEY / RAPIDAPI_KEY : ${jsearchKey ? "set ✓" : "MISSING ✗"}`);
  console.log(`  ADZUNA_APP_ID                  : ${adzunaId ? "set ✓" : "MISSING ✗"}`);
  console.log(`  ADZUNA_APP_KEY                 : ${adzunaKey ? "set ✓" : "MISSING ✗"}`);
  if (adzunaKey && !adzunaId) {
    console.log("  ↳ Adzuna needs BOTH app_id and app_key — it is disabled until ADZUNA_APP_ID is set.");
  }
  console.log(`  ADZUNA_COUNTRY                 : ${process.env.ADZUNA_COUNTRY || "us (default)"}`);
  console.log("");

  const start = Date.now();
  const result = await searchJobs({ query });
  const ms = Date.now() - start;

  console.log(`Providers active this run: ${JSON.stringify(result.providers)}`);
  console.log(`Jobs returned:             ${result.jobs.length}  (in ${ms}ms)`);
  console.log("");

  if (result.errors.length > 0) {
    console.log("Provider errors:");
    for (const e of result.errors) console.log(`  ✗ ${e}`);
    console.log("");
    console.log("Common causes:");
    console.log("  401 / 403  → invalid or unsubscribed API key");
    console.log("  429        → rate limit / monthly quota exhausted (free tier)");
    console.log("  timeout    → provider outage or network block");
    console.log("");
  }

  if (result.jobs.length > 0) {
    console.log("Sample of what users would see:");
    for (const job of result.jobs.slice(0, 5)) {
      console.log(`  • ${job.title} — ${job.company} (${job.location}) via ${job.source}`);
    }
    console.log("");
  }

  const healthy =
    (result.providers.jsearch || result.providers.adzuna) &&
    result.jobs.length > 0 &&
    result.errors.length === 0;

  if (healthy) {
    console.log("RESULT: healthy ✓  — at least one provider returned jobs with no errors.");
    process.exit(0);
  }
  if (!result.providers.jsearch && !result.providers.adzuna) {
    console.log("RESULT: not configured ✗  — no provider keys are set. The page falls back to direct search links.");
  } else if (result.errors.length > 0) {
    console.log("RESULT: provider failure ✗  — a configured provider errored (see above). This is the likely cause of an empty Career Center.");
  } else {
    console.log("RESULT: genuinely empty  — providers responded fine but matched no jobs for this query. Try a broader query.");
  }
  process.exit(1);
}

main().catch((err) => {
  console.error("Diagnostic crashed:", err);
  process.exit(1);
});
