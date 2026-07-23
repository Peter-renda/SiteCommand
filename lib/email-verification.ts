import crypto from "crypto";
import { getSupabase } from "@/lib/supabase";
import { sendVerificationEmail } from "@/lib/email";

type Supabase = ReturnType<typeof getSupabase>;

// Hash the raw token before storing it, so a leaked DB row can't be replayed as
// a verification link. The emailed link carries the raw token; the verify
// endpoint hashes the incoming value the same way to match.
export function hashVerificationToken(raw: string): string {
  return crypto.createHash("sha256").update(raw).digest("hex");
}

function appBaseUrl(): string {
  return (
    process.env.NEXT_PUBLIC_APP_URL?.trim() ||
    process.env.NEXT_PUBLIC_BASE_URL?.trim() ||
    "http://localhost:3000"
  );
}

/**
 * Issue a fresh email-verification token for a user and send the confirmation
 * email. Replaces any prior outstanding token for that user. Best-effort — never
 * throws — so it can't break account creation or a resend request.
 */
export async function sendEmailVerification(
  supabase: Supabase,
  userId: string,
  email: string,
): Promise<void> {
  try {
    const rawToken = crypto.randomBytes(32).toString("hex");
    const tokenHash = hashVerificationToken(rawToken);
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(); // 24h

    await supabase.from("email_verification_tokens").delete().eq("user_id", userId);
    const { error } = await supabase.from("email_verification_tokens").insert({
      user_id: userId,
      token_hash: tokenHash,
      expires_at: expiresAt,
    });
    if (error) {
      console.error("[email-verification] failed to store token", error);
      return;
    }

    const verifyUrl = `${appBaseUrl()}/verify-email?token=${rawToken}`;
    await sendVerificationEmail(email, verifyUrl);
  } catch (err) {
    console.error("[email-verification] send failed", err);
  }
}
