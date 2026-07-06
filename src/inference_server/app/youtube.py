"""YouTube video frame extraction endpoint.

Provides:
- POST /fetch-youtube-frames — Download a YouTube video, extract frames at 1fps,
  return base64-encoded JPEG frames + metadata.

Uses yt-dlp for video downloading and ffmpeg for frame extraction.
In mock mode (no yt-dlp / ffmpeg), generates procedurally generated placeholder frames.

Gracefully handles errors (invalid URLs, missing dependencies, YouTube restrictions).
"""

from __future__ import annotations

import asyncio
import base64
import io
import json
import logging
import os
import re
import tempfile
import uuid
from pathlib import Path
from typing import Any, Optional

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import httpx

logger = logging.getLogger("mediast.youtube")

# ─── Models ──────────────────────────────────────────────────────────────────

class YouTubeFetchRequest(BaseModel):
    url: str
    fps: float = 1.0
    max_frames: int = 300
    start_seconds: Optional[float] = None
    end_seconds: Optional[float] = None


class YouTubeFetchResponse(BaseModel):
    success: bool
    videoId: str
    title: str
    durationSeconds: float
    frames: list[str]  # base64-encoded JPEGs
    totalFrames: int
    fps: float
    simulated: bool


class YouTubeInfo(BaseModel):
    videoId: str
    title: str
    durationSeconds: float


# ─── Router ──────────────────────────────────────────────────────────────────

router = APIRouter(prefix="/api")


def _extract_video_id(url: str) -> Optional[str]:
    """Extract YouTube video ID from various URL formats."""
    patterns = [
        r"(?:youtube\.com/watch\?v=|youtu\.be/|youtube\.com/embed/|youtube\.com/v/)([a-zA-Z0-9_-]{11})",
        r"^([a-zA-Z0-9_-]{11})$",
    ]
    for pattern in patterns:
        match = re.search(pattern, url)
        if match:
            return match.group(1)
    return None


async def _fetch_video_info(video_id: str) -> dict[str, Any]:
    """Fetch video metadata via yt-dlp (or fallback to oEmbed API)."""
    # Try yt-dlp first
    try:
        proc = await asyncio.create_subprocess_exec(
            "yt-dlp",
            "--dump-json",
            "--no-download",
            f"https://www.youtube.com/watch?v={video_id}",
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE,
        )
        stdout, stderr = await asyncio.wait_for(proc.communicate(), timeout=30)

        if proc.returncode == 0 and stdout:
            data = json.loads(stdout.decode())
            return {
                "title": data.get("title", "Unknown"),
                "duration": float(data.get("duration", 0)),
            }
    except (FileNotFoundError, asyncio.TimeoutError, json.JSONDecodeError) as exc:
        logger.warning("yt-dlp info failed (%s), falling back to oEmbed", exc)

    # Fallback: YouTube oEmbed API (no dependencies)
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            resp = await client.get(
                "https://www.youtube.com/oembed",
                params={"url": f"https://www.youtube.com/watch?v={video_id}", "format": "json"},
            )
            if resp.status_code == 200:
                data = resp.json()
                # oEmbed doesn't give duration — will estimate from mp4
                return {
                    "title": data.get("title", "Unknown"),
                    "duration": 0.0,  # Will be determined during extraction
                }
    except Exception as exc:
        logger.warning("oEmbed fallback failed: %s", exc)

    return {"title": f"YouTube Video ({video_id})", "duration": 0.0}


# ─── Frame Extraction ────────────────────────────────────────────────────────

