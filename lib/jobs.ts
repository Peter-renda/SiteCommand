// Construction-management job aggregation for the Career Center page.
//
// LinkedIn has no public jobs API (and scraping it violates their ToS), so
// LinkedIn-published postings are surfaced through JSearch (RapidAPI), which
// indexes Google for Jobs — postings published to LinkedIn, Indeed, Glassdoor,
// ZipRecruiter, etc. come back with publisher attribution (`job_publisher`).
// Adzuna is used as a second, independent source. Both are optional: with no
// keys configured the API reports `providers` as unconfigured and the page
// falls back to direct search deep-links.
//
// Env keys (server-side only):
//   JSEARCH_API_KEY (or RAPIDAPI_KEY)  — RapidAPI key subscribed to JSearch
//   ADZUNA_APP_ID + ADZUNA_APP_KEY     — Adzuna app credentials
//   ADZUNA_COUNTRY                     — optional, defaults to "us"
//   JOOBLE_API_KEY                     — Jooble API key (jooble.org/api-plan)

export type JobListing = {
  id: string;
  title: string;
  company: string;
  location: string;
  remote: boolean;
  salary: string | null;
  postedAt: string | null; // ISO timestamp when known
  source: string; // publisher, e.g. "LinkedIn", "Indeed", "Adzuna"
  applyUrl: string;
  snippet: string | null;
};

export type JobSearchParams = {
  query: string;
  location?: string;
  remoteOnly?: boolean;
};

export type JobSearchResult = {
  jobs: JobListing[];
  providers: { jsearch: boolean; adzuna: boolean; jooble: boolean };
  errors: string[];
};

/* ── helpers ─────────────────────────────────────────────────────────── */

function cleanSnippet(text: unknown, max = 240): string | null {
  if (typeof text !== "string" || !text.trim()) return null;
  const collapsed = text
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (!collapsed) return null;
  return collapsed.length > max ? `${collapsed.slice(0, max - 1).trimEnd()}…` : collapsed;
}

function formatMoney(n: number): string {
  if (n >= 1000) return `$${Math.round(n / 1000)}k`;
  return `$${Math.round(n)}`;
}

function formatSalaryRange(min: number | null, max: number | null, period: string): string | null {
  const suffix = period ? ` / ${period}` : "";
  if (min && max) {
    if (Math.round(min) === Math.round(max)) return `${formatMoney(min)}${suffix}`;
    return `${formatMoney(min)} – ${formatMoney(max)}${suffix}`;
  }
  if (min) return `from ${formatMoney(min)}${suffix}`;
  if (max) return `up to ${formatMoney(max)}${suffix}`;
  return null;
}

function asNumber(v: unknown): number | null {
  return typeof v === "number" && Number.isFinite(v) && v > 0 ? v : null;
}

function asString(v: unknown): string {
  return typeof v === "string" ? v.trim() : "";
}

/* ── JSearch (RapidAPI / Google for Jobs: LinkedIn, Indeed, …) ──────── */

function getJSearchKey(): string | null {
  return process.env.JSEARCH_API_KEY || process.env.RAPIDAPI_KEY || null;
}

async function fetchJSearchJobs(params: JobSearchParams, key: string): Promise<JobListing[]> {
  const query = params.location ? `${params.query} in ${params.location}` : params.query;
  const url = new URL("https://jsearch.p.rapidapi.com/search");
  url.searchParams.set("query", query);
  url.searchParams.set("page", "1");
  url.searchParams.set("num_pages", "1");
  url.searchParams.set("date_posted", "month");
  if (params.remoteOnly) url.searchParams.set("remote_jobs_only", "true");

  const res = await fetch(url.toString(), {
    headers: {
      "X-RapidAPI-Key": key,
      "X-RapidAPI-Host": "jsearch.p.rapidapi.com",
    },
  });
  if (!res.ok) throw new Error(`JSearch responded ${res.status}`);

  const body = (await res.json()) as { data?: unknown };
  const rows = Array.isArray(body.data) ? body.data : [];

  const jobs: JobListing[] = [];
  for (const raw of rows) {
    const row = raw as Record<string, unknown>;
    const title = asString(row.job_title);
    const applyUrl = asString(row.job_apply_link);
    if (!title || !applyUrl) continue;

    const city = asString(row.job_city);
    const state = asString(row.job_state);
    const country = asString(row.job_country);
    const location =
      [city, state].filter(Boolean).join(", ") ||
      country ||
      (row.job_is_remote === true ? "Remote" : "");

    const periodRaw = asString(row.job_salary_period).toUpperCase();
    const period =
      periodRaw === "YEAR" ? "yr" : periodRaw === "MONTH" ? "mo" : periodRaw === "HOUR" ? "hr" : "";

    jobs.push({
      id: `jsearch-${asString(row.job_id) || `${title}-${jobs.length}`}`,
      title,
      company: asString(row.employer_name) || "Unknown company",
      location: location || "Not specified",
      remote: row.job_is_remote === true,
      salary: formatSalaryRange(asNumber(row.job_min_salary), asNumber(row.job_max_salary), period),
      postedAt: asString(row.job_posted_at_datetime_utc) || null,
      source: asString(row.job_publisher) || "JSearch",
      applyUrl,
      snippet: cleanSnippet(row.job_description),
    });
  }
  return jobs;
}

