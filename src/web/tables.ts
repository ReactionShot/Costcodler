// src/web/tables.ts
import { state, filterDataForHeadToHead } from './state.js';
import type { Score, UserStats, PerformanceBadge } from '../types/index.js';
import type { EnhancedUserStats } from '../types/frontend.js';

// Get performance badge based on average score
function getPerformanceBadge(avgScore: number): PerformanceBadge {
    if (avgScore <= 2.99) return { class: 'best', text: 'Excellent' };
    if (avgScore <= 3.49) return { class: 'good', text: 'Good' };
    if (avgScore <= 3.99) return { class: 'average', text: 'Average' };
    return { class: 'poor', text: 'BJ\'s Member' };
}

// Calculate daily wins for a user
function calculateDailyWins(username: string): string {
    // Filter scores for head-to-head mode
    const scoresToConsider = filterDataForHeadToHead(state.allScores);
    
    const dailyScores: Record<string, Array<{ username: string; score: number }>> = {};
    scoresToConsider.forEach(score => {
        if (!dailyScores[score.date]) {
            dailyScores[score.date] = [];
        }
        if (!score.failed) {
            dailyScores[score.date].push({
                username: score.username,
                score: score.score
            });
        }
    });

    let wins = 0;
    Object.values(dailyScores).forEach(dayScores => {
        if (dayScores.length > 0) {
            const bestScore = Math.min(...dayScores.map(s => s.score));
            const winners = dayScores.filter(s => s.score === bestScore);
            const userWon = winners.some(w => w.username === username);
            if (userWon) {
                wins += 1 / winners.length; // Split ties
            }
        }
    });

    return wins.toFixed(1);
}

// Calculate consecutive days streak - updated to match monolithic version
function calculateStreaks(userScores: Score[]): { currentStreak: number; maxStreak: number } {
    // Get unique dates for this user and sort them
    const uniqueDates = [...new Set(userScores.map(s => s.date))].sort();

    let currentStreak = 0;
    let maxStreak = 0;
    let tempStreak = 1;

    if (uniqueDates.length === 0) {
        return { currentStreak: 0, maxStreak: 0 };
    }

    if (uniqueDates.length === 1) {
        return { currentStreak: 1, maxStreak: 1 };
    }

    // Calculate longest streak first
    for (let i = 1; i < uniqueDates.length; i++) {
        const prevDate = new Date(uniqueDates[i-1]);
        const currDate = new Date(uniqueDates[i]);
        const dayDiff = (currDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24);

        if (dayDiff === 1) {
            tempStreak++;
            maxStreak = Math.max(maxStreak, tempStreak);
        } else {
            tempStreak = 1;
        }
    }

    // If no consecutive days found, max streak is 1 (assuming they played at least once)
    if (maxStreak === 0) {
        maxStreak = 1;
    }

    // Calculate current streak from the most recent date backwards
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    const mostRecentDate = uniqueDates[uniqueDates.length - 1];

    // If they played today or yesterday, start counting current streak
    if (mostRecentDate === todayStr || mostRecentDate === yesterdayStr) {
        currentStreak = 1;

        // Count backwards from most recent date
        for (let i = uniqueDates.length - 2; i >= 0; i--) {
            const currDate = new Date(uniqueDates[i + 1]);
            const prevDate = new Date(uniqueDates[i]);
            const dayDiff = (currDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24);

            if (dayDiff === 1) {
                currentStreak++;
            } else {
                break;
            }
        }
    } else {
        currentStreak = 0; // Streak is broken if they haven't played recently
    }

    return { currentStreak, maxStreak };
}

