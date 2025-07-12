// web/js/state.js
// Shared mutable state singleton

export const state = {
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
export const API_BASE = import.meta.env?.VITE_API_BASE || window.location.origin + '/api';

// Head-to-head players
export const HEAD_TO_HEAD_PLAYERS = ['.cyco', 'clicky6792'];

// Filter data for head-to-head mode
export function filterDataForHeadToHead(data) {
    if (!state.headToHeadMode) return data;
    return data.filter(item => HEAD_TO_HEAD_PLAYERS.includes(item.username));
} 