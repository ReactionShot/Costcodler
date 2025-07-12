# Costcodler

A Discord bot and web dashboard for tracking [Costcodle](https://costcodle.com/) game statistics. Built with Node.js, Express, Discord.js, and vanilla JavaScript ES modules.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- [Task](https://taskfile.dev/) (recommended) or npm
- Docker & Docker Compose (for production)
- Discord bot token

### 1. Clone & Install
```bash
git clone <your-repo>
cd Costcodler
npm install
```

Or using Task:
```bash
task install
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

#### Using Task (Recommended):
```bash
# Start with Discord bot
task dev

# Start without Discord bot (uses mock data)
task dev:no-discord

# Check environment
task check:env
```

#### Using npm:
```bash
# With Discord Bot:
npm run dev

# Without Discord Bot (uses mock data):
npm run dev:no-discord
```

Visit `http://localhost:3000` to view the dashboard.

## 🛠️ Task Runner

This project uses [Task](https://taskfile.dev/) as the primary task runner. Install it globally:

```bash
# macOS
brew install go-task

# Linux
sh -c "$(curl --location https://taskfile.dev/install.sh)" -- -d

# Windows
choco install go-task
```

### Available Tasks
```bash
task                    # Show all available tasks
task dev                # Start development server with Discord bot
task dev:no-discord     # Start development server with mock data
task web:serve          # Serve web directory for frontend-only development
task web:test           # Test frontend modules (syntax check)
task db:reset           # Reset database
task db:backup          # Backup database
task docker:dev         # Run development environment with Docker
task docker:prod        # Run production environment with Docker
task clean              # Clean up generated files
task check:env          # Check environment configuration
```

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
├── app/                       # Legacy monolithic version
│   └── public/
│       └── index.html         # Single-file dashboard (maintained for reference)
│
├── web/                       # Modern split front‑end assets
│   ├── index.html             # Main dashboard page
│   ├── css/
│   │   └── dashboard.css      # Dashboard styling
│   └── js/                    # Modular ES modules
│       ├── state.js           # Shared state & head-to-head filtering
│       ├── api.js             # HTTP/API functions
│       ├── tables.js          # DOM table building & user stats
│       ├── charts.js          # Chart.js visualizations
│       ├── achievements.js    # Achievement logic & display
│       └── main.js            # Entry point orchestrator
│
├── Taskfile.yml               # Task runner configuration
├── compose.yml                # Production deployment
├── compose.dev.yml            # Development overrides
├── Dockerfile                 # Container definition
├── package.json
├── .env                       # Environment variables
└── README.md
```

## 🛠️ Development

### Local Development

#### Using Task (Recommended):
```bash
# Check your environment first
task check:env

# Start with Discord integration
task dev

# Start without Discord (mock data)
task dev:no-discord

# Start with file watching
task dev:watch
```

#### Using npm directly:
```bash
# With Discord Integration:
npm run dev

# Without Discord (Mock Data):
npm run dev:no-discord
```

### Frontend Development
The frontend uses native ES modules - no build step required! 

#### Frontend-only development:
```bash
# Serve just the web directory
task web:serve

# Test frontend modules
task web:test
```

Edit any `.js` file in `web/js/` and refresh your browser. The modular structure includes:
- **state.js** - Centralized state management and head-to-head filtering
- **api.js** - API communication and data fetching
- **tables.js** - User statistics and leaderboard tables
- **charts.js** - Chart.js visualizations with toggle functionality
- **achievements.js** - Costco-themed achievement system
- **main.js** - Application initialization and event handling

### Mock Data for Development
When running without Discord (`task dev:no-discord`), the application automatically generates realistic mock data:
- 9 mock users with Costco-themed names
- 30 days of score history
- Realistic score distribution (5% perfect games, 5% failures)
- Random participation patterns

### Database Management
```bash
task db:backup          # Backup current database
task db:reset           # Reset database (regenerates mock data)
task db:inspect         # Open SQLite CLI
```

### Environment Variables
- `DISCORD_TOKEN` - Your Discord bot token (optional in development)
- `NODE_ENV` - Set to `development` for local dev
- `ADMIN_KEY` - Optional admin key for manual scraping endpoint

## 🐳 Docker Deployment

### Development with Docker
```bash
task docker:dev         # Run development container
task docker:dev:down    # Stop development container
task docker:logs        # View container logs
```

### Production Deployment
```bash
task docker:prod        # Run production container
task docker:prod:down   # Stop production container
task prod:deploy        # Full production deployment
task prod:backup        # Backup production data
```

## 📊 Dashboard Features

### Core Features
- **Real-time Score Tracking** - Automatically captures Costcodle scores from Discord
- **User Statistics** - Comprehensive player stats with streaks and achievements
- **Interactive Charts** - Trends, distributions, and progress visualizations
- **Monthly Leaderboards** - Navigate through historical monthly rankings
- **Achievement System** - Costco-themed achievements and progress tracking
- **Score Heatmap** - Visual calendar of all scores with Discord links
- **Data Export** - CSV export functionality

### New Features
- **⚔️ Head-to-Head Mode** - Toggle between showing all players or just specific matchups
- **📊 Performance Thresholds** - Visual legend showing performance categories
- **📅 Consecutive Days Tracking** - Enhanced streak calculation for daily play
- **🎯 Chart Toggle Buttons** - Hide/show all datasets on multi-user charts

### Chart Features
- **Score Trends** - Individual player progress over time
- **Score Distribution** - Frequency of each score (1-6)
- **Daily Performance** - Daily averages, best/worst scores
- **7-Game Moving Average** - Smoothed progress tracking
- **Interactive Legends** - Click to hide/show individual players

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

### Frontend Architecture
- **Zero build step** - Uses native ES modules
- **Hot-reload ready** - Edit and refresh instantly
- **Modular design** - Each concern in separate file
- **Shared state** - Centralized state management with head-to-head filtering
- **Chart management** - Proper cleanup and recreation for mode switching

### Head-to-Head Mode
Configure specific player matchups in `web/js/state.js`:
```javascript
export const HEAD_TO_HEAD_PLAYERS = ['.cyco', 'clicky6792'];
```

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
task logs               # View application logs (Docker)
task check:env          # Check environment status
```

### Maintenance
```bash
task clean              # Clean up temporary files
task lint               # Basic code style checks
task prod:backup        # Backup production database
```
