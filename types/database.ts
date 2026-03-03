export type BiomarkerStatus = "optimal" | "suboptimal" | "concerning" | "critical";
export type AnalysisJobStatus =
  | "pending"
  | "extracting"
  | "analyzing"
  | "generating"
  | "completed"
  | "failed";
export type SubscriptionPlan = "free" | "monthly" | "annual";
export type SubscriptionStatus =
  | "active"
  | "canceled"
  | "incomplete"
  | "past_due"
  | "trialing"
  | "unpaid";

export interface Profile {
  id: string;
  full_name: string | null;
  date_of_birth: string | null;
  gender: "male" | "female" | "other" | "prefer_not_to_say" | null;
  height_cm: number | null;
  weight_kg: number | null;
  activity_level:
    | "sedentary"
    | "light"
    | "moderate"
    | "active"
    | "very_active"
    | null;
  health_goals: string[] | null;
  known_conditions: string[] | null;
  medications: string[] | null;
  created_at: string;
  updated_at: string;
}

export interface Subscription {
  id: string;
  user_id: string;
  stripe_customer_id: string;
  stripe_subscription_id: string | null;
  stripe_price_id: string | null;
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  current_period_start: string | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
  created_at: string;
  updated_at: string;
}

export interface AnalysisJob {
  id: string;
  user_id: string;
  status: AnalysisJobStatus;
  input_type: "image" | "pdf";
  storage_path: string;
  original_filename: string;
  file_size_bytes: number | null;
  error_message: string | null;
  started_at: string;
  completed_at: string | null;
  created_at: string;
}

export interface BiomarkerExtraction {
  id: string;
  job_id: string;
  biomarker_key: string;
  biomarker_name: string;
  raw_value: string;
  numeric_value: number | null;
  unit: string | null;
  reference_range_low: number | null;
  reference_range_high: number | null;
  fim_range_optimal_low: number | null;
  fim_range_optimal_high: number | null;
  status: BiomarkerStatus | null;
  created_at: string;
}

export interface FIMReport {
  id: string;
  job_id: string;
  user_id: string;
  fim_score: number | null;
  metabolic_flexibility_score: number | null;
  immune_flexibility_score: number | null;
  executive_summary: string;
  metabolic_analysis: MetabolicAnalysis;
  immune_analysis: ImmuneAnalysis;
  hormonal_analysis: HormonalAnalysis;
  circadian_analysis: CircadianAnalysis;
  ampk_mtor_balance: AMPKMTORBalance;
  nutrition_recommendations: NutritionRecommendations;
  exercise_recommendations: ExerciseRecommendations;
  sleep_recommendations: SleepRecommendations;
  supplement_recommendations: SupplementRecommendations;
  priority_actions: PriorityAction[];
  follow_up_markers: string[];
  rag_sources_used: string[];
  model_version: string;
  created_at: string | null;
}

export interface MetabolicAnalysis {
  summary: string;
  key_findings: string[];
  insulin_sensitivity: string;
  glucose_metabolism?: string;
  lipid_metabolism?: string;
  interpretation?: string;
}

export interface ImmuneAnalysis {
  summary: string;
  key_findings: string[];
  inflammation_status: string;
  inflammatory_markers?: string;
  immune_balance?: string;
  interpretation?: string;
}

export interface HormonalAnalysis {
  summary: string;
  key_findings: string[];
  thyroid_status?: string;
  adrenal_status?: string;
  interpretation?: string;
}

export interface CircadianAnalysis {
  summary: string;
  key_findings: string[];
  sleep_markers?: string;
  cortisol_rhythm?: string;
  interpretation?: string;
}

export interface AMPKMTORBalance {
  score: number;
  interpretation: string;
  dominant_pathway: string;
  key_indicators: string[];
  optimization_notes: string;
  estimated_state?: "AMPK_dominant" | "mTOR_dominant" | "balanced" | "dysregulated";
}

// ── Macros breakdown ───────────────────────────────────────────────────────

export interface MacroDistribution {
  carbs_pct: number;
  protein_pct: number;
  fat_pct: number;
}

// ── Recommendations ────────────────────────────────────────────────────────

export interface NutritionRecommendations {
  strategy: string;
  meal_timing?: string;
  macros?: MacroDistribution;
  foods_to_prioritize: string[];
  foods_to_limit: string[];
  specific_notes?: string;
  fasting_protocol?: string | null;
  hydration?: string;
}

export interface ExerciseRecommendations {
  focus: string;
  cardio?: string;
  strength?: string;
  hiit_recommendation?: string;
  frequency_per_week?: number;
  timing_notes?: string;
  myokine_rationale?: string;
  recovery?: string;
}

export interface SleepRecommendations {
  target_hours_min?: number;
  target_hours_max?: number;
  sleep_schedule?: string;
  light_exposure?: string;
  temperature?: string;
  habits: string[];
  circadian_notes?: string;
  overall_strategy?: string;
}

export interface Supplement {
  name: string;
  dose?: string;
  timing?: string;
  rationale: string;
  priority: "high" | "medium" | "low";
  evidence_level?: "high" | "moderate" | "low";
}

export interface SupplementRecommendations {
  supplements: Supplement[];
  general_notes?: string;
  supplements_to_avoid?: string[];
}

export interface PriorityAction {
  action: string;
  rationale: string;
  timeframe?: string;
  expected_impact: "high" | "medium" | "low";
  category: "nutrition" | "exercise" | "sleep" | "supplement" | "lifestyle" | "medical";
  priority?: number;
}
