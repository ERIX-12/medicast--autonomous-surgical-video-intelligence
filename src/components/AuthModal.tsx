import { useState } from 'react';
import { X, Mail, Lock, Eye, EyeOff, LogIn, UserPlus, Zap } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface AuthModalProps {
  onClose: () => void;
}

export default function AuthModal({ onClose }: AuthModalProps) {
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    const action = mode === 'login' ? signIn : signUp;
    const { error: err } = await action(email, password);

    setLoading(false);

    if (err) {
      setError(err);
    } else if (mode === 'signup') {
      setSuccess('Account created! You can now sign in.');
    } else {
      onClose();
    }
  };

  const toggleMode = () => {
    setMode(m => (m === 'login' ? 'signup' : 'login'));
    setError(null);
    setSuccess(null);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-sm bg-surface border border-border animate-fade-in-up">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 bg-accent/10 border border-accent/30 flex items-center justify-center">
              <Zap className="w-3.5 h-3.5 text-accent" />
            </div>
            <div>
              <p className="text-xs font-bold font-heading text-foreground leading-none">
                {mode === 'login' ? 'SIGN IN' : 'CREATE ACCOUNT'}
              </p>
              <p className="text-[8px] font-mono text-foreground-muted tracking-wider leading-tight mt-0.5">
                MEDICAST AUTH
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-foreground-muted hover:text-accent transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Email */}
          <div>
            <label className="block text-[10px] font-mono text-foreground-muted uppercase tracking-wider mb-1.5">
              Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-foreground-muted" />
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="surgeon@hospital.com"
                required
                className="w-full pl-9 pr-3 py-2.5 bg-background border border-border text-xs text-foreground
                           placeholder:text-foreground-muted/40 font-mono
                           focus:border-accent focus:outline-none transition-colors"
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="block text-[10px] font-mono text-foreground-muted uppercase tracking-wider mb-1.5">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-foreground-muted" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                minLength={6}
                className="w-full pl-9 pr-10 py-2.5 bg-background border border-border text-xs text-foreground
                           placeholder:text-foreground-muted/40 font-mono
                           focus:border-accent focus:outline-none transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground-muted hover:text-accent transition-colors cursor-pointer"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          {/* Error / Success */}
          {error && (
            <div className="bg-critical/5 border border-critical/20 px-3 py-2">
              <p className="text-[11px] font-mono text-critical">{error}</p>
            </div>
          )}
          {success && (
            <div className="bg-success/5 border border-success/20 px-3 py-2">
              <p className="text-[11px] font-mono text-success">{success}</p>
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-2.5
                       bg-accent/10 border border-accent/40 text-accent
                       text-xs font-semibold uppercase tracking-wider
                       hover:bg-accent/20 hover:border-accent/60
                       transition-all duration-200 cursor-pointer
                       disabled:opacity-30 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="w-3.5 h-3.5 border border-accent/60 border-t-transparent rounded-full animate-spin" />
            ) : mode === 'login' ? (
              <LogIn className="w-3.5 h-3.5" />
            ) : (
              <UserPlus className="w-3.5 h-3.5" />
            )}
            {mode === 'login' ? 'Sign In' : 'Create Account'}
          </button>

          {/* Toggle */}
          <p className="text-[10px] font-mono text-foreground-muted text-center">
            {mode === 'login' ? (
              <>Don't have an account?{' '}
                <button type="button" onClick={toggleMode} className="text-accent hover:underline cursor-pointer">
                  Sign up
                </button>
              </>
            ) : (
              <>Already have an account?{' '}
                <button type="button" onClick={toggleMode} className="text-accent hover:underline cursor-pointer">
                  Sign in
                </button>
              </>
            )}
          </p>

          {/* Demo hint */}
          <div className="pt-2 text-center">
            <p className="text-[9px] font-mono text-foreground-muted/50">
              Accounts are auto-confirmed in development mode
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}