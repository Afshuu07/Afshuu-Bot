const { Client, NoAuth } = require("whatsapp-web.js");
const qrcode = require("qrcode-terminal");
const messageHandler = require("./handlers/messageHandler");
const logger = require("./utils/logger");
const config = require("./config/settings");

class AfshuuBot {
    constructor() {
        this.client = new Client({
            authStrategy: new NoAuth(),
            puppeteer: config.PUPPETEER_OPTIONS,
        });

        this.initializeBot();
    }

    initializeBot() {
        this.client.on("qr", (qr) => {
            console.clear(); // Clear console for better visibility
            console.log("\n🌟═══════════════════════════════════════════🌟");
            console.log("🤖           AFSHUU BOT SETUP               🤖");
            console.log("🌟═══════════════════════════════════════════🌟");
            console.log("📱 SCAN THIS QR CODE WITH YOUR WHATSAPP:");
            console.log("📋 INSTRUCTIONS:");
            console.log("   1. Open WhatsApp on your phone");
            console.log("   2. Go to Settings > Linked Devices");
            console.log("   3. Tap 'Link a Device'");
            console.log("   4. Scan the QR code below");
            console.log("\n" + "═".repeat(50));
            console.log("📸 QR CODE - SCAN WITH WHATSAPP CAMERA:");
            console.log("═".repeat(50));
            
            // Generate larger QR code for better scanning
            qrcode.generate(qr, { small: false });
            
            console.log("═".repeat(50));
            console.log("⚠️  TROUBLESHOOTING:");
            console.log("   • Make sure your phone has internet connection");
            console.log("   • Try moving phone closer/farther from screen");
            console.log("   • QR code refreshes every 60 seconds");
            console.log("   • If scanning fails, wait for new QR code");
            console.log("🌟═══════════════════════════════════════════🌟");
            
            logger.info("QR Code generated for authentication");
        });

        this.client.on("ready", () => {
            const readyMessage = `
🎉━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━🎉
✨            AFSHUU BOT            ✨
🌟          NOW ONLINE!           🌟
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🚀 Status: Fully Operational
🎵 Audio Downloads: Ready
🛡️  Spam Detection: Active
👋 Auto Welcome: Enabled
📚 Tutorial System: Available

🔥 Ready to serve with enhanced features!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`;

            console.log(readyMessage);
            logger.info(
                "Afshuu Bot initialized successfully with enhanced features",
            );

            // Send startup notification to owner if configured
            if (config.OWNER_NUMBER) {
                this.sendStartupNotification();
            }
        });

        this.client.on("authenticated", () => {
            console.log("✅ WhatsApp Web authenticated successfully");
            logger.info("Authentication successful");
        });

        this.client.on("auth_failure", (msg) => {
            console.clear();
            console.error("\n🚨 ═══════════════════════════════════════════ 🚨");
            console.error("❌           AUTHENTICATION FAILED           ❌");
            console.error("🚨 ═══════════════════════════════════════════ 🚨");
            console.error("📱 REASON:", msg);
            console.error("\n💡 SOLUTIONS:");
            console.error("   1. Wait for new QR code (generating in 5 seconds...)");
            console.error("   2. Make sure WhatsApp is updated");
            console.error("   3. Clear WhatsApp cache if needed");
            console.error("   4. Restart WhatsApp app and try again");
            console.error("🔄 Bot will generate new QR code automatically...");
            console.error("🚨 ═══════════════════════════════════════════ 🚨");
            logger.error("Authentication failed: " + msg);
        });

        this.client.on("disconnected", (reason) => {
            console.log("⚠️ Bot disconnected:", reason);
            logger.warn("Bot disconnected: " + reason);
        });

        this.client.on("message", async (message) => {
            try {
                await messageHandler.handleMessage(this.client, message);
            } catch (error) {
                logger.error("Error handling message: " + error.message);
                console.error("Error handling message:", error);
            }
        });

        this.client.on("message_create", async (message) => {
            // Handle outgoing messages if needed
            if (message.fromMe && message.body.startsWith(".")) {
                try {
                    await messageHandler.handleMessage(this.client, message);
                } catch (error) {
                    logger.error(
                        "Error handling outgoing message: " + error.message,
                    );
                }
            }
        });

        this.client.on("group_join", async (notification) => {
            try {
                const chat = await notification.getChat();
                const contact = await this.client.getContactById(
                    notification.id.participant,
                );

                const welcomeMessages = [
                    `🎊✨ *WELCOME TO ${chat.name}!* ✨🎊

🌟 Hey there @${contact.id.user}! 🌟
🎉 We're thrilled to have you join our amazing community!

🚀 *What can I do for you?*
🎵 Download audio from YouTube, Spotify & more
📚 Interactive tutorial: Type *.tutorial*
🛡️  Advanced spam protection
📱 Smart group management
🎮 Fun commands & utilities

💫 *Quick Start:*
• *.menu* - See all commands
• *.tutorial* - Interactive guide
• *.help* - Get assistance

🔥 Let's make this group awesome together!
🤖 *Powered by Afshuu Bot*`,

                    `🌈 *Welcome Aboard* @${contact.id.user}! 🌈

🎭 You've just entered the coolest group: *${chat.name}*

✨ *Your journey begins now:*
🎯 Explore commands with *.menu*
🎓 New here? Try *.tutorial* for a guided tour!
🎵 Love music? I can download audio from any platform!
🛡️  Don't worry about spam - I've got your back!

🌟 Ready to experience the magic? Let's go! 🚀`,

                    `🎪 *GRAND ENTRANCE!* 🎪
Welcome @${contact.id.user} to *${chat.name}*!

🎨 You've unlocked a world of possibilities:
🎧 Audio downloads from everywhere
🎯 Smart bot interactions  
🎪 Fun group activities
🛡️  Ultimate protection system

🎁 *Special for newcomers:*
Type *.tutorial* for your personal guide!
Type *.welcome* to see this message again!

🌟 Let the adventure begin! 🌟`,
                ];

                const randomWelcome =
                    welcomeMessages[
                        Math.floor(Math.random() * welcomeMessages.length)
                    ];

                await chat.sendMessage(randomWelcome, {
                    mentions: [contact.id._serialized],
                });

                // Send tutorial hint after 5 seconds
                setTimeout(async () => {
                    try {
                        await chat.sendMessage(
                            `💡 *Psst, @${contact.id.user}!* 
                        
Don't forget to check out our interactive tutorial:
📚 Type *.tutorial* to get started!

🎯 Or jump right in with *.menu* to see all commands!`,
                            {
                                mentions: [contact.id._serialized],
                            },
                        );
                    } catch (error) {
                        logger.error(
                            `Error sending tutorial hint: ${error.message}`,
                        );
                    }
                }, 5000);

                logger.info(
                    `Enhanced welcome message sent to ${contact.number || contact.id.user} in group ${chat.name}`,
                );
            } catch (error) {
                logger.error(`Error sending welcome message: ${error.message}`);
            }
        });

        this.client.on("group_leave", (notification) => {
            logger.info(`Someone left group: ${notification.chatId}`);
        });
    }

