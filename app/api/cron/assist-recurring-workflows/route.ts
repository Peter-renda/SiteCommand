import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { getSupabase } from "@/lib/supabase";

const DAY_MS = 24 * 60 * 60 * 1000;

// Wall-clock parts of an instant, expressed in US Eastern time.
function etParts(date: Date) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    weekday: "short",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(date);
  const m: Record<string, string> = {};
  for (const p of parts) m[p.type] = p.value;
  return {
    weekday: (m.weekday || "").toLowerCase(), // "mon", "tue", ...
    year: Number(m.year),
    month: Number(m.month),
    day: Number(m.day),
    hour: Number(m.hour) === 24 ? 0 : Number(m.hour),
  };
}

// Convert an Eastern wall-clock time (y/m/d at the given hour) to the real UTC instant,
// accounting for whichever offset (EST/EDT) is in effect at that moment.
function etWallToUtc(year: number, month: number, day: number, hour: number): Date {
  const guess = Date.UTC(year, month - 1, day, hour, 0, 0);
  const p = etParts(new Date(guess));
  const etAsUtc = Date.UTC(p.year, p.month - 1, p.day, p.hour, 0, 0);
  const offset = etAsUtc - guess; // how far ET runs behind/ahead of the guess instant
  return new Date(guess - offset);
}

// The most recent moment (<= now) this workflow was scheduled to run, or null if none applies.
function mostRecentOccurrence(
  now: Date,
  frequency: string,
  runHour: number,
  runDayOfWeek: string,
  runDate: string,
): Date | null {
  if (!Number.isInteger(runHour) || runHour < 0 || runHour > 23) return null;

  if (frequency === "daily") {
    const np = etParts(now);
    let occ = etWallToUtc(np.year, np.month, np.day, runHour);
    if (occ.getTime() > now.getTime()) {
      const prev = etParts(new Date(now.getTime() - DAY_MS));
      occ = etWallToUtc(prev.year, prev.month, prev.day, runHour);
    }
    return occ;
  }

  if (frequency === "weekly") {
    const target = runDayOfWeek.slice(0, 3);
    for (let back = 0; back < 8; back++) {
      const d = new Date(now.getTime() - back * DAY_MS);
      const p = etParts(d);
      if (p.weekday === target) {
        const occ = etWallToUtc(p.year, p.month, p.day, runHour);
        if (occ.getTime() <= now.getTime()) return occ;
      }
    }
    return null;
  }

  if (frequency === "monthly") {
    const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(runDate);
    if (!m) return null;
    const dom = Number(m[3]);
    const np = etParts(now);
    for (let back = 0; back < 13; back++) {
      let year = np.year;
      let month = np.month - back;
      while (month < 1) { month += 12; year -= 1; }
      const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
      if (dom > daysInMonth) continue; // month doesn't have this day (e.g. Feb 30)
      const occ = etWallToUtc(year, month, dom, runHour);
      if (occ.getTime() <= now.getTime()) return occ;
    }
    return null;
  }

  return null;
}

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "GEMINI_API_KEY missing" }, { status: 503 });

  const supabase = getSupabase();
  const now = new Date();

  const { data, error } = await supabase
    .from("assist_recurring_workflows")
    .select("id, project_id, name, prompt, frequency, run_day_of_week, run_date, run_hour_et, last_run_at, active")
    .eq("active", true);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // A workflow is due when its most recent scheduled occurrence has passed and it
  // has not already been run for that occurrence. This makes runs resilient to how
  // often the cron actually fires (it catches up on the next invocation) and honors
  // the chosen Eastern run hour without relying on exact minute alignment.
  const due = (data ?? []).filter((w) => {
    const occ = mostRecentOccurrence(
      now,
      String(w.frequency ?? "daily"),
      Number(w.run_hour_et),
      String(w.run_day_of_week ?? "").toLowerCase(),
      String(w.run_date ?? ""),
    );
    if (!occ) return false;
    const lastRun = w.last_run_at ? new Date(w.last_run_at).getTime() : 0;
    return lastRun < occ.getTime();
  });

  const ai = new GoogleGenAI({ apiKey });
  let created = 0;
  for (const w of due) {
    try {
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [{ role: "user", parts: [{ text: String(w.prompt ?? "") }] }],
      });
      const text = (response.text ?? "").trim() || "No output generated.";
      const safeName = String(w.name ?? "Recurring Workflow").replace(/[^a-z0-9\- ]/gi, "").trim() || "Recurring Workflow";
      const fileName = `${safeName} - ${new Date().toISOString()}.md`;
      const fileUrl = `data:text/markdown;charset=utf-8,${encodeURIComponent(text)}`;
      const { error: insertErr } = await supabase.from("assist_recurring_workflow_reports").insert({
        workflow_id: w.id,
        project_id: w.project_id,
        file_name: fileName,
        file_url: fileUrl,
        file_type: "pdf",
      });
      if (!insertErr) created++;
      await supabase.from("assist_recurring_workflows").update({ last_run_at: new Date().toISOString(), updated_at: new Date().toISOString() }).eq("id", w.id);
    } catch {
      // keep cron running for other workflows
    }
  }

  return NextResponse.json({ ok: true, candidates: (data ?? []).length, due: due.length, created });
}
