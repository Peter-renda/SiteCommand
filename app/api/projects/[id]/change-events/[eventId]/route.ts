import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { getSession } from "@/lib/auth";
import { checkProjectAccess } from "@/lib/permissions";
import { logChangeEventHistory } from "@/lib/change-event-history";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; eventId: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: projectId, eventId } = await params;

  try {
    await checkProjectAccess(session.id, projectId);
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const supabase = getSupabase();

  const { data, error } = await supabase
    .from("change_events")
    .select(`*, line_items:change_event_line_items(*)`)
    .eq("id", eventId)
    .eq("project_id", projectId)
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 404 });
  const [{ count: relatedItemsCount }, { data: referencingChangeOrders }] = await Promise.all([
    supabase
      .from("change_event_related_items")
      .select("id", { count: "exact", head: true })
      .eq("project_id", projectId)
      .eq("change_event_id", eventId),
    supabase
      .from("change_orders")
      .select("id")
      .eq("project_id", projectId)
      .contains("source_change_event_ids", [eventId])
      .is("deleted_at", null)
      .limit(1),
  ]);

  const attachedInstancesCount = (relatedItemsCount ?? 0) + ((referencingChangeOrders ?? []).length > 0 ? 1 : 0);

  return NextResponse.json({
    ...data,
    attached_instances_count: attachedInstancesCount,
    delete_blocked: attachedInstancesCount > 0,
  });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; eventId: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: projectId, eventId } = await params;

  try {
    const { permission } = await checkProjectAccess(session.id, projectId);
    if (permission !== "write") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const supabase = getSupabase();
  const body = await req.json();
  const { data: existingEvent } = await supabase
    .from("change_events")
    .select("title, status, origin, type, change_reason, scope, expecting_revenue, revenue_source, prime_contract, description")
    .eq("id", eventId)
    .eq("project_id", projectId)
    .single();
  const { count: existingLineItemCount } = await supabase
    .from("change_event_line_items")
    .select("id", { count: "exact", head: true })
    .eq("change_event_id", eventId);

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

    await logChangeEventHistory(
      supabase,
      session,
      eventId,
      projectId,
      "Change event line items updated",
      String(existingLineItemCount ?? 0),
      String(body.line_items.length)
    );
  }

  const trackedFields: Array<{ key: string; label: string }> = [
    { key: "title", label: "Title" },
    { key: "status", label: "Status" },
    { key: "origin", label: "Origin" },
    { key: "type", label: "Type" },
    { key: "change_reason", label: "Change Reason" },
    { key: "scope", label: "Scope" },
    { key: "expecting_revenue", label: "Expecting Revenue" },
    { key: "revenue_source", label: "Line Item Revenue Source" },
    { key: "prime_contract", label: "Prime Contract for Markup Estimates" },
    { key: "description", label: "Description" },
  ];

  if (existingEvent) {
    for (const field of trackedFields) {
      const oldValueRaw = existingEvent[field.key as keyof typeof existingEvent];
      const newValueRaw = body[field.key];
      if (newValueRaw === undefined) continue;

      const oldValue =
        oldValueRaw === null || oldValueRaw === undefined || oldValueRaw === ""
          ? "(None)"
          : String(oldValueRaw);
      const newValue =
        newValueRaw === null || newValueRaw === undefined || newValueRaw === ""
          ? "(None)"
          : String(newValueRaw);

      if (oldValue !== newValue) {
        await logChangeEventHistory(
          supabase,
          session,
          eventId,
          projectId,
          `Change event field updated: ${field.label}`,
          oldValue,
          newValue
        );
      }
    }
  }

  return NextResponse.json(data);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; eventId: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: projectId, eventId } = await params;

  try {
    const { permission } = await checkProjectAccess(session.id, projectId);
    if (permission !== "write") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const supabase = getSupabase();

  const [{ count: relatedItemsCount, error: relatedItemsError }, { data: referencingChangeOrders, error: changeOrdersError }] = await Promise.all([
    supabase
      .from("change_event_related_items")
      .select("id", { count: "exact", head: true })
      .eq("project_id", projectId)
      .eq("change_event_id", eventId),
    supabase
      .from("change_orders")
      .select("id")
      .eq("project_id", projectId)
      .contains("source_change_event_ids", [eventId])
      .is("deleted_at", null)
      .limit(1),
  ]);

  if (relatedItemsError) return NextResponse.json({ error: relatedItemsError.message }, { status: 500 });
  if (changeOrdersError) return NextResponse.json({ error: changeOrdersError.message }, { status: 500 });

  if ((relatedItemsCount ?? 0) > 0 || (referencingChangeOrders ?? []).length > 0) {
    return NextResponse.json(
      { error: "This change event has attached instances and cannot be deleted." },
      { status: 409 }
    );
  }

  const { error } = await supabase
    .from("change_events")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", eventId)
    .eq("project_id", projectId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
