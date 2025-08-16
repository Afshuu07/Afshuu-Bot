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
const connectionStatusVisualizer = require('./utils/connectionStatusVisualizer');

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
            
            // Initialize connection status visualizer
            connectionStatusVisualizer.updateStatus('connecting', { reason: 'Bot initialization completed' });

        } catch (error) {
            logger.error(`Bot initialization failed: ${error.message}`);
            console.error('🚨 Bot initialization failed:', error.message);
            throw error;
        }
    }

    async handleConnectionUpdate(update) {
        const { connection, lastDisconnect, qr } = update;

        if (qr) {
            connectionStatusVisualizer.updateStatus('qr', { reason: 'QR code generated for authentication' });
            
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
            const disconnectReason = lastDisconnect?.error?.output?.statusCode;
            const shouldReconnect = disconnectReason !== DisconnectReason.loggedOut;
            
            connectionStatusVisualizer.updateStatus('close', { 
                reason: `Disconnected: ${disconnectReason}`,
                disconnectReason: disconnectReason
            });
            
            if (shouldReconnect) {
                if (this.retryCount < this.maxRetries) {
                    this.retryCount++;
                    connectionStatusVisualizer.updateStatus('connecting', { 
                        reason: `Reconnection attempt ${this.retryCount}/${this.maxRetries}` 
                    });
                    console.log(`🔄 Connection lost. Retrying... (${this.retryCount}/${this.maxRetries})`);
                    await delay(5000);
                    await this.initialize();
                } else {
                    connectionStatusVisualizer.updateStatus('disconnected', { 
                        reason: 'Max retry attempts reached' 
                    });
                    console.log('🚨 Max retry attempts reached. Please restart the bot.');
                    logger.error('Max retry attempts reached');
                }
            } else {
                connectionStatusVisualizer.updateStatus('disconnected', { 
                    reason: 'Logged out - QR scan required' 
                });
                console.log('🚪 Connection closed. Please scan QR code again.');
                logger.info('Connection closed - logged out');
            }
        } else if (connection === 'open') {
            this.retryCount = 0;
            this.connectionState = 'open';
            
            connectionStatusVisualizer.updateStatus('open', { 
                reason: 'Successfully connected to WhatsApp' 
            });
            
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
            
            // Display full connection status
            setTimeout(() => {
                connectionStatusVisualizer.displayFullStatus();
                connectionStatusVisualizer.displayConnectionHealth();
            }, 2000);
            
            // Start periodic health checks
            connectionStatusVisualizer.startPeriodicHealthCheck();

            // Send startup notification to owner
            if (config.OWNER_NUMBER) {
                await this.sendStartupNotification();
            }
        } else if (connection === 'connecting') {
            connectionStatusVisualizer.updateStatus('connecting', { 
                reason: 'Establishing connection to WhatsApp' 
            });
        }
    }

    async handleMessages(m) {
        try {
            const message = m.messages[0];
            if (!message) return;
            
            console.log(`📨 New message received from: ${message.key.remoteJid}`);
            console.log(`📝 Message type: ${Object.keys(message.message || {}).join(', ')}`);

            // Skip if message is from status broadcast
            if (message.key.remoteJid === 'status@broadcast') {
                console.log('⏩ Skipped: Status broadcast message');
                return;
            }

            // Allow self messages now - commenting out the skip
            // if (message.key.fromMe) {
            //     console.log('⏩ Skipped: Message from self');
            //     return;
            // }

            // Extract message content
            const messageContent = this.extractMessageContent(message);
            console.log(`💬 Message content: "${messageContent}"`);
            if (!messageContent) {
                console.log('⏩ Skipped: No message content extracted');
                return;
            }

            // Check spam (skip for command messages and self messages)
            const isCommandMessage = messageContent.startsWith(config.PREFIX || '.');
            const isSelfMessage = message.key.fromMe;
            console.log(`🛡️ Command message detected: ${isCommandMessage}, Self message: ${isSelfMessage}`);
            
            if (!isCommandMessage && !isSelfMessage) {
                const isSpam = await spamDetector.checkMessage(messageContent, message.key.remoteJid);
                console.log(`🔍 Spam check result: ${JSON.stringify(isSpam)}`);
                if (isSpam.isSpam) {
                    console.log('🚫 Message blocked as spam');
                    await this.handleSpamMessage(message, isSpam);
                    return;
                }
            } else {
                console.log(`⏩ Skipping spam check - Command: ${isCommandMessage}, Self: ${isSelfMessage}`);
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

            // Increment message counter for status tracking
            connectionStatusVisualizer.incrementMessageCount();
            
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
            const groupName = groupMetadata.subject || 'this amazing group';
            const groupDescription = groupMetadata.desc || 'An awesome community space for everyone!';
            const memberCount = groupMetadata.participants?.length || 0;
            const adminCount = groupMetadata.participants?.filter(p => p.admin).length || 0;

            // Get profile picture URL
            let profilePicUrl = '';
            try {
                profilePicUrl = await this.sock.profilePictureUrl(participantId, 'image');
            } catch (error) {
                logger.warn(`Could not get profile picture for ${participantId}`);
            }

            // Hacker-styled welcome messages with profile pictures
            const hackerWelcomeMessages = [
                `⚡━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━⚡
🔥      SYSTEM BREACH DETECTED!      🔥  
⚡━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━⚡

💀 *HACKER ALERT:* @${participantName}
🖥️ *ACCESS GRANTED TO:* ${groupName}

📊 *SYSTEM SCAN:*
${groupDescription}

🔍 *NETWORK STATUS:*
👥 Connected Users: ${memberCount}
🛡️ Admin Privileges: ${adminCount}
🤖 AI Guardian: ONLINE

💻 *HACKING TOOLS LOADED:*
🎵 Media Extraction Protocol
📹 Video Decryption Engine  
🛡️ Anti-Spam Firewall
📚 Knowledge Database Access
🎮 Entertainment Backdoor
⚡ Real-Time Monitoring

🔥 *EXPLOIT COMMANDS:*
• *.menu* - Access control panel
• *.tutorial* - Hacking tutorials
• *.video [target]* - Extract media
• *.games* - Fun exploits
• *.status* - System diagnostics

${profilePicUrl ? `📸 Profile Acquired: ${profilePicUrl}` : '📸 Profile: Anonymous'}

⚡ Welcome to the underground, @${participantName}! ⚡
💀🔥🖥️💻🔍🛡️📚🎮⚡💀`,

                `🟢━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━🟢
🔰      MATRIX CODE INJECTION!      🔰
🟢━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━🟢

🕳️ *ANOMALY DETECTED:* @${participantName}
💚 *ENTERING THE MATRIX:* ${groupName}

📡 *DATABASE QUERY:*
${groupDescription}

🔢 *BINARY ANALYSIS:*
👥 Active Nodes: ${memberCount}
🔐 Root Access: ${adminCount}
🤖 AI Sentinel: ACTIVATED

🌐 *CYBER ARSENAL:*
🎵 Audio Stream Hijacker
📹 Visual Data Miner
🛡️ Trojan Defense System
📚 Info Warfare Database
🎮 Digital Playground
⚡ Live Network Scanner

🔰 *HACK COMMANDS:*
• *.menu* - Command terminal
• *.tutorial* - Code academy
• *.video [url]* - Data extraction
• *.games* - Simulation mode
• *.status* - System monitor

${profilePicUrl ? `🎯 Target Profile: ${profilePicUrl}` : '🎯 Profile: Encrypted'}

🟢 You're in the system now, @${participantName}! 🟢
💚🔰🕳️🌐🔢🔐🤖🎯🟢`,

                `🔴━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━🔴
⚠️     SECURITY BREACH WARNING!     ⚠️
🔴━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━🔴

🚨 *INTRUDER ALERT:* @${participantName}
💥 *UNAUTHORIZED ACCESS TO:* ${groupName}

⚠️ *THREAT ASSESSMENT:*
${groupDescription}

🚩 *SECURITY METRICS:*
👥 Compromised Accounts: ${memberCount}
🔒 Security Clearance: ${adminCount}
🤖 Defense Bot: ENGAGED

💥 *PENETRATION TOOLS:*
🎵 Sonic Data Breach
📹 Visual Reconnaissance
🛡️ Counter-Attack Systems
📚 Intel Gathering Hub
🎮 Stealth Operations
⚡ Live Threat Monitor

🚨 *RED TEAM COMMANDS:*
• *.menu* - Mission briefing
• *.tutorial* - Training protocols
• *.video [target]* - Intelligence extraction
• *.games* - War games
• *.status* - Threat level

${profilePicUrl ? `🎯 Subject Profile: ${profilePicUrl}` : '🎯 Profile: Classified'}

🔴 The breach is complete, @${participantName}! 🔴
⚠️💥🚨🚩🔒🤖💥🎯🔴`,

                `⚫━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━⚫
👤      ANONYMOUS ACCESS GRANTED     👤
⚫━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━⚫

🎭 *GHOST IN THE MACHINE:* @${participantName}
💀 *DARK WEB PORTAL:* ${groupName}

🕴️ *CLASSIFIED INTEL:*
${groupDescription}

👤 *SHADOW NETWORK:*
👥 Anonymous Users: ${memberCount}
🔐 Deep State Admins: ${adminCount}
🤖 Ghost Protocol: ACTIVE

🔮 *DARK TOOLS:*
🎵 Audio Cryptanalysis
📹 Video Forensics
🛡️ Steganography Shield
📚 Darknet Archives
🎮 Psychological Ops
⚡ Zero-Day Monitor

👤 *SHADOW COMMANDS:*
• *.menu* - Anonymous interface
• *.tutorial* - Underground guides
• *.video [cipher]* - Decrypt media
• *.games* - Mind games
• *.status* - Ghost status

${profilePicUrl ? `🎭 Identity Revealed: ${profilePicUrl}` : '🎭 Profile: Anonymous'}

⚫ You are now invisible, @${participantName}! ⚫
👤💀🎭🕴️🔮👤💀🎭⚫`
            ];

            // Select random hacker welcome message
            const randomHackerWelcome = hackerWelcomeMessages[Math.floor(Math.random() * hackerWelcomeMessages.length)];

            // Send the hacker-styled welcome message with profile picture
            const welcomeOptions = {
                text: randomHackerWelcome,
                mentions: [participantId]
            };

            // Add profile picture if available
            if (profilePicUrl) {
                try {
                    await this.sock.sendMessage(groupId, {
                        image: { url: profilePicUrl },
                        caption: randomHackerWelcome,
                        mentions: [participantId]
                    });
                } catch (error) {
                    // If profile picture fails, send text only
                    await this.sock.sendMessage(groupId, welcomeOptions);
                }
            } else {
                await this.sock.sendMessage(groupId, welcomeOptions);
            }

            // Send a follow-up hacker tip after 3 seconds
            setTimeout(async () => {
                const hackerTip = `💀 *HACKER BRIEFING for @${participantName}:*

🔥 *INITIATION PROTOCOL:*
1️⃣ Execute *.menu* to access mainframe
2️⃣ Run *.tutorial* for advanced training
3️⃣ Deploy *.video [target]* for data extraction
4️⃣ Launch *.games* for stealth missions

⚡ *SYSTEM CAPABILITIES:*
• Quantum encryption active
• Neural firewall deployed
• Multi-layer protection online
• Elite-grade processing ready

🖥️ Welcome to the dark side, agent! 💀`;

                await this.sock.sendMessage(groupId, {
                    text: hackerTip,
                    mentions: [participantId]
                });
            }, 3000);

            logger.info(`Hacker-styled welcome message with profile picture sent to ${participantName} in ${groupMetadata.subject}`);

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