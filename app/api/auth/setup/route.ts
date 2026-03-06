import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getSupabase } from "@/lib/supabase";
import { stripe } from "@/lib/stripe";
import { createToken } from "@/lib/auth";

interface SecondAdmin {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}

export async function POST(req: NextRequest) {
  const { sessionId, firstName, lastName, company, email, password, secondAdmin } =
    await req.json() as {
      sessionId: string;
      firstName: string;
      lastName: string;
      company: string;
      email: string;
      password: string;
      secondAdmin?: SecondAdmin;
    };

  if (!sessionId || !firstName || !lastName || !company || !email || !password) {
    return NextResponse.json({ error: "All fields are required" }, { status: 400 });
  }

  // Verify Stripe checkout session
  let stripeSession;
  try {
    stripeSession = await stripe.checkout.sessions.retrieve(sessionId);
  } catch {
    return NextResponse.json({ error: "Invalid checkout session" }, { status: 400 });
  }

  if (stripeSession.status !== "complete") {
    return NextResponse.json({ error: "Payment not completed" }, { status: 402 });
  }

  const supabase = getSupabase();

  // Check primary admin email isn't taken
  const { data: existing } = await supabase
    .from("users")
    .select("id")
    .eq("email", email)
    .maybeSingle();

  if (existing) {
    return NextResponse.json({ error: "An account with this email already exists" }, { status: 409 });
  }

  // Resolve subscription plan details
  const subscriptionId = stripeSession.subscription as string;
  const customerId = stripeSession.customer as string;
  let plan = "starter";
  let seatLimit = 10;
  if (subscriptionId) {
    try {
      const subscription = await stripe.subscriptions.retrieve(subscriptionId);
      const priceId = subscription.items.data[0]?.price.id;
      if (priceId === process.env.STRIPE_PRO_PRICE_ID) {
        plan = "pro";
        seatLimit = 99;
      }
    } catch {
      // fall back to starter defaults
    }
  }

  // Create company
  const { data: newCompany, error: companyError } = await supabase
    .from("companies")
    .insert({
      name: company,
      stripe_customer_id: customerId,
      stripe_subscription_id: subscriptionId,
      subscription_status: "active",
      subscription_plan: plan,
      seat_limit: seatLimit,
    })
    .select("id")
    .single();

  if (companyError || !newCompany) {
    return NextResponse.json({ error: "Failed to create company" }, { status: 500 });
  }

  const companyId = newCompany.id;

  // Create primary admin
  const password_hash = await bcrypt.hash(password, 10);
  const displayName = `${firstName} ${lastName}`;

  const { data: newUser, error: userError } = await supabase
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
      company_role: "admin",
    })
    .select("id")
    .single();

  if (userError || !newUser) {
    return NextResponse.json({ error: "Failed to create account" }, { status: 500 });
  }

  // Optionally create second admin
  if (secondAdmin) {
    const { firstName: f2, lastName: l2, email: e2, password: p2 } = secondAdmin;
    if (f2 && l2 && e2 && p2) {
      const hash2 = await bcrypt.hash(p2, 10);
      await supabase.from("users").insert({
        username: `${f2} ${l2}`,
        first_name: f2,
        last_name: l2,
        email: e2,
        password_hash: hash2,
        company,
        role: "user",
        company_id: companyId,
        company_role: "admin",
      });
    }
  }

  // Issue JWT for primary admin
  const token = await createToken({
    id: newUser.id,
    email,
    username: displayName,
    role: "user",
    company_id: companyId,
    company_role: "admin",
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
