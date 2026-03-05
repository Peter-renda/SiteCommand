import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getSupabase } from "@/lib/supabase";
import { createToken } from "@/lib/auth";

export async function POST(req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const { username, password } = await req.json();

  if (!username || !password) {
    return NextResponse.json({ error: "Username and password are required" }, { status: 400 });
  }

  const supabase = getSupabase();

  const { data: invite } = await supabase
    .from("invitations")
    .select("id, email, company_id, accepted_at, expires_at, companies(name, seat_limit, subscription_status)")
    .eq("token", token)
    .single();

  if (!invite) {
    return NextResponse.json({ error: "Invalid invitation" }, { status: 404 });
  }

  if (invite.accepted_at) {
    return NextResponse.json({ error: "Invitation already used" }, { status: 410 });
  }

  if (new Date(invite.expires_at) < new Date()) {
    return NextResponse.json({ error: "Invitation has expired" }, { status: 410 });
  }

  const company = invite.companies as { name: string; seat_limit: number; subscription_status: string } | null;
  if (!company || company.subscription_status !== "active") {
    return NextResponse.json({ error: "Company subscription is not active" }, { status: 403 });
  }

  // Check seat count
  const { count: memberCount } = await supabase
    .from("users")
    .select("id", { count: "exact", head: true })
    .eq("company_id", invite.company_id);

  if ((memberCount ?? 0) >= company.seat_limit) {
    return NextResponse.json({ error: "Seat limit reached" }, { status: 403 });
  }

  // Check username uniqueness
  const { data: existingUser } = await supabase
    .from("users")
    .select("id")
    .or(`email.eq.${invite.email},username.eq.${username}`)
    .maybeSingle();

  if (existingUser) {
    return NextResponse.json({ error: "Email or username already taken" }, { status: 409 });
  }

  const password_hash = await bcrypt.hash(password, 10);

  const { data: newUser, error } = await supabase
    .from("users")
    .insert({
      username,
      email: invite.email,
      password_hash,
      company: company.name,
      role: "user",
      company_id: invite.company_id,
      company_role: "member",
    })
    .select("id")
    .single();

  if (error || !newUser) {
    return NextResponse.json({ error: "Failed to create account" }, { status: 500 });
  }

  // Mark invitation as accepted
  await supabase
    .from("invitations")
    .update({ accepted_at: new Date().toISOString() })
    .eq("id", invite.id);

  const jwtToken = await createToken({
    id: newUser.id,
    email: invite.email,
    username,
    role: "user",
    company_id: invite.company_id,
    company_role: "member",
  });

  const res = NextResponse.json({ redirect: "/dashboard" });
  res.cookies.set("token", jwtToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7,
    path: "/",
  });

  return res;
}
