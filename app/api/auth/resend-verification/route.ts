import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getSupabase } from "@/lib/supabase";
import { sendEmailVerification } from "@/lib/email-verification";
import { checkRateLimit, clientIpFrom } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  // Keyed to the signed-in user so someone can't spam another account's inbox:
  // 3 resends per 15 min per user.
  if (
    !checkRateLimit(`auth-resend:${session.id}`, 3, 15 * 60 * 1000) ||
    !checkRateLimit(`auth-resend-ip:${clientIpFrom(req.headers)}`, 10, 15 * 60 * 1000)
  ) {
    return NextResponse.json(
      { error: "Too many requests. Please wait a few minutes and try again." },
      { status: 429 },
    );
  }

  const supabase = getSupabase();
  const { data: user } = await supabase
    .from("users")
    .select("id, email, email_verified")
    .eq("id", session.id)
    .maybeSingle();

  if (!user) {
    return NextResponse.json({ error: "Account not found." }, { status: 404 });
  }

  // Already verified — nothing to do, but respond ok so the UI can update.
  if (user.email_verified) {
    return NextResponse.json({ ok: true, alreadyVerified: true });
  }

  await sendEmailVerification(supabase, user.id, user.email);
  return NextResponse.json({ ok: true });
}
