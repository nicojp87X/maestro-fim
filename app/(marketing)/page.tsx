import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function LandingPage() {
  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="max-w-6xl mx-auto px-4 py-20 md:py-32 text-center">
        <div className="inline-flex items-center gap-2 bg-primary/10 text-primary text-sm px-4 py-1.5 rounded-full mb-6 font-medium">
          🧬 Basado en el marco FIM
        </div>
        <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6 leading-tight">
          Tus analíticas,{" "}
          <span className="text-primary">interpretadas con inteligencia</span>
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
          Sube tu analítica de sangre y recibe un informe personalizado basado en
          los principios de Flexibilidad Inmunometabólica. Nutrición, ejercicio,
          sueño y suplementación adaptados a tu bioquímica real.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button size="lg" asChild>
            <Link href="/auth/register">Analiza tus resultados →</Link>
          </Button>
          <Button size="lg" variant="outline" asChild>
            <Link href="/pricing">Ver precios</Link>
          </Button>
        </div>
      </section>

      {/* How it works */}
      <section className="bg-muted/30 py-20">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-4">Así de sencillo</h2>
          <p className="text-muted-foreground text-center mb-12 max-w-xl mx-auto">
            En menos de 2 minutos tienes tu informe FIM completo listo para revisar.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                step: "01",
                title: "Sube tu analítica",
                description:
                  "Foto o PDF de tu análisis de sangre. Aceptamos todos los formatos de laboratorio.",
                icon: "📤",
              },
              {
                step: "02",
                title: "IA interpreta tus valores",
                description:
                  "Claude analiza cada biomarcador bajo el marco FIM y los compara con los rangos óptimos funcionales.",
                icon: "🤖",
              },
              {
                step: "03",
                title: "Recibe tu informe personalizado",
                description:
                  "Informe completo con puntuación FIM, análisis metabólico e inmunitario, y recomendaciones concretas.",
                icon: "📋",
              },
            ].map((item) => (
              <div key={item.step} className="flex flex-col items-center text-center">
                <div className="text-4xl mb-4">{item.icon}</div>
                <div className="text-xs font-bold text-primary mb-2">{item.step}</div>
                <h3 className="text-lg font-semibold mb-2">{item.title}</h3>
                <p className="text-muted-foreground text-sm">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* What you get */}
      <section className="max-w-6xl mx-auto px-4 py-20">
        <h2 className="text-3xl font-bold text-center mb-4">
          Más que una analítica. Un mapa de tu salud.
        </h2>
        <p className="text-muted-foreground text-center mb-12 max-w-xl mx-auto">
          Los rangos de referencia del laboratorio son el mínimo para no estar enfermo.
          El marco FIM define los rangos para estar en tu mejor estado.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            {
              icon: "📊",
              title: "Puntuación FIM Global",
              desc: "Score 0–100 de tu flexibilidad metabólica e inmunitaria con subpuntuaciones detalladas.",
            },
            {
              icon: "⚖️",
              title: "Balance AMPK / mTOR",
              desc: "El equilibrio entre las vías de regeneración celular y construcción tisular, clave en la longevidad funcional.",
            },
            {
              icon: "🔬",
              title: "Análisis de 50+ biomarcadores",
              desc: "Glucosa, insulina, lípidos, tiroides, hormonas, inflamación, micronutrientes y más, con semáforo FIM.",
            },
            {
              icon: "🥗",
              title: "Nutrición reguladora",
              desc: "Distribución de macros, timing de comidas, alimentos a priorizar y a limitar basados en tu perfil.",
            },
            {
              icon: "🏃",
              title: "Ejercicio como señal",
              desc: "Tipo, intensidad y frecuencia óptima según tu estado metabólico e inmunitario actual.",
            },
            {
              icon: "💊",
              title: "Suplementación basada en evidencia",
              desc: "Solo lo que tu análisis indica que necesitas, con dosis y timing específicos.",
            },
          ].map((feature) => (
            <Card key={feature.title} className="border">
              <CardContent className="pt-6">
                <div className="text-3xl mb-3">{feature.icon}</div>
                <h3 className="font-semibold mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* FIM Philosophy */}
      <section className="bg-primary/5 border-y py-20">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-6">¿Qué es la Flexibilidad Inmunometabólica?</h2>
          <p className="text-muted-foreground text-lg leading-relaxed mb-6">
            La FIM es la capacidad del organismo para adaptar sus rutas metabólicas e
            inmunitarias a las demandas del entorno. Un metabolismo flexible puede
            alternar entre glucosa y grasa como combustible sin estrés oxidativo.
            Un sistema inmune flexible responde con precisión, sin inflamación crónica.
          </p>
          <p className="text-muted-foreground text-lg leading-relaxed mb-10">
            El equilibrio AMPK/mTOR governa estos dos mundos: AMPK activa la
            limpieza celular (autofagia, cetosis), mTOR activa la construcción y
            reparación. Maestro FIM lee tus analíticas para decirte exactamente
            dónde estás y cómo optimizar ese equilibrio.
          </p>
          <Button size="lg" asChild>
            <Link href="/auth/register">Descubre tu estado FIM →</Link>
          </Button>
        </div>
      </section>

      {/* Pricing CTA */}
      <section className="max-w-6xl mx-auto px-4 py-20 text-center">
        <h2 className="text-3xl font-bold mb-4">Sin complicaciones</h2>
        <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
          Un solo plan, acceso completo. Análisis ilimitados, sin coste por informe.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-center">
          <div className="text-center">
            <p className="text-5xl font-bold">29€</p>
            <p className="text-muted-foreground">/ mes</p>
          </div>
          <div className="text-muted-foreground hidden sm:block">o</div>
          <div className="text-center">
            <p className="text-5xl font-bold">249€</p>
            <p className="text-muted-foreground">/ año (ahorra 99€)</p>
          </div>
        </div>
        <Button size="lg" className="mt-8" asChild>
          <Link href="/auth/register">Empezar ahora</Link>
        </Button>
        <p className="text-xs text-muted-foreground mt-4">
          Cancela cuando quieras · Pago seguro con Stripe
        </p>
      </section>
    </div>
  );
}
