# Black Desert Online Class Guides Bot

A Discord bot for managing and sharing Black Desert Online class guides. Communities can create, edit, and view comprehensive PvP and PvE builds with crystals, addons, artifacts, combos, and videos.

## Features

- **Multi-server support** - Independent role configuration per server
- **Guild-scoped permissions** - Admins can only modify guides created in their server
- **All BDO classes** - Supports Awakening and Succession specs
- **Two-tier permissions** - Guide Creator and Guide Admin roles
- **Interactive creation** - Step-by-step modal forms

## Commands

- `/guide` - View class guides
- `/guide-create` - Create a new guide
- `/guide-edit` - Edit your guides
- `/guide-delete` - Delete guides you own
- `/guides-setup` - Configure permissions (Admin only)

## Getting Started

After inviting the bot to your server, an admin must configure roles:
```
/guides-setup roles creator1:@Role1 admin1:@AdminRole
```

**Managing roles:**
- View settings: `/guides-setup view`  
- Remove roles: `/guides-setup remove role1:@Role`  
- Reset all: `/guides-setup reset`

## Permissions

**Guide Creator** - Create, edit, and delete own guides across all servers

**Guide Admin** - Edit/delete any guide created in their server

Roles respect server boundaries - admins can't modify guides from other servers.

## Guide Content

Guides are organized by Class → Type (PvP/PvE) → Spec (Awakening/Succession)

**PvP Guides include:**
- **Step 1:** Description, pros/cons
- **Step 2:** Large scale role, small scale role, positioning (with optional image)
- **Step 3:** Crystal setups (T1 capped, T2 capped, uncapped), addons
- **Step 4:** Artifacts, lightstones, reasoning
- **Step 5:** Movement examples, combat combos (with optional videos)

**PvE Guides:** *(Coming soon - not yet implemented)*

## License

All rights reserved. This code is provided for viewing purposes only. You may not use, copy, modify, or distribute this software without explicit permission.
