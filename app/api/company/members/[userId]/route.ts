import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { getSession } from "@/lib/auth";
import { isCompanyAdmin } from "@/lib/project-access";

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ userId: string }> }) {
  const session = await getSession();
  if (!session || !isCompanyAdmin(session.company_role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { userId } = await params;

  if (userId === session.id) {
    return NextResponse.json({ error: "Cannot remove yourself" }, { status: 400 });
  }

  const supabase = getSupabase();

  const { data: target } = await supabase
    .from("users")
    .select("id, company_id, company_role")
    .eq("id", userId)
    .single();

  if (!target || target.company_id !== session.company_id) {
    return NextResponse.json({ error: "User not found in your company" }, { status: 404 });
  }

  // Only the Super Admin can remove or demote other admins.
  // A regular admin cannot remove another admin.
  if (
    (target.company_role === "admin" || target.company_role === "super_admin") &&
    session.company_role !== "super_admin"
  ) {
    return NextResponse.json(
      { error: "Only the Super Admin can remove other Admins" },
      { status: 403 }
    );
  }

  // Prevent removal of the super_admin (billing owner) entirely —
  // they must transfer ownership before being removed.
  if (target.company_role === "super_admin") {
    return NextResponse.json(
      { error: "Cannot remove the Super Admin. Transfer ownership first." },
      { status: 403 }
    );
  }

  await supabase
    .from("users")
    .update({ company_id: null, company_role: null })
    .eq("id", userId);

  return NextResponse.json({ success: true });
}
