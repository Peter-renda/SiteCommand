import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getSupabase } from "@/lib/supabase";
import { createToken } from "@/lib/auth";
import { stripe } from "@/lib/stripe";

const PRICE_IDS: Record<string, string> = {
  starter: process.env.STRIPE_STARTER_PRICE_ID!,
  pro: process.env.STRIPE_PRO_PRICE_ID!,
};

export async function POST(req: NextRequest) {
  const supabase = getSupabase();
  const { firstName, lastName, email, password, company, plan } = await req.json();

  if (!firstName || !lastName || !email || !password || !company) {
    return NextResponse.json(
      { error: "All fields are required" },
      { status: 400 }
    );
  }

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
    .insert({ name: company })
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
      company,
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

  // If a plan was provided, create the Stripe checkout session server-side
  let checkoutUrl: string | null = null;
  if (plan && PRICE_IDS[plan]) {
    try {
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";
      const checkoutSession = await stripe.checkout.sessions.create({
        mode: "subscription",
        line_items: [{ price: PRICE_IDS[plan], quantity: 1 }],
        client_reference_id: companyId!,
        customer_email: email,
        success_url: `${baseUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${baseUrl}/pricing`,
      });
      checkoutUrl = checkoutSession.url;
    } catch {
      // Non-fatal: fall through and let client redirect to dashboard
    }
  }

  const res = NextResponse.json({ success: true, checkoutUrl });
  res.cookies.set("token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7,
    path: "/",
  });

  return res;
}
