import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { getSession } from "@/lib/auth";
import { getProjectRole } from "@/lib/project-access";

type Params = { params: Promise<{ id: string }> };

const DEFAULT_SETTINGS = {
  number_of_change_order_tiers: 2,
  allow_standard_users_create_pccos: false,
  allow_standard_users_create_pcos: true,
  enable_always_editable_sov: false,
  show_financial_markup_on_change_order_pdf: false,
  show_financial_markup_on_invoice_exports: false,
  default_prime_contract_user_id: null,
  default_prime_contract_change_order_user_id: null,
  default_prime_contract_potential_change_order_user_id: null,
};

export async function GET(_req: NextRequest, { params }: Params) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: projectId } = await params;
  const role = await getProjectRole(projectId, session);
  if (!role) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("prime_contract_settings")
    .select("*")
    .eq("project_id", projectId)
    .maybeSingle();

  if (error) return NextResponse.json({ error: "Failed to load settings", detail: error.message }, { status: 500 });

  return NextResponse.json({ ...DEFAULT_SETTINGS, ...(data ?? {}) });
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: projectId } = await params;
  const role = await getProjectRole(projectId, session);
  if (role !== "project_admin") {
    return NextResponse.json({ error: "Only project admins can update these settings" }, { status: 403 });
  }

  const body = await req.json();
  const supabase = getSupabase();

  const payload = {
    project_id: projectId,
    number_of_change_order_tiers: Math.min(4, Math.max(1, Number(body.number_of_change_order_tiers) || 2)),
    allow_standard_users_create_pccos: Boolean(body.allow_standard_users_create_pccos),
    allow_standard_users_create_pcos: Boolean(body.allow_standard_users_create_pcos),
    enable_always_editable_sov: Boolean(body.enable_always_editable_sov),
    show_financial_markup_on_change_order_pdf: Boolean(body.show_financial_markup_on_change_order_pdf),
    show_financial_markup_on_invoice_exports: Boolean(body.show_financial_markup_on_invoice_exports),
    default_prime_contract_user_id: body.default_prime_contract_user_id || null,
    default_prime_contract_change_order_user_id: body.default_prime_contract_change_order_user_id || null,
    default_prime_contract_potential_change_order_user_id:
      body.default_prime_contract_potential_change_order_user_id || null,
    updated_by: session.id,
  };

  const { data, error } = await supabase
    .from("prime_contract_settings")
    .upsert(payload, { onConflict: "project_id" })
    .select("*")
    .single();

  if (error) return NextResponse.json({ error: "Failed to update settings", detail: error.message }, { status: 500 });
  return NextResponse.json(data);
}
