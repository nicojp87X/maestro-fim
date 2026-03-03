import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type {
  NutritionRecommendations,
  ExerciseRecommendations,
  SleepRecommendations,
  SupplementRecommendations,
} from "@/types/database";

// ─── Nutrition ───────────────────────────────────────────────────────────────

export function NutritionPanel({ data }: { data: NutritionRecommendations }) {
  return (
    <div className="space-y-4">
      <div>
        <p className="text-sm font-medium mb-1">Estrategia general</p>
        <p className="text-sm text-muted-foreground">{data.strategy}</p>
      </div>

      {data.macros && (
        <div>
          <p className="text-sm font-medium mb-2">Distribución de macros</p>
          <div className="grid grid-cols-3 gap-2">
            <div className="text-center p-2 bg-muted rounded-lg">
              <p className="text-lg font-bold text-primary">{data.macros.carbs_pct}%</p>
              <p className="text-xs text-muted-foreground">Carbohidratos</p>
            </div>
            <div className="text-center p-2 bg-muted rounded-lg">
              <p className="text-lg font-bold text-primary">{data.macros.protein_pct}%</p>
              <p className="text-xs text-muted-foreground">Proteínas</p>
            </div>
            <div className="text-center p-2 bg-muted rounded-lg">
              <p className="text-lg font-bold text-primary">{data.macros.fat_pct}%</p>
              <p className="text-xs text-muted-foreground">Grasas</p>
            </div>
          </div>
        </div>
      )}

      {data.meal_timing && (
        <div>
          <p className="text-sm font-medium mb-1">Horarios de comida</p>
          <p className="text-sm text-muted-foreground">{data.meal_timing}</p>
        </div>
      )}

      {data.foods_to_prioritize.length > 0 && (
        <div>
          <p className="text-sm font-medium mb-2">Alimentos a priorizar</p>
          <div className="flex flex-wrap gap-2">
            {data.foods_to_prioritize.map((food, i) => (
              <span key={i} className="text-xs bg-green-100 dark:bg-green-950/40 text-green-700 dark:text-green-400 px-2 py-1 rounded-full">
                {food}
              </span>
            ))}
          </div>
        </div>
      )}

      {data.foods_to_limit.length > 0 && (
        <div>
          <p className="text-sm font-medium mb-2">Alimentos a limitar</p>
          <div className="flex flex-wrap gap-2">
            {data.foods_to_limit.map((food, i) => (
              <span key={i} className="text-xs bg-red-100 dark:bg-red-950/40 text-red-700 dark:text-red-400 px-2 py-1 rounded-full">
                {food}
              </span>
            ))}
          </div>
        </div>
      )}

      {data.specific_notes && (
        <p className="text-sm text-muted-foreground border-l-2 border-primary/30 pl-3">
          {data.specific_notes}
        </p>
      )}
    </div>
  );
}

// ─── Exercise ─────────────────────────────────────────────────────────────────

export function ExercisePanel({ data }: { data: ExerciseRecommendations }) {
  return (
    <div className="space-y-4">
      <div>
        <p className="text-sm font-medium mb-1">Enfoque principal</p>
        <p className="text-sm text-muted-foreground">{data.focus}</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {data.cardio && (
          <div className="p-3 bg-muted rounded-lg">
            <p className="text-xs font-medium text-primary mb-1">Cardio / Aeróbico</p>
            <p className="text-xs text-muted-foreground">{data.cardio}</p>
          </div>
        )}
        {data.strength && (
          <div className="p-3 bg-muted rounded-lg">
            <p className="text-xs font-medium text-primary mb-1">Fuerza / Resistencia</p>
            <p className="text-xs text-muted-foreground">{data.strength}</p>
          </div>
        )}
      </div>

      {data.hiit_recommendation && (
        <div>
          <p className="text-sm font-medium mb-1">HIIT / Alta intensidad</p>
          <p className="text-sm text-muted-foreground">{data.hiit_recommendation}</p>
        </div>
      )}

      {data.frequency_per_week && (
        <div className="flex items-center gap-2">
          <span className="text-2xl font-bold text-primary">{data.frequency_per_week}×</span>
          <span className="text-sm text-muted-foreground">sesiones por semana recomendadas</span>
        </div>
      )}

      {data.timing_notes && (
        <div>
          <p className="text-sm font-medium mb-1">Horarios óptimos</p>
          <p className="text-sm text-muted-foreground">{data.timing_notes}</p>
        </div>
      )}

      {data.myokine_rationale && (
        <p className="text-sm text-muted-foreground border-l-2 border-primary/30 pl-3">
          <span className="font-medium">Señal neuroinmune: </span>
          {data.myokine_rationale}
        </p>
      )}
    </div>
  );
}

