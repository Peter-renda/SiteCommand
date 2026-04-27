import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { getSession } from "@/lib/auth";
import { canViewPunchListItem } from "@/lib/punch-list-access";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: projectId } = await params;
  const recycleBin = _req.nextUrl.searchParams.get("recycle_bin") === "true";
  const supabase = getSupabase();

  const { data, error } = await supabase
    .from("punch_list_items")
    .select("*")
    .eq("project_id", projectId)
    .eq("is_deleted", recycleBin)
    .order("item_number", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  const visibleItems = (data || []).filter((item) => canViewPunchListItem(item, session.id));
  return NextResponse.json(visibleItems);
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: projectId } = await params;
  const supabase = getSupabase();

  const { data: maxRow } = await supabase
    .from("punch_list_items")
    .select("item_number")
    .eq("project_id", projectId)
    .order("item_number", { ascending: false })
    .limit(1)
    .single();

  const autoNumber = (maxRow?.item_number ?? 0) + 1;

  const body = await req.json();
  const {
    item_number,
    title,
    status,
    punch_item_manager_id,
    type,
    assignees,
    due_date,
    final_approver_id,
    distribution_list,
    location,
    priority,
    trade,
    reference,
    schedule_impact,
    cost_impact,
    cost_codes,
    private: isPrivate,
    description,
    attachments,
  } = body;

  const resolvedNumber = (item_number && Number.isInteger(Number(item_number))) ? Number(item_number) : autoNumber;
  const trimmedTitle = (title ?? "").toString().trim();

  if (!trimmedTitle) {
    return NextResponse.json({ error: "Title is required." }, { status: 400 });
  }
  if (!Number.isInteger(resolvedNumber) || resolvedNumber <= 0) {
    return NextResponse.json({ error: "Number is required and must be a whole number." }, { status: 400 });
  }
  if (!punch_item_manager_id) {
    return NextResponse.json({ error: "Punch item manager is required." }, { status: 400 });
  }
  if (!final_approver_id) {
    return NextResponse.json({ error: "Final approver is required." }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("punch_list_items")
    .insert({
      project_id: projectId,
      item_number: resolvedNumber,
      title: trimmedTitle,
      status: status || "open",
      punch_item_manager_id: punch_item_manager_id || null,
      type: type || null,
      assignees: assignees ?? [],
      due_date: due_date || null,
      final_approver_id: final_approver_id || null,
      distribution_list: distribution_list ?? [],
      location: location || null,
      priority: priority || null,
      trade: trade || null,
      reference: reference || null,
      schedule_impact: schedule_impact || null,
      cost_impact: cost_impact || null,
      cost_codes: cost_codes || null,
      private: isPrivate ?? false,
      description: description || null,
      attachments: attachments ?? [],
      created_by: session.id,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
