-- ============================================================
-- EXTENSIONS
-- ============================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "vector";

-- ============================================================
-- TABLE: profiles (extends auth.users)
-- ============================================================
CREATE TABLE profiles (
    id              UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name       TEXT,
    date_of_birth   DATE,
    gender          TEXT CHECK (gender IN ('male', 'female', 'other', 'prefer_not_to_say')),
    height_cm       NUMERIC(5, 1),
    weight_kg       NUMERIC(5, 1),
    activity_level  TEXT CHECK (activity_level IN ('sedentary', 'light', 'moderate', 'active', 'very_active')),
    health_goals    TEXT[],
    known_conditions TEXT[],
    medications     TEXT[],
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLE: subscriptions (synced via Stripe webhooks)
-- ============================================================
CREATE TABLE subscriptions (
    id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id                 UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    stripe_customer_id      TEXT UNIQUE NOT NULL,
    stripe_subscription_id  TEXT UNIQUE,
    stripe_price_id         TEXT,
    plan                    TEXT NOT NULL CHECK (plan IN ('monthly', 'annual')),
    status                  TEXT NOT NULL CHECK (status IN (
                                'active', 'canceled', 'incomplete',
                                'past_due', 'trialing', 'unpaid'
                            )),
    current_period_start    TIMESTAMPTZ,
    current_period_end      TIMESTAMPTZ,
    cancel_at_period_end    BOOLEAN DEFAULT FALSE,
    created_at              TIMESTAMPTZ DEFAULT NOW(),
    updated_at              TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id)
);

-- ============================================================
-- TABLE: analysis_jobs
-- ============================================================
CREATE TABLE analysis_jobs (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    status          TEXT NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending', 'extracting', 'analyzing', 'generating', 'completed', 'failed')),
    input_type      TEXT NOT NULL CHECK (input_type IN ('image', 'pdf')),
    storage_path    TEXT NOT NULL,
    original_filename TEXT NOT NULL,
    file_size_bytes BIGINT,
    error_message   TEXT,
    started_at      TIMESTAMPTZ DEFAULT NOW(),
    completed_at    TIMESTAMPTZ,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLE: biomarker_extractions
-- ============================================================
CREATE TABLE biomarker_extractions (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    job_id          UUID NOT NULL REFERENCES analysis_jobs(id) ON DELETE CASCADE,
    biomarker_key   TEXT NOT NULL,
    biomarker_name  TEXT NOT NULL,
    raw_value       TEXT NOT NULL,
    numeric_value   NUMERIC,
    unit            TEXT,
    reference_range_low  NUMERIC,
    reference_range_high NUMERIC,
    fim_range_optimal_low  NUMERIC,
    fim_range_optimal_high NUMERIC,
    status          TEXT CHECK (status IN ('optimal', 'suboptimal', 'concerning', 'critical')),
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLE: fim_reports
-- ============================================================
CREATE TABLE fim_reports (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    job_id          UUID UNIQUE NOT NULL REFERENCES analysis_jobs(id) ON DELETE CASCADE,
    user_id         UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    fim_score               INTEGER CHECK (fim_score BETWEEN 0 AND 100),
    metabolic_flexibility_score  INTEGER CHECK (metabolic_flexibility_score BETWEEN 0 AND 100),
    immune_flexibility_score     INTEGER CHECK (immune_flexibility_score BETWEEN 0 AND 100),
    executive_summary       TEXT NOT NULL,
    metabolic_analysis      JSONB NOT NULL DEFAULT '{}',
    immune_analysis         JSONB NOT NULL DEFAULT '{}',
    hormonal_analysis       JSONB NOT NULL DEFAULT '{}',
    circadian_analysis      JSONB NOT NULL DEFAULT '{}',
    ampk_mtor_balance       JSONB NOT NULL DEFAULT '{}',
    nutrition_recommendations    JSONB NOT NULL DEFAULT '{}',
    exercise_recommendations     JSONB NOT NULL DEFAULT '{}',
    sleep_recommendations        JSONB NOT NULL DEFAULT '{}',
    supplement_recommendations   JSONB NOT NULL DEFAULT '{}',
    priority_actions        JSONB NOT NULL DEFAULT '[]',
    follow_up_markers       TEXT[],
    rag_sources_used        TEXT[],
    model_version           TEXT DEFAULT 'claude-sonnet-4-6',
    created_at              TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLE: fim_knowledge_chunks (RAG - embeddings of 297 PDFs)
-- ============================================================
CREATE TABLE fim_knowledge_chunks (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    source_filename TEXT NOT NULL,
    module          TEXT,   -- M1, M2, M3, M4, M5, M6, standalone
    lesson          TEXT,   -- L1, L2, etc.
    topic_tags      TEXT[],
    chunk_index     INTEGER NOT NULL,
    chunk_text      TEXT NOT NULL,
    embedding       VECTOR(1536),  -- text-embedding-3-small dimensions
    token_count     INTEGER,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLE: biomarker_reference_definitions (FIM optimal ranges)
-- ============================================================
CREATE TABLE biomarker_reference_definitions (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    key             TEXT UNIQUE NOT NULL,
    name_es         TEXT NOT NULL,
    category        TEXT NOT NULL CHECK (category IN (
                        'metabolic', 'immune', 'hormonal',
                        'cardiovascular', 'nutritional', 'renal', 'hepatic'
                    )),
    unit            TEXT NOT NULL,
    conventional_low    NUMERIC,
    conventional_high   NUMERIC,
    fim_optimal_low     NUMERIC NOT NULL,
    fim_optimal_high    NUMERIC NOT NULL,
    fim_concern_low     NUMERIC,
    fim_concern_high    NUMERIC,
    fim_relevance       TEXT NOT NULL,
    fim_pathway         TEXT[],
    description_es  TEXT,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX idx_knowledge_chunks_embedding ON fim_knowledge_chunks
    USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

CREATE INDEX idx_knowledge_chunks_module ON fim_knowledge_chunks(module);
CREATE INDEX idx_knowledge_chunks_tags ON fim_knowledge_chunks USING GIN(topic_tags);
CREATE INDEX idx_analysis_jobs_user ON analysis_jobs(user_id);
CREATE INDEX idx_analysis_jobs_status ON analysis_jobs(status);
CREATE INDEX idx_fim_reports_user ON fim_reports(user_id);
CREATE INDEX idx_biomarker_extractions_job ON biomarker_extractions(job_id);

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE analysis_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE biomarker_extractions ENABLE ROW LEVEL SECURITY;
ALTER TABLE fim_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE biomarker_reference_definitions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users own their profile"
    ON profiles FOR ALL USING (auth.uid() = id);

CREATE POLICY "Users own their subscription"
    ON subscriptions FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users own their jobs"
    ON analysis_jobs FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users own their extractions via job"
    ON biomarker_extractions FOR SELECT USING (
        job_id IN (SELECT id FROM analysis_jobs WHERE user_id = auth.uid())
    );

CREATE POLICY "Users own their reports"
    ON fim_reports FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Public read biomarker definitions"
    ON biomarker_reference_definitions FOR SELECT TO anon, authenticated USING (true);

-- ============================================================
-- AUTO-CREATE PROFILE ON USER SIGNUP
-- ============================================================
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================================
-- STORAGE BUCKET: analytics (private)
-- ============================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('analytics', 'analytics', false)
ON CONFLICT DO NOTHING;

CREATE POLICY "Users upload own analytics"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'analytics' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users read own analytics"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'analytics' AND (storage.foldername(name))[1] = auth.uid()::text);
