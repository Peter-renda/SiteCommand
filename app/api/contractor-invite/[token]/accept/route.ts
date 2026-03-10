import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getSupabase } from "@/lib/supabase";
import { createToken } from "@/lib/auth";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  const { username, password } = await req.json();

  if (!password) return NextResponse.json({ error: "Password is required" }, { status: 400 });

  const supabase = getSupabase();

  // Validate invite
  const { data: invite } = await supabase
    .from("contractor_invitations")
    .select("id, email, project_id, accepted_at, expires_at")
    .eq("token", token)
    .single();

  if (!invite) return NextResponse.json({ error: "Invalid invitation" }, { status: 404 });
  if (invite.accepted_at) return NextResponse.json({ error: "Invitation already accepted" }, { status: 410 });
  if (new Date(invite.expires_at) < new Date()) return NextResponse.json({ error: "Invitation has expired" }, { status: 410 });

  // Check if user already exists with this email
  const { data: existingUser } = await supabase
    .from("users")
    .select("id, email, username, role, company_id, company_role, password_hash")
    .eq("email", invite.email)
    .single();

  let userId: string;
  let tokenPayload: { id: string; email: string; username: string; role: string; company_id: string | null; company_role: string | null };

  if (existingUser) {
    // Existing account — verify password
    const valid = await bcrypt.compare(password, existingUser.password_hash);
    if (!valid) return NextResponse.json({ error: "Incorrect password" }, { status: 401 });

    userId = existingUser.id;
    tokenPayload = {
      id: existingUser.id,
      email: existingUser.email,
      username: existingUser.username,
      role: existingUser.role ?? "user",
      company_id: existingUser.company_id ?? null,
      company_role: existingUser.company_role ?? null,
    };
  } else {
    // New account — username required
    if (!username || password.length < 6) {
      return NextResponse.json({ error: "Username and password (min 6 chars) are required" }, { status: 400 });
    }

    const { data: taken } = await supabase.from("users").select("id").eq("username", username).single();
    if (taken) return NextResponse.json({ error: "Username already taken" }, { status: 409 });

    const password_hash = await bcrypt.hash(password, 10);
    const { data: newUser, error: userError } = await supabase
      .from("users")
      .insert({ email: invite.email, username, password_hash, role: "contractor" })
      .select("id, email, username, role")
      .single();

    if (userError) return NextResponse.json({ error: userError.message }, { status: 500 });

    userId = newUser.id;
    tokenPayload = { id: newUser.id, email: newUser.email, username: newUser.username, role: "contractor", company_id: null, company_role: null };
  }

  // Add to project_contractors (ignore duplicate)
  await supabase.from("project_contractors").upsert(
    { project_id: invite.project_id, user_id: userId },
    { onConflict: "project_id,user_id", ignoreDuplicates: true }
  );

  // Mark invite accepted
  await supabase.from("contractor_invitations").update({ accepted_at: new Date().toISOString() }).eq("id", invite.id);

  // Issue JWT
  const jwtToken = await createToken(tokenPayload);

  // Redirect: existing users go to their normal home, new contractor accounts go to /contractor
  const redirect = existingUser
    ? (existingUser.role === "admin" ? "/dashboard" : existingUser.company_id ? "/dashboard" : "/contractor")
    : "/contractor";

  const res = NextResponse.json({ redirect });
  res.cookies.set("token", jwtToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7,
    path: "/",
  });

  return res;
}
