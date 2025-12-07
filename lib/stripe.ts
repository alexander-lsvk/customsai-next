import Stripe from "stripe";

// Server-side Stripe client
const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

export const stripe = stripeSecretKey
  ? new Stripe(stripeSecretKey, {
      apiVersion: "2025-11-17.clover",
      typescript: true,
    })
  : null;

// Plan configuration with Stripe price IDs (will be populated after creating products)
export const STRIPE_PLANS = {
  growth: {
    name: "Growth",
    price: 4990, // THB
    credits: 300,
    priceId: process.env.STRIPE_GROWTH_PRICE_ID || "",
  },
  professional: {
    name: "Professional",
    price: 9990, // THB
    credits: 1000,
    priceId: process.env.STRIPE_PROFESSIONAL_PRICE_ID || "",
  },
  business: {
    name: "Business",
    price: 24990, // THB
    credits: 3000,
    priceId: process.env.STRIPE_BUSINESS_PRICE_ID || "",
  },
} as const;

export type StripePlanType = keyof typeof STRIPE_PLANS;
