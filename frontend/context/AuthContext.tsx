import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import { login as apiLogin, logout as apiLogout, register as apiRegister } from '@/lib/api/auth';
import { getToken } from '@/lib/api/client';
import { fetchMe } from '@/lib/api/me';
import type { AuthUser } from '@/lib/api/types';

type AuthContextValue = {
  isSignedIn: boolean;
  isLoading: boolean;
  user: AuthUser | null;
  userName: string | null;
  signIn: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  restoreSession: () => Promise<boolean>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const restoreSession = useCallback(async () => {
    const token = await getToken();
    if (!token) {
      setUser(null);
      return false;
    }
    try {
      const me = await fetchMe();
      setUser(me.user);
      return true;
    } catch {
      await AsyncStorage.removeItem('@aslquest/token');
      setUser(null);
      return false;
    }
  }, []);

  useEffect(() => {
    restoreSession().finally(() => setIsLoading(false));
  }, [restoreSession]);

  const signIn = useCallback(async (email: string, password: string) => {
    const data = await apiLogin(email, password);
    setUser(data.user);
  }, []);

  const register = useCallback(
    async (name: string, email: string, password: string) => {
      const data = await apiRegister(name, email, password);
      setUser(data.user);
    },
    [],
  );

  const signOut = useCallback(async () => {
    await apiLogout();
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({
      isSignedIn: user !== null,
      isLoading,
      user,
      userName: user?.name ?? null,
      signIn,
      register,
      signOut,
      restoreSession,
    }),
    [user, isLoading, signIn, register, signOut, restoreSession],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}