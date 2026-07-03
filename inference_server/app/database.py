"""Database layer for the MediCast inference server.

Uses asyncpg for connection pooling and provides CRUD operations
for sessions, frame analyses, reports, and black-box audit entries.
"""

from __future__ import annotations

import json
import os
from typing import Any, Optional

try:
    import asyncpg
except ImportError:
    asyncpg = None  # type: ignore


# ─── Connection Pool ─────────────────────────────────────────────────────────

_pool: Optional[asyncpg.Pool] = None


async def get_db_pool() -> Optional[asyncpg.Pool]:
    """Get or create the asyncpg connection pool.

    Returns None if asyncpg is not available or DATABASE_URL is not set.
    """
    global _pool

    if _pool is not None:
        return _pool

    database_url = os.environ.get("DATABASE_URL")
    if not database_url:
        return None

    if asyncpg is None:
        return None

    try:
        _pool = await asyncpg.create_pool(
            dsn=database_url,
            min_size=2,
            max_size=10,
            command_timeout=30,
        )
        return _pool
    except Exception:
        return None


async def close_db_pool() -> None:
    """Close the database connection pool."""
    global _pool
    if _pool is not None:
        try:
            await _pool.close()
        except Exception:
            pass
        _pool = None


# ─── Schema Setup ────────────────────────────────────────────────────────────

CREATE_TABLES_SQL = """
CREATE TABLE IF NOT EXISTS sessions (
    id UUID PRIMARY KEY,
    procedure_type TEXT NOT NULL,
    video_url TEXT,
    status TEXT NOT NULL DEFAULT 'created',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS frame_analyses (
    id UUID PRIMARY KEY,
    session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    frame_index INTEGER NOT NULL,
    timestamp_sec DOUBLE PRECISION NOT NULL,
    agent_results JSONB NOT NULL,
    arbiter_verdict JSONB NOT NULL,
    escalation_level TEXT NOT NULL DEFAULT 'NONE',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS clinical_reports (
    id UUID PRIMARY KEY,
    session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    report_data JSONB NOT NULL,
    generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS black_boxes (
    id UUID PRIMARY KEY,
    session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    frame_index INTEGER NOT NULL,
    hash TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_frame_analyses_session ON frame_analyses(session_id);
CREATE INDEX IF NOT EXISTS idx_frame_analyses_escalation ON frame_analyses(escalation_level);
CREATE INDEX IF NOT EXISTS idx_black_boxes_session ON black_boxes(session_id);
"""


async def initialize_database() -> None:
    """Create database tables if they don't exist."""
    pool = await get_db_pool()
    if pool is None:
        return  # No database configured — safe to proceed

    try:
        async with pool.acquire() as conn:
            await conn.execute(CREATE_TABLES_SQL)
    except Exception:
        pass  # Tables may already exist or DB not available


# ─── Session Operations ─────────────────────────────────────────────────────

async def create_session(
    session_id: str,
    procedure_type: str,
    video_url: Optional[str] = None,
) -> dict[str, Any]:
    """Create a new analysis session."""
    pool = await get_db_pool()
    if pool is None:
        return {
            "id": session_id,
            "procedureType": procedure_type,
            "status": "created",
            "createdAt": __import__("datetime").datetime.utcnow().isoformat(),
        }

    async with pool.acquire() as conn:
        await conn.execute(
            "INSERT INTO sessions (id, procedure_type, video_url, status) VALUES ($1, $2, $3, 'created')",
            session_id, procedure_type, video_url,
        )

    return {
        "id": session_id,
        "procedureType": procedure_type,
        "status": "created",
        "createdAt": __import__("datetime").datetime.utcnow().isoformat(),
    }


async def get_session(session_id: str) -> Optional[dict[str, Any]]:
    """Get session details by ID."""
    pool = await get_db_pool()
    if pool is None:
        return None

    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            "SELECT id, procedure_type, video_url, status, created_at FROM sessions WHERE id = $1",
            session_id,
        )
        if row is None:
            return None

        return {
            "id": str(row["id"]),
            "procedureType": row["procedure_type"],
            "videoUrl": row.get("video_url"),
            "status": row["status"],
            "createdAt": row["created_at"].isoformat(),
        }


