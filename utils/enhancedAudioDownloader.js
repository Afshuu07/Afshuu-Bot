const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const logger = require('./logger');

class EnhancedAudioDownloader {
    constructor() {
        this.downloadPath = path.join(__dirname, '../temp');
        this.maxFileSize = 16 * 1024 * 1024; // 16MB limit for WhatsApp audio
        
        // Create temp directory if it doesn't exist
        if (!fs.existsSync(this.downloadPath)) {
            fs.mkdirSync(this.downloadPath, { recursive: true });
        }

        // Platform-specific settings for optimal audio extraction
        this.platformSettings = {
            'youtube.com': { 
                format: 'bestaudio[ext=m4a]/bestaudio/best', 
                quality: '0', // Best quality
                extractAudio: true 
            },
            'youtu.be': { 
                format: 'bestaudio[ext=m4a]/bestaudio/best', 
                quality: '0',
                extractAudio: true 
            },
            'soundcloud.com': { 
                format: 'bestaudio/best', 
                quality: '0',
                extractAudio: true 
            },
            'tiktok.com': { 
                format: 'bestaudio/best', 
                quality: '0',
                extractAudio: true 
            },
            'instagram.com': { 
                format: 'bestaudio/best', 
                quality: '0',
                extractAudio: true 
            },
            'twitter.com': { 
                format: 'bestaudio/best', 
                quality: '0',
                extractAudio: true 
            },
            'x.com': { 
                format: 'bestaudio/best', 
                quality: '0',
                extractAudio: true 
            },
            'facebook.com': { 
                format: 'bestaudio/best', 
                quality: '0',
                extractAudio: true 
            },
            'twitch.tv': { 
                format: 'bestaudio/best', 
                quality: '0',
                extractAudio: true 
            },
            'bandcamp.com': { 
                format: 'bestaudio/best', 
                quality: '0',
                extractAudio: true 
            },
            'mixcloud.com': { 
                format: 'bestaudio/best', 
                quality: '0',
                extractAudio: true 
            }
        };

        // DRM protected platforms that cannot be downloaded
        this.drmPlatforms = [
            'spotify.com',
            'music.apple.com',
            'tidal.com',
            'deezer.com',
            'amazon.com/music',
            'pandora.com'
        ];
    }

    async downloadHighQualityAudio(url, options = {}) {
        return new Promise((resolve, reject) => {
            // Check for DRM protection
            if (this.isDRMProtected(url)) {
                reject(new Error('DRM_PROTECTED'));
                return;
            }

            const outputFilename = `audio_${Date.now()}`;
            const outputPath = path.join(this.downloadPath, outputFilename);
            
            // Detect platform and get optimal settings
            const platform = this.detectPlatform(url);
            const settings = this.platformSettings[platform] || { 
                format: 'bestaudio/best', 
                quality: '0',
                extractAudio: true 
            };

            const ytDlpArgs = [
                '--extract-audio',
                '--audio-format', 'mp3',
                '--audio-quality', settings.quality,
                '--format', settings.format,
                '--output', `${outputPath}.%(ext)s`,
                '--no-warnings',
                '--no-playlist',
                '--no-check-certificate',
                '--user-agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                '--referer', url,
                ...this.getPlatformSpecificArgs(platform),
                url
            ];

            logger.info(`Downloading audio from ${platform}: ${ytDlpArgs.join(' ')}`);

            const ytDlp = spawn('yt-dlp', ytDlpArgs);
            let stdout = '';
            let stderr = '';

            ytDlp.stdout.on('data', (data) => {
                stdout += data.toString();
            });

            ytDlp.stderr.on('data', (data) => {
                stderr += data.toString();
            });

            ytDlp.on('close', (code) => {
                if (code === 0) {
                    // Find the downloaded audio file
                    const files = fs.readdirSync(this.downloadPath).filter(file => 
                        file.startsWith(`audio_${outputFilename.split('_')[1]}`)
                    );
                    
                    if (files.length > 0) {
                        const audioFile = files.find(file => 
                            file.endsWith('.mp3') || file.endsWith('.m4a') || 
                            file.endsWith('.ogg') || file.endsWith('.webm')
                        );
                        
                        if (audioFile) {
                            const filePath = path.join(this.downloadPath, audioFile);
                            const fileSize = fs.statSync(filePath).size;
                            
                            if (fileSize > this.maxFileSize) {
                                // Compress audio if too large
                                this.compressAudio(filePath)
                                    .then(resolve)
                                    .catch(reject);
                            } else {
                                resolve({
                                    path: filePath,
                                    size: fileSize,
                                    filename: audioFile,
                                    platform: platform,
                                    quality: 'high'
                                });
                            }
                        } else {
                            reject(new Error('Audio file not found after download'));
                        }
                    } else {
                        reject(new Error('No audio files downloaded'));
                    }
                } else {
                    logger.error(`yt-dlp failed with code ${code}: ${stderr}`);
                    reject(new Error(`Audio download failed: ${stderr || 'Unknown error'}`));
                }
            });

            ytDlp.on('error', (error) => {
                logger.error(`yt-dlp spawn error: ${error.message}`);
                reject(error);
            });
        });
    }

