// web/js/charts.js
import { state, filterDataForHeadToHead } from './state.js';

// Store chart instances globally for proper cleanup
let trendsChart = null;
let distributionChart = null;
let dailyChart = null;
let progressChart = null;

// Function to add toggle all button to charts
function addToggleAllButton(chartId, chartInstance) {
    const chartContainer = document.getElementById(chartId).parentElement;

    // Remove existing button if it exists
    const existingButton = chartContainer.querySelector('.toggle-all-btn');
    if (existingButton) {
        existingButton.remove();
    }

    // Create toggle all button
    const toggleButton = document.createElement('button');
    toggleButton.className = 'toggle-all-btn';
    toggleButton.textContent = 'Hide All';
    toggleButton.style.cssText = `
        position: absolute;
        top: 10px;
        right: 10px;
        background: #667eea;
        color: white;
        border: none;
        padding: 6px 12px;
        border-radius: 4px;
        cursor: pointer;
        font-size: 12px;
        z-index: 1000;
    `;

    let allHidden = false;

    toggleButton.addEventListener('click', () => {
        if (allHidden) {
            // Show all datasets
            chartInstance.data.datasets.forEach((dataset, index) => {
                chartInstance.setDatasetVisibility(index, true);
            });
            toggleButton.textContent = 'Hide All';
            allHidden = false;
        } else {
            // Hide all datasets
            chartInstance.data.datasets.forEach((dataset, index) => {
                chartInstance.setDatasetVisibility(index, false);
            });
            toggleButton.textContent = 'Show All';
            allHidden = true;
        }
        chartInstance.update();
    });

    chartContainer.style.position = 'relative';
    chartContainer.appendChild(toggleButton);
}

// Update trends chart
export function updateTrendsChart() {
    const ctx = document.getElementById('trendsChart').getContext('2d');

    // Destroy existing chart if it exists
    if (trendsChart) {
        trendsChart.destroy();
        trendsChart = null;
    }

    // Filter scores for head-to-head mode
    const scoresToConsider = filterDataForHeadToHead(state.allScores);

    // Group scores by user and date
    const userProgress = {};
    scoresToConsider.forEach(score => {
        if (!userProgress[score.username]) {
            userProgress[score.username] = {};
        }
        userProgress[score.username][score.date] = score.score;
    });

    // Get unique dates and sort them
    const dates = [...new Set(scoresToConsider.map(s => s.date))].sort().reverse();

    // Create datasets for each user with unique colors
    const colors = [
        '#e74c3c', '#3498db', '#f39c12', '#2ecc71', '#9b59b6',
        '#e67e22', '#1abc9c', '#34495e', '#f1c40f', '#8e44ad',
        '#d35400', '#27ae60', '#2980b9', '#c0392b', '#16a085'
    ];
    const datasets = Object.keys(userProgress).map((username, index) => {
        const data = dates.map(date => userProgress[username][date] || null);

        return {
            label: username,
            data: data,
            borderColor: colors[index % colors.length],
            backgroundColor: colors[index % colors.length] + '20',
            fill: false,
            tension: 0.1,
            spanGaps: true
        };
    });

    trendsChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: dates,
            datasets: datasets
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    max: 6,
                    title: {
                        display: true,
                        text: 'Score'
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: 'Date'
                    }
                }
            },
            plugins: {
                title: {
                    display: true,
                    text: state.headToHeadMode ? 'Score Trends: .cyco vs clicky6792' : 'Score Trends Over Time'
                },
                legend: {
                    onClick: (e, legendItem, legend) => {
                        // Default click behavior
                        Chart.defaults.plugins.legend.onClick(e, legendItem, legend);
                    }
                }
            }
        }
    });

    // Add toggle all button
    addToggleAllButton('trendsChart', trendsChart);
}

// Update distribution chart
export function updateDistributionChart() {
    const ctx = document.getElementById('distributionChart').getContext('2d');

    // Destroy existing chart if it exists
    if (distributionChart) {
        distributionChart.destroy();
        distributionChart = null;
    }

    // Filter scores for head-to-head mode
    const scoresToConsider = filterDataForHeadToHead(state.allScores);

    // Count score frequencies
    const scoreCounts = {};
    for (let i = 1; i <= 6; i++) {
        scoreCounts[i] = 0;
    }

    scoresToConsider.forEach(score => {
        if (!score.failed) {
            scoreCounts[score.score]++;
        }
    });

    distributionChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['1', '2', '3', '4', '5', '6'],
            datasets: [{
                label: 'Frequency',
                data: Object.values(scoreCounts),
                backgroundColor: [
                    '#48bb78',
                    '#4299e1',
                    '#ed8936',
                    '#f56565',
                    '#9f7aea',
                    '#38b2ac'
                ]
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Number of Games'
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: 'Score'
                    }
                }
            },
            plugins: {
                title: {
                    display: true,
                    text: state.headToHeadMode ? 'Score Distribution: .cyco vs clicky6792' : 'Score Distribution'
                }
            }
        }
    });
}

