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
    data || { project_id: projectId, enable_always_editable_sov: false, enable_ssov_by_default: false, enable_financial_markup: false }
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

  const payload: Record<string, unknown> = {
    project_id: projectId,
    enable_always_editable_sov: !!body.enable_always_editable_sov,
    updated_by: session.id,
  };

  if ("enable_ssov_by_default" in body) {
    payload.enable_ssov_by_default = !!body.enable_ssov_by_default;
  }
  if ("enable_financial_markup" in body) {
    payload.enable_financial_markup = !!body.enable_financial_markup;
  }

  const { data, error } = await supabase
    .from("commitment_settings")
    .upsert(payload, { onConflict: "project_id" })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
