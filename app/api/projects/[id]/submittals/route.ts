import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { getSession } from "@/lib/auth";
import { calculateSubmittalSchedule } from "@/lib/submittalSchedule";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: projectId } = await params;
  const supabase = getSupabase();

  const { data, error } = await supabase
    .from("submittals")
    .select("*")
    .eq("project_id", projectId)
     .eq("is_deleted", req.nextUrl.searchParams.get("recycle_bin") === "true")
    .order("submittal_number", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data || []);
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: projectId } = await params;
  const supabase = getSupabase();

  const { data: maxRow } = await supabase
    .from("submittals")
    .select("submittal_number")
    .eq("project_id", projectId)
    .eq("is_deleted", false)
    .order("submittal_number", { ascending: false })
    .limit(1)
    .single();

  const nextNumber = (maxRow?.submittal_number ?? 0) + 1;

  const body = await req.json();
  const {
    title,
    revision,
    specification_id,
    submittal_type,
    status,
    responsible_contractor_id,
    received_from_id,
    submittal_manager_id,
    approver_name_id,
    submit_by,
    received_date,
    issue_date,
    final_due_date,
    cost_code,
    linked_drawings,
    distribution_list,
    ball_in_court_id,
    lead_time,
    required_on_site_date,
    private: isPrivate,
    description,
    attachments,
    owners_manual,
    package_notes,
    confirmed_delivery_date,
    actual_delivery_date,
    workflow_steps,
    related_items,
    design_team_review_time,
    internal_review_time,
  } = body;

  const trimmedTitle = (title ?? "").toString().trim();
  if (!trimmedTitle) {
    return NextResponse.json({ error: "Title is required" }, { status: 400 });
  }
  if (!submittal_manager_id) {
    return NextResponse.json({ error: "Submittal Manager is required" }, { status: 400 });
  }


  const scheduleDates = calculateSubmittalSchedule({
    required_on_site_date: required_on_site_date || null,
    lead_time: lead_time != null ? Number(lead_time) : null,
    design_team_review_time: design_team_review_time != null ? Number(design_team_review_time) : null,
    internal_review_time: internal_review_time != null ? Number(internal_review_time) : null,
  });

  const { data, error } = await supabase
    .from("submittals")
    .insert({
      project_id: projectId,
      submittal_number: nextNumber,
      title: trimmedTitle,
      revision: revision || "A",
      specification_id: specification_id || null,
      submittal_type: submittal_type || null,
      status: status || "draft",
      responsible_contractor_id: responsible_contractor_id || null,
      received_from_id: received_from_id || null,
      submittal_manager_id: submittal_manager_id || null,
      approver_name_id: approver_name_id || null,
      submit_by: submit_by || null,
      received_date: received_date || null,
      issue_date: issue_date || null,
      final_due_date: final_due_date || null,
      cost_code: cost_code || null,
      linked_drawings: linked_drawings || null,
      distribution_list: distribution_list ?? [],
      ball_in_court_id: ball_in_court_id || null,
      lead_time: lead_time != null ? Number(lead_time) : null,
      design_team_review_time: design_team_review_time != null ? Number(design_team_review_time) : null,
      internal_review_time: internal_review_time != null ? Number(internal_review_time) : null,
      required_on_site_date: required_on_site_date || null,
      ...scheduleDates,
      private: isPrivate ?? false,
      description: description || null,
      attachments: attachments ?? [],
      owners_manual: owners_manual || null,
      package_notes: package_notes || null,
      confirmed_delivery_date: confirmed_delivery_date || null,
      actual_delivery_date: actual_delivery_date || null,
      workflow_steps: workflow_steps ?? [],
      related_items: related_items ?? [],
      created_by: session.id,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