async def _extract_frames_ffmpeg(
    video_path: Path,
    fps: float,
    max_frames: int,
    start_seconds: Optional[float] = None,
    end_seconds: Optional[float] = None,
) -> list[bytes]:
    """Extract frames from a video file using ffmpeg.

    Returns a list of JPEG bytes, one per frame at the requested FPS.
    """
    output_dir = tempfile.mkdtemp(prefix="mediast-frames-")
    output_pattern = str(Path(output_dir) / "frame_%06d.jpg")

    # Build ffmpeg command
    cmd = [
        "ffmpeg",
        "-i", str(video_path),
        "-vf", f"fps={fps}",
        "-q:v", "5",  # JPEG quality (1=best, 31=worst)
        "-frame_pts", "1",
    ]

    if start_seconds is not None:
        cmd.extend(["-ss", str(start_seconds)])
    if end_seconds is not None:
        # Duration = end - start (or just end)
        if start_seconds is not None:
            duration = end_seconds - start_seconds
            cmd.extend(["-t", str(max(duration, 1))])
        else:
            cmd.extend(["-to", str(end_seconds)])

    cmd.append(output_pattern)

    try:
        proc = await asyncio.create_subprocess_exec(
            *cmd,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE,
        )
        await asyncio.wait_for(proc.communicate(), timeout=300)  # 5 min timeout

        # Collect frames
        frame_files = sorted(Path(output_dir).glob("frame_*.jpg"))
        if not frame_files:
            logger.warning("ffmpeg extracted 0 frames from %s", video_path)
            return []

        # Limit to max_frames
        frame_files = frame_files[:max_frames]

        frames: list[bytes] = []
        for f in frame_files:
            frames.append(f.read_bytes())
            f.unlink()  # Cleanup individual frame

        return frames

    except (FileNotFoundError, asyncio.TimeoutError) as exc:
        logger.error("ffmpeg extraction failed: %s", exc)
        return []
    finally:
        # Cleanup temp dir
        import shutil
        shutil.rmtree(output_dir, ignore_errors=True)


async def _download_video(video_id: str) -> Optional[Path]:
    """Download a YouTube video using yt-dlp into a temp file.

    Returns the path to the downloaded video, or None on failure.
    """
    tmp_dir = tempfile.mkdtemp(prefix="mediast-video-")
    output_template = str(Path(tmp_dir) / "%(id)s.%(ext)s")

    cmd = [
        "yt-dlp",
        "-f", "best[height<=720]",  # Limit to 720p for speed
        "-o", output_template,
        "--no-playlist",
        "--no-warnings",
        "--no-check-certificates",
        "--extract-audio",  # Don't extract audio, get video
        "--merge-output-format", "mp4",
        f"https://www.youtube.com/watch?v={video_id}",
    ]

    try:
        proc = await asyncio.create_subprocess_exec(
            *cmd,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE,
        )
        await asyncio.wait_for(proc.communicate(), timeout=600)  # 10 min timeout

        # Find the downloaded file
        files = list(Path(tmp_dir).iterdir())
        if not files:
            logger.warning("yt-dlp downloaded 0 files for %s", video_id)
            shutil.rmtree(tmp_dir, ignore_errors=True)
            return None

        # Return the largest file (likely the video)
        video_file = max(files, key=lambda f: f.stat().st_size)
        return video_file

    except (FileNotFoundError, asyncio.TimeoutError) as exc:
        logger.error("yt-dlp download failed: %s", exc)
        shutil.rmtree(tmp_dir, ignore_errors=True)
        return None


# ─── Mock Frame Generation ───────────────────────────────────────────────────

