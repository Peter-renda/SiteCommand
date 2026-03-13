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
  const includeDeleted = searchParams.get("deleted") === "true";

  let query = supabase
    .from("commitments")
    .select("*")
    .eq("project_id", projectId)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (includeDeleted) {
    query = query.not("deleted_at", "is", null);
  } else {
    query = query.is("deleted_at", null);
  }

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data || []);
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
  const {
    type,
    contract_company,
    title,
    erp_status,
    status,
    executed,
    ssov_status,
    original_contract_amount,
    approved_change_orders,
    pending_change_orders,
    draft_amount,
    sort_order,
  } = body;

  if (!title?.trim() && !contract_company?.trim()) {
    return NextResponse.json({ error: "Title or contract company is required" }, { status: 400 });
  }

  // Get next number for this project
  const { data: existing } = await supabase
    .from("commitments")
    .select("number")
    .eq("project_id", projectId)
    .order("number", { ascending: false })
    .limit(1);

  const nextNumber = existing && existing.length > 0 ? existing[0].number + 1 : 1;

  const { data, error } = await supabase
    .from("commitments")
    .insert({
      project_id: projectId,
      type: type || "subcontract",
      number: nextNumber,
      contract_company: contract_company || "",
      title: title || "",
      erp_status: erp_status || "not_synced",
      status: status || "draft",
      executed: executed ?? false,
      ssov_status: ssov_status || "",
      original_contract_amount: original_contract_amount ?? 0,
      approved_change_orders: approved_change_orders ?? 0,
      pending_change_orders: pending_change_orders ?? 0,
      draft_amount: draft_amount ?? 0,
      sort_order: sort_order ?? nextNumber,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
