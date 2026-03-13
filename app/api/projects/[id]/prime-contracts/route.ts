import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { getSession } from "@/lib/auth";

const SCHEMA_CACHE_ERROR = "schema cache";

async function ensureTables(supabase: ReturnType<typeof getSupabase>) {
  const sql = `
    CREATE TABLE IF NOT EXISTS prime_contracts (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      project_id UUID NOT NULL,
      number TEXT,
      owner_client TEXT,
      title TEXT,
      erp_status TEXT NOT NULL DEFAULT 'Not Ready',
      status TEXT NOT NULL DEFAULT 'Draft',
      executed BOOLEAN NOT NULL DEFAULT false,
      original_contract_amount NUMERIC(15,2) NOT NULL DEFAULT 0,
      approved_change_orders NUMERIC(15,2) NOT NULL DEFAULT 0,
      pending_change_orders NUMERIC(15,2) NOT NULL DEFAULT 0,
      draft_change_orders NUMERIC(15,2) NOT NULL DEFAULT 0,
      invoiced NUMERIC(15,2) NOT NULL DEFAULT 0,
      payments_received NUMERIC(15,2) NOT NULL DEFAULT 0,
      default_retainage NUMERIC(5,2),
      contractor TEXT,
      architect_engineer TEXT,
      description TEXT,
      inclusions TEXT,
      exclusions TEXT,
      start_date DATE,
      estimated_completion_date DATE,
      actual_completion_date DATE,
      signed_contract_received_date DATE,
      contract_termination_date DATE,
      is_private BOOLEAN NOT NULL DEFAULT true,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS prime_contract_sov_items (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      contract_id UUID NOT NULL,
      project_id UUID NOT NULL,
      budget_code TEXT NOT NULL DEFAULT '',
      description TEXT NOT NULL DEFAULT '',
      amount NUMERIC(15,2) NOT NULL DEFAULT 0,
      billed_to_date NUMERIC(15,2) NOT NULL DEFAULT 0,
      sort_order INT NOT NULL DEFAULT 0,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `;

  // Try exec_sql RPC (available in some Supabase projects)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any).rpc("exec_sql", { sql });
  return !error;
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: projectId } = await params;
  const supabase = getSupabase();

  const { data, error } = await supabase
    .from("prime_contracts")
    .select("*, prime_contract_sov_items(*)")
    .eq("project_id", projectId)
    .order("number", { ascending: true });

  if (error) {
    if (error.message.includes(SCHEMA_CACHE_ERROR)) {
      // Attempt auto-setup
      const created = await ensureTables(supabase);
      if (created) {
        // Retry
        const { data: retryData, error: retryError } = await supabase
          .from("prime_contracts")
          .select("*, prime_contract_sov_items(*)")
          .eq("project_id", projectId)
          .order("number", { ascending: true });
        if (!retryError) return NextResponse.json(retryData || []);
      }
      return NextResponse.json({ error: "MISSING_TABLE" }, { status: 503 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(data || []);
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: projectId } = await params;
  const supabase = getSupabase();

  const body = await req.json();
  const {
    number,
    owner_client,
    title,
    status,
    executed,
    default_retainage,
    contractor,
    architect_engineer,
    description,
    inclusions,
    exclusions,
    start_date,
    estimated_completion_date,
    actual_completion_date,
    signed_contract_received_date,
    contract_termination_date,
    is_private,
    sov_items,
  } = body;

  const { data: contract, error: contractError } = await supabase
    .from("prime_contracts")
    .insert({
      project_id: projectId,
      number: number || null,
      owner_client: owner_client || null,
      title: title || null,
      erp_status: "Not Ready",
      status: status || "Draft",
      executed: executed ?? false,
      original_contract_amount: 0,
      approved_change_orders: 0,
      pending_change_orders: 0,
      draft_change_orders: 0,
      invoiced: 0,
      payments_received: 0,
      default_retainage: default_retainage ?? null,
      contractor: contractor || null,
      architect_engineer: architect_engineer || null,
      description: description || null,
      inclusions: inclusions || null,
      exclusions: exclusions || null,
      start_date: start_date || null,
      estimated_completion_date: estimated_completion_date || null,
      actual_completion_date: actual_completion_date || null,
      signed_contract_received_date: signed_contract_received_date || null,
      contract_termination_date: contract_termination_date || null,
      is_private: is_private ?? true,
    })
    .select()
    .single();

  if (contractError) {
    if (contractError.message.includes(SCHEMA_CACHE_ERROR)) {
      // Attempt auto-setup and retry
      const created = await ensureTables(supabase);
      if (created) {
        const { data: retryContract, error: retryError } = await supabase
          .from("prime_contracts")
          .insert({
            project_id: projectId,
            number: number || null,
            owner_client: owner_client || null,
            title: title || null,
            erp_status: "Not Ready",
            status: status || "Draft",
            executed: executed ?? false,
            original_contract_amount: 0,
            approved_change_orders: 0,
            pending_change_orders: 0,
            draft_change_orders: 0,
            invoiced: 0,
            payments_received: 0,
            default_retainage: default_retainage ?? null,
            contractor: contractor || null,
            architect_engineer: architect_engineer || null,
            description: description || null,
            inclusions: inclusions || null,
            exclusions: exclusions || null,
            start_date: start_date || null,
            estimated_completion_date: estimated_completion_date || null,
            actual_completion_date: actual_completion_date || null,
            signed_contract_received_date: signed_contract_received_date || null,
            contract_termination_date: contract_termination_date || null,
            is_private: is_private ?? true,
          })
          .select()
          .single();
        if (retryContract) {
          if (sov_items && sov_items.length > 0) {
            const sovRows = sov_items.map((item: { budget_code?: string; description?: string; amount?: number }, i: number) => ({
              contract_id: retryContract.id,
              project_id: projectId,
              budget_code: item.budget_code || "",
              description: item.description || "",
              amount: item.amount ?? 0,
              billed_to_date: 0,
              sort_order: i,
            }));
            await supabase.from("prime_contract_sov_items").insert(sovRows);
          }
          return NextResponse.json(retryContract);
        }
        if (retryError) return NextResponse.json({ error: retryError.message }, { status: 500 });
      }
      return NextResponse.json({
        error: "The prime_contracts table does not exist yet. Please run migration 036_prime_contracts.sql in your Supabase SQL editor.",
      }, { status: 503 });
    }
    return NextResponse.json({ error: contractError.message }, { status: 500 });
  }

  // Insert SOV items if any
  if (sov_items && sov_items.length > 0) {
    const sovRows = sov_items.map((item: { budget_code?: string; description?: string; amount?: number }, i: number) => ({
      contract_id: contract.id,
      project_id: projectId,
      budget_code: item.budget_code || "",
      description: item.description || "",
      amount: item.amount ?? 0,
      billed_to_date: 0,
      sort_order: i,
    }));
    await supabase.from("prime_contract_sov_items").insert(sovRows);
  }

  return NextResponse.json(contract);
}