// Update daily chart
export function updateDailyChart() {
    const ctx = document.getElementById('dailyChart').getContext('2d');

    // Destroy existing chart if it exists
    if (dailyChart) {
        dailyChart.destroy();
        dailyChart = null;
    }

    // Filter daily stats for head-to-head mode if needed
    let dailyStatsToUse = state.dailyStats;
    if (state.headToHeadMode) {
        // Recalculate daily stats for just the head-to-head players
        const h2hScores = filterDataForHeadToHead(state.allScores);
        const dailyData = {};

        h2hScores.forEach(score => {
            if (!dailyData[score.date]) {
                dailyData[score.date] = { scores: [], failed: 0 };
            }
            if (score.failed) {
                dailyData[score.date].failed++;
            } else {
                dailyData[score.date].scores.push(score.score);
            }
        });

        dailyStatsToUse = Object.keys(dailyData).map(date => {
            const dayData = dailyData[date];
            const scores = dayData.scores;
            return {
                date: date,
                players: scores.length + dayData.failed,
                avg_score: scores.length > 0 ? (scores.reduce((sum, s) => sum + s, 0) / scores.length).toFixed(2) : null,
                best_score: scores.length > 0 ? Math.min(...scores) : null,
                worst_score: scores.length > 0 ? Math.max(...scores) : null,
                failed_count: dayData.failed
            };
        }).filter(d => d.avg_score !== null);
    }

    const sortedDaily = dailyStatsToUse.sort((a, b) => new Date(b.date) - new Date(a.date));

    dailyChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: sortedDaily.map(d => d.date),
            datasets: [{
                label: 'Daily Average',
                data: sortedDaily.map(d => d.avg_score),
                borderColor: '#667eea',
                backgroundColor: '#667eea20',
                tension: 0.1
            }, {
                label: 'Best Score',
                data: sortedDaily.map(d => d.best_score),
                borderColor: '#48bb78',
                backgroundColor: '#48bb7820',
                tension: 0.1
            }, {
                label: 'Worst Score',
                data: sortedDaily.map(d => d.worst_score),
                borderColor: '#e74c3c',
                backgroundColor: '#e74c3c20',
                tension: 0.1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    max: 6,
                    title: {
                        display: true,
                        text: 'Score'
                    }
                }
            },
            plugins: {
                title: {
                    display: true,
                    text: state.headToHeadMode ? 'Daily Performance: .cyco vs clicky6792' : 'Daily Performance'
                }
            }
        }
    });
}

// Update progress chart (moving average)
export function updateProgressChart() {
    const ctx = document.getElementById('progressChart').getContext('2d');

    // Destroy existing chart if it exists
    if (progressChart) {
        progressChart.destroy();
        progressChart = null;
    }

    // Filter scores for head-to-head mode
    const scoresToConsider = filterDataForHeadToHead(state.allScores);

    // Calculate 7-day moving average for each user with unique colors
    const users = [...new Set(scoresToConsider.map(s => s.username))];
    const colors = [
        '#e74c3c', '#3498db', '#f39c12', '#2ecc71', '#9b59b6',
        '#e67e22', '#1abc9c', '#34495e', '#f1c40f', '#8e44ad',
        '#d35400', '#27ae60', '#2980b9', '#c0392b', '#16a085'
    ];
    const datasets = users.map((username, index) => {
        const userScores = scoresToConsider.filter(s => s.username === username && !s.failed)
            .sort((a, b) => new Date(a.date) - new Date(b.date));

        const movingAvg = [];
        for (let i = 0; i < userScores.length; i++) {
            const start = Math.max(0, i - 6);
            const subset = userScores.slice(start, i + 1);
            const avg = subset.reduce((sum, s) => sum + s.score, 0) / subset.length;
            movingAvg.push(avg);
        }

        return {
            label: username,
            data: movingAvg,
            borderColor: colors[index % colors.length],
            backgroundColor: colors[index % colors.length] + '20',
            fill: false,
            tension: 0.1
        };
    });

    progressChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: Array.from({length: Math.max(...datasets.map(d => d.data.length))}, (_, i) => i + 1),
            datasets: datasets
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    max: 6,
                    title: {
                        display: true,
                        text: 'Moving Average Score'
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: 'Game Number'
                    }
                }
            },
            plugins: {
                title: {
                    display: true,
                    text: state.headToHeadMode ? '7-Game Moving Average: .cyco vs clicky6792' : '7-Game Moving Average'
                },
                legend: {
                    onClick: (e, legendItem, legend) => {
                        // Default click behavior
                        Chart.defaults.plugins.legend.onClick(e, legendItem, legend);
                    }
                }
            }
        }
    });

    // Add toggle all button
    addToggleAllButton('progressChart', progressChart);
}

// Export the addToggleAllButton function for use by other modules
export { addToggleAllButton }; 