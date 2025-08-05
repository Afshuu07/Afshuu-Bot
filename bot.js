const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const messageHandler = require('./handlers/messageHandler');
const logger = require('./utils/logger');
const config = require('./config/settings');

class AfshuuBot {
    constructor() {
        this.client = new Client({
            authStrategy: new LocalAuth({
                clientId: "afshuu-bot"
            }),
            puppeteer: {
                headless: true,
                args: [
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    '--disable-dev-shm-usage',
                    '--disable-accelerated-2d-canvas',
                    '--no-first-run',
                    '--no-zygote',
                    '--single-process',
                    '--disable-gpu'
                ]
            }
        });

        this.initializeBot();
    }

    initializeBot() {
        this.client.on('qr', (qr) => {
            console.log('\n=== AFSHUU BOT SETUP ===');
            console.log('Scan this QR code with your WhatsApp to connect:');
            qrcode.generate(qr, { small: true });
            logger.info('QR Code generated for authentication');
        });

        this.client.on('ready', () => {
            console.log('\n🤖 Afshuu Bot is ready and online!');
            logger.info('Afshuu Bot initialized successfully');
            
            // Send startup notification to owner if configured
            if (config.OWNER_NUMBER) {
                this.sendStartupNotification();
            }
        });

        this.client.on('authenticated', () => {
            console.log('✅ WhatsApp Web authenticated successfully');
            logger.info('Authentication successful');
        });

        this.client.on('auth_failure', (msg) => {
            console.error('❌ Authentication failed:', msg);
            logger.error('Authentication failed: ' + msg);
        });

        this.client.on('disconnected', (reason) => {
            console.log('⚠️ Bot disconnected:', reason);
            logger.warn('Bot disconnected: ' + reason);
        });

        this.client.on('message', async (message) => {
            try {
                await messageHandler.handleMessage(this.client, message);
            } catch (error) {
                logger.error('Error handling message: ' + error.message);
                console.error('Error handling message:', error);
            }
        });

        this.client.on('message_create', async (message) => {
            // Handle outgoing messages if needed
            if (message.fromMe && message.body.startsWith('.')) {
                try {
                    await messageHandler.handleMessage(this.client, message);
                } catch (error) {
                    logger.error('Error handling outgoing message: ' + error.message);
                }
            }
        });

        this.client.on('group_join', (notification) => {
            logger.info(`Someone joined group: ${notification.chatId}`);
        });

        this.client.on('group_leave', (notification) => {
            logger.info(`Someone left group: ${notification.chatId}`);
        });
    }

    async sendStartupNotification() {
        try {
            const contact = await this.client.getContactById(config.OWNER_NUMBER + '@c.us');
            await contact.chat.sendMessage('🤖 *Afshuu Bot Started*\n\nBot is now online and ready to serve!');
        } catch (error) {
            logger.error('Failed to send startup notification: ' + error.message);
        }
    }

    async start() {
        try {
            console.log('🚀 Starting Afshuu Bot...');
            await this.client.initialize();
        } catch (error) {
            console.error('Failed to start bot:', error);
            logger.error('Failed to start bot: ' + error.message);
            process.exit(1);
        }
    }

    async stop() {
        try {
            console.log('🛑 Stopping Afshuu Bot...');
            await this.client.destroy();
            logger.info('Bot stopped successfully');
        } catch (error) {
            console.error('Error stopping bot:', error);
            logger.error('Error stopping bot: ' + error.message);
        }
    }
}

// Handle process termination
process.on('SIGINT', async () => {
    console.log('\n📴 Received SIGINT, shutting down gracefully...');
    if (global.afshuuBot) {
        await global.afshuuBot.stop();
    }
    process.exit(0);
});

process.on('SIGTERM', async () => {
    console.log('\n📴 Received SIGTERM, shutting down gracefully...');
    if (global.afshuuBot) {
        await global.afshuuBot.stop();
    }
    process.exit(0);
});

// Start the bot
const bot = new AfshuuBot();
global.afshuuBot = bot;
bot.start().catch(console.error);

module.exports = AfshuuBot;
