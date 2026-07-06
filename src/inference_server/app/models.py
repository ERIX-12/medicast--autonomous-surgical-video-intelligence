"""Pydantic models for the MediCast inference server.

All models are designed to match the frontend TypeScript interfaces
in src/hooks/useAnalysisEngine.ts and src/data/types.ts.
"""

from __future__ import annotations

from typing import Any, Optional

from pydantic import BaseModel, Field


# ─── Request Models ──────────────────────────────────────────────────────────

class FrameAnalysisRequest(BaseModel):
    """Request to analyze a single surgical video frame."""
    frame: str = Field(
        ..., description="Base64-encoded JPEG frame data"
    )
    procedureId: int = Field(
        ..., description="Procedure ID (1-10) matching the knowledge base"
    )
    procedureName: str = Field(
        ..., description="Display name of the surgical procedure"
    )
    frameIndex: int = Field(
        ..., ge=0, description="Zero-based frame index in the sequence"
    )
    sessionId: str = Field(
        ..., description="UUID identifying the analysis session"
    )
    prompts: Optional[dict[str, str]] = Field(
        None, description="Optional override prompt context for each agent"
    )


class SessionCreate(BaseModel):
    """Request to create a new analysis session."""
    procedureType: str = Field(
        ..., description="Name of the procedure (e.g. 'Laparoscopic Cholecystectomy')"
    )
    videoUrl: Optional[str] = Field(
        None, description="URL to YouTube video (optional)"
    )


# ─── Response Models ─────────────────────────────────────────────────────────

class AgentResult(BaseModel):
    """Output from a single AI agent (Anatomy, Safety, Phase, or Education)."""
    agentId: str = Field(
        ..., description="Short agent identifier: 'ana', 'sen', 'nav', 'edu'"
    )
    agentName: str = Field(
        ..., description="Human-readable agent name"
    )
    output: dict[str, Any] = Field(
        ...,
        description=(
            "Agent-specific output dict. Expected keys vary by agent:\n"
            "- anatomy: visibleStructures, confidence, findings, riskZones\n"
            "- safety: safetyLevel, alerts, confidence, findings\n"
            "- phase: currentPhase, confidence, findings, phaseProgress\n"
            "- education: feedback, qualityScore, teachingPoints, confidence\n"
            "All agents include: confidence, findings, alerts"
        ),
    )
    inferenceMs: int = Field(
        ..., ge=0, description="Processing time in milliseconds"
    )


class ArbiterVerdict(BaseModel):
    """Unified verdict from the Arbiter agent that synthesizes all 4 agents."""
    verdict: str = Field(
        ..., pattern=r"^(SAFE|WARNING|CRITICAL)$",
        description="Overall safety verdict"
    )
    summary: str = Field(
        ..., description="One-sentence summary of the frame analysis"
    )
    keyFindings: list[str] = Field(
        ..., description="Key findings from the cross-agent synthesis"
    )
    anatomyConfirmed: str = Field(
        ..., description="Structures positively identified in the frame"
    )
    currentPhase: str = Field(
        ..., description="Identified surgical phase or 'UNCERTAIN'"
    )
    escalationLevel: str = Field(
        ..., pattern=r"^(NONE|WARNING|CRITICAL)$",
        description="Escalation level"
    )
    escalationReason: str = Field(
        ..., description="Reason for escalation, empty string if NONE"
    )
    teachingPoint: str = Field(
        ..., description="One teaching pearl relevant to this frame"
    )
    qualityScore: float = Field(
        ..., ge=0, le=100, description="Overall quality score 0-100"
    )


class FrameAnalysisResponse(BaseModel):
    """Complete response from the analyze-frame endpoint."""
    agents: list[AgentResult] = Field(
        ..., description="Results from the 4 vision agents (ana, sen, nav, edu)"
    )
    arbiter: ArbiterVerdict = Field(
        ..., description="Synthesized verdict from the Arbiter"
    )
    frameIndex: int = Field(
        ..., ge=0, description="Frame index that was analyzed"
    )
    processingTimeMs: int = Field(
        ..., ge=0, description="Total server-side processing time"
    )
    simulated: bool = Field(
        ..., description="True if this is mock/simulated data (no GPU)"
    )


class SessionResponse(BaseModel):
    """Response for session CRUD operations."""
    id: str = Field(..., description="Session UUID")
    procedureType: str = Field(..., description="Procedure name")
    status: str = Field(
        ..., pattern=r"^(created|analyzing|completed|failed)$",
        description="Current session status"
    )
    createdAt: str = Field(
        ..., description="ISO 8601 creation timestamp"
    )


class BlackBoxResponse(BaseModel):
    """Black-box hash for audit trail integrity."""
    id: str = Field(..., description="Black-box entry UUID")
    sessionId: str = Field(..., description="Session UUID")
    frameIndex: int = Field(..., ge=0)
    hash: str = Field(..., description="SHA-256 hash of the analysis data")
    createdAt: str = Field(..., description="ISO 8601 timestamp")


class ReportResponse(BaseModel):
    """Compiled clinical report for a session."""
    sessionId: str = Field(..., description="Session UUID")
    procedureType: str = Field(...)
    totalFrames: int = Field(..., ge=0)
    avgQualityScore: float = Field(..., ge=0, le=100)
    escalationCount: int = Field(..., ge=0)
    criticalEvents: list[dict[str, Any]] = Field(
        ..., description="List of critical events detected"
    )
    keyFindings: list[str] = Field(
        ..., description="Aggregated key findings"
    )
    teachingPoints: list[str] = Field(
        ..., description="Aggregated teaching pearls"
    )
    generatedAt: str = Field(..., description="ISO 8601 timestamp")


class GPUMetrics(BaseModel):
    """GPU telemetry snapshot."""
    gpuUtilization: float = Field(..., ge=0, le=100)
    memoryUtilization: float = Field(..., ge=0, le=100)
    temperatureC: float = Field(..., ge=0, le=150)
    powerDrawW: float = Field(..., ge=0)
    available: bool = Field(..., description="True if GPU metrics are real")