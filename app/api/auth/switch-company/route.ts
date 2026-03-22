import { NextRequest, NextResponse } from "next/server";
import { getSession, createToken } from "@/lib/auth";
import { getSupabase } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { company_id } = await req.json();
  if (!company_id) return NextResponse.json({ error: "company_id required" }, { status: 400 });

  const supabase = getSupabase();

  // Verify the user is actually a member of the requested company
  const { data: membership } = await supabase
    .from("org_members")
    .select("role")
    .eq("user_id", session.id)
    .eq("org_id", company_id)
    .maybeSingle();

  if (!membership) {
    return NextResponse.json({ error: "Not a member of this company" }, { status: 403 });
  }

  const jwtToken = await createToken({
    id: session.id,
    email: session.email,
    username: session.username,
    role: session.role,
    company_id,
    company_role: membership.role,
    user_type: session.user_type,
  });

  const res = NextResponse.json({ success: true });
  res.cookies.set("token", jwtToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7,
    path: "/",
  });
  return res;
}
