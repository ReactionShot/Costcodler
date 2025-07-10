const { getAllScores } = require('../db');

// API endpoint to get all scores
async function getScores(req, res) {
    try {
        const limit = Math.min(parseInt(req.query.limit) || 1000, 10000); // Allow higher limits
        const offset = Math.max(parseInt(req.query.offset) || 0, 0);

        const scores = await getAllScores(limit, offset);
        console.log(`Returning ${scores.length} scores`);
        res.json(scores);
    } catch (error) {
        console.error('Database error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}

module.exports = {
    getScores
}; 