import { useState, useRef, useCallback } from 'react';
import { API, apiHeaders } from '../config/api';
import type { ProcedureKnowledge } from '../data/types';

function isYouTubeUrl(url: string): boolean {
  return url.includes('youtube.com') || url.includes('youtu.be');
}

export interface ZoneAnalysis {
  zoneId: string;
  zoneName: string;
  agentType: 'anatomy' | 'safety' | 'phase' | 'education';
  findings: string[];
  severity: 'safe' | 'caution' | 'danger' | 'critical';
  confidence: number;
  processingTimeMs: number;
}

export interface ArbiterVerdict {
  verdict: 'SAFE' | 'WARNING' | 'CRITICAL';
  summary: string;
  keyFindings: string[];
  anatomyConfirmed: string;
  currentPhase: string;
  escalationLevel: 'NONE' | 'WARNING' | 'CRITICAL';
  escalationReason: string;
  teachingPoint: string;
  qualityScore: number;
}

export interface FrameAnalysis {
  id: string;
  procedureId: number;
  frameNumber: number;
  timestamp: number;
  zones: ZoneAnalysis[];
  arbiter: ArbiterVerdict;
  overallFindings: string;
  imageUrl: string | null;
}

interface AnalysisState {
  isAnalyzing: boolean;
  framesProcessed: number;
  totalFrames: number;
  currentFrame: number;
  analyses: FrameAnalysis[];
  error: string | null;
}

// ── Server communication ─────────────────────────────────────────────────────

/**
 * Fetches frames from a YouTube video via the inference server.
 * Returns an array of base64-encoded JPEG frames.
 */
async function fetchYoutubeFrames(youtubeUrl: string, frameCount: number): Promise<string[]> {
  const response = await fetch(`${API.inferenceUrl}/api/fetch-youtube-frames`, {
    method: 'POST',
    headers: apiHeaders(),
    body: JSON.stringify({ url: youtubeUrl, max_frames: frameCount, fps: 1.0 }),
  });
  if (!response.ok) {
    const err = await response.text();
    throw new Error(`YouTube frame fetch failed: ${response.status} — ${err}`);
  }
  const data = await response.json();
  return data.frames as string[];
}

/** Map agent outputs from the inference server into ZoneAnalysis[] */
function agentsToZones(
  agents: Array<{ agentId: string; agentName: string; output: Record<string, unknown>; inferenceMs: number }>
): ZoneAnalysis[] {
  const mapping: Record<string, { zoneId: string; zoneName: string; agentType: ZoneAnalysis['agentType'] }> = {
    ana: { zoneId: 'zone-anatomy', zoneName: 'Anatomy Agent', agentType: 'anatomy' },
    sen: { zoneId: 'zone-safety', zoneName: 'Safety Agent', agentType: 'safety' },
    nav: { zoneId: 'zone-phase', zoneName: 'Phase Agent', agentType: 'phase' },
    edu: { zoneId: 'zone-education', zoneName: 'Education Agent', agentType: 'education' },
  };

  return agents.map(agent => {
    const m = mapping[agent.agentId] || {
      zoneId: `zone-${agent.agentId}`,
      zoneName: agent.agentName,
      agentType: 'anatomy' as const,
    };

    const output = agent.output;
    let severity: ZoneAnalysis['severity'] = 'safe';
    const safetyLevel = output.safetyLevel as string | undefined;
    const alerts = (output.alerts as string[]) ?? [];
    if (safetyLevel === 'CRITICAL' || alerts.some((a: string) => a.includes('CRITICAL'))) {
      severity = 'critical';
    } else if (safetyLevel === 'WARNING' || alerts.length > 0) {
      severity = 'caution';
    }

    const findings: string[] = [];
    if (output.visibleStructures) findings.push(...(output.visibleStructures as string[]));
    if (output.findings) findings.push(...(output.findings as string[]));
    if (output.riskZones) findings.push(...(output.riskZones as string[]));
    if (output.feedback) findings.push(output.feedback as string);
    if (findings.length === 0) findings.push('Analysis complete');

    return {
      zoneId: m.zoneId,
      zoneName: m.zoneName,
      agentType: m.agentType,
      findings,
      severity,
      confidence: ((output.confidence as number) ?? 75) / 100,
      processingTimeMs: agent.inferenceMs,
    };
  });
}

// ── Hook ─────────────────────────────────────────────────────────────────────

/** Capture interval in ms between frames for real-time analysis */
const CAPTURE_INTERVAL_MS = 3000; // Analyze one frame every 3 seconds

