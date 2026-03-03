"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const MONTHLY_FEATURES = [
  "Análisis FIM ilimitados",
  "Informe completo con 10 secciones",
  "Tabla de biomarcadores con semáforo FIM",
  "Análisis metabólico e inmunitario",
  "Balance AMPK/mTOR",
  "Recomendaciones de nutrición personalizadas",
  "Plan de ejercicio adaptado",
  "Pautas de sueño y ritmo circadiano",
  "Suplementación basada en evidencia",
  "Historial de análisis",
  "Soporte por email",
];

const ANNUAL_EXTRAS = [
  "Todo lo incluido en mensual",
  "Ahorro de más del 30% (99€/año)",
  "Prioridad en nuevas funciones",
  "Soporte prioritario",
];

export default function PricingPage() {
  const [loading, setLoading] = useState<string | null>(null);
  const router = useRouter();

  const handleCheckout = async (plan: "monthly" | "annual") => {
    setLoading(plan);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else if (res.status === 401) {
        router.push("/auth/register");
      }
    } catch {
      setLoading(null);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-16 md:py-24">
      <div className="text-center mb-14">
        <h1 className="text-4xl font-bold mb-4">Precios simples y transparentes</h1>
        <p className="text-xl text-muted-foreground max-w-xl mx-auto">
          Un plan, acceso completo. Sin límites por informe ni funciones ocultas.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-3xl mx-auto">
        {/* Monthly */}
        <Card className="border-2">
          <CardHeader className="pb-2">
            <p className="text-sm font-medium text-muted-foreground">Mensual</p>
            <CardTitle className="text-4xl font-bold">
              29€
              <span className="text-lg font-normal text-muted-foreground"> / mes</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <ul className="space-y-2.5">
              {MONTHLY_FEATURES.map((f) => (
                <li key={f} className="flex items-start gap-2.5 text-sm">
                  <svg
                    className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  {f}
                </li>
              ))}
            </ul>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => handleCheckout("monthly")}
              disabled={loading !== null}
            >
              {loading === "monthly" ? "Redirigiendo..." : "Empezar con mensual"}
            </Button>
          </CardContent>
        </Card>

        {/* Annual */}
        <Card className="border-2 border-primary relative">
          <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-xs font-bold px-4 py-1 rounded-full whitespace-nowrap">
            ✨ Más popular · Ahorra 99€
          </div>
          <CardHeader className="pb-2">
            <p className="text-sm font-medium text-muted-foreground">Anual</p>
            <CardTitle className="text-4xl font-bold">
              249€
              <span className="text-lg font-normal text-muted-foreground"> / año</span>
            </CardTitle>
            <p className="text-green-600 text-sm font-medium">~20,75€/mes · Ahorra 99€</p>
          </CardHeader>
          <CardContent className="space-y-6">
            <ul className="space-y-2.5">
              {ANNUAL_EXTRAS.map((f) => (
                <li key={f} className="flex items-start gap-2.5 text-sm">
                  <svg
                    className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  {f}
                </li>
              ))}
            </ul>
            <Button
              className="w-full"
              onClick={() => handleCheckout("annual")}
              disabled={loading !== null}
            >
              {loading === "annual" ? "Redirigiendo..." : "Empezar con anual"}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* FAQ */}
      <div className="mt-20 max-w-2xl mx-auto">
        <h2 className="text-2xl font-bold text-center mb-8">Preguntas frecuentes</h2>
        <div className="space-y-6">
          {[
            {
              q: "¿Cuántos análisis puedo hacer?",
              a: "Ilimitados. No hay límite por informe ni coste adicional por análisis.",
            },
            {
              q: "¿Qué formatos de analítica acepta?",
              a: "PDF e imágenes (JPG, PNG, HEIC). Soportamos cualquier laboratorio español o internacional.",
            },
            {
              q: "¿Es un diagnóstico médico?",
              a: "No. Los informes de Maestro FIM son orientativos y educativos. Siempre consulta con tu médico para decisiones clínicas.",
            },
            {
              q: "¿Puedo cancelar en cualquier momento?",
              a: "Sí. Cancelas desde tu portal de cliente y mantienes el acceso hasta el final del período pagado.",
            },
            {
              q: "¿Cómo se protegen mis datos?",
              a: "Tus analíticas se almacenan cifradas en Supabase (AWS). Solo tú tienes acceso. Nunca compartimos datos con terceros.",
            },
          ].map((faq) => (
            <div key={faq.q} className="border-b pb-6">
              <p className="font-medium mb-2">{faq.q}</p>
              <p className="text-muted-foreground text-sm">{faq.a}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="text-center mt-12">
        <p className="text-muted-foreground text-sm">
          Pago seguro con Stripe · Factura incluida · Sin permanencia
        </p>
      </div>
    </div>
  );
}
