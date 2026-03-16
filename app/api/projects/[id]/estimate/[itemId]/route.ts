import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { getSession } from "@/lib/auth";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; itemId: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: projectId, itemId } = await params;
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

  const updates: Record<string, unknown> = {};
  if (division_code !== undefined) updates.division_code = division_code;
  if (division_name !== undefined) updates.division_name = division_name;
  if (cost_code !== undefined) updates.cost_code = cost_code;
  if (description !== undefined) updates.description = description;
  if (quantity !== undefined) updates.quantity = quantity;
  if (unit !== undefined) updates.unit = unit;
  if (unit_cost !== undefined) updates.unit_cost = unit_cost;
  if (notes !== undefined) updates.notes = notes;
  if (sort_order !== undefined) updates.sort_order = sort_order;

  const { data, error } = await supabase
    .from("estimate_items")
    .update(updates)
    .eq("id", itemId)
    .eq("project_id", projectId)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; itemId: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: projectId, itemId } = await params;
  const supabase = getSupabase();

  const { error } = await supabase
    .from("estimate_items")
    .delete()
    .eq("id", itemId)
    .eq("project_id", projectId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
