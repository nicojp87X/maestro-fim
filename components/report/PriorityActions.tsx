import type { PriorityAction } from "@/types/database";

interface PriorityActionsProps {
  actions: PriorityAction[];
}

const CATEGORY_ICON: Record<string, string> = {
  nutrition: "🥗",
  exercise: "🏃",
  sleep: "😴",
  supplement: "💊",
  lifestyle: "🌿",
  medical: "🩺",
};

const IMPACT_LABEL: Record<string, { label: string; color: string }> = {
  high: { label: "Alto impacto", color: "text-green-700 bg-green-50 dark:text-green-400 dark:bg-green-950/40" },
  medium: { label: "Impacto moderado", color: "text-yellow-700 bg-yellow-50 dark:text-yellow-400 dark:bg-yellow-950/40" },
  low: { label: "Impacto bajo", color: "text-blue-700 bg-blue-50 dark:text-blue-400 dark:bg-blue-950/40" },
};

export default function PriorityActions({ actions }: PriorityActionsProps) {
  if (actions.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">Sin acciones prioritarias identificadas.</p>
    );
  }

  return (
    <ol className="space-y-3">
      {actions.map((action, i) => {
        const impact = IMPACT_LABEL[action.expected_impact] ?? IMPACT_LABEL.medium;
        const icon = CATEGORY_ICON[action.category] ?? "✅";

        return (
          <li key={i} className="flex gap-4 p-4 border rounded-lg">
            <div className="flex-shrink-0 flex items-center justify-center h-8 w-8 rounded-full bg-primary text-primary-foreground text-sm font-bold">
              {i + 1}
            </div>
            <div className="flex-1 space-y-1">
              <div className="flex items-start justify-between gap-2 flex-wrap">
                <p className="font-medium text-sm">
                  {icon} {action.action}
                </p>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${impact.color}`}>
                  {impact.label}
                </span>
              </div>
              <p className="text-sm text-muted-foreground">{action.rationale}</p>
              {action.timeframe && (
                <p className="text-xs text-muted-foreground">
                  <span className="font-medium">Plazo: </span>
                  {action.timeframe}
                </p>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
