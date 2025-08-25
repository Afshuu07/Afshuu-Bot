const commands = require('../commands/index');
const logger = require('../utils/logger');
const config = require('../config/settings');

class BaileyMessageHandler {
    static async handleMessage(sock, context) {
        try {
            const { message, messageContent, isGroup, sender } = context;
            
            console.log(`🔍 Bailey Handler - Processing message: "${messageContent}"`);
            console.log(`👤 From: ${sender}, Group: ${isGroup}`);
            
            // Skip if no message content
            if (!messageContent) {
                console.log('⏩ Bailey Handler: No message content');
                return;
            }

            // Check if message starts with command prefix
            const prefix = config.PREFIX || '.';
            console.log(`🔧 Checking for prefix: "${prefix}"`);
            if (!messageContent.startsWith(prefix)) {
                console.log(`⏩ Bailey Handler: Message doesn't start with prefix "${prefix}"`);
                return;
            }

            // Parse command and arguments
            const args = messageContent.slice(prefix.length).trim().split(/\s+/);
            const commandName = args.shift()?.toLowerCase();
            
            console.log(`🎯 Command detected: "${commandName}" with args: [${args.join(', ')}]`);

            if (!commandName) {
                console.log('⏩ Bailey Handler: No command name');
                return;
            }

            // Find and execute command
            const command = commands[commandName];
            if (!command) return;

            // Check if command is owner only
            if (command.ownerOnly && !this.isOwner(sender)) {
                await sock.sendMessage(message.key.remoteJid, {
                    text: '❌ This command is only available for the bot owner.'
                });
                return;
            }

            // Check if command is group only
            if (command.groupOnly && !isGroup) {
                await sock.sendMessage(message.key.remoteJid, {
                    text: '❌ This command only works in groups.'
                });
                return;
            }

            // Create Bailey-compatible message context
            const baileyContext = this.createBaileyContext(sock, message, sender, isGroup);

            // Add reaction first to show bot is active and responding
            try {
                await sock.sendMessage(message.key.remoteJid, {
                    react: {
                        text: '⚡', // Lightning bolt to show instant response
                        key: message.key
                    }
                });
                console.log(`⚡ Bot reacted to command: ${commandName}`);
            } catch (reactionError) {
                console.log(`⚠️ Could not add reaction: ${reactionError.message}`);
            }

            // Small delay to show reaction before processing
            await new Promise(resolve => setTimeout(resolve, 500));

            // Execute command
            await command.execute(sock, baileyContext, args, context);

            // Add success reaction after command execution (for non-hidetag commands)
            if (commandName !== 'hidetag') {
                try {
                    await sock.sendMessage(message.key.remoteJid, {
                        react: {
                            text: '✅', // Checkmark to show completion
                            key: message.key
                        }
                    });
                    console.log(`✅ Bot confirmed completion for: ${commandName}`);
                } catch (reactionError) {
                    console.log(`⚠️ Could not add completion reaction: ${reactionError.message}`);
                }
            }

            logger.info(`Command executed: ${commandName} by ${sender}`);

        } catch (error) {
            logger.error(`Error handling message: ${error.message}`);
            
            // Add error reaction
            try {
                await sock.sendMessage(context.message.key.remoteJid, {
                    react: {
                        text: '❌', // Error reaction
                        key: context.message.key
                    }
                });
            } catch (reactionError) {
                console.log(`⚠️ Could not add error reaction: ${reactionError.message}`);
            }
            
            try {
                await sock.sendMessage(context.message.key.remoteJid, {
                    text: '❌ An error occurred while processing your command.'
                });
            } catch (replyError) {
                logger.error(`Error sending error message: ${replyError.message}`);
            }
        }
    }

    static isOwner(sender) {
        if (!config.OWNER_NUMBER) return false;
        const ownerNumber = config.OWNER_NUMBER.replace(/\D/g, '');
        const senderNumber = sender.replace(/\D/g, '');
        return senderNumber === ownerNumber;
    }

    static createBaileyContext(sock, message, sender, isGroup) {
        return {
            // Bailey message object
            key: message.key,
            message: message.message,
            
            // Helper methods compatible with whatsapp-web.js style
            reply: async (text, options = {}) => {
                return await sock.sendMessage(message.key.remoteJid, {
                    text: text,
                    ...options
                }, {
                    quoted: message
                });
            },

            // Group helper methods
            getChat: async () => {
                if (isGroup) {
                    const groupMetadata = await sock.groupMetadata(message.key.remoteJid);
                    return {
                        id: message.key.remoteJid,
                        name: groupMetadata.subject,
                        isGroup: true,
                        participants: groupMetadata.participants.map(p => ({
                            id: { user: p.id.split('@')[0] }
                        })),
                        sendMessage: async (text, options = {}) => {
                            return await sock.sendMessage(message.key.remoteJid, {
                                text: text,
                                ...options
                            });
                        }
                    };
                } else {
                    return {
                        id: message.key.remoteJid,
                        isGroup: false,
                        sendMessage: async (text, options = {}) => {
                            return await sock.sendMessage(message.key.remoteJid, {
                                text: text,
                                ...options
                            });
                        }
                    };
                }
            },

            // Contact helper methods
            getContact: () => ({
                number: sender.split('@')[0],
                id: { user: sender.split('@')[0] }
            }),

            // Delete message (for hidetag)
            delete: async () => {
                try {
                    await sock.sendMessage(message.key.remoteJid, {
                        delete: message.key
                    });
                } catch (error) {
                    logger.warn('Could not delete message');
                }
            }
        };
    }
}

module.exports = BaileyMessageHandler;