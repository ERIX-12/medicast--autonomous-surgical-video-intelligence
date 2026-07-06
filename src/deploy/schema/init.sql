-- =============================================================================
-- MediCast — Database Schema Initialization
--
-- Creates all tables for the self-hosted Postgres instance.
-- Mirrors the Supabase schema but adapted for direct Postgres 16.
-- =============================================================================

-- ── Sessions Table ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS sessions (
    id          UUID PRIMARY KEY,
    procedure_type VARCHAR(100) NOT NULL,
    video_url   TEXT,
    status      VARCHAR(20) NOT NULL DEFAULT 'created'
                CHECK (status IN ('created', 'analyzing', 'completed', 'failed')),
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sessions_status ON sessions(status);
CREATE INDEX IF NOT EXISTS idx_sessions_created_at ON sessions(created_at DESC);

-- ── Frame Analyses Table ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS frame_analyses (
    id                UUID PRIMARY KEY,
    session_id        UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    frame_index       INTEGER NOT NULL,
    timestamp_sec     DOUBLE PRECISION NOT NULL,
    agent_results     JSONB NOT NULL DEFAULT '[]'::jsonb,
    arbiter_verdict   JSONB NOT NULL DEFAULT '{}'::jsonb,
    escalation_level  VARCHAR(20) NOT NULL DEFAULT 'NONE'
                      CHECK (escalation_level IN ('NONE', 'WARNING', 'CRITICAL')),
    created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_frame_analyses_session
    ON frame_analyses(session_id, frame_index);
CREATE INDEX IF NOT EXISTS idx_frame_analyses_escalation
    ON frame_analyses(session_id, escalation_level)
    WHERE escalation_level != 'NONE';

-- ── Clinical Reports Table ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS reports (
    id          UUID PRIMARY KEY,
    session_id  UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE UNIQUE,
    report_data JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reports_session ON reports(session_id);

-- ── Black Box Audit Trail Table ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS black_boxes (
    id          UUID PRIMARY KEY,
    session_id  UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    frame_index INTEGER NOT NULL,
    hash_value  VARCHAR(64) NOT NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_black_boxes_session
    ON black_boxes(session_id, frame_index);

-- ── GPU Telemetry Snapshots Table ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS telemetry_snapshots (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    gpu_utilization   DOUBLE PRECISION NOT NULL DEFAULT 0,
    memory_utilization DOUBLE PRECISION NOT NULL DEFAULT 0,
    temperature_c     DOUBLE PRECISION NOT NULL DEFAULT 0,
    power_draw_w      DOUBLE PRECISION NOT NULL DEFAULT 0,
    recorded_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_telemetry_recorded
    ON telemetry_snapshots(recorded_at DESC);

-- ── Auto-update `updated_at` on sessions ───────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger
        WHERE tgname = 'set_sessions_updated_at'
    ) THEN
        CREATE TRIGGER set_sessions_updated_at
            BEFORE UPDATE ON sessions
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger
        WHERE tgname = 'set_reports_updated_at'
    ) THEN
        CREATE TRIGGER set_reports_updated_at
            BEFORE UPDATE ON reports
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;