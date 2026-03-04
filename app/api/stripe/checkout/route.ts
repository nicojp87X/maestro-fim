import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { stripe } from "@/lib/stripe/client";
import { PLANS, type PlanId } from "@/lib/stripe/plans";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { plan?: PlanId; planId?: PlanId };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const planId = (body.plan ?? body.planId) as PlanId;

  if (!planId || !PLANS[planId]) {
    return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
  }

  const plan = PLANS[planId];

  try {
    // Get existing subscription (if any) to retrieve stripe_customer_id
    const { data: subscription } = await supabase
      .from("subscriptions")
      .select("stripe_customer_id")
      .eq("user_id", user.id)
      .single();

    let customerId = subscription?.stripe_customer_id ?? null;

    if (!customerId) {
      // Fetch profile for customer name
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", user.id)
        .single();

      // Create Stripe customer
      const customer = await stripe.customers.create({
        email: user.email!,
        name: profile?.full_name ?? undefined,
        metadata: { supabase_user_id: user.id },
      });
      customerId = customer.id;

      // Persist the customer ID so we reuse it on future checkouts
      if (subscription) {
        await supabase
          .from("subscriptions")
          .update({ stripe_customer_id: customerId })
          .eq("user_id", user.id);
      } else {
        await supabase.from("subscriptions").insert({
          user_id: user.id,
          stripe_customer_id: customerId,
          plan: "free",
          status: "active",
          cancel_at_period_end: false,
        });
      }
    }

    // Create Stripe Checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ["card"],
      line_items: [{ price: plan.priceId, quantity: 1 }],
      mode: "subscription",
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?success=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/subscription?canceled=true`,
      metadata: {
        supabase_user_id: user.id,
        plan: planId,
      },
      subscription_data: {
        metadata: { supabase_user_id: user.id, plan: planId },
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (error: unknown) {
    console.error("[Stripe Checkout Error]", error);
    const message =
      error instanceof Error
        ? error.message
        : "Stripe checkout failed. Please try again.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
