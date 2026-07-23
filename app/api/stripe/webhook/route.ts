import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { getSupabase } from "@/lib/supabase";
import { materializePendingSignup } from "@/lib/signup";
import Stripe from "stripe";

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature");

  if (!sig) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const supabase = getSupabase();

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;

    const subscriptionId = session.subscription as string;
    const customerId = session.customer as string;

    // A brand-new paid signup is staged in `pending_signups` and only becomes a
    // real account here, once payment is confirmed. (The checkout success page
    // may materialize it first — this is idempotent.)
    let companyId = session.client_reference_id;
    const pendingSignupId = session.metadata?.pending_signup_id ?? null;
    if (pendingSignupId) {
      const { data: pending } = await supabase
        .from("pending_signups")
        .select("email, first_name, last_name, password_hash")
        .eq("id", pendingSignupId)
        .maybeSingle();
      if (pending) {
        const account = await materializePendingSignup(supabase, pending, {
          subscriptionId,
          customerId,
        });
        if (account) {
          companyId = account.companyId;
          await supabase
            .from("pending_signups")
            .delete()
            .eq("id", pendingSignupId);
        }
      }
    }

    if (!companyId) return NextResponse.json({ received: true });

    let plan = "starter";
    let seatLimit = 10;
    if (subscriptionId) {
      const subscription = await stripe.subscriptions.retrieve(subscriptionId);
      const priceId = subscription.items.data[0]?.price.id;
      if (priceId === process.env.STRIPE_PRO_PRICE_ID) {
        plan = "pro";
        seatLimit = 99;
      }
    }

    await supabase
      .from("companies")
      .update({
        stripe_customer_id: customerId,
        stripe_subscription_id: subscriptionId,
        subscription_status: "active",
        subscription_plan: plan,
        seat_limit: seatLimit,
      })
      .eq("id", companyId);
  } else if (event.type === "customer.subscription.updated") {
    const subscription = event.data.object as Stripe.Subscription;
    await supabase
      .from("companies")
      .update({ subscription_status: subscription.status })
      .eq("stripe_subscription_id", subscription.id);
  } else if (event.type === "customer.subscription.deleted") {
    const subscription = event.data.object as Stripe.Subscription;
    await supabase
      .from("companies")
      .update({ subscription_status: "inactive", seat_limit: 0 })
      .eq("stripe_subscription_id", subscription.id);
  }

  return NextResponse.json({ received: true });
}
