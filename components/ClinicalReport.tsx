import { FileText, Printer, Share2 } from 'lucide-react';
import type { FrameAnalysis } from '../hooks/useAnalysisEngine';
import type { ProcedureKnowledge } from '../data/types';

interface Props {
  analyses: FrameAnalysis[];
  procedure: ProcedureKnowledge | null;
  sessionId: string | null;
}

export default function ClinicalReport({ analyses, procedure, sessionId }: Props) {
  if (analyses.length === 0) return null;

  const totalFrames = analyses.length;
  const avgScore = Math.round(analyses.reduce((sum, a) => sum + a.arbiter.qualityScore, 0) / totalFrames);
  const criticalFrames = analyses.filter(a => a.arbiter.escalationLevel === 'CRITICAL');
  const warningFrames = analyses.filter(a => a.arbiter.escalationLevel === 'WARNING');

  const verdictDistribution = {
    SAFE: analyses.filter(a => a.arbiter.verdict === 'SAFE').length,
    WARNING: analyses.filter(a => a.arbiter.verdict === 'WARNING').length,
    CRITICAL: analyses.filter(a => a.arbiter.verdict === 'CRITICAL').length,
  };

  const phases = [...new Set(analyses.map(a => a.arbiter.currentPhase).filter(Boolean))];

  return (
    <div className="bg-surface border border-border">
      <div className="px-4 py-3 border-b border-border flex items-center gap-2">
        <FileText className="w-4 h-4 text-accent" />
        <h3 className="text-xs font-semibold text-foreground-muted uppercase tracking-wider">
          Clinical Report
        </h3>
        <div className="ml-auto flex items-center gap-1">
          <button className="p-1.5 text-foreground-muted hover:text-accent transition-colors cursor-pointer" title="Print">
            <Printer className="w-3.5 h-3.5" />
          </button>
          <button className="p-1.5 text-foreground-muted hover:text-accent transition-colors cursor-pointer" title="Share">
            <Share2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Header */}
        <div className="border-b border-border pb-3">
          <h4 className="text-sm font-bold text-foreground font-heading">
            {procedure?.name || 'Surgical Procedure'} — AI Analysis Report
          </h4>
          <div className="flex gap-4 mt-2 text-[10px] font-mono text-foreground-muted">
            <span>Session: {sessionId?.slice(0, 8) || '—'}</span>
            <span>Frames: {totalFrames}</span>
            <span>Score: {avgScore}/100</span>
          </div>
        </div>

        {/* Verdict Distribution */}
        <div>
          <h5 className="text-xs font-semibold text-foreground-muted uppercase tracking-wider mb-2">
            Verdict Distribution
          </h5>
          <div className="flex h-6">
            {verdictDistribution.SAFE > 0 && (
              <div
                className="bg-success/30 flex items-center justify-center text-[9px] font-mono text-success font-bold"
                style={{ width: `${(verdictDistribution.SAFE / totalFrames) * 100}%` }}
              >
                {verdictDistribution.SAFE}
              </div>
            )}
            {verdictDistribution.WARNING > 0 && (
              <div
                className="bg-warning/30 flex items-center justify-center text-[9px] font-mono text-warning font-bold"
                style={{ width: `${(verdictDistribution.WARNING / totalFrames) * 100}%` }}
              >
                {verdictDistribution.WARNING}
              </div>
            )}
            {verdictDistribution.CRITICAL > 0 && (
              <div
                className="bg-critical/30 flex items-center justify-center text-[9px] font-mono text-critical font-bold"
                style={{ width: `${(verdictDistribution.CRITICAL / totalFrames) * 100}%` }}
              >
                {verdictDistribution.CRITICAL}
              </div>
            )}
          </div>
          <div className="flex gap-4 mt-1.5 text-[10px] font-mono">
            <span className="text-success">SAFE {verdictDistribution.SAFE}</span>
            <span className="text-warning">WARN {verdictDistribution.WARNING}</span>
            <span className="text-critical">CRIT {verdictDistribution.CRITICAL}</span>
          </div>
        </div>

        {/* Phases */}
        <div>
          <h5 className="text-xs font-semibold text-foreground-muted uppercase tracking-wider mb-2">
            Phases Detected
          </h5>
          <div className="space-y-1">
            {phases.map((phase, i) => (
              <div key={i} className="flex items-center gap-2 text-xs text-foreground-muted">
                <span className="w-1.5 h-1.5 bg-accent" />
                {phase}
              </div>
            ))}
          </div>
        </div>

        {/* Escalations */}
        {(criticalFrames.length > 0 || warningFrames.length > 0) && (
          <div>
            <h5 className="text-xs font-semibold text-foreground-muted uppercase tracking-wider mb-2">
              Escalations
            </h5>
            <div className="space-y-2">
              {criticalFrames.map(f => (
                <div key={f.id} className="border border-critical/30 bg-critical/5 p-2">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono text-critical font-bold">CRITICAL</span>
                    <span className="text-[10px] font-mono text-foreground-muted">Frame {f.frameNumber}</span>
                  </div>
                  <p className="text-xs text-foreground-muted mt-0.5">{f.arbiter.escalationReason}</p>
                </div>
              ))}
              {warningFrames.slice(0, 3).map(f => (
                <div key={f.id} className="border border-warning/30 bg-warning/5 p-2">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono text-warning font-bold">WARNING</span>
                    <span className="text-[10px] font-mono text-foreground-muted">Frame {f.frameNumber}</span>
                  </div>
                  <p className="text-xs text-foreground-muted mt-0.5">{f.arbiter.escalationReason}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Teaching Pearls */}
        <div>
          <h5 className="text-xs font-semibold text-foreground-muted uppercase tracking-wider mb-2">
            Key Teaching Points
          </h5>
          <div className="space-y-1.5">
            {analyses
              .filter(a => a.arbiter.teachingPoint)
              .slice(0, 5)
              .map(a => (
                <div key={a.id} className="flex items-start gap-2 text-xs text-foreground-muted">
                  <span className="mt-0.5 text-accent">•</span>
                  {a.arbiter.teachingPoint}
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
}