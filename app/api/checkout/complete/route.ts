import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { createToken } from "@/lib/auth";
import { stripe } from "@/lib/stripe";
import { materializePendingSignup, type MaterializedAccount } from "@/lib/signup";

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

  const supabase = getSupabase();

  const subscriptionId =
    typeof checkoutSession.subscription === "string"
      ? checkoutSession.subscription
      : checkoutSession.subscription?.id ?? null;
  const customerId =
    typeof checkoutSession.customer === "string"
      ? checkoutSession.customer
      : checkoutSession.customer?.id ?? null;
  const billing = { subscriptionId, customerId };

  const pendingSignupId = checkoutSession.metadata?.pending_signup_id ?? null;
  const companyId = checkoutSession.client_reference_id;

  let account: MaterializedAccount | null = null;

  if (pendingSignupId) {
    // New signup: create the real account now that payment is confirmed. The
    // Stripe webhook may have already done this — materialize is idempotent.
    const { data: pending } = await supabase
      .from("pending_signups")
      .select("email, first_name, last_name, password_hash")
      .eq("id", pendingSignupId)
      .maybeSingle();

    if (pending) {
      account = await materializePendingSignup(supabase, pending, billing);
      // Clean up the staged row once the account exists.
      if (account) {
        await supabase.from("pending_signups").delete().eq("id", pendingSignupId);
      }
    } else {
      // Pending row is gone (webhook already consumed it) — fall back to the
      // account it created, matched by the checkout's customer email.
      const email = checkoutSession.customer_email ?? checkoutSession.customer_details?.email ?? null;
      if (email) {
        const { data: user } = await supabase
          .from("users")
          .select("id, email, username, role, company_id, company_role, user_type")
          .eq("email", email)
          .maybeSingle();
        if (user?.company_id) {
          account = {
            userId: user.id,
            companyId: user.company_id,
            email: user.email,
            username: user.username,
            role: user.role ?? "user",
            companyRole: user.company_role ?? "super_admin",
            userType: user.user_type ?? "internal",
          };
        }
      }
    }
  } else if (companyId) {
    // Existing-account resume: link the subscription and load the billing owner.
    if (subscriptionId) {
      const update: Record<string, string> = {
        stripe_subscription_id: subscriptionId,
        subscription_status: "trialing",
      };
      if (customerId) update.stripe_customer_id = customerId;
      await supabase.from("companies").update(update).eq("id", companyId);
    }
    const { data: company } = await supabase
      .from("companies")
      .select("billing_owner_id")
      .eq("id", companyId)
      .maybeSingle();
    if (company?.billing_owner_id) {
      const { data: user } = await supabase
        .from("users")
        .select("id, email, username, role, company_id, company_role, user_type")
        .eq("id", company.billing_owner_id)
        .maybeSingle();
      if (user?.company_id) {
        account = {
          userId: user.id,
          companyId: user.company_id,
          email: user.email,
          username: user.username,
          role: user.role ?? "user",
          companyRole: user.company_role ?? "super_admin",
          userType: user.user_type ?? "internal",
        };
      }
    }
  }

  if (!account) {
    return NextResponse.json({ error: "Account not found" }, { status: 404 });
  }

  const token = await createToken({
    id: account.userId,
    email: account.email,
    username: account.username,
    role: account.role,
    company_id: account.companyId,
    company_role: account.companyRole,
    user_type: account.userType,
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