/* ── Adzuna ──────────────────────────────────────────────────────────── */

function getAdzunaCreds(): { appId: string; appKey: string } | null {
  const appId = process.env.ADZUNA_APP_ID;
  const appKey = process.env.ADZUNA_APP_KEY;
  return appId && appKey ? { appId, appKey } : null;
}

async function fetchAdzunaJobs(
  params: JobSearchParams,
  creds: { appId: string; appKey: string }
): Promise<JobListing[]> {
  const country = (process.env.ADZUNA_COUNTRY || "us").toLowerCase();
  const what = params.remoteOnly ? `${params.query} remote` : params.query;
  const url = new URL(`https://api.adzuna.com/v1/api/jobs/${country}/search/1`);
  url.searchParams.set("app_id", creds.appId);
  url.searchParams.set("app_key", creds.appKey);
  url.searchParams.set("what", what);
  if (params.location) url.searchParams.set("where", params.location);
  url.searchParams.set("results_per_page", "20");
  url.searchParams.set("content-type", "application/json");

  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`Adzuna responded ${res.status}`);

  const body = (await res.json()) as { results?: unknown };
  const rows = Array.isArray(body.results) ? body.results : [];

  const jobs: JobListing[] = [];
  for (const raw of rows) {
    const row = raw as Record<string, unknown>;
    const title = asString(row.title).replace(/<\/?[^>]+>/g, "");
    const applyUrl = asString(row.redirect_url);
    if (!title || !applyUrl) continue;

    const company = (row.company as Record<string, unknown> | undefined)?.display_name;
    const location = (row.location as Record<string, unknown> | undefined)?.display_name;
    const snippet = cleanSnippet(row.description);
    const remote = /\bremote\b/i.test(`${title} ${snippet ?? ""}`);
    if (params.remoteOnly && !remote) continue;

    jobs.push({
      id: `adzuna-${asString(row.id) || `${title}-${jobs.length}`}`,
      title,
      company: asString(company) || "Unknown company",
      location: asString(location) || "Not specified",
      remote,
      salary: formatSalaryRange(asNumber(row.salary_min), asNumber(row.salary_max), "yr"),
      postedAt: asString(row.created) || null,
      source: "Adzuna",
      applyUrl,
      snippet,
    });
  }
  return jobs;
}

/* ── Jooble ──────────────────────────────────────────────────────────── */

function getJoobleKey(): string | null {
  return process.env.JOOBLE_API_KEY || null;
}

async function fetchJoobleJobs(params: JobSearchParams, key: string): Promise<JobListing[]> {
  // Jooble: POST https://jooble.org/api/{key} with a JSON body. The key lives
  // in the URL path, not a header.
  const keywords = params.remoteOnly ? `${params.query} remote` : params.query;
  const body: Record<string, unknown> = { keywords, page: 1, ResultOnPage: 20 };
  if (params.location) body.location = params.location;

  const res = await fetch(`https://jooble.org/api/${encodeURIComponent(key)}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Jooble responded ${res.status}`);

  const payload = (await res.json()) as { jobs?: unknown };
  const rows = Array.isArray(payload.jobs) ? payload.jobs : [];

  const jobs: JobListing[] = [];
  for (const raw of rows) {
    const row = raw as Record<string, unknown>;
    const title = asString(row.title);
    const applyUrl = asString(row.link);
    if (!title || !applyUrl) continue;

    const snippet = cleanSnippet(row.snippet);
    const remote = /\bremote\b/i.test(`${title} ${asString(row.location)} ${snippet ?? ""}`);
    if (params.remoteOnly && !remote) continue;

    jobs.push({
      id: `jooble-${asString(row.id) || `${title}-${jobs.length}`}`,
      title,
      company: asString(row.company) || "Unknown company",
      location: asString(row.location) || (remote ? "Remote" : "Not specified"),
      remote,
      // Jooble returns salary as a preformatted display string (may be empty).
      salary: asString(row.salary) || null,
      postedAt: asString(row.updated) || null,
      // `source` is the originating board (e.g. "Indeed"); fall back to Jooble.
      source: asString(row.source) || "Jooble",
      applyUrl,
      snippet,
    });
  }
  return jobs;
}

