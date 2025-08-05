const commands = require('../commands');
const logger = require('../utils/logger');
const config = require('../config/settings');

class MessageHandler {
    constructor() {
        this.commandPrefix = '.';
        this.cooldowns = new Map();
    }

    async handleMessage(client, message) {
        try {
            // Skip if message is empty or not a command
            if (!message.body || !message.body.startsWith(this.commandPrefix)) {
                return;
            }

            // Parse command and arguments
            const args = message.body.slice(this.commandPrefix.length).trim().split(/\s+/);
            const commandName = args.shift().toLowerCase();

            // Check if command exists
            if (!commands[commandName]) {
                return;
            }

            // Get chat and sender info
            const chat = await message.getChat();
            const contact = await message.getContact();
            
            // Log command usage
            logger.info(`Command "${commandName}" used by ${contact.number || contact.id.user} in ${chat.isGroup ? 'group' : 'private'} chat`);

            // Check cooldown
            if (this.isOnCooldown(contact.id.user, commandName)) {
                await message.reply('⏱️ Please wait before using this command again.');
                return;
            }

            // Check if user is authorized (if command requires it)
            const command = commands[commandName];
            if (command.ownerOnly && !this.isOwner(contact.number || contact.id.user)) {
                await message.reply('❌ This command is only available to the bot owner.');
                return;
            }

            // Check if command requires group
            if (command.groupOnly && !chat.isGroup) {
                await message.reply('❌ This command can only be used in groups.');
                return;
            }

            // Execute command
            try {
                await command.execute(client, message, args, {
                    chat,
                    contact,
                    isGroup: chat.isGroup,
                    isOwner: this.isOwner(contact.number || contact.id.user)
                });

                // Set cooldown
                this.setCooldown(contact.id.user, commandName);

            } catch (commandError) {
                logger.error(`Error executing command "${commandName}": ${commandError.message}`);
                await message.reply('❌ An error occurred while executing the command. Please try again later.');
            }

        } catch (error) {
            logger.error(`Error in message handler: ${error.message}`);
            console.error('Message handler error:', error);
        }
    }

    isOwner(userNumber) {
        if (!config.OWNER_NUMBER) return false;
        return userNumber === config.OWNER_NUMBER || userNumber === config.OWNER_NUMBER.replace(/\+/g, '');
    }

    isOnCooldown(userId, commandName) {
        const cooldownKey = `${userId}-${commandName}`;
        const cooldownEnd = this.cooldowns.get(cooldownKey);
        
        if (cooldownEnd && Date.now() < cooldownEnd) {
            return true;
        }
        
        return false;
    }

    setCooldown(userId, commandName, duration = 3000) { // 3 seconds default
        const cooldownKey = `${userId}-${commandName}`;
        this.cooldowns.set(cooldownKey, Date.now() + duration);
        
        // Clean up expired cooldowns
        setTimeout(() => {
            this.cooldowns.delete(cooldownKey);
        }, duration);
    }
}

module.exports = new MessageHandler();
