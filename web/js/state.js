// web/js/state.js
// Shared mutable state singleton

export const state = {
    allScores: [],
    userStats: [],
    dailyStats: [],
    currentMonthOffset: 0, // 0 = current month, -1 = previous month, etc.
    userAchievements: {}, // Store achievements for all users
    achievementsExpanded: true // Track if achievements are expanded
};

// Constants
export const CHANNEL_ID = ''; // Hardcoded channel ID - INPUT CHANNEL ID
export const API_BASE = import.meta.env?.VITE_API_BASE || window.location.origin + '/api'; 