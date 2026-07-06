import { Cpu, Thermometer, Zap, Clock, HardDrive, Activity, Gauge } from 'lucide-react';
import type { TelemetrySnapshot } from '../hooks/useTelemetry';

interface Props {
  current: TelemetrySnapshot;
  isActive: boolean;
}

function GaugeBar({ value, max, color, label, unit }: {
  value: number; max: number; color: string; label: string; unit?: string;
}) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));
  const colorMap: Record<string, string> = {
    'accent': 'bg-accent',
    'warning': 'bg-warning',
    'critical': 'bg-critical',
    'success': 'bg-success',
  };
  const barColor = colorMap[color] || 'bg-accent';

  return (
    <div className="space-y-1.5">
      <div className="flex justify-between items-center">
        <span className="text-[10px] font-mono text-foreground-muted uppercase tracking-wider">{label}</span>
        <span className={`text-[11px] font-mono font-semibold tracking-tight text-${color}`}>
          {value.toFixed(1)}{unit || ''}
        </span>
      </div>
      <div className="h-[3px] bg-background border border-border relative overflow-hidden">
        <div
          className={`h-full ${barColor} transition-all duration-500 ease-out`}
          style={{ width: `${pct}%` }}
        />
        {/* Pulse overlay when active */}
        {pct > 0 && (
          <div
            className="absolute inset-y-0 left-0 w-8 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer"
            style={{ display: 'none' }}
          />
        )}
      </div>
    </div>
  );
}

export default function TelemetryPanel({ current, isActive }: Props) {
  return (
    <div className="bg-surface border border-border">
      <div className="px-4 py-3 border-b border-border flex items-center gap-2">
        <Cpu className="w-4 h-4 text-accent" />
        <h3 className="text-xs font-semibold text-foreground-muted uppercase tracking-wider">
          GPU Telemetry
        </h3>
        {isActive && (
          <span className="ml-auto flex items-center gap-1.5 text-[10px] font-mono text-success animate-fade-in-up">
            <span className="w-1.5 h-1.5 bg-success animate-pulse-dot" />
            LIVE
          </span>
        )}
      </div>

      <div className="p-4 space-y-4">
        {/* Main GPU bar */}
        <GaugeBar
          value={current.gpuUtilization}
          max={100}
          color={current.gpuUtilization > 85 ? 'critical' : current.gpuUtilization > 60 ? 'warning' : 'accent'}
          label="GPU Utilization"
          unit="%"
        />

        {/* Dual gauges */}
        <div className="grid grid-cols-2 gap-4">
          <GaugeBar
            value={current.gpuMemoryUsed / 1024}
            max={current.gpuMemoryTotal / 1024}
            color={current.gpuMemoryUsed / current.gpuMemoryTotal > 0.85 ? 'critical' : 'accent'}
            label="VRAM"
            unit=" GB"
          />
          <GaugeBar
            value={current.gpuTemperature}
            max={100}
            color={current.gpuTemperature > 80 ? 'critical' : current.gpuTemperature > 65 ? 'warning' : 'accent'}
            label="Temperature"
            unit="°C"
          />
        </div>

        {/* Metrics grid */}
        <div className="grid grid-cols-3 gap-3 pt-3 border-t border-border">
          <div className="text-center relative">
            <div className="flex items-center justify-center gap-1 text-foreground-muted mb-0.5">
              <Zap className="w-3 h-3" />
            </div>
            <div className={`text-sm font-mono font-bold ${current.powerDrawWatts > 280 ? 'text-warning' : 'text-foreground'}`}>
              {current.powerDrawWatts.toFixed(0)}
            </div>
            <div className="text-[9px] text-foreground-muted font-mono uppercase tracking-wider">Watts</div>
          </div>
          <div className="text-center relative">
            <div className="flex items-center justify-center gap-1 text-foreground-muted mb-0.5">
              <Clock className="w-3 h-3" />
            </div>
            <div className={`text-sm font-mono font-bold ${current.inferenceLatencyMs > 300 ? 'text-warning' : 'text-foreground'}`}>
              {current.inferenceLatencyMs.toFixed(0)}
            </div>
            <div className="text-[9px] text-foreground-muted font-mono uppercase tracking-wider">ms</div>
          </div>
          <div className="text-center relative">
            <div className="flex items-center justify-center gap-1 text-foreground-muted mb-0.5">
              <Activity className="w-3 h-3" />
            </div>
            <div className={`text-sm font-mono font-bold ${current.framesPerSecond < 2 ? 'text-warning' : 'text-foreground'}`}>
              {current.framesPerSecond.toFixed(1)}
            </div>
            <div className="text-[9px] text-foreground-muted font-mono uppercase tracking-wider">FPS</div>
          </div>
        </div>

        {/* Hardware footer */}
        {isActive && (
          <div className="pt-1 text-[9px] font-mono text-foreground-muted/60 tracking-wider text-center border-t border-border">
            AMD INSTINCT MI300X · 192 GB HBM3
          </div>
        )}
      </div>
    </div>
  );
}