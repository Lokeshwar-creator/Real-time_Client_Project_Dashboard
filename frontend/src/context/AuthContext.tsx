import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";
import type { ReactNode } from "react";

import {
  login as loginApi,
  logout as logoutApi,
  refreshAccessToken,
} from "../api/auth.api";

import { setAccessToken } from "../api/axios";

import type { Role, User } from "../types";

interface AuthContextType {
  user: User | null;
  accessToken: string | null;

  login: (
    email: string,
    password: string
  ) => Promise<void>;

  logout: () => Promise<void>;

  isAuthenticated: boolean;

  initializing: boolean;
}

const AuthContext =
  createContext<AuthContextType | undefined>(
    undefined
  );

export function AuthProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [user, setUser] =
    useState<User | null>(null);

  const [accessToken, setAccessTokenState] =
    useState<string | null>(null);

  const [initializing, setInitializing] =
    useState(true);

  useEffect(() => {
    async function restoreSession() {
      try {
        const result =
          await refreshAccessToken();

        setAccessTokenState(
          result.accessToken
        );

        setAccessToken(
          result.accessToken
        );

        setUser({
          id: result.user.id,
          name: result.user.name,
          email: result.user.email,
          role: result.user.role as Role,
        });
      } catch {
        setAccessTokenState(null);
        setAccessToken(null);
        setUser(null);
      } finally {
        setInitializing(false);
      }
    }

    restoreSession();
  }, []);

  async function login(
    email: string,
    password: string
  ) {
    const result = await loginApi(
      email,
      password
    );

    setAccessTokenState(
      result.accessToken
    );

    setAccessToken(
      result.accessToken
    );

    setUser({
      id: result.user.id,
      name: result.user.name,
      email: result.user.email,
      role: result.user.role as Role,
    });
  }

  async function logout() {
    try {
      await logoutApi();
    } finally {
      setAccessTokenState(null);
      setAccessToken(null);
      setUser(null);
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        accessToken,
        login,
        logout,
        isAuthenticated:
          !!user && !!accessToken,
        initializing,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context =
    useContext(AuthContext);

  if (!context) {
    throw new Error(
      "useAuth must be used inside AuthProvider"
    );
  }

  return context;
}