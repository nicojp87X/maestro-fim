"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatPrice, formatDate } from "@/lib/utils/format";

interface SubscriptionClientProps {
  subscription?: {
    plan: string;
    status: string;
    current_period_end: string;
    cancel_at_period_end: boolean;
  } | null;
}

export function SubscriptionClient({ subscription }: SubscriptionClientProps) {
  const [loading, setLoading] = useState(false);

  const handlePortal = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/stripe/portal", { method: "POST" });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
    } catch {
      setLoading(false);
    }
  };

  const handleCheckout = async (plan: "monthly" | "annual") => {
    setLoading(true);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
    } catch {
      setLoading(false);
    }
  };

  const isActive =
    subscription?.status === "active" || subscription?.status === "trialing";

  if (isActive) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <h1 className="text-2xl font-bold">Suscripción</h1>

        <Card>
          <CardHeader>
            <CardTitle>Plan activo</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Plan</p>
                <p className="font-medium capitalize">
                  {subscription!.plan === "monthly" ? "Mensual" : "Anual"}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Estado</p>
                <p className="font-medium text-green-600">Activo</p>
              </div>
              {subscription!.current_period_end && (
                <div>
                  <p className="text-sm text-muted-foreground">
                    {subscription!.cancel_at_period_end
                      ? "Cancela el"
                      : "Próximo cobro"}
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
                  Tu suscripción está programada para cancelarse al final del período.
                  Puedes reactivarla desde el portal de cliente.
                </p>
              </div>
            )}

            <Button onClick={handlePortal} disabled={loading} variant="outline">
              {loading ? "Redirigiendo..." : "Gestionar suscripción"}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Activa tu suscripción</h1>
        <p className="text-muted-foreground mt-1">
          Accede a análisis FIM ilimitados con cualquier plan.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Monthly */}
        <Card className="border-2">
          <CardHeader>
            <CardTitle>Mensual</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-4xl font-bold">29€</p>
              <p className="text-muted-foreground text-sm">por mes</p>
            </div>
            <ul className="space-y-2 text-sm">
              {[
                "Análisis FIM ilimitados",
                "Informe completo con 10 secciones",
                "Recomendaciones personalizadas",
                "Acceso a historial de análisis",
                "Soporte por email",
              ].map((feature) => (
                <li key={feature} className="flex items-center gap-2">
                  <span className="text-green-600">✓</span>
                  {feature}
                </li>
              ))}
            </ul>
            <Button
              onClick={() => handleCheckout("monthly")}
              disabled={loading}
              className="w-full"
              variant="outline"
            >
              {loading ? "Redirigiendo..." : "Empezar con mensual"}
            </Button>
          </CardContent>
        </Card>

        {/* Annual */}
        <Card className="border-2 border-primary relative">
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-xs font-bold px-3 py-1 rounded-full">
            Más popular
          </div>
          <CardHeader>
            <CardTitle>Anual</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-4xl font-bold">249€</p>
              <p className="text-muted-foreground text-sm">por año (~20€/mes)</p>
              <p className="text-green-600 text-sm font-medium">Ahorra 99€ al año</p>
            </div>
            <ul className="space-y-2 text-sm">
              {[
                "Todo lo incluido en mensual",
                "Ahorro de más del 30%",
                "Acceso garantizado 12 meses",
                "Prioridad en nuevas funciones",
                "Soporte prioritario",
              ].map((feature) => (
                <li key={feature} className="flex items-center gap-2">
                  <span className="text-green-600">✓</span>
                  {feature}
                </li>
              ))}
            </ul>
            <Button
              onClick={() => handleCheckout("annual")}
              disabled={loading}
              className="w-full"
            >
              {loading ? "Redirigiendo..." : "Empezar con anual"}
            </Button>
          </CardContent>
        </Card>
      </div>

      <p className="text-xs text-muted-foreground text-center">
        Cancela en cualquier momento · Pago seguro con Stripe · Sin permanencia
      </p>
    </div>
  );
}
