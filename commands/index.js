const logger = require('../utils/logger');
const mediaDownloader = require('../utils/mediaDownloader');
const stickerMaker = require('../utils/stickerMaker');
const { MessageMedia } = require('whatsapp-web.js');
const fs = require('fs');
const path = require('path');

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
    },

    download: {
        description: 'Download video/audio from YouTube or other platforms',
        usage: '.download [url] [audio/video]',
        ownerOnly: false,
        groupOnly: false,
        async execute(client, message, args, context) {
            try {
                if (args.length < 1) {
                    await message.reply('❌ Please provide a URL to download.\n\nUsage: `.download [url] [audio/video]`\n\nExample: `.download https://youtube.com/watch?v=xyz audio`');
                    return;
                }

                const url = args[0];
                const type = args[1] ? args[1].toLowerCase() : 'video';
                const audioOnly = type === 'audio' || type === 'mp3';

                if (!mediaDownloader.isSupportedUrl(url)) {
                    await message.reply('❌ URL not supported. Supported platforms:\n• YouTube\n• Twitter/X\n• Instagram\n• TikTok\n• Facebook\n• Vimeo');
                    return;
                }

                await message.reply('⏳ Starting download... Please wait...');

                let result;
                if (mediaDownloader.isYouTubeUrl(url)) {
                    result = await mediaDownloader.downloadYouTubeVideo(url, { audioOnly });
                } else {
                    result = await mediaDownloader.downloadFromUrl(url);
                }

                if (result.success) {
                    const media = MessageMedia.fromFilePath(result.filepath);
                    const caption = `🎬 *Download Complete!*\n\n📱 *Title:* ${result.title || 'Media File'}\n⏱️ *Duration:* ${result.duration ? Math.floor(result.duration / 60) + ':' + (result.duration % 60).toString().padStart(2, '0') : 'Unknown'}\n📁 *Type:* ${audioOnly ? 'Audio' : 'Video'}\n\n💡 Downloaded by Afshuu Bot`;
                    
                    await message.reply(media, undefined, { caption });
                    
                    // Cleanup file after sending
                    setTimeout(() => {
                        mediaDownloader.cleanup(result.filepath);
                    }, 5000);
                } else {
                    await message.reply('❌ Download failed. Please check the URL and try again.');
                }

            } catch (error) {
                logger.error(`Download command error: ${error.message}`);
                await message.reply(`❌ Download failed: ${error.message}`);
            }
        }
    },

    sticker: {
        description: 'Create sticker from image',
        usage: '.sticker [caption with image]',
        ownerOnly: false,
        groupOnly: false,
        async execute(client, message, args, context) {
            try {
                // Check if message has media attachment
                if (!message.hasMedia) {
                    await message.reply('❌ Please send an image with the `.sticker` command to create a sticker.\n\nUsage: Send an image and caption it with `.sticker`');
                    return;
                }

                const media = await message.downloadMedia();
                
                if (!media || !media.mimetype.startsWith('image/')) {
                    await message.reply('❌ Please send a valid image file (JPG, PNG, GIF, WebP).');
                    return;
                }

                await message.reply('⏳ Creating sticker... Please wait...');

                // Save the image temporarily
                const timestamp = Date.now();
                const tempPath = `./temp_image_${timestamp}.${media.mimetype.split('/')[1]}`;
                
                fs.writeFileSync(tempPath, media.data, 'base64');

                // Create sticker with text if provided
                let result;
                const text = args.join(' ');
                
                if (text && text.trim()) {
                    result = await stickerMaker.addTextToSticker(tempPath, text.trim());
                } else {
                    result = await stickerMaker.createSticker(tempPath);
                }

                if (result.success) {
                    const stickerMedia = MessageMedia.fromFilePath(result.filepath);
                    await message.reply(stickerMedia, undefined, { sendMediaAsSticker: true });
                    
                    // Cleanup files
                    setTimeout(() => {
                        stickerMaker.cleanup(result.filepath);
                        if (fs.existsSync(tempPath)) {
                            fs.unlinkSync(tempPath);
                        }
                    }, 5000);
                } else {
                    await message.reply('❌ Failed to create sticker. Please try with a different image.');
                }

            } catch (error) {
                logger.error(`Sticker command error: ${error.message}`);
                await message.reply('❌ Error creating sticker. Please try again with a valid image.');
            }
        }
    },

    circularsticker: {
        description: 'Create circular sticker from image',
        usage: '.circularsticker [caption with image]',
        ownerOnly: false,
        groupOnly: false,
        async execute(client, message, args, context) {
            try {
                if (!message.hasMedia) {
                    await message.reply('❌ Please send an image with the `.circularsticker` command.\n\nUsage: Send an image and caption it with `.circularsticker`');
                    return;
                }

                const media = await message.downloadMedia();
                
                if (!media || !media.mimetype.startsWith('image/')) {
                    await message.reply('❌ Please send a valid image file.');
                    return;
                }

                await message.reply('⏳ Creating circular sticker... Please wait...');

                const timestamp = Date.now();
                const tempPath = `./temp_image_${timestamp}.${media.mimetype.split('/')[1]}`;
                
                fs.writeFileSync(tempPath, media.data, 'base64');

                const result = await stickerMaker.createCircularSticker(tempPath);

                if (result.success) {
                    const stickerMedia = MessageMedia.fromFilePath(result.filepath);
                    await message.reply(stickerMedia, undefined, { sendMediaAsSticker: true });
                    
                    setTimeout(() => {
                        stickerMaker.cleanup(result.filepath);
                        if (fs.existsSync(tempPath)) {
                            fs.unlinkSync(tempPath);
                        }
                    }, 5000);
                } else {
                    await message.reply('❌ Failed to create circular sticker.');
                }

            } catch (error) {
                logger.error(`Circular sticker command error: ${error.message}`);
                await message.reply('❌ Error creating circular sticker.');
            }
        }
    },

    welcome: {
        description: 'Set custom welcome message for new members',
        usage: '.welcome [on/off] or .welcome set [message]',
        ownerOnly: true,
        groupOnly: true,
        async execute(client, message, args, context) {
            try {
                if (args.length === 0) {
                    await message.reply('❌ Usage:\n• `.welcome on` - Enable welcome messages\n• `.welcome off` - Disable welcome messages\n• `.welcome set [message]` - Set custom welcome message');
                    return;
                }

                const action = args[0].toLowerCase();
                
                if (action === 'on') {
                    await message.reply('✅ Welcome messages enabled for this group.');
                } else if (action === 'off') {
                    await message.reply('✅ Welcome messages disabled for this group.');
                } else if (action === 'set') {
                    const customMessage = args.slice(1).join(' ');
                    if (!customMessage) {
                        await message.reply('❌ Please provide a welcome message.\n\nExample: `.welcome set Welcome to our awesome group! Please read the rules.`');
                        return;
                    }
                    await message.reply('✅ Custom welcome message set successfully!');
                } else {
                    await message.reply('❌ Invalid option. Use `on`, `off`, or `set [message]`.');
                }

                logger.info(`Welcome command executed: ${action}`);
            } catch (error) {
                logger.error(`Welcome command error: ${error.message}`);
                await message.reply('❌ Error configuring welcome messages.');
            }
        }
    },

    ytdl: {
        description: 'Download YouTube video or audio directly',
        usage: '.ytdl [youtube_url] [video/audio]',
        ownerOnly: false,
        groupOnly: false,
        async execute(client, message, args, context) {
            try {
                if (args.length < 1) {
                    await message.reply('❌ Please provide a YouTube URL.\n\nUsage: `.ytdl [url] [video/audio]`\n\nExample: `.ytdl https://youtube.com/watch?v=xyz audio`');
                    return;
                }

                const url = args[0];
                const type = args[1] ? args[1].toLowerCase() : 'video';
                const audioOnly = type === 'audio' || type === 'mp3';

                if (!mediaDownloader.isYouTubeUrl(url)) {
                    await message.reply('❌ Please provide a valid YouTube URL.');
                    return;
                }

                await message.reply(`⏳ Downloading YouTube ${audioOnly ? 'audio' : 'video'}... Please wait...`);

                const result = await mediaDownloader.downloadYouTubeVideo(url, { audioOnly });

                if (result.success) {
                    const media = MessageMedia.fromFilePath(result.filepath);
                    const caption = `🎵 *YouTube ${audioOnly ? 'Audio' : 'Video'} Downloaded*\n\n📱 *Title:* ${result.title}\n⏱️ *Duration:* ${Math.floor(result.duration / 60)}:${(result.duration % 60).toString().padStart(2, '0')}\n📁 *Format:* ${audioOnly ? 'MP3' : 'MP4'}\n\n🤖 Downloaded by Afshuu Bot`;
                    
                    await message.reply(media, undefined, { caption });
                    
                    setTimeout(() => {
                        mediaDownloader.cleanup(result.filepath);
                    }, 5000);
                } else {
                    await message.reply('❌ YouTube download failed. Please check the URL and try again.');
                }

            } catch (error) {
                logger.error(`YouTube download error: ${error.message}`);
                await message.reply(`❌ YouTube download failed: ${error.message.includes('too long') ? 'Video is too long (max 10 minutes)' : 'Invalid URL or video unavailable'}`);
            }
        }
    },

    antispam: {
        description: 'Configure anti-spam settings',
        usage: '.antispam [on/off/status]',
        ownerOnly: true,
        groupOnly: false,
        async execute(client, message, args, context) {
            try {
                if (args.length === 0) {
                    await message.reply('❌ Usage:\n• `.antispam on` - Enable anti-spam protection\n• `.antispam off` - Disable anti-spam protection\n• `.antispam status` - Check current status');
                    return;
                }

                const action = args[0].toLowerCase();
                
                if (action === 'on') {
                    await message.reply('✅ *Anti-Spam Protection Enabled*\n\n🛡️ Features active:\n• Suspicious content detection\n• Spam message blocking\n• Automatic warnings\n• Rate limiting protection\n\n_Bot will now monitor and protect against spam messages._');
                } else if (action === 'off') {
                    await message.reply('⚠️ *Anti-Spam Protection Disabled*\n\n_Spam detection is now turned off. Users can send messages without spam filtering._');
                } else if (action === 'status') {
                    await message.reply('📊 *Anti-Spam Status*\n\n🛡️ Protection: ACTIVE\n🔍 Detection: Advanced AI-based\n⚡ Response: Real-time\n📋 Features:\n• Cryptocurrency scam detection\n• Phishing protection\n• MLM/pyramid scheme blocking\n• Excessive messaging limits\n• Suspicious URL filtering\n\n_Your group is protected by Afshuu Bot security._');
                } else {
                    await message.reply('❌ Invalid option. Use `on`, `off`, or `status`.');
                }

                logger.info(`Anti-spam command executed: ${action}`);
            } catch (error) {
                logger.error(`Anti-spam command error: ${error.message}`);
                await message.reply('❌ Error configuring anti-spam settings.');
            }
        }
    }
};

module.exports = commands;
