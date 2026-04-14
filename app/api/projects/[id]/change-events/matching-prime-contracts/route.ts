import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { getSession } from "@/lib/auth";
import { checkProjectAccess } from "@/lib/permissions";

// GET /api/projects/[id]/change-events/matching-prime-contracts?eventIds=id1,id2,...
// Returns unapproved PRIME potential change orders split into those whose budget codes
// overlap with selected change event line items, and all remaining unapproved PCOs.
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

  // Fetch all prime change orders (PCOs) for this project. Keep only unapproved.
  const { data: changeOrders, error: changeOrdersError } = await supabase
    .from("change_orders")
    .select("id, number, title, status, contract_name, budget_codes")
    .eq("project_id", projectId)
    .eq("type", "prime")
    .is("deleted_at", null)
    .order("number", { ascending: false });

  if (changeOrdersError)
    return NextResponse.json({ error: changeOrdersError.message }, { status: 500 });

  const unapprovedPcos = (changeOrders ?? []).filter(
    (co) => String(co.status ?? "").trim().toLowerCase() !== "approved"
  );

  if (unapprovedPcos.length === 0)
    return NextResponse.json({ matching: [], all: [] });

  // If no event IDs provided, return all unapproved PCOs as non-matching
  if (eventIds.length === 0)
    return NextResponse.json({ matching: [], all: unapprovedPcos });

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
    return NextResponse.json({ matching: [], all: unapprovedPcos });

  const matching = unapprovedPcos.filter((co) =>
    Array.isArray(co.budget_codes) &&
    co.budget_codes.some((code) => eventBudgetCodes.has(code))
  );
  const all = unapprovedPcos.filter((co) => !matching.some((m) => m.id === co.id));

  return NextResponse.json({ matching, all });
}
