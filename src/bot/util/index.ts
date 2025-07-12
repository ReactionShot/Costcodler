import validator from 'validator';

// Type definitions for parsing results
export interface ParsedCostcodleScore {
    score: number | null;
    failed: boolean;
}

// Input validation functions
export function validateUsername(username: string): boolean {
    return typeof username === 'string' &&
           username.length >= 1 &&
           username.length <= 32 &&
           /^[a-zA-Z0-9_.-]+$/.test(username);
}

export function validateScore(score: number | null): boolean {
    return score !== null && Number.isInteger(score) && score >= 1 && score <= 6;
}

export function validateDate(date: string): boolean {
    return validator.isDate(date) && new Date(date) <= new Date();
}

export function validateMessageId(messageId: string): boolean {
    return typeof messageId === 'string' &&
           /^\d{17,19}$/.test(messageId); // Discord snowflake format
}

export function validateChannelId(channelId: string): boolean {
    return typeof channelId === 'string' &&
           /^\d{17,19}$/.test(channelId); // Discord snowflake format
}

export function sanitizeMessage(message: string): string {
    return validator.escape(message.substring(0, 500)); // Limit length and escape HTML
}

// Regular expression to match Costcodle scores - handles X/6 and extra text
const costcodleRegex = /Costcodle\s+#?(\d{1,4})\s+([1-6X])\/6/i;

// Function to parse Costcodle score from message
export function parseCostcodleScore(content: string): ParsedCostcodleScore | null {
    const match = content.match(costcodleRegex);
    if (match) {
        const scoreStr = match[2].toUpperCase();

        if (scoreStr === 'X') {
            return { score: null, failed: true }; // Failed attempt
        } else {
            const score = parseInt(scoreStr, 10);
            if (validateScore(score)) {
                return { score: score, failed: false };
            }
        }
    }
    return null;
} 