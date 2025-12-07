import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";

// This endpoint creates test products and prices in Stripe
// Run once to set up products, then save the price IDs to .env.local
export async function POST() {
  if (!stripe) {
    return NextResponse.json(
      { error: "Stripe not configured" },
      { status: 500 }
    );
  }

  try {
    const plans = [
      {
        name: "Growth",
        description: "Perfect for small brokers getting started - 300 classifications/month",
        price: 4990,
        credits: 300,
      },
      {
        name: "Professional",
        description: "For growing teams with higher volume - 1,000 classifications/month",
        price: 9990,
        credits: 1000,
      },
      {
        name: "Business",
        description: "Advanced features for large operations - 3,000 classifications/month",
        price: 24990,
        credits: 3000,
      },
    ];

    const createdPlans = [];

    for (const plan of plans) {
      // Create product
      const product = await stripe.products.create({
        name: `Customs AI - ${plan.name}`,
        description: plan.description,
        metadata: {
          credits: plan.credits.toString(),
          plan: plan.name.toLowerCase(),
        },
      });

      // Create price with 7-day free trial
      const price = await stripe.prices.create({
        product: product.id,
        unit_amount: plan.price * 100, // Stripe uses smallest currency unit (satang for THB)
        currency: "thb",
        recurring: {
          interval: "month",
          trial_period_days: 7,
        },
        metadata: {
          credits: plan.credits.toString(),
          plan: plan.name.toLowerCase(),
        },
      });

      createdPlans.push({
        plan: plan.name,
        productId: product.id,
        priceId: price.id,
        price: plan.price,
        credits: plan.credits,
      });
    }

    return NextResponse.json({
      success: true,
      message: "Products created successfully. Add these price IDs to your .env.local:",
      plans: createdPlans,
      envVars: {
        STRIPE_GROWTH_PRICE_ID: createdPlans.find(p => p.plan === "Growth")?.priceId,
        STRIPE_PROFESSIONAL_PRICE_ID: createdPlans.find(p => p.plan === "Professional")?.priceId,
        STRIPE_BUSINESS_PRICE_ID: createdPlans.find(p => p.plan === "Business")?.priceId,
      },
    });
  } catch (error) {
    console.error("Error creating products:", error);
    return NextResponse.json(
      { error: "Failed to create products" },
      { status: 500 }
    );
  }
}
