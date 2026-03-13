import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { getSession } from "@/lib/auth";

const CREATE_SQL = `
CREATE TABLE IF NOT EXISTS prime_contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
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
  contract_id UUID NOT NULL REFERENCES prime_contracts(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  budget_code TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  amount NUMERIC(15,2) NOT NULL DEFAULT 0,
  billed_to_date NUMERIC(15,2) NOT NULL DEFAULT 0,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
`;

export async function POST() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = getSupabase();

  // Try using exec_sql RPC if available
  const { error: rpcError } = await (supabase as any).rpc("exec_sql", { sql: CREATE_SQL });

  if (!rpcError) {
    return NextResponse.json({ success: true, message: "Tables created via exec_sql" });
  }

  // If exec_sql not available, try query RPC
  const { error: queryError } = await (supabase as any).rpc("query", { sql: CREATE_SQL });
  if (!queryError) {
    return NextResponse.json({ success: true, message: "Tables created via query" });
  }

  // Return the SQL for manual execution
  return NextResponse.json({
    success: false,
    message: "Auto-migration not available. Please run the following SQL in your Supabase dashboard SQL editor:",
    sql: CREATE_SQL,
    rpcError: rpcError?.message,
    queryError: queryError?.message,
  });
}

export async function GET() {
  return NextResponse.json({
    message: "POST to this endpoint to attempt auto-migration, or copy the SQL below to run in your Supabase dashboard.",
    sql: CREATE_SQL,
  });
}
