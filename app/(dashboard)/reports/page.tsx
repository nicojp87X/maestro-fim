import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils/format";

const STATUS_LABELS: Record<string, { label: string; variant: string }> = {
  completed: { label: "Completado", variant: "optimal" },
  failed: { label: "Error", variant: "critical" },
  pending: { label: "Pendiente", variant: "suboptimal" },
  extracting: { label: "Extrayendo", variant: "suboptimal" },
  analyzing: { label: "Analizando", variant: "suboptimal" },
  generating: { label: "Generando", variant: "suboptimal" },
};

export default async function ReportsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login");

  const { data: jobs } = await supabase
    .from("analysis_jobs")
    .select("*, fim_reports(id, fim_score, created_at)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(50);

  const list = jobs ?? [];

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Mis informes</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {list.length} {list.length === 1 ? "análisis realizado" : "análisis realizados"}
          </p>
        </div>
        <Button asChild>
          <Link href="/upload">Nueva analítica</Link>
        </Button>
      </div>

      {list.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-4xl mb-4">🧬</p>
            <p className="font-medium mb-2">Aún no tienes análisis</p>
            <p className="text-sm text-muted-foreground mb-6">
              Sube tu primera analítica y recibe tu informe FIM personalizado.
            </p>
            <Button asChild>
              <Link href="/upload">Subir analítica</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {list.map((job: any) => {
            const statusInfo = STATUS_LABELS[job.status] ?? {
              label: job.status,
              variant: "suboptimal",
            };
            const report = Array.isArray(job.fim_reports)
              ? job.fim_reports[0]
              : job.fim_reports;

            return (
              <Card key={job.id} className="hover:bg-muted/30 transition-colors">
                <CardContent className="py-4">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{job.original_filename}</p>
                      <p className="text-sm text-muted-foreground mt-0.5">
                        {formatDate(job.created_at)}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      {report?.fim_score != null && (
                        <div className="text-right">
                          <p className="text-lg font-bold text-primary">{report.fim_score}</p>
                          <p className="text-xs text-muted-foreground">FIM Score</p>
                        </div>
                      )}
                      <Badge variant={statusInfo.variant as any}>
                        {statusInfo.label}
                      </Badge>
                      {job.status === "completed" && report ? (
                        <Button asChild size="sm" variant="outline">
                          <Link href={`/reports/${report.id}`}>Ver informe</Link>
                        </Button>
                      ) : job.status !== "completed" && job.status !== "failed" ? (
                        <Button asChild size="sm" variant="outline">
                          <Link href={`/upload?jobId=${job.id}`}>Ver estado</Link>
                        </Button>
                      ) : null}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
