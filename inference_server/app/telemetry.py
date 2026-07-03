"""GPU telemetry for the MediCast inference server.

Provides real-time GPU metrics by parsing `rocm-smi` output on AMD GPUs.
Returns mock metrics when no GPU is available (development mode).
"""

from __future__ import annotations

import asyncio
import os
import random
from typing import Any, Optional


async def get_gpu_metrics() -> dict[str, Any]:
    """Get current GPU telemetry snapshot.

    On AMD GPU systems, parses `rocm-smi` output.
    Falls back to mock metrics when:
    - rocm-smi is not installed
    - No AMD GPUs are detected
    - Running in a non-GPU environment

    Returns:
        Dict with keys:
        - gpuUtilization (0-100)
        - memoryUtilization (0-100)
        - temperatureC (0-150)
        - powerDrawW (>=0)
        - available (bool: true if real metrics)
        - name (str: GPU name if available)
    """
    # Try real GPU metrics first
    metrics = await _try_rocm_smi()
    if metrics is not None:
        return metrics

    # Check for NVIDIA via nvidia-smi (fallback)
    metrics = await _try_nvidia_smi()
    if metrics is not None:
        return metrics

    # Fall back to mock metrics
    return _mock_gpu_metrics()


async def _try_rocm_smi() -> Optional[dict[str, Any]]:
    """Attempt to parse GPU metrics from rocm-smi."""
    try:
        proc = await asyncio.create_subprocess_exec(
            "rocm-smi",
            "--showuse", "--showmemuse", "--showtemp", "--showpower",
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE,
            timeout=5,
        )

        stdout, _ = await asyncio.wait_for(proc.communicate(), timeout=5)

        if proc.returncode != 0:
            return None

        output = stdout.decode("utf-8")

        # Parse rocm-smi output (format varies by version)
        gpu_util = _parse_rocm_value(output, "GPU Use", float)
        mem_util = _parse_rocm_value(output, "GPU Mem Use", float)
        temp = _parse_rocm_value(output, "Temperature", float)
        power = _parse_rocm_value(output, "Average Graphics Package Power", float)

        if gpu_util is None and mem_util is None:
            return None  # No GPU data found

        return {
            "gpuUtilization": gpu_util if gpu_util is not None else 0.0,
            "memoryUtilization": mem_util if mem_util is not None else 0.0,
            "temperatureC": temp if temp is not None else 0.0,
            "powerDrawW": power if power is not None else 0.0,
            "available": True,
            "name": "AMD GPU (ROCm)",
        }
    except (FileNotFoundError, asyncio.TimeoutError, Exception):
        return None


async def _try_nvidia_smi() -> Optional[dict[str, Any]]:
    """Attempt to parse GPU metrics from nvidia-smi (fallback for non-AMD)."""
    try:
        proc = await asyncio.create_subprocess_exec(
            "nvidia-smi",
            "--query-gpu=utilization.gpu,memory.used,memory.total,temperature.gpu,power.draw",
            "--format=csv,noheader,nounits",
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE,
            timeout=5,
        )

        stdout, _ = await asyncio.wait_for(proc.communicate(), timeout=5)

        if proc.returncode != 0:
            return None

        output = stdout.decode("utf-8").strip()
        if not output:
            return None

        parts = output.split(", ")
        if len(parts) >= 5:
            gpu_util = float(parts[0])
            mem_used = float(parts[1])
            mem_total = float(parts[2])
            temp = float(parts[3])
            power = float(parts[4])

            return {
                "gpuUtilization": gpu_util,
                "memoryUtilization": (mem_used / mem_total * 100) if mem_total > 0 else 0.0,
                "temperatureC": temp,
                "powerDrawW": power,
                "available": True,
                "name": "NVIDIA GPU",
            }

        return None
    except (FileNotFoundError, ValueError, asyncio.TimeoutError, Exception):
        return None


def _parse_rocm_value(output: str, key: str, value_type: type) -> Optional[float]:
    """Parse a numeric value from rocm-smi text output.

    rocm-smi output looks like:
        GPU[0]              : GPU Use: 45%
        GPU[0]              : GPU Mem Use: 32%
    """
    for line in output.split("\n"):
        if key in line:
            # Extract number from line like "... GPU Use: 45%"
            parts = line.split(":")
            if len(parts) >= 2:
                value_str = parts[-1].strip().replace("%", "").replace("W", "")
                try:
                    return value_type(value_str)
                except (ValueError, TypeError):
                    continue
    return None


def _mock_gpu_metrics() -> dict[str, Any]:
    """Generate realistic mock GPU metrics for development."""
    return {
        "gpuUtilization": round(random.uniform(15, 85), 1),
        "memoryUtilization": round(random.uniform(20, 70), 1),
        "temperatureC": round(random.uniform(45, 78), 1),
        "powerDrawW": round(random.uniform(75, 250), 1),
        "available": False,
        "name": "Simulated GPU (no hardware detected)",
    }


# ─── System Health ───────────────────────────────────────────────────────────

async def get_system_health() -> dict[str, Any]:
    """Get overall system health including GPU and memory info."""
    gpu = await get_gpu_metrics()

    import os as _os

    health: dict[str, Any] = {
        "status": "healthy",
        "gpu": gpu,
        "memory": {},
    }

    # Try to get memory info
    try:
        with open("/proc/meminfo") as f:
            meminfo = f.read()
            for line in meminfo.split("\n"):
                if "MemTotal" in line:
                    health["memory"]["totalKb"] = int(
                        line.split(":")[1].strip().split()[0]
                    )
                elif "MemAvailable" in line:
                    health["memory"]["availableKb"] = int(
                        line.split(":")[1].strip().split()[0]
                    )
    except (FileNotFoundError, OSError):
        health["memory"] = {"note": "Unavailable (non-Linux or restricted)"}

    return health