import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import path from 'path';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import { fileURLToPath } from 'url';

// Import our modules
import { startBot, stopBot, initializeDevelopmentMode } from './discord/index.js';
import { closeDatabase } from './db/index.js';
import { getScores } from './api/scores.js';
import { getUsers } from './api/users.js';
import { getDailyStatsEndpoint, manualScrape, getDebugScores } from './api/daily.js';
import type { AppConfig } from '../types/backend.js';

// Get __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration with proper typing
const config: AppConfig = {
  NODE_ENV: (process.env.NODE_ENV as 'development' | 'production' | 'test') || 'development',
  DISCORD_TOKEN: process.env.DISCORD_TOKEN,
  PORT: parseInt(process.env.PORT || '3000', 10),
  DB_PATH: process.env.DB_PATH || './costcodle_scores.db',
  ADMIN_KEY: process.env.ADMIN_KEY
};

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
const allowedOrigins = process.env.CORS_ORIGINS?.split(',') || [];
const corsOptions: cors.CorsOptions = {
    origin: config.NODE_ENV === 'production'
        ? allowedOrigins.length > 0 ? allowedOrigins : false
        : true,
    credentials: true
};

// Validate CORS origins in production
if (config.NODE_ENV === 'production' && allowedOrigins.length === 0) {
    console.warn('⚠️  CORS_ORIGINS environment variable not set in production. CORS will be disabled.');
}
app.use(cors(corsOptions));

app.use(express.json({ limit: '10mb' }));

// Determine web directory path - always use dist/web for built files
const webPath = path.join(__dirname, '../../dist/web');
const staticPath = path.join(__dirname, '../../web');

// Serve built JavaScript files from dist/web
app.use(express.static(webPath));

// Serve static assets (HTML, CSS) from web directory
app.use(express.static(staticPath));

// Serve dashboard at root path
app.get('/', (req: Request, res: Response) => {
    res.sendFile(path.join(staticPath, 'index.html'));
});

// API routes
app.get('/api/scores', getScores);
app.get('/api/users', getUsers);
app.get('/api/daily-stats', getDailyStatsEndpoint);
app.post('/api/scrape/:channelId', manualScrape);
app.get('/api/debug/scores', getDebugScores);

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
    res.json({ 
        status: 'healthy', 
        timestamp: new Date().toISOString(),
        environment: config.NODE_ENV,
        hasDiscordToken: !!config.DISCORD_TOKEN
    });
});

// Error handling middleware
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
    console.error('Unhandled error:', err);
    res.status(500).json({ error: 'Internal server error' });
});

// 404 handler
app.use((req: Request, res: Response) => {
    res.status(404).json({ error: 'Not found' });
});

// Start the server
app.listen(config.PORT, async () => {
    console.log(`🚀 Server running on port ${config.PORT}`);
    console.log(`📁 Serving built JS files from: ${webPath}`);
    console.log(`🌐 Serving static assets from: ${staticPath}`);
    console.log(`🌍 Environment: ${config.NODE_ENV}`);
    
    try {
        // Start Discord bot (or skip in development without token)
        await startBot();
        
        // If Discord bot didn't start (development mode), initialize database with mock data
        if (!config.DISCORD_TOKEN && config.NODE_ENV === 'development') {
            console.log('🎭 Starting development mode with mock data...');
            await initializeDevelopmentMode();
        }
    } catch (error) {
        console.error('❌ Startup error:', error);
        if (config.NODE_ENV === 'production') {
            process.exit(1);
        }
    }
});

// Graceful shutdown handlers
async function gracefulShutdown(signal: string): Promise<void> {
    console.log(`🛑 ${signal} received, shutting down gracefully...`);
    try {
        if (config.DISCORD_TOKEN) {
            console.log('⏹️ Stopping Discord bot...');
            await stopBot();
        }
        console.log('🗄️ Closing database...');
        await closeDatabase();
        console.log('✅ Shutdown complete');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error during shutdown:', error);
        process.exit(1);
    }
}

process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM')); 