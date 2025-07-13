# Costcodler

A Discord bot and web dashboard for tracking [Costcodle](https://costcodle.com/) game statistics. Built with **TypeScript**, Node.js, Express, Discord.js, and vanilla JavaScript ES modules.

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
DISCORD_CHANNEL_ID=your_channel_id_here
NODE_ENV=development
```

For production, also set:
```env
CORS_ORIGINS=https://yourdomain.com,https://api.yourdomain.com
ADMIN_KEY=your_secure_admin_key_here
```

#### Option B: Without Discord Bot (Development Only)
Create a `.env` file:
```env
NODE_ENV=development
# DISCORD_TOKEN=  # Leave this commented out
```

### 3. Build & Run Development

#### Using Task (Recommended):
```bash
# Build TypeScript first
task build

# Start with Discord bot
task dev:ts

# Start without Discord bot (uses mock data)
task dev:ts:no-discord

# Check environment
task check:env

# Quick start (build + run)
task quick:start
```

#### Using npm:
```bash
# Build TypeScript
npm run build

# With Discord Bot:
npm run dev:ts

# Without Discord Bot (uses mock data):
npm run dev:ts:no-discord
```

Visit `http://localhost:3000` to view the dashboard.

## 🔧 TypeScript Development

### Modern Development Workflow

This project is **TypeScript-first** with a modern development workflow:

- **Full Type Safety** - Complete type coverage across backend and frontend
- **Fast Development** - Direct TypeScript execution with `tsx`
- **Type Checking** - Comprehensive type validation without builds
- **Legacy Support** - Backward compatibility with JavaScript mode

### TypeScript Architecture

```
src/
├── types/                     # Shared type definitions
│   ├── index.ts              # Core types (Score, UserStats, etc.)
│   ├── backend.ts            # Backend-specific types
│   └── frontend.ts           # Frontend-specific types
├── bot/                      # Backend TypeScript
│   ├── server.ts             # Express server entry point
│   ├── db/index.ts           # Database layer with types
│   ├── api/                  # Typed API endpoints
│   │   ├── scores.ts
│   │   ├── users.ts
│   │   └── daily.ts
│   ├── discord/index.ts      # Discord bot integration
│   └── util/index.ts         # Utility functions
└── web/                      # Frontend TypeScript
    ├── state.ts              # Typed state management
    ├── api.ts                # API client with types
    ├── main.ts               # Application entry point
    ├── charts.ts             # Chart.js with custom types
    ├── achievements.ts       # Achievement system
    └── tables.ts             # Table and widget logic
```

### Build Process

```bash
# Full build (backend + frontend)
task build

# Build components separately
task build:bot              # Backend only
task build:web              # Frontend only

# Watch mode
task build:watch            # Auto-rebuild on changes

# Type checking only
task type-check             # No output, just validation
task test:types             # Type check with reporting
```

### Development Modes

```bash
# TypeScript Development (Recommended)
task dev:ts                 # Direct TypeScript execution
task dev:ts:no-discord      # Without Discord integration

# Build-based Development
task dev                    # Build-watching mode
task dev:no-discord         # Without Discord integration

# Legacy JavaScript Support
task dev:js                 # Original JavaScript mode
task dev:js:no-discord      # JavaScript without Discord
```

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

#### Core Development
```bash
task                        # Show all available tasks
task build                  # Build TypeScript (backend + frontend)
task dev:ts                 # Start TypeScript development server
task dev:ts:no-discord      # Start without Discord (mock data)
task type-check             # Type check without building
task quick:start            # Quick build + start development
task quick:test             # Quick type check + build test
```

#### Frontend Development
```bash
task web:serve              # Serve web directory for frontend-only
task web:serve:dist         # Serve built web directory
task web:test               # Test frontend TypeScript modules
```

#### Database & Utilities
```bash
task db:reset               # Reset database
task db:backup              # Backup database
task db:inspect             # Open SQLite CLI
task clean                  # Clean up generated files
task check:env              # Check environment configuration
```

#### Docker & Production
```bash
task docker:dev             # Run development environment with Docker
task docker:prod            # Run production environment with Docker
task docker:logs            # View container logs
task prod:deploy            # Full production deployment
task prod:backup            # Backup production data
```

#### TypeScript Shortcuts
```bash
task ts:build               # Quick TypeScript build
task ts:dev                 # Quick TypeScript development
task ts:check               # Quick type checking
```

## 📁 File Structure

```
costcodle/
├── src/                       # TypeScript source code
│   ├── types/                 # Shared type definitions
│   │   ├── index.ts          # Core types (Score, UserStats, etc.)
│   │   ├── backend.ts        # Backend-specific types
│   │   └── frontend.ts       # Frontend-specific types
│   ├── bot/                  # Backend TypeScript
│   │   ├── server.ts         # Express server entry point
│   │   ├── db/index.ts       # Database layer with types
│   │   ├── api/              # Typed API endpoints
│   │   │   ├── scores.ts
│   │   │   ├── users.ts
│   │   │   └── daily.ts
│   │   ├── discord/index.ts  # Discord bot integration
│   │   └── util/index.ts     # Utility functions
│   └── web/                  # Frontend TypeScript
│       ├── state.ts          # Typed state management
│       ├── api.ts            # API client with types
│       ├── main.ts           # Application entry point
│       ├── charts.ts         # Chart.js with custom types
│       ├── achievements.ts   # Achievement system
│       └── tables.ts         # Table and widget logic
│
├── dist/                     # Built JavaScript output
│   ├── bot/                  # Built backend
│   └── web/                  # Built frontend
│
├── web/                      # Static web assets
│   ├── index.html            # Main dashboard page
│   └── css/
│       └── dashboard.css     # Dashboard styling
│

│
├── tsconfig.json             # Root TypeScript configuration
├── src/bot/tsconfig.json     # Backend TypeScript config
├── src/web/tsconfig.json     # Frontend TypeScript config
├── Taskfile.yml              # Task runner configuration
├── compose.yml               # Production deployment
├── compose.dev.yml           # Development overrides
├── Dockerfile                # Container definition
├── package.json              # Dependencies and scripts
└── README.md
```

## 🛠️ Development

### TypeScript Development

#### Using Task (Recommended):
```bash
# Check your environment first
task check:env

# Build TypeScript code
task build

# Start with Discord integration
task dev:ts

# Start without Discord (mock data)
task dev:ts:no-discord

# Type checking
task type-check
```

#### Using npm directly:
```bash
# Build TypeScript
npm run build

# With Discord Integration:
npm run dev:ts

# Without Discord (Mock Data):
npm run dev:ts:no-discord

# Type checking
npm run type-check
```

### Frontend Development

The frontend uses **TypeScript compiled to ES modules** with comprehensive type safety:

#### Frontend-only development:
```bash
# Serve the built web directory
task web:serve:dist

# Test frontend TypeScript modules
task web:test

# Build frontend only
task build:web
```

The modular TypeScript structure includes:
- **state.ts** - Typed state management and head-to-head filtering
- **api.ts** - Typed API communication and data fetching
- **tables.ts** - Typed user statistics and leaderboard tables
- **charts.ts** - Chart.js integration with custom type definitions
- **achievements.ts** - Costco-themed achievement system with types
- **main.ts** - Application initialization and event handling

### Type System

#### Core Types (`src/types/index.ts`):
```typescript
export interface Score {
  id: number;
  user_id: string;
  username: string;
  score: number;
  date: string;
  message_url?: string;
}

export interface UserStats {
  user_id: string;
  username: string;
  total_games: number;
  average_score: number;
  best_score: number;
  current_streak: number;
  // ... more properties
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  category: string;
  // ... more properties
}
```

#### Backend Types (`src/types/backend.ts`):
- Database interfaces
- Discord bot types
- API request/response types
- Express middleware types

#### Frontend Types (`src/types/frontend.ts`):
- DOM element types
- Chart.js custom interfaces
- State management types
- Enhanced user statistics

### Mock Data for Development

When running without Discord (`task dev:ts:no-discord`), the application automatically generates realistic mock data:
- 9 mock users with Costco-themed names
- 30 days of score history
- Realistic score distribution (5% perfect games, 5% failures)
- Random participation patterns

### Database Management
```bash
task db:backup              # Backup current database
task db:reset               # Reset database (regenerates mock data)
task db:inspect             # Open SQLite CLI
```

### Environment Variables
- `DISCORD_TOKEN` - Your Discord bot token (optional in development)
- `NODE_ENV` - Set to `development` for local dev
- `ADMIN_KEY` - Optional admin key for manual scraping endpoint

## 🐳 Docker Deployment

### Development with Docker
```bash
task docker:dev             # Run development container with TypeScript
task docker:dev:down        # Stop development container
task docker:logs            # View container logs
```

The development container uses `tsx` for direct TypeScript execution with hot reloading.

### Production Deployment
```bash
task docker:prod            # Run production container
task docker:prod:down       # Stop production container
task prod:deploy            # Full production deployment
task prod:backup            # Backup production data
```

The production container builds TypeScript to JavaScript and runs the optimized code.

## 📊 Dashboard Features

### Core Features
- **Real-time Score Tracking** - Automatically captures Costcodle scores from Discord
- **User Statistics** - Comprehensive player stats with streaks and achievements
- **Interactive Charts** - Trends, distributions, and progress visualizations
- **Monthly Leaderboards** - Navigate through historical monthly rankings
- **Achievement System** - Costco-themed achievements and progress tracking
- **Score Heatmap** - Visual calendar of all scores with Discord links
- **Data Export** - CSV export functionality

### TypeScript Features
- **Type-Safe API** - All endpoints with comprehensive type definitions
- **DOM Safety** - Null checks and proper element typing throughout
- **Chart Type Safety** - Custom Chart.js type definitions for proper typing
- **State Management** - Typed state with proper validation
- **Error Handling** - Typed error classes and comprehensive error management

### New Features
- **⚔️ Head-to-Head Mode** - Toggle between showing all players or just specific matchups
- **📊 Performance Thresholds** - Visual legend showing performance categories
- **📅 Consecutive Days Tracking** - Enhanced streak calculation for daily play
- **🎯 Chart Toggle Buttons** - Hide/show all datasets on multi-user charts

## 🔒 Production-Ready Features

This application includes comprehensive production-ready improvements:

### Security & Performance
- **Multi-stage Docker Build** - Optimized production image running as non-root user
- **Environment Variable Configuration** - All secrets and configuration externalized
- **CORS Protection** - Strict origin validation in production
- **Rate Limiting** - API protection against abuse
- **Helmet Security Headers** - Comprehensive security headers including CSP
- **Database Indexes** - Optimized query performance with composite indexes

### Database Improvements
- **Transaction Support** - Bulk inserts use transactions for consistency and 20x speed improvement
- **NULL Handling** - Failed games stored as NULL instead of 0 for accurate statistics
- **Connection Timeout** - 5-second busy timeout prevents database lock issues
- **Safe Migrations** - Automatic schema updates with proper validation

### Modern Node.js
- **Node.js 20** - Latest LTS version with security patches
- **ESM Module Resolution** - Proper TypeScript configuration for Node16+ modules
- **BigInt Discord IDs** - Proper handling of Discord snowflake IDs without precision loss

### Environment Variables
Required for production:
- `DISCORD_TOKEN` - Discord bot authentication token
- `DISCORD_CHANNEL_ID` - Target Discord channel for score tracking
- `CORS_ORIGINS` - Comma-separated list of allowed origins
- `ADMIN_KEY` - Secure key for admin API endpoints

### Docker Health Checks
- Automatic health monitoring with restart policies
- Graceful shutdown handling
- Volume-based data persistence

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
4. Get your channel ID and update `src/bot/discord/index.ts`

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
- **TypeScript-first** - Complete type safety across frontend
- **ES Module output** - Modern JavaScript with type safety
- **Modular design** - Each concern in separate typed module
- **Shared types** - Consistent interfaces across frontend/backend
- **Chart management** - Proper cleanup with typed chart instances

### Head-to-Head Mode
Configure specific player matchups in `src/web/state.ts`:
```typescript
export const HEAD_TO_HEAD_PLAYERS = ['.cyco', 'clicky6792'];
```

## 🚀 Production Notes

### TypeScript Build Process
- Multi-stage Docker build with TypeScript compilation
- Separate tsconfig files for backend and frontend
- Development dependencies removed after build
- Optimized JavaScript output for production

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
- TypeScript compilation for optimal runtime performance

### Monitoring
```bash
task logs               # View application logs (Docker)
task check:env          # Check environment status
task test:types         # Validate TypeScript types
```

### Maintenance
```bash
task clean              # Clean up temporary files
task lint               # TypeScript code style checks
task prod:backup        # Backup production database
task build:clean        # Clean TypeScript build output
```

## 🔄 Migration from JavaScript

This project has been fully migrated from JavaScript to TypeScript:

- **100% Type Coverage** - All modules fully typed
- **Backward Compatibility** - Legacy JavaScript mode still available
- **Modern Development** - TypeScript-first workflow
- **Enhanced Safety** - Comprehensive null checks and type validation

### Legacy Support
The project has been fully migrated to TypeScript. Legacy JavaScript support is still available through the built JavaScript files in the `dist/` directory.

To run in legacy mode (using built JavaScript):
```bash
task dev:js             # JavaScript development (using built files)
task dev:js:no-discord  # JavaScript without Discord (using built files)
```
