import { useState, useRef, useEffect } from 'react';
import { MessageSquare, Send, Sparkles, User, Loader2, Zap, Download } from 'lucide-react';
import { API, apiHeaders } from '../config/api';
import type { FrameAnalysis } from '../hooks/useAnalysisEngine';

interface Props {
  analyses: FrameAnalysis[];
  sessionId: string;
}

interface ChatMessage {
  role: 'user' | 'ai';
  content: string;
}

const SUGGESTED_QUESTIONS = [
  "Give me a full summary",
  "What critical events occurred?",
  "Show me the safety report",
  "What anatomy was identified?",
  "Quality score & recommendations",
  "What phases were observed?",
];

function renderMarkdown(text: string) {
  // Simple markdown renderer for bold, bullets, headers, and newlines
  const lines = text.split('\n');
  return lines.map((line, i) => {
    // Headers
    if (line.startsWith('**') && line.endsWith('**')) {
      return <h4 key={i} className="text-accent font-bold text-sm mt-2 mb-1">{line.replace(/\*\*/g, '')}</h4>;
    }
    // Bold text within lines
    const parts = line.split(/(\*\*.*?\*\*)/g);
    const rendered = parts.map((part, j) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={j} className="text-foreground font-semibold">{part.replace(/\*\*/g, '')}</strong>;
      }
      return part;
    });

    // Bullets
    if (line.trim().startsWith('•') || line.trim().startsWith('-')) {
      return <div key={i} className="pl-3 py-0.5 text-foreground-muted flex gap-1.5"><span className="text-accent shrink-0">•</span><span>{rendered}</span></div>;
    }
    // Numbered items
    if (/^\d+\./.test(line.trim())) {
      return <div key={i} className="pl-3 py-0.5 text-foreground-muted">{rendered}</div>;
    }
    // Empty lines
    if (!line.trim()) {
      return <div key={i} className="h-2" />;
    }
    return <div key={i} className="py-0.5">{rendered}</div>;
  });
}

