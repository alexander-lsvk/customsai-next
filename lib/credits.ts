import { supabaseAdmin, isSupabaseConfigured } from "./supabase";

interface CreditCheckResult {
  allowed: boolean;
  remaining: number;
  plan: string;
  message: string;
}

interface UserCredits {
  credits_remaining: number;
  credits_used: number;
  plan: string;
}

// Get user by Clerk ID
export async function getUserByClerkId(clerkId: string) {
  if (!isSupabaseConfigured() || !supabaseAdmin) {
    console.warn("Supabase not configured, skipping user lookup");
    return null;
  }

  // First get the user
  const { data: user, error: userError } = await supabaseAdmin
    .from("users")
    .select("*")
    .eq("clerk_id", clerkId)
    .single();

  if (userError || !user) {
    console.error("Error fetching user:", userError);
    return null;
  }

  // Then get subscription separately
  const { data: subscriptions, error: subError } = await supabaseAdmin
    .from("subscriptions")
    .select("*")
    .eq("user_id", user.id);

  if (subError) {
    console.error("Error fetching subscription:", subError);
  }

  return {
    ...user,
    subscriptions: subscriptions || [],
  };
}

// Check if user can classify (has credits)
export async function checkCredits(clerkId: string): Promise<CreditCheckResult> {
  // If Supabase not configured, allow unlimited (dev mode)
  if (!isSupabaseConfigured()) {
    return {
      allowed: true,
      remaining: -1,
      plan: "dev",
      message: "Development mode - unlimited",
    };
  }

  const user = await getUserByClerkId(clerkId);

  if (!user) {
    // User not in database yet - give them free trial
    return {
      allowed: true,
      remaining: 5,
      plan: "free",
      message: "Free trial",
    };
  }

  const subscription = user.subscriptions?.[0];
  const plan = subscription?.plan || "free";

  // Enterprise has unlimited
  if (plan === "enterprise") {
    return {
      allowed: true,
      remaining: -1, // -1 means unlimited
      plan,
      message: "Unlimited classifications",
    };
  }

  // Check credits
  if (user.credits_remaining <= 0) {
    return {
      allowed: false,
      remaining: 0,
      plan,
      message: "No credits remaining. Please upgrade your plan.",
    };
  }

  return {
    allowed: true,
    remaining: user.credits_remaining,
    plan,
    message: "OK",
  };
}

// Use a credit (call after successful classification)
export async function useCredit(clerkId: string): Promise<boolean> {
  if (!isSupabaseConfigured() || !supabaseAdmin) {
    return true; // Dev mode - always succeed
  }

  const user = await getUserByClerkId(clerkId);

  if (!user) {
    return true; // User not synced yet, will be created by webhook
  }

  const subscription = user.subscriptions?.[0];
  const plan = subscription?.plan || "free";

  // Enterprise just increments usage, no decrement
  if (plan === "enterprise") {
    const { error } = await supabaseAdmin
      .from("users")
      .update({
        credits_used: user.credits_used + 1,
      })
      .eq("clerk_id", clerkId);

    return !error;
  }

  // Decrement credit
  const { error } = await supabaseAdmin
    .from("users")
    .update({
      credits_remaining: user.credits_remaining - 1,
      credits_used: user.credits_used + 1,
    })
    .eq("clerk_id", clerkId);

  return !error;
}

// Get user credits info
export async function getUserCredits(clerkId: string): Promise<UserCredits | null> {
  if (!isSupabaseConfigured()) {
    return {
      credits_remaining: -1,
      credits_used: 0,
      plan: "dev",
    };
  }

  const user = await getUserByClerkId(clerkId);

  if (!user) {
    return {
      credits_remaining: 5,
      credits_used: 0,
      plan: "free",
    };
  }

  const subscription = user.subscriptions?.[0];
  const plan = subscription?.plan || "free";

  console.log(`[getUserCredits] clerkId: ${clerkId}, subscription:`, subscription, `plan: ${plan}`);

  return {
    credits_remaining: user.credits_remaining,
    credits_used: user.credits_used,
    plan,
  };
}

// Save classification to history
export async function saveClassification(
  clerkId: string,
  data: {
    description: string;
    hs_code: string;
    hs_description?: string;
    confidence: number;
    reasoning?: string;
    alternatives?: unknown[];
    edge_cases?: unknown[];
    tokens_used?: number;
  }
) {
  if (!isSupabaseConfigured() || !supabaseAdmin) {
    return null; // Dev mode - skip saving
  }

  const user = await getUserByClerkId(clerkId);

  if (!user) {
    return null;
  }

  const { data: classification, error } = await supabaseAdmin
    .from("classifications")
    .insert({
      user_id: user.id,
      description: data.description,
      hs_code: data.hs_code,
      hs_description: data.hs_description,
      confidence: data.confidence,
      reasoning: data.reasoning,
      alternatives: data.alternatives,
      edge_cases: data.edge_cases,
      tokens_used: data.tokens_used || 0,
    })
    .select()
    .single();

  if (error) {
    console.error("Error saving classification:", error);
    return null;
  }

  return classification;
}

// Get user's classification history
export async function getClassificationHistory(
  clerkId: string,
  limit = 50,
  offset = 0
) {
  if (!isSupabaseConfigured() || !supabaseAdmin) {
    return [];
  }

  const user = await getUserByClerkId(clerkId);

  if (!user) {
    return [];
  }

  const { data, error } = await supabaseAdmin
    .from("classifications")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    console.error("Error fetching history:", error);
    return [];
  }

  return data;
}
