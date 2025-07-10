const validator = require('validator');

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

module.exports = {
    validateUsername,
    validateScore,
    validateDate,
    validateMessageId,
    validateChannelId,
    sanitizeMessage,
    parseCostcodleScore
}; 