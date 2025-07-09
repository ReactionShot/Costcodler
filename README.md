# Costcodler

[Costcodle](https://costcodle.com/). It's a *vibe*.


This repository uses a docker compose file with a tailscale sidecar to host a [funneled web application](https://tailscale.com/kb/1223/funnel) for costcodle statistics tracking via a dashboard.  Please input your CHANNEL_ID in the /app/bot.js and /app/public/index.html files.  This can be stored in your .env file.  Additionally, you will need to create a discord bot, generate a token, and add that to the .env file.


## 📁 File Structure:
Make sure you have these files in your directory:
```
costcodle/
├── compose.yaml  ← Your compose file
├── .env               ← DISCORD_TOKEN=your_token_here
├── package.json       ← Node.js dependencies
├── app/
│   ├── bot.js         ← Main application
│   ├── public/
│       └── index.html ← Dashboard   
└── data/              ← Will be created automatically
```
