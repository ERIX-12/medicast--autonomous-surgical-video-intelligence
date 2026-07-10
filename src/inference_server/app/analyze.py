"""API routers for the MediCast inference server.

Defines all REST endpoints:
- POST /api/analyze-frame      — Real analysis (uses GPU/LLM)
- POST /api/analyze-frame-mock — Mock analysis (no GPU needed)
- POST /api/sessions           — Create session
- GET  /api/sessions/{id}      — Get session
- PATCH /api/sessions/{id}     — Update session status
- GET  /api/reports/{id}       — Get compiled report
- GET  /api/black-box/{id}     — Get black box hash
- GET  /api/telemetry          — Get GPU metrics
- GET  /api/health             — System health check
"""

from __future__ import annotations

import hashlib
import json
import os
import time
import uuid

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel

from .inference import InferenceEngine
from . import auth as auth_module
from . import database as db
from . import inference as inf
from . import telemetry as tel
from . import websocket as ws
from .report_generator import generate_docx_report, generate_pdf_report
from .models import (
    FrameAnalysisRequest,
    FrameAnalysisResponse,
    AgentResult,
    ArbiterVerdict,
    SessionCreate,
    SessionResponse,
    GPUMetrics,
)

router = APIRouter(prefix="/api")

# ─── Inference Engine ────────────────────────────────────────────────────────

INFERENCE_PROVIDER = os.environ.get("INFERENCE_PROVIDER", "fireworks")
INFERENCE_ENDPOINT = os.environ.get("INFERENCE_ENDPOINT")
INFERENCE_API_KEY = os.environ.get("INFERENCE_API_KEY", "fw_QdWMoKVjY8xeicpioEtMSx")

engine = inf.create_inference_engine(
    provider=INFERENCE_PROVIDER,
    endpoint=INFERENCE_ENDPOINT,
    api_key=INFERENCE_API_KEY,
)


# ─── Helpers ─────────────────────────────────────────────────────────────────

SPECIALTY_MAP = {
    1: "General Surgery", 2: "General Surgery",
    3: "Orthopedics", 4: "Orthopedics",
    5: "Cardiac Surgery", 6: "Cardiac Surgery",
    7: "OB/GYN", 8: "OB/GYN",
    9: "Urology", 10: "Urology",
}


def _build_agents_response(agent_results: list[dict]) -> list[AgentResult]:
    """Map raw agent results to Pydantic AgentResult models."""
    return [
        AgentResult(
            agentId=a["agentId"],
            agentName=a["agentName"],
            output=a["output"],
            inferenceMs=a["inferenceMs"],
        )
        for a in agent_results
    ]


def _build_arbiter_verdict(arb: dict) -> ArbiterVerdict:
    """Map raw arbiter result to Pydantic ArbiterVerdict model."""
    return ArbiterVerdict(
        verdict=arb["verdict"],
        summary=arb["summary"],
        keyFindings=arb["keyFindings"],
        anatomyConfirmed=arb["anatomyConfirmed"],
        currentPhase=arb["currentPhase"],
        escalationLevel=arb["escalationLevel"],
        escalationReason=arb["escalationReason"],
        teachingPoint=arb["teachingPoint"],
        qualityScore=arb["qualityScore"],
    )


def _store_frame_analysis(session_id: str, frame_index: int, agent_results: list[dict], arbiter_result: dict):
    """Persist analysis to DB and generate black-box hash."""
    analysis_id = str(uuid.uuid4())
    escalation_level = arbiter_result.get("escalationLevel", "NONE")

    db.insert_frame_analysis(
        analysis_id=analysis_id,
        session_id=session_id,
        frame_index=frame_index,
        timestamp_sec=time.time(),
        agent_results=agent_results,
        arbiter_verdict=arbiter_result,
        escalation_level=escalation_level,
    )

    hash_input = json.dumps({
        "sessionId": session_id,
        "frameIndex": frame_index,
        "agents": agent_results,
        "arbiter": arbiter_result,
    }, sort_keys=True)
    bb_hash = hashlib.sha256(hash_input.encode()).hexdigest()

    db.insert_black_box_entry(
        entry_id=str(uuid.uuid4()),
        session_id=session_id,
        frame_index=frame_index,
        hash_value=bb_hash,
    )


# ─── Frame Analysis (Real) ───────────────────────────────────────────────────

