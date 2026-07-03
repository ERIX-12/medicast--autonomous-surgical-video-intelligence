import { AlertTriangle, XCircle, BellRing, X } from 'lucide-react';
import { useState, useEffect } from 'react';
import type { ArbiterVerdict } from '../hooks/useAnalysisEngine';

interface Props {
  latestVerdict: ArbiterVerdict | null;
  isAnalyzing: boolean;
}

export default function AlertBanner({ latestVerdict, isAnalyzing }: Props) {
  const [dismissed, setDismissed] = useState(false);
  const [visible, setVisible] = useState(false);

  // Track alert identity so re-show works on new escalation
  const [alertKey, setAlertKey] = useState(0);

  useEffect(() => {
    if (!isAnalyzing || !latestVerdict) {
      setVisible(false);
      setDismissed(false);
      return;
    }

    const isCritical = latestVerdict.escalationLevel === 'CRITICAL';
    const isWarning = latestVerdict.escalationLevel === 'WARNING';

    if (!isCritical && !isWarning) {
      setVisible(false);
      return;
    }

    // New alert — reset dismiss state
    setAlertKey(k => k + 1);
    setDismissed(false);
    setVisible(true);
  }, [latestVerdict, isAnalyzing]);

  if (!visible || dismissed || !latestVerdict) return null;

  const isCritical = latestVerdict.escalationLevel === 'CRITICAL';
  const isWarning = latestVerdict.escalationLevel === 'WARNING';
  if (!isCritical && !isWarning) return null;

  return (
    <div
      key={alertKey}
      className={`flex items-center gap-3 px-4 py-2.5 border-b transition-all duration-300 animate-slide-down
        ${isCritical
          ? 'bg-critical/10 border-critical/40 animate-pulse-glow'
          : 'bg-warning/10 border-warning/40'
        }`}
    >
      {isCritical ? (
        <XCircle className="w-5 h-5 text-critical shrink-0" />
      ) : (
        <AlertTriangle className="w-5 h-5 text-warning shrink-0" />
      )}
      <div className="flex-1 min-w-0">
        <div className={`text-xs font-bold tracking-wider uppercase ${isCritical ? 'text-critical' : 'text-warning'}`}>
          {isCritical ? 'CRITICAL ALERT — Required Action' : 'WARNING — Caution Advised'}
        </div>
        <p className="text-xs text-foreground/80 mt-0.5 leading-relaxed">
          {latestVerdict.escalationReason}
        </p>
      </div>
      <div className="flex items-center gap-2">
        <BellRing className={`w-4 h-4 shrink-0 ${isCritical ? 'text-critical animate-pulse' : 'text-warning'}`} />
        <button
          onClick={() => setDismissed(true)}
          className="p-1 text-foreground-muted hover:text-foreground transition-colors cursor-pointer"
          aria-label="Dismiss alert"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}