async def update_session_status(session_id: str, status: str) -> bool:
    """Update session status (created, analyzing, completed, failed)."""
    pool = await get_db_pool()
    if pool is None:
        return False

    async with pool.acquire() as conn:
        result = await conn.execute(
            "UPDATE sessions SET status = $1, updated_at = NOW() WHERE id = $2",
            status, session_id,
        )
        return result != "UPDATE 0"


# ─── Frame Analysis Operations ──────────────────────────────────────────────

async def insert_frame_analysis(
    analysis_id: str,
    session_id: str,
    frame_index: int,
    timestamp_sec: float,
    agent_results: list[dict[str, Any]],
    arbiter_verdict: dict[str, Any],
    escalation_level: str,
) -> bool:
    """Insert a frame analysis record."""
    pool = await get_db_pool()
    if pool is None:
        return False

    async with pool.acquire() as conn:
        await conn.execute(
            """
            INSERT INTO frame_analyses
                (id, session_id, frame_index, timestamp_sec, agent_results, arbiter_verdict, escalation_level)
            VALUES ($1, $2, $3, $4, $5::jsonb, $6::jsonb, $7)
            """,
            analysis_id,
            session_id,
            frame_index,
            timestamp_sec,
            json.dumps(agent_results),
            json.dumps(arbiter_verdict),
            escalation_level,
        )
        return True


async def get_frame_analyses(session_id: str) -> list[dict[str, Any]]:
    """Get all frame analyses for a session."""
    pool = await get_db_pool()
    if pool is None:
        return []

    async with pool.acquire() as conn:
        rows = await conn.fetch(
            "SELECT * FROM frame_analyses WHERE session_id = $1 ORDER BY frame_index ASC",
            session_id,
        )
        return [
            {
                "id": str(row["id"]),
                "sessionId": str(row["session_id"]),
                "frameIndex": row["frame_index"],
                "timestampSec": row["timestamp_sec"],
                "agentResults": json.loads(row["agent_results"]),
                "arbiterVerdict": json.loads(row["arbiter_verdict"]),
                "escalationLevel": row["escalation_level"],
                "createdAt": row["created_at"].isoformat(),
            }
            for row in rows
        ]


# ─── Black Box Operations ───────────────────────────────────────────────────

async def insert_black_box_entry(
    entry_id: str,
    session_id: str,
    frame_index: int,
    hash_value: str,
) -> bool:
    """Insert a black-box integrity hash entry."""
    pool = await get_db_pool()
    if pool is None:
        return False

    async with pool.acquire() as conn:
        await conn.execute(
            "INSERT INTO black_boxes (id, session_id, frame_index, hash) VALUES ($1, $2, $3, $4)",
            entry_id, session_id, frame_index, hash_value,
        )
        return True


async def get_black_box_entries(session_id: str) -> list[dict[str, Any]]:
    """Get all black-box entries for a session."""
    pool = await get_db_pool()
    if pool is None:
        return []

    async with pool.acquire() as conn:
        rows = await conn.fetch(
            "SELECT id, session_id, frame_index, hash, created_at FROM black_boxes WHERE session_id = $1 ORDER BY frame_index ASC",
            session_id,
        )
        return [
            {
                "id": str(row["id"]),
                "sessionId": str(row["session_id"]),
                "frameIndex": row["frame_index"],
                "hash": row["hash"],
                "createdAt": row["created_at"].isoformat(),
            }
            for row in rows
        ]


# ─── Report Operations ──────────────────────────────────────────────────────

async def save_clinical_report(
    report_id: str,
    session_id: str,
    report_data: dict[str, Any],
) -> bool:
    """Save a compiled clinical report."""
    pool = await get_db_pool()
    if pool is None:
        return False

    async with pool.acquire() as conn:
        await conn.execute(
            "INSERT INTO clinical_reports (id, session_id, report_data) VALUES ($1, $2, $3::jsonb)",
            report_id, session_id, json.dumps(report_data),
        )
        return True


async def get_clinical_report(session_id: str) -> Optional[dict[str, Any]]:
    """Get the clinical report for a session."""
    pool = await get_db_pool()
    if pool is None:
        return None

    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            "SELECT id, session_id, report_data, generated_at FROM clinical_reports WHERE session_id = $1 ORDER BY generated_at DESC LIMIT 1",
            session_id,
        )
        if row is None:
            return None

        return {
            "id": str(row["id"]),
            "sessionId": str(row["session_id"]),
            "reportData": json.loads(row["report_data"]),
            "generatedAt": row["generated_at"].isoformat(),
        }