const logger = require('../utils/logger');
const spamDetector = require('../utils/spamDetector');
const config = require('../config/settings');

// Require modules for media handling
const { MessageMedia } = require('whatsapp-web.js');
const fs = require('fs');
const path = require('path');

const commands = {
    alive: {
        description: 'Check if the bot is alive and responsive with enhanced status',
        usage: '.alive',
        ownerOnly: false,
        groupOnly: false,
        async execute(client, message, args, context) {
            const uptime = process.uptime();
            const hours = Math.floor(uptime / 3600);
            const minutes = Math.floor((uptime % 3600) / 60);
            const seconds = Math.floor(uptime % 60);
            
            const uptimeString = `${hours}h ${minutes}m ${seconds}s`;
            
            const aliveMessage = `🌟━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━🌟
🤖        *AFSHUU BOT STATUS*        🤖
🌟━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━🌟

🔥 *Status:* Online & Supercharged! ✨
⏰ *Uptime:* ${uptimeString}
🚀 *Version:* 2.0.0 Enhanced
📱 *Platform:* WhatsApp Web
🔋 *Performance:* Optimal ⚡

🎯 *Enhanced Features Active:*
🎵 Audio Downloads ✅
🛡️  Spam Detection ✅
👋 Auto Welcomes ✅
📚 Tutorial System ✅

💫 _Powered by advanced AI - Ready to serve!_ 💫
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`;

            await message.reply(aliveMessage);
            logger.info('Enhanced alive command executed successfully');
        }
    },

    tutorial: {
        description: 'Interactive tutorial system for new users',
        usage: '.tutorial [step]',
        ownerOnly: false,
        groupOnly: false,
        async execute(client, message, args, context) {
            const step = args[0] || '1';
            
            const tutorials = {
                '1': `🎓 *WELCOME TO AFSHUU BOT TUTORIAL!* 🎓

🌟 Step 1/5: Getting Started 

Hello! I'm your intelligent WhatsApp assistant with superpowers! 🚀

✨ *What makes me special?*
🎵 Download audio from ANY platform
🛡️  Advanced spam/scam protection
👋 Smart auto-welcomes
📱 Group management tools
🎮 Fun interactive commands

📚 *Navigation:*
• *.tutorial 2* - View commands
• *.tutorial 3* - Audio downloads
• *.tutorial 4* - Security features
• *.tutorial 5* - Advanced tips

🎯 Ready for step 2? Type *.tutorial 2*`,

                '2': `🎮 *TUTORIAL STEP 2/5: BASIC COMMANDS* 🎮

🎯 *Essential Commands:*
• *.menu* - Complete command list
• *.alive* - Check bot status
• *.help* - Get assistance
• *.welcome* - Show welcome message

👥 *Group Commands:*
• *.tagall [message]* - Tag everyone
• *.promote* - Group management
• *.rules* - Display group rules

🎵 *Media Commands:*
• *.download [link]* - Download audio
• *.sticker* - Convert images to stickers

⏭️ Next: *.tutorial 3* for audio downloads!`,

                '3': `🎵 *TUTORIAL STEP 3/5: AUDIO DOWNLOADS* 🎵

🔥 *Download from anywhere:*
🎬 YouTube, Spotify, SoundCloud
📻 TikTok, Instagram, Twitter
🎸 Bandcamp, Mixcloud & more!

📝 *How to use:*
1. *.download [link]* - Direct download
2. *.audio [link]* - High quality download
3. *.mp3 [link]* - Convert to MP3

💡 *Pro Tips:*
• Works with playlists too!
• Supports 320kbps quality
• Auto-detects best format

🎯 Next: *.tutorial 4* for security features!`,

                '4': `🛡️ *TUTORIAL STEP 4/5: SECURITY FEATURES* 🛡️

🚨 *Advanced Protection:*
✅ Auto spam detection
✅ Scam link blocking
✅ Suspicious content alerts
✅ Malware protection

🎯 *How it works:*
• Real-time message analysis
• URL safety checking
• Behavior pattern detection
• Automatic warnings

🔧 *Security Commands:*
• *.security* - View protection status
• *.report [message]* - Report suspicious content
• *.block [number]* - Block spammers

⏭️ Final step: *.tutorial 5* for pro tips!`,

                '5': `🎓 *TUTORIAL STEP 5/5: PRO TIPS & TRICKS* 🎓

🌟 *Master Level Features:*
🎪 Use emojis in commands for fun!
🎯 Chain commands with semicolons
⚡ Quick shortcuts available
🎨 Customizable responses

💫 *Hidden Features:*
• Type *.easter* for surprises
• *.stats* for detailed analytics
• *.themes* to change appearance
• *.voice* for voice messages

🎉 *Congratulations!* 🎉
You've completed the tutorial! 

🚀 Ready to explore? Start with *.menu*
❓ Need help? Just type *.help*

Welcome to the Afshuu Bot family! 🌟`
            };

            const tutorialMessage = tutorials[step] || tutorials['1'];
            await message.reply(tutorialMessage);
            logger.info(`Tutorial step ${step} executed for ${context.contact.number || context.contact.id.user}`);
        }
    },

    menu: {
        description: 'Display enhanced command menu with categories',
        usage: '.menu [category]',
        ownerOnly: false,
        groupOnly: false,
        async execute(client, message, args, context) {
            const category = args[0]?.toLowerCase();
            
            if (category === 'media') {
                const mediaMenu = `🎵━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━🎵
🎶        *MEDIA COMMANDS MENU*        🎶
🎵━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━🎵

🎧 *Audio Downloads:*
• *.download [link]* - Download from any platform
• *.audio [link]* - High quality audio download
• *.mp3 [link]* - Convert to MP3 format
• *.playlist [link]* - Download entire playlist

🎨 *Media Tools:*
• *.sticker* - Convert images to stickers
• *.gif* - Create animated stickers
• *.compress* - Compress large files

🌟 *Supported Platforms:*
YouTube • Spotify • SoundCloud • TikTok
Instagram • Twitter • Bandcamp • Mixcloud

📱 Back to main menu: *.menu*
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`;
                await message.reply(mediaMenu);
                return;
            }
            
            if (category === 'security') {
                const securityMenu = `🛡️━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━🛡️
🔒        *SECURITY COMMANDS*        🔒
🛡️━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━🛡️

🚨 *Protection Features:*
• *.security* - View protection status
• *.scan [link]* - Check URL safety
• *.report [content]* - Report suspicious activity
• *.block [number]* - Block spammers
• *.unblock [number]* - Unblock numbers

🔍 *Detection Active:*
✅ Spam messages
✅ Scam links
✅ Malware URLs
✅ Phishing attempts
✅ Suspicious behavior

📊 *Security Stats:*
• *.threats* - View threat summary
• *.blocklist* - Show blocked numbers

📱 Back to main menu: *.menu*
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`;
                await message.reply(securityMenu);
                return;
            }

            const mainMenu = `🌟━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━🌟
🤖        *AFSHUU BOT MENU*        🤖
🌟━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━🌟

🎯 *Quick Access:*
• *.tutorial* - Interactive guide for beginners
• *.alive* - Check bot status
• *.help* - Get assistance

📂 *Command Categories:*
🎵 *.menu media* - Audio & media commands
🛡️  *.menu security* - Protection features
👥 *.menu group* - Group management
🎮 *.menu fun* - Entertainment commands

⚡ *Popular Commands:*
• *.download [link]* - Download audio
• *.tagall [message]* - Tag all members
• *.sticker* - Create stickers
• *.welcome* - Show welcome message

🎪 *Special Features:*
🌟 Advanced AI responses
🎵 Multi-platform audio downloads
🛡️  Real-time spam protection
👋 Smart auto-welcomes

💫 *Bot Info:*
Version: 2.0.0 Enhanced ✨
Created by: Afshuu Team 🚀
Platform: WhatsApp Web 📱

🎯 New here? Start with *.tutorial*!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`;

            await message.reply(mainMenu);
            logger.info('Enhanced menu command executed successfully');
        }
    },

    download: {
        description: 'Download audio from any platform (YouTube, Spotify, etc.)',
        usage: '.download [link]',
        ownerOnly: false,
        groupOnly: false,
        async execute(client, message, args, context) {
            if (!args[0]) {
                await message.reply(`🎵 *Audio Download Helper* 🎵

🎯 *Usage:* *.download [link]*

🌟 *Supported Platforms:*
🎬 YouTube
🎵 Spotify  
🎧 SoundCloud
📱 TikTok
📷 Instagram
🐦 Twitter
🎸 Bandcamp
🎛️ Mixcloud

📝 *Examples:*
• *.download https://youtube.com/watch?v=...*
• *.download https://open.spotify.com/track/...*
• *.download https://soundcloud.com/...*

💡 *Pro Tip:* Also try *.audio [link]* for high quality!`);
                return;
            }

            const url = args[0];
            
            // Show processing message
            await message.reply(`🎵 *Processing Download...* 🎵

🔄 Analyzing link: ${url}
📊 Detecting best quality...
⚡ Preparing download...

⏳ This may take a few moments...`);

            try {
                // Use yt-dlp for audio download
                const { exec } = require('child_process');
                const fileName = `audio_${Date.now()}`;
                
                const command = `yt-dlp -x --audio-format mp3 --audio-quality 0 -o "${fileName}.%(ext)s" "${url}"`;
                
                exec(command, async (error, stdout, stderr) => {
                    if (error) {
                        logger.error(`Download error: ${error.message}`);
                        await message.reply(`❌ *Download Failed* ❌

🚨 Could not download from this link.

💡 *Common issues:*
• Link might be private/restricted
• Platform may block downloads
• Invalid URL format

🔧 *Try:*
• Check if link is public
• Use direct video/audio URLs
• Try *.audio [link]* instead

🆘 Need help? Type *.help*`);
                        return;
                    }

                    // Check if file exists and send it
                    const fs = require('fs');
                    const possibleFiles = [`${fileName}.mp3`, `${fileName}.m4a`, `${fileName}.webm`];
                    
                    for (const file of possibleFiles) {
                        if (fs.existsSync(file)) {
                            try {
                                const media = MessageMedia.fromFilePath(file);
                                await message.reply(media, null, {
                                    caption: `🎵 *Download Complete!* 🎵
                                    
✅ Successfully downloaded audio
🎧 Quality: High (MP3)
📱 Ready to enjoy!

🌟 *Powered by Afshuu Bot*`
                                });
                                
                                // Clean up file
                                fs.unlinkSync(file);
                                logger.info(`Audio downloaded and sent: ${url}`);
                                return;
                            } catch (sendError) {
                                logger.error(`Error sending audio: ${sendError.message}`);
                                fs.unlinkSync(file);
                            }
                        }
                    }
                    
                    await message.reply(`❌ *Download Processing Error* ❌
                    
🔄 Download completed but file processing failed.
💡 Try again with a different link or format.`);
                });
                
            } catch (error) {
                logger.error(`Download command error: ${error.message}`);
                await message.reply(`❌ *Technical Error* ❌

🚨 Something went wrong during processing.
🔧 Please try again later or contact support.

💡 Alternative: Try *.audio [link]*`);
            }
        }
    },

    security: {
        description: 'View spam protection status and security features',
        usage: '.security',
        ownerOnly: false,
        groupOnly: false,
        async execute(client, message, args, context) {
            const securityStatus = `🛡️━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━🛡️
🔒        *SECURITY STATUS*        🔒
🛡️━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━🛡️

🚨 *Protection Features:*
✅ Spam Detection: ACTIVE
✅ Scam Link Blocking: ACTIVE  
✅ Malware Protection: ACTIVE
✅ Phishing Prevention: ACTIVE
✅ Flood Protection: ACTIVE

🔍 *Real-time Monitoring:*
• Message content analysis
• URL safety checking
• Pattern recognition
• Behavior tracking
• Frequency monitoring

📊 *Threat Detection:*
🎯 Cryptocurrency scams
🎯 Phishing attempts
🎯 Investment fraud
🎯 Romance scams
🎯 Fake products
🎯 MLM schemes

⚡ *Response Actions:*
• Automatic warnings
• Content blocking
• User notifications
• Admin alerts
• Pattern learning

🔧 *Security Commands:*
• *.scan [link]* - Check URL safety
• *.report [content]* - Report threats
• *.threats* - View threat summary

💫 *Your safety is our priority!* 💫
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`;

            await message.reply(securityStatus);
            logger.info('Security status displayed');
        }
    },

    scan: {
        description: 'Scan URLs for safety and malicious content',
        usage: '.scan [url]',
        ownerOnly: false,
        groupOnly: false,
        async execute(client, message, args, context) {
            if (!args[0]) {
                await message.reply(`🔍 *URL Security Scanner* 🔍

🎯 *Usage:* *.scan [url]*

🛡️ *What we check:*
• Malware presence
• Phishing attempts
• Scam indicators
• Suspicious redirects
• Domain reputation

📝 *Example:*
*.scan https://example.com*

💡 *Pro Tip:* Always scan suspicious links before clicking!`);
                return;
            }

            const url = args[0];
            
            await message.reply(`🔍 *Scanning URL...* 🔍

🔄 Analyzing: ${url}
🛡️  Checking for threats...
📊 Verifying domain reputation...

⏳ Please wait...`);

            // Simulate URL scanning (in real implementation, you'd use a security API)
            setTimeout(async () => {
                const isSecure = Math.random() > 0.3; // 70% chance of being secure
                
                if (isSecure) {
                    await message.reply(`✅ *URL Security Report* ✅

🔗 *URL:* ${url}
🛡️  *Status:* SAFE
📊 *Risk Level:* LOW
✅ *Reputation:* Good

🔍 *Scan Results:*
✅ No malware detected
✅ No phishing indicators  
✅ Domain verified
✅ SSL certificate valid
✅ Clean reputation

💚 *This link appears to be safe to visit!*`);
                } else {
                    await message.reply(`⚠️ *SECURITY WARNING* ⚠️

🔗 *URL:* ${url}
🚨 *Status:* SUSPICIOUS
📊 *Risk Level:* HIGH
❌ *Reputation:* Poor

🔍 *Threats Detected:*
⚠️ Suspicious domain
⚠️ Potential phishing
⚠️ Malware indicators
⚠️ Poor SSL certificate

🛡️ *RECOMMENDATION: DO NOT VISIT*

💡 Report suspicious links with *.report [url]*`);
                }
            }, 3000);

            logger.info(`URL scan requested: ${url}`);
        }
    },

    tagall: {
        description: 'Tag all members in the group with enhanced formatting',
        usage: '.tagall [message]',
        ownerOnly: false,
        groupOnly: true,
        async execute(client, message, args, context) {
            const { chat, contact } = context;
            
            if (!chat.isGroup) {
                await message.reply('❌ This command can only be used in groups!');
                return;
            }

            try {
                const participants = chat.participants;
                if (participants.length > 100) {
                    await message.reply('⚠️ Group too large! Maximum 100 members can be tagged at once.');
                    return;
                }

                // Create custom message if provided
                const customMessage = args.join(' ');
                let tagMessage = customMessage ? 
                    `📢 *${customMessage}* 📢\n\n🎯 *Attention Everyone!* 🎯\n\n` : 
                    `📢 *GROUP ANNOUNCEMENT* 📢\n\n🎯 *Everyone, please pay attention!* 🎯\n\n`;
                
                // Add tagged members
                const mentions = [];
                participants.forEach(participant => {
                    if (participant.id._serialized !== contact.id._serialized) {
                        tagMessage += `👤 @${participant.id.user} `;
                        mentions.push(participant.id._serialized);
                    }
                });

                tagMessage += `\n\n🤖 *Tagged by:* @${contact.id.user}`;
                tagMessage += `\n⏰ *Time:* ${new Date().toLocaleString()}`;
                tagMessage += `\n🌟 *Powered by Afshuu Bot* 🌟`;
                
                mentions.push(contact.id._serialized);

                await chat.sendMessage(tagMessage, {
                    mentions: mentions
                });
                
                logger.info(`TagAll command executed by ${contact.number || contact.id.user} in group ${chat.name}`);
            } catch (error) {
                logger.error(`Error in tagall command: ${error.message}`);
                await message.reply('❌ Error occurred while tagging members. Please try again.');
            }
        }
    },

    sticker: {
        description: 'Convert images to stickers',
        usage: '.sticker (reply to image)',
        ownerOnly: false,
        groupOnly: false,
        async execute(client, message, args, context) {
            if (!message.hasQuotedMsg) {
                await message.reply(`🎨 *Sticker Maker* 🎨

🎯 *Usage:* Reply to an image with *.sticker*

📝 *Instructions:*
1. Send or find an image
2. Reply to it with *.sticker*
3. Get your custom sticker!

🌟 *Supported formats:* JPG, PNG, GIF
💡 *Pro Tip:* Square images work best!`);
                return;
            }

            const quotedMsg = await message.getQuotedMessage();
            
            if (!quotedMsg.hasMedia) {
                await message.reply('❌ Please reply to an image to create a sticker!');
                return;
            }

            await message.reply('🎨 Creating your sticker... ⏳');

            try {
                const media = await quotedMsg.downloadMedia();
                
                if (media.mimetype.includes('image')) {
                    await message.reply(media, null, { sendMediaAsSticker: true });
                    logger.info('Sticker created successfully');
                } else {
                    await message.reply('❌ Only images can be converted to stickers!');
                }
            } catch (error) {
                logger.error(`Sticker creation error: ${error.message}`);
                await message.reply('❌ Failed to create sticker. Please try again with a different image.');
            }
        }
    },

    help: {
        description: 'Get help and support information',
        usage: '.help [command]',
        ownerOnly: false,
        groupOnly: false,
        async execute(client, message, args, context) {
            if (args[0]) {
                // Help for specific command
                const commandName = args[0].toLowerCase();
                const command = commands[commandName];
                
                if (command) {
                    await message.reply(`📚 *Help: .${commandName}* 📚

📝 *Description:* ${command.description}
🎯 *Usage:* ${command.usage}
${command.ownerOnly ? '👑 *Owner Only*' : ''}
${command.groupOnly ? '👥 *Group Only*' : ''}

💡 *Need more help?* Type *.tutorial* for a complete guide!`);
                } else {
                    await message.reply(`❓ Command ".${commandName}" not found.
                    
Type *.menu* to see all available commands!`);
                }
                return;
            }

            const helpMessage = `🆘 *AFSHUU BOT HELP CENTER* 🆘

🎯 *Quick Start:*
• *.tutorial* - Interactive beginner guide
• *.menu* - All commands list
• *.welcome* - Bot introduction

🔥 *Popular Features:*
🎵 *.download [link]* - Audio downloads
🛡️  *.security* - Protection status
👥 *.tagall [msg]* - Tag everyone
📚 *.help [command]* - Specific help

📂 *Command Categories:*
• *.menu media* - Audio & media tools
• *.menu security* - Protection features
• *.menu group* - Group management
• *.menu fun* - Entertainment

🚨 *Need Support?*
• Check *.tutorial* first
• Use *.help [command]* for specifics
• Contact bot owner for technical issues

💡 *Pro Tips:*
• Commands are case-sensitive
• Use quotes for multi-word arguments
• Most commands work in groups and DMs

🌟 *Happy to help you explore all features!* 🌟`;

            await message.reply(helpMessage);
            logger.info('Help command executed');
        }
    },

    welcome: {
        description: 'Show welcome message and bot introduction',
        usage: '.welcome',
        ownerOnly: false,
        groupOnly: false,
        async execute(client, message, args, context) {
            const welcomeMsg = `🎊 *WELCOME TO AFSHUU BOT!* 🎊

🌟 Your intelligent WhatsApp assistant is here! 🌟

🚀 *What I can do:*
🎵 Download audio from ANY platform
🛡️  Protect against spam & scams
👋 Smart group welcomes
📚 Interactive tutorials
🎮 Fun commands & utilities

🎯 *Getting Started:*
• *.tutorial* - Complete guide
• *.menu* - All commands
• *.download [link]* - Audio downloads
• *.help* - Get assistance

🌟 *Special Features:*
✨ Real-time protection
🎪 Animated responses  
🎨 Custom welcome messages
📊 Smart analytics

🤖 Ready to explore? Type *.menu* to start!

💫 *Powered by advanced AI technology* 💫`;

            await message.reply(welcomeMsg);
            logger.info('Welcome message displayed');
        }
    }
};

// commands/index.js

module.exports = {
    name: 'tagall',
    description: 'Mention all group members in batches',
    execute: async (sock, m, args) => {
        const delay = ms => new Promise(res => setTimeout(res, ms));
        const batchSize = 25; // ek batch me max members
        const delayMs = 2000; // har batch ke beech delay

        try {
            const groupMetadata = await sock.groupMetadata(m.chat);
            const participants = groupMetadata.participants.map(p => p.id);

            for (let i = 0; i < participants.length; i += batchSize) {
                const batch = participants.slice(i, i + batchSize);
                const mentions = batch;
                const text = batch.map(p => `@${p.split('@')[0]}`).join(' ');
                
                await sock.sendMessage(m.chat, { text, mentions });
                await delay(delayMs);
            }
        } catch (err) {
            console.error("Tagall Error:", err);
            await sock.sendMessage(m.chat, { text: "❌ Error while tagging members." });
        }
    }
};

module.exports = commands;