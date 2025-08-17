# Afshuu WhatsApp Bot

## Overview
The Afshuu WhatsApp Bot is an automation tool designed to provide command-based interactions via WhatsApp. Built on the Bailey WhatsApp client, it offers a modular and extensible system with functionalities including enhanced media downloading (watermark-free videos, premium quality audio), professional sticker creation, game recommendations, and advanced security features like real-time spam detection. The bot aims to deliver a professional and visually engaging user experience with rich animations and a cinema-quality interface, streamlining communication and media handling within WhatsApp.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### Core Architecture
The application employs a modular, event-driven architecture centered on the Bailey WhatsApp client. Key components include:
- **Bailey Bot Core**: Main entry point using `@whiskeysockets/baileys` for multi-device authentication and connection handling.
- **Message Handlers**: Dedicated handlers for Bailey and legacy `whatsapp-web.js` styles to ensure compatibility.
- **Enhanced Command System**: A comprehensive, modular structure supporting categorized menus, interactive tutorials, and various functionalities like media downloads and security.
- **Configuration Management**: Centralized settings leveraging environment variables for deployment flexibility.
- **Advanced Spam Detection**: Real-time message analysis for security.
- **Enhanced Media Processing**: Specialized modules for watermark-free video downloads (1000+ platforms), high-quality audio extraction with DRM detection, and professional sticker creation from various media types.

### Authentication Strategy
The system utilizes Bailey's multi-file authentication state, providing multi-device support, persistent sessions without browser dependencies, enhanced security, and stable automatic reconnections.

### Logging System
A custom logging implementation supports file-based logging with rotation, configurable log levels, and retention policies, outputting to both console and files.

### Enhanced Command Processing
Commands operate on a prefix-based system (default: `.`) and offer:
- **Categorized Menu System**: Organized commands across media, security, group, and games.
- **Interactive Tutorial**: A 5-step guided tour for new users.
- **Media Functionality**: Watermark-free video, advanced audio extraction, and professional sticker creation.
- **Game Recommendation Engine**: Personalized suggestions across multiple categories.
- **Security Commands**: URL scanning, threat reporting, and protection status.
- **Visual Design**: Attractive animations and formatting for most features, with a simple, animation-free `hidetag` command as requested.
- Cooldown mechanisms, owner-only restrictions, group-specific limitations, and argument parsing.

### Error Handling
Comprehensive error handling with graceful degradation and detailed logging for debugging.

### Advanced Security Features
Includes real-time spam detection, URL security scanning, a threat reporting system, flood protection, content analysis (keyword detection, pattern matching), rate limiting, owner verification, and management of blocked numbers and allowed groups.

## External Dependencies

### Core Dependencies
- `@whiskeysockets/baileys`: Primary WhatsApp client library.
- `qrcode-terminal`: For generating QR codes during authentication.
- `yt-dlp`: Advanced media extraction for various platforms.
- `ffmpeg` and `@ffmpeg-installer/ffmpeg`: For media processing and conversion.
- `axios`, `file-type`, `node-fetch`, `jimp`, `sharp`: Utilities for network requests, file type detection, image processing.

### Runtime Environment
- **Node.js**: JavaScript runtime.

### Optional Integrations
- Environment variables for `OWNER_NUMBER`, `LOG_LEVEL`, `DEBUG`, `ALLOWED_GROUPS`, `BLOCKED_NUMBERS`.
- File system for session storage, log management, and temporary media processing.
- Multi-platform audio extraction supporting YouTube, Spotify, SoundCloud, TikTok, Instagram, Twitter, Bandcamp, and Mixcloud.