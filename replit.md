# Afshuu WhatsApp Bot

## Overview

Afshuu Bot is a WhatsApp automation bot built using the whatsapp-web.js library. The bot provides command-based interactions through WhatsApp messages, featuring a modular architecture with configurable settings, logging capabilities, and extensible command system. It operates by connecting to WhatsApp Web through Puppeteer automation and responds to user commands with various functionalities.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Core Architecture
The application follows a modular, event-driven architecture centered around the WhatsApp Web client:

- **Bot Core** (`bot.js`): Main application entry point that initializes the WhatsApp client with Puppeteer configuration and handles authentication flow
- **Message Handler** (`handlers/messageHandler.js`): Central message processing unit that routes incoming messages to appropriate command handlers
- **Command System** (`commands/index.js`): Modular command structure allowing easy addition of new bot functionalities
- **Configuration Management** (`config/settings.js`): Centralized configuration system supporting environment variables for deployment flexibility

### Authentication Strategy
Uses LocalAuth strategy from whatsapp-web.js for persistent session management, eliminating the need for repeated QR code scanning after initial setup.

### Logging System
Custom logging implementation with:
- File-based logging with automatic rotation
- Configurable log levels
- Maximum file size and retention policies
- Both console and file output

### Command Processing
Commands use a prefix-based system (default: '.') with built-in features:
- Cooldown mechanisms to prevent spam
- Owner-only command restrictions
- Group-specific command limitations
- Argument parsing and validation

### Error Handling
Comprehensive error handling throughout the application with graceful degradation and detailed logging for debugging purposes.

### Security Features
- Rate limiting and anti-spam mechanisms
- Owner verification system
- Blocked numbers management
- Allowed groups configuration

## External Dependencies

### Core Dependencies
- **whatsapp-web.js**: Primary WhatsApp Web client library for bot functionality
- **qrcode-terminal**: QR code generation for initial authentication setup

### Runtime Environment
- **Node.js**: JavaScript runtime environment
- **Puppeteer**: Headless browser automation (bundled with whatsapp-web.js)

### Optional Integrations
- Environment variables for configuration (OWNER_NUMBER, LOG_LEVEL, DEBUG, ALLOWED_GROUPS, BLOCKED_NUMBERS)
- File system for session storage and log management

### Browser Dependencies
Puppeteer runs with specific Chrome/Chromium flags optimized for server environments:
- Headless mode operation
- Sandbox disabled for containerized environments
- GPU acceleration disabled for server compatibility
- Single process mode for resource efficiency