/**
 * Seed FIM biomarker reference ranges into biomarker_reference_definitions
 *
 * Usage:
 *   npm run seed
 *   (or: npx tsx scripts/seed-reference-ranges.ts)
 */

import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";

dotenv.config({ path: ".env.local" });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const REFERENCE_RANGES = [
  // ── Metabolic ──────────────────────────────────────────────────────────────
  {
    key: "glucose_fasting",
    name_es: "Glucosa en ayunas",
    category: "metabolic",
    unit: "mg/dL",
    conventional_low: 70,
    conventional_high: 99,
    fim_optimal_low: 70,
    fim_optimal_high: 85,
    fim_concern_low: 60,
    fim_concern_high: 100,
    fim_relevance: "Marcador central de flexibilidad metabólica y sensibilidad insulínica",
    fim_pathway: ["AMPK", "glucosa", "insulina"],
    description_es:
      "La glucosa en ayunas óptima FIM es 70–85 mg/dL. Valores >90 sugieren resistencia insulínica incipiente.",
  },
  {
    key: "insulin_fasting",
    name_es: "Insulina en ayunas",
    category: "metabolic",
    unit: "μUI/mL",
    conventional_low: 2,
    conventional_high: 25,
    fim_optimal_low: 2,
    fim_optimal_high: 8,
    fim_concern_low: null,
    fim_concern_high: 15,
    fim_relevance: "Indicador directo de resistencia insulínica y activación de mTOR crónica",
    fim_pathway: ["insulina", "mTOR", "AMPK"],
    description_es:
      "Insulina >8 μUI/mL indica resistencia insulínica. >15 es señal de alarma funcional FIM.",
  },
  {
    key: "homa_ir",
    name_es: "HOMA-IR",
    category: "metabolic",
    unit: "índice",
    conventional_low: 0,
    conventional_high: 2.5,
    fim_optimal_low: 0,
    fim_optimal_high: 1.5,
    fim_concern_low: null,
    fim_concern_high: 2.5,
    fim_relevance: "Índice de resistencia insulínica. HOMA-IR = (glucosa × insulina) / 405",
    fim_pathway: ["insulina", "glucosa", "mTOR"],
    description_es:
      "HOMA-IR óptimo FIM <1.5. >2.5 indica resistencia insulínica significativa.",
  },
  {
    key: "hba1c",
    name_es: "Hemoglobina glicada (HbA1c)",
    category: "metabolic",
    unit: "%",
    conventional_low: null,
    conventional_high: 5.6,
    fim_optimal_low: 4.6,
    fim_optimal_high: 5.2,
    fim_concern_low: null,
    fim_concern_high: 5.7,
    fim_relevance: "Media glucémica de 3 meses. Marcador de glicación proteica y estrés metabólico",
    fim_pathway: ["glucosa", "glicacion"],
    description_es:
      "HbA1c óptima FIM: 4.6–5.2%. Por encima de 5.2% hay glicación funcional que acelera envejecimiento.",
  },
  // ── Lipids ────────────────────────────────────────────────────────────────
  {
    key: "triglycerides",
    name_es: "Triglicéridos",
    category: "metabolic",
    unit: "mg/dL",
    conventional_low: null,
    conventional_high: 150,
    fim_optimal_low: null,
    fim_optimal_high: 80,
    fim_concern_low: null,
    fim_concern_high: 100,
    fim_relevance: "Marcador de flexibilidad metabólica. >100 indica predominio glucolítico y bajo uso de grasa",
    fim_pathway: ["lipidos", "AMPK", "metabolismo_lipidico"],
    description_es:
      "Triglicéridos óptimos FIM <80 mg/dL. Reflejan la capacidad de oxidar grasa eficientemente.",
  },
  {
    key: "hdl_cholesterol",
    name_es: "Colesterol HDL",
    category: "metabolic",
    unit: "mg/dL",
    conventional_low: 40,
    conventional_high: null,
    fim_optimal_low: 60,
    fim_optimal_high: null,
    fim_concern_low: 40,
    fim_concern_high: null,
    fim_relevance: "Cardioprotección e indicador de metabolismo lipídico saludable",
    fim_pathway: ["lipidos", "inflamacion"],
    description_es:
      "HDL óptimo FIM >60 mg/dL. Marcador de eficiencia metabólica y transporte reverso de colesterol.",
  },
  {
    key: "ldl_cholesterol",
    name_es: "Colesterol LDL",
    category: "metabolic",
    unit: "mg/dL",
    conventional_low: null,
    conventional_high: 130,
    fim_optimal_low: null,
    fim_optimal_high: 100,
    fim_concern_low: null,
    fim_concern_high: 130,
    fim_relevance: "Evaluar en contexto de partículas LDL small dense vs. large buoyant",
    fim_pathway: ["lipidos", "cardiovascular"],
    description_es:
      "LDL óptimo FIM <100 mg/dL. Importante evaluar patrón de partículas y ratio TG/HDL.",
  },
  // ── Inflammatory ─────────────────────────────────────────────────────────
  {
    key: "hs_crp",
    name_es: "PCR ultrasensible (hsCRP)",
    category: "immune",
    unit: "mg/L",
    conventional_low: null,
    conventional_high: 5.0,
    fim_optimal_low: null,
    fim_optimal_high: 0.5,
    fim_concern_low: null,
    fim_concern_high: 1.0,
    fim_relevance: "Marcador de inflamación sistémica de bajo grado. Clave para flexibilidad inmunitaria",
    fim_pathway: ["inflamacion", "IL6", "NFkB"],
    description_es:
      "hsCRP óptimo FIM <0.5 mg/L. 0.5–1 = zona de atención. >1 = inflamación crónica activa.",
  },
  {
    key: "homocysteine",
    name_es: "Homocisteína",
    category: "immune",
    unit: "μmol/L",
    conventional_low: null,
    conventional_high: 15,
    fim_optimal_low: null,
    fim_optimal_high: 9,
    fim_concern_low: null,
    fim_concern_high: 12,
    fim_relevance: "Marcador de metilación, daño endotelial y estrés oxidativo",
    fim_pathway: ["metilacion", "inflamacion", "cardiovascular"],
    description_es:
      "Homocisteína óptima FIM <9 μmol/L. >12 indica déficit de metilación (B12/folato) o disfunción endotelial.",
  },
  // ── Thyroid ───────────────────────────────────────────────────────────────
  {
    key: "tsh",
    name_es: "TSH",
    category: "hormonal",
    unit: "mUI/L",
    conventional_low: 0.4,
    conventional_high: 4.0,
    fim_optimal_low: 1.0,
    fim_optimal_high: 2.0,
    fim_concern_low: 0.5,
    fim_concern_high: 3.0,
    fim_relevance: "Regulador maestro del metabolismo. TSH elevado = hipotiroidismo subclínico",
    fim_pathway: ["tiroides", "metabolismo", "AMPK"],
    description_es:
      "TSH óptimo FIM: 1.0–2.0 mUI/L. >2.5 sugiere tiroides bajo estrés. Siempre evaluar con T4L y T3L.",
  },
  {
    key: "free_t3",
    name_es: "T3 libre (FT3)",
    category: "hormonal",
    unit: "pg/mL",
    conventional_low: 2.0,
    conventional_high: 4.4,
    fim_optimal_low: 3.2,
    fim_optimal_high: 4.2,
    fim_concern_low: 2.5,
    fim_concern_high: null,
    fim_relevance: "Hormona tiroidea activa. Controla tasa metabólica basal y temperatura corporal",
    fim_pathway: ["tiroides", "mitocondria", "termogenesis"],
    description_es:
      "FT3 óptimo FIM: 3.2–4.2 pg/mL. <3.0 sugiere conversión T4→T3 deficiente (estrés, cortisol elevado).",
  },
  // ── Hormonal ─────────────────────────────────────────────────────────────
  {
    key: "cortisol_morning",
    name_es: "Cortisol matutino",
    category: "hormonal",
    unit: "μg/dL",
    conventional_low: 6,
    conventional_high: 23,
    fim_optimal_low: 12,
    fim_optimal_high: 20,
    fim_concern_low: 8,
    fim_concern_high: 22,
    fim_relevance: "Regulador del ritmo circadiano, inmunidad y metabolismo de glucosa",
    fim_pathway: ["cortisol", "circadiano", "inflamacion"],
    description_es:
      "Cortisol matutino óptimo FIM: 12–20 μg/dL. Bajo o elevado indica disfunción eje HPA.",
  },
  {
    key: "vitamin_d",
    name_es: "Vitamina D (25-OH)",
    category: "nutritional",
    unit: "ng/mL",
    conventional_low: 20,
    conventional_high: null,
    fim_optimal_low: 50,
    fim_optimal_high: 80,
    fim_concern_low: 30,
    fim_concern_high: null,
    fim_relevance: "Hormona inmunomoduladora. Deficiencia asociada a inflamación y resistencia insulínica",
    fim_pathway: ["inmunidad", "inflamacion", "insulina"],
    description_es:
      "Vitamina D óptima FIM: 50–80 ng/mL. <30 = deficiencia. <20 = deficiencia severa con impacto inmune.",
  },
  // ── Nutritional ──────────────────────────────────────────────────────────
  {
    key: "ferritin",
    name_es: "Ferritina",
    category: "nutritional",
    unit: "ng/mL",
    conventional_low: 12,
    conventional_high: 300,
    fim_optimal_low: 40,
    fim_optimal_high: 100,
    fim_concern_low: 20,
    fim_concern_high: 150,
    fim_relevance: "Reservas de hierro. Ferritina elevada = inflamación o sobrecarga de hierro",
    fim_pathway: ["hierro", "inflamacion", "mitocondria"],
    description_es:
      "Ferritina óptima FIM: 40–100 ng/mL. <30 = deficiencia funcional. >150 = posible inflamación o hemocromatosis.",
  },
  {
    key: "magnesium",
    name_es: "Magnesio sérico",
    category: "nutritional",
    unit: "mg/dL",
    conventional_low: 1.7,
    conventional_high: 2.4,
    fim_optimal_low: 2.0,
    fim_optimal_high: 2.4,
    fim_concern_low: 1.8,
    fim_concern_high: null,
    fim_relevance: "Cofactor de +300 enzimas. Esencial para AMPK, síntesis ATP y señalización insulínica",
    fim_pathway: ["AMPK", "ATP", "insulina", "ritmos_circadianos"],
    description_es:
      "Magnesio óptimo FIM: 2.0–2.4 mg/dL. El suero no refleja reservas intracelulares; preferir RBC Mg.",
  },
  // ── Renal ────────────────────────────────────────────────────────────────
  {
    key: "creatinine",
    name_es: "Creatinina",
    category: "renal",
    unit: "mg/dL",
    conventional_low: 0.6,
    conventional_high: 1.2,
    fim_optimal_low: 0.8,
    fim_optimal_high: 1.1,
    fim_concern_low: 0.7,
    fim_concern_high: 1.2,
    fim_relevance: "Filtrado renal y masa muscular. Valores bajos pueden indicar sarcopenia",
    fim_pathway: ["renal", "musculo"],
    description_es:
      "Creatinina muy baja (<0.7) puede indicar masa muscular reducida. Calcular siempre filtrado glomerular.",
  },
  // ── Hepatic ──────────────────────────────────────────────────────────────
  {
    key: "alt_gpt",
    name_es: "ALT/GPT (transaminasa)",
    category: "hepatic",
    unit: "U/L",
    conventional_low: null,
    conventional_high: 40,
    fim_optimal_low: null,
    fim_optimal_high: 20,
    fim_concern_low: null,
    fim_concern_high: 30,
    fim_relevance: "Inflamación hepática. ALT elevada sugiere hígado graso o toxicidad",
    fim_pathway: ["higado", "inflamacion", "glucosa"],
    description_es:
      "ALT óptima FIM <20 U/L. 20–30 = zona de atención. >30 = daño hepatocelular activo.",
  },
] as const;

async function main() {
  console.log("\n🌱 Seeding biomarker reference ranges...\n");

  const { error } = await supabase
    .from("biomarker_reference_definitions")
    .upsert(REFERENCE_RANGES, { onConflict: "key" });

  if (error) {
    console.error("❌ Error seeding reference ranges:", error.message);
    process.exit(1);
  }

  console.log(`✅ ${REFERENCE_RANGES.length} biomarker reference ranges seeded successfully.\n`);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
