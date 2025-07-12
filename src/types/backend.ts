// Backend-specific types for the Costcodle tracker

import { Database } from 'sqlite3';
import { Request, Response } from 'express';
import { Score, UserStats, DailyStats } from './index.js';

// Database types
export interface DatabaseManager {
  db: Database;
  init(): Promise<void>;
  initializeDatabase(): Promise<void>;
  insertScore(score: Omit<Score, 'id'>): Promise<number>;
  bulkInsertScores(scores: Omit<Score, 'id'>[]): Promise<number[]>;
  saveScore(
    userId: string,
    username: string,
    score: number | null,
    failed: boolean,
    date: string,
    messageId: string,
    rawMessage: string,
    messageDate: string
  ): Promise<number>;
  getAllScores(limit?: number, offset?: number): Promise<Score[]>;
  getUserStats(): Promise<UserStats[]>;
  getDailyStats(): Promise<DailyStats[]>;
  getDebugInfo(): Promise<any[]>;
  checkDatabaseEmpty(): Promise<boolean>;
  close(): Promise<void>;
}

// Discord types
export interface DiscordMessage {
  id: string;
  content: string;
  author: {
    username: string;
    id: string;
  };
  createdAt: Date;
  url: string;
}

export interface ParsedScore {
  username: string;
  score: number;
  failed: boolean;
  messageId: string;
  messageDate: string;
}

export interface DiscordBot {
  start(): Promise<void>;
  stop(): Promise<void>;
  isReady(): boolean;
}

// API types
export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    username: string;
  };
}

export interface ApiController {
  getScores(req: Request, res: Response): Promise<void>;
  getUserStats(req: Request, res: Response): Promise<void>;
  getDailyStats(req: Request, res: Response): Promise<void>;
}

// Configuration types
export interface AppConfig {
  NODE_ENV: 'development' | 'production' | 'test';
  DISCORD_TOKEN?: string;
  PORT: number;
  DB_PATH: string;
  ADMIN_KEY?: string;
}

// Mock data types for development
export interface MockUser {
  username: string;
  skillLevel: 'excellent' | 'good' | 'average' | 'poor';
  participationRate: number; // 0-1
}

export interface MockDataGenerator {
  generateUsers(): MockUser[];
  generateScoresForUser(user: MockUser, days: number): Score[];
  generateAllMockData(days?: number): Score[];
}

// Utility types
export type DatabaseRow = Record<string, any>;
export type QueryResult<T> = Promise<T[]>;
export type QuerySingle<T> = Promise<T | undefined>;

// Error types
export class DatabaseError extends Error {
  constructor(message: string, public readonly originalError?: Error) {
    super(message);
    this.name = 'DatabaseError';
  }
}

export class DiscordError extends Error {
  constructor(message: string, public readonly originalError?: Error) {
    super(message);
    this.name = 'DiscordError';
  }
}

export class ValidationError extends Error {
  constructor(message: string, public readonly field?: string) {
    super(message);
    this.name = 'ValidationError';
  }
} 