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
    .select("id")
    .eq("email", email)
    .maybeSingle();

  if (existing) {
    return NextResponse.json(
      { error: "An account with this email already exists" },
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
  const priceId = plan ? priceIdForPlan(plan) : undefined;
  if (plan && priceId) {
    try {
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";
      const checkoutSession = await stripe.checkout.sessions.create({
        mode: "subscription",
        line_items: [{ price: priceId, quantity: 1 }],
        // New accounts start on a 7-day free trial; billing begins only after
        // the trial ends (the "Start training free" flow).
        subscription_data: { trial_period_days: 7 },
        client_reference_id: companyId!,
        customer_email: email,
        success_url: `${baseUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${baseUrl}/pricing`,
      });
      checkoutUrl = checkoutSession.url;
      if (!checkoutUrl) {
        // Stripe accepted the request but returned no redirect URL. Surface it
        // as an error rather than falling through and dropping the user into
        // the app (which reads as "it just logged me in").
        checkoutError = "Stripe did not return a checkout URL for this plan.";
        console.error(checkoutError, { plan });
      }
    } catch (err) {
      checkoutError = err instanceof Error ? err.message : "Stripe checkout failed";
      console.error("Signup Stripe checkout error:", err);
    }
  } else if (plan) {
    // A plan was requested but no Stripe price id resolved for it — almost
    // always a missing/misnamed/blank price env var (or a deploy that predates it).
    checkoutError = `No Stripe price is configured for the "${plan}" plan.`;
    console.error(checkoutError);
  }

  const res = NextResponse.json({ success: true, checkoutUrl, checkoutError });
  res.cookies.set("token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7,
    path: "/",
  });

  return res;
}
