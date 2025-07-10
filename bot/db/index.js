const sqlite3 = require('sqlite3').verbose();
const { validateUsername, validateScore, validateDate, validateMessageId, sanitizeMessage } = require('../util');

// Initialize SQLite database (use /data directory for Docker persistence)
const dbPath = process.env.NODE_ENV === 'production' ? '/data/costcodle_scores.db' : './costcodle_scores.db';
const db = new sqlite3.Database(dbPath);

// Initialize database with proper async handling
async function initializeDatabase() {
    return new Promise((resolve, reject) => {
        // Create table if it doesn't exist
        db.run(`
            CREATE TABLE IF NOT EXISTS scores (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id TEXT NOT NULL,
                username TEXT NOT NULL,
                score INTEGER, -- NULL for failed attempts (X/6)
                failed BOOLEAN DEFAULT FALSE,
                date TEXT NOT NULL,
                message_id TEXT UNIQUE NOT NULL,
                raw_message TEXT,
                message_date DATETIME NOT NULL, -- When the Discord message was sent
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP -- When we recorded it in DB
            )
        `, (err) => {
            if (err) {
                console.error('Error creating table:', err);
                return reject(err);
            }

            console.log('✅ Database table ready');

            // Now try to add the message_date column if it doesn't exist (for migration)
            db.run(`ALTER TABLE scores ADD COLUMN message_date DATETIME`, (err) => {
                if (err && !err.message.includes('duplicate column name')) {
                    console.log('Note: message_date column already exists or table is new');
                }
                resolve();
            });
        });
    });
}

// Function to save score to database with validation
function saveScore(userId, username, score, failed, date, messageId, rawMessage, messageDate) {
    return new Promise((resolve, reject) => {
        // Validate all inputs
        if (!validateUsername(username)) {
            return reject(new Error('Invalid username'));
        }
        if (!failed && !validateScore(score)) {
            return reject(new Error('Invalid score'));
        }
        if (!validateDate(date)) {
            return reject(new Error('Invalid date'));
        }
        if (!validateMessageId(messageId)) {
            return reject(new Error('Invalid message ID'));
        }

        const sanitizedMessage = sanitizeMessage(rawMessage);

        db.run(
            'INSERT OR REPLACE INTO scores (user_id, username, score, failed, date, message_id, raw_message, message_date) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [userId, username, score, failed, date, messageId, sanitizedMessage, messageDate],
            function(err) {
                if (err) {
                    reject(err);
                } else {
                    resolve(this.lastID);
                }
            }
        );
    });
}

// Function to check if database is empty
function checkDatabaseEmpty() {
    return new Promise((resolve, reject) => {
        db.get('SELECT COUNT(*) as count FROM scores', (err, row) => {
            if (err) {
                console.error('Error checking database:', err);
                return reject(err);
            }
            resolve(row.count === 0);
        });
    });
}

// Get all scores with pagination
function getAllScores(limit = 1000, offset = 0) {
    return new Promise((resolve, reject) => {
        db.all(
            `SELECT id, user_id, username, score, failed, date, message_id, message_date, created_at
             FROM scores
             ORDER BY message_date DESC, created_at DESC
             LIMIT ? OFFSET ?`,
            [limit, offset],
            (err, rows) => {
                if (err) {
                    console.error('Database error:', err);
                    reject(err);
                } else {
                    resolve(rows);
                }
            }
        );
    });
}

// Get user statistics
function getUserStats() {
    return new Promise((resolve, reject) => {
        db.all(`
            SELECT
                username,
                COUNT(*) as total_games,
                COUNT(CASE WHEN failed = 0 THEN 1 END) as completed_games,
                COUNT(CASE WHEN failed = 1 THEN 1 END) as failed_games,
                ROUND(AVG(CASE WHEN failed = 0 THEN score END), 2) as avg_score,
                MIN(CASE WHEN failed = 0 THEN score END) as best_score,
                MAX(CASE WHEN failed = 0 THEN score END) as worst_score,
                ROUND(COUNT(CASE WHEN failed = 0 THEN 1 END) * 100.0 / COUNT(*), 1) as success_rate,
                MIN(date) as first_date,
                MAX(date) as last_date,
                MAX(created_at) as last_played
            FROM scores
            GROUP BY username
            ORDER BY avg_score ASC
            LIMIT 100
        `, (err, rows) => {
            if (err) {
                console.error('Database error:', err);
                reject(err);
            } else {
                resolve(rows);
            }
        });
    });
}

// Get daily statistics
function getDailyStats() {
    return new Promise((resolve, reject) => {
        db.all(`
            SELECT
                date,
                COUNT(*) as players,
                ROUND(AVG(CASE WHEN failed = 0 THEN score END), 2) as avg_score,
                MIN(CASE WHEN failed = 0 THEN score END) as best_score,
                MAX(CASE WHEN failed = 0 THEN score END) as worst_score,
                COUNT(CASE WHEN failed = 1 THEN 1 END) as failed_count
            FROM scores
            GROUP BY date
            ORDER BY date DESC
            LIMIT 365
        `, (err, rows) => {
            if (err) {
                console.error('Database error:', err);
                reject(err);
            } else {
                resolve(rows);
            }
        });
    });
}

// Get debug information
function getDebugInfo() {
    return new Promise((resolve, reject) => {
        db.all(
            'SELECT COUNT(*) as total, date, COUNT(DISTINCT username) as unique_users FROM scores GROUP BY date ORDER BY date DESC LIMIT 10',
            (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows);
                }
            }
        );
    });
}

// Close database connection
function closeDatabase() {
    db.close();
}

module.exports = {
    initializeDatabase,
    saveScore,
    checkDatabaseEmpty,
    getAllScores,
    getUserStats,
    getDailyStats,
    getDebugInfo,
    closeDatabase,
    db // Export the database instance for advanced operations
}; 