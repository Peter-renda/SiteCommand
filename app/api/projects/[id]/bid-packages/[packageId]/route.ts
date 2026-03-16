import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { getSession } from "@/lib/auth";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; packageId: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: projectId, packageId } = await params;
  const supabase = getSupabase();

  const { data: pkg, error: pkgError } = await supabase
    .from("bid_packages")
    .select("*")
    .eq("id", packageId)
    .eq("project_id", projectId)
    .single();

  if (pkgError) return NextResponse.json({ error: pkgError.message }, { status: 404 });

  const { data: bids, error: bidsError } = await supabase
    .from("bids")
    .select("*")
    .eq("bid_package_id", packageId)
    .order("created_at", { ascending: true });

  if (bidsError) return NextResponse.json({ error: bidsError.message }, { status: 500 });

  return NextResponse.json({ ...pkg, bids: bids ?? [] });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; packageId: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: projectId, packageId } = await params;
  const supabase = getSupabase();

  const body = await req.json();
  const { name, description, scope_of_work, due_date, status } = body;

  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (name !== undefined) updates.name = name;
  if (description !== undefined) updates.description = description;
  if (scope_of_work !== undefined) updates.scope_of_work = scope_of_work;
  if (due_date !== undefined) updates.due_date = due_date || null;
  if (status !== undefined) updates.status = status;

  const { data, error } = await supabase
    .from("bid_packages")
    .update(updates)
    .eq("id", packageId)
    .eq("project_id", projectId)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; packageId: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: projectId, packageId } = await params;
  const supabase = getSupabase();

  const { error } = await supabase
    .from("bid_packages")
    .delete()
    .eq("id", packageId)
    .eq("project_id", projectId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
