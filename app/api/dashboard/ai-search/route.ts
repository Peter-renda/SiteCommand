import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { getSession } from "@/lib/auth";
import { getSupabase } from "@/lib/supabase";

type SourceSnippet = {
  id: string;
  title: string;
  href: string;
  snippet: string;
};

function truncate(text: string, max = 320) {
  const normalized = text.replace(/\s+/g, " ").trim();
  if (normalized.length <= max) return normalized;
  return `${normalized.slice(0, max - 1)}…`;
}

function parseJsonArray(raw: string | null): string {
  if (!raw) return "";
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed
        .map((item) => {
          if (typeof item === "string") return item;
          if (item && typeof item === "object") {
            const values = Object.values(item).filter((v) => typeof v === "string") as string[];
            return values.join(" ");
          }
          return "";
        })
        .filter(Boolean)
        .join(" ");
    }
  } catch {}
  return raw;
}

function flattenTextFromJson(value: unknown): string {
  if (typeof value === "string") return value;
  if (Array.isArray(value)) return value.map((item) => flattenTextFromJson(item)).filter(Boolean).join(" ");
  if (value && typeof value === "object") {
    return Object.values(value).map((item) => flattenTextFromJson(item)).filter(Boolean).join(" ");
  }
  return "";
}

function extractKeywords(question: string) {
  return question
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((word) => word.length >= 3)
    .slice(0, 12);
}

function relevanceScore(text: string, keywords: string[]) {
  const haystack = text.toLowerCase();
  let score = 0;
  for (const keyword of keywords) {
    if (haystack.includes(keyword)) score += 1;
  }
  return score;
}

