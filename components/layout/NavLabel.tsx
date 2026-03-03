"use client";

import { useLanguage } from "@/lib/i18n/context";
import type { TranslationKey } from "@/lib/i18n/translations";

export default function NavLabel({ labelKey }: { labelKey: string }) {
  const { t } = useLanguage();
  return <>{t(labelKey as TranslationKey)}</>;
}
