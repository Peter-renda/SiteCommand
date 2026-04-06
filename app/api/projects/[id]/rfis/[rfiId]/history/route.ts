import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { getSession } from "@/lib/auth";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; rfiId: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: projectId, rfiId } = await params;
  const supabase = getSupabase();

  const { data: rfi } = await supabase
    .from("rfis")
    .select("id, rfi_number, created_at, created_by")
    .eq("id", rfiId)
    .eq("project_id", projectId)
    .single();
  if (!rfi) return NextResponse.json({ error: "RFI not found" }, { status: 404 });

  const { data, error } = await supabase
    .from("rfi_change_history")
    .select("id, action, from_value, to_value, changed_by_name, changed_by_company, created_at")
    .eq("rfi_id", rfiId)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const history = data ?? [];
  const hasCreatedEntry = history.some((entry) => entry.action === "Created RFI");
  if (hasCreatedEntry) return NextResponse.json(history);

  let changedByName: string | null = null;
  let changedByCompany: string | null = null;

  if (rfi.created_by) {
    const { data: user } = await supabase
      .from("users")
      .select("first_name, last_name, username, company_id")
      .eq("id", rfi.created_by)
      .single();

    if (user) {
      changedByName = [user.first_name, user.last_name].filter(Boolean).join(" ") || user.username || null;
      if (user.company_id) {
        const { data: company } = await supabase
          .from("companies")
          .select("name")
          .eq("id", user.company_id)
          .single();
        changedByCompany = company?.name ?? null;
      }
    }
  }

  return NextResponse.json([
    ...history,
    {
      id: `synthetic-created-${rfi.id}`,
      action: "Created RFI",
      from_value: null,
      to_value: `RFI #${rfi.rfi_number}`,
      changed_by_name: changedByName,
      changed_by_company: changedByCompany,
      created_at: rfi.created_at,
    },
  ]);
}
