import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { SubscriptionClient } from "./subscription-client";

export default async function SubscriptionPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login");

  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("user_id", user.id)
    .single();

  return <SubscriptionClient subscription={subscription} />;
}
