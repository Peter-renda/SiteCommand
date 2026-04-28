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

function normalizeXmlKey(key: string): string {
  return key.split(":").pop()?.toLowerCase() ?? key.toLowerCase();
}

function getNode(obj: unknown, nodeName: string): unknown {
  if (!obj || typeof obj !== "object") return undefined;
  for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
    if (normalizeXmlKey(key) === nodeName.toLowerCase()) return value;
  }
  return undefined;
}

function getValue(obj: unknown, keyName: string): unknown {
  if (!obj || typeof obj !== "object") return undefined;
  for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
    if (normalizeXmlKey(key) === keyName.toLowerCase()) return value;
  }
  return undefined;
}

function parseTasks(xmlText: string): Task[] {
  const parser = new XMLParser({ ignoreAttributes: false, parseTagValue: true });
  const parsed = parser.parse(xmlText);

  // MS Project XML may be under "Project" or namespaced root
  const root =
    parsed["Project"] ??
    parsed[Object.keys(parsed).find((k) => k.includes("Project")) ?? ""] ??
    {};

  const tasksNode = getNode(root, "Tasks") ?? getNode(parsed, "Tasks") ?? {};
  const rawTasks = getNode(tasksNode, "Task");

  if (!rawTasks) return [];

  const taskArr = Array.isArray(rawTasks) ? rawTasks : [rawTasks];

  return taskArr
    .filter((t) => {
      const uid = Number(getValue(t, "UID") ?? -1);
      return uid !== 0; // skip project summary row
    })
    .map((t): Task => {
      const predLink = getNode(t, "PredecessorLink");
      let predecessorUids: number[] = [];
      if (predLink) {
        const links = Array.isArray(predLink) ? predLink : [predLink];
        predecessorUids = links
          .map((l) => Number(getValue(l, "PredecessorUID") ?? 0))
          .filter((n) => n > 0);
      }

      return {
        uid: Number(getValue(t, "UID") ?? 0),
        id: Number(getValue(t, "ID") ?? 0),
        name: String(getValue(t, "Name") ?? ""),
        outlineLevel: Number(getValue(t, "OutlineLevel") ?? 0),
        isSummary: Number(getValue(t, "Summary") ?? 0) === 1,
        isMilestone: Number(getValue(t, "Milestone") ?? 0) === 1,
        start: parseDate(getValue(t, "Start")),
        finish: parseDate(getValue(t, "Finish")),
        percentComplete: Number(getValue(t, "PercentComplete") ?? 0),
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
    // Storage file is missing or bucket inaccessible — clear the orphaned row
    // so the client shows the upload zone instead of an infinite error state.
    await supabase.from("project_schedules").delete().eq("project_id", projectId);
    return NextResponse.json({ schedule: null, tasks: [] });
  }

  let tasks: Task[] = [];
  try {
    const xmlText = await blob.text();
    tasks = parseTasks(xmlText);
  } catch {
    // Parsing failed — still return the metadata so the UI doesn't break
    tasks = [];
  }

  // Apply any saved overrides on top of the parsed XML tasks
  const overrides = (scheduleRow.task_overrides ?? {}) as Record<string, { start?: string; finish?: string }>;
  if (Object.keys(overrides).length > 0) {
    for (const task of tasks) {
      const ov = overrides[String(task.uid)];
      if (ov) {
        if (ov.start) task.start = ov.start;
        if (ov.finish) task.finish = ov.finish;
      }
    }
  }

  return NextResponse.json({
    schedule: {
      id: scheduleRow.id,
      filename: scheduleRow.filename,
      uploaded_by_name: scheduleRow.uploaded_by_name,
      uploaded_at: scheduleRow.uploaded_at,
    },
    tasks,
    changeHistory: scheduleRow.change_history ?? [],
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

// ── PATCH ─────────────────────────────────────────────────────────────────────
// Two modes:
//   Date change: { uid, field, value, changeEntry }
//   Clear history: { clearHistory: true }

type ChangeEntry = {
  taskId: number;
  taskName: string;
  field: "start" | "finish";
  oldValue: string;
  newValue: string;
  delta: number;
  timestamp: string; // ISO string
};

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: projectId } = await params;
  const supabase = getSupabase();

  const body = await req.json() as
    | { uid: number; field: "start" | "finish"; value: string; changeEntry: ChangeEntry }
    | { clearHistory: true };

  const { data: row, error: fetchError } = await supabase
    .from("project_schedules")
    .select("id, task_overrides, change_history")
    .eq("project_id", projectId)
    .maybeSingle();

  if (fetchError) return NextResponse.json({ error: fetchError.message }, { status: 500 });
  if (!row) return NextResponse.json({ error: "Schedule not found" }, { status: 404 });

  // Clear history mode
  if ("clearHistory" in body && body.clearHistory) {
    const { error } = await supabase
      .from("project_schedules")
      .update({ change_history: [] })
      .eq("id", row.id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  // Date change mode
  if (!body.uid || !body.field || !body.value) {
    return NextResponse.json({ error: "uid, field, and value are required" }, { status: 400 });
  }

  const overrides = (row.task_overrides ?? {}) as Record<string, Record<string, string>>;
  const key = String(body.uid);
  overrides[key] = { ...(overrides[key] ?? {}), [body.field]: body.value };

  const history = (row.change_history ?? []) as ChangeEntry[];
  const updatedHistory = [body.changeEntry, ...history];

  const { error: updateError } = await supabase
    .from("project_schedules")
    .update({ task_overrides: overrides, change_history: updatedHistory })
    .eq("id", row.id);

  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
