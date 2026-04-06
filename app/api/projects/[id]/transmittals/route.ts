import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { getSession } from "@/lib/auth";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: projectId } = await params;
  const supabase = getSupabase();

  const { data, error } = await supabase
    .from("transmittals")
    .select("*")
    .eq("project_id", projectId)
    .order("transmittal_number", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data || []);
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: projectId } = await params;
  const supabase = getSupabase();

  const { data: maxRow } = await supabase
    .from("transmittals")
    .select("transmittal_number")
    .eq("project_id", projectId)
    .order("transmittal_number", { ascending: false })
    .limit(1)
    .single();

  const nextNumber = (maxRow?.transmittal_number ?? 0) + 1;

  const body = await req.json();
  const {
    subject,
    to_id,
    cc_contacts,
    sent_via,
    private: isPrivate,
    submitted_for,
    action_as_noted,
    due_by,
    sent_date,
    items,
    comments,
  } = body;

  const { data, error } = await supabase
    .from("transmittals")
    .insert({
      project_id: projectId,
      transmittal_number: nextNumber,
      subject: subject || null,
      to_id: to_id || null,
      cc_contacts: cc_contacts ?? [],
      sent_via: sent_via || null,
      private: isPrivate ?? false,
      submitted_for: submitted_for ?? [],
      action_as_noted: action_as_noted ?? [],
      due_by: due_by || null,
      sent_date: sent_date || null,
      items: items ?? [],
      comments: comments || null,
      created_by: session.id,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
