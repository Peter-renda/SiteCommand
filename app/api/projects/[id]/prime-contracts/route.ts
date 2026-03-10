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
    owner,
    contractor,
    contract_value,
    executed_date,
    start_date,
    completion_date,
    description,
  } = body;

  const { data, error } = await supabase
    .from("prime_contracts")
    .insert({
      project_id: projectId,
      contract_number: nextNumber,
      title: (title ?? "").toString().trim() || "Untitled",
      status: status || "draft",
      owner: owner || null,
      contractor: contractor || null,
      contract_value: contract_value != null ? Number(contract_value) : null,
      executed_date: executed_date || null,
      start_date: start_date || null,
      completion_date: completion_date || null,
      description: description || null,
      created_by: session.id,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
