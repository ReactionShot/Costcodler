// src/web/achievements.ts
import { state, filterDataForHeadToHead, HEAD_TO_HEAD_PLAYERS } from './state.js';
import type { Score, Achievement } from '../types/index.js';

// Get achievement icons for a user
function getAchievementIcons(username: string): string {
    if (!state.userAchievements[username]) return '';

    return state.userAchievements[username]
        .filter(achievement => achievement.earned)
        .map(achievement => `<span class="achievement-icon" data-tooltip="${achievement.title}: ${achievement.desc}">${achievement.icon}</span>`)
        .join(' ');
}

// Update achievements system - now calculates for all users and stores globally
export function updateAchievements(): void {
    if (state.allScores.length === 0) {
        state.userAchievements = {};
        return;
    }

    // Calculate achievements for each user
    state.userAchievements = {};
    const users = [...new Set(state.allScores.map(s => s.username))];

    users.forEach(username => {
        const userScores = state.allScores.filter(s => s.username === username);
        const completedScores = userScores.filter(s => !s.failed);
        const sortedScores = userScores.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

        const achievements: Achievement[] = [];

        // First Blood - First person to submit a score each day
        if (state.allScores.length > 0) {
            const firstEverDate = Math.min(...state.allScores.map(s => new Date(s.date).getTime()));
            const userFirstDate = userScores.length > 0 ? Math.min(...userScores.map(s => new Date(s.date).getTime())) : null;
            if (userFirstDate && userFirstDate === firstEverDate) {
                achievements.push({ icon: '🩸', title: 'First Blood', desc: 'First to submit a Costcodle score', earned: true });
            }
        }

        // Perfect Game - Score of 1 (Fixed: only count actual 1s, not failed scores)
        const perfectGames = completedScores.filter(s => s.score === 1).length;

        console.log(`${username}: ${perfectGames} perfect games from scores:`, completedScores.map(s => s.score));

        if (perfectGames > 0) {
            achievements.push({
                icon: '🎯',
                title: 'Perfect Game',
                desc: 'Score of 1',
                earned: true,
                progress: `${perfectGames} perfect game${perfectGames !== 1 ? 's' : ''}`
            });

            // Hat Trick - 3 perfect games
            if (perfectGames >= 3) {
                achievements.push({
                    icon: '🎩',
                    title: 'Hat Trick',
                    desc: '3 perfect games',
                    earned: true,
                    progress: `${perfectGames} perfect games`
                });
            }

            // Perfect Ten - 10 perfect games
            if (perfectGames >= 10) {
                achievements.push({
                    icon: '💎',
                    title: 'Perfect Ten',
                    desc: '10 perfect games',
                    earned: true,
                    progress: `${perfectGames} perfect games`
                });
            }

            // Legendary - 25 perfect games
            if (perfectGames >= 25) {
                achievements.push({
                    icon: '👑',
                    title: 'Legendary',
                    desc: '25 perfect games',
                    earned: true,
                    progress: `${perfectGames} perfect games`
                });
            }

            // Perfect Streak - 3 perfect games in a row
            let currentStreak = 0;
            let maxPerfectStreak = 0;
            sortedScores.forEach(score => {
                if (!score.failed && score.score === 1) {
                    currentStreak++;
                    maxPerfectStreak = Math.max(maxPerfectStreak, currentStreak);
                } else {
                    currentStreak = 0;
                }
            });
            if (maxPerfectStreak >= 3) {
                achievements.push({
                    icon: '⭐',
                    title: 'Perfect Streak',
                    desc: '3 perfect games in a row',
                    earned: true,
                    progress: `Best perfect streak: ${maxPerfectStreak}`
                });
            }
        }

        // Consistency King - 10+ games with avg ≤ 3.0
        const avgScore = completedScores.length > 0 ?
            completedScores.reduce((sum, s) => sum + s.score, 0) / completedScores.length : 6;
        if (completedScores.length >= 10 && avgScore <= 3.0) {
            achievements.push({
                icon: '⚖️',
                title: 'Consistency King',
                desc: '10+ games with avg ≤ 3.0',
                earned: true,
                progress: `${completedScores.length} games, ${avgScore.toFixed(2)} avg`
            });
        }

        // Elite Player - 20+ games with avg ≤ 2.5
        if (completedScores.length >= 20 && avgScore <= 2.5) {
            achievements.push({
                icon: '🏅',
                title: 'Elite Player',
                desc: '20+ games with avg ≤ 2.5',
                earned: true,
                progress: `${completedScores.length} games, ${avgScore.toFixed(2)} avg`
            });
        }

        // Hot Streak - 5 games in a row ≤ 3
        let currentStreak = 0;
        let maxStreak = 0;
        sortedScores.forEach(score => {
            if (!score.failed && score.score <= 3) {
                currentStreak++;
                maxStreak = Math.max(maxStreak, currentStreak);
            } else {
                currentStreak = 0;
            }
        });
        if (maxStreak >= 5) {
            achievements.push({
                icon: '🔥',
                title: 'Hot Streak',
                desc: '5 games in a row ≤ 3',
                earned: true,
                progress: `Best streak: ${maxStreak}`
            });
        }

        // Dedication - 30+ games played
        if (userScores.length >= 30) {
            achievements.push({
                icon: '💪',
                title: 'Dedication',
                desc: '30+ games played',
                earned: true,
                progress: `${userScores.length} games`
            });
        }

        // Marathon Player - 100+ games played
        if (userScores.length >= 100) {
            achievements.push({
                icon: '🏃',
                title: 'Marathon Player',
                desc: '100+ games played',
                earned: true,
                progress: `${userScores.length} games`
            });
        }

        // Never Give Up - 0 failed games with 20+ attempts
        const failedGames = userScores.filter(s => s.failed).length;
        if (userScores.length >= 20 && failedGames === 0) {
            achievements.push({
                icon: '🛡️',
                title: 'Never Give Up',
                desc: 'No failed games with 20+ attempts',
                earned: true,
                progress: `${userScores.length} games, ${failedGames} fails`
            });
        }

        // Comeback Kid - Best score after worst streak
        if (userScores.length >= 10) {
            let worstStreak = 0;
            let currentBadStreak = 0;
            let hadComebackAfterBadStreak = false;

            for (let i = 0; i < sortedScores.length; i++) {
                const score = sortedScores[i];
                if (score.failed || score.score >= 5) {
                    currentBadStreak++;
                    worstStreak = Math.max(worstStreak, currentBadStreak);
                } else {
                    if (currentBadStreak >= 3 && score.score === 1) {
                        hadComebackAfterBadStreak = true;
                    }
                    currentBadStreak = 0;
                }
            }

            if (hadComebackAfterBadStreak) {
                achievements.push({
                    icon: '🔄',
                    title: 'Comeback Kid',
                    desc: 'Perfect game after 3+ bad scores',
                    earned: true,
                    progress: `Bounced back with a perfect score`
                });
            }
        }

        // === COSTCO-THEMED ACHIEVEMENTS ===

        // Gold Star Member - 50+ games played
        if (userScores.length >= 50) {
            achievements.push({
                icon: '⭐',
                title: 'Gold Star Member',
                desc: '50+ games played',
                earned: true,
                progress: `${userScores.length} games`
            });
        }

        // Executive Member - 5+ perfect games
        if (perfectGames >= 5) {
            achievements.push({
                icon: '💳',
                title: 'Executive Member',
                desc: '5+ perfect games',
                earned: true,
                progress: `${perfectGames} perfect games`
            });
        }

        // Hot Dog Combo - Score exactly 1.50 average (impossible but fun)
        // Actually let's make it getting a 2 exactly 15 times
        const exactTwos = completedScores.filter(s => s.score === 2).length;
        if (exactTwos >= 15) {
            achievements.push({
                icon: '🌭',
                title: 'Hot Dog Combo',
                desc: '15 games with score of 2',
                earned: true,
                progress: `${exactTwos} perfect twos`
            });
        }

        // Bulk Buyer - 75+ games played
        if (userScores.length >= 75) {
            achievements.push({
                icon: '📦',
                title: 'Bulk Buyer',
                desc: '75+ games played',
                earned: true,
                progress: `${userScores.length} games`
            });
        }

        // Food Court Regular - Play 7 days in a row
        const uniqueDates = [...new Set(userScores.map(s => s.date))].sort();
        let maxConsecutiveDays = 0;
        let currentConsecutive = 1;

        for (let i = 1; i < uniqueDates.length; i++) {
            const prevDate = new Date(uniqueDates[i-1]);
            const currDate = new Date(uniqueDates[i]);
            const dayDiff = (currDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24);

            if (dayDiff === 1) {
                currentConsecutive++;
                maxConsecutiveDays = Math.max(maxConsecutiveDays, currentConsecutive);
            } else {
                currentConsecutive = 1;
            }
        }

        if (maxConsecutiveDays >= 7) {
            achievements.push({
                icon: '🍕',
                title: 'Food Court Regular',
                desc: '7 consecutive days playing',
                earned: true,
                progress: `${maxConsecutiveDays} day streak`
            });
        }

        // Warehouse Worker - Average score exactly 3.0
        if (completedScores.length >= 10 && avgScore >= 2.95 && avgScore <= 3.05) {
            achievements.push({
                icon: '🏭',
                title: 'Warehouse Worker',
                desc: 'Average score exactly 3.0',
                earned: true,
                progress: `${avgScore.toFixed(2)} average`
            });
        }

        // Sample Station - Try lots of different scores (3+ different score values)
        const uniqueScores = [...new Set(completedScores.map(s => s.score))];
        if (uniqueScores.length >= 4 && userScores.length >= 20) {
            achievements.push({
                icon: '🧄',
                title: 'Sample Station',
                desc: 'Score 4+ different values (20+ games)',
                earned: true,
                progress: `Scored: ${uniqueScores.sort((a, b) => a - b).join(', ')}`
            });
        }

        state.userAchievements[username] = achievements;
    });

    console.log('Achievements calculated:', state.userAchievements);
}

