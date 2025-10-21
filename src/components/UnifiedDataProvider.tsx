"use client";

import { createContext, useContext, ReactNode } from "react";
import useSWR, { useSWRConfig, KeyedMutator } from "swr";
import type { PlayerStats, Todo, ChallengesResponse, Achievement } from "@/types";

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

const UnifiedDataContext = createContext<UnifiedDataContextType | undefined>(undefined);

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function UnifiedDataProvider({ children }: { children: ReactNode }) {
  const { mutate: globalMutate } = useSWRConfig();
  
  // Single API call for all data
  const { data: dashboardData, error, isLoading, mutate } = useSWR<DashboardData>("/api/dashboard", fetcher, {
    refreshInterval: 30000, // Refresh every 30 seconds
    revalidateOnFocus: true,
    revalidateOnReconnect: true,
  });

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

// Backward compatibility hooks
export function usePlayerStats() {
  const { playerStats, isLoading, error, mutatePlayerStats } = useUnifiedData();
  
  // Create a proper KeyedMutator-compatible function
  const mutate: KeyedMutator<PlayerStats> = async (data?, shouldRevalidate?) => {
    mutatePlayerStats();
    return playerStats;
  };
  
  return { data: playerStats, isLoading, error, mutate };
}

export function useChallenges() {
  const { challenges, isLoading, error, mutateChallenges } = useUnifiedData();
  
  const mutate: KeyedMutator<ChallengesResponse> = async (data?, shouldRevalidate?) => {
    mutateChallenges();
    return challenges;
  };
  
  return { data: challenges, isLoading, error, mutate };
}

export function useAchievements() {
  const { achievements, isLoading, error, mutateAchievements } = useUnifiedData();
  
  const mutate: KeyedMutator<Achievement[]> = async (data?, shouldRevalidate?) => {
    mutateAchievements();
    return achievements;
  };
  
  return { data: achievements, isLoading, error, mutate };
}

export function useTodos() {
  const { todos, isLoading, error, mutateTodos } = useUnifiedData();
  
  const mutate: KeyedMutator<Todo[]> = async (data?, shouldRevalidate?) => {
    mutateTodos();
    return todos;
  };
  
  return { data: todos, isLoading, error, mutate };
}
