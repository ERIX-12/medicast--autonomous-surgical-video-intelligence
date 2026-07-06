import { useState, useEffect, useRef } from 'react';

export interface TelemetrySnapshot {
  timestamp: number;
  gpuUtilization: number;
  gpuMemoryUsed: number;
  gpuMemoryTotal: number;
  gpuTemperature: number;
  inferenceLatencyMs: number;
  framesPerSecond: number;
  powerDrawWatts: number;
}

function randomWalk(current: number, min: number, max: number, step: number): number {
  const delta = (Math.random() - 0.5) * step * 2;
  return Math.min(max, Math.max(min, current + delta));
}

export function useTelemetry(isActive: boolean) {
  const [current, setCurrent] = useState<TelemetrySnapshot>({
    timestamp: Date.now(),
    gpuUtilization: 0,
    gpuMemoryUsed: 0,
    gpuMemoryTotal: 81920,
    gpuTemperature: 35,
    inferenceLatencyMs: 0,
    framesPerSecond: 0,
    powerDrawWatts: 0,
  });

  const [history, setHistory] = useState<TelemetrySnapshot[]>([]);
  const snapRef = useRef<TelemetrySnapshot>(current);

  useEffect(() => {
    if (!isActive) {
      setCurrent(prev => ({
        ...prev,
        timestamp: Date.now(),
        gpuUtilization: 0,
        gpuMemoryUsed: 0,
        inferenceLatencyMs: 0,
        framesPerSecond: 0,
        powerDrawWatts: 0,
      }));
      setHistory([]);
      snapRef.current = { ...snapRef.current, gpuUtilization: 0, gpuMemoryUsed: 0, inferenceLatencyMs: 0, framesPerSecond: 0, powerDrawWatts: 0 };
      return;
    }

    // Bootstrap GPU to active state
    const rampUp = setTimeout(() => {
      snapRef.current = {
        ...snapRef.current,
        gpuUtilization: 45,
        gpuMemoryUsed: 12000,
        gpuTemperature: 55,
        inferenceLatencyMs: 180,
        framesPerSecond: 4.5,
        powerDrawWatts: 210,
      };
    }, 500);

    const interval = setInterval(() => {
      snapRef.current = {
        timestamp: Date.now(),
        gpuUtilization: randomWalk(snapRef.current.gpuUtilization, 30, 98, 8),
        gpuMemoryUsed: randomWalk(snapRef.current.gpuMemoryUsed, 8000, 75000, 2000),
        gpuMemoryTotal: 81920,
        gpuTemperature: randomWalk(snapRef.current.gpuTemperature, 45, 88, 3),
        inferenceLatencyMs: randomWalk(snapRef.current.inferenceLatencyMs, 60, 450, 40),
        framesPerSecond: randomWalk(snapRef.current.framesPerSecond, 1.5, 8, 0.8),
        powerDrawWatts: randomWalk(snapRef.current.powerDrawWatts, 150, 320, 15),
      };
      setCurrent({ ...snapRef.current });
      setHistory(prev => {
        const next = [...prev, { ...snapRef.current }];
        return next.length > 60 ? next.slice(-60) : next;
      });
    }, 1000);

    return () => {
      clearTimeout(rampUp);
      clearInterval(interval);
    };
  }, [isActive]);

  return { current, history };
}