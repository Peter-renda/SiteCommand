import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { getSession } from "@/lib/auth";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: projectId } = await params;
  const supabase = getSupabase();

  const { data, error } = await supabase
    .from("prime_contracts")
    .select("*")
    .eq("project_id", projectId)
    .order("contract_number", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data || []);
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: projectId } = await params;
  const supabase = getSupabase();

  const { data: maxRow } = await supabase
    .from("prime_contracts")
    .select("contract_number")
    .eq("project_id", projectId)
    .order("contract_number", { ascending: false })
    .limit(1)
    .single();

  const nextNumber = (maxRow?.contract_number ?? 0) + 1;

  const body = await req.json();
  const {
    title,
    status,
    executed,
    owner,
    contractor,
    architect_engineer,
    default_retainage,
    description,
    schedule_of_values,
    contract_value,
    inclusions,
    exclusions,
    start_date,
    estimated_completion_date,
    actual_completion_date,
    signed_contract_received_date,
    contract_termination_date,
    private: isPrivate,
  } = body;

  const { data, error } = await supabase
    .from("prime_contracts")
    .insert({
      project_id: projectId,
      contract_number: nextNumber,
      title: (title ?? "").toString().trim() || "Untitled",
      status: status || "draft",
      executed: executed ?? false,
      owner: owner || null,
      contractor: contractor || null,
      architect_engineer: architect_engineer || null,
      default_retainage: default_retainage != null ? Number(default_retainage) : null,
      description: description || null,
      schedule_of_values: schedule_of_values ?? [],
      contract_value: contract_value != null ? Number(contract_value) : null,
      inclusions: inclusions || null,
      exclusions: exclusions || null,
      start_date: start_date || null,
      estimated_completion_date: estimated_completion_date || null,
      actual_completion_date: actual_completion_date || null,
      signed_contract_received_date: signed_contract_received_date || null,
      contract_termination_date: contract_termination_date || null,
      private: isPrivate ?? false,
      created_by: session.id,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