// Update achievements widget - now full width with better layout
export function updateAchievementsWidget(specificUser: string | null = null): void {
    const container = document.getElementById('achievementsWidget');
    if (!container) return;

    if (Object.keys(state.userAchievements).length === 0) {
        container.innerHTML = '<p>No achievements available</p>';
        return;
    }

    // Filter to specific user if requested, or apply head-to-head filter
    let usersToShow: [string, Achievement[]][];
    if (specificUser) {
        usersToShow = [[specificUser, state.userAchievements[specificUser] || []]];
    } else {
        // Apply head-to-head filter if active
        usersToShow = Object.entries(state.userAchievements)
            .filter(([username, achievements]) => {
                if (!state.headToHeadMode) return achievements.length > 0;
                return (HEAD_TO_HEAD_PLAYERS as readonly string[]).includes(username) && achievements.length > 0;
            })
            .sort((a, b) => b[1].length - a[1].length);
    }

    if (usersToShow.length === 0) {
        container.innerHTML = '<p>No achievements earned yet</p>';
        return;
    }

    // Create a grid layout for better use of space
    let html = '<div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(400px, 1fr)); gap: 20px;">';

    usersToShow.forEach(([username, achievements]) => {
        if (achievements.length === 0) {
            html += `
                <div class="user-achievements" style="border: 1px solid #e2e8f0; border-radius: 8px; padding: 15px; background: #f8f9fa;">
                    <h4 style="margin-bottom: 12px; padding-bottom: 8px; border-bottom: 2px solid #667eea;">${username} (No achievements yet)</h4>
                    <p style="color: #666; font-style: italic;">Keep playing to earn achievements!</p>
                </div>
            `;
            return;
        }

        html += `
            <div class="user-achievements" style="border: 1px solid #e2e8f0; border-radius: 8px; padding: 15px; background: #f8f9fa;">
                <h4 style="margin-bottom: 12px; padding-bottom: 8px; border-bottom: 2px solid #667eea;">${username} (${achievements.length})</h4>
        `;

        achievements.forEach(achievement => {
            html += `
                <div class="achievement-item">
                    <div class="icon">${achievement.icon}</div>
                    <div class="achievement-details">
                        <div class="achievement-title">${achievement.title}</div>
                        <div class="achievement-desc">${achievement.desc}</div>
                        ${achievement.progress ? `<div class="achievement-desc" style="color: #888; font-style: italic;">${achievement.progress}</div>` : ''}
                    </div>
                </div>
            `;
        });

        html += '</div>';
    });

    html += '</div>';

    // Add "Show All" button if showing specific user
    if (specificUser) {
        html += '<div style="text-align: center; margin-top: 20px;"><button onclick="updateAchievementsWidget()" style="background: #667eea; color: white; border: none; padding: 10px 20px; border-radius: 6px; cursor: pointer;">Show All Players</button></div>';
    }

    container.innerHTML = html;
}

// Show achievements for a specific user
export function showUserAchievements(username: string): void {
    if (!state.userAchievements[username] || state.userAchievements[username].length === 0) {
        alert(`${username} has no achievements yet!`);
        return;
    }

    // Expand achievements if collapsed
    if (!state.achievementsExpanded) {
        toggleAllAchievements();
    }

    // Update widget to show only this user
    updateAchievementsWidget(username);

    // Scroll to achievements
    const achievementsWidget = document.getElementById('achievementsWidget');
    if (achievementsWidget) {
        achievementsWidget.scrollIntoView({ behavior: 'smooth' });
    }
}

// Toggle all achievements visibility
export function toggleAllAchievements(): void {
    const widget = document.getElementById('achievementsWidget');
    const button = document.getElementById('toggleAchievementsBtn');

    if (!widget || !button) return;

    if (state.achievementsExpanded) {
        widget.style.display = 'none';
        button.textContent = 'Show All';
        state.achievementsExpanded = false;
    } else {
        widget.style.display = 'block';
        button.textContent = 'Hide All';
        state.achievementsExpanded = true;
        updateAchievementsWidget(); // Show all users again
    }
}

// Export helper function for internal use
export { getAchievementIcons }; 