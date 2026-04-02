import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { getSession } from "@/lib/auth";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: projectId } = await params;
  const supabase = getSupabase();

  const { data, error } = await supabase
    .from("budget_line_items")
    .select("*")
    .eq("project_id", projectId)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data || []);
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: projectId } = await params;
  const supabase = getSupabase();

  const body = await req.json();
  const {
    cost_code,
    description,
    original_budget_amount,
    budget_modifications,
    approved_cos,
    pending_budget_changes,
    committed_costs,
    job_to_date_costs,
    commitments_invoiced,
    pending_cost_changes,
    sort_order,
  } = body;

  if (!cost_code?.trim() && !description?.trim()) {
    return NextResponse.json({ error: "Cost code or description is required" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("budget_line_items")
    .insert({
      project_id: projectId,
      cost_code: cost_code || "",
      description: description || "",
      original_budget_amount: original_budget_amount ?? 0,
      budget_modifications: budget_modifications ?? 0,
      approved_cos: approved_cos ?? 0,
      pending_budget_changes: pending_budget_changes ?? 0,
      committed_costs: committed_costs ?? 0,
      job_to_date_costs: job_to_date_costs ?? 0,
      commitments_invoiced: commitments_invoiced ?? 0,
      pending_cost_changes: pending_cost_changes ?? 0,
      sort_order: sort_order ?? 0,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
