import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getSupabase } from "@/lib/supabase";
import { createToken } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const supabase = getSupabase();
  const { email, password } = await req.json();

  const { data: user } = await supabase
    .from("users")
    .select("id, email, username, role, company_id, company_role, password_hash")
    .eq("email", email)
    .single();

  if (!user) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  const token = await createToken({
    id: user.id,
    email: user.email,
    username: user.username,
    role: user.role ?? "user",
    company_id: user.company_id ?? null,
    company_role: user.company_role ?? null,
  });

  let redirect: string | null = null;
  if (user.role !== "admin") {
    if (!user.company_id) {
      // No company at all — send to pricing to pick a plan
      redirect = "/pricing";
    } else if (user.company_role === "admin") {
      // Company owner — check subscription status
      const { data: company } = await supabase
        .from("companies")
        .select("subscription_status")
        .eq("id", user.company_id)
        .single();

      if (!company || company.subscription_status !== "active") {
        redirect = "/pricing";
      }
    }
    // Invited members always go to /dashboard
  }

  const res = NextResponse.json({ message: "Logged in", redirect });
  res.cookies.set("token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7,
    path: "/",
  });

  return res;
}
