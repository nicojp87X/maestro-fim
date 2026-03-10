import { Shield, Clock, Brain, FileSearch } from "lucide-react";
import UploadDropzone from "@/components/upload/UploadDropzone";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const steps = [
  {
    icon: FileSearch,
    title: "Sube tu analítica",
    description: "PDF o foto de tus resultados de laboratorio",
  },
  {
    icon: Brain,
    title: "Análisis FIM con IA",
    description: "Claude extrae tus valores y los interpreta bajo el marco FIM",
  },
  {
    icon: Clock,
    title: "Informe en minutos",
    description: "Recibe tu informe con recomendaciones personalizadas",
  },
];

export default async function UploadPage({
  searchParams,
}: {
  searchParams: Promise<{ jobId?: string }>;
}) {
  const { jobId } = await searchParams;

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          {jobId ? "Estado del análisis" : "Nueva analítica"}
        </h1>
        <p className="text-muted-foreground mt-1">
          {jobId
            ? "Tu análisis está en proceso. Puedes volver a esta página más tarde."
            : "Sube los resultados de tu analítica de sangre para recibir tu informe FIM personalizado"}
        </p>
      </div>

      {!jobId && (
        <div className="grid grid-cols-3 gap-4">
          {steps.map((step, i) => (
            <div key={i} className="text-center space-y-2">
              <div className="mx-auto w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <step.icon className="h-5 w-5 text-primary" />
              </div>
              <p className="text-sm font-medium">{step.title}</p>
              <p className="text-xs text-muted-foreground">{step.description}</p>
            </div>
          ))}
        </div>
      )}

      <UploadDropzone initialJobId={jobId} />

      {/* Privacy note */}
      <Card className="border-muted">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Shield className="h-4 w-4 text-primary" />
            Privacidad y seguridad
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-1">
          <p>
            Tus archivos se almacenan de forma cifrada y solo son accesibles
            por ti. Nunca compartimos tus datos con terceros.
          </p>
          <p>
            El análisis se realiza mediante IA de forma segura. Tu información
            médica es estrictamente confidencial.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