function citedIndexes(answer: string) {
  const matches = [...answer.matchAll(/\[(\d+)\]/g)];
  return [...new Set(matches.map((m) => Number(m[1])).filter((n) => Number.isFinite(n)))];
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { question } = await req.json();
  const userQuestion = String(question ?? "").trim();
  if (!userQuestion) {
    return NextResponse.json({ error: "A question is required" }, { status: 400 });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "AI search is not configured. Add GEMINI_API_KEY to enable this feature." },
      { status: 503 }
    );
  }

  const supabase = getSupabase();

  let projects: { id: string; name: string }[] = [];
  if (session.company_id) {
    const { data } = await supabase.from("projects").select("id, name").eq("company_id", session.company_id);
    projects = data || [];
  } else {
    const { data: memberships } = await supabase
      .from("project_memberships")
      .select("project_id")
      .eq("user_id", session.id);
    const projectIds = (memberships || []).map((m: { project_id: string }) => m.project_id);
    if (projectIds.length > 0) {
      const { data } = await supabase.from("projects").select("id, name").in("id", projectIds);
      projects = data || [];
    }
  }

  if (projects.length === 0) {
    return NextResponse.json({ answer: "I could not find any accessible projects to search.", sources: [] });
  }

  const projectIds = projects.map((p) => p.id);
  const projectMap = new Map(projects.map((p) => [p.id, p.name]));
  const snippets: SourceSnippet[] = [];

  try {
    const { data: documents } = await supabase
      .from("documents")
      .select("id, project_id, name, created_at")
      .in("project_id", projectIds)
      .eq("type", "file")
      .order("created_at", { ascending: false })
      .limit(120);
    for (const row of documents || []) {
      snippets.push({
        id: `doc-${row.id}`,
        title: `${projectMap.get(row.project_id) ?? "Project"} • Document: ${row.name}`,
        href: `/projects/${row.project_id}/documents`,
        snippet: `Document file named "${row.name}" uploaded in project ${projectMap.get(row.project_id) ?? ""}.`,
      });
    }
  } catch {}

  try {
    const { data: drawings } = await supabase
      .from("project_drawings")
      .select("id, project_id, drawing_no, title, set_name, revision, page_number, updated_at")
      .in("project_id", projectIds)
      .order("updated_at", { ascending: false })
      .limit(120);
    for (const row of drawings || []) {
      snippets.push({
        id: `drawing-${row.id}`,
        title: `${projectMap.get(row.project_id) ?? "Project"} • Drawing ${row.drawing_no ?? row.page_number}`,
        href: `/projects/${row.project_id}/drawings`,
        snippet: truncate(
          `Drawing ${row.drawing_no ?? row.page_number}: ${row.title ?? "Untitled"}. Set ${row.set_name ?? "N/A"}. Revision ${row.revision ?? "N/A"}.`
        ),
      });
    }
  } catch {}

  try {
    const { data: drawingAnnotations } = await supabase
      .from("drawing_annotations")
      .select("id, project_id, drawing_id, annotation_data, updated_at")
      .in("project_id", projectIds)
      .order("updated_at", { ascending: false })
      .limit(120);
    for (const row of drawingAnnotations || []) {
      const annotationText = truncate(flattenTextFromJson(row.annotation_data));
      if (!annotationText) continue;
      snippets.push({
        id: `drawing-annotation-${row.id}`,
        title: `${projectMap.get(row.project_id) ?? "Project"} • Drawing Annotation`,
        href: `/projects/${row.project_id}/drawings`,
        snippet: `Drawing note content: ${annotationText}`,
      });
    }
  } catch {}

  try {
    const { data: rfis } = await supabase
      .from("rfis")
      .select("id, project_id, rfi_number, subject, question, created_at")
      .in("project_id", projectIds)
      .order("created_at", { ascending: false })
      .limit(120);
    const rfiIds = (rfis || []).map((r) => r.id);
    const responsesByRfi = new Map<string, string[]>();
    if (rfiIds.length > 0) {
      const { data: rfiResponses } = await supabase
        .from("rfi_responses")
        .select("rfi_id, body, created_at")
        .in("rfi_id", rfiIds)
        .order("created_at", { ascending: false })
        .limit(200);
      for (const response of rfiResponses || []) {
        const existing = responsesByRfi.get(response.rfi_id) || [];
        if (existing.length < 2) existing.push(response.body);
        responsesByRfi.set(response.rfi_id, existing);
      }
    }

    for (const row of rfis || []) {
      const responses = responsesByRfi.get(row.id) || [];
      snippets.push({
        id: `rfi-${row.id}`,
        title: `${projectMap.get(row.project_id) ?? "Project"} • RFI #${row.rfi_number}`,
        href: `/projects/${row.project_id}/rfis/${row.id}`,
        snippet: truncate(
          `Subject: ${row.subject ?? "N/A"}. Question: ${row.question ?? "N/A"}. Responses: ${responses.join(" ") || "No responses yet."}`
        ),
      });
    }
  } catch {}

  try {
    const { data: submittals } = await supabase
      .from("submittals")
      .select("id, project_id, submittal_number, title, description, status, created_at")
      .in("project_id", projectIds)
      .order("created_at", { ascending: false })
      .limit(120);
    for (const row of submittals || []) {
      snippets.push({
        id: `submittal-${row.id}`,
        title: `${projectMap.get(row.project_id) ?? "Project"} • Submittal #${row.submittal_number}`,
        href: `/projects/${row.project_id}/submittals/${row.id}`,
        snippet: truncate(`Title: ${row.title ?? "N/A"}. Description: ${row.description ?? "N/A"}. Status: ${row.status ?? "N/A"}.`),
      });
    }
  } catch {}

  try {
    const { data: dailyLogs } = await supabase
      .from("daily_logs")
      .select("id, project_id, log_date, weather_observations, note_entries, created_at")
      .in("project_id", projectIds)
      .order("created_at", { ascending: false })
      .limit(120);
    for (const row of dailyLogs || []) {
      const notes = [parseJsonArray(row.note_entries), row.weather_observations || ""].filter(Boolean).join(" ");
      snippets.push({
        id: `daily-log-${row.id}`,
        title: `${projectMap.get(row.project_id) ?? "Project"} • Daily Log ${row.log_date}`,
        href: `/projects/${row.project_id}/daily-log`,
        snippet: truncate(`Daily log dated ${row.log_date}. ${notes || "No detailed notes."}`),
      });
    }
  } catch {}

  try {
    const { data: documentAnnotations } = await supabase
      .from("document_annotations")
      .select("id, project_id, document_id, annotation_data, updated_at")
      .in("project_id", projectIds)
      .order("updated_at", { ascending: false })
      .limit(120);
    for (const row of documentAnnotations || []) {
      const annotationText = truncate(flattenTextFromJson(row.annotation_data));
      if (!annotationText) continue;
      snippets.push({
        id: `doc-annotation-${row.id}`,
        title: `${projectMap.get(row.project_id) ?? "Project"} • Document Annotation`,
        href: `/projects/${row.project_id}/documents`,
        snippet: `Document note content: ${annotationText}`,
      });
    }
  } catch {}

  try {
    const { data: activity } = await supabase
      .from("activity_log")
      .select("id, project_id, type, description, created_at")
      .in("project_id", projectIds)
      .order("created_at", { ascending: false })
      .limit(120);
    for (const row of activity || []) {
      snippets.push({
        id: `activity-${row.id}`,
        title: `${projectMap.get(row.project_id) ?? "Project"} • Activity (${row.type})`,
        href: `/projects/${row.project_id}`,
        snippet: truncate(row.description || ""),
      });
    }
  } catch {}

  try {
    const { data: meetings } = await supabase
      .from("meetings")
      .select("id, project_id, title, location, notes, agenda, created_at")
      .in("project_id", projectIds)
      .order("created_at", { ascending: false })
      .limit(120);
    for (const row of meetings || []) {
      snippets.push({
        id: `meeting-${row.id}`,
        title: `${projectMap.get(row.project_id) ?? "Project"} • Meeting: ${row.title ?? "Untitled"}`,
        href: `/projects/${row.project_id}/meetings/${row.id}`,
        snippet: truncate(`Location: ${row.location ?? "N/A"}. Agenda: ${row.agenda ?? "N/A"}. Notes: ${row.notes ?? "N/A"}.`),
      });
    }
  } catch {}

  if (snippets.length === 0) {
    return NextResponse.json({
      answer: "I could not find searchable project records yet. Please upload project content and confirm your permissions.",
      sources: [],
    });
  }

  const keywords = extractKeywords(userQuestion);
  const ranked = snippets
    .map((snippet) => ({ ...snippet, score: relevanceScore(`${snippet.title} ${snippet.snippet}`, keywords) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 140)
    .map((snippet, idx) => ({ ...snippet, index: idx + 1 }));

  const context = ranked.map((s) => `[${s.index}] ${s.title}\n${s.snippet}`).join("\n\n");

  try {
    const genai = new GoogleGenAI({ apiKey });
    const result = await genai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: `You are a construction project assistant for SiteCommand.
Use ONLY the provided context to answer the user's question.
If information is uncertain or missing, explicitly say what is unknown and ask the user to confirm.
When possible, include a clear location reference (example: page number, drawing number, RFI number, log date).
Cite supporting context item numbers like [2] or [5] in your answer.
Keep your answer concise and practical for jobsite teams.

User question:
${userQuestion}

Context:
${context}`,
    });

    const answer = (result.text ?? "").trim() || "I could not find enough information to answer this confidently. Please confirm.";
    const cited = citedIndexes(answer);
    const selectedSources = (cited.length > 0
      ? ranked.filter((s) => cited.includes(s.index))
      : ranked.slice(0, 6)
    ).slice(0, 8);

    return NextResponse.json({
      answer,
      sources: selectedSources.map((s) => ({ id: s.id, title: s.title, href: s.href })),
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "AI generation failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
