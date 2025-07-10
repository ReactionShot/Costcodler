const { Client, GatewayIntentBits } = require('discord.js');
const { validateChannelId, parseCostcodleScore } = require('../util');
const { saveScore, checkDatabaseEmpty, initializeDatabase } = require('../db');

// Hardcoded channel ID - INPUT CHANNEL ID
const CHANNEL_ID = '';

// Initialize Discord client
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

// Function to generate mock data for development
async function generateMockData() {
    const mockUsers = [
        'CostcoFan2024', 'BulkBuyer', 'HotDogLover', 'SampleStationPro', 'KirklandBest',
        'WarehouseWalker', 'ExecutiveMember', 'FoodCourtRegular', 'GoldStarMember'
    ];
    
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30); // 30 days ago
    
    let savedCount = 0;
    
    for (let dayOffset = 0; dayOffset < 30; dayOffset++) {
        const currentDate = new Date(startDate);
        currentDate.setDate(startDate.getDate() + dayOffset);
        const dateStr = currentDate.toISOString().split('T')[0];
        
        // Not every user plays every day
        const playingUsers = mockUsers.filter(() => Math.random() > 0.3);
        
        for (const username of playingUsers) {
            // Generate realistic score distribution
            const rand = Math.random();
            let score, failed;
            
            if (rand < 0.05) {
                score = 1; failed = false; // 5% perfect games
            } else if (rand < 0.20) {
                score = 2; failed = false; // 15% score of 2
            } else if (rand < 0.45) {
                score = 3; failed = false; // 25% score of 3
            } else if (rand < 0.70) {
                score = 4; failed = false; // 25% score of 4
            } else if (rand < 0.85) {
                score = 5; failed = false; // 15% score of 5
            } else if (rand < 0.95) {
                score = 6; failed = false; // 10% score of 6
            } else {
                score = null; failed = true; // 5% failed
            }
            
            try {
                // Generate a Discord snowflake-like ID (18 digits)
                const mockMessageId = `${(100000000000000000 + savedCount).toString()}`;
                
                await saveScore(
                    `mock_${username.toLowerCase()}`,
                    username,
                    score,
                    failed,
                    dateStr,
                    mockMessageId,
                    `Mock Costcodle score ${failed ? 'X' : score}/6`,
                    currentDate.toISOString()
                );
                savedCount++;
            } catch (error) {
                // Ignore duplicates
                if (!error.message.includes('UNIQUE constraint failed')) {
                    console.error('Error saving mock score:', error.message);
                }
            }
        }
    }
    
    return savedCount;
}

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
                    await saveScore(
                        message.author.id,
                        message.author.username,
                        result.score,
                        result.failed,
                        message.createdAt.toISOString().split('T')[0],
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
    const isEmpty = await checkDatabaseEmpty();
    
    if (isEmpty) {
        // If no Discord token in development, generate mock data
        if (!process.env.DISCORD_TOKEN && process.env.NODE_ENV === 'development') {
            console.log('Database is empty, generating mock data for development...');
            try {
                const mockCount = await generateMockData();
                console.log(`✅ Mock data generated: ${mockCount} scores created`);
                return mockCount;
            } catch (error) {
                console.error('❌ Failed to generate mock data:', error.message);
                return 0;
            }
        } else if (process.env.DISCORD_TOKEN) {
            console.log('Database is empty, starting historical scrape...');
            try {
                const scrapedCount = await scrapeHistoricalMessages(CHANNEL_ID);
                console.log(`✅ Automatic historical scrape completed: ${scrapedCount} scores imported`);
                return scrapedCount;
            } catch (error) {
                console.error('❌ Automatic historical scrape failed:', error.message);
                return 0; // Don't reject, just continue without historical data
            }
        }
    } else {
        console.log('Database has existing data, skipping initialization');
        return 0;
    }
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

// Initialize database and mock data for development (when Discord is not available)
async function initializeDevelopmentMode() {
    try {
        await initializeDatabase();
        await checkAndScrapeIfEmpty();
    } catch (error) {
        console.error('Error during development initialization:', error);
    }
}

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

// Function to start the Discord bot
async function startBot() {
    // Skip Discord bot in development if no token provided
    if (!process.env.DISCORD_TOKEN) {
        if (process.env.NODE_ENV === 'development') {
            console.log('🚀 Running in development mode without Discord bot');
            console.log('💡 Set DISCORD_TOKEN in .env to enable Discord integration');
            return;
        } else {
            throw new Error('DISCORD_TOKEN is required in production');
        }
    }

    try {
        await client.login(process.env.DISCORD_TOKEN);
        console.log('Discord bot started successfully');
    } catch (error) {
        console.error('Failed to start Discord bot:', error);
        throw error;
    }
}

// Function to stop the Discord bot
async function stopBot() {
    try {
        await client.destroy();
        console.log('Discord bot stopped');
    } catch (error) {
        console.error('Error stopping Discord bot:', error);
    }
}

module.exports = {
    client,
    scrapeHistoricalMessages,
    checkAndScrapeIfEmpty,
    generateMockData,
    initializeDevelopmentMode,
    startBot,
    stopBot
}; 