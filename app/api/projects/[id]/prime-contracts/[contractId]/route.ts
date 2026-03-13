import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { getSession } from "@/lib/auth";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; contractId: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { contractId } = await params;
  const supabase = getSupabase();

  const { data, error } = await supabase
    .from("prime_contracts")
    .select("*, prime_contract_sov_items(*)")
    .eq("id", contractId)
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; contractId: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { contractId } = await params;
  const supabase = getSupabase();
  const body = await req.json();

  const { data, error } = await supabase
    .from("prime_contracts")
    .update(body)
    .eq("id", contractId)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; contractId: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { contractId } = await params;
  const supabase = getSupabase();

  await supabase.from("prime_contract_sov_items").delete().eq("contract_id", contractId);

  const { error } = await supabase.from("prime_contracts").delete().eq("id", contractId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
