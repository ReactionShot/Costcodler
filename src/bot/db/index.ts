import sqlite3 from 'sqlite3';
import { validateUsername, validateScore, validateDate, validateMessageId, sanitizeMessage } from '../util/index.js';
import type { DatabaseManager } from '../../types/backend.js';
import { DatabaseError } from '../../types/backend.js';
import type { Score, UserStats, DailyStats } from '../../types/index.js';

// Type definitions for SQLite row results
interface ScoreRow {
    id: number;
    user_id: string;
    username: string;
    score: number;
    failed: number; // SQLite stores boolean as 0/1
    date: string;
    message_id: string;
    message_date: string;
    created_at: string;
}

interface UserStatsRow {
    username: string;
    total_games: number;
    completed_games: number;
    failed_games: number;
    avg_score: number;
    best_score: number;
    worst_score: number;
    success_rate: number;
    first_date: string;
    last_date: string;
    last_played: string;
}

interface DailyStatsRow {
    date: string;
    players: number;
    avg_score: number;
    best_score: number;
    worst_score: number;
    failed_count: number;
}

// Enable verbose mode for better error reporting
const sqlite = sqlite3.verbose();

// Initialize SQLite database (use /data directory for Docker persistence)
const dbPath = process.env.NODE_ENV === 'production' ? '/data/costcodle_scores.db' : './costcodle_scores.db';
const db = new sqlite.Database(dbPath);

// Database manager implementation
class DatabaseManagerImpl implements DatabaseManager {
    public db: sqlite3.Database;

    constructor(database: sqlite3.Database) {
        this.db = database;
    }

