import { Request, Response } from 'express';
import { getDatabaseManager } from '../db/index.js';
import { scrapeHistoricalMessages } from '../discord/index.js';
import { DatabaseError } from '../../types/backend.js';

// API endpoint to get daily statistics
export async function getDailyStatsEndpoint(req: Request, res: Response): Promise<void> {
    try {
        const dbManager = getDatabaseManager();
        const dailyStats = await dbManager.getDailyStats();
        res.json(dailyStats);
    } catch (error) {
        console.error('Database error:', error);
        if (error instanceof DatabaseError) {
            res.status(500).json({ error: 'Database error: ' + error.message });
        } else {
            const errorMessage = error instanceof Error ? error.message : 'Internal server error';
            res.status(500).json({ error: errorMessage });
        }
    }
}

// Optional: Add manual scrape endpoint for emergencies (admin only)
export async function manualScrape(req: Request, res: Response): Promise<void> {
    // Only allow in development or with special header
    if (process.env.NODE_ENV === 'production' && req.headers['x-admin-key'] !== process.env.ADMIN_KEY) {
        res.status(404).json({ error: 'Not found' });
        return;
    }

    try {
        const { channelId } = req.params;
        const limit = parseInt(req.query.limit as string) || 10000;

        if (!channelId) {
            res.status(400).json({ error: 'Channel ID is required' });
            return;
        }

        const count = await scrapeHistoricalMessages(channelId, limit);
        res.json({
            message: `Manually scraped ${count} historical scores`,
            channelId: channelId,
            limit: limit
        });
    } catch (error) {
        console.error('Manual scrape error:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        res.status(400).json({ error: errorMessage });
    }
}

// Debug endpoint to check database contents
export async function getDebugScores(req: Request, res: Response): Promise<void> {
    if (process.env.NODE_ENV === 'production') {
        res.status(404).json({ error: 'Not found' });
        return;
    }

    try {
        const dbManager = getDatabaseManager();
        const debugInfo = await dbManager.getDebugInfo();
        res.json(debugInfo);
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        res.status(500).json({ error: errorMessage });
    }
} 