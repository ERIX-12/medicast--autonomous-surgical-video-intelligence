import { useEffect, useRef } from 'react';
import { Eye, Shield, Brain, GraduationCap, Gavel } from 'lucide-react';
import type { ZoneAnalysis, ArbiterVerdict as ArbiterVerdictType } from '../hooks/useAnalysisEngine';

export interface AgentMessage {
  id: string;
  timestamp: number;
  type: 'zone' | 'arbiter';
  data: ZoneAnalysis | ArbiterVerdictType;
}

interface Props {
  messages: AgentMessage[];
}

const agentConfig: Record<string, { icon: typeof Eye; color: string; border: string }> = {
  anatomy: { icon: Eye, color: 'text-accent', border: 'border-l-accent' },
  safety: { icon: Shield, color: 'text-success', border: 'border-l-success' },
  phase: { icon: Brain, color: 'text-warning', border: 'border-l-warning' },
  education: { icon: GraduationCap, color: 'text-foreground', border: 'border-l-foreground-muted' },
};

function severityColor(severity: string): string {
  switch (severity) {
    case 'safe': return 'text-success';
    case 'caution': return 'text-warning';
    case 'danger': return 'text-warning';
    case 'critical': return 'text-critical';
    default: return 'text-foreground-muted';
  }
}

function severityBadge(severity: string): string {
  switch (severity) {
    case 'safe': return 'bg-success/10 text-success border-success/20';
    case 'caution': case 'danger': return 'bg-warning/10 text-warning border-warning/20';
    case 'critical': return 'bg-critical/10 text-critical border-critical/20';
    default: return 'bg-foreground-muted/10 text-foreground-muted border-foreground-muted/20';
  }
}

function verdictColor(verdict: string): string {
  switch (verdict) {
    case 'SAFE': return 'text-success';
    case 'WARNING': return 'text-warning';
    case 'CRITICAL': return 'text-critical';
    default: return 'text-foreground-muted';
  }
}

export default function AgentFeed({ messages }: Props) {
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll removed as requested by user
  // useEffect(() => {
  //   bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  // }, [messages.length]);

  if (messages.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="w-12 h-12 mx-auto mb-2 bg-accent/5 border border-accent/20 flex items-center justify-center">
            <Brain className="w-6 h-6 text-accent/40" />
          </div>
          <p className="text-xs text-foreground-muted font-mono">Agent feed inactive</p>
          <p className="text-[10px] text-foreground-muted/60 mt-1">Messages appear during analysis</p>
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-y-auto p-3 space-y-1 h-full scroll-smooth">
      {messages.map(msg => {
        if (msg.type === 'zone') {
          const z = msg.data as ZoneAnalysis;
          const cfg = agentConfig[z.agentType] || agentConfig.anatomy;
          const Icon = cfg.icon;

          return (
            <div
              key={msg.id}
              className={`flex items-start gap-2.5 text-[11px] font-mono leading-relaxed py-1.5
                border-l-2 ${cfg.border} pl-2.5 hover:bg-surface-hover/30 transition-colors duration-150`}
            >
              <Icon className={`w-3 h-3 mt-0.5 shrink-0 ${cfg.color}`} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-foreground-muted text-[10px]">
                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </span>
                  <span className={`${cfg.color} text-[10px] font-semibold`}>{z.zoneName}</span>
                  <span className={`text-[9px] px-1 py-px border ${severityBadge(z.severity)}`}>
                    {z.severity.toUpperCase()}
                  </span>
                </div>
                <p className="text-foreground-muted mt-0.5 leading-relaxed">{z.findings[0]}</p>
              </div>
            </div>
          );
        }
        const a = msg.data as ArbiterVerdictType;
        return (
          <div
            key={msg.id}
            className="flex items-start gap-2.5 text-[11px] font-mono leading-relaxed py-1.5
              border-l-2 border-accent pl-2.5 bg-accent/[0.03] hover:bg-accent/5 transition-colors duration-150"
          >
            <Gavel className="w-3 h-3 mt-0.5 shrink-0 text-accent" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-foreground-muted text-[10px]">
                  {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </span>
                <span className="text-accent text-[10px] font-bold">ARBITER</span>
                <span className={`text-[9px] px-1 py-px border font-semibold ${severityBadge(a.verdict === 'CRITICAL' ? 'critical' : a.verdict === 'WARNING' ? 'caution' : 'safe')}`}>
                  {a.verdict}
                </span>
                <span className="text-accent text-[10px] ml-auto">{a.qualityScore}</span>
              </div>
              <p className="text-foreground mt-0.5 leading-relaxed">{a.summary}</p>
            </div>
          </div>
        );
      })}
      <div ref={bottomRef} />
    </div>
  );
}

export type { AgentMessage };