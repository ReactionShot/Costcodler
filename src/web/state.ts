// src/web/state.ts
// Shared mutable state singleton

import type { AppState, Score, UserStats, DailyStats, Achievement } from '../types/index.js';

export const state: AppState = {
    allScores: [],
    userStats: [],
    dailyStats: [],
    currentMonthOffset: 0, // 0 = current month, -1 = previous month, etc.
    userAchievements: {}, // Store achievements for all users
    achievementsExpanded: true, // Track if achievements are expanded
    headToHeadMode: false // Track if head-to-head mode is active
};

// Constants
export const CHANNEL_ID = ''; // Hardcoded channel ID - INPUT CHANNEL ID
export const API_BASE = (import.meta as any).env?.VITE_API_BASE || window.location.origin + '/api';

// Head-to-head players
export const HEAD_TO_HEAD_PLAYERS = ['.cyco', 'clicky6792'] as const;

// Filter data for head-to-head mode
export function filterDataForHeadToHead<T extends { username: string }>(data: T[]): T[] {
    if (!state.headToHeadMode) return data;
    return data.filter(item => (HEAD_TO_HEAD_PLAYERS as readonly string[]).includes(item.username));
} 