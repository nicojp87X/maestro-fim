export const PLANS = {
  monthly: {
    name: "Mensual",
    priceId: process.env.STRIPE_MONTHLY_PRICE_ID!,
    price: 2900, // cents = 29€
    interval: "month" as const,
    description: "Análisis ilimitados, informe FIM completo",
    features: [
      "Análisis ilimitados de analíticas",
      "Informe FIM completo con puntuación",
      "Recomendaciones personalizadas de nutrición",
      "Plan de ejercicio y suplementación",
      "Historial de todos tus informes",
      "Soporte por email",
    ],
  },
  annual: {
    name: "Anual",
    priceId: process.env.STRIPE_ANNUAL_PRICE_ID!,
    price: 24900, // cents = 249€
    interval: "year" as const,
    description: "Análisis ilimitados + ahorra 99€ vs mensual",
    badge: "Más popular",
    features: [
      "Todo lo incluido en el plan Mensual",
      "Ahorro de 99€ al año",
      "Acceso prioritario a nuevas funciones",
      "Informe de evolución anual",
    ],
  },
} as const;

export type PlanId = keyof typeof PLANS;
