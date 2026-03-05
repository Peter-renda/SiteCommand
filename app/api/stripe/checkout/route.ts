import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { stripe } from "@/lib/stripe";

const PRICE_IDS: Record<string, string> = {
  starter: process.env.STRIPE_STARTER_PRICE_ID!,
  pro: process.env.STRIPE_PRO_PRICE_ID!,
};

export async function POST(req: NextRequest) {
  const session = await getSession();
  const canCheckout = session?.role === "admin" || session?.company_role === "admin";
  if (!session || !canCheckout) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { plan, newSignup } = await req.json();
  if (!plan || !PRICE_IDS[plan]) {
    return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
  }

  if (!session.company_id && session.role !== "admin") {
    return NextResponse.json({ error: "No company associated with account" }, { status: 400 });
  }

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";

  const checkoutSession = await stripe.checkout.sessions.create({
    mode: "subscription",
    line_items: [{ price: PRICE_IDS[plan], quantity: 1 }],
    client_reference_id: session.company_id ?? session.id,
    customer_email: session.email,
    success_url: `${baseUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}${newSignup ? "&new=1" : ""}`,
    cancel_url: `${baseUrl}/pricing`,
  });

  return NextResponse.json({ url: checkoutSession.url });
}