export default function DebriefChat({ analyses, sessionId }: Props) {
  const criticalCount = analyses.filter(a => a.arbiter.escalationLevel === 'CRITICAL').length;
  const warningCount = analyses.filter(a => a.arbiter.escalationLevel === 'WARNING').length;

  const [messages, setMessages] = useState<ChatMessage[]>([{
    role: 'ai',
    content: `Surgery analysis complete. I analyzed **${analyses.length} frames** and logged **${criticalCount} Critical Alerts** and **${warningCount} Warnings**.\n\nI can provide detailed analysis on safety events, anatomical identification, surgical phases, quality metrics, and teaching points.\n\nWhat would you like to review?`
  }]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async (text?: string) => {
    const userMessage = (text || input).trim();
    if (!userMessage || isTyping) return;

    setInput('');
    setShowSuggestions(false);
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsTyping(true);

    try {
      const response = await fetch(`${API.inferenceUrl}/api/debrief`, {
        method: 'POST',
        headers: apiHeaders(),
        body: JSON.stringify({
          sessionId,
          question: userMessage,
          context: analyses.slice(-50)
        })
      });

      if (!response.ok) throw new Error('API Error');
      
      const data = await response.json();
      setMessages(prev => [...prev, { role: 'ai', content: data.reply }]);
    } catch (e) {
      setMessages(prev => [...prev, { 
        role: 'ai', 
        content: 'I am having trouble connecting to the inference server. Please ensure the backend is running at ' + API.inferenceUrl 
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleExport = async (format: 'pdf' | 'docx') => {
    try {
      const response = await fetch(`${API.inferenceUrl}/api/report/${format}`, {
        method: 'POST',
        headers: apiHeaders(),
        body: JSON.stringify({
          sessionId,
          question: '', // not used
          context: analyses
        })
      });

      if (!response.ok) throw new Error('Export failed');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `MediCast_Report_${sessionId}.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (e) {
      console.error(e);
      alert('Failed to export report');
    }
  };

  return (
    <div className="bg-surface border border-border mt-5 print:hidden">
      <div className="px-4 py-3 border-b border-border flex items-center gap-2">
        <MessageSquare className="w-4 h-4 text-accent" />
        <h3 className="text-xs font-semibold text-foreground-muted uppercase tracking-wider">
          Interactive Debrief
        </h3>
        <div className="ml-auto flex items-center gap-2">
          <button 
            onClick={() => handleExport('pdf')}
            className="text-[10px] font-mono text-accent flex items-center gap-1 hover:bg-accent/20 bg-accent/10 px-2 py-0.5 rounded border border-accent/20 transition-colors"
            title="Export Medical Report as PDF"
          >
            <Download className="w-3 h-3" />
            PDF
          </button>
          <button 
            onClick={() => handleExport('docx')}
            className="text-[10px] font-mono text-accent flex items-center gap-1 hover:bg-accent/20 bg-accent/10 px-2 py-0.5 rounded border border-accent/20 transition-colors"
            title="Export Medical Report as DOCX"
          >
            <Download className="w-3 h-3" />
            DOCX
          </button>
          <span className="text-[10px] font-mono text-accent flex items-center gap-1 bg-accent/10 px-2 py-0.5 rounded border border-accent/20">
            <Sparkles className="w-3 h-3" />
            AI-Powered Analysis
          </span>
        </div>
      </div>

      <div 
        ref={scrollRef}
        className="h-[320px] overflow-y-auto p-4 space-y-4"
      >
        {messages.map((msg, i) => (
          <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : ''}`}>
            {msg.role === 'ai' && (
              <div className="w-6 h-6 rounded-sm bg-accent/20 border border-accent/40 flex items-center justify-center shrink-0 mt-1">
                <Sparkles className="w-3.5 h-3.5 text-accent" />
              </div>
            )}
            
            <div className={`text-sm max-w-[85%] leading-relaxed shadow-sm ${
              msg.role === 'user' 
                ? 'bg-foreground text-background font-medium rounded-l-md rounded-br-md p-3' 
                : 'bg-background border border-border text-foreground rounded-r-md rounded-bl-md p-3'
            }`}>
              {msg.role === 'ai' ? renderMarkdown(msg.content) : msg.content}
            </div>

            {msg.role === 'user' && (
              <div className="w-6 h-6 rounded-sm bg-foreground/10 border border-border flex items-center justify-center shrink-0 mt-1">
                <User className="w-3.5 h-3.5 text-foreground-muted" />
              </div>
            )}
          </div>
        ))}

        {/* Suggested Questions */}
        {showSuggestions && !isTyping && messages.length <= 1 && (
          <div className="flex flex-wrap gap-2 pt-2">
            {SUGGESTED_QUESTIONS.map((q, i) => (
              <button
                key={i}
                onClick={() => handleSend(q)}
                className="text-xs px-3 py-1.5 bg-accent/10 border border-accent/25 text-accent hover:bg-accent/20 hover:border-accent/40 transition-all duration-200 rounded-sm flex items-center gap-1.5 cursor-pointer"
              >
                <Zap className="w-3 h-3" />
                {q}
              </button>
            ))}
          </div>
        )}

        {isTyping && (
          <div className="flex gap-3">
            <div className="w-6 h-6 rounded-sm bg-accent/20 border border-accent/40 flex items-center justify-center shrink-0">
              <Sparkles className="w-3.5 h-3.5 text-accent" />
            </div>
            <div className="text-sm p-3 bg-background border border-border text-foreground-muted rounded-r-md rounded-bl-md flex items-center gap-2">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              Analyzing surgical context...
            </div>
          </div>
        )}
      </div>

      <div className="p-3 border-t border-border bg-background/50">
        <form 
          onSubmit={(e) => { e.preventDefault(); handleSend(); }}
          className="relative flex items-center"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about safety events, anatomy, phases, quality..."
            className="w-full bg-surface border border-border text-sm text-foreground px-4 py-2.5 outline-none focus:border-accent transition-colors"
            disabled={isTyping}
          />
          <button
            type="submit"
            disabled={!input.trim() || isTyping}
            className="absolute right-2 p-1.5 text-foreground-muted hover:text-accent disabled:opacity-50 disabled:hover:text-foreground-muted transition-colors cursor-pointer"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
