import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getSupabase } from "@/lib/supabase";
import { createToken } from "@/lib/auth";

const ADMIN_EMAIL = "ptrenda1@gmail.com";

export async function POST(req: NextRequest) {
  const supabase = getSupabase();
  const { firstName, lastName, email, password, company } = await req.json();

  if (!firstName || !lastName || !email || !password || !company) {
    return NextResponse.json(
      { error: "All fields are required" },
      { status: 400 }
    );
  }

  const { data: existing } = await supabase
    .from("users")
    .select("id")
    .eq("email", email)
    .maybeSingle();

  if (existing) {
    return NextResponse.json(
      { error: "An account with this email already exists" },
      { status: 409 }
    );
  }

  const password_hash = await bcrypt.hash(password, 10);
  const isAdmin = email === ADMIN_EMAIL;
  const displayName = `${firstName} ${lastName}`;

  // Create company for non-system-admin signups
  let companyId: string | null = null;
  if (!isAdmin) {
    const { data: newCompany, error: companyError } = await supabase
      .from("companies")
      .insert({ name: company })
      .select("id")
      .single();

    if (companyError || !newCompany) {
      return NextResponse.json(
        { error: "Failed to create company" },
        { status: 500 }
      );
    }
    companyId = newCompany.id;
  }

  const { data: newUser, error } = await supabase
    .from("users")
    .insert({
      username: displayName,
      first_name: firstName,
      last_name: lastName,
      email,
      password_hash,
      company,
      role: isAdmin ? "admin" : "user",
      company_id: companyId,
      company_role: isAdmin ? null : "admin",
    })
    .select("id")
    .single();

  if (error || !newUser) {
    return NextResponse.json(
      { error: "Failed to create account" },
      { status: 500 }
    );
  }

  const token = await createToken({
    id: newUser.id,
    email,
    username: displayName,
    role: isAdmin ? "admin" : "user",
    company_id: companyId,
    company_role: isAdmin ? null : "admin",
  });

  const res = NextResponse.json({ success: true });
  res.cookies.set("token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7,
    path: "/",
  });

  return res;
}
