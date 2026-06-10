# Motoko

Motoko is a [Discord](https://discord.com) bot that play sounds.

Why this name ? It's a ref for [Major Motoko Kusanagi](https://ghostintheshell.fandom.com/wiki/Motoko_Kusanagi).

## Stack

- Node.js ≥ 22.12 (24 LTS recommended)
- [discord.js](https://discord.js.org) v14 + [@discordjs/voice](https://discord.js.org/docs/packages/voice/main)
- [oxlint + oxfmt](https://oxc.rs) for linting/formatting
- [PM2](https://pm2.keymetrics.io) for local process management (optional)

## Commands

- `/ping`
- `/help`
- `/airhorn`
- `/random`
- `/play xxx`

## Setup

1. `npm install`
2. Copy `.env.example` to `.env` and fill in `DISCORD_TOKEN`, `CLIENT_ID`, `GUILD_ID`.
3. Register the slash commands (once, or whenever they change):

   ```sh
   npm run deploy-commands
   ```

## Run

Directly:

```sh
npm start
```

Or supervised with PM2 (auto-restart on crash, logs, monitoring):

```sh
npm install -g pm2
npm run pm2          # uses ecosystem.config.cjs
pm2 logs motoko      # tail logs
pm2 monit            # live CPU/memory dashboard
pm2 startup && pm2 save   # restart on boot (optional)
```

## Lint / format

```sh
npm run lint
npm run format
```

Have fun
![](https://static.wikia.nocookie.net/ghostintheshell/images/f/fe/Laughing_man.svg/revision/latest?path-prefix=en)
