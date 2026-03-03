import Link from "next/link";
import { redirect } from "next/navigation";
import {
  Activity,
  LayoutDashboard,
  Upload,
  FileText,
  User,
  CreditCard,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import LanguageToggle from "@/components/LanguageToggle";
import NavLabel from "@/components/layout/NavLabel";
import SidebarUser from "@/components/layout/SidebarUser";

const navItems = [
  { href: "/dashboard", icon: LayoutDashboard, labelKey: "nav_dashboard" },
  { href: "/upload", icon: Upload, labelKey: "nav_upload" },
  { href: "/reports", icon: FileText, labelKey: "nav_reports" },
  { href: "/profile", icon: User, labelKey: "nav_profile" },
  { href: "/subscription", icon: CreditCard, labelKey: "nav_subscription" },
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
        <div className="p-6 border-b flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2 text-primary">
            <Activity className="h-6 w-6" />
            <span className="font-bold text-lg">Maestro FIM</span>
          </Link>
          <LanguageToggle />
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
            >
              <item.icon className="h-4 w-4" />
              <NavLabel labelKey={item.labelKey} />
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t">
          <SidebarUser
            fullName={profile?.full_name ?? null}
            email={user.email ?? ""}
          />
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
          <LanguageToggle />
        </header>

        <div className="p-6">{children}</div>
      </main>
    </div>
  );
}

