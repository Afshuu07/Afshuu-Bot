const logger = require('../utils/logger');

const commands = {
    alive: {
        description: 'Check if the bot is alive and responsive',
        usage: '.alive',
        ownerOnly: false,
        groupOnly: false,
        async execute(client, message, args, context) {
            const uptime = process.uptime();
            const hours = Math.floor(uptime / 3600);
            const minutes = Math.floor((uptime % 3600) / 60);
            const seconds = Math.floor(uptime % 60);
            
            const uptimeString = `${hours}h ${minutes}m ${seconds}s`;
            
            const aliveMessage = `🤖 *Afshuu Bot Status*

✅ *Status:* Online & Active
⏰ *Uptime:* ${uptimeString}
🚀 *Version:* 1.0.0
📱 *Platform:* WhatsApp Web
🔋 *Performance:* Optimal

_Bot is running smoothly and ready to serve!_`;

            await message.reply(aliveMessage);
            logger.info('Alive command executed successfully');
        }
    },

    menu: {
        description: 'Display all available bot commands',
        usage: '.menu',
        ownerOnly: false,
        groupOnly: false,
        async execute(client, message, args, context) {
            let menuMessage = `🤖 *Afshuu Bot - Command Menu*\n\n`;
            menuMessage += `📋 *Available Commands:*\n\n`;

            Object.entries(commands).forEach(([name, cmd]) => {
                const prefix = cmd.ownerOnly ? '👑 ' : cmd.groupOnly ? '👥 ' : '📌 ';
                menuMessage += `${prefix}*.${name}*\n`;
                menuMessage += `   _${cmd.description}_\n`;
                menuMessage += `   Usage: \`${cmd.usage}\`\n\n`;
            });

            menuMessage += `\n📝 *Legend:*\n`;
            menuMessage += `👑 = Owner Only\n`;
            menuMessage += `👥 = Group Only\n`;
            menuMessage += `📌 = Available to All\n\n`;
            menuMessage += `🔧 *Bot Info:*\n`;
            menuMessage += `• Created by: Afshuu Team\n`;
            menuMessage += `• Version: 1.0.0\n`;
            menuMessage += `• Platform: WhatsApp Web\n\n`;
            menuMessage += `_Need help? Contact the bot owner!_`;

            await message.reply(menuMessage);
            logger.info('Menu command executed successfully');
        }
    },

    tagall: {
        description: 'Tag all members in the group',
        usage: '.tagall [message]',
        ownerOnly: false,
        groupOnly: true,
        async execute(client, message, args, context) {
            const { chat, contact } = context;
            
            if (!chat.isGroup) {
                await message.reply('❌ This command can only be used in groups.');
                return;
            }

            try {
                // Get group participants
                const participants = chat.participants || [];
                
                if (participants.length === 0) {
                    await message.reply('❌ No participants found in this group.');
                    return;
                }

                // Create custom message if provided
                const customMessage = args.join(' ');
                let tagMessage = customMessage ? `📢 *${customMessage}*\n\n` : '📢 *Group Announcement*\n\n';
                
                // Add all participants as mentions
                const mentions = [];
                let mentionText = '';
                
                participants.forEach((participant, index) => {
                    mentions.push(participant.id._serialized);
                    mentionText += `@${participant.id.user} `;
                    
                    // Add line break every 5 mentions for better formatting
                    if ((index + 1) % 5 === 0) {
                        mentionText += '\n';
                    }
                });

                tagMessage += mentionText;
                tagMessage += `\n\n👥 *Total Members:* ${participants.length}`;
                tagMessage += `\n🔔 *Tagged by:* @${contact.id.user}`;

                // Send message with mentions
                await chat.sendMessage(tagMessage, {
                    mentions: [...mentions, contact.id._serialized]
                });

                logger.info(`Tagall command executed in group ${chat.name} by ${contact.number || contact.id.user}`);

            } catch (error) {
                logger.error(`Error in tagall command: ${error.message}`);
                await message.reply('❌ Failed to tag all members. Please try again.');
            }
        }
    },

    info: {
        description: 'Get information about the bot',
        usage: '.info',
        ownerOnly: false,
        groupOnly: false,
        async execute(client, message, args, context) {
            const { chat } = context;
            
            const infoMessage = `🤖 *Afshuu Bot Information*

📱 *Name:* Afshuu
🎯 *Purpose:* Professional WhatsApp Bot
⚡ *Features:* Group Management, Utilities, Auto-responses
🔧 *Technology:* Node.js + WhatsApp Web API
📊 *Version:* 1.0.0
🌐 *Status:* Active 24/7

🚀 *Capabilities:*
• Group member management
• Automated responses
• Command processing
• Real-time monitoring
• Continuous operation

💡 *Quick Commands:*
• Type \`.menu\` for all commands
• Type \`.alive\` to check status
• Type \`.tagall\` to mention everyone (groups only)

_Developed with ❤️ for seamless WhatsApp automation_`;

            await message.reply(infoMessage);
            logger.info('Info command executed successfully');
        }
    },

    ping: {
        description: 'Check bot response time',
        usage: '.ping',
        ownerOnly: false,
        groupOnly: false,
        async execute(client, message, args, context) {
            const startTime = Date.now();
            const pingMessage = await message.reply('🏓 Pong!');
            const endTime = Date.now();
            const responseTime = endTime - startTime;
            
            const detailedPing = `🏓 *Pong!*

⚡ *Response Time:* ${responseTime}ms
📊 *Status:* ${responseTime < 1000 ? 'Excellent' : responseTime < 3000 ? 'Good' : 'Slow'}
🕐 *Timestamp:* ${new Date().toLocaleString()}

${responseTime < 1000 ? '🟢 Lightning fast!' : responseTime < 3000 ? '🟡 Running smoothly' : '🔴 Performance may be affected'}`;

            // Edit the ping message with detailed info
            setTimeout(async () => {
                try {
                    await pingMessage.edit(detailedPing);
                } catch (error) {
                    // If edit fails, send a new message
                    await message.reply(detailedPing);
                }
            }, 100);

            logger.info(`Ping command executed - Response time: ${responseTime}ms`);
        }
    }
};

module.exports = commands;
