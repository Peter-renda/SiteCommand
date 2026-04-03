import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { getSession } from "@/lib/auth";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; changeOrderId: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: projectId, changeOrderId } = await params;
  const supabase = getSupabase();

  const { data, error } = await supabase
    .from("change_orders")
    .select("*")
    .eq("id", changeOrderId)
    .eq("project_id", projectId)
    .is("deleted_at", null)
    .single();

  if (error || !data) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json(data);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; changeOrderId: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: projectId, changeOrderId } = await params;
  const supabase = getSupabase();
  const body = await req.json();

  const { data, error } = await supabase
    .from("change_orders")
    .update({ ...body, updated_at: new Date().toISOString() })
    .eq("id", changeOrderId)
    .eq("project_id", projectId)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
