import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { getSession } from "@/lib/auth";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: projectId } = await params;
  const supabase = getSupabase();

  const body = await req.json();
  const { items } = body as {
    items: Array<{
      description: string;
      quantity?: number;
      unit?: string;
      unit_cost?: number;
      cost_code?: string;
      division_code?: string;
      division_name?: string;
    }>;
  };

  if (!Array.isArray(items) || items.length === 0) {
    return NextResponse.json({ error: "No items provided" }, { status: 400 });
  }

  const rows = items
    .filter((item) => item.description?.trim())
    .map((item, idx) => ({
      project_id: projectId,
      division_code: item.division_code?.trim() || "01",
      division_name: item.division_name?.trim() || "General Requirements",
      cost_code: item.cost_code?.trim() || null,
      description: item.description.trim(),
      quantity: Number(item.quantity) || 1,
      unit: item.unit?.trim() || "LS",
      unit_cost: Number(item.unit_cost) || 0,
      sort_order: idx,
      created_by: session.id || null,
    }));

  if (rows.length === 0) {
    return NextResponse.json({ error: "No valid items to import" }, { status: 400 });
  }

  const { data, error } = await supabase.from("estimate_items").insert(rows).select();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ count: data?.length ?? 0 });
}
