"use client";

import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from "react";

type AuthUser = {
  id: number;
  name: string;
  email: string;
  created_at: string;
  updated_at: string;
};

type AuthState = {
  token: string;
  user: AuthUser | null;
  isAuthenticated: boolean;
  isReady: boolean;
};

type AuthContextValue = AuthState & {
  login: (token: string, user: AuthUser) => void;
  logout: () => void;
};

const AUTH_COOKIE_KEY = "auth_token";
const AUTH_TOKEN_KEY = "auth_token";
const AUTH_USER_KEY = "auth_user";

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function setAuthCookie(token: string) {
  document.cookie = `${AUTH_COOKIE_KEY}=${encodeURIComponent(token)}; Path=/; Max-Age=604800; SameSite=Lax`;
}

function clearAuthCookie() {
  document.cookie = `${AUTH_COOKIE_KEY}=; Path=/; Max-Age=0; SameSite=Lax`;
}

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState("");
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const storedToken = localStorage.getItem(AUTH_TOKEN_KEY) ?? "";
    const storedUser = localStorage.getItem(AUTH_USER_KEY);
    setToken(storedToken);
    setUser(storedUser ? (JSON.parse(storedUser) as AuthUser) : null);
    setIsReady(true);
  }, []);

  function login(nextToken: string, nextUser: AuthUser) {
    setToken(nextToken);
    setUser(nextUser);
    localStorage.setItem(AUTH_TOKEN_KEY, nextToken);
    localStorage.setItem(AUTH_USER_KEY, JSON.stringify(nextUser));
    setAuthCookie(nextToken);
  }

  function logout() {
    setToken("");
    setUser(null);
    localStorage.removeItem(AUTH_TOKEN_KEY);
    localStorage.removeItem(AUTH_USER_KEY);
    clearAuthCookie();
  }

  const value = useMemo<AuthContextValue>(
    () => ({
      token,
      user,
      isAuthenticated: Boolean(token),
      isReady,
      login,
      logout,
    }),
    [token, user, isReady],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuthState() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuthState doit etre utilise dans AppStateProvider.");
  }
  return context;
}
