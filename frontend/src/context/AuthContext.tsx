"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  ApiClientError,
  fetchCurrentUser,
  loginUser,
  registerUser,
  setAuthToken,
  updateCurrentUser,
} from "@/lib/api";
import {
  AuthUser,
  LoginPayload,
  RegisterPayload,
  UpdateProfilePayload,
} from "@/types";

const TOKEN_STORAGE_KEY = "betmetrics_auth_token_v1";

interface AuthContextValue {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (payload: LoginPayload) => Promise<AuthUser>;
  register: (payload: RegisterPayload) => Promise<AuthUser>;
  logout: () => void;
  updateProfile: (payload: UpdateProfilePayload) => Promise<AuthUser>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const clearSession = useCallback(() => {
    setAuthToken(null);
    try {
      localStorage.removeItem(TOKEN_STORAGE_KEY);
    } catch {
      // Almacenamiento privado o bloqueado
    }
    setUser(null);
  }, []);

  const persistSession = useCallback((token: string, nextUser: AuthUser) => {
    setAuthToken(token);
    try {
      localStorage.setItem(TOKEN_STORAGE_KEY, token);
    } catch {
      // La sesión sigue activa en memoria aunque localStorage esté bloqueado
    }
    setUser(nextUser);
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function bootstrap() {
      let storedToken: string | null = null;
      try {
        storedToken = localStorage.getItem(TOKEN_STORAGE_KEY);
      } catch {
        storedToken = null;
      }

      if (!storedToken) {
        setAuthToken(null);
        if (!cancelled) setIsLoading(false);
        return;
      }

      setAuthToken(storedToken);
      try {
        const profile = await fetchCurrentUser();
        if (!cancelled) setUser(profile);
      } catch {
        if (!cancelled) clearSession();
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    bootstrap();
    return () => {
      cancelled = true;
    };
  }, [clearSession]);

  useEffect(() => {
    const handleUnauthorized = () => clearSession();
    window.addEventListener("betmetrics:unauthorized", handleUnauthorized);
    return () => {
      window.removeEventListener("betmetrics:unauthorized", handleUnauthorized);
    };
  }, [clearSession]);

  const login = useCallback(
    async (payload: LoginPayload) => {
      const response = await loginUser(payload);
      persistSession(response.access_token, response.user);
      return response.user;
    },
    [persistSession]
  );

  const register = useCallback(
    async (payload: RegisterPayload) => {
      const response = await registerUser(payload);
      persistSession(response.access_token, response.user);
      return response.user;
    },
    [persistSession]
  );

  const logout = useCallback(() => {
    clearSession();
  }, [clearSession]);

  const updateProfile = useCallback(async (payload: UpdateProfilePayload) => {
    const updated = await updateCurrentUser(payload);
    setUser(updated);
    return updated;
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const profile = await fetchCurrentUser();
      setUser(profile);
    } catch (error) {
      if (error instanceof ApiClientError && error.status === 401) {
        clearSession();
      }
      throw error;
    }
  }, [clearSession]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isLoading,
      isAuthenticated: Boolean(user),
      login,
      register,
      logout,
      updateProfile,
      refreshUser,
    }),
    [user, isLoading, login, register, logout, updateProfile, refreshUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
}
