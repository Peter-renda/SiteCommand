import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { getSession } from "@/lib/auth";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: projectId } = await params;
  const supabase = getSupabase();

  const { data, error } = await supabase
    .from("prime_contracts")
    .select("*")
    .eq("project_id", projectId)
    .is("deleted_at", null)
    .order("created_at", { ascending: true });

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

  // Get next contract number
  const { data: existing } = await supabase
    .from("prime_contracts")
    .select("contract_number")
    .eq("project_id", projectId)
    .order("contract_number", { ascending: false })
    .limit(1);

  const nextNumber = existing && existing.length > 0 ? existing[0].contract_number + 1 : 1;

  const { data, error } = await supabase
    .from("prime_contracts")
    .insert({
      project_id: projectId,
      contract_number: nextNumber,
      title: body.title || "",
      owner_client: body.owner_client || "",
      contractor: body.contractor || "",
      status: body.status || "Draft",
      erp_status: body.erp_status || null,
      executed: body.executed ?? false,
      original_contract_amount: body.original_contract_amount ?? 0,
      approved_change_orders: body.approved_change_orders ?? 0,
      pending_change_orders: body.pending_change_orders ?? 0,
      draft_change_orders: body.draft_change_orders ?? 0,
      invoiced: body.invoiced ?? 0,
      payments_received: body.payments_received ?? 0,
      is_private: body.is_private ?? false,
      description: body.description || "",
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
