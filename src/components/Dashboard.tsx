import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { Play, Square, Activity, Menu, X, Zap, Upload, Timer, Gauge, Shield, User, LogOut, History } from 'lucide-react';
import ProcedureSelector from './ProcedureSelector';
import VideoPlayer from './VideoPlayer';
import ZonePanel from './ZonePanel';
import ArbiterVerdict from './ArbiterVerdict';
import AgentFeed, { type AgentMessage } from './AgentFeed';
import AlertBanner from './AlertBanner';
import TelemetryPanel from './TelemetryPanel';
import TimelineChart from './TimelineChart';
import BlackBox from './BlackBox';
import ClinicalReport from './ClinicalReport';
import VideoUploader from './VideoUploader';
import AuthModal from './AuthModal';
import SessionHistory from './SessionHistory';
import { useAnalysisEngine } from '../hooks/useAnalysisEngine';
import { useRealtime } from '../hooks/useRealtime';
import { useTelemetry } from '../hooks/useTelemetry';
import { useAuth } from '../contexts/AuthContext';
import type { ProcedureKnowledge } from '../data/types';

const FRAMES_PER_SESSION = 24;

export default function Dashboard() {
  const [procedure, setProcedure] = useState<ProcedureKnowledge | null>(null);
  const [phase, setPhase] = useState<'setup' | 'running' | 'completed'>('setup');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [videoSource, setVideoSource] = useState<'file' | 'youtube' | null>(null);
  const [youtubeVideoId, setYoutubeVideoId] = useState<string | undefined>(undefined);
  const [sessionTimer, setSessionTimer] = useState(0);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const mainRef = useRef<HTMLDivElement>(null);

  const { user, loading: authLoading, signOut } = useAuth();

  const {
    isAnalyzing,
    framesProcessed,
    totalFrames,
    currentFrame,
    analyses,
    startAnalysis,
    stopAnalysis,
    sessionId,
  } = useAnalysisEngine();

  const { liveAnalyses } = useRealtime(sessionId);
  const { current: telemetry, history: telemetryHistory } = useTelemetry(isAnalyzing);

  // Session timer
  useEffect(() => {
    if (phase === 'running') {
      timerRef.current = setInterval(() => {
        setSessionTimer(t => t + 1);
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [phase]);

  // Scroll to content when analysis starts
  useEffect(() => {
    if (phase === 'running' && mainRef.current) {
      mainRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [phase]);

  const formatTimer = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Combine local + live analyses
  const allAnalyses = useMemo(() => {
    const combined = [...analyses];
    liveAnalyses.forEach(live => {
      if (!combined.find(a => a.id === live.id)) {
        combined.push(live);
      }
    });
    combined.sort((a, b) => a.frameNumber - b.frameNumber);
    return combined;
  }, [analyses, liveAnalyses]);

  const latestVerdict = allAnalyses.length > 0
    ? allAnalyses[allAnalyses.length - 1].arbiter
    : null;

  // Build agent messages from analyses
  const agentMessages: AgentMessage[] = useMemo(() => {
    const msgs: AgentMessage[] = [];
    allAnalyses.forEach(a => {
      a.zones.forEach(z => {
        msgs.push({
          id: `${a.id}-${z.zoneId}`,
          timestamp: a.timestamp,
          type: 'zone' as const,
          data: z,
        });
      });
      msgs.push({
        id: `${a.id}-arbiter`,
        timestamp: a.timestamp,
        type: 'arbiter' as const,
        data: a.arbiter,
      });
    });
    return msgs.slice(-50);
  }, [allAnalyses]);

  const handleUploadComplete = useCallback((url: string, _fileName: string, source: 'file' | 'youtube', ytVideoId?: string) => {
    setVideoUrl(url);
    setVideoSource(source);
    setYoutubeVideoId(ytVideoId);
  }, []);

  const handleStart = useCallback(async () => {
    if (!procedure) return;
    setSessionTimer(0);
    setPhase('running');
    startAnalysis(procedure, FRAMES_PER_SESSION, videoUrl || undefined);
  }, [procedure, startAnalysis, videoUrl]);

  const handleStop = useCallback(() => {
    stopAnalysis();
    setPhase('completed');
    if (timerRef.current) clearInterval(timerRef.current);
  }, [stopAnalysis]);

  // Watch for completion
  useEffect(() => {
    if (phase === 'running' && !isAnalyzing && allAnalyses.length > 0 && framesProcessed >= totalFrames) {
      setPhase('completed');
      if (timerRef.current) clearInterval(timerRef.current);
    }
  }, [phase, isAnalyzing, allAnalyses.length, framesProcessed, totalFrames]);

  const handleNewSession = () => {
    setPhase('setup');
    setProcedure(null);
    setVideoUrl(null);
    setVideoSource(null);
    setYoutubeVideoId(undefined);
    setSessionTimer(0);
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* ================================================================
          HEADER
          ================================================================ */}
      <header className="border-b border-border bg-surface/90 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-[1600px] mx-auto px-4 h-14 flex items-center gap-4">
          {/* Logo */}
          <div className="flex items-center gap-2.5 shrink-0">
            <div className="w-8 h-8 bg-accent/10 border border-accent/30 flex items-center justify-center relative overflow-hidden">
              <div className="absolute inset-0 bg-accent/5 animate-breathe" />
              <Zap className="w-4 h-4 text-accent relative z-10" />
            </div>
            <div>
              <h1 className="text-sm font-bold font-heading tracking-wider text-foreground leading-none">MEDICAST</h1>
              <p className="text-[8px] text-foreground-muted font-mono tracking-[0.2em] leading-tight mt-0.5">SURGICAL AI</p>
            </div>
          </div>

          {/* Divider */}
          <div className="hidden sm:block w-px h-8 bg-border" />

          {/* Status & Metadata */}
          <div className="hidden sm:flex items-center gap-4 flex-1 min-w-0">
            {phase === 'setup' && (
              <>
                {procedure ? (
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-1.5 h-1.5 bg-success animate-pulse-dot shrink-0" />
                    <span className="text-xs font-medium text-foreground truncate">{procedure.name}</span>
                    <span className="text-[10px] font-mono text-foreground-muted shrink-0">
                      {procedure.specialty}
                    </span>
                  </div>
                ) : (
                  <span className="text-[11px] font-mono text-foreground-muted">
                    Select a procedure to begin
                  </span>
                )}
                {videoUrl && (
                  <>
                    <div className="w-px h-4 bg-border" />
                    <span className="text-[10px] font-mono text-success">Video loaded</span>
                  </>
                )}
              </>
            )}
            {phase === 'running' && (
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-accent animate-pulse-dot" />
                  <span className="text-[11px] font-mono text-accent font-semibold tracking-wider">ANALYZING</span>
                </div>
                <div className="flex items-center gap-1.5 text-[10px] font-mono text-foreground-muted">
                  <Activity className="w-3 h-3" />
                  <span>{currentFrame}/{totalFrames} frames</span>
                </div>
                <div className="flex items-center gap-1.5 text-[10px] font-mono text-foreground-muted">
                  <Timer className="w-3 h-3" />
                  <span>{formatTimer(sessionTimer)}</span>
                </div>
              </div>
            )}
            {phase === 'completed' && (
              <div className="flex items-center gap-3">
                <span className="text-xs font-mono text-success font-semibold">✓ Analysis Complete</span>
                <span className="text-[10px] font-mono text-foreground-muted">
                  {allAnalyses.length} frames · {formatTimer(sessionTimer)}
                </span>
              </div>
            )}
          </div>

          {/* Right Actions */}
          <div className="ml-auto flex items-center gap-2">
            {/* History Toggle */}
            <button
              onClick={() => setHistoryOpen(!historyOpen)}
              className="flex items-center gap-1.5 px-3 py-2 text-foreground-muted
                         hover:text-accent hover:bg-surface-hover
                         transition-all duration-200 cursor-pointer border border-transparent hover:border-border"
              aria-label="Toggle history"
            >
              <History className="w-3.5 h-3.5" />
              <span className="hidden sm:inline text-[10px] font-mono tracking-wider uppercase">History</span>
            </button>

            <div className="w-px h-6 bg-border" />

            {/* Start / Stop / New */}
            {phase === 'setup' && (
              <button
                onClick={handleStart}
                disabled={!procedure}
                className="flex items-center gap-2 px-4 py-2 bg-accent/10 border border-accent/40
                           text-accent text-xs font-semibold tracking-wider uppercase
                           hover:bg-accent/20 hover:border-accent/60
                           transition-all duration-200 cursor-pointer
                           disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <Play className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Start</span>
              </button>
            )}
            {phase === 'running' && (
              <button
                onClick={handleStop}
                className="flex items-center gap-2 px-4 py-2 bg-critical/10 border border-critical/40
                           text-critical text-xs font-semibold tracking-wider uppercase
                           hover:bg-critical/20 hover:border-critical/60
                           transition-all duration-200 cursor-pointer"
              >
                <Square className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Stop</span>
              </button>
            )}
            {phase === 'completed' && (
              <button
                onClick={handleNewSession}
                className="flex items-center gap-2 px-4 py-2 bg-accent/10 border border-accent/40
                           text-accent text-xs font-semibold tracking-wider uppercase
                           hover:bg-accent/20 hover:border-accent/60
                           transition-all duration-200 cursor-pointer"
              >
                <Zap className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">New</span>
              </button>
            )}

            {/* User */}
            <div className="w-px h-6 bg-border" />
            {authLoading ? (
              <div className="w-8 h-8 animate-shimmer" />
            ) : user ? (
              <div className="relative group">
                <button
                  className="w-8 h-8 bg-accent/10 border border-accent/30 flex items-center justify-center
                             hover:bg-accent/20 transition-colors cursor-pointer"
                  title={user.email || 'User'}
                >
                  <span className="text-[10px] font-mono font-bold text-accent">
                    {(user.email?.[0] || 'U').toUpperCase()}
                  </span>
                </button>
                <div className="absolute right-0 top-full mt-1 w-48 bg-surface border border-border
                                opacity-0 invisible group-hover:opacity-100 group-hover:visible
                                transition-all duration-200 z-50">
                  <div className="px-3 py-2 border-b border-border">
                    <p className="text-[10px] font-mono text-foreground-muted truncate">{user.email}</p>
                  </div>
                  <button
                    onClick={() => signOut()}
                    className="w-full flex items-center gap-2 px-3 py-2 text-[10px] font-mono
                               text-foreground-muted hover:text-critical hover:bg-surface-hover
                               transition-colors cursor-pointer"
                  >
                    <LogOut className="w-3 h-3" />
                    Sign Out
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setAuthModalOpen(true)}
                className="w-8 h-8 bg-accent/10 border border-accent/30 flex items-center justify-center
                           hover:bg-accent/20 transition-colors cursor-pointer"
                title="Sign In"
              >
                <User className="w-3.5 h-3.5 text-accent" />
              </button>
            )}

            {/* Mobile menu */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 text-foreground-muted hover:text-accent transition-colors cursor-pointer"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </header>

      {/* Alert Banner */}
      <div className="relative z-40">
        <AlertBanner latestVerdict={latestVerdict} isAnalyzing={isAnalyzing} />
      </div>

      {/* ================================================================
          MAIN CONTENT
          ================================================================ */}
      <main ref={mainRef} className="max-w-[1600px] mx-auto p-4 sm:p-6">
        {/* Auth Modal */}
        {authModalOpen && <AuthModal onClose={() => setAuthModalOpen(false)} />}

        {/* History Sidebar */}
        {historyOpen && (
          <div className="fixed inset-0 z-40 flex justify-end bg-black/40 backdrop-blur-sm" onClick={() => setHistoryOpen(false)}>
            <div
              className="w-full max-w-md bg-background border-l border-border overflow-y-auto h-full"
              onClick={e => e.stopPropagation()}
            >
              <div className="sticky top-0 bg-surface/90 backdrop-blur-md border-b border-border z-10">
                <div className="flex items-center justify-between px-4 py-3">
                  <h2 className="text-xs font-semibold text-foreground uppercase tracking-wider">Past Sessions</h2>
                  <button
                    onClick={() => setHistoryOpen(false)}
                    className="p-1.5 text-foreground-muted hover:text-accent transition-colors cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div className="p-4">
                <SessionHistory onLoadSession={(id) => { setHistoryOpen(false); }} />
              </div>
            </div>
          </div>
        )}

        {/* Setup Phase */}
        {phase === 'setup' && (
          <div className="animate-fade-in-up">
            <div className="grid lg:grid-cols-[420px_1fr] gap-6">
              {/* Left Column */}
              <div className="space-y-5">
                <ProcedureSelector onSelect={setProcedure} />

                <div className="bg-surface border border-border">
                  <div className="px-4 py-3 border-b border-border flex items-center gap-2">
                    <Upload className="w-4 h-4 text-accent" />
                    <h3 className="text-xs font-semibold text-foreground-muted uppercase tracking-wider">Surgical Video Source</h3>
                    {videoUrl && (
                      <span className="ml-auto flex items-center gap-1 text-[10px] font-mono text-success">
                        <span className="w-1.5 h-1.5 bg-success" />
                        Ready
                      </span>
                    )}
                  </div>
                  <div className="p-4">
                    <VideoUploader onUploadComplete={handleUploadComplete} />
                  </div>
                </div>

                {procedure && (
                  <div className="bg-surface border border-accent/20 p-4 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-accent/5 blur-3xl" />
                    <div className="flex items-center gap-2 mb-3">
                      <Shield className="w-4 h-4 text-accent" />
                      <h3 className="text-xs font-semibold text-accent uppercase tracking-wider">Preparation Summary</h3>
                    </div>
                    <p className="text-sm font-bold text-foreground">{procedure.name}</p>
                    <p className="text-xs text-foreground-muted mt-1">
                      {procedure.specialty} · ~{procedure.estimatedDurationMin} min · {procedure.surgicalSteps.length} phases
                    </p>
                    <p className="text-xs text-foreground-muted mt-2 leading-relaxed">{procedure.description}</p>
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {procedure.keyAnatomy.slice(0, 5).map(a => (
                        <span key={a.name}
                          className={`text-[10px] font-mono px-2 py-0.5 border
                            ${a.riskLevel === 'critical' ? 'border-critical/30 text-critical bg-critical/5' :
                              a.riskLevel === 'high' ? 'border-warning/30 text-warning bg-warning/5' :
                              'border-border text-foreground-muted bg-background/50'}`}
                        >
                          {a.name}
                        </span>
                      ))}
                      {procedure.keyAnatomy.length > 5 && (
                        <span className="text-[10px] text-foreground-muted font-mono">+{procedure.keyAnatomy.length - 5} more</span>
                      )}
                    </div>
                    <button
                      onClick={handleStart}
                      className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-3
                                 bg-accent/10 border border-accent/40 text-accent
                                 text-xs font-semibold uppercase tracking-wider
                                 hover:bg-accent/20 hover:border-accent/60
                                 transition-all duration-200 cursor-pointer sm:hidden"
                    >
                      <Play className="w-3.5 h-3.5" />
                      Start Analysis
                    </button>
                  </div>
                )}
              </div>

              {/* Right Column — Video Preview */}
              <div className="flex flex-col">
                <div className="flex-1 bg-surface border border-border min-h-[400px] flex items-center justify-center">
                  {videoUrl ? (
                    <div className="w-full">
                      <VideoPlayer
                        isActive={false}
                        currentFrame={0}
                        totalFrames={1}
                        videoUrl={videoUrl}
                        videoSource={videoSource || undefined}
                        youtubeVideoId={youtubeVideoId}
                        procedureName={procedure?.name}
                      />
                      <div className="px-4 py-3 flex items-center gap-2 border-t border-border">
                        <span className="w-1.5 h-1.5 bg-success shrink-0" />
                        <span className="text-xs font-mono text-success">
                          {videoSource === 'youtube' ? 'YouTube stream loaded and ready' : 'Video loaded and ready for analysis'}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center px-6 py-12">
                      <div className="w-16 h-16 mx-auto mb-4 bg-accent/5 border border-accent/20 flex items-center justify-center">
                        <Activity className="w-8 h-8 text-accent/40" />
                      </div>
                      <p className="text-sm text-foreground font-heading font-semibold">Configure Your Session</p>
                      <p className="text-xs text-foreground-muted mt-2 max-w-sm mx-auto leading-relaxed">
                        Select a surgical procedure from the left panel, then upload or link
                        a surgical video for autonomous AI analysis.
                      </p>
                      <div className="flex flex-wrap justify-center gap-2 mt-4 text-[10px] font-mono text-foreground-muted">
                        <span className="px-2 py-1 border border-border">10 procedures</span>
                        <span className="px-2 py-1 border border-border">5 AI agents</span>
                        <span className="px-2 py-1 border border-border">AMD GPU telemetry</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Running / Completed */}
        {(phase === 'running' || phase === 'completed') && (
          <div className="animate-fade-in-up">
            <div className="grid xl:grid-cols-[1fr_360px] gap-6">
              {/* Left Column */}
              <div className="space-y-5">
                <VideoPlayer
                  isActive={isAnalyzing}
                  currentFrame={currentFrame}
                  totalFrames={totalFrames || FRAMES_PER_SESSION}
                  videoUrl={videoUrl}
                  videoSource={videoSource || undefined}
                  youtubeVideoId={youtubeVideoId}
                  procedureName={procedure?.name}
                />

                {allAnalyses.length > 0 && (
                  <div className="grid grid-cols-2 gap-3">
                    {allAnalyses[allAnalyses.length - 1].zones.map((zone, i) => (
                      <ZonePanel key={zone.zoneId} zone={zone} index={i} />
                    ))}
                  </div>
                )}

                <ArbiterVerdict verdict={latestVerdict} isAnalyzing={isAnalyzing} />

                {phase === 'completed' && (
                  <div className="grid md:grid-cols-2 gap-5">
                    <BlackBox analyses={allAnalyses} procedure={procedure} sessionId={sessionId} />
                    <ClinicalReport analyses={allAnalyses} procedure={procedure} sessionId={sessionId} />
                  </div>
                )}
              </div>

              {/* Right Column */}
              <div className="space-y-5">
                {/* Agent Feed */}
                <div className="bg-surface border border-border overflow-hidden">
                  <div className="px-4 py-3 border-b border-border flex items-center gap-2">
                    <div className="flex items-center gap-1.5">
                      {isAnalyzing && <span className="w-1.5 h-1.5 bg-accent animate-pulse-dot" />}
                      <h3 className="text-xs font-semibold text-foreground-muted uppercase tracking-wider">Agent Feed</h3>
                    </div>
                    {allAnalyses.length > 0 && (
                      <span className="ml-auto text-[10px] font-mono text-foreground-muted">
                        {allAnalyses[allAnalyses.length - 1].timestamp
                          ? new Date(allAnalyses[allAnalyses.length - 1].timestamp).toLocaleTimeString()
                          : ''}
                      </span>
                    )}
                  </div>
                  <div className="h-[280px]">
                    <AgentFeed messages={agentMessages} />
                  </div>
                </div>

                <TelemetryPanel current={telemetry} isActive={isAnalyzing} />
                <TimelineChart history={telemetryHistory} isActive={isAnalyzing} />

                {allAnalyses.length > 0 && (
                  <div className="bg-surface border border-border">
                    <div className="px-4 py-3 border-b border-border">
                      <h4 className="text-xs font-semibold text-foreground-muted uppercase tracking-wider">Session Statistics</h4>
                    </div>
                    <div className="p-4">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-background/50 border border-border p-3 relative overflow-hidden">
                          <div className="absolute top-0 right-0 w-16 h-16 bg-accent/5 blur-2xl" />
                          <div className="text-xl font-mono font-bold text-accent relative">{allAnalyses.length}</div>
                          <div className="text-[10px] text-foreground-muted mt-0.5 relative">Frames Analyzed</div>
                        </div>
                        <div className="bg-background/50 border border-border p-3 relative overflow-hidden">
                          <div className="absolute top-0 right-0 w-16 h-16 bg-accent/5 blur-2xl" />
                          <div className="text-xl font-mono font-bold text-accent relative">
                            {Math.round(allAnalyses.reduce((s, a) => s + a.arbiter.qualityScore, 0) / allAnalyses.length)}
                          </div>
                          <div className="text-[10px] text-foreground-muted mt-0.5 relative">Avg Quality Score</div>
                        </div>
                        <div className="bg-background/50 border border-border p-3 relative overflow-hidden">
                          <div className="absolute top-0 right-0 w-16 h-16 bg-warning/10 blur-2xl" />
                          <div className="text-xl font-mono font-bold text-warning relative">
                            {allAnalyses.filter(a => a.arbiter.escalationLevel !== 'NONE').length}
                          </div>
                          <div className="text-[10px] text-foreground-muted mt-0.5 relative">Escalations</div>
                        </div>
                        <div className="bg-background/50 border border-border p-3 relative overflow-hidden">
                          <div className="absolute top-0 right-0 w-16 h-16 bg-success/10 blur-2xl" />
                          <div className="text-xl font-mono font-bold text-success relative">
                            {allAnalyses.filter(a => a.arbiter.verdict === 'SAFE').length}
                          </div>
                          <div className="text-[10px] text-foreground-muted mt-0.5 relative">Safe Frames</div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      {phase !== 'setup' && (
        <div className="border-t border-border bg-surface/50">
          <div className="max-w-[1600px] mx-auto px-4 sm:px-6 h-10 flex items-center justify-between">
            <div className="flex items-center gap-3 text-[10px] font-mono text-foreground-muted">
              <span>MediCast v1.0.0</span>
              <span className="w-px h-3 bg-border" />
              <span>Powered by AMD Instinct MI300X</span>
            </div>
            <div className="flex items-center gap-2 text-[10px] font-mono text-foreground-muted">
              <Gauge className="w-3 h-3" />
              <span>Autonomous Surgical Video Intelligence</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}