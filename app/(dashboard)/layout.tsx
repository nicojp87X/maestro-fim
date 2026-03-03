import Link from "next/link";
import { redirect } from "next/navigation";
import {
  Activity,
  LayoutDashboard,
  Upload,
  FileText,
  User,
  CreditCard,
  LogOut,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";

const navItems = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Inicio" },
  { href: "/upload", icon: Upload, label: "Nueva analítica" },
  { href: "/reports", icon: FileText, label: "Mis informes" },
  { href: "/profile", icon: User, label: "Mi perfil" },
  { href: "/subscription", icon: CreditCard, label: "Suscripción" },
];

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", user.id)
    .single();

  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <aside className="hidden md:flex w-64 flex-col border-r bg-card">
        <div className="p-6 border-b">
          <Link href="/dashboard" className="flex items-center gap-2 text-primary">
            <Activity className="h-6 w-6" />
            <span className="font-bold text-lg">Maestro FIM</span>
          </Link>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t">
          <div className="px-3 py-2 mb-2">
            <p className="text-sm font-medium truncate">
              {profile?.full_name || user.email}
            </p>
            <p className="text-xs text-muted-foreground truncate">{user.email}</p>
          </div>
          <form action="/api/auth/logout" method="POST">
            <Button variant="ghost" size="sm" className="w-full justify-start gap-2 text-muted-foreground">
              <LogOut className="h-4 w-4" />
              Cerrar sesión
            </Button>
          </form>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        {/* Mobile header */}
        <header className="md:hidden flex items-center justify-between p-4 border-b bg-card">
          <Link href="/dashboard" className="flex items-center gap-2 text-primary">
            <Activity className="h-5 w-5" />
            <span className="font-bold">Maestro FIM</span>
          </Link>
        </header>

        <div className="p-6">{children}</div>
      </main>
    </div>
  );
}
