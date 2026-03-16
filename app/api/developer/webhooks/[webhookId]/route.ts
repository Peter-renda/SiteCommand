import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { isCompanyAdmin } from "@/lib/project-access";
import { getSupabase } from "@/lib/supabase";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ webhookId: string }> }
) {
  const { webhookId } = await params;

  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!isCompanyAdmin(session.company_role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  if (!session.company_id) {
    return NextResponse.json({ error: "No company" }, { status: 400 });
  }

  const supabase = getSupabase();

  const { data: existing } = await supabase
    .from("webhooks")
    .select("id")
    .eq("id", webhookId)
    .eq("company_id", session.company_id)
    .maybeSingle();

  if (!existing) return NextResponse.json({ error: "Webhook not found" }, { status: 404 });

  const body = await req.json();
  const updates: Record<string, unknown> = {};
  if (typeof body.is_active === "boolean") updates.is_active = body.is_active;
  if (body.url) updates.url = body.url;
  if (body.name) updates.name = body.name;
  if (Array.isArray(body.events)) updates.events = body.events;

  const { data, error } = await supabase
    .from("webhooks")
    .update(updates)
    .eq("id", webhookId)
    .select("id, name, url, events, is_active, created_at")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(data);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ webhookId: string }> }
) {
  const { webhookId } = await params;

  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!isCompanyAdmin(session.company_role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  if (!session.company_id) {
    return NextResponse.json({ error: "No company" }, { status: 400 });
  }

  const supabase = getSupabase();

  const { data: existing } = await supabase
    .from("webhooks")
    .select("id")
    .eq("id", webhookId)
    .eq("company_id", session.company_id)
    .maybeSingle();

  if (!existing) return NextResponse.json({ error: "Webhook not found" }, { status: 404 });

  const { error } = await supabase.from("webhooks").delete().eq("id", webhookId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}
