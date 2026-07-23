import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { getSupabase } from "@/lib/supabase";

function hashToken(raw: string): string {
  return crypto.createHash("sha256").update(raw).digest("hex");
}

export async function POST(req: NextRequest) {
  const { token, password } = await req.json();

  if (!token || typeof token !== "string") {
    return NextResponse.json({ error: "Invalid or missing reset token." }, { status: 400 });
  }
  if (!password || typeof password !== "string" || password.length < 8) {
    return NextResponse.json(
      { error: "Password must be at least 8 characters." },
      { status: 400 },
    );
  }

  const supabase = getSupabase();
  const tokenHash = hashToken(token);

  const { data: row } = await supabase
    .from("password_reset_tokens")
    .select("id, user_id, expires_at, used_at")
    .eq("token_hash", tokenHash)
    .maybeSingle();

  if (!row || row.used_at || new Date(row.expires_at).getTime() < Date.now()) {
    return NextResponse.json(
      { error: "This reset link is invalid or has expired. Please request a new one." },
      { status: 400 },
    );
  }

  const password_hash = await bcrypt.hash(password, 10);

  const { error: updateError } = await supabase
    .from("users")
    .update({ password_hash })
    .eq("id", row.user_id);

  if (updateError) {
    console.error("[reset-password] failed to update password", updateError);
    return NextResponse.json({ error: "Could not reset your password. Try again." }, { status: 500 });
  }

  // Single-use: burn this token and clear any siblings for the user.
  await supabase.from("password_reset_tokens").delete().eq("user_id", row.user_id);

  return NextResponse.json({ ok: true });
}
