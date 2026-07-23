import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { getSupabase } from "@/lib/supabase";
import { sendPasswordResetEmail } from "@/lib/email";
import { checkRateLimit, clientIpFrom } from "@/lib/rate-limit";

// Hash the raw token before it touches the database, so a leaked DB row can't be
// replayed as a reset link. The emailed link carries the raw token; the reset
// endpoint hashes the incoming value the same way to match this row.
function hashToken(raw: string): string {
  return crypto.createHash("sha256").update(raw).digest("hex");
}

function baseUrl(req: NextRequest): string {
  return (
    process.env.NEXT_PUBLIC_APP_URL?.trim() ||
    process.env.NEXT_PUBLIC_BASE_URL?.trim() ||
    req.nextUrl.origin
  );
}

export async function POST(req: NextRequest) {
  // Throttle reset spam / enumeration probing: 5 requests per 15 min per IP.
  if (!checkRateLimit(`auth-forgot:${clientIpFrom(req.headers)}`, 5, 15 * 60 * 1000)) {
    return NextResponse.json(
      { error: "Too many requests. Please wait a few minutes and try again." },
      { status: 429 },
    );
  }

  const { email } = await req.json();

  // Always respond the same way regardless of whether the account exists, so
  // this endpoint can't be used to enumerate which emails are registered.
  const genericOk = NextResponse.json({
    ok: true,
    message: "If an account exists for that email, a reset link is on its way.",
  });

  if (!email || typeof email !== "string" || !email.includes("@")) {
    return genericOk;
  }

  const supabase = getSupabase();

  const { data: user } = await supabase
    .from("users")
    .select("id, email, user_type")
    .ilike("email", email.trim())
    .maybeSingle();

  // No account, or a demo account (which has no real password) — say nothing.
  if (!user || user.user_type === "demo") {
    return genericOk;
  }

  const rawToken = crypto.randomBytes(32).toString("hex");
  const tokenHash = hashToken(rawToken);
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString(); // 1 hour

  // Invalidate any prior outstanding resets for this user, then store the new one.
  await supabase.from("password_reset_tokens").delete().eq("user_id", user.id);
  const { error: insertError } = await supabase.from("password_reset_tokens").insert({
    user_id: user.id,
    token_hash: tokenHash,
    expires_at: expiresAt,
  });

  if (insertError) {
    console.error("[forgot-password] failed to store reset token", insertError);
    // Still return the generic response — don't leak the failure to the caller.
    return genericOk;
  }

  const resetUrl = `${baseUrl(req)}/reset-password?token=${rawToken}`;
  await sendPasswordResetEmail(user.email, resetUrl);

  return genericOk;
}
