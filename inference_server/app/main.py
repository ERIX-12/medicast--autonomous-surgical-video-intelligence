"""MediCast Autonomous Surgical Video Intelligence — FastAPI Server.

This is the main entry point for the Python inference server.

Provides:
- REST API for frame analysis, session management, and reporting
- 4 AI agents running in parallel (Anatomy, Safety, Phase, Education)
- Arbiter agent for cross-agent synthesis
- **WebSocket bridge** for real-time analysis streaming
- YouTube frame extraction via yt-dlp + ffmpeg
- GPU telemetry via ROCm (AMD) or nvidia-smi
- Real inference via vLLM or Ollama (optional, configurable via env)
- Mock mode for development without GPU hardware

Usage:
    # Development (mock mode, no GPU required)
    uvicorn app.main:app --reload --port 8000

    # Production (with vLLM)
    INFERENCE_PROVIDER=vllm INFERENCE_ENDPOINT=http://localhost:8001 \\
        uvicorn app.main:app --host 0.0.0.0 --port 8000
"""

from __future__ import annotations

import logging
import os
from contextlib import asynccontextmanager

from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Query
from fastapi.middleware.cors import CORSMiddleware

from . import analyze as api_routes
from . import database as db
from . import websocket as ws_module
from . import youtube as youtube_routes


# ─── Logging ─────────────────────────────────────────────────────────────────

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(name)s] %(levelname)s: %(message)s",
)
logger = logging.getLogger("mediast")


# ─── Application Lifespan ────────────────────────────────────────────────────

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Handle application startup and shutdown.

    On startup: initialize database tables.
    On shutdown: close database connection pool and Redis.
    """
    # ── Startup ──────────────────────────────────────────────────────────────
    logger.info("MediCast Inference Server starting up...")
    await db.initialize_database()

    # Verify Redis availability (non-blocking)
    redis_client = await ws_module.get_redis()
    if redis_client is not None:
        logger.info("Redis connected — WebSocket pub/sub enabled")
    else:
        logger.info("Redis unavailable — WebSocket uses in-memory direct push")

    yield

    # ── Shutdown ─────────────────────────────────────────────────────────────
    logger.info("MediCast Inference Server shutting down...")
    await db.close_db_pool()
    await ws_module.close_redis()


# ─── FastAPI App ─────────────────────────────────────────────────────────────

app = FastAPI(
    title="MediCast — Autonomous Surgical Video Intelligence",
    description=(
        "Real-time AI-powered analysis of surgical video frames. "
        "4 specialist agents (Anatomy, Safety, Phase, Education) run in parallel "
        "with an Arbiter for cross-agent synthesis. "
        "Features WebSocket streaming and YouTube video frame extraction."
    ),
    version="1.0.0",
    lifespan=lifespan,
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register REST routers
app.include_router(api_routes.router)       # /api/analyze-frame, /api/sessions, etc.
app.include_router(youtube_routes.router)   # /api/fetch-youtube-frames, etc.


# ─── WebSocket Endpoint ──────────────────────────────────────────────────────

@app.websocket("/ws")
async def websocket_endpoint(
    ws: WebSocket,
    session: str = Query(..., description="Session ID to subscribe to"),
):
    """Real-time WebSocket endpoint for frame analysis streaming.

    Connect:
        ws://localhost:8000/ws?session={sessionId}

    The server pushes analysis results as they complete. Each message
    is a JSON object matching the FrameAnalysisResponse schema.

    Client can send JSON messages:
    - {"type": "ping"} → server replies {"type": "pong"}
    - {"type": "subscribe"} → server acknowledges the subscription
    """
    await ws_module.websocket_endpoint(ws, session)


# ─── Root Endpoint ───────────────────────────────────────────────────────────

@app.get("/")
async def root():
    """Root endpoint — returns service information."""
    return {
        "service": "MediCast Inference Server",
        "version": "1.0.0",
        "endpoints": {
            "analyze": {
                "POST /api/analyze-frame": "Analyze a single frame (real inference)",
                "POST /api/analyze-frame-mock": "Analyze a frame (mock, no GPU)",
            },
            "sessions": {
                "POST /api/sessions": "Create a new session",
                "GET /api/sessions/{id}": "Get session details",
                "PATCH /api/sessions/{id}": "Update session status",
            },
            "youtube": {
                "POST /api/fetch-youtube-frames": "Download video and extract frames",
                "POST /api/youtube-video-info": "Get video metadata",
                "GET /api/youtube-dependency-check": "Check yt-dlp/ffmpeg availability",
            },
            "reports": {
                "GET /api/reports/{session_id}": "Get compiled clinical report",
            },
            "audit": {
                "GET /api/black-box/{session_id}": "Get black-box audit trail",
            },
            "realtime": {
                "WS /ws?session={sessionId}": "WebSocket for live analysis streaming",
            },
            "system": {
                "GET /api/telemetry": "Get GPU telemetry snapshot",
                "GET /api/health": "System health check",
            },
        },
        "inferenceMode": os.environ.get("INFERENCE_PROVIDER") or ("fireworks" if os.environ.get("FIREWORKS_API_KEY") else "mock"),
        "agents": [
            "Anatomy Recognition Agent",
            "Safety Monitor Agent",
            "Phase Detection Agent",
            "Education & Quality Agent",
            "The Arbiter (Synthesis)",
        ],
        "docs": "/docs",
        "openapi": "/openapi.json",
    }


# ─── Direct Execution ────────────────────────────────────────────────────────

if __name__ == "__main__":
    import uvicorn

    host = os.environ.get("HOST", "0.0.0.0")
    port = int(os.environ.get("PORT", "8000"))
    reload = os.environ.get("RELOAD", "true").lower() == "true"

    uvicorn.run(
        "app.main:app",
        host=host,
        port=port,
        reload=reload,
        log_level="info",
    )