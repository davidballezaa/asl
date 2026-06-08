import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import { useAuth } from '@/context/AuthContext';
import { fetchUnits } from '@/lib/api/curriculum';
import { fetchMe } from '@/lib/api/me';
import type { MeResponse } from '@/lib/api/types';
import type { Unit } from '@/lib/mock-data';

type AppDataContextValue = {
  me: MeResponse | null;
  units: Unit[];
  isLoading: boolean;
  refreshMe: () => Promise<void>;
  loadCurriculum: () => Promise<void>;
};

const AppDataContext = createContext<AppDataContextValue | null>(null);

export function AppDataProvider({ children }: { children: ReactNode }) {
  const { isSignedIn } = useAuth();
  const [me, setMe] = useState<MeResponse | null>(null);
  const [units, setUnits] = useState<Unit[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const refreshMe = useCallback(async () => {
    const data = await fetchMe();
    setMe(data);
  }, []);

  const loadCurriculum = useCallback(async () => {
    const data = await fetchUnits();
    setUnits(data.units);
  }, []);

  useEffect(() => {
    if (!isSignedIn) {
      setMe(null);
      setUnits([]);
      return;
    }
    setIsLoading(true);
    Promise.all([refreshMe(), loadCurriculum()])
      .catch(() => {
        setMe(null);
        setUnits([]);
      })
      .finally(() => setIsLoading(false));
  }, [isSignedIn, refreshMe, loadCurriculum]);

  const value = useMemo(
    () => ({
      me,
      units,
      isLoading,
      refreshMe,
      loadCurriculum,
    }),
    [me, units, isLoading, refreshMe, loadCurriculum],
  );

  return (
    <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>
  );
}

export function useAppData() {
  const context = useContext(AppDataContext);
  if (!context) {
    throw new Error('useAppData must be used within AppDataProvider');
  }
  return context;
}

export function useGamification() {
  const { me } = useAppData();
  return me?.gamification ?? null;
}