// Update user statistics table with enhanced data and achievement icons
export function updateUserStatsTable(): void {
    const container = document.getElementById('userStats');
    if (!container) return;

    if (state.userStats.length === 0 || state.allScores.length === 0) {
        container.innerHTML = '<p>No data available</p>';
        return;
    }

    // Filter user stats for head-to-head mode
    const filteredUserStats = filterDataForHeadToHead(state.userStats);

    if (filteredUserStats.length === 0) {
        container.innerHTML = '<p>No data available for selected players</p>';
        return;
    }

    // Calculate additional stats for each user
    const enhancedStats: EnhancedUserStats[] = filteredUserStats.map(user => {
        const userScores = state.allScores.filter(s => s.username === user.username);

        // Sort by date for streak and date calculations
        const sortedScores = userScores.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

        // Calculate dates
        const firstDate = sortedScores.length > 0 ? sortedScores[0].date : 'N/A';
        const lastDate = sortedScores.length > 0 ? sortedScores[sortedScores.length - 1].date : 'N/A';
        const mostRecentScore = sortedScores.length > 0 ?
            (sortedScores[sortedScores.length - 1].failed ? 'X' : sortedScores[sortedScores.length - 1].score.toString()) : 'N/A';

        // Calculate daily wins
        const dailyWins = calculateDailyWins(user.username);

        // Calculate consecutive day streaks (updated function)
        const streakData = calculateStreaks(userScores);

        return {
            ...user,
            first_date: firstDate,
            last_date: lastDate,
            most_recent_score: mostRecentScore,
            daily_wins: dailyWins,
            longest_streak: streakData.maxStreak,
            current_streak: streakData.currentStreak
        };
    });

    let html = `
        <table class="stats-table">
            <thead>
                <tr>
                    <th>Player</th>
                    <th>Games</th>
                    <th>Avg Score</th>
                    <th>Best</th>
                    <th>Performance</th>
                    <th>First Played</th>
                    <th>Last Played</th>
                    <th>Recent Score</th>
                    <th>Daily Wins</th>
                    <th>Longest Streak</th>
                    <th>Current Streak</th>
                </tr>
            </thead>
            <tbody>
    `;

    enhancedStats.forEach(user => {
        const avgScore = parseFloat(user.avg_score.toString()).toFixed(2);
        const badge = getPerformanceBadge(user.avg_score);

        html += `
            <tr>
                <td><strong><span class="player-name" style="cursor: pointer; color: #667eea;">${user.username}</span></strong></td>
                <td>${user.total_games}</td>
                <td>${avgScore}</td>
                <td>${user.best_score}</td>
                <td><span class="badge ${badge.class}">${badge.text}</span></td>
                <td>${user.first_date}</td>
                <td>${user.last_date}</td>
                <td>${user.most_recent_score}/6</td>
                <td>${user.daily_wins}</td>
                <td style="color: #48bb78">${user.longest_streak}</td>
                <td style="color: ${user.current_streak > 0 ? '#48bb78' : '#666'}">${user.current_streak}</td>
            </tr>
        `;
    });

    html += `
            </tbody>
        </table>
        <div style="margin-top: 15px; font-size: 12px; color: #666; text-align: center;">
            <strong>Performance Thresholds:</strong>
            <span style="color: #48bb78;">Excellent</span> ≤ 2.99 •
            <span style="color: #4299e1;">Good</span> 3.00-3.49 •
            <span style="color: #ed8936;">Average</span> 3.50-3.99 •
            <span style="color: #f56565;">BJ's Member</span> ≥ 4.00
        </div>
    `;
    
    container.innerHTML = html;
}

