import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { getSession } from "@/lib/auth";

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ userId: string }> }) {
  const session = await getSession();
  if (!session || session.company_role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { userId } = await params;

  if (userId === session.id) {
    return NextResponse.json({ error: "Cannot remove yourself" }, { status: 400 });
  }

  const supabase = getSupabase();

  const { data: target } = await supabase
    .from("users")
    .select("id, company_id")
    .eq("id", userId)
    .single();

  if (!target || target.company_id !== session.company_id) {
    return NextResponse.json({ error: "User not found in your company" }, { status: 404 });
  }

  await supabase
    .from("users")
    .update({ company_id: null, company_role: null })
    .eq("id", userId);

  return NextResponse.json({ success: true });
}
