export function buildFIMReportPrompt(
  biomarkers: Array<{
    biomarker_name: string;
    numeric_value: number | null;
    unit: string | null;
    raw_value: string;
    reference_range_low: number | null;
    reference_range_high: number | null;
  }>,
  patientProfile: {
    gender: string | null;
    age: number | null;
    activity_level: string | null;
    health_goals: string[] | null;
    known_conditions: string[] | null;
    medications: string[] | null;
  },
  ragContext: string
): string {
  return `Eres el Maestro FIM. Analiza los siguientes resultados analíticos e interprétalos bajo el marco de la Flexibilidad Inmunometabólica.

## PERFIL DEL PACIENTE
- Sexo: ${patientProfile.gender ?? "no especificado"}
- Edad aproximada: ${patientProfile.age ?? "no especificada"} años
- Nivel de actividad: ${patientProfile.activity_level ?? "no especificado"}
- Objetivos de salud: ${patientProfile.health_goals?.join(", ") ?? "no especificados"}
- Condiciones conocidas: ${patientProfile.known_conditions?.join(", ") ?? "ninguna"}
- Medicamentos: ${patientProfile.medications?.join(", ") ?? "ninguno"}

## BIOMARCADORES EXTRAÍDOS
${biomarkers
  .map(
    (b) =>
      `- ${b.biomarker_name}: ${b.raw_value} ${b.unit ?? ""} (rango lab: ${
        b.reference_range_low !== null ? b.reference_range_low : "?"
      } - ${b.reference_range_high !== null ? b.reference_range_high : "?"})`
  )
  .join("\n")}

## CONTEXTO DE CONOCIMIENTO FIM
${ragContext}

## INSTRUCCIÓN
Genera un informe FIM completo en JSON con esta estructura exacta (sin texto adicional fuera del JSON):

{
  "fim_score": número entre 0 y 100,
  "metabolic_flexibility_score": número entre 0 y 100,
  "immune_flexibility_score": número entre 0 y 100,

  "executive_summary": "Resumen de 3-4 párrafos en lenguaje muy accesible. Explica qué muestran los resultados en términos de flexibilidad inmunometabólica. Evita tecnicismos.",

  "biomarker_assessments": [
    {
      "biomarker_name": "nombre del marcador",
      "fim_status": "optimal | suboptimal | concerning | critical",
      "fim_optimal_low": número o null,
      "fim_optimal_high": número o null,
      "plain_language_explanation": "Qué significa este valor para tu salud en 2-3 frases simples",
      "fim_relevance": "Por qué importa este marcador en el contexto FIM"
    }
  ],

  "metabolic_analysis": {
    "summary": "Resumen del estado metabólico en 2 párrafos",
    "key_findings": ["hallazgo 1", "hallazgo 2"],
    "insulin_sensitivity": "Evaluación de sensibilidad a la insulina",
    "glucose_metabolism": "Estado del metabolismo glucídico",
    "lipid_metabolism": "Estado del metabolismo lipídico"
  },

  "immune_analysis": {
    "summary": "Resumen del estado inmune en 2 párrafos",
    "key_findings": ["hallazgo 1", "hallazgo 2"],
    "inflammation_status": "Estado inflamatorio general (frase concisa)",
    "immune_balance": "Equilibrio de la respuesta inmune"
  },

  "hormonal_analysis": {
    "summary": "Resumen hormonal en 1-2 párrafos",
    "key_findings": ["hallazgo 1"],
    "thyroid_status": "Estado tiroideo",
    "adrenal_status": "Estado adrenal"
  },

  "circadian_analysis": {
    "summary": "Análisis de biorritmos",
    "key_findings": ["hallazgo 1"],
    "cortisol_rhythm": "Estado del ritmo cortisol",
    "sleep_markers": "Marcadores relacionados con sueño"
  },

  "ampk_mtor_balance": {
    "score": número entre 0 (AMPK puro) y 100 (mTOR puro), 50 = equilibrado,
    "interpretation": "Explicación simple del balance actual (2-3 frases en lenguaje accesible)",
    "dominant_pathway": "AMPK | mTOR | Equilibrado | Desregulado",
    "key_indicators": ["indicador 1", "indicador 2", "indicador 3"],
    "optimization_notes": "Recomendación principal para optimizar el balance AMPK/mTOR"
  },

  "nutrition_recommendations": {
    "strategy": "Estrategia nutricional principal recomendada (1-2 frases)",
    "meal_timing": "Recomendaciones sobre horarios de comidas",
    "macros": { "carbs_pct": número, "protein_pct": número, "fat_pct": número },
    "foods_to_prioritize": ["alimento 1", "alimento 2", "alimento 3"],
    "foods_to_limit": ["alimento a evitar 1", "alimento a evitar 2"],
    "specific_notes": "Notas adicionales específicas para este perfil"
  },

  "exercise_recommendations": {
    "focus": "Enfoque principal del ejercicio para este perfil",
    "cardio": "Tipo, duración e intensidad del ejercicio aeróbico recomendado",
    "strength": "Recomendación de entrenamiento de fuerza",
    "hiit_recommendation": "Protocolo HIIT recomendado o indicación de que no aplica",
    "frequency_per_week": número de sesiones semanales,
    "timing_notes": "Mejor momento del día para entrenar (relación con ritmo circadiano)",
    "myokine_rationale": "Cómo el ejercicio propuesto actúa como señal neuroinmune para este paciente"
  },

  "sleep_recommendations": {
    "target_hours_min": número mínimo de horas recomendadas,
    "target_hours_max": número máximo de horas recomendadas,
    "sleep_schedule": "Horario sugerido de sueño (ej: 22:30–6:30)",
    "light_exposure": "Recomendación sobre exposición a luz solar y artificial",
    "temperature": "Temperatura ambiental recomendada para dormir",
    "habits": ["hábito de sueño 1", "hábito de sueño 2", "hábito de sueño 3"],
    "circadian_notes": "Nota sobre optimización del ritmo circadiano"
  },

  "supplement_recommendations": {
    "supplements": [
      {
        "name": "nombre del suplemento",
        "dose": "dosis recomendada",
        "timing": "momento del día y con/sin comida",
        "rationale": "Por qué lo recomiendo basado en los resultados analíticos",
        "priority": "high | medium | low"
      }
    ],
    "general_notes": "Nota general sobre la suplementación recomendada"
  },

  "priority_actions": [
    {
      "action": "Acción específica y concreta",
      "rationale": "Por qué esta acción es prioritaria",
      "timeframe": "Cuándo empezar y en cuánto tiempo esperar resultados",
      "expected_impact": "high | medium | low",
      "category": "nutrition | exercise | sleep | supplement | lifestyle | medical"
    }
  ],

  "follow_up_markers": ["marcador a revisar en próxima analítica 1", "marcador 2"]
}

RECUERDA: Responde ÚNICAMENTE con el JSON válido. Sin texto antes ni después.`;
}