// Monthly stats interface
interface MonthlyUserStats {
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

// Update monthly leaderboard with navigation
export function updateMonthlyLeaderboard(): void {
    const container = document.getElementById('monthlyLeaderboard');
    if (!container) return;

    if (state.allScores.length === 0) {
        container.innerHTML = '<p>No data available</p>';
        return;
    }

    // Calculate target month
    const now = new Date();
    const targetDate = new Date(now.getFullYear(), now.getMonth() + state.currentMonthOffset, 1);
    const targetMonth = targetDate.getFullYear() + '-' + String(targetDate.getMonth() + 1).padStart(2, '0');

    // Update month display and button states
    const monthName = targetDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    const currentMonthDisplay = document.getElementById('currentMonthDisplay');
    if (currentMonthDisplay) {
        currentMonthDisplay.textContent = monthName;
    }

    // Enable/disable next button (can't go future from current month)
    const nextBtn = document.getElementById('nextMonthBtn') as HTMLButtonElement;
    if (nextBtn) {
        nextBtn.disabled = state.currentMonthOffset >= 0;
        nextBtn.style.opacity = state.currentMonthOffset >= 0 ? '0.5' : '1';
        nextBtn.style.cursor = state.currentMonthOffset >= 0 ? 'not-allowed' : 'pointer';
    }

    // Filter scores for target month
    let monthScores = state.allScores.filter(score => {
        const scoreMonth = score.date.substring(0, 7); // YYYY-MM
        return scoreMonth === targetMonth;
    });

    // Apply head-to-head filtering
    monthScores = filterDataForHeadToHead(monthScores);

    if (monthScores.length === 0) {
        container.innerHTML = '<p>No scores for this month</p>';
        return;
    }

    // Calculate monthly stats per user
    const monthlyStats: Record<string, MonthlyUserStats> = {};
    monthScores.forEach(score => {
        if (!monthlyStats[score.username]) {
            monthlyStats[score.username] = {
                username: score.username,
                games: 0,
                totalScore: 0,
                completedGames: 0,
                failed: 0,
                bestScore: 6,
                points: 0,
                avgScore: 'N/A',
                avgPoints: 'N/A'
            };
        }

        const user = monthlyStats[score.username];
        user.games++;

        if (score.failed) {
            user.failed++;
            user.points += 7; // X = 7 points (golf scoring)
        } else {
            user.completedGames++;
            user.totalScore += score.score;
            user.bestScore = Math.min(user.bestScore, score.score);
            user.points += score.score; // Golf scoring: 1=1pt, 2=2pts, etc.
        }
    });

    // Convert to array and calculate averages
    const leaderboard = Object.values(monthlyStats).map(user => {
        user.avgScore = user.completedGames > 0 ? (user.totalScore / user.completedGames).toFixed(2) : 'N/A';
        user.avgPoints = user.games > 0 ? (user.points / user.games).toFixed(2) : 'N/A';
        return user;
    });

    // Sort by average points (lowest first - golf scoring), then by total games as tiebreaker
    leaderboard.sort((a, b) => {
        if (a.avgPoints === 'N/A') return 1;
        if (b.avgPoints === 'N/A') return -1;
        const pointDiff = parseFloat(a.avgPoints) - parseFloat(b.avgPoints);
        if (pointDiff !== 0) return pointDiff;
        return b.games - a.games; // More games played as tiebreaker
    });

    let html = `
        <table class="stats-table">
            <thead>
                <tr>
                    <th>Rank</th>
                    <th>Player</th>
                    <th>Avg Points</th>
                    <th>Games</th>
                    <th>Avg Score</th>
                    <th>Best</th>
                </tr>
            </thead>
            <tbody>
    `;

    leaderboard.forEach((user, index) => {
        const rankIcon = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}.`;

        html += `
            <tr style="${index < 3 ? 'background: #f8f9fa;' : ''}">
                <td style="text-align: center;">${rankIcon}</td>
                <td><strong>${user.username}</strong></td>
                <td style="color: #667eea; font-weight: bold;">${user.avgPoints}</td>
                <td>${user.games}</td>
                <td>${user.avgScore}</td>
                <td>${user.bestScore === 6 ? 'N/A' : user.bestScore}</td>
            </tr>
        `;
    });

    html += '</tbody></table>';
    html += '<div style="margin-top: 10px; font-size: 12px; color: #666; text-align: center;">Golf Scoring: 1=1pt, 2=2pts, 3=3pts, 4=4pts, 5=5pts, 6=6pts, X=7pts (Lower is better)</div>';

    container.innerHTML = html;
}

// Update performance summary widget
export function updatePerformanceSummary(): void {
    const container = document.getElementById('performanceSummary');
    if (!container) return;

    if (state.allScores.length === 0) {
        container.innerHTML = '<p>No data available</p>';
        return;
    }

    // Filter scores for head-to-head mode
    const scoresToConsider = filterDataForHeadToHead(state.allScores);

    const totalGames = scoresToConsider.length;
    const completedGames = scoresToConsider.filter(s => !s.failed).length;
    const failedGames = scoresToConsider.filter(s => s.failed).length;
    const successRate = totalGames > 0 ? ((completedGames / totalGames) * 100).toFixed(1) : '0';

    const avgScore = completedGames > 0
        ? (scoresToConsider.filter(s => !s.failed).reduce((sum, s) => sum + s.score, 0) / completedGames).toFixed(2)
        : 'N/A';

    const bestScore = completedGames > 0
        ? Math.min(...scoresToConsider.filter(s => !s.failed).map(s => s.score))
        : 'N/A';

    const uniquePlayers = new Set(scoresToConsider.map(s => s.username)).size;
    const daysPlayed = new Set(scoresToConsider.map(s => s.date)).size;

    let html = `
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; font-size: 14px;">
            <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; text-align: center;">
                <div style="font-size: 24px; font-weight: bold; color: #667eea;">${totalGames}</div>
                <div style="color: #666; margin-top: 5px;">Total Games</div>
            </div>
            <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; text-align: center;">
                <div style="font-size: 24px; font-weight: bold; color: #48bb78;">${successRate}%</div>
                <div style="color: #666; margin-top: 5px;">Success Rate</div>
            </div>
            <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; text-align: center;">
                <div style="font-size: 24px; font-weight: bold; color: #f39c12;">${avgScore}</div>
                <div style="color: #666; margin-top: 5px;">Avg Score</div>
            </div>
            <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; text-align: center;">
                <div style="font-size: 24px; font-weight: bold; color: #27ae60;">${bestScore}</div>
                <div style="color: #666; margin-top: 5px;">Best Score</div>
            </div>
            <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; text-align: center;">
                <div style="font-size: 24px; font-weight: bold; color: #9b59b6;">${uniquePlayers}</div>
                <div style="color: #666; margin-top: 5px;">Players</div>
            </div>
            <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; text-align: center;">
                <div style="font-size: 24px; font-weight: bold; color: #e74c3c;">${daysPlayed}</div>
                <div style="color: #666; margin-top: 5px;">Days Played</div>
            </div>
        </div>
    `;

    container.innerHTML = html;
}

// Update score heatmap - assumes dates are already in EST timezone from database
export function updateScoreHeatmap(): void {
    const container = document.getElementById('scoreHeatmap');
    if (!container) return;

    if (state.allScores.length === 0) {
        container.innerHTML = '<p>No data available</p>';
        return;
    }

    // Filter scores for head-to-head mode
    const scoresToConsider = filterDataForHeadToHead(state.allScores);

    // Group scores by user and date (already EST from database)
    const users = [...new Set(scoresToConsider.map(s => s.username))].sort();
    const dates = [...new Set(scoresToConsider.map(s => s.date))].sort().reverse();

    const scoreMatrix: Record<string, Record<string, Score | null>> = {};
    users.forEach(user => {
        scoreMatrix[user] = {};
        dates.forEach(date => {
            // Get ALL scores for this user on this date
            const userScoresForDate = scoresToConsider.filter(s => s.username === user && s.date === date);

            if (userScoresForDate.length > 0) {
                // If multiple scores on same day, show the best one (lowest number)
                const bestScore = userScoresForDate.reduce((best, current) => {
                    if (current.failed && !best.failed) return best;
                    if (!current.failed && best.failed) return current;
                    if (current.failed && best.failed) return best;
                    return current.score < best.score ? current : best;
                });
                scoreMatrix[user][date] = bestScore;
            } else {
                scoreMatrix[user][date] = null;
            }
        });
    });

    // Create heatmap HTML
    let html = `
        <div style="display: flex; font-size: 16px; font-family: monospace;">
            <div style="width: 150px; flex-shrink: 0;">
                <div style="height: 40px;"></div>
    `;

    users.forEach(user => {
        html += `<div style="height: 45px; line-height: 45px; padding-right: 15px; text-align: right; font-weight: bold; font-size: 14px;">${user}</div>`;
    });

    html += '</div><div style="overflow-x: auto; flex-grow: 1;"><div style="display: flex;">';

    dates.forEach(date => {
        const shortDate = date.slice(5); // MM-DD format
        html += `
            <div style="width: 40px; margin-right: 3px;">
                <div style="height: 40px; line-height: 40px; text-align: center; font-size: 12px; transform: rotate(-45deg); transform-origin: center;">${shortDate}</div>
        `;

        users.forEach(user => {
            const score = scoreMatrix[user][date];
            let bgColor = '#f0f0f0';
            let textColor = '#999';
            let displayText = '—';
            let cellContent = '';

            if (score) {
                if (score.failed) {
                    bgColor = '#2c3e50';
                    textColor = 'white';
                    displayText = 'X';
                } else {
                    const colors = ['#27ae60', '#2ecc71', '#f39c12', '#e67e22', '#e74c3c', '#c0392b'];
                    bgColor = colors[score.score - 1];
                    textColor = 'white';
                    displayText = score.score.toString();
                }

                // Create Discord link if message_id exists
                if (score.message_id) {
                    const discordLink = `https://discord.com/channels/577258915402612757/1381727975548125346/${score.message_id}`;
                    cellContent = `<a href="${discordLink}" target="_blank" style="color: ${textColor}; text-decoration: none; display: block; width: 100%; height: 100%; display: flex; align-items: center; justify-content: center;">${displayText}</a>`;
                } else {
                    cellContent = displayText;
                }
            } else {
                cellContent = displayText;
            }

