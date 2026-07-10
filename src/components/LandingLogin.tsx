import { useState } from 'react';
import { Zap, Lock, Shield, Activity, Fingerprint } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function LandingLogin() {
  const { signIn, signUp } = useAuth();
  const [email, setEmail] = useState('surgeon@hospital.org');
  const [password, setPassword] = useState('password123');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    // Simulate real SSO login delay
    setTimeout(async () => {
      let result = await signIn(email, password);
      if (result.error) {
        // Auto-signup for hackathon demo if account doesn't exist
        const signUpResult = await signUp(email, password);
        if (signUpResult.error) {
          setError(signUpResult.error);
        }
      }
      setLoading(false);
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-[#0a0a0c] text-foreground flex items-center justify-center relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(14,165,233,0.1)_0%,transparent_50%)]" />
        <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-accent/50 to-transparent" />
      </div>

      <div className="relative z-10 w-full max-w-md p-8">
        <div className="flex flex-col items-center mb-10">
          <div className="w-16 h-16 bg-accent/10 border border-accent/30 flex items-center justify-center relative overflow-hidden mb-6 shadow-[0_0_30px_rgba(14,165,233,0.2)]">
            <div className="absolute inset-0 bg-accent/5 animate-pulse" />
            <Zap className="w-8 h-8 text-accent relative z-10" />
          </div>
          <h1 className="text-3xl font-bold font-heading tracking-widest text-foreground text-center">MEDICAST</h1>
          <p className="text-xs text-accent font-mono tracking-[0.3em] uppercase mt-2 text-center">
            Autonomous Surgical Intelligence
          </p>
        </div>

        <div className="bg-surface/80 backdrop-blur-xl border border-border p-6 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-accent/0 via-accent to-accent/0" />
          
          <div className="flex items-center gap-2 mb-6 border-b border-border/50 pb-4">
            <Lock className="w-4 h-4 text-foreground-muted" />
            <span className="text-xs font-mono text-foreground-muted uppercase tracking-wider">Hospital SSO Gateway</span>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-[10px] font-mono text-foreground-muted uppercase tracking-wider mb-1.5">
                Staff ID / Email
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full bg-background border border-border px-3 py-2 text-sm font-mono text-foreground focus:outline-none focus:border-accent transition-colors"
                required
              />
            </div>
            <div>
              <label className="block text-[10px] font-mono text-foreground-muted uppercase tracking-wider mb-1.5">
                Passcode
              </label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full bg-background border border-border px-3 py-2 text-sm font-mono text-foreground focus:outline-none focus:border-accent transition-colors"
                required
              />
            </div>
            
            {error && (
              <div className="text-[10px] font-mono text-critical bg-critical/10 border border-critical/20 p-2">
                {error}
              </div>
            )}
            
            <button
              type="submit"
              disabled={loading}
              className={`w-full h-10 mt-2 bg-accent text-background font-bold text-sm uppercase tracking-wider transition-all flex items-center justify-center gap-2
                ${loading ? 'opacity-80 cursor-wait' : 'hover:bg-accent-hover hover:shadow-[0_0_20px_rgba(14,165,233,0.3)]'}
              `}
            >
              {loading ? (
                <>
                  <Activity className="w-4 h-4 animate-pulse" />
                  Authenticating...
                </>
              ) : (
                <>
                  <Fingerprint className="w-4 h-4" />
                  Access System
                </>
              )}
            </button>
          </form>
        </div>
        
        <div className="mt-8 flex items-center justify-center gap-4 text-[10px] font-mono text-foreground-muted/50 uppercase tracking-widest">
          <span className="flex items-center gap-1.5"><Shield className="w-3 h-3" /> HIPAA Compliant</span>
          <span>•</span>
          <span>Powered by AMD</span>
        </div>
      </div>
    </div>
  );
}
