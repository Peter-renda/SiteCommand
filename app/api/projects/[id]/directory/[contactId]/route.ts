import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { getSession } from "@/lib/auth";
import { logActivity } from "@/lib/activity";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; contactId: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: projectId, contactId } = await params;
  const body = await req.json();

  const allowed = ["first_name", "last_name", "email", "phone", "company", "permission", "group_name", "notes"];
  const update: Record<string, unknown> = {};
  for (const key of allowed) {
    if (key in body) update[key] = body[key] || null;
  }

  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("directory_contacts")
    .update(update)
    .eq("id", contactId)
    .eq("project_id", projectId)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  const contactName = data.company || [data.first_name, data.last_name].filter(Boolean).join(" ") || "contact";
  await logActivity(supabase, { projectId, userId: session.id, type: "contact_updated", description: `Updated contact: ${contactName}` });
  return NextResponse.json(data);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; contactId: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: projectId, contactId } = await params;
  const supabase = getSupabase();
  const { data: contact } = await supabase.from("directory_contacts").select("first_name, last_name, company").eq("id", contactId).single();

  const { error } = await supabase
    .from("directory_contacts")
    .delete()
    .eq("id", contactId)
    .eq("project_id", projectId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  const contactName = contact?.company || [contact?.first_name, contact?.last_name].filter(Boolean).join(" ") || "contact";
  await logActivity(supabase, { projectId, userId: session.id, type: "contact_removed", description: `Removed contact: ${contactName}` });
  return NextResponse.json({ ok: true });
}
