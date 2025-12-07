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
  plan: "free" | "growth" | "professional" | "business";
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
    name: "Free Trial",
    credits: 5,
    price: 0,
    features: ["5 free classifications", "Basic support"],
  },
  growth: {
    name: "Growth",
    credits: 300,
    price: 4990, // THB
    features: [
      "300 classifications/month",
      "Smart reasoning for tricky cases",
      "Full tariff display",
      "Classification history & export",
    ],
  },
  professional: {
    name: "Professional",
    credits: 1000,
    price: 9990, // THB
    features: [
      "1,000 classifications/month",
      "Smart reasoning for tricky cases",
      "Full tariff display",
      "Classification history & export",
      "Priority email support",
      "Bulk classification processing",
    ],
  },
  business: {
    name: "Business",
    credits: 3000,
    price: 24990, // THB
    features: [
      "3,000 classifications/month",
      "Smart reasoning for tricky cases",
      "Full tariff display",
      "Classification history & export",
      "Priority email support",
      "Bulk classification processing",
      "API access",
      "Dedicated account manager",
    ],
  },
} as const;

export type PlanType = keyof typeof PLANS;
