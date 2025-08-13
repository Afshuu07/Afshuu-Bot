# Afshuu WhatsApp Bot

## Overview

Afshuu Bot is a WhatsApp automation bot built using the whatsapp-web.js library. The bot provides command-based interactions through WhatsApp messages, featuring a modular architecture with configurable settings, logging capabilities, and extensible command system. It operates by connecting to WhatsApp Web through Puppeteer automation and responds to user commands with various functionalities.

## User Preferences

Preferred communication style: Simple, everyday language.

## Recent Changes

**August 13, 2025 - Enhanced UI and Game Recommendations Update**
- Made hidetag command simple with NO animations as requested
- Enhanced all other bot features with attractive animations and improved visual design
- Added comprehensive game recommendation system with categories (action, adventure, strategy, casual, mobile)
- Updated all bot status messages and menu systems with more appealing animations
- Improved welcome messages to include video downloads and game recommendations
- Enhanced alive command with detailed performance stats and visual improvements
- Updated main menu with better organization and attractive design elements
- All changes maintain the principle: hidetag stays simple, everything else gets more animated and attractive

**August 13, 2025 - Complete Migration to Replit Environment**
- Successfully completed full migration from Replit Agent to Replit environment  
- Resolved npm installation conflicts and dependency issues
- Cleaned up node_modules and reinstalled all required packages
- Verified all core dependencies: whatsapp-web.js, qrcode-terminal, puppeteer, axios, file-type, node-fetch, sharp, ytdl-core, ffmpeg packages, jimp, and yt-dlp
- Bot launches successfully with proper QR code generation for WhatsApp authentication
- Migration ensures robust security practices and Replit compatibility
- All workflow configurations verified and functioning properly

**August 13, 2025 - Complete Migration to Replit Environment**
- Successfully completed full migration from Replit Agent to Replit environment
- Resolved npm installation conflicts and dependency issues
- Cleaned up node_modules and reinstalled all required packages
- Verified all core dependencies: whatsapp-web.js, qrcode-terminal, puppeteer, axios, file-type, node-fetch, sharp, ytdl-core, ffmpeg packages, and jimp
- Bot launches successfully with proper QR code generation for WhatsApp authentication
- Migration ensures robust security practices and Replit compatibility
- All workflow configurations verified and functioning properly

**August 10, 2025 - Migration to Replit**
- Successfully migrated WhatsApp bot from Replit Agent to Replit environment
- Fixed syntax errors in commands/index.js that prevented bot startup
- Configured Puppeteer to use system Chromium instead of bundled version
- Installed required system dependencies (glib, gtk3, chromium)
- Updated browser executable path to work with Replit's Nix environment
- Bot now successfully launches and displays QR code for WhatsApp authentication
- Migration completed with full functionality preserved

**August 5, 2025**
- Fixed Chromium profile lock issue that was preventing the bot from starting
- Switched from LocalAuth to NoAuth strategy to avoid session conflicts
- Simplified Puppeteer configuration to reduce browser launch conflicts
- Updated Chrome/Chromium arguments for better compatibility in containerized environments
- Added process cleanup mechanisms to prevent browser profile conflicts
- Bot now successfully launches and displays QR code for WhatsApp authentication

**August 5, 2025 - Feature Enhancement Update**
- 🎨 **Enhanced Visual Design**: Completely redesigned bot interface with attractive formatting, emojis, and animated elements
- 🎵 **Audio Download System**: Implemented comprehensive audio download functionality supporting YouTube, Spotify, SoundCloud, TikTok, Instagram, Twitter, Bandcamp, and Mixcloud
- 👋 **Advanced Auto-Welcome**: Added intelligent auto-welcome system with multiple randomized greeting templates and delayed tutorial hints
- 📚 **Interactive Tutorial System**: Created 5-step interactive tutorial guiding new users through all bot features
- 🛡️ **Enhanced Spam Detection**: Upgraded spam detection with real-time analysis, threat reporting, and URL scanning capabilities
- 🎯 **Categorized Command Menu**: Redesigned menu system with categories (media, security, group, fun) for better navigation
- 🔧 **Security Features**: Added URL scanning, threat reporting, and security status monitoring
- ⚡ **Performance Improvements**: Optimized command execution and enhanced error handling throughout the system

