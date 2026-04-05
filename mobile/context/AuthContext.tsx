import React, { createContext, useContext, useEffect, useState } from 'react';
import { login as apiLogin, logout as apiLogout } from '../lib/api';
import { saveToken, getToken, saveUser, getUser, clearAuth } from '../lib/storage';
import type { User } from '../types';

interface AuthContextValue {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  isExternal: boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function restore() {
      try {
        const [storedToken, storedUser] = await Promise.all([
          getToken(),
          getUser<User>(),
        ]);
        if (storedToken && storedUser) {
          setToken(storedToken);
          setUser(storedUser);
        }
      } finally {
        setIsLoading(false);
      }
    }
    restore();
  }, []);

  async function login(email: string, password: string) {
    const { token: newToken, user: newUser } = await apiLogin(email, password);
    await Promise.all([saveToken(newToken), saveUser(newUser)]);
    setToken(newToken);
    setUser(newUser);
  }

  async function logout() {
    await Promise.all([apiLogout(), clearAuth()]);
    setToken(null);
    setUser(null);
  }

  const org = user?.organizations?.[0];
  const orgRole = org?.role ?? '';
  const isSuperAdmin = orgRole === 'super_admin';
  const isAdmin = isSuperAdmin || orgRole === 'admin';
  const isExternal = !org;

  return (
    <AuthContext.Provider
      value={{ user, token, isLoading, login, logout, isAdmin, isSuperAdmin, isExternal }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