    async sendStartupNotification() {
        try {
            const contact = await this.client.getContactById(
                config.OWNER_NUMBER + "@c.us",
            );
            await contact.chat.sendMessage(
                "🤖 *Afshuu Bot Started*\n\nBot is now online and ready to serve!",
            );
        } catch (error) {
            logger.error(
                "Failed to send startup notification: " + error.message,
            );
        }
    }

    async start() {
        try {
            console.log("🚀 Starting Afshuu Bot...");

            // Clean up any existing Chromium processes
            await this.cleanupChromeProcesses();

            // Add a small delay before initializing
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            await this.client.initialize();
        } catch (error) {
            console.error("❌ Failed to start bot:", error.message);
            logger.error("Failed to start bot: " + error.message);

            // Attempt cleanup before exit
            await this.cleanupChromeProcesses();
            
            // Exit gracefully instead of hard crash
            console.log("🔄 Bot will attempt restart in 5 seconds...");
            setTimeout(() => {
                process.exit(0);
            }, 5000);
        }
    }

    async cleanupChromeProcesses() {
        try {
            const { exec } = require("child_process");
            await new Promise((resolve) => {
                exec('pkill -f "chromium\\|chrome" || true', () => resolve());
            });

            // Small delay to allow cleanup
            await new Promise((resolve) => setTimeout(resolve, 1000));
        } catch (error) {
            console.log("Cleanup attempt completed");
        }
    }

    async stop() {
        try {
            console.log("🛑 Stopping Afshuu Bot...");
            await this.client.destroy();

            // Clean up Chromium processes
            await this.cleanupChromeProcesses();

            logger.info("Bot stopped successfully");
        } catch (error) {
            console.error("Error stopping bot:", error);
            logger.error("Error stopping bot: " + error.message);

            // Force cleanup even if destroy fails
            await this.cleanupChromeProcesses();
        }
    }
}

// Handle process termination
process.on("SIGINT", async () => {
    console.log("\n📴 Received SIGINT, shutting down gracefully...");
    if (global.afshuuBot) {
        await global.afshuuBot.stop();
    }
    process.exit(0);
});

process.on("SIGTERM", async () => {
    console.log("\n📴 Received SIGTERM, shutting down gracefully...");
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
