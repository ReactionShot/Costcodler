// web/js/api.js
import { state, API_BASE } from './state.js';

// Show message to user
export function showMessage(text, type) {
    const messageDiv = document.getElementById('message');
    messageDiv.innerHTML = `<div class="${type}">${text}</div>`;
    if (type === 'success' || type === 'info') {
        setTimeout(() => {
            messageDiv.innerHTML = '';
        }, 3000);
    }
}

// Refresh all data from API
export async function refreshData() {
    try {
        showMessage('Refreshing data...', 'info');

        // Fetch all data
        const [scoresResponse, usersResponse, dailyResponse] = await Promise.all([
            fetch(`${API_BASE}/scores?limit=10000`), // Increase limit to get all scores
            fetch(`${API_BASE}/users`),
            fetch(`${API_BASE}/daily-stats`)
        ]);

        // Check if responses are ok
        if (!scoresResponse.ok) {
            throw new Error(`Scores API error: ${scoresResponse.status}`);
        }
        if (!usersResponse.ok) {
            throw new Error(`Users API error: ${usersResponse.status}`);
        }
        if (!dailyResponse.ok) {
            throw new Error(`Daily stats API error: ${dailyResponse.status}`);
        }

        const scoresData = await scoresResponse.json();
        const usersData = await usersResponse.json();
        const dailyData = await dailyResponse.json();

        // Validate data types and update state
        state.allScores = Array.isArray(scoresData) ? scoresData : [];
        state.userStats = Array.isArray(usersData) ? usersData : [];
        state.dailyStats = Array.isArray(dailyData) ? dailyData : [];

        console.log('Data loaded:', {
            scores: state.allScores.length,
            users: state.userStats.length,
            daily: state.dailyStats.length
        });

        return {
            isEmpty: state.allScores.length === 0,
            scores: state.allScores,
            users: state.userStats,
            daily: state.dailyStats
        };
    } catch (error) {
        console.error('Refresh error:', error);
        showMessage('Error refreshing data: ' + error.message, 'error');

        // Initialize empty arrays on error
        state.allScores = [];
        state.userStats = [];
        state.dailyStats = [];
        
        throw error;
    }
}

// Export data to CSV - Fixed to include all data and sort by message_date
export function exportData() {
    if (state.allScores.length === 0) {
        showMessage('No data to export. Please refresh data first.', 'error');
        return;
    }

    // Sort by message_date (or created_at as fallback) descending
    const sortedScores = [...state.allScores].sort((a, b) => {
        const dateA = new Date(a.message_date || a.created_at);
        const dateB = new Date(b.message_date || b.created_at);
        return dateB - dateA; // Most recent first
    });

    let csv = 'Date,Username,Score,Failed,Message_ID,Message_Date,Created_At\n';
    sortedScores.forEach(score => {
        const displayScore = score.failed ? 'X' : score.score;
        const failed = score.failed ? 'true' : 'false';
        const messageDate = score.message_date || '';
        const createdAt = score.created_at || '';
        csv += `${score.date},"${score.username}",${displayScore},${failed},"${score.message_id}","${messageDate}","${createdAt}"\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `costcodle_scores_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);

    showMessage(`Exported ${sortedScores.length} scores to CSV (sorted by message date)`, 'success');
} 