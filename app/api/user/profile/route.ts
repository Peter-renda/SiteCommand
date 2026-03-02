import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getSupabase } from "@/lib/supabase";
import { getSession } from "@/lib/auth";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("users")
    .select("id, username, email, phone")
    .eq("id", session.id)
    .single();

  if (error || !data) return NextResponse.json({ error: "User not found" }, { status: 404 });
  return NextResponse.json(data);
}

export async function PATCH(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { phone, currentPassword, newPassword } = await req.json();
  const supabase = getSupabase();

  const update: Record<string, unknown> = {};

  if (phone !== undefined) {
    update.phone = phone || null;
  }

  if (newPassword) {
    if (!currentPassword) {
      return NextResponse.json({ error: "Current password is required" }, { status: 400 });
    }

    const { data: user } = await supabase
      .from("users")
      .select("password_hash")
      .eq("id", session.id)
      .single();

    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const valid = await bcrypt.compare(currentPassword, user.password_hash);
    if (!valid) return NextResponse.json({ error: "Current password is incorrect" }, { status: 400 });

    update.password_hash = await bcrypt.hash(newPassword, 10);
  }

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("users")
    .update(update)
    .eq("id", session.id)
    .select("id, username, email, phone")
    .single();

  if (error) return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
  return NextResponse.json(data);
}
