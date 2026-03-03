import Link from "next/link";
import { redirect } from "next/navigation";
import { Upload, FileText, ArrowRight, Activity } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatDate } from "@/lib/utils/format";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login");

  // Auto-create free subscription if user has none
  const { data: existingSub } = await supabase
    .from("subscriptions")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (!existingSub) {
    await supabase.from("subscriptions").insert({
      user_id: user.id,
      plan: "free",
      status: "active",
      cancel_at_period_end: false,
    });
  }

  const [{ data: profile }, { data: recentJobs }] = await Promise.all([
    supabase.from("profiles").select("full_name").eq("id", user.id).single(),
    supabase
      .from("analysis_jobs")
      .select("id, status, original_filename, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(5),
  ]);

  const completedCount =
    recentJobs?.filter((j) => j.status === "completed").length ?? 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Hola, {profile?.full_name?.split(" ")[0] ?? "bienvenido"}
        </h1>
        <p className="text-muted-foreground mt-1">
          Aquí tienes un resumen de tu estado FIM
        </p>
      </div>

      {/* Quick action */}
      <Card className="border-primary/20 bg-primary/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5 text-primary" />
            Analizar nueva analítica
          </CardTitle>
          <CardDescription>
            Sube los resultados de tu analítica de sangre (foto o PDF) y recibe
            tu informe FIM personalizado en minutos.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild>
            <Link href="/upload">
              <Upload className="h-4 w-4" />
              Subir analítica
            </Link>
          </Button>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Análisis realizados</CardDescription>
            <CardTitle className="text-3xl">
              {recentJobs?.length ?? 0}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              {completedCount} completados con éxito
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Marco de análisis</CardDescription>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" />
              FIM
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              Flexibilidad Inmunometabólica
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Último análisis</CardDescription>
            <CardTitle className="text-base">
              {recentJobs?.[0]
                ? formatDate(recentJobs[0].created_at)
                : "Sin análisis aún"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              {recentJobs?.[0]?.original_filename ?? "—"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent reports */}
      {recentJobs && recentJobs.length > 0 && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Análisis recientes</CardTitle>
              <CardDescription>Tus últimas analíticas</CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/reports">
                Ver todos <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {recentJobs.map((job) => (
                <div
                  key={job.id}
                  className="flex items-center justify-between py-2 border-b last:border-0"
                >
                  <div className="flex items-center gap-3">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">
                        {job.original_filename}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(job.created_at)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-xs px-2 py-1 rounded-full ${
                        job.status === "completed"
                          ? "bg-green-100 text-green-700"
                          : job.status === "failed"
                          ? "bg-red-100 text-red-700"
                          : "bg-yellow-100 text-yellow-700"
                      }`}
                    >
                      {job.status === "completed"
                        ? "Completado"
                        : job.status === "failed"
                        ? "Error"
                        : "Procesando..."}
                    </span>
                    {job.status === "completed" && (
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/reports/${job.id}`}>Ver informe</Link>
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
