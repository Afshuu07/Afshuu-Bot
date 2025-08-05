const config = {
    // Bot configuration
    BOT_NAME: 'Afshuu',
    BOT_VERSION: '1.0.0',
    
    // Owner configuration (get from environment variables)
    OWNER_NUMBER: process.env.OWNER_NUMBER || null, // Format: +1234567890 or 1234567890
    
    // Command configuration
    COMMAND_PREFIX: '.',
    COMMAND_COOLDOWN: 3000, // 3 seconds
    
    // Group settings
    MAX_TAG_MEMBERS: 100, // Maximum members to tag at once
    
    // Bot behavior
    AUTO_READ_MESSAGES: false,
    AUTO_TYPING: true,
    
    // Logging
    LOG_LEVEL: process.env.LOG_LEVEL || 'info',
    DEBUG_MODE: process.env.DEBUG === 'true',
    
    // Session management
    SESSION_NAME: 'afshuu-session',
    AUTO_RESTART: true,
    
    // Security
    ALLOWED_GROUPS: process.env.ALLOWED_GROUPS ? process.env.ALLOWED_GROUPS.split(',') : [],
    BLOCKED_NUMBERS: process.env.BLOCKED_NUMBERS ? process.env.BLOCKED_NUMBERS.split(',') : [],
    
    // Features
    ANTI_SPAM: true,
    RATE_LIMIT: {
        MAX_COMMANDS_PER_MINUTE: 10,
        BAN_DURATION: 5 * 60 * 1000 // 5 minutes
    },
    
    // WhatsApp Web options
    PUPPETEER_OPTIONS: {
        headless: true,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--no-zygote',
            '--single-process',
            '--disable-gpu',
            '--disable-web-security',
            '--disable-features=VizDisplayCompositor'
        ]
    },
    
    // Messages
    MESSAGES: {
        STARTUP: '🤖 *Afshuu Bot Started*\n\nBot is now online and ready to serve!',
        SHUTDOWN: '🛑 *Afshuu Bot Stopped*\n\nBot is going offline. See you soon!',
        UNAUTHORIZED: '❌ You are not authorized to use this command.',
        GROUP_ONLY: '❌ This command can only be used in groups.',
        OWNER_ONLY: '❌ This command is only available to the bot owner.',
        COOLDOWN: '⏱️ Please wait before using this command again.',
        ERROR: '❌ An error occurred while processing your request.',
        COMMAND_NOT_FOUND: '❓ Command not found. Type `.menu` to see available commands.'
    }
};

module.exports = config;
