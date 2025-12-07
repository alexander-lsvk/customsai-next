import { Webhook } from "svix";
import { headers } from "next/headers";
import { WebhookEvent } from "@clerk/nextjs/server";
import { supabaseAdmin, isSupabaseConfigured } from "@/lib/supabase";

export async function POST(req: Request) {
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;

  if (!WEBHOOK_SECRET) {
    console.error("Missing CLERK_WEBHOOK_SECRET");
    return new Response("Webhook secret not configured", { status: 500 });
  }

  if (!isSupabaseConfigured() || !supabaseAdmin) {
    console.error("Supabase not configured");
    return new Response("Supabase not configured", { status: 500 });
  }

  // Get the headers
  const headerPayload = await headers();
  const svix_id = headerPayload.get("svix-id");
  const svix_timestamp = headerPayload.get("svix-timestamp");
  const svix_signature = headerPayload.get("svix-signature");

  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response("Missing svix headers", { status: 400 });
  }

  // Get the body
  const payload = await req.json();
  const body = JSON.stringify(payload);

  // Verify the webhook
  const wh = new Webhook(WEBHOOK_SECRET);
  let evt: WebhookEvent;

  try {
    evt = wh.verify(body, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    }) as WebhookEvent;
  } catch (err) {
    console.error("Webhook verification failed:", err);
    return new Response("Webhook verification failed", { status: 400 });
  }

  const eventType = evt.type;

  // Handle user.created event
  if (eventType === "user.created") {
    const { id, email_addresses, first_name, last_name } = evt.data;

    const email = email_addresses?.[0]?.email_address;
    const name = [first_name, last_name].filter(Boolean).join(" ") || null;

    if (!email) {
      console.error("No email found for user:", id);
      return new Response("No email found", { status: 400 });
    }

    try {
      // Create user with 5 free credits
      const { data: user, error: userError } = await supabaseAdmin
        .from("users")
        .insert({
          clerk_id: id,
          email: email,
          name: name,
          credits_remaining: 5,
          credits_used: 0,
        })
        .select()
        .single();

      if (userError) {
        console.error("Error creating user:", userError);
        return new Response("Error creating user", { status: 500 });
      }

      // Create free subscription
      const { error: subError } = await supabaseAdmin
        .from("subscriptions")
        .insert({
          user_id: user.id,
          plan: "free",
          status: "active",
        });

      if (subError) {
        console.error("Error creating subscription:", subError);
        return new Response("Error creating subscription", { status: 500 });
      }

      console.log("Created user with free subscription:", email);
      return new Response("User created", { status: 200 });
    } catch (error) {
      console.error("Webhook error:", error);
      return new Response("Internal error", { status: 500 });
    }
  }

  // Handle user.updated event
  if (eventType === "user.updated") {
    const { id, email_addresses, first_name, last_name } = evt.data;

    const email = email_addresses?.[0]?.email_address;
    const name = [first_name, last_name].filter(Boolean).join(" ") || null;

    try {
      const { error } = await supabaseAdmin
        .from("users")
        .update({
          email: email,
          name: name,
        })
        .eq("clerk_id", id);

      if (error) {
        console.error("Error updating user:", error);
        return new Response("Error updating user", { status: 500 });
      }

      console.log("Updated user:", email);
      return new Response("User updated", { status: 200 });
    } catch (error) {
      console.error("Webhook error:", error);
      return new Response("Internal error", { status: 500 });
    }
  }

  // Handle user.deleted event
  if (eventType === "user.deleted") {
    const { id } = evt.data;

    try {
      const { error } = await supabaseAdmin
        .from("users")
        .delete()
        .eq("clerk_id", id);

      if (error) {
        console.error("Error deleting user:", error);
        return new Response("Error deleting user", { status: 500 });
      }

      console.log("Deleted user:", id);
      return new Response("User deleted", { status: 200 });
    } catch (error) {
      console.error("Webhook error:", error);
      return new Response("Internal error", { status: 500 });
    }
  }

  return new Response("Webhook received", { status: 200 });
}
