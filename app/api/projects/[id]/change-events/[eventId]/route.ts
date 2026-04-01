import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { getSession } from "@/lib/auth";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; eventId: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: projectId, eventId } = await params;
  const supabase = getSupabase();

  const { data, error } = await supabase
    .from("change_events")
    .select(`*, line_items:change_event_line_items(*)`)
    .eq("id", eventId)
    .eq("project_id", projectId)
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 404 });
  return NextResponse.json(data);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; eventId: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: projectId, eventId } = await params;
  const supabase = getSupabase();
  const body = await req.json();

  const { data, error } = await supabase
    .from("change_events")
    .update({
      title: body.title,
      status: body.status,
      origin: body.origin ?? null,
      type: body.type ?? null,
      change_reason: body.change_reason ?? null,
      scope: body.scope ?? null,
      expecting_revenue: body.expecting_revenue ?? false,
      revenue_source: body.revenue_source ?? null,
      prime_contract: body.prime_contract ?? null,
      description: body.description ?? null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", eventId)
    .eq("project_id", projectId)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Replace line items: delete existing, insert new
  if (Array.isArray(body.line_items)) {
    await supabase
      .from("change_event_line_items")
      .delete()
      .eq("change_event_id", eventId);

    if (body.line_items.length > 0) {
      const { error: liError } = await supabase
        .from("change_event_line_items")
        .insert(
          body.line_items.map((li: Record<string, unknown>) => ({
            change_event_id: eventId,
            budget_code: li.budget_code ?? null,
            description: li.description ?? null,
            vendor: li.vendor ?? null,
            contract_number: li.contract_number ?? null,
            unit_of_measure: li.unit_of_measure ?? null,
            rev_unit_qty: li.rev_unit_qty ?? null,
            rev_unit_cost: li.rev_unit_cost ?? null,
            rev_rom: li.rev_rom ?? null,
            cost_unit_qty: li.cost_unit_qty ?? null,
            cost_unit_cost: li.cost_unit_cost ?? null,
            cost_rom: li.cost_rom ?? null,
          }))
        );
      if (liError) return NextResponse.json({ error: liError.message }, { status: 500 });
    }
  }

  return NextResponse.json(data);
}