@router.post("/analyze-frame", response_model=FrameAnalysisResponse)
async def analyze_frame(request: FrameAnalysisRequest):
    """Analyze a single surgical video frame using all 4 AI agents.

    The 4 vision agents (Anatomy, Safety, Phase, Education) run in parallel.
    The Arbiter runs sequentially after all vision agents complete.

    Requires a GPU with vLLM or Ollama. Falls back to mock if unavailable.
    """
    start_time = time.monotonic()

    try:
        import base64
        frame_bytes = base64.b64decode(request.frame)
    except Exception as e:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid base64 frame data: {str(e)}",
        )

    procedure_type = SPECIALTY_MAP.get(request.procedureId, "General Surgery")

    # ⚡ Run 4 vision agents IN PARALLEL
    agent_results = await engine.analyze_frame_parallel(
        frame=frame_bytes,
        procedure_type=procedure_type,
        procedure_name=request.procedureName,
        procedure_id=request.procedureId,
        prompts=request.prompts,
    )

    # 🧠 Run Arbiter SEQUENTIALLY after all vision agents complete
    arbiter_result = await engine.analyze_text(
        agent_results=agent_results,
        procedure_type=procedure_type,
        procedure_name=request.procedureName,
        procedure_id=request.procedureId,
    )

    total_time = int((time.monotonic() - start_time) * 1000)

    # Persist to database and black box
    _store_frame_analysis(
        session_id=request.sessionId,
        frame_index=request.frameIndex,
        agent_results=agent_results,
        arbiter_result=arbiter_result,
    )

    # Build response
    response = FrameAnalysisResponse(
        agents=_build_agents_response(agent_results),
        arbiter=_build_arbiter_verdict(arbiter_result),
        frameIndex=request.frameIndex,
        processingTimeMs=total_time,
        simulated=False,
    )

    # 📡 Push to WebSocket/Redis for real-time frontend updates
    await ws.publish_analysis(request.sessionId, response.model_dump())

    return response


# ─── Debrief Chat ────────────────────────────────────────────────────────────

from pydantic import BaseModel

class DebriefRequest(BaseModel):
    sessionId: str
    question: str
    context: list[dict]

@router.post("/debrief")
async def debrief_chat_endpoint(request: DebriefRequest):
    """Interactive chat with the AI Arbiter post-surgery."""
    response = await engine.debrief_chat(request.question, request.context)
    return {"reply": response}

from fastapi.responses import StreamingResponse

@router.post("/report/docx")
async def download_docx_report(request: DebriefRequest):
    """Generate and download a DOCX medical report."""
    file_stream = generate_docx_report(request.context, request.sessionId)
    return StreamingResponse(
        file_stream, 
        media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        headers={"Content-Disposition": f"attachment; filename=MediCast_Report_{request.sessionId}.docx"}
    )

@router.post("/report/pdf")
async def download_pdf_report(request: DebriefRequest):
    """Generate and download a PDF medical report."""
    file_stream = generate_pdf_report(request.context, request.sessionId)
    return StreamingResponse(
        file_stream, 
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename=MediCast_Report_{request.sessionId}.pdf"}
    )

# ─── Frame Analysis (Mock) ───────────────────────────────────────────────────

@router.post("/analyze-frame-mock", response_model=FrameAnalysisResponse)
async def analyze_frame_mock(request: FrameAnalysisRequest):
    """Analyze a frame using MOCK data (no GPU required).

    This endpoint is identical in interface to /analyze-frame but always
    returns procedurally generated mock data for development and testing.
    """
    start_time = time.monotonic()

    procedure_type = SPECIALTY_MAP.get(request.procedureId, "General Surgery")

    # Generate mock agent results (simulates parallel execution)
    agent_results = await engine.mock_analyze_frame(
        procedure_type=procedure_type,
        procedure_name=request.procedureName,
        procedure_id=request.procedureId,
        frame_index=request.frameIndex,
    )

    # Generate mock arbiter verdict
    arbiter_result = await engine.mock_arbiter(agent_results)

    total_time = int((time.monotonic() - start_time) * 1000)

    # Build response
    response = FrameAnalysisResponse(
        agents=_build_agents_response(agent_results),
        arbiter=_build_arbiter_verdict(arbiter_result),
        frameIndex=request.frameIndex,
        processingTimeMs=total_time,
        simulated=True,
    )

    # 📡 Push to WebSocket/Redis for real-time frontend updates
    await ws.publish_analysis(request.sessionId, response.model_dump())

    return response


# ─── Session Management ─────────────────────────────────────────────────────

@router.post("/sessions", response_model=SessionResponse)
async def create_session_endpoint(session_data: SessionCreate):
    """Create a new analysis session."""
    session_id = str(uuid.uuid4())
    result = await db.create_session(
        session_id=session_id,
        procedure_type=session_data.procedureType,
        video_url=session_data.videoUrl,
    )
    return SessionResponse(
        id=result["id"],
        procedureType=result["procedureType"],
        status=result["status"],
        createdAt=result["createdAt"],
    )


@router.get("/sessions/{session_id}", response_model=SessionResponse)
async def get_session_endpoint(session_id: str):
    """Get session details."""
    result = await db.get_session(session_id)
    if result is None:
        raise HTTPException(status_code=404, detail="Session not found")
    return SessionResponse(
        id=result["id"],
        procedureType=result["procedureType"],
        status=result["status"],
        createdAt=result["createdAt"],
    )


@router.get("/sessions/{session_id}/analyses")
async def get_session_analyses_endpoint(session_id: str):
    """Get all frame analyses for a given session."""
    analyses = await db.get_frame_analyses(session_id)
    return {"analyses": analyses}


