import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getSupabase } from "@/lib/supabase";

const ADMIN_EMAIL = "ptrenda1@gmail.com";

export async function POST(req: NextRequest) {
  const supabase = getSupabase();
  const { username, email, password, company } = await req.json();

  if (!username || !email || !password || !company) {
    return NextResponse.json(
      { error: "All fields are required" },
      { status: 400 }
    );
  }

  const { data: existing } = await supabase
    .from("users")
    .select("id")
    .or(`email.eq.${email},username.eq.${username}`)
    .maybeSingle();

  if (existing) {
    return NextResponse.json(
      { error: "Email or username already taken" },
      { status: 409 }
    );
  }

  const password_hash = await bcrypt.hash(password, 10);
  const isAdmin = email === ADMIN_EMAIL;

  const { error } = await supabase.from("users").insert({
    username,
    email,
    password_hash,
    company,
    approved: isAdmin,
    role: isAdmin ? "admin" : "user",
  });

  if (error) {
    return NextResponse.json(
      { error: "Failed to create account" },
      { status: 500 }
    );
  }

  return NextResponse.json({
    message: isAdmin
      ? "Account created successfully"
      : "Account created. Awaiting admin approval.",
    approved: isAdmin,
  });
}
