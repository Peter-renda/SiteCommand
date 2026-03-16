import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { getSession } from "@/lib/auth";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: projectId } = await params;
  const supabase = getSupabase();

  const { data, error } = await supabase
    .from("estimate_items")
    .select("*")
    .eq("project_id", projectId)
    .order("division_code", { ascending: true })
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
    division_code,
    division_name,
    cost_code,
    description,
    quantity,
    unit,
    unit_cost,
    notes,
    sort_order,
  } = body;

  if (!description?.trim()) {
    return NextResponse.json({ error: "Description is required" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("estimate_items")
    .insert({
      project_id: projectId,
      division_code: division_code || "01",
      division_name: division_name || "General Requirements",
      cost_code: cost_code || null,
      description: description.trim(),
      quantity: quantity ?? 1,
      unit: unit || "LS",
      unit_cost: unit_cost ?? 0,
      notes: notes || null,
      sort_order: sort_order ?? 0,
      created_by: session.id || null,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
