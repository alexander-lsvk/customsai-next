import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { stripe, STRIPE_PLANS, StripePlanType } from "@/lib/stripe";
import { supabaseAdmin } from "@/lib/supabase";

export async function POST(request: NextRequest) {
  try {
    if (!stripe) {
      return NextResponse.json(
        { error: "Stripe not configured" },
        { status: 500 }
      );
    }

    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { plan, locale } = body as { plan: StripePlanType; locale?: string };

    if (!plan || !STRIPE_PLANS[plan]) {
      return NextResponse.json(
        { error: "Invalid plan" },
        { status: 400 }
      );
    }

    const planConfig = STRIPE_PLANS[plan];

    if (!planConfig.priceId) {
      return NextResponse.json(
        { error: "Plan not configured. Please set up Stripe products first." },
        { status: 500 }
      );
    }

    // Get user from Supabase
    let stripeCustomerId: string | null = null;

    if (supabaseAdmin) {
      const { data: user } = await supabaseAdmin
        .from("users")
        .select("id, email, name")
        .eq("clerk_id", userId)
        .single();

      if (user) {
        const { data: subscription } = await supabaseAdmin
          .from("subscriptions")
          .select("stripe_customer_id")
          .eq("user_id", user.id)
          .single();

        stripeCustomerId = subscription?.stripe_customer_id || null;

        // Create Stripe customer if doesn't exist
        if (!stripeCustomerId) {
          const customer = await stripe.customers.create({
            email: user.email,
            name: user.name || undefined,
            metadata: {
              clerk_id: userId,
            },
          });
          stripeCustomerId = customer.id;

          // Save customer ID to subscription
          if (subscription) {
            await supabaseAdmin
              .from("subscriptions")
              .update({ stripe_customer_id: stripeCustomerId })
              .eq("user_id", user.id);
          }
        }
      }
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: stripeCustomerId || undefined,
      customer_email: stripeCustomerId ? undefined : undefined,
      mode: "subscription",
      payment_method_types: ["card"],
      locale: locale === "th" ? "th" : "auto",
      line_items: [
        {
          price: planConfig.priceId,
          quantity: 1,
        },
      ],
      subscription_data: {
        trial_period_days: 7,
        trial_settings: {
          end_behavior: {
            missing_payment_method: "cancel",
          },
        },
        metadata: {
          clerk_id: userId,
          plan: plan,
          credits: planConfig.credits.toString(),
        },
      },
      payment_method_collection: "always", // Require payment method upfront
      success_url: `${request.headers.get("origin")}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${request.headers.get("origin")}/pricing`,
      metadata: {
        clerk_id: userId,
        plan: plan,
      },
    });

    return NextResponse.json({ sessionId: session.id, url: session.url });
  } catch (error) {
    console.error("Checkout error:", error);
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 }
    );
  }
}
