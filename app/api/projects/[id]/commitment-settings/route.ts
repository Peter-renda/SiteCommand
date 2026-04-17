import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { getSession } from "@/lib/auth";
import { requireToolLevel } from "@/lib/tool-permissions";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: projectId } = await params;
  const denied = await requireToolLevel(session, projectId, "commitments", "read_only");
  if (denied) return denied;

  const supabase = getSupabase();

  const { data, error } = await supabase
    .from("commitment_settings")
    .select("*")
    .eq("project_id", projectId)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(
    data || {
      project_id: projectId,
      number_of_change_order_tiers: 1,
      allow_standard_users_create_ccos: false,
      allow_standard_users_create_pcos: false,
      enable_field_initiated_change_orders: false,
      enable_always_editable_sov: false,
      enable_financial_markup: false,
    }
  );
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: projectId } = await params;
  const denied = await requireToolLevel(session, projectId, "commitments", "admin");
  if (denied) return denied;

  const supabase = getSupabase();
  const body = await req.json();

  const tiers = Math.min(3, Math.max(1, Number(body.number_of_change_order_tiers) || 1));
  const allowStandardUsersCreateCcos = tiers === 1 ? Boolean(body.allow_standard_users_create_ccos) : false;
  const allowStandardUsersCreatePcos = tiers > 1 ? Boolean(body.allow_standard_users_create_pcos) : false;
  const enableFieldInitiated =
    tiers > 1 && allowStandardUsersCreatePcos ? Boolean(body.enable_field_initiated_change_orders) : false;

  const payload = {
    project_id: projectId,
    number_of_change_order_tiers: tiers,
    allow_standard_users_create_ccos: allowStandardUsersCreateCcos,
    allow_standard_users_create_pcos: allowStandardUsersCreatePcos,
    enable_field_initiated_change_orders: enableFieldInitiated,
    enable_always_editable_sov: !!body.enable_always_editable_sov,
    enable_financial_markup: !!body.enable_financial_markup,
    updated_by: session.id,
  };

  const { data, error } = await supabase
    .from("commitment_settings")
    .upsert(payload, { onConflict: "project_id" })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
