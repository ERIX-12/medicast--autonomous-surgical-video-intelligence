import { Gavel, AlertTriangle, CheckCircle, XCircle, Lightbulb } from 'lucide-react';
import type { ArbiterVerdict as ArbiterVerdictType } from '../hooks/useAnalysisEngine';

interface Props {
  verdict: ArbiterVerdictType | null;
  isAnalyzing: boolean;
}

const verdictConfig = {
  SAFE: { icon: CheckCircle, bg: 'bg-success/10', border: 'border-success/30', text: 'text-success', glow: 'shadow-glow-cyan' },
  WARNING: { icon: AlertTriangle, bg: 'bg-warning/10', border: 'border-warning/30', text: 'text-warning', glow: 'shadow-glow-amber' },
  CRITICAL: { icon: XCircle, bg: 'bg-critical/10', border: 'border-critical/30', text: 'text-critical', glow: 'shadow-glow-red' },
};

export default function ArbiterVerdict({ verdict, isAnalyzing }: Props) {
  if (!verdict && !isAnalyzing) {
    return (
      <div className="bg-surface border border-border p-6 text-center">
        <Gavel className="w-8 h-8 text-foreground-muted mx-auto mb-2" />
        <p className="text-sm text-foreground-muted font-mono">Awaiting analysis...</p>
      </div>
    );
  }

  if (isAnalyzing && !verdict) {
    return (
      <div className="bg-surface border border-border p-6 text-center">
        <div className="w-8 h-8 border-2 border-accent border-t-transparent animate-spin mx-auto mb-2" />
        <p className="text-sm text-foreground-muted font-mono">Processing frames...</p>
      </div>
    );
  }

  if (!verdict) return null;

  const cfg = verdictConfig[verdict.verdict] || verdictConfig.SAFE;
  const Icon = cfg.icon;

  return (
    <div className={`bg-surface border ${cfg.border} ${cfg.glow} transition-all duration-300`}>
      {/* Header */}
      <div className={`flex items-center gap-3 px-5 py-4 ${cfg.bg} border-b ${cfg.border}`}>
        <Icon className={`w-6 h-6 ${cfg.text}`} />
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className={`text-sm font-bold font-heading tracking-wide ${cfg.text}`}>
              THE ARBITER — {verdict.verdict}
            </span>
          </div>
          <p className="text-xs text-foreground mt-0.5">{verdict.summary}</p>
        </div>
        <div className={`text-right ${cfg.text}`}>
          <div className="text-2xl font-mono font-bold">{verdict.qualityScore}</div>
          <div className="text-[10px] uppercase tracking-wider">Score</div>
        </div>
      </div>

      {/* Details */}
      <div className="p-5 space-y-4">
        {/* Key Findings */}
        <div>
          <h4 className="text-xs font-semibold text-foreground-muted uppercase tracking-wider mb-2">
            Key Findings
          </h4>
          <div className="space-y-1.5">
            {verdict.keyFindings.map((f, i) => (
              <div key={i} className="flex items-start gap-2">
                <span className="mt-0.5 w-1.5 h-1.5 shrink-0 bg-accent" />
                <span className="text-sm text-foreground">{f}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-background/50 border border-border p-3">
            <span className="text-[10px] font-mono text-foreground-muted uppercase tracking-wider">Phase</span>
            <p className="text-sm text-foreground mt-1">{verdict.currentPhase || '—'}</p>
          </div>
          <div className="bg-background/50 border border-border p-3">
            <span className="text-[10px] font-mono text-foreground-muted uppercase tracking-wider">Anatomy Confirmed</span>
            <p className="text-sm text-foreground mt-1">{verdict.anatomyConfirmed || '—'}</p>
          </div>
        </div>

        {/* Escalation */}
        {verdict.escalationLevel !== 'NONE' && (
          <div className={`border ${verdict.escalationLevel === 'CRITICAL' ? 'border-critical/40 bg-critical/10' : 'border-warning/40 bg-warning/10'} p-3`}>
            <div className="flex items-center gap-2">
              <AlertTriangle className={`w-4 h-4 ${verdict.escalationLevel === 'CRITICAL' ? 'text-critical' : 'text-warning'}`} />
              <span className={`text-xs font-bold tracking-wider ${verdict.escalationLevel === 'CRITICAL' ? 'text-critical' : 'text-warning'}`}>
                ESCALATION: {verdict.escalationLevel}
              </span>
            </div>
            <p className="text-xs text-foreground-muted mt-1">{verdict.escalationReason}</p>
          </div>
        )}

        {/* Teaching Pearl */}
        {verdict.teachingPoint && (
          <div className="flex items-start gap-2 bg-accent/5 border border-accent/20 p-3">
            <Lightbulb className="w-4 h-4 text-accent shrink-0 mt-0.5" />
            <p className="text-xs text-foreground-muted leading-relaxed">{verdict.teachingPoint}</p>
          </div>
        )}
      </div>
    </div>
  );
}