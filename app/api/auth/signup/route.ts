import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getSupabase } from "@/lib/supabase";
import { createToken } from "@/lib/auth";
import { stripe } from "@/lib/stripe";

const PRICE_IDS: Record<string, string> = {
  // Legacy team-tier keys (still linked from other marketing CTAs).
  starter: process.env.STRIPE_STARTER_PRICE_ID!,
  pro: process.env.STRIPE_PRO_PRICE_ID!,
  // Break Into Construction Management membership terms. Monthly reuses the
  // existing $99/mo price when no dedicated id is set; the longer terms are
  // configured via their own env vars (an unset id falls through to no
  // checkout, which is handled gracefully below).
  monthly: process.env.STRIPE_MONTHLY_PRICE_ID ?? process.env.STRIPE_STARTER_PRICE_ID!,
  quarterly: process.env.STRIPE_QUARTERLY_PRICE_ID!,
  biannual: process.env.STRIPE_BIANNUAL_PRICE_ID!,
};

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
  const companyName =
    typeof company === "string" && company.trim() ? company.trim() : "My Company";

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
  if (plan && PRICE_IDS[plan]) {
    try {
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";
      const checkoutSession = await stripe.checkout.sessions.create({
        mode: "subscription",
        line_items: [{ price: PRICE_IDS[plan], quantity: 1 }],
        // New accounts start on a 7-day free trial; billing begins only after
        // the trial ends (the "Start training free" flow).
        subscription_data: { trial_period_days: 7 },
        client_reference_id: companyId!,
        customer_email: email,
        success_url: `${baseUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${baseUrl}/pricing`,
      });
      checkoutUrl = checkoutSession.url;
    } catch (err) {
      checkoutError = err instanceof Error ? err.message : "Stripe checkout failed";
      console.error("Signup Stripe checkout error:", err);
    }
  } else if (plan) {
    // A plan was requested but no Stripe price id resolved for it — almost
    // always a missing/misnamed price env var (or a deploy that predates it).
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
