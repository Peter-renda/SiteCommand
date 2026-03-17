import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getSupabase } from "@/lib/supabase";
import { XMLParser } from "fast-xml-parser";

// ── Types ─────────────────────────────────────────────────────────────────────

type Task = {
  uid: number;
  id: number;
  name: string;
  outlineLevel: number;
  isSummary: boolean;
  isMilestone: boolean;
  start: string;
  finish: string;
  percentComplete: number;
  predecessorUids: number[];
};

// ── XML Parsing ───────────────────────────────────────────────────────────────

function parseDate(raw: unknown): string {
  if (!raw) return "";
  const str = String(raw);
  return str.includes("T") ? str.split("T")[0] : str;
}

function parseTasks(xmlText: string): Task[] {
  const parser = new XMLParser({ ignoreAttributes: false, parseTagValue: true });
  const parsed = parser.parse(xmlText);

  // MS Project XML may be under "Project" or namespaced root
  const root =
    parsed["Project"] ??
    parsed[Object.keys(parsed).find((k) => k.includes("Project")) ?? ""] ??
    {};

  const tasksNode = root["Tasks"] ?? {};
  const rawTasks = tasksNode["Task"];

  if (!rawTasks) return [];

  const taskArr = Array.isArray(rawTasks) ? rawTasks : [rawTasks];

  return taskArr
    .filter((t) => {
      const uid = Number(t["UID"] ?? t["uid"] ?? -1);
      return uid !== 0; // skip project summary row
    })
    .map((t): Task => {
      const predLink = t["PredecessorLink"];
      let predecessorUids: number[] = [];
      if (predLink) {
        const links = Array.isArray(predLink) ? predLink : [predLink];
        predecessorUids = links
          .map((l) => Number(l["PredecessorUID"] ?? l["predecessorUID"] ?? 0))
          .filter((n) => n > 0);
      }

      return {
        uid: Number(t["UID"] ?? t["uid"] ?? 0),
        id: Number(t["ID"] ?? t["id"] ?? 0),
        name: String(t["Name"] ?? t["name"] ?? ""),
        outlineLevel: Number(t["OutlineLevel"] ?? t["outlineLevel"] ?? 0),
        isSummary: Number(t["Summary"] ?? t["summary"] ?? 0) === 1,
        isMilestone: Number(t["Milestone"] ?? t["milestone"] ?? 0) === 1,
        start: parseDate(t["Start"] ?? t["start"]),
        finish: parseDate(t["Finish"] ?? t["finish"]),
        percentComplete: Number(t["PercentComplete"] ?? t["percentComplete"] ?? 0),
        predecessorUids,
      };
    });
}

// ── GET ───────────────────────────────────────────────────────────────────────

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: projectId } = await params;
  const supabase = getSupabase();

  const { data: scheduleRow, error } = await supabase
    .from("project_schedules")
    .select("*")
    .eq("project_id", projectId)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!scheduleRow) return NextResponse.json({ schedule: null, tasks: [] });

  // Download XML from storage
  const { data: blob, error: dlError } = await supabase.storage
    .from("project-schedules")
    .download(scheduleRow.storage_path);

  if (dlError || !blob) {
    return NextResponse.json({ error: "Failed to download schedule file" }, { status: 500 });
  }

  const xmlText = await blob.text();
  const tasks = parseTasks(xmlText);

  return NextResponse.json({
    schedule: {
      id: scheduleRow.id,
      filename: scheduleRow.filename,
      uploaded_by_name: scheduleRow.uploaded_by_name,
      uploaded_at: scheduleRow.uploaded_at,
    },
    tasks,
  });
}

// ── POST ──────────────────────────────────────────────────────────────────────

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: projectId } = await params;
  const supabase = getSupabase();

  const formData = await req.formData();
  const file = formData.get("file") as File | null;

  if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });
  if (!file.name.toLowerCase().endsWith(".xml")) {
    return NextResponse.json({ error: "File must be an .xml file" }, { status: 400 });
  }

  const storagePath = `${projectId}/schedule.xml`;

  const { error: uploadError } = await supabase.storage
    .from("project-schedules")
    .upload(storagePath, file, { upsert: true, contentType: "text/xml" });

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 });
  }

  // Replace existing schedule row
  await supabase.from("project_schedules").delete().eq("project_id", projectId);

  const { data, error } = await supabase
    .from("project_schedules")
    .insert({
      project_id: projectId,
      storage_path: storagePath,
      filename: file.name,
      uploaded_by_name: session.username,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
