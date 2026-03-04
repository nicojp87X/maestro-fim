import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { SubscriptionClient } from "./subscription-client";

export default async function SubscriptionPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login");

  // Try to fetch existing subscription
  let { data: subscription } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("user_id", user.id)
    .single();

  // Auto-create free subscription if none exists (mirrors dashboard logic)
  if (!subscription) {
    const { data: newSub } = await supabase
      .from("subscriptions")
      .insert({
        user_id: user.id,
        plan: "free",
        status: "active",
        cancel_at_period_end: false,
        // stripe_customer_id will be created on first checkout attempt
      })
      .select("*")
      .single();

    subscription = newSub;
  }

  return <SubscriptionClient subscription={subscription} />;
}
