# Costcodler

A Discord bot and web dashboard for tracking [Costcodle](https://costcodle.com/) game statistics. Built with Node.js, Express, Discord.js, and vanilla JavaScript ES modules.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Docker & Docker Compose (for production)
- Discord bot token

### 1. Clone & Install
```bash
git clone <your-repo>
cd Costcodler
npm install
```

### 2. Configure Environment

#### Option A: With Discord Bot (Full Features)
Create a `.env` file:
```env
DISCORD_TOKEN=your_discord_bot_token_here
NODE_ENV=development
```

Edit `bot/discord/index.js` and set your Discord channel ID:
```javascript
const CHANNEL_ID = 'your_channel_id_here';
```

#### Option B: Without Discord Bot (Development Only)
Create a `.env` file:
```env
NODE_ENV=development
# DISCORD_TOKEN=  # Leave this commented out
```

### 3. Run Development

#### With Discord Bot:
```bash
npm run dev
```

#### Without Discord Bot (uses mock data):
```bash
npm run dev:no-discord
```

Visit `http://localhost:3000` to view the dashboard.

## 📁 File Structure

```
costcodle/
├── bot/                       # All Discord‑bot & API code
│   ├── db/                    # SQLite helpers
│   │   └── index.js
│   ├── discord/               # Pure Discord logic
│   │   └── index.js
│   ├── api/                   # Express route handlers
│   │   ├── scores.js
│   │   ├── users.js
│   │   └── daily.js
│   ├── util/                  # Validation & parsing helpers
│   │   └── index.js
│   └── server.js              # Entry point
│
├── web/                       # Static front‑end assets
│   ├── index.html
│   ├── css/
│   │   └── dashboard.css
│   └── js/                    # Modular ES modules
│       ├── state.js           # Shared state management
│       ├── api.js             # HTTP/API functions
│       ├── tables.js          # DOM table building
│       ├── charts.js          # Chart.js visualizations
│       ├── achievements.js    # Achievement logic
│       └── main.js            # Entry point orchestrator
│
├── compose.yml                # Production deployment
├── compose.dev.yml            # Development overrides
├── Dockerfile                 # Container definition
├── package.json
├── .env                       # Environment variables
└── README.md
```

## 🛠️ Development

### Local Development

#### With Discord Integration:
```bash
# Start with hot-reload and Discord bot
npm run dev

# Or manually
node bot/server.js
```

#### Without Discord (Mock Data):
```bash
# Start with hot-reload and mock data (no Discord token needed)
npm run dev:no-discord

# Or manually with environment
NODE_ENV=development node bot/server.js
```

### Frontend Development
The frontend uses native ES modules - no build step required! Edit any `.js` file in `web/js/` and refresh your browser.

### Mock Data for Development
When running without Discord (`npm run dev:no-discord`), the application automatically generates realistic mock data:
- 9 mock users with Costco-themed names
- 30 days of score history
- Realistic score distribution (5% perfect games, 5% failures)
- Random participation patterns

### Environment Variables
- `DISCORD_TOKEN` - Your Discord bot token (optional in development)
- `NODE_ENV` - Set to `development` for local dev
- `ADMIN_KEY` - Optional admin key for manual scraping endpoint

## 🐳 Docker Deployment

### Development with Docker
```bash
# Run development container with live-reload
docker compose -f compose.dev.yml up --build
```

### Production Deployment
```bash
# Run production container with Tailscale networking
docker compose up -d

# View logs
docker compose logs -f costcodle-tracker
```

## 📊 Dashboard Features

- **Real-time Score Tracking** - Automatically captures Costcodle scores from Discord
- **User Statistics** - Comprehensive player stats with streaks and achievements
- **Interactive Charts** - Trends, distributions, and progress visualizations
- **Monthly Leaderboards** - Navigate through historical monthly rankings
- **Achievement System** - Costco-themed achievements and progress tracking
- **Score Heatmap** - Visual calendar of all scores with Discord links
- **Data Export** - CSV export functionality

## 🎮 Discord Bot Setup

1. Create a Discord application at https://discord.com/developers/applications
2. Create a bot and copy the token to your `.env` file
3. Invite the bot to your server with these permissions:
   - Read Messages
   - Read Message History
   - Send Messages (optional, for debugging)
4. Get your channel ID and update `bot/discord/index.js`

## 🔧 Configuration

### Database
SQLite database is automatically created:
- Development: `./costcodle_scores.db`
- Production: `/data/costcodle_scores.db` (Docker volume)

### API Endpoints
- `GET /api/scores` - All scores with pagination
- `GET /api/users` - User statistics
- `GET /api/daily-stats` - Daily aggregated statistics

### Frontend Modules
- **Zero build step** - Uses native ES modules
- **Hot-reload ready** - Edit and refresh instantly
- **Modular architecture** - Each concern in separate file
- **Shared state** - Centralized state management

## 🚀 Production Notes

### Tailscale Integration
The production setup includes Tailscale for secure networking:
- Automatic HTTPS via Tailscale Funnel
- Private network access
- No port forwarding required

### Performance
- SQLite with WAL mode for concurrent access
- Rate limiting on API endpoints
- Gzip compression enabled
- Static file serving optimized

### Monitoring
```bash
# View application logs
docker compose logs -f costcodle-tracker

# View Tailscale logs
docker compose logs -f costcodle-ts

# Check container status
docker compose ps
```

## 🎯 Features

### Automatic Score Detection
The bot automatically detects Costcodle score shares in your Discord channel and parses:
- Score (1-6 or X for failed attempts)
- Date and user information
- Message links for Discord integration

### Modular Frontend
- **state.js** - Centralized state management
- **api.js** - HTTP calls and data fetching
- **tables.js** - User stats, leaderboards, heatmaps
- **charts.js** - All Chart.js visualizations
- **achievements.js** - Achievement calculation and display
- **main.js** - Application orchestrator

### Achievement System
Costco-themed achievements including:
- Perfect Game, Hat Trick, Perfect Ten
- Consistency King, Elite Player
- Gold Star Member, Executive Member
- Food Court Regular, Bulk Buyer
- And many more!

## 📝 Scripts

```bash
npm start              # Start production server
npm run dev            # Start with nodemon hot-reload (requires Discord token)
npm run dev:no-discord # Start development with mock data (no Discord needed)
npm run lint           # Run ESLint (if configured)
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes (frontend uses ES modules, no build step!)
4. Test locally with `npm run dev`
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details
