import { useEffect, useState, useRef, useCallback } from 'react';
import { API } from '../config/api';
import type { FrameAnalysis, ZoneAnalysis, ArbiterVerdict } from './useAnalysisEngine';

// ── Constants ────────────────────────────────────────────────────────────────

const MAX_RECONNECT_DELAY_MS = 30_000; // 30 s
const INITIAL_RECONNECT_DELAY_MS = 1_000; // 1 s
const RECONNECT_BACKOFF_MULTIPLIER = 2;

// ── Types ────────────────────────────────────────────────────────────────────

export type WsConnectionState = 'connecting' | 'connected' | 'disconnected' | 'error';

export interface UseWebSocketReturn {
  liveAnalyses: FrameAnalysis[];
  setLiveAnalyses: React.Dispatch<React.SetStateAction<FrameAnalysis[]>>;
  connectionState: WsConnectionState;
}

// ── Parse incoming WebSocket message ─────────────────────────────────────────

/**
 * Incoming WS messages from the inference server follow this shape:
 *
 * ```json
 * {
 *   "type": "frame_analysis",
 *   "id": "uuid",
 *   "procedureId": 3,
 *   "frameNumber": 12,
 *   "timestamp": 1712345678000,
 *   "zones": [{ ... }],
 *   "arbiter": { ... },
 *   "overallFindings": "...",
 *   "imageUrl": null
 * }
 * ```
 */
interface WsFrameMessage {
  type: 'frame_analysis';
  id: string;
  procedureId: number;
  frameNumber: number;
  timestamp: number;
  zones: ZoneAnalysis[];
  arbiter: ArbiterVerdict;
  overallFindings: string;
  imageUrl: string | null;
  /** Optional raw agent outputs (for debugging / telemetry) */
  agentOutputs?: unknown[];
}

/** Fallback empty ArbiterVerdict used when parsing fails */
const EMPTY_ARBITER: ArbiterVerdict = {
  verdict: 'SAFE',
  summary: '',
  keyFindings: [],
  anatomyConfirmed: '',
  currentPhase: '',
  escalationLevel: 'NONE',
  escalationReason: '',
  teachingPoint: '',
  qualityScore: 75,
};

function parseWsMessage(data: string): FrameAnalysis | null {
  try {
    const msg = JSON.parse(data) as WsFrameMessage;

    if (msg.type !== 'frame_analysis' || !msg.id) {
      return null;
    }

    return {
      id: msg.id,
      procedureId: msg.procedureId ?? 0,
      frameNumber: msg.frameNumber ?? 0,
      timestamp: msg.timestamp ?? Date.now(),
      zones: Array.isArray(msg.zones) ? msg.zones : [],
      arbiter: msg.arbiter ?? EMPTY_ARBITER,
      overallFindings: msg.overallFindings ?? '',
      imageUrl: msg.imageUrl ?? null,
    };
  } catch {
    return null;
  }
}

// ── Hook ─────────────────────────────────────────────────────────────────────

export function useWebSocket(sessionId: string | null): UseWebSocketReturn {
  const [liveAnalyses, setLiveAnalyses] = useState<FrameAnalysis[]>([]);
  const [connectionState, setConnectionState] = useState<WsConnectionState>('disconnected');

  // Refs to persist across renders without causing re-renders
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reconnectAttemptRef = useRef(0);
  const mountedRef = useRef(true);
  const sessionIdRef = useRef(sessionId);

  // Keep sessionIdRef in sync
  useEffect(() => {
    sessionIdRef.current = sessionId;
  }, [sessionId]);

  /** Clean up WebSocket and any pending reconnect timer */
  const teardown = useCallback(() => {
    if (reconnectTimerRef.current !== null) {
      clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }

    if (wsRef.current) {
      // Remove event handlers to prevent stale callbacks
      wsRef.current.onopen = null;
      wsRef.current.onmessage = null;
      wsRef.current.onclose = null;
      wsRef.current.onerror = null;

      if (wsRef.current.readyState === WebSocket.OPEN || wsRef.current.readyState === WebSocket.CONNECTING) {
        wsRef.current.close(1000, 'component unmount / session change');
      }
      wsRef.current = null;
    }

    reconnectAttemptRef.current = 0;
  }, []);

  /** Attempt to open a WebSocket connection */
  const connect = useCallback(() => {
    const sid = sessionIdRef.current;
    if (!sid) {
      setConnectionState('disconnected');
      return;
    }

    // Clean up any existing connection first
    if (wsRef.current) {
      wsRef.current.onclose = null; // prevent reconnect loop from close handler
      wsRef.current.close(1000, 'reconnecting');
      wsRef.current = null;
    }

    const url = `${API.wsUrl}?session=${encodeURIComponent(sid)}`;
    setConnectionState('connecting');

    try {
      const ws = new WebSocket(url);
      wsRef.current = ws;

      ws.onopen = () => {
        if (!mountedRef.current) return;
        setConnectionState('connected');
        reconnectAttemptRef.current = 0; // Reset backoff on successful connect
      };

      ws.onmessage = (event: MessageEvent) => {
        if (!mountedRef.current) return;
        const analysis = parseWsMessage(event.data);
        if (analysis) {
          setLiveAnalyses(prev => [...prev, analysis]);
        }
      };

      ws.onclose = (event: CloseEvent) => {
        if (!mountedRef.current) return;

        // Normal closure (code 1000) — don't reconnect
        if (event.code === 1000) {
          setConnectionState('disconnected');
          return;
        }

        setConnectionState('disconnected');

        // Exponential backoff reconnect
        const attempt = reconnectAttemptRef.current;
        const delay = Math.min(
          INITIAL_RECONNECT_DELAY_MS * Math.pow(RECONNECT_BACKOFF_MULTIPLIER, attempt),
          MAX_RECONNECT_DELAY_MS,
        );

        reconnectAttemptRef.current = attempt + 1;

        reconnectTimerRef.current = setTimeout(() => {
          if (mountedRef.current && sessionIdRef.current) {
            connect();
          }
        }, delay);
      };

      ws.onerror = () => {
        if (!mountedRef.current) return;
        setConnectionState('error');
        // The onclose handler will fire after onerror, handling reconnection
      };
    } catch {
      if (!mountedRef.current) return;
      setConnectionState('error');

      // Retry after initial delay
      reconnectTimerRef.current = setTimeout(() => {
        if (mountedRef.current && sessionIdRef.current) {
          connect();
        }
      }, INITIAL_RECONNECT_DELAY_MS);
    }
  }, []);

  // ── Main effect: connect / reconnect when sessionId changes ──────────────

  useEffect(() => {
    mountedRef.current = true;

    // Clear analyses when session changes
    setLiveAnalyses([]);

    if (sessionId) {
      connect();
    } else {
      setConnectionState('disconnected');
    }

    return () => {
      mountedRef.current = false;
      teardown();
    };
  }, [sessionId, connect, teardown]);

  return { liveAnalyses, setLiveAnalyses, connectionState };
}