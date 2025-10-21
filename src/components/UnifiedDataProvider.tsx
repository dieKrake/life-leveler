"use client";

import { createContext, useContext, ReactNode } from "react";
import useSWR, { useSWRConfig, KeyedMutator } from "swr";
import type {
  PlayerStats,
  Todo,
  ChallengesResponse,
  Achievement,
} from "@/types";

interface DashboardData {
  playerStats: PlayerStats;
  challenges: ChallengesResponse;
  achievements: Achievement[];
  todos: Todo[];
  timestamp: string;
}

interface UnifiedDataContextType {
  playerStats: PlayerStats | undefined;
  challenges: ChallengesResponse | undefined;
  achievements: Achievement[] | undefined;
  todos: Todo[] | undefined;
  isLoading: boolean;
  error: any;
  mutateAll: () => void;
  mutateTodos: () => void;
  mutateChallenges: () => void;
  mutateAchievements: () => void;
  mutatePlayerStats: () => void;
}

const UnifiedDataContext = createContext<UnifiedDataContextType | undefined>(
  undefined
);

const fetcher = async (url: string) => {
  console.log("UnifiedDataProvider: Fetching", url);
  const res = await fetch(url);
  console.log("UnifiedDataProvider: Response status", res.status);

  if (!res.ok) {
    console.error(
      "UnifiedDataProvider: Fetch error",
      res.status,
      res.statusText
    );
    throw new Error(`HTTP ${res.status}: ${res.statusText}`);
  }

  const data = await res.json();
  console.log("UnifiedDataProvider: Data received", data);
  return data;
};

export function UnifiedDataProvider({ children }: { children: ReactNode }) {
  const { mutate: globalMutate } = useSWRConfig();

  // Single API call for all data
  const {
    data: dashboardData,
    error,
    isLoading,
    mutate,
  } = useSWR<DashboardData>("/api/dashboard", fetcher, {
    refreshInterval: 30000, // Refresh every 30 seconds
    revalidateOnFocus: true,
    revalidateOnReconnect: true,
  });

  // Debug log (remove in production)
  if (error) {
    console.error("UnifiedDataProvider: Error", error);
  }

  // Individual mutate functions for specific data updates
  const mutateAll = () => {
    mutate();
    // Also invalidate individual endpoints for backward compatibility
    globalMutate("/api/player-stats");
    globalMutate("/api/challenges");
    globalMutate("/api/achievements");
    globalMutate("/api/get-todos");
  };

  const mutateTodos = () => {
    mutate();
    globalMutate("/api/get-todos");
  };

  const mutateChallenges = () => {
    mutate();
    globalMutate("/api/challenges");
  };

  const mutateAchievements = () => {
    mutate();
    globalMutate("/api/achievements");
  };

  const mutatePlayerStats = () => {
    mutate();
    globalMutate("/api/player-stats");
  };

  const value: UnifiedDataContextType = {
    playerStats: dashboardData?.playerStats,
    challenges: dashboardData?.challenges,
    achievements: dashboardData?.achievements,
    todos: dashboardData?.todos,
    isLoading,
    error,
    mutateAll,
    mutateTodos,
    mutateChallenges,
    mutateAchievements,
    mutatePlayerStats,
  };

  return (
    <UnifiedDataContext.Provider value={value}>
      {children}
    </UnifiedDataContext.Provider>
  );
}

export function useUnifiedData() {
  const context = useContext(UnifiedDataContext);
  if (context === undefined) {
    throw new Error("useUnifiedData must be used within a UnifiedDataProvider");
  }
  return context;
}

// Backward compatibility hooks with fallback
export function usePlayerStats() {
  const { playerStats, isLoading, error, mutatePlayerStats } = useUnifiedData();

  // Fallback to individual API if unified data is not working
  const fallback = useSWR<PlayerStats>("/api/player-stats", fetcher, {
    refreshInterval: 30000,
    revalidateOnFocus: true,
  });

  // Use fallback if unified data is not working
  const shouldUseFallback =
    error || (isLoading && !playerStats && fallback.data);

  // Create a proper KeyedMutator-compatible function
  const mutate: KeyedMutator<PlayerStats> = async (
    data?,
    shouldRevalidate?
  ) => {
    if (shouldUseFallback) {
      return fallback.mutate(data, shouldRevalidate);
    }
    mutatePlayerStats();
    return playerStats;
  };

  return {
    data: shouldUseFallback ? fallback.data : playerStats,
    isLoading: shouldUseFallback ? fallback.isLoading : isLoading,
    error: shouldUseFallback ? fallback.error : error,
    mutate,
  };
}

export function useChallenges() {
  const { challenges, isLoading, error, mutateChallenges } = useUnifiedData();

  const mutate: KeyedMutator<ChallengesResponse> = async (
    data?,
    shouldRevalidate?
  ) => {
    mutateChallenges();
    return challenges;
  };

  return { data: challenges, isLoading, error, mutate };
}

export function useAchievements() {
  const { achievements, isLoading, error, mutateAchievements } =
    useUnifiedData();

  const mutate: KeyedMutator<Achievement[]> = async (
    data?,
    shouldRevalidate?
  ) => {
    mutateAchievements();
    return achievements;
  };

  return { data: achievements, isLoading, error, mutate };
}

export function useTodos() {
  const { todos, isLoading, error, mutateTodos } = useUnifiedData();

  // Fallback to individual API if unified data is not working
  const fallback = useSWR<Todo[]>("/api/get-todos", fetcher, {
    refreshInterval: 30000,
    revalidateOnFocus: true,
  });

  // Use fallback if unified data is not working
  const shouldUseFallback = error || (isLoading && !todos && fallback.data);

  const mutate: KeyedMutator<Todo[]> = async (data?, shouldRevalidate?) => {
    if (shouldUseFallback) {
      return fallback.mutate(data, shouldRevalidate);
    }
    mutateTodos();
    return todos;
  };

  return {
    data: shouldUseFallback ? fallback.data : todos,
    isLoading: shouldUseFallback ? fallback.isLoading : isLoading,
    error: shouldUseFallback ? fallback.error : error,
    mutate,
  };
}
