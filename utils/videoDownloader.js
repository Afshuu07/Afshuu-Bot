const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const logger = require('./logger');

class VideoDownloader {
    constructor() {
        this.downloadPath = path.join(__dirname, '../temp');
        this.maxFileSize = 100 * 1024 * 1024; // 100MB limit for WhatsApp
        
        // Create temp directory if it doesn't exist
        if (!fs.existsSync(this.downloadPath)) {
            fs.mkdirSync(this.downloadPath, { recursive: true });
        }
    }

    async downloadVideo(url, options = {}) {
        return new Promise((resolve, reject) => {
            const outputFilename = `video_${Date.now()}.%(ext)s`;
            const outputPath = path.join(this.downloadPath, outputFilename);
            
            const ytDlpArgs = [
                '--format', 'best[height<=720]/best', // Limit to 720p for smaller file size
                '--output', outputPath,
                '--no-warnings',
                '--extract-flat', 'false',
                '--write-info-json',
                '--no-playlist', // Download single video only
                url
            ];

            // Add additional options based on platform
            if (options.audioOnly) {
                ytDlpArgs.splice(1, 2, '--format', 'bestaudio/best');
            }

            if (options.noWatermark) {
                ytDlpArgs.push('--embed-subs', '--write-sub');
            }

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
                            file.endsWith('.mp4') || file.endsWith('.mkv') || file.endsWith('.webm')
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
                                    filename: videoFile
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
                    reject(new Error(`Download failed: ${stderr}`));
                }
            });
        });
    }

    async compressVideo(inputPath) {
        return new Promise((resolve, reject) => {
            const outputPath = inputPath.replace(/\.[^/.]+$/, '_compressed.mp4');
            
            const ffmpegArgs = [
                '-i', inputPath,
                '-c:v', 'libx264',
                '-crf', '28',
                '-preset', 'fast',
                '-c:a', 'aac',
                '-b:a', '128k',
                '-movflags', '+faststart',
                '-y', // Overwrite output file
                outputPath
            ];

            const ffmpeg = spawn('ffmpeg', ffmpegArgs);
            
            ffmpeg.on('close', (code) => {
                if (code === 0) {
                    // Remove original file
                    fs.unlinkSync(inputPath);
                    
                    const fileSize = fs.statSync(outputPath).size;
                    resolve({
                        path: outputPath,
                        size: fileSize,
                        filename: path.basename(outputPath)
                    });
                } else {
                    reject(new Error(`Video compression failed with code ${code}`));
                }
            });

            ffmpeg.on('error', (error) => {
                reject(error);
            });
        });
    }

    async getVideoInfo(url) {
        return new Promise((resolve, reject) => {
            const ytDlp = spawn('yt-dlp', [
                '--dump-json',
                '--no-warnings',
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
                            title: info.title,
                            duration: info.duration,
                            uploader: info.uploader,
                            view_count: info.view_count,
                            description: info.description?.substring(0, 200) + '...' || 'No description'
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

    getSupportedPlatforms() {
        return [
            '🎬 YouTube', '📱 TikTok', '📷 Instagram', 
            '🐦 Twitter/X', '📺 Facebook', '🎵 SoundCloud',
            '🎪 Twitch', '📹 Vimeo', '🎭 Dailymotion',
            '📻 Spotify', '🎸 Bandcamp', '🎼 Mixcloud',
            '🌐 And 1000+ more platforms!'
        ];
    }
}

module.exports = new VideoDownloader();