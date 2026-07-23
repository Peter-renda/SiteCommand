import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getSupabase } from "@/lib/supabase";
import { createToken } from "@/lib/auth";
import { stripe } from "@/lib/stripe";
import { materializePendingSignup } from "@/lib/signup";
import { checkRateLimit, clientIpFrom } from "@/lib/rate-limit";

// Read a Stripe price id from the environment, treating blank strings and the
// documented `price_xxx` placeholder as "not configured". This matters because
// `??` only falls back on null/undefined — a present-but-empty env var (a very
// common deploy state) would otherwise resolve to "" and silently break a plan.
function envPriceId(name: string): string | undefined {
  const raw = process.env[name]?.trim();
  if (!raw || raw === "price_xxx") return undefined;
  return raw;
}

// Resolve the Stripe price id for a membership/plan slug. Monthly falls back to
// the existing $99/mo starter price when no dedicated monthly price is set;
// crucially, that fallback now triggers for a blank STRIPE_MONTHLY_PRICE_ID too,
// not just an unset one.
function priceIdForPlan(plan: string): string | undefined {
  switch (plan) {
    // Legacy team-tier keys (still linked from other marketing CTAs).
    case "starter":
      return envPriceId("STRIPE_STARTER_PRICE_ID");
    case "pro":
      return envPriceId("STRIPE_PRO_PRICE_ID");
    // Membership terms.
    case "monthly":
      return envPriceId("STRIPE_MONTHLY_PRICE_ID") ?? envPriceId("STRIPE_STARTER_PRICE_ID");
    case "quarterly":
      return envPriceId("STRIPE_QUARTERLY_PRICE_ID");
    case "biannual":
      return envPriceId("STRIPE_BIANNUAL_PRICE_ID");
    default:
      return undefined;
  }
}

// Create a Stripe subscription checkout session for a plan. Returns the hosted
// checkout URL, or an actionable error when the plan is unconfigured / Stripe
// rejects the request. Never throws.
//
// `ref` links the eventual completed checkout back to who it belongs to:
//   - pendingSignupId → a staged signup, materialized into a real account only
//     once checkout completes (no account exists yet).
//   - companyId → an already-existing account resuming its checkout.
async function createPlanCheckout(
  plan: string,
  ref: { pendingSignupId?: string; companyId?: string },
  email: string
): Promise<{ url: string | null; error: string | null }> {
  const priceId = priceIdForPlan(plan);
  if (!priceId) {
    // A plan was requested but no Stripe price id resolved for it — almost
    // always a missing/misnamed/blank price env var (or a deploy that predates it).
    const error = `No Stripe price is configured for the "${plan}" plan.`;
    console.error(error);
    return { url: null, error };
  }
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";
    const metadata: Record<string, string> = {};
    if (ref.pendingSignupId) metadata.pending_signup_id = ref.pendingSignupId;
    const checkoutSession = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      // New accounts start on a 7-day free trial; billing begins only after
      // the trial ends (the "Start training free" flow).
      subscription_data: { trial_period_days: 7 },
      ...(ref.companyId ? { client_reference_id: ref.companyId } : {}),
      metadata,
      customer_email: email,
      success_url: `${baseUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/pricing`,
    });
    if (!checkoutSession.url) {
      // Stripe accepted the request but returned no redirect URL. Surface it as
      // an error rather than dropping the user into the app (reads as "it just
      // logged me in").
      const error = "Stripe did not return a checkout URL for this plan.";
      console.error(error, { plan });
      return { url: null, error };
    }
    return { url: checkoutSession.url, error: null };
  } catch (err) {
    const error = err instanceof Error ? err.message : "Stripe checkout failed";
    console.error("Signup Stripe checkout error:", err);
    return { url: null, error };
  }
}

const ACTIVE_SUBSCRIPTION_STATUSES = ["active", "trialing"];

export async function POST(req: NextRequest) {
  // Throttle automated signup abuse: 6 attempts per 15 min per IP.
  if (!checkRateLimit(`auth-signup:${clientIpFrom(req.headers)}`, 6, 15 * 60 * 1000)) {
    return NextResponse.json(
      { error: "Too many signup attempts. Please wait a few minutes and try again." },
      { status: 429 },
    );
  }

  const supabase = getSupabase();
  const { firstName, lastName, email, password, plan } = await req.json();

  if (!firstName || !lastName || !email || !password) {
    return NextResponse.json(
      { error: "All fields are required" },
      { status: 400 }
    );
  }

  const { data: existing } = await supabase
    .from("users")
    .select("id, password_hash, company_id")
    .eq("email", email)
    .maybeSingle();

  if (existing) {
    // A real (already-paid, or free) account exists for this email. If they're
    // re-selecting a paid plan, their credentials match, and there is no active
    // subscription yet, resume checkout against their existing company. Any
    // other case is directed to sign in.
    const credentialsOk =
      typeof existing.password_hash === "string" &&
      (await bcrypt.compare(password, existing.password_hash));

    if (plan && credentialsOk && existing.company_id) {
      const { data: existingCompany } = await supabase
        .from("companies")
        .select("subscription_status")
        .eq("id", existing.company_id)
        .maybeSingle();

      const alreadyActive =
        existingCompany?.subscription_status != null &&
        ACTIVE_SUBSCRIPTION_STATUSES.includes(existingCompany.subscription_status);

      if (!alreadyActive) {
        const { url, error: checkoutError } = await createPlanCheckout(
          plan,
          { companyId: existing.company_id },
          email
        );
        return NextResponse.json({
          success: true,
          checkoutUrl: url,
          checkoutError,
        });
      }
    }

    return NextResponse.json(
      { error: "An account with this email already exists. Please sign in." },
      { status: 409 }
    );
  }

  const password_hash = await bcrypt.hash(password, 10);

  // ── Paid-plan signup: stage it, don't create the account yet ────────────────
  // The account (company + user) is materialized only after Stripe confirms the
  // checkout is complete (see /api/checkout/complete and the Stripe webhook), so
  // bailing out of the Stripe page never leaves a real, unpaid account behind.
  if (plan) {
    // Refresh any prior pending signup for this email (e.g. they backed out and
    // are retrying), then stage the new one.
    await supabase.from("pending_signups").delete().eq("email", email);
    const { data: pending, error: pendingError } = await supabase
      .from("pending_signups")
      .insert({
        email,
        first_name: firstName,
        last_name: lastName,
        password_hash,
        plan,
      })
      .select("id")
      .single();

    if (pendingError || !pending) {
      console.error("Signup pending insert error:", pendingError);
      return NextResponse.json(
        { error: "Failed to start signup" },
        { status: 500 }
      );
    }

    const { url, error: checkoutError } = await createPlanCheckout(
      plan,
      { pendingSignupId: pending.id },
      email
    );

    // Checkout couldn't start — drop the staged signup so it doesn't linger.
    if (!url) {
      await supabase.from("pending_signups").delete().eq("id", pending.id);
    }

    return NextResponse.json({ success: true, checkoutUrl: url, checkoutError });
  }

  // ── No plan: free onboarding flow — create the account and sign the user in ──
  const account = await materializePendingSignup(supabase, {
    email,
    first_name: firstName,
    last_name: lastName,
    password_hash,
  });

  if (!account) {
    return NextResponse.json(
      { error: "Failed to create account" },
      { status: 500 }
    );
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

  const res = NextResponse.json({ success: true, checkoutUrl: null, checkoutError: null });
  res.cookies.set("token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7,
    path: "/",
  });

  return res;
}