export function useAnalysisEngine() {
  const [state, setState] = useState<AnalysisState>({
    isAnalyzing: false,
    framesProcessed: 0,
    totalFrames: 0,
    currentFrame: 0,
    analyses: [],
    error: null,
  });

  const abortRef = useRef(false);
  const sessionIdRef = useRef<string | null>(null);

  const startAnalysis = useCallback(async (
    procedure: ProcedureKnowledge,
    _totalFramesHint: number,
    videoUrl?: string,
    frameProvider?: () => string | null,
    videoEndChecker?: () => boolean,
    videoDurationGetter?: () => number,
  ) => {
    abortRef.current = false;
    const sessionId = crypto.randomUUID();
    sessionIdRef.current = sessionId;

    // Detect YouTube source
    const isYoutube = videoUrl ? isYouTubeUrl(videoUrl) : false;

    // Estimate total frames from video duration if available
    const videoDuration = videoDurationGetter?.() || 0;
    const estimatedTotalFrames = videoDuration > 0
      ? Math.ceil(videoDuration / (CAPTURE_INTERVAL_MS / 1000))
      : 9999; // For live camera, use a large number (runs until stopped)

    setState(prev => ({
      ...prev,
      isAnalyzing: true,
      framesProcessed: 0,
      totalFrames: estimatedTotalFrames,
      currentFrame: 0,
      analyses: [],
      error: null,
    }));

    // If YouTube, pre-fetch frames from the inference server
    let youtubeFrames: string[] | null = null;
    if (isYoutube && videoUrl) {
      try {
        youtubeFrames = await fetchYoutubeFrames(videoUrl, estimatedTotalFrames);
        // Update total with actual count
        setState(prev => ({ ...prev, totalFrames: youtubeFrames!.length }));
      } catch (err) {
        console.error('YouTube frame fetch failed:', err);
        setState(prev => ({
          ...prev,
          isAnalyzing: false,
          error: err instanceof Error ? err.message : String(err)
        }));
        return;
      }
    }

    let frameNum = 0;

    // ── Continuous analysis loop ──
    while (!abortRef.current) {
      frameNum++;

      // Check if video has ended (for uploaded files)
      if (videoEndChecker?.()) {
        // Update the final total to match what we actually processed
        setState(prev => ({ ...prev, totalFrames: frameNum - 1 }));
        break;
      }

      // For YouTube pre-fetched frames, stop when we run out
      if (youtubeFrames && frameNum > youtubeFrames.length) {
        setState(prev => ({ ...prev, totalFrames: youtubeFrames!.length }));
        break;
      }

      // Get the base64 frame for this iteration
      let frameForAnalysis = youtubeFrames?.[frameNum - 1] ?? null;
      if (!frameForAnalysis && frameProvider) {
        frameForAnalysis = frameProvider();
      }

      // If no frame could be captured (e.g. video not ready yet), wait and retry
      if (!frameForAnalysis) {
        await new Promise(r => setTimeout(r, 500));
        frameNum--; // Don't count this as a processed frame
        continue;
      }

      let zones: ZoneAnalysis[];
      let arbiter: ArbiterVerdict;

      try {
        // Call the REAL inference server endpoint for Fireworks AI
        const response = await fetch(`${API.inferenceUrl}/api/analyze-frame`, {
          method: 'POST',
          headers: apiHeaders(),
          body: JSON.stringify({
            frame: frameForAnalysis,
            procedureId: procedure.procedureId,
            procedureName: procedure.name,
            frameIndex: frameNum - 1,
            sessionId,
            prompts: procedure.promptContext,
          }),
        });

        if (!response.ok) {
          throw new Error(`Server responded with ${response.status}`);
        }

        const data = await response.json() as {
          agents: Array<{ agentId: string; agentName: string; output: Record<string, unknown>; inferenceMs: number }>;
          arbiter: ArbiterVerdict;
          frameIndex: number;
        } | null;

        if (data && data.arbiter) {
          zones = agentsToZones(data.agents);
          arbiter = data.arbiter;
        } else {
          throw new Error('Invalid response from inference server');
        }
      } catch (err) {
        console.error('Inference server call failed:', err);
        setState(prev => ({
          ...prev,
          isAnalyzing: false,
          error: err instanceof Error ? err.message : String(err)
        }));
        break;
      }

      const analysisId = crypto.randomUUID();
      const timestamp = Date.now();

      const analysis: FrameAnalysis = {
        id: analysisId,
        procedureId: procedure.procedureId,
        frameNumber: frameNum,
        timestamp,
        zones,
        arbiter,
        overallFindings: arbiter.summary,
        imageUrl: `data:image/jpeg;base64,${frameForAnalysis}`,
      };

      setState(prev => ({
        ...prev,
        framesProcessed: frameNum,
        currentFrame: frameNum,
        analyses: [...prev.analyses, analysis],
      }));

      // Wait before capturing the next frame
      // This paces the analysis to match real-time video progression
      if (!youtubeFrames) {
        await new Promise(r => setTimeout(r, CAPTURE_INTERVAL_MS));
      }
    } // end while loop

    setState(prev => ({ ...prev, isAnalyzing: false }));
  }, []);

  const stopAnalysis = useCallback(() => {
    abortRef.current = true;
    setState(prev => ({ ...prev, isAnalyzing: false }));
  }, []);

  return {
    ...state,
    sessionId: sessionIdRef.current,
    startAnalysis,
    stopAnalysis,
  };
}