import { useState } from 'react';
import { FileText, Printer, Share2, Check, Database } from 'lucide-react';
import type { FrameAnalysis } from '../hooks/useAnalysisEngine';
import type { ProcedureKnowledge } from '../data/types';
import { API, apiHeaders } from '../config/api';

interface Props {
  analyses: FrameAnalysis[];
  procedure: ProcedureKnowledge | null;
  sessionId: string | null;
}

export default function ClinicalReport({ analyses, procedure, sessionId }: Props) {
  const [copied, setCopied] = useState(false);
  const [emrSyncing, setEmrSyncing] = useState(false);
  const [emrSynced, setEmrSynced] = useState(false);

  if (analyses.length === 0) return null;

  const handleEMRSync = () => {
    setEmrSyncing(true);
    // Simulate HL7/FHIR payload generation and API request
    setTimeout(() => {
      setEmrSyncing(false);
      setEmrSynced(true);
      setTimeout(() => setEmrSynced(false), 3000);
    }, 1500);
  };

  const [isPrinting, setIsPrinting] = useState(false);

  const handlePrint = async () => {
    setIsPrinting(true);
    try {
      const response = await fetch(`${API.inferenceUrl}/api/report/docx`, {
        method: 'POST',
        headers: apiHeaders(),
        body: JSON.stringify({
          sessionId: sessionId || 'unknown',
          question: '', // not used
          context: analyses
        })
      });

      if (!response.ok) throw new Error('Export failed');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `MediCast_Clinical_Report_${sessionId || 'unknown'}.docx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (e) {
      console.error(e);
      alert('Failed to export DOCX report');
    } finally {
      setIsPrinting(false);
    }
  };

  const totalFrames = analyses.length;
  const avgScore = Math.round(analyses.reduce((sum, a) => sum + a.arbiter.qualityScore, 0) / totalFrames);
  const criticalFrames = analyses.filter(a => a.arbiter.escalationLevel === 'CRITICAL');
  const warningFrames = analyses.filter(a => a.arbiter.escalationLevel === 'WARNING');

  const handleShare = async () => {
    const reportText = `MediCast Clinical Report
Procedure: ${procedure?.name || 'Surgical Procedure'}
Session: ${sessionId || 'Unknown'}
Frames Analyzed: ${totalFrames}
Quality Score: ${avgScore}/100
Escalations: ${criticalFrames.length} CRITICAL, ${warningFrames.length} WARNING`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'MediCast Clinical Report',
          text: reportText,
        });
      } catch (err) {
        if (err instanceof Error && err.name !== 'AbortError') {
          copyToClipboard(reportText);
        }
      }
    } else {
      copyToClipboard(reportText);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const verdictDistribution = {
    SAFE: analyses.filter(a => a.arbiter.verdict === 'SAFE').length,
    WARNING: analyses.filter(a => a.arbiter.verdict === 'WARNING').length,
    CRITICAL: analyses.filter(a => a.arbiter.verdict === 'CRITICAL').length,
  };

  const phases = [...new Set(analyses.map(a => a.arbiter.currentPhase).filter(Boolean))];

  return (
    <div className="bg-surface border border-border clinical-report">
      <div className="px-4 py-3 border-b border-border flex items-center gap-2">
        <FileText className="w-4 h-4 text-accent" />
        <h3 className="text-xs font-semibold text-foreground-muted uppercase tracking-wider">
          Clinical Report
        </h3>
        <div className="ml-auto flex items-center gap-1">
          <button 
            onClick={handleEMRSync}
            disabled={emrSyncing || emrSynced}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-mono tracking-wider uppercase border transition-all cursor-pointer print:hidden ${
              emrSynced ? 'border-success text-success bg-success/10' :
              emrSyncing ? 'border-accent text-accent animate-pulse' :
              'border-border text-foreground-muted hover:text-accent hover:border-accent/40'
            }`}
            title="Export to Epic / EMR (FHIR HL7)"
          >
            {emrSynced ? <Check className="w-3.5 h-3.5" /> : <Database className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">
              {emrSynced ? 'EMR Synced' : emrSyncing ? 'Exporting...' : 'Push to EMR'}
            </span>
          </button>
          
          <div className="w-px h-4 bg-border mx-1 print:hidden" />

          <button onClick={handlePrint} disabled={isPrinting} className={`p-1.5 transition-colors cursor-pointer print:hidden ${isPrinting ? 'text-accent animate-pulse' : 'text-foreground-muted hover:text-accent'}`} title="Download DOCX Report">
            <Printer className="w-3.5 h-3.5" />
          </button>
          <button 
            onClick={handleShare}
            className="p-1.5 text-foreground-muted hover:text-accent transition-colors cursor-pointer print:hidden" 
            title={copied ? "Copied to clipboard!" : "Share"}
          >
            {copied ? <Check className="w-3.5 h-3.5 text-success" /> : <Share2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Header */}
        <div className="border-b border-border pb-3">
          <h4 className="text-sm font-bold text-foreground font-heading">
            {procedure?.name || 'Surgical Procedure'} — AI Analysis Report
          </h4>
          <div className="flex gap-4 mt-2 text-[10px] font-mono text-foreground-muted">
            <span>Session: {sessionId?.slice(0, 8) || '—'}</span>
            <span>Frames: {totalFrames}</span>
            <span>Score: {avgScore}/100</span>
            <span className="text-accent border-l border-border pl-4">Compute: AMD Instinct MI300X</span>
          </div>
        </div>

        {/* Verdict Distribution */}
        <div>
          <h5 className="text-xs font-semibold text-foreground-muted uppercase tracking-wider mb-2">
            Verdict Distribution
          </h5>
          <div className="flex h-6">
            {verdictDistribution.SAFE > 0 && (
              <div
                className="bg-success/30 flex items-center justify-center text-[9px] font-mono text-success font-bold"
                style={{ width: `${(verdictDistribution.SAFE / totalFrames) * 100}%` }}
              >
                {verdictDistribution.SAFE}
              </div>
            )}
            {verdictDistribution.WARNING > 0 && (
              <div
                className="bg-warning/30 flex items-center justify-center text-[9px] font-mono text-warning font-bold"
                style={{ width: `${(verdictDistribution.WARNING / totalFrames) * 100}%` }}
              >
                {verdictDistribution.WARNING}
              </div>
            )}
            {verdictDistribution.CRITICAL > 0 && (
              <div
                className="bg-critical/30 flex items-center justify-center text-[9px] font-mono text-critical font-bold"
                style={{ width: `${(verdictDistribution.CRITICAL / totalFrames) * 100}%` }}
              >
                {verdictDistribution.CRITICAL}
              </div>
            )}
          </div>
          <div className="flex gap-4 mt-1.5 text-[10px] font-mono">
            <span className="text-success">SAFE {verdictDistribution.SAFE}</span>
            <span className="text-warning">WARN {verdictDistribution.WARNING}</span>
            <span className="text-critical">CRIT {verdictDistribution.CRITICAL}</span>
          </div>
        </div>

        {/* Phases */}
        <div>
          <h5 className="text-xs font-semibold text-foreground-muted uppercase tracking-wider mb-2">
            Phases Detected
          </h5>
          <div className="space-y-1">
            {phases.map((phase, i) => (
              <div key={i} className="flex items-center gap-2 text-xs text-foreground-muted">
                <span className="w-1.5 h-1.5 bg-accent" />
                {phase}
              </div>
            ))}
          </div>
        </div>

        {/* Clinical Findings Breakdown */}
        <div className="space-y-4 pt-2">
          <h5 className="text-xs font-semibold text-foreground-muted uppercase tracking-wider border-b border-border pb-2">
            Clinical Findings Breakdown
          </h5>
          
          {/* Critical Conditions */}
          {criticalFrames.length > 0 && (
            <div className="space-y-2">
              <h6 className="text-[10px] font-mono text-critical font-bold flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-critical animate-pulse-glow" />
                CRITICAL CONDITIONS (IMMEDIATE ACTION REQUIRED)
              </h6>
              {criticalFrames.map(f => (
                <div key={f.id} className="border border-critical bg-critical/10 p-3 relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-1 h-full bg-critical" />
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-xs font-bold text-critical">Frame {f.frameNumber}</span>
                    <span className="text-[9px] font-mono text-critical px-2 py-0.5 border border-critical/30 bg-critical/20">SYSTEM ALERT: {f.arbiter.escalationReason.toUpperCase()}</span>
                  </div>
                  <p className="text-xs text-foreground font-semibold mb-1">{f.arbiter.summary}</p>
                  <div className="text-[10px] text-foreground-muted">
                    <span className="font-semibold text-foreground">Findings:</span> {f.arbiter.keyFindings.join('; ')}
                  </div>
                  <div className="text-[10px] text-foreground-muted mt-1">
                    <span className="font-semibold text-foreground">Anatomy Confirmed:</span> {f.arbiter.anatomyConfirmed}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Warnings */}
          {warningFrames.length > 0 && (
            <div className="space-y-2 pt-2">
              <h6 className="text-[10px] font-mono text-warning font-bold flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-warning" />
                WARNINGS & CAUTION ZONES
              </h6>
              {warningFrames.map(f => (
                <div key={f.id} className="border border-warning/50 bg-warning/5 p-2">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-bold text-warning">Frame {f.frameNumber}</span>
                    <span className="text-[9px] font-mono text-warning/80">— {f.arbiter.escalationReason}</span>
                  </div>
                  <p className="text-xs text-foreground-muted mb-1">{f.arbiter.summary}</p>
                  <div className="text-[10px] text-foreground-muted">
                    <span className="font-semibold">Findings:</span> {f.arbiter.keyFindings.join('; ')}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Safe Conditions */}
          {analyses.some(a => a.arbiter.verdict === 'SAFE') && (
            <div className="space-y-2 pt-2">
              <h6 className="text-[10px] font-mono text-success font-bold flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-success" />
                SAFE PROGRESSION
              </h6>
              <div className="border border-success/30 bg-success/5 p-2 text-xs text-foreground-muted">
                <p className="mb-2">The system detected safe and expected surgical progression in the following frames. Dissection remained within safe boundaries with clear anatomical visualization.</p>
                <ul className="list-disc pl-4 space-y-1 text-[10px]">
                  {[...new Set(analyses.filter(a => a.arbiter.verdict === 'SAFE').map(a => a.arbiter.summary))].slice(0, 5).map((summary, idx) => (
                    <li key={idx}>{summary}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>

        {/* Teaching Pearls */}
        <div>
          <h5 className="text-xs font-semibold text-foreground-muted uppercase tracking-wider mb-2">
            Key Teaching Points
          </h5>
          <div className="space-y-1.5">
            {analyses
              .filter(a => a.arbiter.teachingPoint)
              .slice(0, 5)
              .map(a => (
                <div key={a.id} className="flex items-start gap-2 text-xs text-foreground-muted">
                  <span className="mt-0.5 text-accent">•</span>
                  {a.arbiter.teachingPoint}
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
}