## System Architecture

### Core Architecture
The application follows a modular, event-driven architecture centered around the WhatsApp Web client:

- **Bot Core** (`bot.js`): Main application entry point that initializes the WhatsApp client with enhanced Puppeteer configuration, handles authentication flow, and manages auto-welcome systems
- **Message Handler** (`handlers/messageHandler.js`): Central message processing unit that routes incoming messages to appropriate command handlers with spam detection integration
- **Enhanced Command System** (`commands/index.js`): Comprehensive modular command structure featuring categorized menus, interactive tutorials, audio downloads, and security features
- **Configuration Management** (`config/settings.js`): Centralized configuration system supporting environment variables for deployment flexibility
- **Advanced Spam Detection** (`utils/spamDetector.js`): Real-time message analysis system with pattern recognition, threat assessment, and automatic response capabilities
- **Media Processing** (`utils/mediaDownloader.js`): Handles audio downloads from multiple platforms using yt-dlp integration

### Authentication Strategy
Uses NoAuth strategy from whatsapp-web.js to prevent profile conflicts and browser lock issues. Requires QR code scanning each session but ensures reliable startup and eliminates profile-related errors in containerized environments.

### Logging System
Custom logging implementation with:
- File-based logging with automatic rotation
- Configurable log levels
- Maximum file size and retention policies
- Both console and file output

### Enhanced Command Processing
Commands use a prefix-based system (default: '.') with comprehensive features:
- **Categorized Menu System**: Commands organized into media, security, group, and games categories
- **Interactive Tutorial**: 5-step guided tutorial for new users
- **Audio/Video Download Integration**: Multi-platform media extraction with yt-dlp (no watermarks)
- **Game Recommendation Engine**: Personalized game suggestions across 5 categories
- **Security Commands**: URL scanning, threat reporting, and protection status
- **Enhanced Visual Design**: Attractive animations and formatting (except hidetag which remains simple)
- **Simple Hidetag**: Clean, animation-free hidetag functionality as requested
- Cooldown mechanisms to prevent spam
- Owner-only command restrictions
- Group-specific command limitations
- Argument parsing and validation

### Error Handling
Comprehensive error handling throughout the application with graceful degradation and detailed logging for debugging purposes.

### Advanced Security Features
- **Real-time Spam Detection**: Advanced pattern recognition for scams, phishing, and spam
- **URL Security Scanning**: Automatic threat assessment for suspicious links
- **Threat Reporting System**: User-driven security reporting with automated analysis
- **Flood Protection**: Message frequency monitoring and automatic warnings
- **Content Analysis**: Multi-layered analysis including keyword detection, pattern matching, and behavior tracking
- Rate limiting and anti-spam mechanisms
- Owner verification system
- Blocked numbers management
- Allowed groups configuration

## External Dependencies

### Core Dependencies
- **whatsapp-web.js**: Primary WhatsApp Web client library for bot functionality
- **qrcode-terminal**: QR code generation for initial authentication setup
- **yt-dlp**: Advanced media extraction tool supporting multiple platforms for audio downloads
- **ffmpeg**: Media processing and conversion for audio file handling

### Runtime Environment
- **Node.js**: JavaScript runtime environment
- **Puppeteer**: Headless browser automation (bundled with whatsapp-web.js)

### Optional Integrations
- Environment variables for configuration (OWNER_NUMBER, LOG_LEVEL, DEBUG, ALLOWED_GROUPS, BLOCKED_NUMBERS)
- File system for session storage, log management, and temporary media processing
- Multi-platform audio extraction supporting YouTube, Spotify, SoundCloud, TikTok, Instagram, Twitter, Bandcamp, and Mixcloud

### Browser Dependencies
Puppeteer runs with specific Chrome/Chromium flags optimized for server environments:
- Headless mode operation
- Sandbox disabled for containerized environments
- GPU acceleration disabled for server compatibility
- Single process mode for resource efficiency