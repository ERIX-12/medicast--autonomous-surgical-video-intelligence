/**
 * MediCast — Self-Hosted Backend Configuration
 *
 * Replace these values with your deployment's endpoints.
 * All values can be overridden via Vite environment variables (VITE_*).
 */

export const API = {
  /** Base URL for the FastAPI inference server REST endpoints */
  inferenceUrl: import.meta.env.VITE_RENDER_BACKEND_HOST
    ? `https://${import.meta.env.VITE_RENDER_BACKEND_HOST}`
    : import.meta.env.VITE_INFERENCE_URL || 'http://localhost:8000',

  /** WebSocket URL for real-time frame analysis streaming */
  wsUrl: import.meta.env.VITE_RENDER_BACKEND_HOST
    ? `wss://${import.meta.env.VITE_RENDER_BACKEND_HOST}/ws`
    : import.meta.env.VITE_WS_URL || 'ws://localhost:8000/ws',

  /** MinIO / S3-compatible object storage config */
  minio: {
    endpoint: import.meta.env.VITE_MINIO_URL || 'http://localhost:9000',
    bucket: import.meta.env.VITE_MINIO_BUCKET || 'medicast-videos',
    accessKey: import.meta.env.VITE_MINIO_ACCESS_KEY || '',
    secretKey: import.meta.env.VITE_MINIO_SECRET_KEY || '',
  },

  /**
   * Shared API key sent as `X-API-Key` header with every request.
   * The inference server validates this against its own key.
   */
  apiKey: import.meta.env.VITE_API_KEY || 'medicast-demo-key',
} as const;

/** Helper to build standard headers including the API key */
export function apiHeaders(extra: Record<string, string> = {}): Record<string, string> {
  return {
    'Content-Type': 'application/json',
    'X-API-Key': API.apiKey,
    ...extra,
  };
}