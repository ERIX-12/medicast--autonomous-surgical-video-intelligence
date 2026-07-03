import { useEffect, useState } from 'react';
import { History, Play, Clock, Activity, Trash2, AlertTriangle, Shield } from 'lucide-react';
import { supabase } from '../config/supabase';

interface SessionRecord {
  id: string;
  procedure_type: string | null;
  status: string;
  video_name: string | null;
  created_at: string;
  frame_count?: number;
  escalation_count?: number;
  avg_quality?: number;
}

interface SessionHistoryProps {
  onLoadSession?: (sessionId: string) => void;
}

export default function SessionHistory({ onLoadSession }: SessionHistoryProps) {
  const [sessions, setSessions] = useState<SessionRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    const fetchSessions = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('sessions')
        .select(`
          id,
          procedure_type,
          status,
          video_name,
          created_at,
          frame_analyses:frame_analyses(
            escalation_level,
            arbiter_verdict
          )
        `)
        .order('created_at', { ascending: false })
        .limit(20);

      if (!error && data) {
        const mapped: SessionRecord[] = data.map((s: Record<string, unknown>) => {
          const frames = (s.frame_analyses as Array<Record<string, unknown>>) || [];
          const escalations = frames.filter(
            (f: Record<string, unknown>) => f.escalation_level && f.escalation_level !== 'NORMAL'
          ).length;
          const qualityScores = frames
            .map((f: Record<string, unknown>) => (f.arbiter_verdict as Record<string, unknown>)?.qualityScore as number)
            .filter((q: number) => q !== undefined);
          const avgQuality = qualityScores.length > 0
            ? Math.round(qualityScores.reduce((a: number, b: number) => a + b, 0) / qualityScores.length)
            : 0;

          return {
            id: s.id as string,
            procedure_type: s.procedure_type as string | null,
            status: s.status as string,
            video_name: s.video_name as string | null,
            created_at: s.created_at as string,
            frame_count: frames.length,
            escalation_count: escalations,
            avg_quality: avgQuality,
          };
        });
        setSessions(mapped);
      }
      setLoading(false);
    };

    fetchSessions();
  }, []);

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await supabase.from('sessions').delete().eq('id', id);
    setSessions(prev => prev.filter(s => s.id !== id));
  };

  const statusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-success';
      case 'analyzing': return 'text-accent';
      case 'failed': return 'text-critical';
      default: return 'text-foreground-muted';
    }
  };

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  if (loading) {
    return (
      <div className="bg-surface border border-border">
        <div className="px-4 py-3 border-b border-border flex items-center gap-2">
          <History className="w-4 h-4 text-accent" />
          <h3 className="text-xs font-semibold text-foreground-muted uppercase tracking-wider">Session History</h3>
        </div>
        <div className="p-6 space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="animate-shimmer h-12" />
          ))}
        </div>
      </div>
    );
  }

  if (sessions.length === 0) {
    return (
      <div className="bg-surface border border-border">
        <div className="px-4 py-3 border-b border-border flex items-center gap-2">
          <History className="w-4 h-4 text-accent" />
          <h3 className="text-xs font-semibold text-foreground-muted uppercase tracking-wider">Session History</h3>
        </div>
        <div className="p-6 text-center">
          <div className="w-10 h-10 mx-auto mb-3 bg-accent/5 border border-accent/20 flex items-center justify-center">
            <Clock className="w-5 h-5 text-accent/40" />
          </div>
          <p className="text-xs text-foreground-muted">No past sessions yet</p>
          <p className="text-[10px] font-mono text-foreground-muted/50 mt-1">
            Completed analyses will appear here
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-surface border border-border">
      {/* Header */}
      <div className="px-4 py-3 border-b border-border flex items-center gap-2">
        <History className="w-4 h-4 text-accent" />
        <h3 className="text-xs font-semibold text-foreground-muted uppercase tracking-wider">Session History</h3>
        <span className="ml-auto text-[10px] font-mono text-foreground-muted">{sessions.length} sessions</span>
      </div>

      {/* List */}
      <div className="max-h-[400px] overflow-y-auto">
        {sessions.map(session => (
          <div key={session.id}>
            <button
              onClick={() => setExpandedId(expandedId === session.id ? null : session.id)}
              className="w-full flex items-center gap-3 px-4 py-3 border-b border-border/50
                         hover:bg-surface-hover transition-colors text-left cursor-pointer"
            >
              {/* Status dot */}
              <span className={`w-1.5 h-1.5 shrink-0 ${statusColor(session.status)}`} />

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-foreground truncate">
                  {session.procedure_type || 'Unknown Procedure'}
                </p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-[9px] font-mono text-foreground-muted">
                    {formatDate(session.created_at)}
                  </span>
                  {session.video_name && (
                    <>
                      <span className="w-px h-2.5 bg-border" />
                      <span className="text-[9px] font-mono text-foreground-muted truncate">
                        {session.video_name}
                      </span>
                    </>
                  )}
                </div>
              </div>

              {/* Badges */}
              <div className="flex items-center gap-1.5 shrink-0">
                {session.frame_count !== undefined && session.frame_count > 0 && (
                  <span className="text-[9px] font-mono px-1.5 py-0.5 bg-accent/5 border border-accent/20 text-accent">
                    {session.frame_count}
                  </span>
                )}
                {session.escalation_count && session.escalation_count > 0 && (
                  <span className="text-[9px] font-mono px-1.5 py-0.5 bg-critical/5 border border-critical/20 text-critical">
                    !{session.escalation_count}
                  </span>
                )}
                {session.avg_quality && session.avg_quality > 0 && (
                  <span className="text-[9px] font-mono px-1.5 py-0.5 bg-success/5 border border-success/20 text-success">
                    {session.avg_quality}
                  </span>
                )}
              </div>
            </button>

            {/* Expanded actions */}
            {expandedId === session.id && (
              <div className="px-4 py-2 bg-background/50 border-b border-border/50 flex items-center gap-2 animate-slide-down">
                <button
                  onClick={() => onLoadSession?.(session.id)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-accent/10 border border-accent/30
                             text-accent text-[10px] font-mono hover:bg-accent/20 transition-colors cursor-pointer"
                >
                  <Play className="w-3 h-3" />
                  Review
                </button>
                {session.status === 'completed' && (
                  <span className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-mono text-success">
                    <Shield className="w-3 h-3" />
                    Verified
                  </span>
                )}
                {session.escalation_count && session.escalation_count > 0 && (
                  <span className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-mono text-warning">
                    <AlertTriangle className="w-3 h-3" />
                    {session.escalation_count} alerts
                  </span>
                )}
                <button
                  onClick={(e) => handleDelete(session.id, e)}
                  className="ml-auto flex items-center gap-1.5 px-3 py-1.5 bg-critical/10 border border-critical/30
                             text-critical text-[10px] font-mono hover:bg-critical/20 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3 h-3" />
                  Delete
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}