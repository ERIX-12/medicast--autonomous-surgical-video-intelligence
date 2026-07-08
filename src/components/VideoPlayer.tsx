import { useRef, useEffect, useState, forwardRef, useImperativeHandle, useCallback } from 'react';
import { Play, Pause, SkipForward, SkipBack, Maximize2, Camera, Monitor, ExternalLink, Volume2, VolumeX } from 'lucide-react';
import { SiYoutube } from 'react-icons/si';

interface Props {
  isActive: boolean;
  currentFrame: number;
  totalFrames: number;
  videoUrl: string | null;
  videoSource?: 'file' | 'youtube';
  youtubeVideoId?: string;
  procedureName?: string;
  onFrameChange?: (frame: number) => void;
}

export interface VideoPlayerHandle {
  videoElement: HTMLVideoElement | null;
  captureFrame: () => HTMLCanvasElement | null;
}

function isYouTubeUrl(url: string): boolean {
  return url.includes('youtube.com') || url.includes('youtu.be');
}

function extractYouTubeId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})(?:[&?/]|$)/,
    /(?:youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /(?:youtube\.com\/v\/)([a-zA-Z0-9_-]{11})/,
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

const VideoPlayer = forwardRef<VideoPlayerHandle, Props>(
  ({ isActive, currentFrame, totalFrames, videoUrl, videoSource, youtubeVideoId, procedureName, onFrameChange }, ref) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const youtubeIframeRef = useRef<HTMLIFrameElement>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isMuted, setIsMuted] = useState(true);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [youtubeReady, setYoutubeReady] = useState(false);
    const [embedBlocked, setEmbedBlocked] = useState(false);

    // Detect if this is a YouTube source
    const resolvedSource = videoSource === 'youtube' ? 'youtube'
      : videoUrl && isYouTubeUrl(videoUrl) ? 'youtube'
      : videoUrl ? 'file'
      : 'none';

    const resolvedYoutubeId = youtubeVideoId || (videoUrl ? extractYouTubeId(videoUrl) : null);
    const isRealVideo = resolvedSource === 'file';
    const isYoutube = resolvedSource === 'youtube';
    const thumbnailUrl = resolvedYoutubeId
      ? `https://img.youtube.com/vi/${resolvedYoutubeId}/hqdefault.jpg`
      : null;

    // Expose video element and frame capture to parent
    useImperativeHandle(ref, () => ({
      videoElement: videoRef.current,
      captureFrame: () => {
        if (videoRef.current) {
          const c = document.createElement('canvas');
          c.width = videoRef.current.videoWidth || 640;
          c.height = videoRef.current.videoHeight || 400;
          const ctx = c.getContext('2d');
          if (ctx) {
            ctx.drawImage(videoRef.current, 0, 0, c.width, c.height);
            return c;
          }
        }
        return null;
      },
    }));

    // Timer: if the YouTube iframe doesn't respond within 5 s, assume embed is blocked
    useEffect(() => {
      if (!isYoutube) return;
      setYoutubeReady(false);
      setEmbedBlocked(false);

      const timer = setTimeout(() => {
        setEmbedBlocked(true);
      }, 5000);

      return () => clearTimeout(timer);
    }, [isYoutube, resolvedYoutubeId]);

    // Simulated surgical video frame (fallback when no real video)
    useEffect(() => {
      if (isRealVideo || isYoutube) return;

      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const w = canvas.width;
      const h = canvas.height;

      // Background — laparoscopic view
      const gradient = ctx.createRadialGradient(w * 0.5, h * 0.4, w * 0.05, w * 0.5, h * 0.5, w * 0.7);
      gradient.addColorStop(0, '#1a0a0a');
      gradient.addColorStop(0.3, '#2d1510');
      gradient.addColorStop(0.6, '#1a0e0a');
      gradient.addColorStop(1, '#0a0508');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, w, h);

      // Tissue textures
      const t = currentFrame / Math.max(totalFrames, 1);
      ctx.fillStyle = 'rgba(180, 60, 50, 0.15)';
      ctx.beginPath();
      ctx.ellipse(w * 0.45 + t * 20, h * 0.35, w * 0.3, h * 0.25, 0.1, 0, Math.PI * 2);
      ctx.fill();

      // Gallbladder shape
      ctx.fillStyle = '#3d6b3d';
      ctx.beginPath();
      ctx.ellipse(w * 0.5 + t * 10, h * 0.42, w * 0.12, h * 0.1, -0.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Instrument (grasper)
      const grasperX = w * 0.65 + Math.sin(t * 3) * 8;
      const grasperY = h * 0.30;
      ctx.strokeStyle = '#8899aa';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(w * 0.85, h * 0.05);
      ctx.lineTo(grasperX, grasperY);
      ctx.stroke();
      ctx.fillStyle = '#aabbcc';
      ctx.beginPath();
      ctx.arc(grasperX, grasperY, 3, 0, Math.PI * 2);
      ctx.fill();

      // Second instrument (dissector)
      const dissX = w * 0.30 + Math.cos(t * 2.5) * 5;
      ctx.strokeStyle = '#8899aa';
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.moveTo(w * 0.12, h * 0.08);
      ctx.lineTo(dissX, h * 0.38);
      ctx.stroke();

      // Vignette
      const vignette = ctx.createRadialGradient(w * 0.5, h * 0.45, w * 0.35, w * 0.5, h * 0.45, w * 0.7);
      vignette.addColorStop(0, 'rgba(0,0,0,0)');
      vignette.addColorStop(1, 'rgba(0,0,0,0.6)');
      ctx.fillStyle = vignette;
      ctx.fillRect(0, 0, w, h);

      // Frame info overlay
      ctx.fillStyle = 'rgba(5,8,16,0.8)';
      ctx.fillRect(0, 0, w, 28);
      ctx.fillStyle = '#06b6d4';
      ctx.font = '11px "JetBrains Mono", monospace';
      ctx.fillText(`FRAME ${currentFrame}/${totalFrames}  |  ${(procedureName || 'LAP CHOLECYSTECTOMY').toUpperCase()}  |  SIMULATED`, 10, 18);

      // Crosshair
      ctx.strokeStyle = 'rgba(6,182,212,0.15)';
      ctx.lineWidth = 0.5;
      ctx.beginPath();
      ctx.moveTo(w * 0.5, 30);
      ctx.lineTo(w * 0.5, h);
      ctx.moveTo(0, h * 0.5);
      ctx.lineTo(w, h * 0.5);
      ctx.stroke();
    }, [currentFrame, totalFrames, isRealVideo, isYoutube, procedureName]);

    // Video time update
    const handleTimeUpdate = () => {
      if (videoRef.current) {
        setCurrentTime(videoRef.current.currentTime);
        const frame = Math.floor((videoRef.current.currentTime / videoRef.current.duration) * totalFrames);
        onFrameChange?.(Math.min(frame + 1, totalFrames));
      }
    };

    const handleLoadedMetadata = () => {
      if (videoRef.current) {
        setDuration(videoRef.current.duration);
      }
    };

    // Send postMessage command to YouTube iframe
    const postToYoutube = useCallback((func: string) => {
      if (youtubeIframeRef.current?.contentWindow) {
        youtubeIframeRef.current.contentWindow.postMessage(
          JSON.stringify({ event: 'command', func, args: '' }),
          '*'
        );
      }
    }, []);

    // Listen for YouTube iframe state changes via postMessage API
    // YouTube sends messages as JSON strings, so we parse them first
    useEffect(() => {
      const handleMessage = (event: MessageEvent) => {
        let data: Record<string, unknown> | null = null;

        // YouTube sends events as JSON strings — parse if string
        if (typeof event.data === 'string') {
          try {
            data = JSON.parse(event.data);
          } catch {
            return;
          }
        } else if (event.data && typeof event.data === 'object') {
          data = event.data as Record<string, unknown>;
        } else {
          return;
        }

        if (!data || typeof data.event !== 'string') return;

        if (data.event === 'onReady') {
          setYoutubeReady(true);
          setEmbedBlocked(false);
        }

        if (data.event === 'onStateChange') {
          const state = Number(data.info); // -1=unstarted, 0=ended, 1=playing, 2=paused, 3=buffering
          setIsPlaying(state === 1 || state === 3);
        }
      };
      window.addEventListener('message', handleMessage);
      return () => window.removeEventListener('message', handleMessage);
    }, []);

    const toggleMute = () => {
      if (isYoutube && youtubeIframeRef.current) {
        if (isMuted) {
          postToYoutube('unMute');
        } else {
          postToYoutube('mute');
        }
        setIsMuted(!isMuted);
        return;
      }
      if (videoRef.current) {
        videoRef.current.muted = !isMuted;
      }
      setIsMuted(!isMuted);
    };

    const togglePlay = () => {
      if (isYoutube && youtubeIframeRef.current) {
        if (isPlaying) {
          postToYoutube('pauseVideo');
          setIsPlaying(false);
        } else {
          postToYoutube('playVideo');
          setIsPlaying(true);
        }
        return;
      }
      if (!videoRef.current) return;
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    };

    const formatTime = (s: number) => {
      const m = Math.floor(s / 60);
      const sec = Math.floor(s % 60);
      return `${m}:${sec.toString().padStart(2, '0')}`;
    };

    return (
      <div className="relative">
        <div className="relative border border-border bg-black overflow-hidden">
          {/* YouTube embed — only shown while waiting for onReady, before timeout */}
          {isYoutube && resolvedYoutubeId && !embedBlocked && (
            <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
              <iframe
                key={resolvedYoutubeId}
                ref={youtubeIframeRef}
                src={`https://www.youtube-nocookie.com/embed/${resolvedYoutubeId}?autoplay=0&modestbranding=1&rel=0&showinfo=1&controls=1&enablejsapi=1`}
                title="YouTube video player"
                className="absolute inset-0 w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          )}

          {/* YouTube fallback — shown when embed is blocked */}
          {isYoutube && embedBlocked && thumbnailUrl && (
            <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
              <img
                src={thumbnailUrl}
                alt="YouTube video thumbnail"
                className="absolute inset-0 w-full h-full object-cover"
                onError={(e) => {
                  // If even the thumbnail fails to load, show a dark placeholder
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
              {/* Dark overlay */}
              <div className="absolute inset-0 bg-black/40" />
              {/* Play button overlay */}
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                <SiYoutube className="w-14 h-14 text-critical" />
                <p className="text-sm font-semibold text-white">Embed blocked by your browser</p>
                <a
                  href={`https://www.youtube.com/watch?v=${resolvedYoutubeId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2 bg-critical/80 hover:bg-critical
                             text-white text-xs font-semibold uppercase tracking-wider
                             transition-all duration-200 cursor-pointer"
                >
                  <ExternalLink className="w-4 h-4" />
                  Watch on YouTube
                </a>
              </div>
            </div>
          )}

          {/* Real video element */}
          {isRealVideo && (
            <video
              ref={videoRef}
              src={videoUrl!}
              className="w-full h-auto max-h-[500px] object-contain"
              muted={isMuted}
              playsInline
              onTimeUpdate={handleTimeUpdate}
              onLoadedMetadata={handleLoadedMetadata}
              onEnded={() => setIsPlaying(false)}
            />
          )}

          {/* Canvas fallback */}
          {!isRealVideo && !isYoutube && (
            <canvas
              ref={canvasRef}
              width={640}
              height={400}
              className="w-full h-auto"
            />
          )}

          {/* Recording indicator */}
          {isActive && (
            <div className="absolute top-2 right-2 flex items-center gap-2 bg-critical/20 border border-critical/40 px-2 py-1 z-10">
              <span className="w-2 h-2 bg-critical animate-pulse" />
              <span className="text-xs font-mono text-critical tracking-widest">REC</span>
            </div>
          )}

          {isYoutube && !embedBlocked && (
            <div className="absolute bottom-2 left-2 flex items-center gap-1.5 bg-background/80 border border-critical/30 px-2 py-1 z-10">
              <SiYoutube className="w-3 h-3 text-critical" />
              <span className="text-[9px] font-mono text-critical tracking-wider">
                {youtubeReady ? 'YOUTUBE STREAM' : 'LOADING YOUTUBE...'}
              </span>
            </div>
          )}

          {isYoutube && embedBlocked && (
            <div className="absolute bottom-2 left-2 flex items-center gap-1.5 bg-background/80 border border-warning/30 px-2 py-1 z-10">
              <SiYoutube className="w-3 h-3 text-warning" />
              <span className="text-[9px] font-mono text-warning tracking-wider">EMBED BLOCKED</span>
            </div>
          )}

          {/* Simulated badge */}
          {!isRealVideo && !isYoutube && (
            <div className="absolute bottom-2 left-2 flex items-center gap-1.5 bg-background/80 border border-warning/30 px-2 py-1 z-10">
              <Monitor className="w-3 h-3 text-warning" />
              <span className="text-[9px] font-mono text-warning tracking-wider">SIMULATED VIEW</span>
            </div>
          )}

          {/* Video progress overlay */}
          {isRealVideo && duration > 0 && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-background/50 z-10">
              <div
                className="h-full bg-accent transition-all duration-200"
                style={{ width: `${(currentTime / duration) * 100}%` }}
              />
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2 mt-2 px-1">
          <button
            onClick={togglePlay}
            className="p-2 text-foreground-muted hover:text-accent transition-colors duration-200 cursor-pointer"
            title={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          </button>

          {/* Mute/Unmute toggle */}
          <button
            onClick={toggleMute}
            className="p-2 text-foreground-muted hover:text-accent transition-colors duration-200 cursor-pointer"
            title={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>

          {isRealVideo && duration > 0 && (
            <>
              <span className="text-[10px] font-mono text-foreground-muted">
                {formatTime(currentTime)} / {formatTime(duration)}
              </span>
              <div className="flex-1" />
            </>
          )}
          {isYoutube && !embedBlocked && (
            <>
              <span className="text-[10px] font-mono text-foreground-muted">
                {youtubeReady ? (isPlaying ? 'Playing' : 'Paused') : 'Loading YouTube...'}
              </span>
              <div className="flex-1" />
            </>
          )}

          {!isRealVideo && !isYoutube && (
            <>
              <button className="p-2 text-foreground-muted hover:text-accent transition-colors duration-200 cursor-pointer">
                <SkipBack className="w-4 h-4" />
              </button>
              <button className="p-2 text-foreground-muted hover:text-accent transition-colors duration-200 cursor-pointer">
                <SkipForward className="w-4 h-4" />
              </button>
              <button className="p-2 text-foreground-muted hover:text-accent transition-colors duration-200 cursor-pointer">
                <Camera className="w-4 h-4" />
              </button>
              <div className="flex-1" />
            </>
          )}

          <button className="p-2 text-foreground-muted hover:text-accent transition-colors duration-200 cursor-pointer">
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }
);

VideoPlayer.displayName = 'VideoPlayer';
export default VideoPlayer;