import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { getSession } from "@/lib/auth";

const SUPER_ADMIN_EMAIL = "ptrenda1@gmail.com";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id, role } = await req.json();

  const supabase = getSupabase();

  // Prevent changing the super admin's role
  const { data: target } = await supabase
    .from("users")
    .select("email")
    .eq("id", id)
    .single();

  if (target?.email === SUPER_ADMIN_EMAIL) {
    return NextResponse.json({ error: "Cannot change super admin role" }, { status: 403 });
  }

  const { error } = await supabase.from("users").update({ role }).eq("id", id);

  if (error) return NextResponse.json({ error: "Failed to update role" }, { status: 500 });

  return NextResponse.json({ message: "Role updated" });
}
