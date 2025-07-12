// Frontend-specific types for the Costcodle tracker

import { AppState, Score, UserStats, Achievement, MessageType, PerformanceBadge } from './index.js';

// DOM Element selectors
export type ElementSelector = string;
export type HTMLElementWithId<T extends string> = HTMLElement & { id: T };

// Chart.js types (simplified)
export interface Chart {
  destroy(): void;
  update(): void;
  data: {
    labels: string[];
    datasets: ChartDataset[];
  };
  setDatasetVisibility(index: number, visible: boolean): void;
}

export interface ChartDataset {
  label: string;
  data: (number | null)[];
  borderColor: string;
  backgroundColor: string;
  fill?: boolean;
  tension?: number;
  spanGaps?: boolean;
}

export interface ChartContext {
  getContext(type: '2d'): CanvasRenderingContext2D;
}

// State management
export interface StateManager {
  state: AppState;
  updateState(updates: Partial<AppState>): void;
  getFilteredData<T extends { username: string }>(data: T[]): T[];
}

// API client types
export interface ApiClient {
  refreshData(): Promise<{ isEmpty: boolean; scores: Score[]; users: UserStats[]; daily: any[] }>;
  exportData(): void;
  showMessage(text: string, type: MessageType): void;
}

// Table and widget managers
export interface TableManager {
  updateUserStatsTable(): void;
  updateMonthlyLeaderboard(): void;
  updatePerformanceSummary(): void;
  updateScoreHeatmap(): void;
}

export interface ChartManager {
  updateTrendsChart(): void;
  updateDistributionChart(): void;
  updateDailyChart(): void;
  updateProgressChart(): void;
  destroyChart(chartName: string): void;
}

export interface AchievementManager {
  updateAchievements(): void;
  updateAchievementsWidget(specificUser?: string): void;
  showUserAchievements(username: string): void;
  toggleAllAchievements(): void;
}

// Event handling
export interface EventHandler {
  setupEventHandlers(): void;
  handleRefresh(): Promise<void>;
  handleExport(): void;
  handleHeadToHeadToggle(): void;
  handleMonthNavigation(direction: 'prev' | 'next'): void;
  handlePlayerClick(username: string): void;
}

// Utility functions
export interface UtilityFunctions {
  getPerformanceBadge(avgScore: number): PerformanceBadge;
  calculateDailyWins(username: string): string;
  calculateStreaks(userScores: Score[]): { currentStreak: number; maxStreak: number };
  formatDate(date: string): string;
  formatScore(score: number | null, failed?: boolean): string;
}

// Data processing
export interface DataProcessor {
  processScoresForChart(scores: Score[]): ChartDataset[];
  processUserStats(userStats: UserStats[], allScores: Score[]): EnhancedUserStats[];
  processMonthlyData(scores: Score[], monthOffset: number): MonthlyLeaderboard[];
  processHeatmapData(scores: Score[]): HeatmapData;
}

// Enhanced data types
export interface EnhancedUserStats extends Omit<UserStats, 'daily_wins'> {
  first_date: string;
  last_date: string;
  most_recent_score: string | number;
  daily_wins: string;
  longest_streak: number;
  current_streak: number;
}

export interface MonthlyLeaderboard {
  username: string;
  games: number;
  totalScore: number;
  completedGames: number;
  failed: number;
  bestScore: number;
  points: number;
  avgScore: string;
  avgPoints: string;
}

export interface HeatmapData {
  users: string[];
  dates: string[];
  scoreMatrix: Record<string, Record<string, Score | null>>;
}

// Component interfaces
export interface Component {
  render(): void;
  destroy?(): void;
  update?(data?: any): void;
}

export interface Modal extends Component {
  show(): void;
  hide(): void;
  isVisible(): boolean;
}

export interface Toast extends Component {
  show(message: string, type: MessageType, duration?: number): void;
  hide(): void;
}

// Configuration
export interface FrontendConfig {
  API_BASE: string;
  CHANNEL_ID: string;
  HEAD_TO_HEAD_PLAYERS: readonly string[];
  CHART_COLORS: readonly string[];
  REFRESH_INTERVAL?: number;
}

// Async operations
export type AsyncOperation<T> = () => Promise<T>;
export type AsyncHandler = (event: Event) => Promise<void>;

// Error handling
export interface ErrorHandler {
  handleError(error: Error, context?: string): void;
  showError(message: string): void;
  logError(error: Error, context?: string): void;
}

// Export type guards
export function isScore(obj: any): obj is Score {
  return obj && typeof obj.username === 'string' && typeof obj.score === 'number';
}

export function isUserStats(obj: any): obj is UserStats {
  return obj && typeof obj.username === 'string' && typeof obj.total_games === 'number';
}

export function isAchievement(obj: any): obj is Achievement {
  return obj && typeof obj.icon === 'string' && typeof obj.title === 'string';
} 