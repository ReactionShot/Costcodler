// web/js/charts.js
import { state } from './state.js';

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

    // Group scores by user and date
    const userProgress = {};
    state.allScores.forEach(score => {
        if (!userProgress[score.username]) {
            userProgress[score.username] = {};
        }
        userProgress[score.username][score.date] = score.score;
    });

    // Get unique dates and sort them
    const dates = [...new Set(state.allScores.map(s => s.date))].sort();

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

    const trendsChart = new Chart(ctx, {
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
                    text: 'Score Trends Over Time'
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

    // Count score frequencies
    const scoreCounts = {};
    for (let i = 1; i <= 6; i++) {
        scoreCounts[i] = 0;
    }

    state.allScores.forEach(score => {
        if (!score.failed) {
            scoreCounts[score.score]++;
        }
    });

    new Chart(ctx, {
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
                    text: 'Score Distribution'
                }
            }
        }
    });
}

// Update daily chart
export function updateDailyChart() {
    const ctx = document.getElementById('dailyChart').getContext('2d');

    const sortedDaily = state.dailyStats.sort((a, b) => new Date(a.date) - new Date(b.date));

    new Chart(ctx, {
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
                    text: 'Daily Performance'
                }
            }
        }
    });
}

// Update progress chart (moving average) with toggle all button
export function updateProgressChart() {
    const ctx = document.getElementById('progressChart').getContext('2d');

    // Calculate 7-day moving average for each user with unique colors
    const users = [...new Set(state.allScores.map(s => s.username))];
    const colors = [
        '#e74c3c', '#3498db', '#f39c12', '#2ecc71', '#9b59b6',
        '#e67e22', '#1abc9c', '#34495e', '#f1c40f', '#8e44ad',
        '#d35400', '#27ae60', '#2980b9', '#c0392b', '#16a085'
    ];
    const datasets = users.map((username, index) => {
        const userScores = state.allScores.filter(s => s.username === username && !s.failed)
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

    const progressChart = new Chart(ctx, {
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
                    text: '7-Game Moving Average'
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