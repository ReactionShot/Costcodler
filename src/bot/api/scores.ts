import { Request, Response } from 'express';
import { getDatabaseManager } from '../db/index.js';
import { DatabaseError } from '../../types/backend.js';

// API endpoint to get all scores
export async function getScores(req: Request, res: Response): Promise<void> {
    try {
        const limit = Math.min(parseInt(req.query.limit as string) || 1000, 10000); // Allow higher limits
        const offset = Math.max(parseInt(req.query.offset as string) || 0, 0);

        const dbManager = getDatabaseManager();
        const scores = await dbManager.getAllScores(limit, offset);
        console.log(`Returning ${scores.length} scores`);
        res.json(scores);
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