import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getSupabase } from "@/lib/supabase";
import { createToken } from "@/lib/auth";

export async function POST(req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const { username, password, existingAccount } = await req.json();

  if (!password) {
    return NextResponse.json({ error: "Password is required" }, { status: 400 });
  }
  if (!existingAccount && !username) {
    return NextResponse.json({ error: "Username is required" }, { status: 400 });
  }

  const supabase = getSupabase();

  const { data: invite } = await supabase
    .from("invitations")
    .select(`
      id, email, company_id, accepted_at, expires_at,
      invitation_type, project_id, project_role, invited_role,
      companies(name, seat_limit)
    `)
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

  const company = invite.companies as unknown as {
    name: string;
    seat_limit: number;
  } | null;

  if (!company) {
    return NextResponse.json({ error: "Company not found" }, { status: 403 });
  }

  const isExternal = invite.invitation_type === "external";

  // Internal invites consume a seat
  if (!isExternal) {
    const { count: memberCount } = await supabase
      .from("users")
      .select("id", { count: "exact", head: true })
      .eq("company_id", invite.company_id);

    if (company.seat_limit > 0 && (memberCount ?? 0) >= company.seat_limit) {
      return NextResponse.json({ error: "Seat limit reached" }, { status: 403 });
    }
  }

  // ── Existing account: log in and grant access ──────────────────────────────
  if (existingAccount) {
    const { data: user } = await supabase
      .from("users")
      .select("id, username, email, role, company_id, company_role, user_type, password_hash")
      .eq("email", invite.email)
      .maybeSingle();

    if (!user) {
      return NextResponse.json({ error: "No account found for this email" }, { status: 404 });
    }

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return NextResponse.json({ error: "Incorrect password" }, { status: 401 });
    }

    // Grant project access
    if (invite.project_id) {
      await supabase.from("project_memberships").upsert(
        {
          project_id: invite.project_id,
          user_id: user.id,
          company_id: invite.company_id,
          role: invite.project_role ?? "external_viewer",
        },
        { onConflict: "project_id,user_id" }
      );
    }

    await supabase.from("invitations").update({ accepted_at: new Date().toISOString() }).eq("id", invite.id);

    const jwtToken = await createToken({
      id: user.id,
      email: user.email,
      username: user.username,
      role: user.role,
      company_id: user.company_id,
      company_role: user.company_role,
      user_type: user.user_type,
    });

    const redirect = isExternal ? "/subcontractor" : "/dashboard";
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

  // ── New account: check uniqueness then create ────────────────────────────────
  const { data: existingUser } = await supabase
    .from("users")
    .select("id")
    .or(`email.eq.${invite.email},username.eq.${username}`)
    .maybeSingle();

  if (existingUser) {
    return NextResponse.json({ error: "Email or username already taken" }, { status: 409 });
  }

  const password_hash = await bcrypt.hash(password, 10);

  if (isExternal) {
    // ---------------------------------------------------------------
    // External collaborator (subcontractor) flow
    //   - No company affiliation: company_id = null, company_role = null
    //   - user_type = 'external'
    //   - A project_memberships row scopes them to one project only
    // ---------------------------------------------------------------
    const { data: newUser, error } = await supabase
      .from("users")
      .insert({
        username,
        email: invite.email,
        password_hash,
        role: "user",
        company_id: null,
        company_role: null,
        user_type: "external",
      })
      .select("id")
      .single();

    if (error || !newUser) {
      return NextResponse.json({ error: "Failed to create account" }, { status: 500 });
    }

    // Grant scoped read access to exactly the invited project
    if (invite.project_id) {
      await supabase.from("project_memberships").insert({
        project_id: invite.project_id,
        user_id: newUser.id,
        company_id: invite.company_id,
        role: invite.project_role ?? "external_viewer",
        // allowed_sections defaults to NULL = access to all sections
        // (can be restricted via the project members UI after the fact)
      });
    }

    await supabase
      .from("invitations")
      .update({ accepted_at: new Date().toISOString() })
      .eq("id", invite.id);

    const jwtToken = await createToken({
      id: newUser.id,
      email: invite.email,
      username,
      role: "user",
      company_id: null,
      company_role: null,
      user_type: "external",
    });

    // External users land on the dedicated subcontractor portal
    const res = NextResponse.json({ redirect: "/subcontractor" });
    res.cookies.set("token", jwtToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    });
    return res;
  }

  // ---------------------------------------------------------------
  // Internal (company member) flow
  //   Uses invited_role from the invitation so super_admins can
  //   invite new admins as well as regular members.
  // ---------------------------------------------------------------
  const assignedRole: string = invite.invited_role ?? "member";

  const { data: newUser, error } = await supabase
    .from("users")
    .insert({
      username,
      email: invite.email,
      password_hash,
      company: company.name,
      role: "user",
      company_id: invite.company_id,
      company_role: assignedRole,
      user_type: "internal",
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
    company_role: assignedRole,
    user_type: "internal",
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
