import { useEffect, useRef } from 'react';
import { TrendingUp } from 'lucide-react';
import type { TelemetrySnapshot } from '../hooks/useTelemetry';

interface Props {
  history: TelemetrySnapshot[];
  isActive: boolean;
}

/** Resolve devicePixelRatio-aware canvas size */
function setupCanvas(canvas: HTMLCanvasElement, width: number, height: number) {
  const dpr = window.devicePixelRatio || 1;
  canvas.width = width * dpr;
  canvas.height = height * dpr;
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;
  const ctx = canvas.getContext('2d')!;
  ctx.scale(dpr, dpr);
  return ctx;
}

export default function TimelineChart({ history, isActive }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const w = canvas.clientWidth || 500;
    const h = canvas.clientHeight || 160;
    const ctx = setupCanvas(canvas, w, h);

    const pad = { top: 20, right: 16, bottom: 22, left: 38 };
    const plotW = w - pad.left - pad.right;
    const plotH = h - pad.top - pad.bottom;

    // Background
    ctx.fillStyle = '#050810';
    ctx.fillRect(0, 0, w, h);

    // Grid lines
    ctx.strokeStyle = '#1e2840';
    ctx.lineWidth = 0.5;
    for (let i = 0; i <= 4; i++) {
      const y = pad.top + (plotH * i) / 4;
      ctx.beginPath();
      ctx.moveTo(pad.left, y);
      ctx.lineTo(w - pad.right, y);
      ctx.stroke();
    }

    // Y-axis labels
    ctx.fillStyle = '#64748b';
    ctx.font = '8px "JetBrains Mono", monospace';
    ctx.textAlign = 'right';
    for (let i = 0; i <= 4; i++) {
      const y = pad.top + (plotH * i) / 4;
      ctx.fillText(`${100 - i * 25}`, pad.left - 6, y + 3);
    }

    // X-axis label
    ctx.fillStyle = '#64748b';
    ctx.textAlign = 'center';
    ctx.font = '7px "JetBrains Mono", monospace';
    ctx.fillText('— 60s window —', w / 2, h - 4);

    if (history.length < 2) {
      // Empty state hint
      ctx.fillStyle = '#8892a6';
      ctx.textAlign = 'center';
      ctx.font = '9px "JetBrains Mono", monospace';
      ctx.fillText(isActive ? 'Collecting data...' : 'No data', w / 2, h / 2);
      return;
    }

    // ── Draw lines with gradient fills ──────────────────────────────────

    const datasets = [
      { data: history.map(s => s.gpuUtilization), color: '#06b6d4', label: 'GPU %', max: 100 },
      { data: history.map(s => s.gpuTemperature), color: '#f59e0b', label: '°C', max: 100 },
      { data: history.map(s => s.inferenceLatencyMs), color: '#ef4444', label: 'ms', max: 500 },
    ];

    datasets.forEach(({ data, color, max }) => {
      if (data.length < 2) return;

      // Gradient fill under the line
      const gradient = ctx.createLinearGradient(0, pad.top, 0, pad.top + plotH);
      gradient.addColorStop(0, color + '40');
      gradient.addColorStop(1, color + '05');

      ctx.beginPath();
      data.forEach((val, i) => {
        const x = pad.left + (i / (data.length - 1)) * plotW;
        const y = pad.top + plotH - (Math.min(max, val) / max) * plotH;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });

      // Fill to bottom
      const lastX = pad.left + plotW;
      ctx.lineTo(lastX, pad.top + plotH);
      ctx.lineTo(pad.left, pad.top + plotH);
      ctx.closePath();
      ctx.fillStyle = gradient;
      ctx.fill();

      // Stroke the line
      ctx.beginPath();
      data.forEach((val, i) => {
        const x = pad.left + (i / (data.length - 1)) * plotW;
        const y = pad.top + plotH - (Math.min(max, val) / max) * plotH;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.5;
      ctx.stroke();
    });

    // Legend
    const legend = [
      { label: 'GPU %', color: '#06b6d4' },
      { label: 'TEMP °C', color: '#f59e0b' },
      { label: 'LAT ms', color: '#ef4444' },
    ];
    ctx.font = '8px "JetBrains Mono", monospace';
    ctx.textAlign = 'left';
    legend.forEach((item, i) => {
      const x = pad.left + 80 + i * 80;
      ctx.fillStyle = item.color;
      ctx.fillRect(x, 4, 8, 8);
      ctx.fillStyle = '#8892a6';
      ctx.fillText(item.label, x + 12, 11);
    });
  }, [history, isActive]);

  return (
    <div className="bg-surface border border-border">
      <div className="px-4 py-3 border-b border-border flex items-center gap-2">
        <TrendingUp className="w-4 h-4 text-accent" />
        <h3 className="text-xs font-semibold text-foreground-muted uppercase tracking-wider">
          Performance Timeline
        </h3>
        {isActive && (
          <span className="ml-auto flex items-center gap-1 text-[10px] font-mono text-accent">
            <span className="w-1 h-1 bg-accent animate-pulse-dot" />
            {history.length}s
          </span>
        )}
      </div>
      <div className="p-1">
        <canvas
          ref={canvasRef}
          className="w-full h-auto"
          style={{ aspectRatio: '500 / 160', maxHeight: '160px' }}
        />
      </div>
    </div>
  );
}