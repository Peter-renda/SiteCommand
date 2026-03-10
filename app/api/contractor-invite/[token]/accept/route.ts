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

  if (!username || !password || password.length < 6) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

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

  // Check username not taken
  const { data: existing } = await supabase
    .from("users")
    .select("id")
    .eq("username", username)
    .single();
  if (existing) return NextResponse.json({ error: "Username already taken" }, { status: 409 });

  const password_hash = await bcrypt.hash(password, 10);

  // Create contractor user
  const { data: user, error: userError } = await supabase
    .from("users")
    .insert({
      email: invite.email,
      username,
      password_hash,
      role: "contractor",
    })
    .select("id, email, username, role")
    .single();

  if (userError) return NextResponse.json({ error: userError.message }, { status: 500 });

  // Add to project_contractors
  await supabase.from("project_contractors").insert({
    project_id: invite.project_id,
    user_id: user.id,
    invited_by: null,
  });

  // Mark invite accepted
  await supabase
    .from("contractor_invitations")
    .update({ accepted_at: new Date().toISOString() })
    .eq("id", invite.id);

  // Issue JWT
  const jwtToken = await createToken({
    id: user.id,
    email: user.email,
    username: user.username,
    role: "contractor",
    company_id: null,
    company_role: null,
  });

  const res = NextResponse.json({ redirect: "/contractor" });
  res.cookies.set("token", jwtToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7,
    path: "/",
  });

  return res;
}
