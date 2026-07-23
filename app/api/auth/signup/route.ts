import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getSupabase } from "@/lib/supabase";
import { createToken } from "@/lib/auth";
import { stripe } from "@/lib/stripe";

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
async function createPlanCheckout(
  plan: string,
  companyId: string,
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
    const checkoutSession = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      // New accounts start on a 7-day free trial; billing begins only after
      // the trial ends (the "Start training free" flow).
      subscription_data: { trial_period_days: 7 },
      client_reference_id: companyId,
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
  const supabase = getSupabase();
  const { firstName, lastName, email, password, plan } = await req.json();

  if (!firstName || !lastName || !email || !password) {
    return NextResponse.json(
      { error: "All fields are required" },
      { status: 400 }
    );
  }

  // The signup form no longer collects a company name. Every account still
  // needs a company record (the signup user becomes its Super Admin and
  // billing is per-company), so default it — the Super Admin can rename the
  // company later in settings.
  const companyName = "My Company";

  const { data: existing } = await supabase
    .from("users")
    .select("id, password_hash, company_id")
    .eq("email", email)
    .maybeSingle();

  if (existing) {
    // Common case: a user created an account, was sent to Stripe, backed out
    // without paying, and returned to finish signing up. Rather than a dead-end
    // 409, resume their checkout when the credentials match and there is no
    // active subscription yet. Without a plan (or with wrong credentials / an
    // already-active membership) we send them to sign in instead.
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
          existing.company_id,
          email
        );
        // No session cookie is set here — the session is established only once
        // checkout completes (see /api/checkout/complete).
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
  const displayName = `${firstName} ${lastName}`;

  // Create the company for this new account
  const { data: newCompany, error: companyError } = await supabase
    .from("companies")
    .insert({ name: companyName })
    .select("id")
    .single();

  if (companyError || !newCompany) {
    return NextResponse.json(
      { error: "Failed to create company" },
      { status: 500 }
    );
  }
  const companyId = newCompany.id;

  // The person who signs up and creates the company is the Super Admin —
  // they are the billing owner and have full rights including billing management.
  const companyRole = "super_admin";

  const { data: newUser, error } = await supabase
    .from("users")
    .insert({
      username: displayName,
      first_name: firstName,
      last_name: lastName,
      email,
      password_hash,
      company: companyName,
      role: "user",
      company_id: companyId,
      company_role: companyRole,
      user_type: "internal",
    })
    .select("id")
    .single();

  if (error || !newUser) {
    console.error("Signup user insert error:", error);
    return NextResponse.json(
      { error: error?.message ?? "Failed to create account" },
      { status: 500 }
    );
  }

  // Record the billing owner on the company record and create the
  // normalised org_members entry for this super_admin.
  if (companyId) {
    await supabase
      .from("companies")
      .update({ billing_owner_id: newUser.id })
      .eq("id", companyId);

    await supabase.from("org_members").insert({
      user_id: newUser.id,
      org_id: companyId,
      role: "super_admin",
    });
  }

  const token = await createToken({
    id: newUser.id,
    email,
    username: displayName,
    role: "user",
    company_id: companyId,
    company_role: companyRole,
    user_type: "internal",
  });

  // If a plan was provided, create the Stripe checkout session server-side.
  // A failure here is surfaced (not silently swallowed) so billing/config
  // problems are diagnosable instead of dumping the user back into the app.
  let checkoutUrl: string | null = null;
  let checkoutError: string | null = null;
  if (plan) {
    const result = await createPlanCheckout(plan, companyId!, email);
    checkoutUrl = result.url;
    checkoutError = result.error;
  }

  const res = NextResponse.json({ success: true, checkoutUrl, checkoutError });

  // Only establish a logged-in session here when the user is NOT being routed
  // through Stripe checkout. When a paid plan was selected we defer the session
  // until checkout actually completes (see /api/checkout/complete, called from
  // the checkout success page). Otherwise a user could create an account, bail
  // out of the Stripe page, and still be fully logged in without ever paying —
  // and a stale cookie would silently drop them into the app on a later visit.
  if (!plan) {
    res.cookies.set("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    });
  }

  return res;
}
