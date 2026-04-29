import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { getSession } from "@/lib/auth";
import { requireToolLevel } from "@/lib/tool-permissions";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; contractId: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: projectId, contractId } = await params;
  const denied = await requireToolLevel(session, projectId, "prime_contracts", "admin");
  if (denied) return denied;

  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("prime_contract_change_history")
    .select("*")
    .eq("project_id", projectId)
    .eq("prime_contract_id", contractId)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}
