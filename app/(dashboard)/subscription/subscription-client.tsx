"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils/format";
import { useLanguage } from "@/lib/i18n/context";

interface SubscriptionClientProps {
  subscription?: {
    plan: string;
    status: string;
    current_period_end: string;
    cancel_at_period_end: boolean;
  } | null;
}

export function SubscriptionClient({ subscription }: SubscriptionClientProps) {
  const [loading, setLoading] = useState<string | null>(null);
  const { t, tArray } = useLanguage();

  const handlePortal = async () => {
    setLoading("portal");
    try {
      const res = await fetch("/api/stripe/portal", { method: "POST" });
      const data = await res.json();
      if (!res.ok || !data.url) {
        toast.error(data.error ?? t("sub_error_portal"));
        setLoading(null);
        return;
      }
      window.location.href = data.url;
    } catch {
      toast.error(t("sub_error_network"));
      setLoading(null);
    }
  };

  const handleCheckout = async (plan: "monthly" | "annual") => {
    setLoading(plan);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      });
      const data = await res.json();
      if (!res.ok || !data.url) {
        toast.error(data.error ?? t("sub_error_checkout"));
        setLoading(null);
        return;
      }
      window.location.href = data.url;
    } catch {
      toast.error(t("sub_error_network"));
      setLoading(null);
    }
  };

  const isPaid =
    subscription?.status === "active" || subscription?.status === "trialing";
  const isFree = subscription?.plan === "free" && !isPaid;
  const currentPlan = subscription?.plan;

  // --- Active paid subscription view ---
  if (isPaid && currentPlan !== "free") {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <h1 className="text-2xl font-bold">{t("sub_title_active")}</h1>

        <Card>
          <CardHeader>
            <CardTitle>{t("sub_active_plan")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">{t("sub_plan_label")}</p>
                <p className="font-medium capitalize">
                  {currentPlan === "monthly" ? t("sub_plan_monthly") : t("sub_plan_annual")}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t("sub_status_label")}</p>
                <p className="font-medium text-green-600">{t("sub_status_active")}</p>
              </div>
              {subscription!.current_period_end && (
                <div>
                  <p className="text-sm text-muted-foreground">
                    {subscription!.cancel_at_period_end
                      ? t("sub_cancels_on")
                      : t("sub_next_charge")}
                  </p>
                  <p className="font-medium">
                    {formatDate(subscription!.current_period_end)}
                  </p>
                </div>
              )}
            </div>

            {subscription!.cancel_at_period_end && (
              <div className="p-3 bg-yellow-50 dark:bg-yellow-950/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                <p className="text-sm text-yellow-800 dark:text-yellow-400">
                  {t("sub_cancel_warning")}
                </p>
              </div>
            )}

            <Button
              onClick={handlePortal}
              disabled={loading !== null}
              variant="outline"
            >
              {loading === "portal" ? (
                <>
                  <Loader2 className="animate-spin mr-2 h-4 w-4" />
                  {t("sub_redirecting")}
                </>
              ) : (
                t("sub_manage_btn")
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // --- Plans selection view (free or no subscription) ---
  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold">
          {isFree ? t("sub_title_upgrade") : t("sub_title_activate")}
        </h1>
        <p className="text-muted-foreground mt-1">
          {isFree ? t("sub_subtitle_upgrade") : t("sub_subtitle_activate")}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Free */}
        <Card className={`border-2 ${isFree ? "border-primary" : ""}`}>
          {isFree && (
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-xs font-bold px-3 py-1 rounded-full">
              {t("sub_current_badge")}
            </div>
          )}
          <CardHeader className="relative">
            <CardTitle>{t("sub_free_name")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-4xl font-bold">{t("sub_free_price")}</p>
              <p className="text-muted-foreground text-sm">{t("sub_free_period")}</p>
            </div>
            <ul className="space-y-2 text-sm">
              {tArray("sub_free_features").map((feature) => (
                <li key={feature} className="flex items-center gap-2">
                  <span className="text-green-600">✓</span>
                  {feature}
                </li>
              ))}
              {tArray("sub_free_locked").map((feature) => (
                <li key={feature} className="flex items-center gap-2 text-muted-foreground line-through">
                  <span>✗</span>
                  {feature}
                </li>
              ))}
            </ul>
            <Button className="w-full" variant="outline" disabled>
              {isFree ? t("sub_free_current_btn") : t("sub_free_btn")}
            </Button>
          </CardContent>
        </Card>

        {/* Monthly */}
        <Card className="border-2">
          <CardHeader>
            <CardTitle>{t("sub_monthly_name")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-4xl font-bold">{t("sub_monthly_price")}</p>
              <p className="text-muted-foreground text-sm">{t("sub_monthly_period")}</p>
            </div>
            <ul className="space-y-2 text-sm">
              {tArray("sub_monthly_features").map((feature) => (
                <li key={feature} className="flex items-center gap-2">
                  <span className="text-green-600">✓</span>
                  {feature}
                </li>
              ))}
            </ul>
            <Button
              onClick={() => handleCheckout("monthly")}
              disabled={loading !== null}
              className="w-full"
              variant="outline"
            >
              {loading === "monthly" ? (
                <>
                  <Loader2 className="animate-spin mr-2 h-4 w-4" />
                  {t("sub_redirecting")}
                </>
              ) : (
                t("sub_monthly_btn")
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Annual */}
        <Card className="border-2 border-primary relative">
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-xs font-bold px-3 py-1 rounded-full">
            {t("sub_annual_badge")}
          </div>
          <CardHeader>
            <CardTitle>{t("sub_annual_name")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-4xl font-bold">{t("sub_annual_price")}</p>
              <p className="text-muted-foreground text-sm">{t("sub_annual_period")}</p>
              <p className="text-green-600 text-sm font-medium">{t("sub_annual_save")}</p>
            </div>
            <ul className="space-y-2 text-sm">
              {tArray("sub_annual_features").map((feature) => (
                <li key={feature} className="flex items-center gap-2">
                  <span className="text-green-600">✓</span>
                  {feature}
                </li>
              ))}
            </ul>
            <Button
              onClick={() => handleCheckout("annual")}
              disabled={loading !== null}
              className="w-full"
            >
              {loading === "annual" ? (
                <>
                  <Loader2 className="animate-spin mr-2 h-4 w-4" />
                  {t("sub_redirecting")}
                </>
              ) : (
                t("sub_annual_btn")
              )}
            </Button>
          </CardContent>
        </Card>
      </div>

      <p className="text-xs text-muted-foreground text-center">
        {t("sub_footer")}
      </p>
    </div>
  );
}
