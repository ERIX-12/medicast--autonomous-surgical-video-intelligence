import { useState, useRef, useCallback } from 'react';
import { API, apiHeaders } from '../config/api';
import type { ProcedureKnowledge } from '../data/types';

function isYouTubeUrl(url: string): boolean {
  return url.includes('youtube.com') || url.includes('youtu.be');
}

function extractYouTubeId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})(?:[&?/]|$)/,
    /(?:youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
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

// ── Mock data generators (fallback when inference server is unreachable) ──────

function mockZoneAnalysis(zoneId: string, zoneName: string, agentType: ZoneAnalysis['agentType']): ZoneAnalysis {
  const findings: Record<string, string[]> = {
    anatomy: [
      'Structures clearly visible in surgical field',
      'Anatomical landmarks well-identified',
      'Critical structures in safe zone',
      'Anatomical variant noted — no concern',
      'Standard anatomy, no anomalies detected',
    ],
    safety: [
      'Dissection plane maintained within safe boundaries',
      'No thermal spread to adjacent structures',
      'Hemostasis adequate, no active bleeding',
      'Critical structure proximity alert — CAUTION',
      'Instrument trajectory safe, no risk of injury',
    ],
    phase: [
      'Dissection progressing at expected pace',
      'Key landmark exposed successfully',
      'Transition between phases smooth',
      'Current phase consistent with surgical plan',
      'Phase timing within expected range',
    ],
    education: [
      'Good tissue handling technique observed',
      'Instrument selection appropriate for current step',
      'Team coordination effective',
      'Opportunity for teaching moment identified',
      'Technique rating: EXCELLENT',
    ],
  };

  const severities: ZoneAnalysis['severity'][] = ['safe', 'caution', 'danger', 'critical'];
  const weights = [0.55, 0.30, 0.10, 0.05];
  const rand = Math.random();
  let severityIndex = 0;
  let cumulative = 0;
  for (let i = 0; i < weights.length; i++) {
    cumulative += weights[i];
    if (rand < cumulative) { severityIndex = i; break; }
  }

  const picked = findings[agentType] || findings.anatomy;
  const count = 1 + Math.floor(Math.random() * 3);
  const shuffled = [...picked].sort(() => Math.random() - 0.5);

  return {
    zoneId,
    zoneName,
    agentType,
    findings: shuffled.slice(0, count),
    severity: severities[severityIndex],
    confidence: 0.65 + Math.random() * 0.33,
    processingTimeMs: 80 + Math.random() * 420,
  };
}

function mockArbiterVerdict(zones: ZoneAnalysis[]): ArbiterVerdict {
  const hasCritical = zones.some(z => z.severity === 'critical');
  const hasDanger = zones.some(z => z.severity === 'danger');

  const safeVerdicts: ArbiterVerdict[] = [
    {
      verdict: 'SAFE', summary: 'All structures within normal limits. Dissection proceeding cleanly.',
      keyFindings: ['Clear anatomical visualization', 'No safety concerns identified'],
      anatomyConfirmed: 'Gallbladder, cystic duct, CBD, liver edge',
      currentPhase: "Dissection of Calot's Triangle", escalationLevel: 'NONE', escalationReason: '',
      teachingPoint: 'Maintain Critical View of Safety before clipping', qualityScore: 88,
    },
  ];

  const warnVerdicts: ArbiterVerdict[] = [
    {
      verdict: 'WARNING', summary: 'Approaching critical structure zone. Proceed with caution.',
      keyFindings: ['Proximity to bile duct noted', 'Anatomy slightly distorted by inflammation'],
      anatomyConfirmed: 'Partially obscured — cystic duct not fully visualized',
      currentPhase: "Dissection of Calot's Triangle", escalationLevel: 'WARNING',
      escalationReason: 'Critical structure proximity — verify anatomy before proceeding',
      teachingPoint: 'Consider intraoperative cholangiogram if anatomy unclear', qualityScore: 62,
    },
  ];

  const critVerdicts: ArbiterVerdict[] = [
    {
      verdict: 'CRITICAL', summary: 'POTENTIAL BILE DUCT INJURY RISK — immediate verification required.',
      keyFindings: ['Structure resembling CBD in dissection field', 'Aberrant anatomy suspected'],
      anatomyConfirmed: 'CBD NOT definitively identified', currentPhase: "Dissection of Calot's Triangle",
      escalationLevel: 'CRITICAL', escalationReason: 'Possible CBD misidentification — STOP and reassess',
      teachingPoint: 'When in doubt, convert to open. The safest surgeon knows when to stop.',
      qualityScore: 25,
    },
  ];

  if (hasCritical) return critVerdicts[0];
  if (hasDanger) return warnVerdicts[0];
  return Math.random() > 0.15 ? safeVerdicts[0] : warnVerdicts[0];
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
    totalFrames: number,
    videoUrl?: string,
  ) => {
    abortRef.current = false;
    const sessionId = crypto.randomUUID();
    sessionIdRef.current = sessionId;

    // Detect YouTube source
    const isYoutube = videoUrl ? isYouTubeUrl(videoUrl) : false;

    setState(prev => ({
      ...prev,
      isAnalyzing: true,
      framesProcessed: 0,
      totalFrames,
      currentFrame: 0,
      analyses: [],
      error: null,
    }));

    // If YouTube, pre-fetch frames from the inference server
    let youtubeFrames: string[] | null = null;
    if (isYoutube && videoUrl) {
      try {
        youtubeFrames = await fetchYoutubeFrames(videoUrl, totalFrames);
      } catch (err) {
        console.warn('YouTube frame fetch failed (falling back to mock analysis):', err);
      }
    }

    for (let frameNum = 1; frameNum <= totalFrames; frameNum++) {
      if (abortRef.current) break;

      // Get the base64 frame for this iteration (if available)
      const frameForAnalysis = youtubeFrames?.[frameNum - 1] ?? null;

      let zones: ZoneAnalysis[];
      let arbiter: ArbiterVerdict;

      try {
        // Call the inference server (use mock endpoint for development, no GPU needed)
        const response = await fetch(`${API.inferenceUrl}/api/analyze-frame-mock`, {
          method: 'POST',
          headers: apiHeaders(),
          body: JSON.stringify({
            frame: frameForAnalysis ?? 'placeholder',
            procedureId: procedure.procedureId,
            procedureName: procedure.name,
            frameIndex: frameNum - 1, // server expects zero-based
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
        // Fall back to local mock data if the inference server is unreachable
        console.warn('Inference server call failed (falling back to mock):', err);
        zones = [
          mockZoneAnalysis('zone-anatomy', 'Anatomy Agent', 'anatomy'),
          mockZoneAnalysis('zone-safety', 'Safety Agent', 'safety'),
          mockZoneAnalysis('zone-phase', 'Phase Agent', 'phase'),
          mockZoneAnalysis('zone-education', 'Education Agent', 'education'),
        ];
        arbiter = mockArbiterVerdict(zones);
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
        imageUrl: frameForAnalysis
          ? `data:image/jpeg;base64,${frameForAnalysis}`
          : null,
      };

      setState(prev => ({
        ...prev,
        framesProcessed: frameNum,
        currentFrame: frameNum,
        analyses: [...prev.analyses, analysis],
      }));

      // If we're using mock data (no real frames), simulate a small delay
      if (!youtubeFrames) {
        await new Promise(r => setTimeout(r, 300 + Math.random() * 200));
      }
    } // end for loop

    if (!abortRef.current) {
      setState(prev => ({ ...prev, isAnalyzing: false }));
    } else {
      setState(prev => ({ ...prev, isAnalyzing: false }));
    }
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