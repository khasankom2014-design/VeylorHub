import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User } from '../types.ts';
import { api, getToken, clearToken, ApiError } from '../services/api.ts';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  inviteParam: string | null;
  clearInviteParam: () => void;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (data: { name: string; email: string; password: string; inviteToken?: string }) => Promise<{ success: boolean; error?: string; message?: string }>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  acceptInvite: (token: string) => Promise<{ success: boolean; error?: string; message?: string }>;
  updateProfile: (data: { name?: string; title?: string; avatar?: string; bio?: string; contacts?: { telegram?: string; github?: string; discord?: string } }) => Promise<{ success: boolean; error?: string; message?: string }>;
  changePassword: (data: { currentPassword: string; newPassword: string }) => Promise<{ success: boolean; error?: string; message?: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [inviteParam, setInviteParam] = useState<string | null>(null);

  // Check URL query parameters for invite tokens on load
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const invite = params.get('invite');
      if (invite) {
        setInviteParam(invite);
      }
    } catch {
      // ignore
    }
  }, []);

  const clearInviteParam = useCallback(() => {
    setInviteParam(null);
    try {
      const url = new URL(window.location.href);
      url.searchParams.delete('invite');
      window.history.replaceState({}, '', url.pathname + (url.search || ''));
    } catch {
      // ignore
    }
  }, []);

  const refreshUser = useCallback(async () => {
    const token = getToken();
    if (!token) {
      setUser(null);
      setIsLoading(false);
      return;
    }

    try {
      const res = await api.getMe();
      setUser(res.user);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        clearToken();
        setUser(null);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  // Periodic polling every 5 seconds to enforce instantaneous revocation if owner kicks member
  useEffect(() => {
    if (!user) return;
    const interval = setInterval(async () => {
      try {
        const res = await api.getMe();
        // If status changed (e.g. owner revoked access, or owner approved pending user)
        if (
          res.user.status !== user.status ||
          res.user.role !== user.role ||
          JSON.stringify(res.user.permissions) !== JSON.stringify(user.permissions)
        ) {
          setUser(res.user);
        }
      } catch (err) {
        if (err instanceof ApiError && (err.status === 401 || err.status === 403)) {
          // Token invalidated or revoked
          refreshUser();
        }
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [user, refreshUser]);

  const login = async (email: string, password: string) => {
    try {
      const res = await api.login(email, password);
      setUser(res.user);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Ошибка входа' };
    }
  };

  const register = async (data: { name: string; email: string; password: string; inviteToken?: string }) => {
    try {
      const res = await api.register(data);
      setUser(res.user);
      if (data.inviteToken) {
        clearInviteParam();
      }
      return { success: true, message: res.message };
    } catch (err: any) {
      return { success: false, error: err.message || 'Ошибка регистрации' };
    }
  };

  const acceptInvite = async (token: string) => {
    try {
      const res = await api.acceptInvite(token);
      if (res.user) {
        setUser(res.user);
      }
      clearInviteParam();
      return { success: true, message: res.message };
    } catch (err: any) {
      return { success: false, error: err.message || 'Не удалось активировать приглашение' };
    }
  };

  const updateProfile = async (data: { name?: string; title?: string; avatar?: string; bio?: string; contacts?: { telegram?: string; github?: string; discord?: string } }) => {
    try {
      const res = await api.updateProfile(data);
      setUser(res.user);
      return { success: true, message: res.message };
    } catch (err: any) {
      return { success: false, error: err.message || 'Ошибка обновления профиля' };
    }
  };

  const changePassword = async (data: { currentPassword: string; newPassword: string }) => {
    try {
      const res = await api.changePassword(data);
      return { success: true, message: res.message };
    } catch (err: any) {
      return { success: false, error: err.message || 'Ошибка смены пароля' };
    }
  };

  const logout = async () => {
    await api.logout();
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        inviteParam,
        clearInviteParam,
        login,
        register,
        logout,
        refreshUser,
        acceptInvite,
        updateProfile,
        changePassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
