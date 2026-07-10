import { Brain, Shield, Eye, GraduationCap, Loader2 } from 'lucide-react';
import type { ZoneAnalysis } from '../hooks/useAnalysisEngine';

interface Props {
  zone: ZoneAnalysis;
  index: number;
  isAnalyzing?: boolean;
}

const zoneMeta: Record<string, { label: string; icon: typeof Brain }> = {
  anatomy: { label: 'Anatomy Agent', icon: Eye },
  safety: { label: 'Safety Agent', icon: Shield },
  phase: { label: 'Phase Agent', icon: Brain },
  education: { label: 'Education Agent', icon: GraduationCap },
};

const severityStyles: Record<string, string> = {
  safe: 'border-l-success text-success',
  caution: 'border-l-warning text-warning',
  danger: 'border-l-warning text-warning',
  critical: 'border-l-critical text-critical',
};

const severityBg: Record<string, string> = {
  safe: 'bg-success/10 border-success/20',
  caution: 'bg-warning/10 border-warning/20',
  danger: 'bg-warning/10 border-warning/20',
  critical: 'bg-critical/10 border-critical/20',
};

export default function ZonePanel({ zone, index, isAnalyzing }: Props) {
  const meta = zoneMeta[zone.agentType] || zoneMeta.anatomy;
  const Icon = meta.icon;

  return (
    <div
      className={`bg-surface border border-border transition-all duration-300 relative overflow-hidden
        hover:border-border-active ${index === 0 ? 'col-span-2' : ''}`}
    >
      {isAnalyzing && (
        <div className="absolute inset-0 pointer-events-none z-10">
          <div className="w-full h-[2px] bg-accent/15 absolute left-0 animate-scan" />
        </div>
      )}

      {/* Header */}
      <div className={`flex items-center gap-2 px-4 py-3 border-b ${severityBg[zone.severity]}`}>
        <Icon className={`w-4 h-4 ${severityStyles[zone.severity].split(' ')[1]}`} />
        <span className="text-xs font-semibold text-foreground tracking-wider uppercase flex-1">
          {meta.label}
        </span>
        <div className="flex items-center gap-2">
          <span className={`text-[10px] font-mono font-semibold tracking-wider px-2 py-0.5 border ${severityBg[zone.severity]} ${severityStyles[zone.severity]}`}>
            {zone.severity.toUpperCase()}
          </span>
          {isAnalyzing && (
            <div className="flex items-center gap-1 bg-accent/10 border border-accent/20 px-1.5 py-0.5 text-accent">
              <Loader2 className="w-2.5 h-2.5 animate-spin" />
              <span className="text-[8px] font-mono font-bold animate-pulse-dot tracking-wider">LOOP</span>
            </div>
          )}
        </div>
      </div>

      {/* Findings */}
      <div className="p-4 space-y-2">
        {zone.findings.map((finding, i) => (
          <div key={i} className="flex items-start gap-2">
            <span className={`mt-1 w-1.5 h-1.5 shrink-0 ${severityStyles[zone.severity].split(' ')[1] === 'text-success' ? 'bg-success' : zone.severity === 'critical' ? 'bg-critical' : 'bg-warning'}`} />
            <span className="text-xs text-foreground-muted leading-relaxed">{finding}</span>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="px-4 py-2 border-t border-border flex items-center justify-between bg-background/50">
        <span className="text-[10px] font-mono text-foreground-muted">
          CONFIDENCE: {(zone.confidence * 100).toFixed(0)}%
        </span>
        <span className="text-[10px] font-mono text-foreground-muted">
          {zone.processingTimeMs.toFixed(0)}ms
        </span>
      </div>
    </div>
  );
}