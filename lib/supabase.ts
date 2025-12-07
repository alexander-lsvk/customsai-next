import { createClient, SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

// Client-side Supabase client (limited permissions)
export const supabase: SupabaseClient | null =
  supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey)
    : null;

// Server-side Supabase client (full permissions for webhooks/API routes)
export const supabaseAdmin: SupabaseClient | null =
  supabaseUrl && supabaseServiceKey
    ? createClient(supabaseUrl, supabaseServiceKey)
    : null;

// Helper to check if Supabase is configured
export function isSupabaseConfigured(): boolean {
  return !!(supabaseUrl && supabaseServiceKey);
}

// Types for our database
export interface User {
  id: string;
  clerk_id: string;
  email: string;
  name: string | null;
  credits_remaining: number;
  credits_used: number;
  created_at: string;
  updated_at: string;
}

export interface Subscription {
  id: string;
  user_id: string;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  plan: "free" | "starter" | "pro" | "business" | "enterprise";
  status: "active" | "canceled" | "past_due" | "trialing" | "incomplete";
  current_period_start: string | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
  created_at: string;
  updated_at: string;
}

export interface Classification {
  id: string;
  user_id: string;
  description: string;
  hs_code: string;
  confidence: number;
  tokens_used: number;
  created_at: string;
}

// Plan configuration
export const PLANS = {
  free: {
    name: "Free",
    credits: 5,
    price: 0,
    features: ["5 free classifications", "Basic support"],
  },
  starter: {
    name: "Starter",
    credits: 100,
    price: 299, // THB
    features: ["100 classifications/month", "Email support"],
  },
  pro: {
    name: "Pro",
    credits: 500,
    price: 990, // THB
    features: ["500 classifications/month", "Priority support", "Export history"],
  },
  business: {
    name: "Business",
    credits: 1500,
    price: 2990, // THB
    features: ["1,500 classifications/month", "API access", "Dedicated support"],
  },
  enterprise: {
    name: "Enterprise",
    credits: -1, // Unlimited
    price: 9990, // THB
    features: ["Unlimited classifications", "Custom integration", "SLA"],
  },
} as const;

export type PlanType = keyof typeof PLANS;
