import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { getSession } from "@/lib/auth";
import { checkProjectAccess } from "@/lib/permissions";

// GET /api/projects/[id]/change-events/matching-prime-contracts?eventIds=id1,id2,...
// Returns prime contracts split into those whose SOV budget codes overlap with the
// selected change event line items, and all remaining contracts.
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: projectId } = await params;

  try {
    await checkProjectAccess(session.id, projectId);
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const eventIds = (req.nextUrl.searchParams.get("eventIds") ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  const supabase = getSupabase();

  // Fetch all prime contracts for this project
  const { data: contracts, error: contractsError } = await supabase
    .from("prime_contracts")
    .select("id, contract_number, title")
    .eq("project_id", projectId)
    .is("deleted_at", null)
    .order("contract_number", { ascending: true });

  if (contractsError)
    return NextResponse.json({ error: contractsError.message }, { status: 500 });

  if (!contracts || contracts.length === 0)
    return NextResponse.json({ matching: [], all: [] });

  // If no event IDs provided, return all contracts as non-matching
  if (eventIds.length === 0)
    return NextResponse.json({ matching: [], all: contracts });

  // Fetch budget codes from the selected change event line items
  const { data: lineItems } = await supabase
    .from("change_event_line_items")
    .select("budget_code")
    .in("change_event_id", eventIds)
    .not("budget_code", "is", null);

  const eventBudgetCodes = new Set(
    (lineItems ?? []).map((li) => li.budget_code).filter(Boolean)
  );

  if (eventBudgetCodes.size === 0)
    return NextResponse.json({ matching: [], all: contracts });

  // Fetch SOV items for all contracts in this project that have matching budget codes
  const { data: sovItems } = await supabase
    .from("prime_contract_sov_items")
    .select("prime_contract_id, budget_code")
    .eq("project_id", projectId)
    .in("budget_code", Array.from(eventBudgetCodes));

  const matchingContractIds = new Set(
    (sovItems ?? []).map((s) => s.prime_contract_id).filter(Boolean)
  );

  const matching = contracts.filter((c) => matchingContractIds.has(c.id));
  const all = contracts.filter((c) => !matchingContractIds.has(c.id));

  return NextResponse.json({ matching, all });
}
