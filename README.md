# Black Desert Online Class Guides Bot

A Discord bot for managing and sharing Black Desert Online class guides across multiple servers. Built to help BDO communities organize PvP and PvE builds, combos, and gameplay strategies for all classes.

## What it does

This bot lets your community create, edit, and view comprehensive class guides directly in Discord. Each guide includes crystal setups, addons, artifacts, combos, and video examples. The permission system is designed for multi-server deployment so admins can manage guides in their own server without affecting other communities.

## Features

- **Multi-server support** - Each server operates independently with its own role configuration
- **Guild-scoped permissions** - Server admins can only modify guides created in their server
- **Comprehensive guide system** - Supports all BDO classes with both Awakening and Succession specs
- **Role-based access** - Two-tier permission system (Guide Creator and Guide Admin)
- **Interactive guide creation** - Step-by-step modal forms for easy guide submission
- **Cross-server creator ownership** - Guide creators can edit their guides from any server

## Commands

- `/guide` - View class guides (PvP or PvE)
- `/guide-create` - Submit a new guide
- `/guide-edit` - Edit an existing guide
- `/guide-delete` - Delete guides you have permission to remove
- `/guides-setup` - Configure bot permissions (Admin only)
- `/guide-test` - Create a test guide for development

## Setup

1. Clone the repository
```bash
git clone https://github.com/yourusername/bdo-class-guides.git
cd bdo-class-guides
```

2. Install dependencies
```bash
npm install
```

3. Create a `.env` file in the root directory
```env
CLIENT_ID=your_bot_client_id
GUILD_ID=your_guild_id
TOKEN=your_bot_token
```

4. Deploy commands and start the bot
```bash
npm run start-all
```

## Permission System

The bot uses a two-tier role system that respects server boundaries:

**Guide Creator** - Can create, edit, and delete their own guides from any server

**Guide Admin** - Can edit and delete any guide that was created in their server

**Bot Owners** - Defined in `utils/permissions.js`, have full access across all servers

### Initial Configuration

After adding the bot to your server, an administrator needs to run:

```
/guides-setup roles creator:@RoleName admin:@RoleName
```

This sets up which roles can create and manage guides. You can view current settings with `/guides-setup view` or reset everything with `/guides-setup reset`.

## Guide Structure

Guides are organized by:
- Class (Warrior, Ranger, Ninja, etc.)
- Type (PvP or PvE)
- Spec (Awakening or Succession)

Each guide contains:
- Description and playstyle overview
- Pros and cons
- Crystal setups (T1 capped, T2 capped, Uncapped)
- Addons and artifacts
- Lightstones
- Movement examples and combos
- Video links for demonstrations

## File Structure

```
bdo_class_guides/
├── commands/           # Slash command definitions
│   └── handlers/       # Command interaction handlers
├── guides/            # Guide data (JSON files)
│   └── [class]/
│       └── [pvp|pve]/
│           └── [awakening|succession]/
├── server-settings/   # Per-guild configuration files
└── utils/            # Helper functions and utilities
```

## Development

The bot is built with discord.js v14 and uses the modern MessageFlags API.

Run in development mode with auto-restart:
```bash
npm run dev
```

Deploy commands without restarting the bot:
```bash
npm run deploy
```

## Contributing

This is a personal project but feel free to fork it for your own community. If you find bugs or have suggestions, open an issue.

## License

MIT - Do whatever you want with it.