            const tooltipText = score ?
                (score.failed ? 'Failed' : `Score ${score.score}`) +
                (score.message_id ? ' (Click to view Discord message)' : '') :
                'No score';

            html += `
                <div style="
                    width: 37px;
                    height: 45px;
                    background-color: ${bgColor};
                    color: ${textColor};
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-weight: bold;
                    font-size: 16px;
                    border: 1px solid #ddd;
                    ${score && score.message_id ? 'cursor: pointer;' : ''}
                " title="${user} on ${date}: ${tooltipText}">${cellContent}</div>
            `;
        });

        html += '</div>';
    });

    html += '</div></div></div>';

    // Add legend
    html += `
        <div style="margin-top: 25px; display: flex; align-items: center; gap: 20px; font-size: 16px;">
            <span style="font-weight: bold;">Legend:</span>
            <div style="display: flex; gap: 8px;">
                <div style="width: 30px; height: 30px; background: #27ae60; color: white; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 16px;">1</div>
                <div style="width: 30px; height: 30px; background: #2ecc71; color: white; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 16px;">2</div>
                <div style="width: 30px; height: 30px; background: #f39c12; color: white; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 16px;">3</div>
                <div style="width: 30px; height: 30px; background: #e67e22; color: white; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 16px;">4</div>
                <div style="width: 30px; height: 30px; background: #e74c3c; color: white; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 16px;">5</div>
                <div style="width: 30px; height: 30px; background: #c0392b; color: white; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 16px;">6</div>
                <div style="width: 30px; height: 30px; background: #2c3e50; color: white; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 16px;">X</div>
                <div style="width: 30px; height: 30px; background: #f0f0f0; color: #999; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 16px;">—</div>
            </div>
            <span style="margin-left: 15px; color: #666; font-size: 14px;">Green = Better, Red = Worse, X = Failed, — = No Score</span>
            <span style="margin-left: 15px; color: #666; font-size: 12px; font-style: italic;">*Shows best score when multiple games played same day</span>
            <span style="margin-left: 15px; color: #667eea; font-size: 12px; font-weight: bold;">Click scores to view Discord messages</span>
        </div>
    `;

    container.innerHTML = html;
} 