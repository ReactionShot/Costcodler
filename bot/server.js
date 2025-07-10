const express = require('express');
const cors = require('cors');
const path = require('path');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');

// Import our modules
const { startBot, stopBot, initializeDevelopmentMode } = require('./discord');
const { closeDatabase } = require('./db');
const { getScores } = require('./api/scores');
const { getUsers } = require('./api/users');
const { getDailyStatsEndpoint, manualScrape, getDebugScores } = require('./api/daily');

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

app.use('/api/', generalLimiter);

// CORS configuration - restrict to specific origins in production
const corsOptions = {
    origin: process.env.NODE_ENV === 'production'
        ? ['http://localhost:3000', 'https://yourdomain.com'] // INPUT YOUR DOMAIN
        : true,
    credentials: true
};
app.use(cors(corsOptions));

app.use(express.json({ limit: '10mb' }));

// Serve static files from web directory
app.use(express.static(path.join(__dirname, '../web')));

// Serve dashboard at root path
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../web', 'index.html'));
});

// API routes
app.get('/api/scores', getScores);
app.get('/api/users', getUsers);
app.get('/api/daily-stats', getDailyStatsEndpoint);
app.post('/api/scrape/:channelId', manualScrape);
app.get('/api/debug/scores', getDebugScores);

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'healthy', timestamp: new Date().toISOString() });
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
    
    try {
        // Start Discord bot (or skip in development without token)
        await startBot();
        
        // If Discord bot didn't start (development mode), initialize database with mock data
        if (!process.env.DISCORD_TOKEN && process.env.NODE_ENV === 'development') {
            await initializeDevelopmentMode();
        }
    } catch (error) {
        console.error('Startup error:', error);
        if (process.env.NODE_ENV === 'production') {
            process.exit(1);
        }
    }
});

// Graceful shutdown
process.on('SIGINT', async () => {
    console.log('Shutting down...');
    try {
        if (process.env.DISCORD_TOKEN) {
            await stopBot();
        }
    } catch (error) {
        console.error('Error stopping Discord bot:', error);
    }
    closeDatabase();
    process.exit(0);
});

process.on('SIGTERM', async () => {
    console.log('Shutting down...');
    try {
        if (process.env.DISCORD_TOKEN) {
            await stopBot();
        }
    } catch (error) {
        console.error('Error stopping Discord bot:', error);
    }
    closeDatabase();
    process.exit(0);
}); 