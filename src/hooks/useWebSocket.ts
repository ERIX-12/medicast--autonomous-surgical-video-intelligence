import { useEffect, useState, useRef, useCallback } from 'react';
import type { FrameAnalysis } from './useAnalysisEngine';

// ── Types ────────────────────────────────────────────────────────────────────

export type WsConnectionState = 'connecting' | 'connected' | 'disconnected' | 'error';

export interface UseWebSocketReturn {
  liveAnalyses: FrameAnalysis[];
  setLiveAnalyses: React.Dispatch<React.SetStateAction<FrameAnalysis[]>>;
  connectionState: WsConnectionState;
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
    // Disabled WebSocket entirely to prevent 404 spam.
    // The analysis engine uses direct REST HTTP polling (POST /api/analyze-frame) 
    // which is more reliable and doesn't require a persistent WS connection.
    setConnectionState('disconnected');
    return;
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