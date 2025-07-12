// Shared types for the Costcodle tracker application

// Database types
export interface Score {
  id?: number;
  username: string;
  score: number | null;
  failed: boolean;
  date: string;
  message_id?: string; // Discord snowflake as string to preserve precision
  message_date?: string;
  created_at?: string;
}

export interface UserStats {
  username: string;
  total_games: number;
  avg_score: number;
  best_score: number;
  failed_games: number;
  first_date?: string;
  last_date?: string;
  most_recent_score?: string | number;
  daily_wins?: number;
  longest_streak?: number;
  current_streak?: number;
}

export interface DailyStats {
  date: string;
  players: number;
  avg_score: number | null;
  best_score: number | null;
  worst_score: number | null;
  failed_count: number;
}

// Achievement types
export interface Achievement {
  icon: string;
  title: string;
  desc: string;
  earned: boolean;
  progress?: string;
}

// API Response types
export interface ApiResponse<T> {
  data: T;
  success: boolean;
  error?: string;
}

export interface ScoresResponse {
  scores: Score[];
  total: number;
  page: number;
  limit: number;
}

// Frontend state types
export interface AppState {
  allScores: Score[];
  userStats: UserStats[];
  dailyStats: DailyStats[];
  currentMonthOffset: number;
  userAchievements: Record<string, Achievement[]>;
  achievementsExpanded: boolean;
  headToHeadMode: boolean;
}

// Chart data types
export interface ChartDataset {
  label: string;
  data: (number | null)[];
  borderColor: string;
  backgroundColor: string;
  fill?: boolean;
  tension?: number;
  spanGaps?: boolean;
}

export interface ChartConfig {
  type: 'line' | 'bar' | 'doughnut' | 'pie';
  data: {
    labels: string[];
    datasets: ChartDataset[];
  };
  options: any; // Chart.js options are complex, keeping as any for now
}

// Utility types
export type PerformanceBadge = {
  class: 'best' | 'good' | 'average' | 'poor';
  text: 'Excellent' | 'Good' | 'Average' | "BJ's Member";
};

export type MessageType = 'success' | 'error' | 'info' | 'warning';

// Constants
export const HEAD_TO_HEAD_PLAYERS = ['.cyco', 'clicky6792'] as const;
export const PERFORMANCE_THRESHOLDS = {
  EXCELLENT: 2.99,
  GOOD: 3.49,
  AVERAGE: 3.99
} as const;

// Export type helpers
export type HeadToHeadPlayer = typeof HEAD_TO_HEAD_PLAYERS[number];
export type PerformanceLevel = keyof typeof PERFORMANCE_THRESHOLDS; 