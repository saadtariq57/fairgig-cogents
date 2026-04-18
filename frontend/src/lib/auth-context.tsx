"use client";

/**
 * Client-side auth context.
 *
 * Holds the currently signed-in user plus a simple status enum that lets
 * consumers distinguish between "still checking" (boot) and "definitely
 * signed out". Tokens themselves live in localStorage via `lib/api.ts`; this
 * context only mirrors the user profile and exposes login/signup/logout.
 */

import * as React from "react";
import {
  authApi,
  clearTokens,
  readTokens,
  writeTokens,
  type AuthUser,
  type RegisterInput,
} from "@/lib/api";

type Status = "loading" | "authenticated" | "unauthenticated";

type AuthContextValue = {
  status: Status;
  user: AuthUser | null;
  login: (email: string, password: string) => Promise<AuthUser>;
  signup: (input: RegisterInput) => Promise<AuthUser>;
  logout: () => void;
  refresh: () => Promise<void>;
};

const AuthContext = React.createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = React.useState<Status>("loading");
  const [user, setUser] = React.useState<AuthUser | null>(null);

  const loadMe = React.useCallback(async () => {
    const tokens = readTokens();
    if (!tokens) {
      setUser(null);
      setStatus("unauthenticated");
      return;
    }
    try {
      const me = await authApi.me();
      setUser(me);
      setStatus("authenticated");
    } catch {
      clearTokens();
      setUser(null);
      setStatus("unauthenticated");
    }
  }, []);

  React.useEffect(() => {
    loadMe();
  }, [loadMe]);

  const login = React.useCallback<AuthContextValue["login"]>(
    async (email, password) => {
      const res = await authApi.login(email, password);
      writeTokens({
        accessToken: res.access_token,
        refreshToken: res.refresh_token,
      });
      const me = await authApi.me();
      setUser(me);
      setStatus("authenticated");
      return me;
    },
    []
  );

  const signup = React.useCallback<AuthContextValue["signup"]>(
    async (input) => {
      await authApi.register(input);
      return login(input.email, input.password);
    },
    [login]
  );

  const logout = React.useCallback(() => {
    clearTokens();
    setUser(null);
    setStatus("unauthenticated");
  }, []);

  const value = React.useMemo<AuthContextValue>(
    () => ({ status, user, login, signup, logout, refresh: loadMe }),
    [status, user, login, signup, logout, loadMe]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = React.useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
