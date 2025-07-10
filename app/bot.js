// Hardcoded channel ID - INPUT CHANNEL ID
const CHANNEL_ID = '';

const { Client, GatewayIntentBits } = require('discord.js');
const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const path = require('path');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const validator = require('validator');

// Initialize Discord client
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

// Initialize SQLite database (use /data directory for Docker persistence)
const dbPath = process.env.NODE_ENV === 'production' ? '/data/costcodle_scores.db' : './costcodle_scores.db';
const db = new sqlite3.Database(dbPath);

// Initialize database with proper async handling

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
`);

// Add message_date column if it doesn't exist (for existing databases)
db.run(`ALTER TABLE scores ADD COLUMN message_date DATETIME`, (err) => {
    if (err && !err.message.includes('duplicate column name')) {
        console.error('Error adding message_date column:', err);
    }
});

// Function to scrape historical messages with validation
async function scrapeHistoricalMessages(channelId, limit = 10000) {
    if (!validateChannelId(channelId)) {
        throw new Error('Invalid channel ID');
    }

    try {
        const channel = await client.channels.fetch(channelId);

        // Check if bot has permission to read channel
        if (!channel.permissionsFor(client.user).has('ReadMessageHistory')) {
            throw new Error('Bot does not have permission to read message history');
        }

        let messages = [];
        let lastMessageId = null;
        let totalFetched = 0;

        console.log(`Starting to scrape channel ${channelId}...`);

        // Keep fetching until we get all messages or hit the limit
        while (totalFetched < limit) {
            const batchSize = Math.min(100, limit - totalFetched);
            const options = { limit: batchSize };
            if (lastMessageId) {
                options.before = lastMessageId;
            }

            const batch = await channel.messages.fetch(options);
            if (batch.size === 0) {
                console.log('No more messages to fetch');
                break;
            }

            const batchArray = Array.from(batch.values());
            messages = messages.concat(batchArray);
            totalFetched += batch.size;
            lastMessageId = batchArray[batchArray.length - 1].id;

            console.log(`Fetched ${batch.size} messages, total: ${totalFetched}`);

            // Small delay to be nice to Discord API
            await new Promise(resolve => setTimeout(resolve, 100));
        }

        console.log(`Total messages fetched: ${messages.length}`);

        let savedCount = 0;
        for (const message of messages) {
			if (message.author.bot) continue;

			const result = parseCostcodleScore(message.content);
			if (result !== null) {
				try {
					// Convert Discord message timestamp to EST (same as current messageCreate handler)
					const messageDate = new Date(message.createdAt);
					const estDate = new Date(messageDate.toLocaleString("en-US", {timeZone: "America/New_York"}));
					const gameDate = estDate.toISOString().split('T')[0]; // YYYY-MM-DD format

					await saveScore(
						message.author.id,
						message.author.username,
						result.score,
						result.failed,
						gameDate, // ← Use the new EST-adjusted date
						message.id,
						message.content,
						message.createdAt.toISOString()
					);
					savedCount++;
				} catch (error) {
					// Ignore duplicate entries but log other errors
					if (!error.message.includes('UNIQUE constraint failed')) {
						console.error('Error saving historical score:', error.message);
					}
				}
			}
		}

        console.log(`Scraped ${savedCount} historical scores from ${messages.length} messages`);
        return savedCount;
    } catch (error) {
        console.error('Error scraping historical messages:', error);
        throw error;
    }
}

// Function to check if database is empty and scrape if needed
async function checkAndScrapeIfEmpty() {
    return new Promise((resolve, reject) => {
        db.get('SELECT COUNT(*) as count FROM scores', async (err, row) => {
            if (err) {
                console.error('Error checking database:', err);
                return reject(err);
            }

            const count = row.count;
            console.log(`Database contains ${count} scores`);

            if (count === 0) {
                console.log('Database is empty, starting historical scrape...');
                try {
                    // Hardcoded channel ID for automatic scraping
                    //const CHANNEL_ID = '';
                    const scrapedCount = await scrapeHistoricalMessages(CHANNEL_ID);
                    console.log(`✅ Automatic historical scrape completed: ${scrapedCount} scores imported`);
                    resolve(scrapedCount);
                } catch (error) {
                    console.error('❌ Automatic historical scrape failed:', error.message);
                    resolve(0); // Don't reject, just continue without historical data
                }
            } else {
                console.log('Database has existing data, skipping historical scrape');
                resolve(0);
            }
        });
    });
}

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

// Express server for API
const app = express();

// Trust proxy for rate limiting (fixes the X-Forwarded-For warning)
app.set('trust proxy', 1);

// Security middleware
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            scriptSrc: ["'self'", "'unsafe-inline'", "https://cdnjs.cloudflare.com"],
            scriptSrcAttr: ["'unsafe-inline'"], // Allow inline event handlers
            imgSrc: ["'self'", "data:", "https:"],
            fontSrc: ["'self'"],
            connectSrc: ["'self'"]
        }
    }
}));

// Rate limiting
const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later.'
});

const scrapeLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 5, // limit each IP to 5 scrape requests per hour
    message: 'Too many scrape requests, please try again later.'
});

app.use('/api/', generalLimiter);
// Removed scrape limiter since we removed the endpoint

// CORS configuration - restrict to specific origins in production
const corsOptions = {
    origin: process.env.NODE_ENV === 'production'
        ? ['http://localhost:3000', 'https://yourdomain.com'] // Updated domain
        : true,
    credentials: true
};
app.use(cors(corsOptions));

app.use(express.json({ limit: '10mb' }));

// Serve static files from public directory
app.use(express.static('public'));

// Serve dashboard at root path
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Input validation functions
function validateUsername(username) {
    return typeof username === 'string' &&
           username.length >= 1 &&
           username.length <= 32 &&
           /^[a-zA-Z0-9_.-]+$/.test(username);
}

function validateScore(score) {
    return Number.isInteger(score) && score >= 1 && score <= 6;
}

function validateDate(date) {
    return validator.isDate(date) && new Date(date) <= new Date();
}

function validateMessageId(messageId) {
    return typeof messageId === 'string' &&
           /^\d{17,19}$/.test(messageId); // Discord snowflake format
}

function validateChannelId(channelId) {
    return typeof channelId === 'string' &&
           /^\d{17,19}$/.test(channelId); // Discord snowflake format
}

function sanitizeMessage(message) {
    return validator.escape(message.substring(0, 500)); // Limit length and escape HTML
}

// Regular expression to match Costcodle scores - handles X/6 and extra text
const costcodleRegex = /Costcodle\s+#?(\d{1,4})\s+([1-6X])\/6/i;

// Function to parse Costcodle score from message
function parseCostcodleScore(content) {
    const match = content.match(costcodleRegex);
    if (match) {
        const scoreStr = match[2].toUpperCase();

        if (scoreStr === 'X') {
            return { score: null, failed: true }; // Failed attempt
        } else {
            const score = parseInt(scoreStr);
            if (validateScore(score)) {
                return { score: score, failed: false };
            }
        }
    }
    return null;
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

// Discord bot event handlers
client.once('ready', async () => {
    console.log(`Bot is ready! Logged in as ${client.user.tag}`);

    // Initialize database first
    try {
        await initializeDatabase();

        // Then check if database is empty and scrape historical data if needed
        await checkAndScrapeIfEmpty();
    } catch (error) {
        console.error('Error during startup:', error);
    }
});

client.on('messageCreate', async (message) => {
    // Ignore bot messages
    if (message.author.bot) return;

    // Additional validation
    if (!message.guild) return; // Only process guild messages
    if (message.content.length > 1000) return; // Ignore very long messages

    // Check if message contains Costcodle score
    const result = parseCostcodleScore(message.content);
    if (result !== null) {
        try {
            // Convert Discord message timestamp to EST and get date
            const messageDate = new Date(message.createdAt);
            const estDate = new Date(messageDate.toLocaleString("en-US", {timeZone: "America/New_York"}));
            const gameDate = estDate.toISOString().split('T')[0]; // YYYY-MM-DD format

            await saveScore(
                message.author.id,
                message.author.username,
                result.score,
                result.failed,
                gameDate, // Use EST-adjusted date
                message.id,
                message.content,
                message.createdAt.toISOString() // Keep original UTC timestamp for message_date
            );

            const displayScore = result.failed ? 'X' : result.score;
            console.log(`Saved score ${displayScore}/6 for ${message.author.username} on ${gameDate} (EST)`);
        } catch (error) {
            console.error('Error saving score:', error.message);
        }
    }
});

// API endpoints with validation - FIXED to return all scores properly
app.get('/api/scores', (req, res) => {
    const limit = Math.min(parseInt(req.query.limit) || 1000, 10000); // Allow higher limits
    const offset = Math.max(parseInt(req.query.offset) || 0, 0);

    // Fixed query to get ALL individual scores, not grouped
    db.all(
        `SELECT id, user_id, username, score, failed, date, message_id, message_date, created_at
         FROM scores
         ORDER BY message_date DESC, created_at DESC
         LIMIT ? OFFSET ?`,
        [limit, offset],
        (err, rows) => {
            if (err) {
                console.error('Database error:', err);
                res.status(500).json({ error: 'Internal server error' });
            } else {
                console.log(`Returning ${rows.length} scores`);
                res.json(rows);
            }
        }
    );
});

// Enhanced users endpoint with additional statistics
app.get('/api/users', (req, res) => {
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
            res.status(500).json({ error: 'Internal server error' });
        } else {
            res.json(rows);
        }
    });
});

// Fixed daily stats to properly calculate averages
app.get('/api/daily-stats', (req, res) => {
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
            res.status(500).json({ error: 'Internal server error' });
        } else {
            res.json(rows);
        }
    });
});

// Optional: Add manual scrape endpoint for emergencies (admin only)
app.post('/api/scrape/:channelId', async (req, res) => {
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
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Debug endpoint to check database contents
app.get('/api/debug/scores', (req, res) => {
    if (process.env.NODE_ENV === 'production') {
        return res.status(404).json({ error: 'Not found' });
    }

    db.all(
        'SELECT COUNT(*) as total, date, COUNT(DISTINCT username) as unique_users FROM scores GROUP BY date ORDER BY date DESC LIMIT 10',
        (err, rows) => {
            if (err) {
                res.status(500).json({ error: err.message });
            } else {
                res.json(rows);
            }
        }
    );
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    res.status(500).json({ error: 'Internal server error' });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: 'Not found' });
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, async () => {
    console.log(`Server running on port ${PORT}`);

    // Initialize database when server starts
    try {
        await initializeDatabase();
        console.log('Database initialization complete');
    } catch (error) {
        console.error('Database initialization failed:', error);
    }
});

// Login to Discord
client.login(process.env.DISCORD_TOKEN);

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('Shutting down...');
    db.close();
    client.destroy();
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log('Shutting down...');
    db.close();
    client.destroy();
    process.exit(0);
});
