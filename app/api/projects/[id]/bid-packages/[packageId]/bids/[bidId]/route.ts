import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { getSession } from "@/lib/auth";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; packageId: string; bidId: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: projectId, packageId, bidId } = await params;
  const supabase = getSupabase();

  const body = await req.json();
  const { status, base_amount, notes, submitted_at } = body;

  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (status !== undefined) updates.status = status;
  if (base_amount !== undefined) updates.base_amount = base_amount;
  if (notes !== undefined) updates.notes = notes;
  if (submitted_at !== undefined) updates.submitted_at = submitted_at;

  const { data, error } = await supabase
    .from("bids")
    .update(updates)
    .eq("id", bidId)
    .eq("bid_package_id", packageId)
    .eq("project_id", projectId)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; packageId: string; bidId: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: projectId, packageId, bidId } = await params;
  const supabase = getSupabase();

  const { error } = await supabase
    .from("bids")
    .delete()
    .eq("id", bidId)
    .eq("bid_package_id", packageId)
    .eq("project_id", projectId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
