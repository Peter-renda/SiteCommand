import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { isCompanyAdmin } from "@/lib/project-access";
import { getSupabase } from "@/lib/supabase";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ keyId: string }> }
) {
  const { keyId } = await params;

  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!isCompanyAdmin(session.company_role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  if (!session.company_id) {
    return NextResponse.json({ error: "No company" }, { status: 400 });
  }

  const supabase = getSupabase();

  // Verify the key belongs to this company
  const { data: existing } = await supabase
    .from("api_keys")
    .select("id")
    .eq("id", keyId)
    .eq("company_id", session.company_id)
    .is("revoked_at", null)
    .maybeSingle();

  if (!existing) return NextResponse.json({ error: "Key not found" }, { status: 404 });

  const { error } = await supabase
    .from("api_keys")
    .update({ revoked_at: new Date().toISOString() })
    .eq("id", keyId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}
