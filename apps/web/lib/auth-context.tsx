'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import { apiGet, apiPost, setAccessToken, ApiError } from './api';
import type { User } from './types';

interface AuthContextValue {
  user: User | null;
  accessToken: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (name: string, email: string, password: string) => Promise<User>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  setUser: (user: User | null) => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const USER_CACHE_KEY = 'clothify_user';
const TOKEN_CACHE_KEY = 'clothify_access_token';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUserState] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const setUser = useCallback((u: User | null) => {
    setUserState(u);
    try {
      if (u) localStorage.setItem(USER_CACHE_KEY, JSON.stringify(u));
      else localStorage.removeItem(USER_CACHE_KEY);
    } catch {
      // ignore storage errors
    }
  }, []);

  const applyToken = useCallback((t: string | null) => {
    setToken(t);
    setAccessToken(t);
    try {
      if (t) localStorage.setItem(TOKEN_CACHE_KEY, t);
      else localStorage.removeItem(TOKEN_CACHE_KEY);
    } catch {
      // ignore storage errors
    }
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const me = await apiGet<User>('/auth/me');
      setUser(me);
    } catch {
      setUser(null);
      applyToken(null);
    }
  }, [applyToken, setUser]);

  useEffect(() => {
    let cachedUser: User | null = null;
    let cachedToken: string | null = null;
    try {
      const rawUser = localStorage.getItem(USER_CACHE_KEY);
      cachedUser = rawUser ? JSON.parse(rawUser) : null;
      cachedToken = localStorage.getItem(TOKEN_CACHE_KEY);
    } catch {
      // ignore storage errors
    }
    if (cachedUser) setUserState(cachedUser);
    if (cachedToken) {
      setToken(cachedToken);
      setAccessToken(cachedToken);
    }

    (async () => {
      if (cachedToken) {
        try {
          const me = await apiGet<User>('/auth/me');
          setUser(me);
        } catch (err) {
          if (err instanceof ApiError && err.status === 401) {
            setUser(null);
            applyToken(null);
          }
        }
      }
      setLoading(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const login = useCallback(
    async (email: string, password: string) => {
      const data = await apiPost<{ user: User; accessToken: string }>('/auth/login', {
        email,
        password,
      });
      applyToken(data.accessToken);
      setUser(data.user);
      return data.user;
    },
    [applyToken, setUser]
  );

  const register = useCallback(
    async (name: string, email: string, password: string) => {
      const data = await apiPost<{ user: User; accessToken: string }>('/auth/register', {
        name,
        email,
        password,
      });
      applyToken(data.accessToken);
      setUser(data.user);
      return data.user;
    },
    [applyToken, setUser]
  );

  const logout = useCallback(async () => {
    try {
      await apiPost('/auth/logout');
    } catch {
      // ignore network errors on logout
    }
    setUser(null);
    applyToken(null);
  }, [applyToken, setUser]);

  return (
    <AuthContext.Provider
      value={{ user, accessToken: token, loading, login, register, logout, refreshUser, setUser }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
