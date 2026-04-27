import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { getSession } from "@/lib/auth";
import { requireToolLevel } from "@/lib/tool-permissions";
import { logRFIChange } from "@/lib/rfi-history";

type BulkBody = {
  ids: string[];
  updates: {
    status?: "draft" | "open" | "closed";
    due_date?: string | null;
    assignees?: { id: string; name: string; email: string | null }[];
    is_deleted?: boolean;
  };
};

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: projectId } = await params;

  const denied = await requireToolLevel(session, projectId, "rfis", "admin");
  if (denied) return denied;

  const supabase = getSupabase();

  const body = (await req.json()) as BulkBody;
  const ids = Array.isArray(body.ids) ? body.ids.filter(Boolean) : [];
  if (ids.length === 0) return NextResponse.json({ error: "No RFIs selected." }, { status: 400 });

  const allowedStatuses = new Set(["draft", "open", "closed"]);
  const updates: Record<string, unknown> = {};
  if (body.updates?.status && allowedStatuses.has(body.updates.status)) updates.status = body.updates.status;
  if ("due_date" in (body.updates ?? {})) updates.due_date = body.updates.due_date || null;
  if ("assignees" in (body.updates ?? {})) updates.assignees = body.updates.assignees ?? [];
  if ("is_deleted" in (body.updates ?? {})) updates.is_deleted = Boolean(body.updates.is_deleted);

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "No valid updates supplied." }, { status: 400 });
  }

  const { data: existing } = await supabase
    .from("rfis")
    .select("id, status, due_date, assignees")
    .eq("project_id", projectId)
    .in("id", ids);

  const { data, error } = await supabase
    .from("rfis")
    .update(updates)
    .eq("project_id", projectId)
    .in("id", ids)
    .select("*");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  type Member = { id?: string | null; name?: string | null };
  const memberKey = (m: Member): string | null => m?.id?.trim() || m?.name?.trim() || null;
  const memberLabel = (m: Member): string => m?.name?.trim() || m?.id?.trim() || "Unknown";

  const previousById = new Map((existing ?? []).map((row) => [row.id, row]));
  const historyJobs: Promise<unknown>[] = [];

  for (const rfi of data ?? []) {
    const previous = previousById.get(rfi.id);
    if (!previous) continue;

    if ("status" in updates && previous.status !== rfi.status) {
      const fromLabel = previous.status ? previous.status.charAt(0).toUpperCase() + previous.status.slice(1) : null;
      const toLabel = rfi.status ? rfi.status.charAt(0).toUpperCase() + rfi.status.slice(1) : null;
      historyJobs.push(logRFIChange(supabase, session, rfi.id, projectId, "Status", fromLabel, toLabel));
    }
    if ("due_date" in updates && previous.due_date !== rfi.due_date) {
      historyJobs.push(logRFIChange(supabase, session, rfi.id, projectId, "Due Date", previous.due_date, rfi.due_date));
    }
    if ("assignees" in updates) {
      const prevList: Member[] = Array.isArray(previous.assignees) ? (previous.assignees as Member[]) : [];
      const nextList: Member[] = Array.isArray(rfi.assignees) ? (rfi.assignees as Member[]) : [];
      const prevKeys = new Set(prevList.map(memberKey).filter((k): k is string => Boolean(k)));
      const nextKeys = new Set(nextList.map(memberKey).filter((k): k is string => Boolean(k)));
      for (const m of nextList) {
        const k = memberKey(m);
        if (k && !prevKeys.has(k)) {
          historyJobs.push(logRFIChange(supabase, session, rfi.id, projectId, "Added Assignee", null, memberLabel(m)));
        }
      }
      for (const m of prevList) {
        const k = memberKey(m);
        if (k && !nextKeys.has(k)) {
          historyJobs.push(logRFIChange(supabase, session, rfi.id, projectId, "Removed Assignee", memberLabel(m), null));
        }
      }
    }
  }

  if (historyJobs.length > 0) await Promise.allSettled(historyJobs);

  return NextResponse.json(data ?? []);
}