    // Initialize database with proper async handling
    async init(): Promise<void> {
        return new Promise((resolve, reject) => {
            // Create table if it doesn't exist
            this.db.run(`
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
                    console.error('❌ Error creating table:', err);
                    return reject(new DatabaseError('Failed to create table', err));
                }

                console.log('✅ Database table ready');

                // Now try to add the message_date column if it doesn't exist (for migration)
                this.db.run(`ALTER TABLE scores ADD COLUMN message_date DATETIME`, (err) => {
                    if (err && !err.message.includes('duplicate column name')) {
                        console.log('ℹ️ Note: message_date column already exists or table is new');
                    }
                    resolve();
                });
            });
        });
    }

    // Function to save score to database with validation
    async insertScore(score: Omit<Score, 'id'>): Promise<number> {
        return new Promise((resolve, reject) => {
            // Validate all inputs
            if (!validateUsername(score.username)) {
                return reject(new DatabaseError('Invalid username'));
            }
            if (!score.failed && !validateScore(score.score)) {
                return reject(new DatabaseError('Invalid score'));
            }
            if (!validateDate(score.date)) {
                return reject(new DatabaseError('Invalid date'));
            }
            if (score.message_id && !validateMessageId(score.message_id)) {
                return reject(new DatabaseError('Invalid message ID'));
            }

            // For backward compatibility, extract fields that might not exist in the Score interface
            const userId = 'user_' + score.username; // Generate a user ID if not provided
            const rawMessage = ''; // Default empty raw message
            const sanitizedMessage = sanitizeMessage(rawMessage);

            this.db.run(
                'INSERT OR REPLACE INTO scores (user_id, username, score, failed, date, message_id, raw_message, message_date) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
                [userId, score.username, score.score, score.failed, score.date, score.message_id, sanitizedMessage, score.message_date],
                function(err) {
                    if (err) {
                        reject(new DatabaseError('Failed to insert score', err));
                    } else {
                        resolve(this.lastID);
                    }
                }
            );
        });
    }

    // Get all scores with pagination
    async getAllScores(limit: number = 1000, offset: number = 0): Promise<Score[]> {
        return new Promise((resolve, reject) => {
            this.db.all(
                `SELECT id, user_id, username, score, failed, date, message_id, message_date, created_at
                 FROM scores
                 ORDER BY message_date DESC, created_at DESC
                 LIMIT ? OFFSET ?`,
                [limit, offset],
                (err, rows: ScoreRow[]) => {
                    if (err) {
                        console.error('❌ Database error:', err);
                        reject(new DatabaseError('Failed to get scores', err));
                    } else {
                        const scores: Score[] = rows.map(row => ({
                            id: row.id,
                            username: row.username,
                            score: row.score,
                            failed: Boolean(row.failed),
                            date: row.date,
                            message_id: row.message_id,
                            message_date: row.message_date,
                            created_at: row.created_at
                        }));
                        resolve(scores);
                    }
                }
            );
        });
    }

    // Get user statistics
    async getUserStats(): Promise<UserStats[]> {
        return new Promise((resolve, reject) => {
            this.db.all(`
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
            `, (err, rows: UserStatsRow[]) => {
                if (err) {
                    console.error('❌ Database error:', err);
                    reject(new DatabaseError('Failed to get user stats', err));
                } else {
                    const userStats: UserStats[] = rows.map(row => ({
                        username: row.username,
                        total_games: row.total_games,
                        avg_score: row.avg_score || 0,
                        best_score: row.best_score || 6,
                        failed_games: row.failed_games || 0
                    }));
                    resolve(userStats);
                }
            });
        });
    }

    // Get daily statistics
    async getDailyStats(): Promise<DailyStats[]> {
        return new Promise((resolve, reject) => {
            this.db.all(`
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
            `, (err, rows: DailyStatsRow[]) => {
                if (err) {
                    console.error('❌ Database error:', err);
                    reject(new DatabaseError('Failed to get daily stats', err));
                } else {
                    const dailyStats: DailyStats[] = rows.map(row => ({
                        date: row.date,
                        players: row.players,
                        avg_score: row.avg_score,
                        best_score: row.best_score,
                        worst_score: row.worst_score,
                        failed_count: row.failed_count
                    }));
                    resolve(dailyStats);
                }
            });
        });
    }

    // Close database connection
    async close(): Promise<void> {
        return new Promise((resolve) => {
            this.db.close((err) => {
                if (err) {
                    console.error('❌ Error closing database:', err);
                }
                resolve();
            });
        });
    }

    // Alias for init() for backward compatibility
    async initializeDatabase(): Promise<void> {
        return this.init();
    }

    // Function to save score with individual parameters (backward compatibility)
    async saveScore(
        userId: string,
        username: string,
        score: number,
        failed: boolean,
        date: string,
        messageId: string,
        rawMessage: string,
        messageDate: string
    ): Promise<number> {
        const scoreData: Omit<Score, 'id'> = {
            username,
            score,
            failed,
            date,
            message_id: messageId,
            message_date: messageDate,
            created_at: new Date().toISOString()
        };
        
        return await this.insertScore(scoreData);
    }

    // Check if database is empty
    async checkDatabaseEmpty(): Promise<boolean> {
        return new Promise((resolve, reject) => {
            this.db.get('SELECT COUNT(*) as count FROM scores', (err, row: { count: number }) => {
                if (err) {
                    console.error('❌ Error checking database:', err);
                    return reject(new DatabaseError('Failed to check database', err));
                }
                resolve(row.count === 0);
            });
        });
    }

    // Get debug information
    async getDebugInfo(): Promise<any[]> {
        return new Promise((resolve, reject) => {
            this.db.all(
                'SELECT COUNT(*) as total, date, COUNT(DISTINCT username) as unique_users FROM scores GROUP BY date ORDER BY date DESC LIMIT 10',
                (err, rows) => {
                    if (err) {
                        reject(new DatabaseError('Failed to get debug info', err));
                    } else {
                        resolve(rows);
                    }
                }
            );
        });
    }
}

// Create database manager instance
const databaseManager = new DatabaseManagerImpl(db);

// Initialize database
export async function initializeDatabase(): Promise<void> {
    await databaseManager.init();
}

// Function to save score to database with validation (backward compatibility)
export async function saveScore(
    userId: string, 
    username: string, 
    score: number, 
    failed: boolean, 
    date: string, 
    messageId: string, 
    rawMessage: string, 
    messageDate: string
): Promise<number> {
    const scoreData: Omit<Score, 'id'> = {
        username,
        score,
        failed,
        date,
        message_id: messageId,
        message_date: messageDate,
        created_at: new Date().toISOString()
    };
    
    return await databaseManager.insertScore(scoreData);
}

// Function to check if database is empty
export async function checkDatabaseEmpty(): Promise<boolean> {
    return new Promise((resolve, reject) => {
        db.get('SELECT COUNT(*) as count FROM scores', (err, row: { count: number }) => {
            if (err) {
                console.error('❌ Error checking database:', err);
                return reject(new DatabaseError('Failed to check database', err));
            }
            resolve(row.count === 0);
        });
    });
}

// Export wrapper functions for backward compatibility
export async function getAllScores(limit?: number, offset?: number): Promise<Score[]> {
    return await databaseManager.getAllScores(limit, offset);
}

export async function getUserStats(): Promise<UserStats[]> {
    return await databaseManager.getUserStats();
}

export async function getDailyStats(): Promise<DailyStats[]> {
    return await databaseManager.getDailyStats();
}

// Get debug information
export async function getDebugInfo(): Promise<any[]> {
    return new Promise((resolve, reject) => {
        db.all(
            'SELECT COUNT(*) as total, date, COUNT(DISTINCT username) as unique_users FROM scores GROUP BY date ORDER BY date DESC LIMIT 10',
            (err, rows) => {
                if (err) {
                    reject(new DatabaseError('Failed to get debug info', err));
                } else {
                    resolve(rows);
                }
            }
        );
    });
}

// Close database connection
export async function closeDatabase(): Promise<void> {
    await databaseManager.close();
}

// Export the database manager and instance for advanced operations
export { databaseManager, db };

// Function to get database manager instance
export function getDatabaseManager(): DatabaseManager {
    return databaseManager;
} 