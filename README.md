

<div align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="https://capsule-render.vercel.app/api?type=waving&color=gradient&height=200&section=header&text=Discord%20Ticket%20System&fontSize=40&fontAlignY=35&desc=Powered%20By%20Ramkrishna&descSize=20&descAlignY=55&animation=fadeIn">
    <source media="(prefers-color-scheme: light)" srcset="https://capsule-render.vercel.app/api?type=waving&color=0:7289da,100:2c2f33&height=200&section=header&text=Discord%20Ticket%20System&fontSize=40&fontAlignY=35&desc=Advanced%20Support%20Solution%20•%20MongoDB%20•%20Discord.js%20v14&descSize=20&descAlignY=55&animation=fadeIn">
    <img alt="Ticket System Banner" src="https://capsule-render.vercel.app/api?type=waving&color=gradient&height=200&section=header">
  </picture>
</div>
# Ticket-System Documentation

## Introduction

**Ticket-System** is a feature-rich Discord ticket bot designed to streamline the support process in Discord servers. Built with Discord.js v14+ and leveraging Discord’s latest component systems, it enables users to create, manage, and resolve support tickets with intuitive UI and robust permission management. This documentation details setup, usage, commands, extensibility, and internal architecture for contributors and advanced users.

## Features

- **Slash Command Integration** for all major actions.
- **Interactive Components V2:** modern buttons, select menus, and dynamic messaging.
- **Customizable Ticket Categories** and permission management.
- **Ticket Logging** and automatic transcripts (if implemented).
- **Role-based Access Control:** restrict and empower staff, admins, and users easily.

## Setup Guide

### 1. Prerequisites

- Node.js v18 or newer.
- Discord bot token from [Discord Developer Portal](https://discord.com/developers/applications).
- Server management permissions for bot installation.

### 2. Installation

```sh
git clone https://github.com/ramkrishna-xyz/Ticket-System.git
cd Ticket-System
npm install
```

### 3. Configuration

- Duplicate `.env.example` as `.env` and fill in your Discord bot token and other required config values.
- Edit `config.json` for setting ticket categories, mod/staff roles, and channel IDs as needed.

### 4. Running the Bot

```sh
node index.js
```
The bot will connect and register slash commands in your guild.

## Core Commands

| Command         | Permission    | Description                                       |
|-----------------|--------------|---------------------------------------------------|
| `/setup`        | Admin        | Prepare ticket panel and initial configuration    |
| `/ticket`       | Everyone     | Open a support ticket via Components V2 UI        |
| `/close`        | Ticket Owner, Staff | Close the active ticket                   |
| `/transcript`   | Staff/Admin  | Exports ticket log to a staff/admin repository    |
| `/add`          | Staff        | Add a user to a ticket channel                    |
| `/remove`       | Staff        | Remove a user from a ticket channel               |

> Commands may use buttons, select menus, or other components for interactive operations.

## Using the Ticket System

### Step 1: Panel Setup

- Run `/setup` by a server admin in your chosen channel.
- The bot sends a **Ticket Panel** message with a button (e.g., "Create Ticket").

### Step 2: Creating Tickets

- Users click the button to create a new ticket.
- The bot generates a private channel in the designated category (e.g., `ticket-support`).
- Permissions are set so only the user and allowed staff can view/respond.

### Step 3: Managing Tickets

- Users and staff can interact within ticket channels.
- Staff can use `/add`, `/remove`, or ticket control buttons to manage participants.
- Use `/close` or a channel button to close and archive the ticket.

## Roles & Permissions

- **Admin:** Can configure categories, roles, and global settings.
- **Staff/Moderator:** Can view, manage, and close tickets; add or remove users.
- **User:** Can create and participate in their own tickets.
- **Support Roles:** Assignable via `config.json` for flexible team management.

## Advanced Features

### Modern UI with Components V2

- **TextDisplayBuilder:** All bot messages use Discord's latest component-based display for clean, markdown-enabled UIs.
- **ActionRowBuilder and Select Menus:** Users can trigger sub-actions (like choosing ticket category) without message spam.
- **Ephemeral Support:** Help commands and sensitive actions can be set to ephemeral for privacy.

### Automated Ticket Numbering

- Tickets are named sequentially or per-user for easy tracking.
- Metadata is stored per-channel for potential future analytics.

### Custom Category Support

- Tickets can be created in different categories (e.g., "General Support", "Ban Appeals") by modifying components or select menus.

### Logging and Transcripts

- Closed tickets can be logged to a specified staff channel or exported as a file.
- Automatic transcript generation can be integrated with Discord.js message fetchers.

## Extending the Bot

- **Adding Commands:** Place new command files in the commands folder, following the project’s command structure template.
- **Component Interactions:** Register and handle new customIds for buttons/select menus in the main interaction handler.
- **Role and Permission Logic:** Custom functions can be added in the permissions manager or utility files.

## Internal Structure Overview

- `index.js` / `main.js`: Entry point and command loader.
- `/commands`: Contains all slash command modules.
- `/events`: Event listeners for message, interaction, ticket actions.
- `/utils` or `/services`: Helper utilities for permission, logging, configuration, etc.
- `config.json` / `.env`: Runtime configuration; do not commit sensitive data.

## Troubleshooting

- **Bot Not Responding:** Check for correct permissions, valid token, and registered commands.
- **Tickets Not Creating:** Ensure correct category/channel IDs and permissions in `config.json`.
- **Permission Errors:** Review role hierarchy and explicit overwrites set by the bot.

## Contribution Guidelines

- Fork the repo and create feature branches for PRs.
- Follow existing code style (primarily modern ES syntax).
- Document new functions, especially components-related logic and permissions.
- Test new commands/interactions with dummy and real Discord servers.

## License

Refer to the project’s `LICENSE` file for legal usage and distribution.

## Credits

Original author: [ramkrishna-xyz](https://github.com/ramkrishna-xyz)  
Open for community contributions and issue reports via the GitHub repository.

[1] https://github.com/ramkrishna-xyz/Ticket-System/tree/main
[2] https://github.com/topics/ticketing-system
[3] https://github.com/topics/ticket-system
[4] https://www.reddit.com/r/linuxadmin/comments/ie4zf2/freelibre_ticket_systems/
[5] https://www.reddit.com/r/selfhosted/comments/1cx35ol/ticket_system_or_todo_for_your_homelab/
[6] https://github.com/TheBiochemic/tickets-rs
[7] https://github.com/amrshah/Laravel-Support-Ticket-System
[8] https://athene-forschung.unibw.de/doc/152416/152416.pdf
