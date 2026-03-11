import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { getSession } from "@/lib/auth";

const SUPER_ADMIN_EMAIL = "ptrenda1@gmail.com";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id, company_role } = await req.json();

  if (!["admin", "member"].includes(company_role)) {
    return NextResponse.json({ error: "Invalid company_role" }, { status: 400 });
  }

  const supabase = getSupabase();

  const { data: target } = await supabase
    .from("users")
    .select("email, company_id")
    .eq("id", id)
    .single();

  if (!target) return NextResponse.json({ error: "User not found" }, { status: 404 });
  if (target.email === SUPER_ADMIN_EMAIL) {
    return NextResponse.json({ error: "Cannot change super admin role" }, { status: 403 });
  }
  if (!target.company_id) {
    return NextResponse.json({ error: "User has no company" }, { status: 400 });
  }

  const { error } = await supabase.from("users").update({ company_role }).eq("id", id);
  if (error) return NextResponse.json({ error: "Failed to update company role" }, { status: 500 });

  return NextResponse.json({ success: true });
}