@router.patch("/sessions/{session_id}", response_model=SessionResponse)
async def update_session_endpoint(session_id: str, status: str):
    """Update session status."""
    valid_statuses = {"created", "analyzing", "completed", "failed"}
    if status not in valid_statuses:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid status. Must be one of: {', '.join(sorted(valid_statuses))}",
        )

    success = await db.update_session_status(session_id, status)
    if not success:
        raise HTTPException(status_code=404, detail="Session not found")

    result = await db.get_session(session_id)
    return SessionResponse(
        id=result["id"],
        procedureType=result["procedureType"],
        status=result["status"],
        createdAt=result["createdAt"],
    )


@router.get("/sessions")
async def list_sessions_endpoint(
    limit: int = 20,
    user: dict = Depends(auth_module.get_optional_user),
):
    """List all sessions, ordered by created_at DESC.

    If the user is authenticated, returns only their sessions.
    """
    user_id = user.get("id") if user else None
    sessions = await db.list_sessions(user_id=user_id, limit=limit)
    return {"sessions": sessions, "total": len(sessions)}


@router.delete("/sessions/{session_id}")
async def delete_session_endpoint(session_id: str):
    """Delete a session and all associated frame analyses, reports, and black-box entries."""
    success = await db.delete_session(session_id)
    if not success:
        raise HTTPException(status_code=404, detail="Session not found")
    return {"status": "deleted", "id": session_id}


# ─── Reports ────────────────────────────────────────────────────────────────

@router.get("/reports/{session_id}")
async def get_report_endpoint(session_id: str):
    """Get a compiled clinical report for a session."""
    existing = await db.get_clinical_report(session_id)
    if existing:
        return existing["reportData"]

    analyses = await db.get_frame_analyses(session_id)
    if not analyses:
        raise HTTPException(
            status_code=404,
            detail="No analyses found for this session.",
        )

    total_frames = len(analyses)
    scores = [
        a["arbiterVerdict"]["qualityScore"]
        for a in analyses
        if a["arbiterVerdict"].get("qualityScore") is not None
    ]
    avg_score = sum(scores) / len(scores) if scores else 0.0

    critical_events = [
        {"frameIndex": a["frameIndex"], "findings": a["arbiterVerdict"]["keyFindings"]}
        for a in analyses
        if a["arbiterVerdict"].get("escalationLevel") == "CRITICAL"
    ]

    all_findings: list[str] = []
    all_teaching: list[str] = []
    for a in analyses:
        all_findings.extend(a["arbiterVerdict"]["keyFindings"])
        if a["arbiterVerdict"].get("teachingPoint"):
            all_teaching.append(a["arbiterVerdict"]["teachingPoint"])

    report = {
        "sessionId": session_id,
        "generatedAt": __import__("datetime").datetime.utcnow().isoformat(),
        "totalFrames": total_frames,
        "avgQualityScore": round(avg_score, 1) if avg_score else 0.0,
        "escalationCount": len(critical_events),
        "criticalEvents": critical_events,
        "keyFindings": list(dict.fromkeys(all_findings))[:10],
        "teachingPoints": list(dict.fromkeys(all_teaching))[:10],
    }

    await db.save_clinical_report(
        report_id=str(uuid.uuid4()),
        session_id=session_id,
        report_data=report,
    )

    return report


# ─── Black Box ──────────────────────────────────────────────────────────────

@router.get("/black-box/{session_id}")
async def get_black_box_endpoint(session_id: str):
    """Get all black-box audit trail entries for a session."""
    entries = await db.get_black_box_entries(session_id)
    if not entries:
        raise HTTPException(
            status_code=404,
            detail="No black-box entries found for this session.",
        )
    return {
        "sessionId": session_id,
        "entries": entries,
        "totalEntries": len(entries),
    }


# ─── Telemetry ──────────────────────────────────────────────────────────────

@router.get("/telemetry", response_model=GPUMetrics)
async def get_telemetry_endpoint():
    """Get current GPU telemetry snapshot."""
    metrics = await tel.get_gpu_metrics()
    return GPUMetrics(
        gpuUtilization=metrics["gpuUtilization"],
        memoryUtilization=metrics["memoryUtilization"],
        temperatureC=metrics["temperatureC"],
        powerDrawW=metrics["powerDrawW"],
        available=metrics.get("available", False),
    )


# ─── Health Check ───────────────────────────────────────────────────────────

@router.get("/health")
async def health_check():
    """Health check endpoint."""
    health = await tel.get_system_health()
    return {
        "status": "healthy",
        "version": "1.0.0",
        "service": "MediCast Inference Server",
        "gpu": {
            "available": health["gpu"]["available"],
            "name": health["gpu"].get("name", "Unknown"),
            "utilization": health["gpu"]["gpuUtilization"],
        },
        "inferenceMode": INFERENCE_PROVIDER or "mock",
    }