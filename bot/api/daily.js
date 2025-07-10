const { getDailyStats, getDebugInfo } = require('../db');
const { scrapeHistoricalMessages } = require('../discord');

// API endpoint to get daily statistics
async function getDailyStatsEndpoint(req, res) {
    try {
        const dailyStats = await getDailyStats();
        res.json(dailyStats);
    } catch (error) {
        console.error('Database error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}

// Optional: Add manual scrape endpoint for emergencies (admin only)
async function manualScrape(req, res) {
    // Only allow in development or with special header
    if (process.env.NODE_ENV === 'production' && req.headers['x-admin-key'] !== process.env.ADMIN_KEY) {
        return res.status(404).json({ error: 'Not found' });
    }

    try {
        const { channelId } = req.params;
        const limit = parseInt(req.query.limit) || 10000;

        const count = await scrapeHistoricalMessages(channelId, limit);
        res.json({
            message: `Manually scraped ${count} historical scores`,
            channelId: channelId,
            limit: limit
        });
    } catch (error) {
        console.error('Manual scrape error:', error);
        res.status(400).json({ error: error.message });
    }
}

// Debug endpoint to check database contents
async function getDebugScores(req, res) {
    if (process.env.NODE_ENV === 'production') {
        return res.status(404).json({ error: 'Not found' });
    }

    try {
        const debugInfo = await getDebugInfo();
        res.json(debugInfo);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

module.exports = {
    getDailyStatsEndpoint,
    manualScrape,
    getDebugScores
}; 