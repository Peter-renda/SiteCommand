import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { getSession } from "@/lib/auth";
import { canEditSsov } from "@/lib/commitment-gates";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; commitmentId: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: projectId, commitmentId } = await params;
  const supabase = getSupabase();

  const { data, error } = await supabase
    .from("commitment_ssov_items")
    .select("*")
    .eq("commitment_id", commitmentId)
    .eq("project_id", projectId)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data || []);
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; commitmentId: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: projectId, commitmentId } = await params;
  const supabase = getSupabase();

  const gate = await canEditSsov(projectId, commitmentId);
  if (!gate.allowed) return NextResponse.json({ error: gate.reason }, { status: 409 });

  const body = await req.json();
  const { sov_item_id, budget_code, description, amount, sort_order } = body;

  const { data, error } = await supabase
    .from("commitment_ssov_items")
    .insert({
      commitment_id: commitmentId,
      project_id: projectId,
      sov_item_id: sov_item_id || null,
      budget_code: budget_code || "",
      description: description || "",
      amount: amount ?? 0,
      sort_order: sort_order ?? 0,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
