const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const logger = require('./logger');

class EnhancedVideoDownloader {
    constructor() {
        this.downloadPath = path.join(__dirname, '../temp');
        this.maxFileSize = 100 * 1024 * 1024; // 100MB limit for WhatsApp
        
        // Create temp directory if it doesn't exist
        if (!fs.existsSync(this.downloadPath)) {
            fs.mkdirSync(this.downloadPath, { recursive: true });
        }
        
        // Supported platforms with optimal settings
        this.platformSettings = {
            'youtube.com': { format: 'best[height<=720]/best', watermark: false },
            'youtu.be': { format: 'best[height<=720]/best', watermark: false },
            'tiktok.com': { format: 'best', watermark: false, args: ['--no-warnings'] },
            'instagram.com': { format: 'best', watermark: false, args: ['--no-warnings'] },
            'twitter.com': { format: 'best', watermark: false },
            'x.com': { format: 'best', watermark: false },
            'facebook.com': { format: 'best', watermark: false },
            'fb.watch': { format: 'best', watermark: false },
            'twitch.tv': { format: 'best', watermark: false },
            'vimeo.com': { format: 'best', watermark: false },
            'dailymotion.com': { format: 'best', watermark: false },
            'soundcloud.com': { format: 'bestaudio/best', watermark: false },
            'bandcamp.com': { format: 'bestaudio/best', watermark: false },
            'mixcloud.com': { format: 'bestaudio/best', watermark: false }
        };
    }

    async downloadVideoWithoutWatermark(url, options = {}) {
        return new Promise((resolve, reject) => {
            const outputFilename = `video_${Date.now()}.%(ext)s`;
            const outputPath = path.join(this.downloadPath, outputFilename);
            
            // Detect platform and get optimal settings
            const platform = this.detectPlatform(url);
            const settings = this.platformSettings[platform] || { format: 'best', watermark: false };
            
            const ytDlpArgs = [
                '--format', settings.format,
                '--output', outputPath,
                '--no-warnings',
                '--no-playlist', // Download single video only
                '--no-check-certificate', // Bypass SSL issues
                '--user-agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                '--referer', url, // Use original URL as referer
                ...this.getAntiWatermarkArgs(platform),
                ...(settings.args || []),
                url
            ];

            // Add compression for large files
            if (options.compress !== false) {
                ytDlpArgs.push('--postprocessor-args', 'ffmpeg:-vf scale=min(1280,iw):min(720,ih) -crf 28');
            }

            logger.info(`Downloading video from ${platform} with args: ${ytDlpArgs.join(' ')}`);

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
                    // Find the downloaded file
                    const files = fs.readdirSync(this.downloadPath).filter(file => 
                        file.startsWith(`video_${outputFilename.split('_')[1].split('.')[0]}`)
                    );
                    
                    if (files.length > 0) {
                        const videoFile = files.find(file => 
                            file.endsWith('.mp4') || file.endsWith('.mkv') || file.endsWith('.webm') || file.endsWith('.mov')
                        );
                        
                        if (videoFile) {
                            const filePath = path.join(this.downloadPath, videoFile);
                            const fileSize = fs.statSync(filePath).size;
                            
                            if (fileSize > this.maxFileSize) {
                                // Compress video if too large
                                this.compressVideo(filePath)
                                    .then(resolve)
                                    .catch(reject);
                            } else {
                                resolve({
                                    path: filePath,
                                    size: fileSize,
                                    filename: videoFile,
                                    platform: platform,
                                    watermarkFree: true
                                });
                            }
                        } else {
                            reject(new Error('Video file not found after download'));
                        }
                    } else {
                        reject(new Error('No files downloaded'));
                    }
                } else {
                    logger.error(`yt-dlp failed with code ${code}: ${stderr}`);
                    reject(new Error(`Download failed: ${stderr || 'Unknown error'}`));
                }
            });

            ytDlp.on('error', (error) => {
                logger.error(`yt-dlp spawn error: ${error.message}`);
                reject(error);
            });
        });
    }

    detectPlatform(url) {
        const hostname = new URL(url).hostname.toLowerCase();
        
        // Remove www. prefix
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
    }

    getAntiWatermarkArgs(platform) {
        const args = [];
        
        switch (platform) {
            case 'tiktok.com':
                args.push(
                    '--extractor-args', 'tiktok:no_watermark=1',
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
            case 'twitter.com':
            case 'x.com':
                args.push(
                    '--cookies-from-browser', 'chrome',
                    '--add-header', 'User-Agent:TwitterAndroid/9.95.0-release'
                );
                break;
            case 'facebook.com':
            case 'fb.watch':
                args.push(
                    '--cookies-from-browser', 'chrome'
                );
                break;
            default:
                // Generic anti-watermark settings
                args.push(
                    '--add-header', 'User-Agent:Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                );
        }
        
        return args;
    }

    async compressVideo(inputPath) {
        return new Promise((resolve, reject) => {
            const outputPath = inputPath.replace(/\.[^/.]+$/, '_compressed.mp4');
            
            const ffmpegArgs = [
                '-i', inputPath,
                '-c:v', 'libx264',
                '-crf', '26', // Better quality than original
                '-preset', 'medium', // Better compression
                '-c:a', 'aac',
                '-b:a', '128k',
                '-movflags', '+faststart',
                '-vf', 'scale=min(1280\\,iw):min(720\\,ih)', // Smart scaling
                '-y', // Overwrite output file
                outputPath
            ];

            logger.info(`Compressing video: ${ffmpegArgs.join(' ')}`);

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
                        watermarkFree: true
                    });
                } else {
                    reject(new Error(`Video compression failed with code ${code}`));
                }
            });

            ffmpeg.on('error', (error) => {
                logger.error(`FFmpeg error: ${error.message}`);
                reject(error);
            });
        });
    }

    async getVideoInfo(url) {
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
                            view_count: info.view_count || 0,
                            description: (info.description?.substring(0, 200) + '...') || 'No description',
                            platform: this.detectPlatform(url),
                            thumbnail: info.thumbnail
                        });
                    } catch (error) {
                        reject(new Error('Failed to parse video info'));
                    }
                } else {
                    reject(new Error(`Failed to get video info: ${stderr}`));
                }
            });
        });
    }

    getSupportedPlatforms() {
        return Object.keys(this.platformSettings);
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

module.exports = new EnhancedVideoDownloader();