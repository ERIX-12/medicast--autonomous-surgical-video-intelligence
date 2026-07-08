import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';
import { API, apiHeaders } from '../config/api';

export interface AuthState {
  user: { id: string; email: string } | null;
  loading: boolean;
}

export interface AuthActions {
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => void;
  /** Return the stored JWT for use in Authorization headers */
  getToken: () => string | null;
}

type AuthContextValue = AuthState & AuthActions;

const AuthContext = createContext<AuthContextValue | null>(null);

/** Storage key for the JWT token */
const TOKEN_KEY = 'medicast_auth_token';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<{ id: string; email: string } | null>(null);
  const [loading, setLoading] = useState(true);

  /** Verify stored token on mount */
  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) {
      setLoading(false);
      return;
    }

    fetch(`${API.inferenceUrl}/api/auth/me`, {
      headers: {
        ...apiHeaders(),
        Authorization: `Bearer ${token}`,
      },
    })
      .then(res => {
        if (!res.ok) {
          localStorage.removeItem(TOKEN_KEY);
          return null;
        }
        return res.json();
      })
      .then(data => {
        if (data && data.id) {
          setUser({ id: data.id, email: data.email });
        }
      })
      .catch(() => {
        localStorage.removeItem(TOKEN_KEY);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    try {
      const res = await fetch(`${API.inferenceUrl}/api/auth/login`, {
        method: 'POST',
        headers: apiHeaders(),
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        return { error: data.detail || 'Invalid email or password' };
      }

      localStorage.setItem(TOKEN_KEY, data.token);
      setUser(data.user);
      return { error: null };
    } catch {
      return { error: 'Could not connect to the server. Please try again.' };
    }
  }, []);

  const signUp = useCallback(async (email: string, password: string) => {
    try {
      const res = await fetch(`${API.inferenceUrl}/api/auth/signup`, {
        method: 'POST',
        headers: apiHeaders(),
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        return { error: data.detail || 'Could not create account' };
      }

      localStorage.setItem(TOKEN_KEY, data.token);
      setUser(data.user);
      return { error: null };
    } catch {
      return { error: 'Could not connect to the server. Please try again.' };
    }
  }, []);

  const signOut = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    setUser(null);
  }, []);

  const getToken = useCallback(() => {
    return localStorage.getItem(TOKEN_KEY);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signUp, signOut, getToken }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}