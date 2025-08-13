const { default: makeWASocket, DisconnectReason, useMultiFileAuthState, delay } = require('@whiskeysockets/baileys');
const { Boom } = require('@hapi/boom');
const P = require('pino');
const qrcode = require('qrcode-terminal');
const fs = require('fs');
const path = require('path');

// Import handlers and utilities
const messageHandler = require('./handlers/messageHandler');
const config = require('./config/settings');
const logger = require('./utils/logger');
const spamDetector = require('./utils/spamDetector');

class AfshuuBaileyBot {
    constructor() {
        this.sock = null;
        this.connectionState = 'closed';
        this.retryCount = 0;
        this.maxRetries = 5;
    }

    async initialize() {
        try {
            console.log(`
🎉━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━🎉
✨         AFSHUU BAILEY BOT        ✨
🌟        INITIALIZING...          🌟
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🔄 Setting up Bailey connection...
🛡️  Enhanced security enabled
📱 Multi-device support active
⚡ Performance optimized
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);

            // Initialize auth state
            const { state, saveCreds } = await useMultiFileAuthState('./auth_info_baileys');

            // Create socket connection
            this.sock = makeWASocket({
                auth: state,
                printQRInTerminal: false, // We'll handle QR display ourselves
                logger: P({ level: config.LOG_LEVEL || 'info' }),
                browser: ['Afshuu Bot', 'Chrome', '3.0'],
                connectTimeoutMs: 60000,
                defaultQueryTimeoutMs: 0,
                keepAliveIntervalMs: 10000,
                emitOwnEvents: true,
                getMessage: async (key) => {
                    return { conversation: 'Hello' };
                }
            });

            // Handle credentials update
            this.sock.ev.on('creds.update', saveCreds);

            // Handle connection updates
            this.sock.ev.on('connection.update', async (update) => {
                await this.handleConnectionUpdate(update);
            });

            // Handle messages
            this.sock.ev.on('messages.upsert', async (m) => {
                await this.handleMessages(m);
            });

            // Handle group updates
            this.sock.ev.on('group-participants.update', async (update) => {
                await this.handleGroupParticipantsUpdate(update);
            });

            logger.info('Bailey bot initialization completed');

        } catch (error) {
            logger.error(`Bot initialization failed: ${error.message}`);
            console.error('🚨 Bot initialization failed:', error.message);
            throw error;
        }
    }

    async handleConnectionUpdate(update) {
        const { connection, lastDisconnect, qr } = update;

        if (qr) {
            console.log(`
🎯━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━🎯
📱       SCAN QR CODE WITH PHONE     📱
🎯━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━🎯`);
            
            qrcode.generate(qr, { small: true });
            
            console.log(`
══════════════════════════════════════════════════
⚠️  TROUBLESHOOTING:
   • Make sure your phone has internet connection
   • Try moving phone closer/farther from screen
   • QR code refreshes every 60 seconds
   • If scanning fails, wait for new QR code
🌟═══════════════════════════════════════════🌟
ℹ️  QR Code generated for authentication`);
        }

        if (connection === 'close') {
            const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
            
            if (shouldReconnect) {
                if (this.retryCount < this.maxRetries) {
                    this.retryCount++;
                    console.log(`🔄 Connection lost. Retrying... (${this.retryCount}/${this.maxRetries})`);
                    await delay(5000);
                    await this.initialize();
                } else {
                    console.log('🚨 Max retry attempts reached. Please restart the bot.');
                    logger.error('Max retry attempts reached');
                }
            } else {
                console.log('🚪 Connection closed. Please scan QR code again.');
                logger.info('Connection closed - logged out');
            }
        } else if (connection === 'open') {
            this.retryCount = 0;
            this.connectionState = 'open';
            
            const readyMessage = `
🎉━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━🎉
✨         AFSHUU BAILEY BOT        ✨
🌟         NOW ONLINE!             🌟
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🚀 Status: Fully Operational
🎵 Audio Downloads: Ready
📹 Video Downloads: Ready (No Watermarks)
🛡️  Multi-language Spam Detection: Active
👋 Auto Welcome with Profile Pictures: Enabled
📚 Tutorial System: Available
🎮 Game Recommendations: Ready

🔥 Bailey bot ready to serve with enhanced features!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`;

            console.log(readyMessage);
            logger.info('Bailey bot connected successfully with enhanced features');

            // Send startup notification to owner
            if (config.OWNER_NUMBER) {
                await this.sendStartupNotification();
            }
        }
    }

    async handleMessages(m) {
        try {
            const message = m.messages[0];
            if (!message) return;

            // Skip if message is from status broadcast
            if (message.key.remoteJid === 'status@broadcast') return;

            // Skip if message is from self
            if (message.key.fromMe) return;

            // Extract message content
            const messageContent = this.extractMessageContent(message);
            if (!messageContent) return;

            // Check spam
            const isSpam = await spamDetector.checkMessage(messageContent, message.key.remoteJid);
            if (isSpam.isSpam) {
                await this.handleSpamMessage(message, isSpam);
                return;
            }

            // Create context object similar to whatsapp-web.js format
            const context = {
                message: message,
                messageContent: messageContent,
                isGroup: message.key.remoteJid.endsWith('@g.us'),
                sender: message.key.participant || message.key.remoteJid,
                chat: {
                    id: message.key.remoteJid,
                    isGroup: message.key.remoteJid.endsWith('@g.us')
                }
            };

            // Process with Bailey message handler
            const BaileyMessageHandler = require('./handlers/baileyMessageHandler');
            await BaileyMessageHandler.handleMessage(this.sock, context);

        } catch (error) {
            logger.error(`Error handling message: ${error.message}`);
        }
    }

    extractMessageContent(message) {
        if (message.message?.conversation) {
            return message.message.conversation;
        }
        if (message.message?.extendedTextMessage?.text) {
            return message.message.extendedTextMessage.text;
        }
        if (message.message?.imageMessage?.caption) {
            return message.message.imageMessage.caption;
        }
        if (message.message?.videoMessage?.caption) {
            return message.message.videoMessage.caption;
        }
        return null;
    }

    async handleSpamMessage(message, spamResult) {
        try {
            const warningMessage = `🛡️ *SPAM DETECTED* 🛡️

⚠️ Suspicious content detected
🔍 Threat Level: ${spamResult.severity}
📊 Pattern: ${spamResult.patterns.join(', ')}

🚨 This message has been flagged for review.`;

            await this.sock.sendMessage(message.key.remoteJid, { 
                text: warningMessage 
            });

            logger.warn(`Spam detected from ${message.key.participant || message.key.remoteJid}: ${spamResult.patterns.join(', ')}`);
        } catch (error) {
            logger.error(`Error handling spam: ${error.message}`);
        }
    }

    async handleGroupParticipantsUpdate(update) {
        try {
            if (update.action === 'add') {
                for (const participant of update.participants) {
                    await this.sendWelcomeMessage(update.id, participant);
                }
            }
        } catch (error) {
            logger.error(`Error handling group participant update: ${error.message}`);
        }
    }

    async sendWelcomeMessage(groupId, participantId) {
        try {
            const groupMetadata = await this.sock.groupMetadata(groupId);
            const participantName = participantId.split('@')[0];

            const welcomeMessages = [
                `🎊 *Welcome to ${groupMetadata.subject}!* 🎊

👋 Hey @${participantName}! Great to have you here!

🚀 *What I can help with:*
🎵 Download audio & videos from any platform
📹 Watermark-free video downloads
🛡️ Advanced multi-language spam protection  
📚 Interactive tutorials: *.tutorial*
🎮 Game recommendations: *.games*
👥 Simple group management tools

💡 *Quick Start:*
• *.menu* - See all commands
• *.video [link]* - Download videos
• *.help* - Get assistance

Welcome aboard! 🌟`,

                `🌟 *Welcome @${participantName}!* 🌟

🎭 You've joined an awesome group: *${groupMetadata.subject}*

✨ *Ready to explore?*
🎯 Try *.menu* for all commands
🎓 New here? Use *.tutorial* for guidance!
🎵 Love media? I download from 1000+ platforms!
🎮 Want games? Try *.games action*!
🛡️ Stay protected with smart spam detection!

Let's make this group amazing! 🚀`,

                `🎪 *New Member Alert!* 🎪
Welcome @${participantName} to *${groupMetadata.subject}*!

🎨 *Available features:*
📹 Video downloads (watermark-free)
🎧 Audio from any platform
🎮 Game recommendations
🎯 Smart group interactions  
🛡️ Advanced protection system

🎁 *Get started:*
• *.tutorial* - Personal guide
• *.games [type]* - Game suggestions
• *.welcome* - See this again

Welcome to the community! 🌟`
            ];

            const randomWelcome = welcomeMessages[Math.floor(Math.random() * welcomeMessages.length)];

            await this.sock.sendMessage(groupId, {
                text: randomWelcome,
                mentions: [participantId]
            });

            logger.info(`Welcome message sent to ${participantName} in ${groupMetadata.subject}`);

        } catch (error) {
            logger.error(`Error sending welcome message: ${error.message}`);
        }
    }

