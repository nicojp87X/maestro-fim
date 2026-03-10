import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { Lock } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import FIMScoreGauge from "@/components/report/FIMScoreGauge";
import BiomarkerTable from "@/components/report/BiomarkerTable";
import AMPKMTORBalance from "@/components/report/AMPKMTORBalance";
import PriorityActions from "@/components/report/PriorityActions";
import {
  NutritionPanel,
  ExercisePanel,
  SleepPanel,
  SupplementPanel,
} from "@/components/report/RecommendationPanel";
import { formatDate } from "@/lib/utils/format";
import type {
  FIMReport,
  BiomarkerExtraction,
  MetabolicAnalysis,
  ImmuneAnalysis,
  AMPKMTORBalance as AMPKMTORBalanceType,
  NutritionRecommendations,
  ExerciseRecommendations,
  SleepRecommendations,
  SupplementRecommendations,
  PriorityAction,
} from "@/types/database";

// ── Paywall overlay component ───────────────────────────────────────────────
function PaywallOverlay() {
  return (
    <div className="absolute inset-0 z-10 flex flex-col items-center justify-center rounded-lg bg-background/80 backdrop-blur-sm border-2 border-dashed border-primary/30">
      <div className="text-center p-6 max-w-xs">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
          <Lock className="h-6 w-6 text-primary" />
        </div>
        <p className="font-semibold text-sm mb-1">Sección bloqueada</p>
        <p className="text-xs text-muted-foreground mb-4">
          Actualiza tu plan para acceder al análisis completo con las 10 secciones del informe FIM.
        </p>
        <Button asChild size="sm">
          <Link href="/subscription">Ver planes</Link>
        </Button>
      </div>
    </div>
  );
}

// ── Wrapper that optionally shows paywall ───────────────────────────────────
function MaybePaywalled({
  locked,
  children,
}: {
  locked: boolean;
  children: React.ReactNode;
}) {
  if (!locked) return <>{children}</>;
  return (
    <div className="relative">
      <div className="pointer-events-none select-none blur-sm opacity-40">
        {children}
      </div>
      <PaywallOverlay />
    </div>
  );
}

