import Link from "next/link";
import { Activity } from "lucide-react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-fim-50 to-white p-4">
      <div className="mb-8">
        <Link href="/" className="flex items-center gap-2 text-primary">
          <Activity className="h-8 w-8" />
          <span className="text-2xl font-bold">Maestro FIM</span>
        </Link>
      </div>
      <div className="w-full max-w-md">{children}</div>
      <p className="mt-8 text-sm text-muted-foreground">
        &copy; {new Date().getFullYear()} Maestro FIM. Todos los derechos
        reservados.
      </p>
    </div>
  );
}
