import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { getSession } from "@/lib/auth";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string; docId: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: projectId, docId } = await params;
  const supabase = getSupabase();

  const { data } = await supabase
    .from("document_tracking")
    .select("id")
    .eq("document_id", docId)
    .eq("project_id", projectId)
    .eq("user_id", session.id)
    .maybeSingle();

  return NextResponse.json({ tracking: !!data });
}

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string; docId: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: projectId, docId } = await params;
  const supabase = getSupabase();

  const { data: existing } = await supabase
    .from("document_tracking")
    .select("id")
    .eq("document_id", docId)
    .eq("project_id", projectId)
    .eq("user_id", session.id)
    .maybeSingle();

  if (existing) {
    await supabase
      .from("document_tracking")
      .delete()
      .eq("id", existing.id);
    return NextResponse.json({ tracking: false });
  }

  await supabase.from("document_tracking").insert({
    document_id: docId,
    project_id: projectId,
    user_id: session.id,
    user_email: session.email,
  });

  return NextResponse.json({ tracking: true });
}
