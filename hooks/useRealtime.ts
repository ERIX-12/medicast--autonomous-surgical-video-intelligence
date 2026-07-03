/**
 * @deprecated This hook is deprecated as part of the Supabase → self-hosted
 * migration. Use `useWebSocket` from `./useWebSocket` instead.
 *
 * This adapter wraps `useWebSocket` to provide the same return interface
 * so existing consumers continue to work during the transition period.
 */

import { useWebSocket } from './useWebSocket';

/**
 * @deprecated Use `useWebSocket` instead.
 *
 * Replaced by the native WebSocket hook (`src/hooks/useWebSocket.ts`)
 * which connects directly to the FastAPI inference server at
 * `ws://localhost:8000/ws?session=<sessionId>`.
 */
export function useRealtime(sessionId: string | null) {
  const { liveAnalyses, setLiveAnalyses } = useWebSocket(sessionId);
  return { liveAnalyses, setLiveAnalyses };
}