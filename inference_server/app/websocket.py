"""WebSocket bridge for real-time frame analysis streaming.

Provides:
- FastAPI WebSocket at `/ws?session={sessionId}`
- Redis pub/sub subscriber that pushes analysis results to connected clients
- Direct in-memory fallback when Redis is not available
- Clean connection lifecycle management

Frontend connects via:
    const ws = new WebSocket(`ws://localhost:8000/ws?session=${sessionId}`);
    ws.onmessage = (event) => {
        const analysis = JSON.parse(event.data);  // matches FrameAnalysis shape
    };
"""

from __future__ import annotations

import asyncio
import json
import logging
import os
from typing import Any, Optional

from fastapi import WebSocket, WebSocketDisconnect

logger = logging.getLogger("mediast.websocket")

# ─── Redis Client (lazy-loaded) ──────────────────────────────────────────────

_REDIS_POOL: Optional[Any] = None  # redis.asyncio.Redis instance


async def get_redis():
    """Lazy-init and return a Redis async client.

    Returns None if redis-py is not installed or REDIS_URL is not set.
    """
    global _REDIS_POOL
    if _REDIS_POOL is not None:
        return _REDIS_POOL

    redis_url = os.environ.get("REDIS_URL", "redis://localhost:6379/0")
    if not redis_url:
        return None

    try:
        import redis.asyncio as aioredis  # type: ignore

        _REDIS_POOL = aioredis.from_url(
            redis_url,
            decode_responses=True,
            socket_connect_timeout=2,
            socket_timeout=5,
        )
        # Ping to verify connectivity
        await _REDIS_POOL.ping()
        logger.info("Connected to Redis at %s", redis_url)
        return _REDIS_POOL
    except Exception as exc:
        logger.warning("Redis unavailable (%s). Falling back to in-memory WebSocket push.", exc)
        _REDIS_POOL = None  # Reset so we try again on next connection
        return None


async def close_redis():
    """Close the Redis connection pool."""
    global _REDIS_POOL
    if _REDIS_POOL is not None:
        try:
            await _REDIS_POOL.aclose()
        except Exception:
            pass
        _REDIS_POOL = None


# ─── Connection Manager ──────────────────────────────────────────────────────

class ConnectionManager:
    """Manages WebSocket connections grouped by session ID.

    Supports two modes:
    1. **Redis mode** — a background listener subscribes to `frame:analysis:{sessionId}`
       and fans out messages to all connected clients for that session.
    2. **Direct mode** (fallback) — analysis endpoints can push directly via `broadcast()`.
    """

    def __init__(self):
        # { session_id: set[WebSocket] }
        self._connections: dict[str, set[WebSocket]] = {}
        # { session_id: asyncio.Task } — one Redis listener per session
        self._listeners: dict[str, asyncio.Task] = {}
        self._lock = asyncio.Lock()

    # ── Connection Lifecycle ──────────────────────────────────────────────

    async def connect(self, session_id: str, ws: WebSocket) -> None:
        """Register a new WebSocket connection for a session."""
        async with self._lock:
            if session_id not in self._connections:
                self._connections[session_id] = set()
            self._connections[session_id].add(ws)

        # Start Redis listener if not already running for this session
        if session_id not in self._listeners:
            redis = await get_redis()
            if redis is not None:
                task = asyncio.create_task(
                    self._redis_listener(session_id, redis),
                    name=f"redis-listener-{session_id}",
                )
                self._listeners[session_id] = task
                logger.debug("Started Redis listener for session %s", session_id)

    async def disconnect(self, session_id: str, ws: WebSocket) -> None:
        """Remove a WebSocket connection. If the session has no more clients,
        cancel the Redis listener."""
        async with self._lock:
            if session_id in self._connections:
                self._connections[session_id].discard(ws)
                if not self._connections[session_id]:
                    del self._connections[session_id]

        # Cancel Redis listener if no more clients
        if session_id not in self._connections:
            listener = self._listeners.pop(session_id, None)
            if listener is not None and not listener.done():
                listener.cancel()
                try:
                    await listener
                except asyncio.CancelledError:
                    pass
                logger.debug("Cancelled Redis listener for session %s", session_id)

    # ── Message Broadcasting ──────────────────────────────────────────────

    async def broadcast(self, session_id: str, message: dict[str, Any]) -> None:
        """Send a JSON message to all WebSocket clients for a session."""
        async with self._lock:
            connections = self._connections.get(session_id, set()).copy()

        payload = json.dumps(message, default=str)
        disconnected = set()

        for ws in connections:
            try:
                await ws.send_text(payload)
            except Exception:
                disconnected.add(ws)

        # Clean up disconnected clients
        if disconnected:
            async with self._lock:
                if session_id in self._connections:
                    self._connections[session_id] -= disconnected

    # ── Redis Listener ────────────────────────────────────────────────────

    async def _redis_listener(self, session_id: str, redis: Any) -> None:
        """Background coroutine: subscribe to Redis channel for this session
        and fan out messages to connected WebSocket clients."""
        channel_name = f"frame:analysis:{session_id}"
        try:
            pubsub = redis.pubsub()
            await pubsub.subscribe(channel_name)
            logger.debug("Subscribed to Redis channel %s", channel_name)

            async for message in pubsub.listen():
                if message["type"] != "message":
                    continue
                try:
                    data = json.loads(message["data"])
                    await self.broadcast(session_id, data)
                except (json.JSONDecodeError, TypeError) as exc:
                    logger.warning("Invalid Redis message on %s: %s", channel_name, exc)

                # If no more connections for this session, stop listening
                async with self._lock:
                    if session_id not in self._connections:
                        break

        except asyncio.CancelledError:
            pass
        except Exception as exc:
            logger.error("Redis listener error for %s: %s", session_id, exc)
        finally:
            try:
                await pubsub.unsubscribe(channel_name)
                await pubsub.close()
            except Exception:
                pass
            # Cleanup listener tracking
            existing = self._listeners.get(session_id)
            if existing and existing.done():
                self._listeners.pop(session_id, None)

    # ── Health ────────────────────────────────────────────────────────────

    @property
    def active_connections(self) -> int:
        """Return total number of connected WebSocket clients."""
        return sum(len(ws_set) for ws_set in self._connections.values())

    @property
    def active_sessions(self) -> int:
        """Return number of sessions with active WebSocket connections."""
        return len(self._connections)


