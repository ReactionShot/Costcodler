const { getUserStats } = require('../db');

// API endpoint to get user statistics
async function getUsers(req, res) {
    try {
        const users = await getUserStats();
        res.json(users);
    } catch (error) {
        console.error('Database error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}

module.exports = {
    getUsers
}; 