export default async function ReportPage({
  params,
}: {
  params: Promise<{ reportId: string }>;
}) {
  const { reportId } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login");

  const [{ data: report }, { data: subscription }] = await Promise.all([
    supabase
      .from("fim_reports")
      .select("*")
      .eq("id", reportId)
      .eq("user_id", user.id)
      .single(),
    supabase
      .from("subscriptions")
      .select("plan, status")
      .eq("user_id", user.id)
      .single(),
  ]);

  if (!report) notFound();

  const { data: biomarkers } = await supabase
    .from("biomarker_extractions")
    .select("*")
    .eq("job_id", report.job_id);

  const r = report as FIMReport;
  const bms = (biomarkers ?? []) as BiomarkerExtraction[];

  const metabolic = r.metabolic_analysis as MetabolicAnalysis;
  const immune = r.immune_analysis as ImmuneAnalysis;
  const ampkMtor = r.ampk_mtor_balance as AMPKMTORBalanceType;
  const nutrition = r.nutrition_recommendations as NutritionRecommendations;
  const exercise = r.exercise_recommendations as ExerciseRecommendations;
  const sleep = r.sleep_recommendations as SleepRecommendations;
  const supplements = r.supplement_recommendations as SupplementRecommendations;
  const priorityActions = (r.priority_actions ?? []) as PriorityAction[];
  const followUpMarkers = (r.follow_up_markers ?? []) as string[];

  // Determine if paywall should be applied
  const isPaid =
    subscription?.status === "active" || subscription?.status === "trialing";
  let isFreePlan = subscription?.plan === "free" || !isPaid;

  // Acceso total para usuarios del Modo Prueba
  if (user.email?.startsWith("test") && user.email?.endsWith("@maestro-fim.com")) {
    isFreePlan = false;
  }

  // Free users only see: FIM scores + executive summary + top 3 priority actions
  const locked = isFreePlan;

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-16">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <Link
            href="/reports"
            className="text-sm text-muted-foreground hover:text-foreground mb-2 inline-block"
          >
            ← Mis informes
          </Link>
          <h1 className="text-2xl font-bold">Informe FIM</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Generado el {formatDate(r.created_at!)}
          </p>
        </div>
        {locked && (
          <div className="flex items-center gap-3 p-3 bg-amber-50 dark:bg-amber-950/20 rounded-lg border border-amber-200 dark:border-amber-800">
            <Lock className="h-4 w-4 text-amber-600 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-amber-800 dark:text-amber-400">
                Informe de muestra — Plan gratuito
              </p>
              <p className="text-xs text-amber-700 dark:text-amber-500">
                Estás viendo el resumen ejecutivo y las 3 acciones prioritarias.{" "}
                <Link href="/subscription" className="underline font-medium">
                  Actualiza para ver el análisis completo.
                </Link>
              </p>
            </div>
          </div>
        )}
      </div>

      {/* FIM Scores — always visible */}
      <Card>
        <CardHeader>
          <CardTitle>Puntuación FIM</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <FIMScoreGauge score={r.fim_score ?? 0} label="FIM Global" />
            <FIMScoreGauge
              score={r.metabolic_flexibility_score ?? 0}
              label="Flex. Metabólica"
            />
            <FIMScoreGauge
              score={r.immune_flexibility_score ?? 0}
              label="Flex. Inmunitaria"
            />
          </div>
        </CardContent>
      </Card>

      {/* Executive Summary — always visible */}
      <Card>
        <CardHeader>
          <CardTitle>Resumen ejecutivo</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm leading-relaxed whitespace-pre-wrap">
            {r.executive_summary}
          </p>
        </CardContent>
      </Card>

      {/* Priority Actions — always visible (top 3 for free, all for paid) */}
      {priorityActions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>
              {locked ? "Top 3 acciones prioritarias" : "Top acciones prioritarias"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <PriorityActions
              actions={locked ? priorityActions.slice(0, 3) : priorityActions}
            />
          </CardContent>
        </Card>
      )}

      {/* ── PAYWALLED sections below ────────────────────────────────────── */}

      {/* Biomarker Table */}
      <MaybePaywalled locked={locked}>
        <Card>
          <CardHeader>
            <CardTitle>Biomarcadores</CardTitle>
          </CardHeader>
          <CardContent>
            <BiomarkerTable biomarkers={bms} />
          </CardContent>
        </Card>
      </MaybePaywalled>

      {/* AMPK/mTOR Balance */}
      {ampkMtor && (
        <MaybePaywalled locked={locked}>
          <Card>
            <CardHeader>
              <CardTitle>Balance AMPK / mTOR</CardTitle>
            </CardHeader>
            <CardContent>
              <AMPKMTORBalance data={ampkMtor} />
            </CardContent>
          </Card>
        </MaybePaywalled>
      )}

      {/* Analysis sections */}
      <MaybePaywalled locked={locked}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {metabolic && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Análisis Metabólico</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  {metabolic.summary}
                </p>
                {metabolic.key_findings?.length > 0 && (
                  <ul className="space-y-1.5">
                    {metabolic.key_findings.map((f, i) => (
                      <li key={i} className="text-sm flex items-start gap-2">
                        <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary flex-shrink-0" />
                        {f}
                      </li>
                    ))}
                  </ul>
                )}
                {metabolic.insulin_sensitivity && (
                  <p className="text-xs text-muted-foreground border-l-2 border-primary/30 pl-3">
                    <span className="font-medium">Sensibilidad insulínica: </span>
                    {metabolic.insulin_sensitivity}
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          {immune && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Análisis Inmunitario</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">{immune.summary}</p>
                {immune.key_findings?.length > 0 && (
                  <ul className="space-y-1.5">
                    {immune.key_findings.map((f, i) => (
                      <li key={i} className="text-sm flex items-start gap-2">
                        <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary flex-shrink-0" />
                        {f}
                      </li>
                    ))}
                  </ul>
                )}
                {immune.inflammation_status && (
                  <p className="text-xs text-muted-foreground border-l-2 border-primary/30 pl-3">
                    <span className="font-medium">Estado inflamatorio: </span>
                    {immune.inflammation_status}
                  </p>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </MaybePaywalled>

      {/* Recommendations */}
      <MaybePaywalled locked={locked}>
        <div className="space-y-6">
          <h2 className="text-xl font-semibold">Recomendaciones personalizadas</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {nutrition && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    🥗 Nutrición
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <NutritionPanel data={nutrition} />
                </CardContent>
              </Card>
            )}

            {exercise && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    🏃 Ejercicio
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ExercisePanel data={exercise} />
                </CardContent>
              </Card>
            )}

            {sleep && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    😴 Sueño y ritmo circadiano
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <SleepPanel data={sleep} />
                </CardContent>
              </Card>
            )}

            {supplements && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    💊 Suplementación
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <SupplementPanel data={supplements} />
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </MaybePaywalled>

      {/* Follow-up markers */}
      {followUpMarkers.length > 0 && (
        <MaybePaywalled locked={locked}>
          <Card>
            <CardHeader>
              <CardTitle>Biomarcadores a vigilar</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-3">
                Solicita estos marcadores en tu próxima analítica para hacer
                seguimiento de tu progreso:
              </p>
              <div className="flex flex-wrap gap-2">
                {followUpMarkers.map((marker, i) => (
                  <span
                    key={i}
                    className="text-sm px-3 py-1 bg-muted rounded-full border"
                  >
                    {marker}
                  </span>
                ))}
              </div>
            </CardContent>
          </Card>
        </MaybePaywalled>
      )}

      {/* Upgrade CTA for free users */}
      {locked && (
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="flex flex-col items-center text-center gap-4 py-8">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
              <Lock className="h-7 w-7 text-primary" />
            </div>
            <div>
              <h3 className="font-bold text-lg mb-1">
                Desbloquea el análisis completo
              </h3>
              <p className="text-muted-foreground text-sm max-w-md">
                Accede a las 10 secciones del informe FIM: biomarcadores en
                detalle, balance AMPK/mTOR, análisis metabólico e inmunitario,
                y recomendaciones personalizadas de nutrición, ejercicio, sueño
                y suplementación.
              </p>
            </div>
            <div className="flex gap-3">
              <Button asChild>
                <Link href="/subscription">Actualizar plan</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/subscription">Ver precios</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Model attribution */}
      <p className="text-xs text-muted-foreground text-center">
        Informe generado por Maestro FIM · Modelo {r.model_version} · No
        constituye diagnóstico médico
      </p>
    </div>
  );
}