# Singleton
manager = ConnectionManager()


# ─── WebSocket Endpoint ──────────────────────────────────────────────────────

async def websocket_endpoint(ws: WebSocket, session_id: str) -> None:
    """Handle a single WebSocket connection for a session.

    Called by the router in main.py. Manages the full lifecycle:
    accept → register → listen for client messages → disconnect.
    """
    await ws.accept()
    await manager.connect(session_id, ws)
    logger.info(
        "WebSocket connected — session=%s, active=%d/%d",
        session_id,
        manager.active_sessions,
        manager.active_connections,
    )

    try:
        # Keep connection alive — echo pings and forward client messages to Redis
        while True:
            data = await ws.receive_text()

            # Handle client-to-server messages (e.g., pings, commands)
            try:
                msg = json.loads(data)
            except json.JSONDecodeError:
                await ws.send_json({"type": "error", "detail": "Invalid JSON"})
                continue

            msg_type = msg.get("type", "")

            if msg_type == "ping":
                await ws.send_json({"type": "pong"})

            elif msg_type == "publish":
                # Client pushes an analysis result to be broadcast
                channel = f"frame:analysis:{session_id}"
                redis = await get_redis()
                if redis is not None:
                    await redis.publish(channel, json.dumps(msg.get("payload", {}), default=str))
                else:
                    # Direct broadcast if no Redis
                    await manager.broadcast(session_id, msg.get("payload", {}))

            elif msg_type == "subscribe":
                # Confirmation / acknowledge
                await ws.send_json({
                    "type": "subscribed",
                    "session": session_id,
                })

    except WebSocketDisconnect:
        pass
    except Exception as exc:
        logger.warning("WebSocket error for session %s: %s", session_id, exc)
    finally:
        await manager.disconnect(session_id, ws)
        logger.info(
            "WebSocket disconnected — session=%s, active=%d/%d",
            session_id,
            manager.active_sessions,
            manager.active_connections,
        )


# ─── Helper: Publish Analysis to Redis / WebSocket ───────────────────────────

async def publish_analysis(session_id: str, analysis_data: dict[str, Any]) -> None:
    """Publish a frame analysis result to the session's channel.

    This is called from analyze.py after inserting a frame analysis.
    It publishes to Redis (if available) and broadcasts directly to any
    connected WebSocket clients (as fallback).
    """
    channel = f"frame:analysis:{session_id}"

    # Try Redis first
    redis = await get_redis()
    if redis is not None:
        try:
            await redis.publish(channel, json.dumps(analysis_data, default=str))
            return
        except Exception as exc:
            logger.warning("Redis publish failed: %s", exc)

    # Fallback: broadcast directly to in-memory WS connections
    await manager.broadcast(session_id, analysis_data)