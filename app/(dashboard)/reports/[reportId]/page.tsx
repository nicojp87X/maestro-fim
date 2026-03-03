import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Button } from "@/components/ui/button";
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

export default async function ReportPage({
  params,
}: {
  params: { reportId: string };
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login");

  const { data: report } = await supabase
    .from("fim_reports")
    .select("*")
    .eq("id", params.reportId)
    .eq("user_id", user.id)
    .single();

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

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-16">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <Link href="/reports" className="text-sm text-muted-foreground hover:text-foreground mb-2 inline-block">
            ← Mis informes
          </Link>
          <h1 className="text-2xl font-bold">Informe FIM</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Generado el {formatDate(r.created_at!)}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={undefined}>
          Descargar PDF
        </Button>
      </div>

      {/* FIM Scores */}
      <Card>
        <CardHeader>
          <CardTitle>Puntuación FIM</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <FIMScoreGauge
              score={r.fim_score ?? 0}
              label="FIM Global"
            />
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

      {/* Executive Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Resumen ejecutivo</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm leading-relaxed whitespace-pre-wrap">{r.executive_summary}</p>
        </CardContent>
      </Card>

      {/* Priority Actions */}
      {priorityActions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Top acciones prioritarias</CardTitle>
          </CardHeader>
          <CardContent>
            <PriorityActions actions={priorityActions} />
          </CardContent>
        </Card>
      )}

      {/* Biomarker Table */}
      <Card>
        <CardHeader>
          <CardTitle>Biomarcadores</CardTitle>
        </CardHeader>
        <CardContent>
          <BiomarkerTable biomarkers={bms} />
        </CardContent>
      </Card>

      {/* AMPK/mTOR Balance */}
      {ampkMtor && (
        <Card>
          <CardHeader>
            <CardTitle>Balance AMPK / mTOR</CardTitle>
          </CardHeader>
          <CardContent>
            <AMPKMTORBalance data={ampkMtor} />
          </CardContent>
        </Card>
      )}

      {/* Analysis sections */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {metabolic && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Análisis Metabólico</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">{metabolic.summary}</p>
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

      {/* Recommendations */}
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

      {/* Follow-up markers */}
      {followUpMarkers.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Biomarcadores a vigilar</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-3">
              Solicita estos marcadores en tu próxima analítica para hacer seguimiento de tu progreso:
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
      )}

      {/* Model attribution */}
      <p className="text-xs text-muted-foreground text-center">
        Informe generado por Maestro FIM · Modelo {r.model_version} · No constituye diagnóstico médico
      </p>
    </div>
  );
}
