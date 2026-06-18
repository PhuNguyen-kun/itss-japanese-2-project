"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { getWalletStats, type WalletStats } from "@/lib/api-client";

interface WalletContextValue {
  stats: WalletStats | null;
  /** Balance for calculations; 0 while stats not loaded yet */
  balance: number;
  loading: boolean;
  refreshWallet: () => Promise<void>;
}

const WalletContext = createContext<WalletContextValue | null>(null);

export function WalletProvider({
  children,
  initialStats,
}: {
  children: React.ReactNode;
  initialStats?: WalletStats | null;
}) {
  const [stats, setStats] = useState<WalletStats | null>(initialStats ?? null);
  const [loading, setLoading] = useState(initialStats == null);
  const fetchInFlight = useRef<Promise<void> | null>(null);

  const refreshWallet = useCallback(async () => {
    if (fetchInFlight.current) {
      await fetchInFlight.current;
      return;
    }

    const promise = getWalletStats()
      .then((next) => {
        setStats(next);
        setLoading(false);
      })
      .catch(console.error)
      .finally(() => {
        fetchInFlight.current = null;
      });

    fetchInFlight.current = promise;
    await promise;
  }, []);

  useEffect(() => {
    void refreshWallet();
  }, [refreshWallet]);

  const value: WalletContextValue = {
    stats,
    balance: stats?.totalBalance ?? 0,
    loading,
    refreshWallet,
  };

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>;
}

export function useWallet(): WalletContextValue {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error("useWallet must be used within WalletProvider");
  }
  return context;
}

export function formatPoints(value: number | undefined, pending = false): string {
  if (pending || value == null) return "…";
  return value.toLocaleString();
}
