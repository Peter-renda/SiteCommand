import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { getSession } from "@/lib/auth";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: projectId } = await params;
  const supabase = getSupabase();
  const { searchParams } = new URL(req.url);
  const start = searchParams.get("start");
  const end = searchParams.get("end");
  const costCode = searchParams.get("cost_code");
  const costType = searchParams.get("cost_type");

  let query = supabase
    .from("budget_modification_records")
    .select("*")
    .eq("project_id", projectId)
    .order("created_at", { ascending: false });

  if (start) query = query.gte("created_at", start);
  if (end) {
    // Include the entire end day
    const endDay = new Date(end);
    endDay.setDate(endDay.getDate() + 1);
    query = query.lt("created_at", endDay.toISOString().split("T")[0]);
  }
  if (costCode && costCode !== "all") {
    query = query.or(`from_cost_code.eq.${costCode},to_cost_code.eq.${costCode}`);
  }

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  let rows = data ?? [];

  // Apply cost_type filter in-memory by joining with line items
  if (costType) {
    const itemIds = [...new Set(rows.flatMap((r) => [r.from_line_item_id, r.to_line_item_id].filter(Boolean)))];
    if (itemIds.length > 0) {
      const { data: lineItems } = await supabase
        .from("budget_line_items")
        .select("id, cost_type")
        .in("id", itemIds);
      const typeMap = new Map((lineItems ?? []).map((li) => [li.id, li.cost_type]));
      rows = rows.filter((r) => {
        const fromType = typeMap.get(r.from_line_item_id) ?? "";
        const toType = typeMap.get(r.to_line_item_id) ?? "";
        return fromType === costType || toType === costType;
      });
    }
  }

  return NextResponse.json(rows);
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: projectId } = await params;
  const supabase = getSupabase();

  const body = await req.json();
  const rows: { fromId: string; toId: string; fromCostCode: string; toCostCode: string; amount: number; notes: string }[] =
    body.rows ?? [];

  if (rows.length === 0) return NextResponse.json([]);

  const records = rows.map((r) => ({
    project_id: projectId,
    from_line_item_id: r.fromId || null,
    to_line_item_id: r.toId || null,
    from_cost_code: r.fromCostCode ?? "",
    to_cost_code: r.toCostCode ?? "",
    amount: r.amount,
    notes: r.notes ?? "",
    created_by: session.username,
  }));

  const { data, error } = await supabase
    .from("budget_modification_records")
    .insert(records)
    .select();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}