    isDRMProtected(url) {
        return this.drmPlatforms.some(platform => url.toLowerCase().includes(platform));
    }

    detectPlatform(url) {
        try {
            const hostname = new URL(url).hostname.toLowerCase();
            const cleanHostname = hostname.replace(/^www\./, '');
            
            // Check for exact matches first
            if (this.platformSettings[cleanHostname]) {
                return cleanHostname;
            }
            
            // Check for partial matches
            for (const platform of Object.keys(this.platformSettings)) {
                if (cleanHostname.includes(platform.replace('.com', ''))) {
                    return platform;
                }
            }
            
            return 'unknown';
        } catch (error) {
            return 'unknown';
        }
    }

    getPlatformSpecificArgs(platform) {
        const args = [];
        
        switch (platform) {
            case 'youtube.com':
            case 'youtu.be':
                args.push(
                    '--cookies-from-browser', 'chrome',
                    '--extractor-args', 'youtube:player_client=web'
                );
                break;
            case 'soundcloud.com':
                args.push(
                    '--cookies-from-browser', 'chrome',
                    '--extractor-args', 'soundcloud:client_id=auto'
                );
                break;
            case 'tiktok.com':
                args.push(
                    '--cookies-from-browser', 'chrome',
                    '--add-header', 'User-Agent:TikTok 21.1.0 rv:211017 (iPhone; iOS 14.4.2; en_US) Cronet'
                );
                break;
            case 'instagram.com':
                args.push(
                    '--cookies-from-browser', 'chrome',
                    '--add-header', 'User-Agent:Instagram 146.0.0.27.125 Android'
                );
                break;
            default:
                args.push(
                    '--cookies-from-browser', 'chrome'
                );
        }
        
        return args;
    }

    async compressAudio(inputPath) {
        return new Promise((resolve, reject) => {
            const outputPath = inputPath.replace(/\.[^/.]+$/, '_compressed.mp3');
            
            const ffmpegArgs = [
                '-i', inputPath,
                '-codec:a', 'libmp3lame',
                '-b:a', '128k', // Compress to 128kbps
                '-ar', '44100', // Standard sample rate
                '-ac', '2', // Stereo
                '-y', // Overwrite output file
                outputPath
            ];

            logger.info(`Compressing audio: ${ffmpegArgs.join(' ')}`);

            const ffmpeg = spawn('ffmpeg', ffmpegArgs);
            
            ffmpeg.on('close', (code) => {
                if (code === 0) {
                    // Remove original file
                    if (fs.existsSync(inputPath)) {
                        fs.unlinkSync(inputPath);
                    }
                    
                    const fileSize = fs.statSync(outputPath).size;
                    resolve({
                        path: outputPath,
                        size: fileSize,
                        filename: path.basename(outputPath),
                        compressed: true,
                        quality: 'compressed'
                    });
                } else {
                    reject(new Error(`Audio compression failed with code ${code}`));
                }
            });

            ffmpeg.on('error', (error) => {
                logger.error(`FFmpeg error: ${error.message}`);
                reject(error);
            });
        });
    }

    async getAudioInfo(url) {
        return new Promise((resolve, reject) => {
            const ytDlp = spawn('yt-dlp', [
                '--dump-json',
                '--no-warnings',
                '--no-playlist',
                url
            ]);

            let stdout = '';
            let stderr = '';

            ytDlp.stdout.on('data', (data) => {
                stdout += data.toString();
            });

            ytDlp.stderr.on('data', (data) => {
                stderr += data.toString();
            });

            ytDlp.on('close', (code) => {
                if (code === 0) {
                    try {
                        const info = JSON.parse(stdout);
                        resolve({
                            title: info.title || 'Unknown Title',
                            duration: info.duration || 0,
                            uploader: info.uploader || 'Unknown',
                            platform: this.detectPlatform(url),
                            thumbnail: info.thumbnail
                        });
                    } catch (error) {
                        reject(new Error('Failed to parse audio info'));
                    }
                } else {
                    reject(new Error(`Failed to get audio info: ${stderr}`));
                }
            });
        });
    }

    getSupportedPlatforms() {
        return Object.keys(this.platformSettings);
    }

    getDRMPlatforms() {
        return this.drmPlatforms;
    }

    cleanupTempFiles() {
        try {
            const files = fs.readdirSync(this.downloadPath);
            const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
            
            files.forEach(file => {
                const filePath = path.join(this.downloadPath, file);
                const stats = fs.statSync(filePath);
                
                if (stats.mtime.getTime() < oneDayAgo) {
                    fs.unlinkSync(filePath);
                    logger.info(`Cleaned up old temp file: ${file}`);
                }
            });
        } catch (error) {
            logger.error(`Failed to cleanup temp files: ${error.message}`);
        }
    }
}

module.exports = new EnhancedAudioDownloader();