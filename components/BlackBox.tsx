import { useState, useCallback } from 'react';
import { Lock, Shield, FileText, Download, CheckCircle, Fingerprint } from 'lucide-react';
import type { FrameAnalysis } from '../hooks/useAnalysisEngine';
import type { ProcedureKnowledge } from '../data/types';

interface Props {
  analyses: FrameAnalysis[];
  procedure: ProcedureKnowledge | null;
  sessionId: string | null;
}

async function computeSha256(input: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(input);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('').toUpperCase();
}

export default function BlackBox({ analyses, procedure, sessionId }: Props) {
  const [isSealed, setIsSealed] = useState(false);
  const [sealHash, setSealHash] = useState<string | null>(null);
  const [isSealing, setIsSealing] = useState(false);

  if (analyses.length === 0) return null;

  const totalFrames = analyses.length;
  const safeCount = analyses.filter(a => a.arbiter.verdict === 'SAFE').length;
  const warningCount = analyses.filter(a => a.arbiter.verdict === 'WARNING').length;
  const criticalCount = analyses.filter(a => a.arbiter.verdict === 'CRITICAL').length;
  const avgScore = analyses.reduce((sum, a) => sum + a.arbiter.qualityScore, 0) / totalFrames;

  const handleSeal = useCallback(async () => {
    setIsSealing(true);
    // Small delay so the UI shows the loading state
    await new Promise(r => setTimeout(r, 600));

    const payload = JSON.stringify({
      sessionId,
      procedureId: procedure?.procedureId,
      procedureName: procedure?.name,
      frameCount: totalFrames,
      safeCount,
      warningCount,
      criticalCount,
      avgScore: Math.round(avgScore),
      timestamp: new Date().toISOString(),
    });

    const hash = await computeSha256(payload);
    setSealHash(hash);
    setIsSealed(true);
    setIsSealing(false);
  }, [sessionId, procedure, totalFrames, safeCount, warningCount, criticalCount, avgScore]);

  return (
    <div className="bg-surface border border-border">
      <div className="px-4 py-3 border-b border-border flex items-center gap-2">
        <Lock className="w-4 h-4 text-accent" />
        <h3 className="text-xs font-semibold text-foreground-muted uppercase tracking-wider">
          Surgical Black Box
        </h3>
        {isSealed && (
          <span className="ml-auto flex items-center gap-1.5 text-[10px] font-mono text-success animate-fade-in-up">
            <CheckCircle className="w-3 h-3" />
            SEALED
          </span>
        )}
      </div>

      <div className="p-4 space-y-4">
        {/* Summary grid */}
        <div className="grid grid-cols-3 gap-3">
          <div className="text-center p-3 bg-background/50 border border-border">
            <div className="text-lg font-mono font-bold text-success">{safeCount}</div>
            <div className="text-[10px] text-foreground-muted uppercase tracking-wider">Safe</div>
          </div>
          <div className="text-center p-3 bg-background/50 border border-border">
            <div className="text-lg font-mono font-bold text-warning">{warningCount}</div>
            <div className="text-[10px] text-foreground-muted uppercase tracking-wider">Warnings</div>
          </div>
          <div className="text-center p-3 bg-background/50 border border-border">
            <div className="text-lg font-mono font-bold text-critical">{criticalCount}</div>
            <div className="text-[10px] text-foreground-muted uppercase tracking-wider">Critical</div>
          </div>
        </div>

        <div className="text-center p-4 bg-background/50 border border-border relative overflow-hidden">
          <div className="absolute inset-0 bg-accent/5" />
          <div className="relative">
            <div className="text-3xl font-mono font-bold text-accent">{Math.round(avgScore)}</div>
            <div className="text-[10px] text-foreground-muted uppercase tracking-wider mt-1">
              Average Quality Score
            </div>
          </div>
        </div>

        {/* Session metadata */}
        <div className="grid grid-cols-2 gap-2 text-[10px] font-mono text-foreground-muted">
          <div className="bg-background/30 border border-border p-2">
            <span className="text-foreground-muted/60">Session</span>
            <div className="text-foreground mt-0.5 truncate">{sessionId?.slice(0, 12) || '—'}</div>
          </div>
          <div className="bg-background/30 border border-border p-2">
            <span className="text-foreground-muted/60">Procedure</span>
            <div className="text-foreground mt-0.5 truncate">{procedure?.name || '—'}</div>
          </div>
        </div>

        {/* Hash display */}
        {sealHash && (
          <div className="p-3 bg-background/50 border border-accent/20 animate-fade-in-up">
            <div className="flex items-center gap-1.5 text-[10px] font-mono text-foreground-muted mb-1.5">
              <Fingerprint className="w-3 h-3 text-accent" />
              <span className="text-accent font-semibold tracking-wider">SHA-256 INTEGRITY SEAL</span>
            </div>
            <div className="text-[11px] font-mono text-accent break-all leading-relaxed bg-background/50 p-2 border border-accent/10">
              {sealHash}
            </div>
          </div>
        )}

        {/* Seal / Download buttons */}
        {!isSealed ? (
          <button
            onClick={handleSeal}
            disabled={isSealing}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-accent/10 border border-accent/40
                       text-accent text-xs font-semibold tracking-wider uppercase
                       hover:bg-accent/20 hover:border-accent/60
                       transition-all duration-200 cursor-pointer disabled:opacity-50"
          >
            {isSealing ? (
              <>
                <div className="w-4 h-4 border-2 border-accent border-t-transparent animate-spin" />
                Sealing...
              </>
            ) : (
              <>
                <Shield className="w-4 h-4" />
                Seal Session Record
              </>
            )}
          </button>
        ) : (
          <button
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-surface border border-border
                       text-foreground-muted text-xs font-semibold tracking-wider uppercase
                       hover:border-accent/40 hover:text-accent hover:bg-accent/[0.03]
                       transition-all duration-200 cursor-pointer"
          >
            <Download className="w-4 h-4" />
            Download Sealed Record
          </button>
        )}
      </div>
    </div>
  );
}