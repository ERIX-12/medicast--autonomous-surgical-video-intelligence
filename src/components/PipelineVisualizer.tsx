import { Brain, Shield, Crosshair, GraduationCap, Scale, Video, ArrowRight, ArrowDown, Activity, Loader2 } from 'lucide-react';
import type { FrameAnalysis } from '../hooks/useAnalysisEngine';

interface Props {
  isAnalyzing: boolean;
  latestAnalysis?: FrameAnalysis;
}

export default function PipelineVisualizer({ isAnalyzing, latestAnalysis }: Props) {
  return (
    <div className="bg-surface border border-border flex flex-col">
      <div className="px-4 py-3 border-b border-border flex items-center gap-2">
        <Brain className="w-4 h-4 text-accent" />
        <h3 className="text-xs font-semibold text-foreground-muted uppercase tracking-wider">
          Live AI Pipeline
        </h3>
        {isAnalyzing && (
          <span className="ml-auto w-2 h-2 bg-accent rounded-full animate-pulse-dot" />
        )}
      </div>

      <div className="p-5 flex flex-col items-center">
        {/* Step 1: Video Capture */}
        <div className={`w-full max-w-[240px] p-3 border text-center transition-all duration-300 ${isAnalyzing ? 'border-accent bg-accent/10 shadow-glow-cyan' : 'border-border bg-surface-hover'}`}>
          <div className="flex items-center justify-center gap-2 mb-1">
            <Video className={`w-4 h-4 ${isAnalyzing ? 'text-accent animate-pulse' : 'text-foreground-muted'}`} />
            <span className="text-xs font-bold text-foreground">FRAME EXTRACTION</span>
          </div>
          <p className="text-[9px] text-foreground-muted font-mono">
            {isAnalyzing ? "Capturing live pixel data..." : "Awaiting stream..."}
          </p>
        </div>

        <div className="h-6 flex items-center justify-center">
          <ArrowDown className={`w-4 h-4 ${isAnalyzing ? 'text-accent animate-bounce' : 'text-border'}`} />
        </div>

        {/* Step 2: Parallel Agents */}
        <div className="w-full relative border border-border bg-surface-elevated p-4">
          <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-surface px-2 text-[10px] font-mono text-foreground-muted border border-border tracking-wider">
            PARALLEL FIREWORKS AI AGENTS
          </div>
          
          <div className="grid grid-cols-2 gap-3 mt-2">
            {/* Anatomy Agent */}
            <div className={`p-2 border transition-all duration-500 relative overflow-hidden ${
              isAnalyzing 
                ? 'border-accent/50 bg-accent/5 shadow-[0_0_12px_rgba(20,184,166,0.12)]' 
                : 'border-border/50'
            }`}>
              {isAnalyzing && (
                <div className="absolute inset-0 pointer-events-none">
                  <div className="w-full h-[2px] bg-accent/25 absolute left-0 animate-scan" />
                </div>
              )}
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-1.5">
                  <Crosshair className={`w-3 h-3 ${isAnalyzing ? 'text-accent' : 'text-foreground-muted'}`} />
                  <span className="text-[10px] font-bold text-foreground">Anatomy</span>
                </div>
                {isAnalyzing && (
                  <div className="flex items-center gap-0.5">
                    <Loader2 className="w-2.5 h-2.5 text-accent animate-spin" />
                    <span className="text-[6px] font-mono text-accent animate-pulse-dot uppercase tracking-wider">LOOP</span>
                  </div>
                )}
              </div>
              <p className="text-[8px] text-foreground-muted leading-tight">Identifies structures & variants</p>
            </div>

            {/* Safety Agent */}
            <div className={`p-2 border transition-all duration-500 delay-75 relative overflow-hidden ${
              isAnalyzing 
                ? 'border-warning/50 bg-warning/5 shadow-[0_0_12px_rgba(245,158,11,0.12)]' 
                : 'border-border/50'
            }`}>
              {isAnalyzing && (
                <div className="absolute inset-0 pointer-events-none">
                  <div className="w-full h-[2px] bg-warning/25 absolute left-0 animate-scan" />
                </div>
              )}
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-1.5">
                  <Shield className={`w-3 h-3 ${isAnalyzing ? 'text-warning' : 'text-foreground-muted'}`} />
                  <span className="text-[10px] font-bold text-foreground">Safety</span>
                </div>
                {isAnalyzing && (
                  <div className="flex items-center gap-0.5">
                    <Loader2 className="w-2.5 h-2.5 text-warning animate-spin" />
                    <span className="text-[6px] font-mono text-warning animate-pulse-dot uppercase tracking-wider">LOOP</span>
                  </div>
                )}
              </div>
              <p className="text-[8px] text-foreground-muted leading-tight">Monitors risk & dissection planes</p>
            </div>

            {/* Phase Agent */}
            <div className={`p-2 border transition-all duration-500 delay-150 relative overflow-hidden ${
              isAnalyzing 
                ? 'border-success/50 bg-success/5 shadow-[0_0_12px_rgba(34,197,94,0.12)]' 
                : 'border-border/50'
            }`}>
              {isAnalyzing && (
                <div className="absolute inset-0 pointer-events-none">
                  <div className="w-full h-[2px] bg-success/25 absolute left-0 animate-scan" />
                </div>
              )}
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-1.5">
                  <Activity className={`w-3 h-3 ${isAnalyzing ? 'text-success' : 'text-foreground-muted'}`} />
                  <span className="text-[10px] font-bold text-foreground">Phase</span>
                </div>
                {isAnalyzing && (
                  <div className="flex items-center gap-0.5">
                    <Loader2 className="w-2.5 h-2.5 text-success animate-spin" />
                    <span className="text-[6px] font-mono text-success animate-pulse-dot uppercase tracking-wider">LOOP</span>
                  </div>
                )}
              </div>
              <p className="text-[8px] text-foreground-muted leading-tight">Tracks surgical progression</p>
            </div>

            {/* Education Agent */}
            <div className={`p-2 border transition-all duration-500 delay-200 relative overflow-hidden ${
              isAnalyzing 
                ? 'border-accent/50 bg-accent/5 shadow-[0_0_12px_rgba(20,184,166,0.12)]' 
                : 'border-border/50'
            }`}>
              {isAnalyzing && (
                <div className="absolute inset-0 pointer-events-none">
                  <div className="w-full h-[2px] bg-accent/25 absolute left-0 animate-scan" />
                </div>
              )}
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-1.5">
                  <GraduationCap className={`w-3 h-3 ${isAnalyzing ? 'text-accent' : 'text-foreground-muted'}`} />
                  <span className="text-[10px] font-bold text-foreground">Education</span>
                </div>
                {isAnalyzing && (
                  <div className="flex items-center gap-0.5">
                    <Loader2 className="w-2.5 h-2.5 text-accent animate-spin" />
                    <span className="text-[6px] font-mono text-accent animate-pulse-dot uppercase tracking-wider">LOOP</span>
                  </div>
                )}
              </div>
              <p className="text-[8px] text-foreground-muted leading-tight">Evaluates technique & handling</p>
            </div>
          </div>
        </div>

        <div className="h-6 flex items-center justify-center">
          <ArrowDown className={`w-4 h-4 ${latestAnalysis ? 'text-accent animate-bounce' : 'text-border'}`} />
        </div>

        {/* Step 3: Arbiter Synthesis */}
        <div className={`w-full max-w-[240px] p-3 border text-center transition-all duration-500 ${latestAnalysis && isAnalyzing ? 'border-accent bg-accent/10 shadow-glow-cyan' : 'border-border bg-surface-hover'}`}>
          <div className="flex items-center justify-center gap-2 mb-1">
            <Scale className={`w-4 h-4 ${latestAnalysis && isAnalyzing ? 'text-accent' : 'text-foreground-muted'}`} />
            <span className="text-xs font-bold text-foreground">ARBITER SYNTHESIS</span>
          </div>
          <p className="text-[9px] text-foreground-muted font-mono leading-tight">
            {latestAnalysis && isAnalyzing 
              ? "Resolving conflicts & issuing verdict..." 
              : "Awaiting agent outputs..."}
          </p>
          {latestAnalysis && (
            <div className="mt-2 pt-2 border-t border-accent/20">
              <span className={`text-[10px] font-mono font-bold ${
                latestAnalysis.arbiter.escalationLevel === 'CRITICAL' ? 'text-critical' :
                latestAnalysis.arbiter.escalationLevel === 'WARNING' ? 'text-warning' : 'text-success'
              }`}>
                VERDICT: {latestAnalysis.arbiter.verdict}
              </span>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