    async sendStartupNotification() {
        try {
            const ownerJid = config.OWNER_NUMBER.includes('@') ? config.OWNER_NUMBER : `${config.OWNER_NUMBER}@s.whatsapp.net`;
            
            const startupMessage = `🤖 *AFSHUU BAILEY BOT STARTED* 🤖

✅ Successfully connected with Bailey
🎵 Audio/Video downloads ready
🛡️ Multi-language spam detection active
👋 Auto-welcome system enabled
🎮 Game recommendation engine loaded

🚀 Bot is ready to serve!`;

            await this.sock.sendMessage(ownerJid, { text: startupMessage });
            logger.info('Startup notification sent to owner');
        } catch (error) {
            logger.error(`Error sending startup notification: ${error.message}`);
        }
    }

    async start() {
        try {
            await this.initialize();
        } catch (error) {
            logger.error(`Failed to start bot: ${error.message}`);
            console.error('🚨 Failed to start bot:', error.message);
            process.exit(1);
        }
    }
}

// Create and start the bot
const bot = new AfshuuBaileyBot();

// Handle process termination
process.on('SIGINT', async () => {
    console.log('\n🛑 Shutting down Afshuu Bailey Bot...');
    if (bot.sock) {
        await bot.sock.logout();
    }
    process.exit(0);
});

// Start the bot
bot.start().catch(console.error);

module.exports = AfshuuBaileyBot;