def _generate_mock_frames(
    count: int,
    video_title: str,
) -> list[str]:
    """Generate procedurally created mock frames when yt-dlp/ffmpeg are unavailable.

    Uses Pillow to create simple colored frames with text overlay.
    """
    try:
        from PIL import Image, ImageDraw, ImageFont
    except ImportError:
        # Ultra-fallback: return empty placeholder
        return [""] * count  # Will be rendered as "no frame" by frontend

    frames: list[str] = []
    width, height = 640, 360

    for i in range(count):
        # Create a gradient-like background (varies per frame)
        hue = (i * 10) % 360
        img = Image.new("RGB", (width, height), f"hsl({hue}, 30%, 15%)")
        draw = ImageDraw.Draw(img)

        # Draw "surgical field" circles
        for c in range(3):
            cx = width // 2 + (c - 1) * 80
            cy = height // 2 + (i % 20 - 10) * 5
            draw.ellipse(
                [cx - 30, cy - 30, cx + 30, cy + 30],
                fill=f"hsl({(hue + c * 40) % 360}, 60%, {30 + (i % 20)}%)",
            )

        # Draw phase indicator text
        phases = [
            "Incision & Exposure",
            "Dissection",
            "Critical Structure Identification",
            "Closure",
        ]
        phase_text = phases[(i // 10) % len(phases)]
        draw.text((20, 20), f"Frame {i+1}: {phase_text}", fill="rgb(200, 220, 255)")

        # Convert to JPEG bytes
        buf = io.BytesIO()
        img.save(buf, format="JPEG", quality=70)
        frames.append(base64.b64encode(buf.getvalue()).decode("utf-8"))

    return frames


# ─── Check Dependencies ──────────────────────────────────────────────────────

async def _check_dependencies() -> dict[str, bool]:
    """Check which tools are available on the system."""
    deps = {"yt-dlp": False, "ffmpeg": False}

    for tool in deps:
        try:
            proc = await asyncio.create_subprocess_exec(
                tool, "--version",
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE,
            )
            await asyncio.wait_for(proc.communicate(), timeout=5)
            deps[tool] = proc.returncode == 0
        except (FileNotFoundError, asyncio.TimeoutError):
            pass

    return deps


# ─── Endpoint ────────────────────────────────────────────────────────────────

@router.post("/fetch-youtube-frames", response_model=YouTubeFetchResponse)
async def fetch_youtube_frames(request: YouTubeFetchRequest):
    """Download a YouTube video and extract frames at the specified FPS.

    Steps:
    1. Extract video ID from URL
    2. Fetch video metadata (title, duration)
    3. Download video using yt-dlp
    4. Extract frames using ffmpeg at requested FPS
    5. Return base64-encoded JPEG frames

    Falls back to procedurally generated mock frames if yt-dlp/ffmpeg
    are not available or the download fails.
    """
    video_id = _extract_video_id(request.url)
    if not video_id:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid YouTube URL: {request.url}. "
                   "Provide a standard YouTube link (e.g., https://youtube.com/watch?v=...).",
        )

    # Check available tools
    deps = await _check_dependencies()
    has_ytdlp = deps.get("yt-dlp", False)
    has_ffmpeg = deps.get("ffmpeg", False)

    # Fetch video info
    info = await _fetch_video_info(video_id)
    title = info["title"]
    duration = info["duration"]

    frames_b64: list[str] = []
    simulated = False

    if has_ytdlp and has_ffmpeg:
        # Real mode: download + extract
        video_path = await _download_video(video_id)
        if video_path is not None:
            frame_bytes = await _extract_frames_ffmpeg(
                video_path=video_path,
                fps=request.fps,
                max_frames=request.max_frames,
                start_seconds=request.start_seconds,
                end_seconds=request.end_seconds,
            )

            # Cleanup video file
            try:
                video_path.unlink()
                video_path.parent.rmdir()  # Remove temp dir
            except Exception:
                pass

            # Encode as base64
            frames_b64 = [base64.b64encode(fb).decode() for fb in frame_bytes]

            # Estimate duration from frame count if not available from metadata
            if duration == 0 and frame_bytes:
                duration = len(frame_bytes) / request.fps

            logger.info(
                "Extracted %d frames from YouTube video '%s' (%s)",
                len(frames_b64), title, video_id,
            )

    if not frames_b64:
        # Fallback: mock frames
        estimated_frames = min(
            int(duration * request.fps) if duration > 0 else 60,
            request.max_frames,
        )
        estimated_frames = max(estimated_frames, 10)  # At least 10 frames
        frames_b64 = _generate_mock_frames(estimated_frames, title)
        simulated = True

        logger.info(
            "Generated %d mock frames for '%s' (%s) [deps: yt-dlp=%s, ffmpeg=%s]",
            len(frames_b64), title, video_id, has_ytdlp, has_ffmpeg,
        )

    return YouTubeFetchResponse(
        success=True,
        videoId=video_id,
        title=title,
        durationSeconds=duration,
        frames=frames_b64,
        totalFrames=len(frames_b64),
        fps=request.fps,
        simulated=simulated,
    )


@router.get("/youtube-dependency-check")
async def youtube_dependency_check():
    """Check whether yt-dlp and ffmpeg are available on the server."""
    deps = await _check_dependencies()
    return {
        "ytDlpAvailable": deps["yt-dlp"],
        "ffmpegAvailable": deps["ffmpeg"],
        "allAvailable": all(deps.values()),
        "mockMode": not all(deps.values()),
    }


@router.post("/youtube-video-info", response_model=YouTubeInfo)
async def youtube_video_info(request: YouTubeFetchRequest):
    """Fetch YouTube video metadata without downloading."""
    video_id = _extract_video_id(request.url)
    if not video_id:
        raise HTTPException(status_code=400, detail="Invalid YouTube URL")

    info = await _fetch_video_info(video_id)
    return YouTubeInfo(
        videoId=video_id,
        title=info["title"],
        durationSeconds=info["duration"],
    )