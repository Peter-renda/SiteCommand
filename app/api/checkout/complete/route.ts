import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { createToken } from "@/lib/auth";
import { stripe } from "@/lib/stripe";

// Establishes the logged-in session after a Stripe checkout has actually
// completed. Signup deliberately does NOT log a user in when they are routed to
// checkout (see /api/auth/signup) — the session is minted here, and only once
// Stripe confirms the checkout session is complete. This is what stops a user
// from creating an account, bailing out of the Stripe page, and still ending up
// logged in without ever paying.
export async function POST(req: NextRequest) {
  const { sessionId } = await req.json().catch(() => ({ sessionId: null }));
  if (!sessionId || typeof sessionId !== "string") {
    return NextResponse.json({ error: "Missing checkout session id" }, { status: 400 });
  }

  // Authoritatively read the checkout session from Stripe with our secret key.
  let checkoutSession;
  try {
    checkoutSession = await stripe.checkout.sessions.retrieve(sessionId);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Stripe error";
    return NextResponse.json({ error: msg }, { status: 502 });
  }

  // Only a genuinely completed checkout grants a session. An abandoned checkout
  // stays "open"; a paid/trialing one flips to "complete".
  if (checkoutSession.status !== "complete") {
    return NextResponse.json(
      { error: "Checkout has not been completed" },
      { status: 402 }
    );
  }

  const companyId = checkoutSession.client_reference_id;
  if (!companyId) {
    return NextResponse.json({ error: "Checkout is not linked to an account" }, { status: 400 });
  }

  const supabase = getSupabase();

  const { data: company } = await supabase
    .from("companies")
    .select("id, billing_owner_id")
    .eq("id", companyId)
    .maybeSingle();

  if (!company?.billing_owner_id) {
    return NextResponse.json({ error: "Account not found" }, { status: 404 });
  }

  const { data: user } = await supabase
    .from("users")
    .select("id, email, username, role, company_id, company_role, user_type")
    .eq("id", company.billing_owner_id)
    .maybeSingle();

  if (!user) {
    return NextResponse.json({ error: "Account not found" }, { status: 404 });
  }

  // Defensively record the subscription on the company so access is correct
  // even if the Stripe webhook is delayed or not configured. The webhook remains
  // the source of truth for plan/seat details.
  const subscriptionId =
    typeof checkoutSession.subscription === "string"
      ? checkoutSession.subscription
      : checkoutSession.subscription?.id ?? null;
  const customerId =
    typeof checkoutSession.customer === "string"
      ? checkoutSession.customer
      : checkoutSession.customer?.id ?? null;

  if (subscriptionId) {
    const update: Record<string, string> = {
      stripe_subscription_id: subscriptionId,
      subscription_status: "trialing",
    };
    if (customerId) update.stripe_customer_id = customerId;
    await supabase.from("companies").update(update).eq("id", companyId);
  }

  const token = await createToken({
    id: user.id,
    email: user.email,
    username: user.username,
    role: user.role ?? "user",
    company_id: user.company_id ?? null,
    company_role: user.company_role ?? null,
    user_type: user.user_type ?? "internal",
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
