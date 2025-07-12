// web/js/main.js
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
function toggleHeadToHead() {
    state.headToHeadMode = !state.headToHeadMode;
    const btn = document.getElementById('headToHeadBtn');

    if (state.headToHeadMode) {
        btn.textContent = 'Show All Players';
        btn.classList.add('active');
        showMessage('Head-to-Head mode: Showing only .cyco vs clicky6792', 'info');
    } else {
        btn.textContent = '⚔️ Head to Head';
        btn.classList.remove('active');
        showMessage('Showing all players', 'info');
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
async function init() {
    try {
        const result = await refreshData();
        
        if (result.isEmpty) {
            showMessage('No data found. If this is a new setup, the bot may be importing historical data in the background. Please wait a moment and refresh again.', 'info');
            document.getElementById('lastUpdate').textContent = 'Waiting for initial data import...';
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
            document.getElementById('lastUpdate').textContent = `Last updated: ${new Date().toLocaleTimeString()}`;
        }
    } catch (error) {
        console.error('Initialization error:', error);
        showMessage('Error initializing dashboard: ' + error.message, 'error');
    }
}

// Event handlers
function setupEventHandlers() {
    // Refresh button
    document.getElementById('refreshBtn').addEventListener('click', init);
    
    // Export button
    document.getElementById('exportBtn').addEventListener('click', exportData);
    
    // Head-to-head button
    document.getElementById('headToHeadBtn').addEventListener('click', toggleHeadToHead);
    
    // Toggle achievements button
    document.getElementById('toggleAchievementsBtn').addEventListener('click', toggleAllAchievements);
    
    // Month navigation buttons
    document.getElementById('prevMonthBtn').addEventListener('click', () => {
        state.currentMonthOffset--;
        updateMonthlyLeaderboard();
    });
    
    document.getElementById('nextMonthBtn').addEventListener('click', () => {
        state.currentMonthOffset++;
        updateMonthlyLeaderboard();
    });
    
    // Stats view toggle functionality removed - not needed with current layout
    
    // Player name clicks for achievements
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('player-name')) {
            const username = e.target.textContent;
            showUserAchievements(username);
        }
    });
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    setupEventHandlers();
    init();
}); 