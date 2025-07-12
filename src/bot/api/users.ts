import { Request, Response } from 'express';
import { getDatabaseManager } from '../db/index.js';
import { DatabaseError } from '../../types/backend.js';

// API endpoint to get user statistics
export async function getUsers(req: Request, res: Response): Promise<void> {
    try {
        const dbManager = getDatabaseManager();
        const users = await dbManager.getUserStats();
        res.json(users);
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