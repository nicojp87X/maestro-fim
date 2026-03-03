"use client";

import { useLanguage } from "@/lib/i18n/context";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";

interface SidebarUserProps {
  fullName: string | null;
  email: string;
}

export default function SidebarUser({ fullName, email }: SidebarUserProps) {
  const { t } = useLanguage();

  return (
    <>
      <div className="px-3 py-2 mb-2">
        <p className="text-sm font-medium truncate">{fullName || email}</p>
        <p className="text-xs text-muted-foreground truncate">{email}</p>
      </div>
      <form action="/api/auth/logout" method="POST">
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start gap-2 text-muted-foreground"
        >
          <LogOut className="h-4 w-4" />
          {t("nav_logout")}
        </Button>
      </form>
    </>
  );
}