// ─── Sleep ────────────────────────────────────────────────────────────────────

export function SleepPanel({ data }: { data: SleepRecommendations }) {
  return (
    <div className="space-y-4">
      {(data.target_hours_min || data.target_hours_max) && (
        <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
          <div className="text-center">
            <p className="text-2xl font-bold text-primary">
              {data.target_hours_min}–{data.target_hours_max}h
            </p>
            <p className="text-xs text-muted-foreground">horas diarias</p>
          </div>
          {data.sleep_schedule && (
            <p className="text-sm text-muted-foreground flex-1">{data.sleep_schedule}</p>
          )}
        </div>
      )}

      {data.light_exposure && (
        <div>
          <p className="text-sm font-medium mb-1">Exposición a la luz</p>
          <p className="text-sm text-muted-foreground">{data.light_exposure}</p>
        </div>
      )}

      {data.temperature && (
        <div>
          <p className="text-sm font-medium mb-1">Temperatura</p>
          <p className="text-sm text-muted-foreground">{data.temperature}</p>
        </div>
      )}

      {data.habits.length > 0 && (
        <div>
          <p className="text-sm font-medium mb-2">Hábitos de sueño recomendados</p>
          <ul className="space-y-1.5">
            {data.habits.map((habit, i) => (
              <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary flex-shrink-0" />
                {habit}
              </li>
            ))}
          </ul>
        </div>
      )}

      {data.circadian_notes && (
        <p className="text-sm text-muted-foreground border-l-2 border-primary/30 pl-3">
          <span className="font-medium">Ritmo circadiano: </span>
          {data.circadian_notes}
        </p>
      )}
    </div>
  );
}

// ─── Supplements ──────────────────────────────────────────────────────────────

export function SupplementPanel({ data }: { data: SupplementRecommendations }) {
  const priorityColor: Record<string, string> = {
    high: "text-red-600 bg-red-50 dark:bg-red-950/30",
    medium: "text-yellow-600 bg-yellow-50 dark:bg-yellow-950/30",
    low: "text-green-600 bg-green-50 dark:bg-green-950/30",
  };

  return (
    <div className="space-y-4">
      {data.supplements.length === 0 ? (
        <p className="text-sm text-muted-foreground">Sin suplementos prioritarios identificados.</p>
      ) : (
        <div className="space-y-3">
          {data.supplements.map((supp, i) => (
            <div key={i} className="p-3 border rounded-lg space-y-1.5">
              <div className="flex items-center justify-between gap-2">
                <p className="font-medium text-sm">{supp.name}</p>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    priorityColor[supp.priority] ?? "text-muted-foreground bg-muted"
                  }`}
                >
                  {supp.priority === "high"
                    ? "Alta prioridad"
                    : supp.priority === "medium"
                    ? "Media prioridad"
                    : "Baja prioridad"}
                </span>
              </div>
              {supp.dose && (
                <p className="text-xs text-muted-foreground">
                  <span className="font-medium">Dosis: </span>
                  {supp.dose}
                  {supp.timing ? ` · ${supp.timing}` : ""}
                </p>
              )}
              <p className="text-xs text-muted-foreground">{supp.rationale}</p>
            </div>
          ))}
        </div>
      )}

      {data.general_notes && (
        <p className="text-sm text-muted-foreground border-l-2 border-primary/30 pl-3">
          {data.general_notes}
        </p>
      )}
    </div>
  );
}