/* ── merge + cache ───────────────────────────────────────────────────── */

function dedupeKey(job: JobListing): string {
  return `${job.title.toLowerCase()}|${job.company.toLowerCase()}`;
}

function mergeJobs(lists: JobListing[][]): JobListing[] {
  const seen = new Map<string, JobListing>();
  for (const list of lists) {
    for (const job of list) {
      const key = dedupeKey(job);
      const existing = seen.get(key);
      if (!existing) {
        seen.set(key, job);
      } else if (!existing.salary && job.salary) {
        // Keep the first-seen listing but backfill salary from the duplicate.
        seen.set(key, { ...existing, salary: job.salary });
      }
    }
  }
  return [...seen.values()].sort((a, b) => {
    const ta = a.postedAt ? Date.parse(a.postedAt) : 0;
    const tb = b.postedAt ? Date.parse(b.postedAt) : 0;
    return tb - ta;
  });
}

// Short-lived in-memory cache so repeat searches don't burn free-tier quota.
const CACHE_TTL_MS = 15 * 60 * 1000;
const MAX_CACHE_ENTRIES = 50;
const cache = new Map<string, { at: number; result: JobSearchResult }>();

export async function searchJobs(params: JobSearchParams): Promise<JobSearchResult> {
  const jsearchKey = getJSearchKey();
  const adzunaCreds = getAdzunaCreds();
  const joobleKey = getJoobleKey();
  const providers = {
    jsearch: Boolean(jsearchKey),
    adzuna: Boolean(adzunaCreds),
    jooble: Boolean(joobleKey),
  };

  const normalized: JobSearchParams = {
    query: params.query.trim().toLowerCase(),
    location: params.location?.trim().toLowerCase() || undefined,
    remoteOnly: Boolean(params.remoteOnly),
  };
  const cacheKey = `${normalized.query}|${normalized.location ?? ""}|${normalized.remoteOnly}`;
  const hit = cache.get(cacheKey);
  if (hit && Date.now() - hit.at < CACHE_TTL_MS) {
    return { ...hit.result, providers };
  }

  const errors: string[] = [];
  const lists: JobListing[][] = [];

  const [jsearchOutcome, adzunaOutcome, joobleOutcome] = await Promise.allSettled([
    jsearchKey ? fetchJSearchJobs(normalized, jsearchKey) : Promise.resolve([]),
    adzunaCreds ? fetchAdzunaJobs(normalized, adzunaCreds) : Promise.resolve([]),
    joobleKey ? fetchJoobleJobs(normalized, joobleKey) : Promise.resolve([]),
  ]);
  if (jsearchOutcome.status === "fulfilled") lists.push(jsearchOutcome.value);
  else errors.push(`JSearch: ${jsearchOutcome.reason instanceof Error ? jsearchOutcome.reason.message : "failed"}`);
  if (adzunaOutcome.status === "fulfilled") lists.push(adzunaOutcome.value);
  else errors.push(`Adzuna: ${adzunaOutcome.reason instanceof Error ? adzunaOutcome.reason.message : "failed"}`);
  if (joobleOutcome.status === "fulfilled") lists.push(joobleOutcome.value);
  else errors.push(`Jooble: ${joobleOutcome.reason instanceof Error ? joobleOutcome.reason.message : "failed"}`);

  const result: JobSearchResult = { jobs: mergeJobs(lists), providers, errors };

  // Only cache useful responses (a provider outage shouldn't stick for 15 min).
  if (result.jobs.length > 0 || errors.length === 0) {
    if (cache.size >= MAX_CACHE_ENTRIES) {
      const oldest = [...cache.entries()].sort((a, b) => a[1].at - b[1].at)[0];
      if (oldest) cache.delete(oldest[0]);
    }
    cache.set(cacheKey, { at: Date.now(), result });
  }

  return result;
}
