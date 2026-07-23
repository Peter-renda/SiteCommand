import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { hashVerificationToken } from "@/lib/email-verification";
import { checkRateLimit, clientIpFrom } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  if (!checkRateLimit(`auth-verify:${clientIpFrom(req.headers)}`, 20, 15 * 60 * 1000)) {
    return NextResponse.json(
      { error: "Too many attempts. Please wait a few minutes and try again." },
      { status: 429 },
    );
  }

  const { token } = await req.json();
  if (!token || typeof token !== "string") {
    return NextResponse.json({ error: "Invalid or missing verification token." }, { status: 400 });
  }

  const supabase = getSupabase();
  const tokenHash = hashVerificationToken(token);

  const { data: row } = await supabase
    .from("email_verification_tokens")
    .select("id, user_id, expires_at")
    .eq("token_hash", tokenHash)
    .maybeSingle();

  if (!row || new Date(row.expires_at).getTime() < Date.now()) {
    return NextResponse.json(
      { error: "This verification link is invalid or has expired. Request a new one." },
      { status: 400 },
    );
  }

  const { error: updateError } = await supabase
    .from("users")
    .update({ email_verified: true })
    .eq("id", row.user_id);

  if (updateError) {
    console.error("[verify-email] failed to mark verified", updateError);
    return NextResponse.json({ error: "Could not verify your email. Try again." }, { status: 500 });
  }

  // Single-use: burn the token(s) for this user.
  await supabase.from("email_verification_tokens").delete().eq("user_id", row.user_id);

  return NextResponse.json({ ok: true });
}
