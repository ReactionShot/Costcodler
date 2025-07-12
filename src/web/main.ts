// src/web/main.ts
import { refreshData, exportData, showMessage } from './api.js';
import { 
    updateUserStatsTable, 
    updateMonthlyLeaderboard, 
    updatePerformanceSummary, 
    updateScoreHeatmap 
} from './tables.js';
import { 
    updateTrendsChart, 
    updateDistributionChart, 
    updateDailyChart, 
    updateProgressChart 
} from './charts.js';
import { 
    updateAchievements, 
    updateAchievementsWidget, 
    showUserAchievements, 
    toggleAllAchievements 
} from './achievements.js';
import { state } from './state.js';

// Toggle head-to-head mode
function toggleHeadToHead(): void {
    state.headToHeadMode = !state.headToHeadMode;
    const btn = document.getElementById('headToHeadBtn');

    if (btn) {
        if (state.headToHeadMode) {
            btn.textContent = 'Show All Players';
            btn.classList.add('active');
            showMessage('Head-to-Head mode: Showing only .cyco vs clicky6792', 'info');
        } else {
            btn.textContent = '⚔️ Head to Head';
            btn.classList.remove('active');
            showMessage('Showing all players', 'info');
        }
    }

    // Refresh all widgets with new filter
    updateUserStatsTable();
    updateTrendsChart();
    updateDistributionChart();
    updateDailyChart();
    updateProgressChart();
    updateScoreHeatmap();
    updatePerformanceSummary();
    updateAchievements();
    updateAchievementsWidget();
    updateMonthlyLeaderboard();
}

// Initialize the dashboard
async function init(): Promise<void> {
    try {
        const result = await refreshData();
        
        if (result.isEmpty) {
            showMessage('No data found. If this is a new setup, the bot may be importing historical data in the background. Please wait a moment and refresh again.', 'info');
            const lastUpdateElement = document.getElementById('lastUpdate');
            if (lastUpdateElement) {
                lastUpdateElement.textContent = 'Waiting for initial data import...';
            }
        } else {
            // Update all displays
            updateUserStatsTable();
            updateTrendsChart();
            updateDistributionChart();
            updateDailyChart();
            updateProgressChart();
            updateScoreHeatmap();
            updatePerformanceSummary();
            updateAchievements(); // Calculate achievements first
            updateAchievementsWidget(); // Then update the widget
            updateMonthlyLeaderboard();

            showMessage('Data refreshed successfully!', 'success');
            const lastUpdateElement = document.getElementById('lastUpdate');
            if (lastUpdateElement) {
                lastUpdateElement.textContent = `Last updated: ${new Date().toLocaleTimeString()}`;
            }
        }
    } catch (error) {
        console.error('Initialization error:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        showMessage('Error initializing dashboard: ' + errorMessage, 'error');
    }
}

// Event handlers
function setupEventHandlers(): void {
    // Refresh button
    const refreshBtn = document.getElementById('refreshBtn');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', init);
    }
    
    // Export button
    const exportBtn = document.getElementById('exportBtn');
    if (exportBtn) {
        exportBtn.addEventListener('click', exportData);
    }
    
    // Head-to-head button
    const headToHeadBtn = document.getElementById('headToHeadBtn');
    if (headToHeadBtn) {
        headToHeadBtn.addEventListener('click', toggleHeadToHead);
    }
    
    // Toggle achievements button
    const toggleAchievementsBtn = document.getElementById('toggleAchievementsBtn');
    if (toggleAchievementsBtn) {
        toggleAchievementsBtn.addEventListener('click', toggleAllAchievements);
    }
    
    // Month navigation buttons
    const prevMonthBtn = document.getElementById('prevMonthBtn');
    if (prevMonthBtn) {
        prevMonthBtn.addEventListener('click', () => {
            state.currentMonthOffset--;
            updateMonthlyLeaderboard();
        });
    }
    
    const nextMonthBtn = document.getElementById('nextMonthBtn');
    if (nextMonthBtn) {
        nextMonthBtn.addEventListener('click', () => {
            state.currentMonthOffset++;
            updateMonthlyLeaderboard();
        });
    }
    
    // Player name clicks for achievements
    document.addEventListener('click', (e: Event) => {
        const target = e.target as HTMLElement;
        if (target?.classList.contains('player-name')) {
            const username = target.textContent;
            if (username) {
                showUserAchievements(username);
            }
        }
    });
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    setupEventHandlers();
    init();
}); 