import { NextRequest, NextResponse } from "next/server";
import { stripe, STRIPE_PLANS } from "@/lib/stripe";
import { supabaseAdmin, PLANS, PlanType } from "@/lib/supabase";
import Stripe from "stripe";

// Helper to get plan name from Stripe price ID
function getPlanFromPriceId(priceId: string): PlanType | null {
  for (const [planName, planConfig] of Object.entries(STRIPE_PLANS)) {
    if (planConfig.priceId === priceId) {
      return planName as PlanType;
    }
  }
  return null;
}

export async function POST(request: NextRequest) {
  if (!stripe) {
    return NextResponse.json(
      { error: "Stripe not configured" },
      { status: 500 }
    );
  }

  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json(
      { error: "Missing stripe-signature header" },
      { status: 400 }
    );
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    console.error("Missing STRIPE_WEBHOOK_SECRET");
    return NextResponse.json(
      { error: "Webhook secret not configured" },
      { status: 500 }
    );
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return NextResponse.json(
      { error: "Invalid signature" },
      { status: 400 }
    );
  }

  if (!supabaseAdmin) {
    console.error("Supabase not configured");
    return NextResponse.json(
      { error: "Database not configured" },
      { status: 500 }
    );
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const clerkId = session.metadata?.clerk_id;
        const plan = session.metadata?.plan as PlanType;

        if (!clerkId || !plan) {
          console.error("Missing metadata in checkout session");
          break;
        }

        // Get user
        const { data: user } = await supabaseAdmin
          .from("users")
          .select("id")
          .eq("clerk_id", clerkId)
          .single();

        if (!user) {
          console.error("User not found:", clerkId);
          break;
        }

        // Update subscription
        const { error: subError, count } = await supabaseAdmin
          .from("subscriptions")
          .update({
            stripe_customer_id: session.customer as string,
            stripe_subscription_id: session.subscription as string,
            plan: plan,
            status: "trialing", // 7-day trial
          })
          .eq("user_id", user.id);

        if (subError) {
          console.error("Failed to update subscription:", subError);
        } else {
          console.log(`Subscription updated, rows affected: ${count}`);
        }

        // Update user credits
        const planCredits = PLANS[plan]?.credits || 0;
        const { error: creditsError } = await supabaseAdmin
          .from("users")
          .update({
            credits_remaining: planCredits,
          })
          .eq("id", user.id);

        if (creditsError) {
          console.error("Failed to update credits:", creditsError);
        }

        console.log(`Subscription started for user ${clerkId}: ${plan}, credits: ${planCredits}`);
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        const clerkId = subscription.metadata?.clerk_id;

        if (!clerkId) break;

        const { data: user } = await supabaseAdmin
          .from("users")
          .select("id")
          .eq("clerk_id", clerkId)
          .single();

        if (!user) break;

        // Get the current plan from the subscription's price ID
        const currentPriceId = subscription.items.data[0]?.price?.id;
        const detectedPlan = currentPriceId ? getPlanFromPriceId(currentPriceId) : null;
        // Fallback to metadata if price detection fails
        const plan = detectedPlan || (subscription.metadata?.plan as PlanType);

        console.log(`Subscription update detected - priceId: ${currentPriceId}, detectedPlan: ${detectedPlan}, metadataPlan: ${subscription.metadata?.plan}`);

        // Map Stripe status to our status
        let status: "active" | "canceled" | "past_due" | "trialing" | "incomplete" = "active";
        if (subscription.status === "trialing") status = "trialing";
        else if (subscription.status === "past_due") status = "past_due";
        else if (subscription.status === "canceled") status = "canceled";
        else if (subscription.status === "incomplete") status = "incomplete";

        const updateData: Record<string, unknown> = {
          status: status,
          cancel_at_period_end: subscription.cancel_at_period_end,
        };

        // Update plan if we detected a change
        if (plan) {
          updateData.plan = plan;
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const sub = subscription as any;
        if (sub.current_period_start) {
          updateData.current_period_start = new Date(sub.current_period_start * 1000).toISOString();
        }
        if (sub.current_period_end) {
          updateData.current_period_end = new Date(sub.current_period_end * 1000).toISOString();
        }

        await supabaseAdmin
          .from("subscriptions")
          .update(updateData)
          .eq("user_id", user.id);

        // Update credits if plan changed or subscription became active
        if (plan && (subscription.status === "active" || subscription.status === "trialing")) {
          const planCredits = PLANS[plan]?.credits || 0;
          await supabaseAdmin
            .from("users")
            .update({
              credits_remaining: planCredits,
            })
            .eq("id", user.id);
          console.log(`Credits updated for user ${clerkId}: ${planCredits} (${plan})`);
        }

        console.log(`Subscription updated for user ${clerkId}: ${status}, plan: ${plan}`);
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const clerkId = subscription.metadata?.clerk_id;

        if (!clerkId) break;

        const { data: user } = await supabaseAdmin
          .from("users")
          .select("id")
          .eq("clerk_id", clerkId)
          .single();

        if (!user) break;

        // Reset to free plan
        await supabaseAdmin
          .from("subscriptions")
          .update({
            plan: "free",
            status: "canceled",
            stripe_subscription_id: null,
            cancel_at_period_end: false,
          })
          .eq("user_id", user.id);

        // Reset credits to free tier
        await supabaseAdmin
          .from("users")
          .update({
            credits_remaining: PLANS.free.credits,
          })
          .eq("id", user.id);

        console.log(`Subscription canceled for user ${clerkId}`);
        break;
      }

      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice;

        // Only process subscription renewals (not first payment)
        if (invoice.billing_reason !== "subscription_cycle") break;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const subscriptionId = (invoice as any).subscription as string;

        // Get subscription to find plan
        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        const clerkId = subscription.metadata?.clerk_id;
        const plan = subscription.metadata?.plan as PlanType;

        if (!clerkId || !plan) break;

        const { data: user } = await supabaseAdmin
          .from("users")
          .select("id")
          .eq("clerk_id", clerkId)
          .single();

        if (!user) break;

        // Refresh credits on renewal
        const planCredits = PLANS[plan]?.credits || 0;
        await supabaseAdmin
          .from("users")
          .update({
            credits_remaining: planCredits,
            credits_used: 0,
          })
          .eq("id", user.id);

        console.log(`Credits refreshed for user ${clerkId}: ${planCredits}`);
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const subscriptionId = (invoice as any).subscription as string;

        if (!subscriptionId) break;

        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        const clerkId = subscription.metadata?.clerk_id;

        if (!clerkId) break;

        const { data: user } = await supabaseAdmin
          .from("users")
          .select("id")
          .eq("clerk_id", clerkId)
          .single();

        if (!user) break;

        await supabaseAdmin
          .from("subscriptions")
          .update({
            status: "past_due",
          })
          .eq("user_id", user.id);

        console.log(`Payment failed for user ${clerkId}`);
        break;
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook handler error:", error);
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 }
    );
  }
}
