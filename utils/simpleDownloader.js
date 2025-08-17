const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const logger = require('./logger');

class SimpleDownloader {
    constructor() {
        this.downloadPath = './temp';
        this.maxFileSize = 16 * 1024 * 1024; // 16MB for WhatsApp
        
        // Create temp directory if it doesn't exist
        if (!fs.existsSync(this.downloadPath)) {
            fs.mkdirSync(this.downloadPath, { recursive: true });
        }
    }

    async downloadVideo(url) {
        return new Promise((resolve, reject) => {
            const outputFilename = `simple_video_${Date.now()}`;
            const outputTemplate = path.join(this.downloadPath, `${outputFilename}.%(ext)s`);
            
            const ytDlpArgs = [
                '--format', 'best[height<=720]/best',
                '--output', outputTemplate,
                '--no-warnings',
                '--no-playlist',
                url
            ];
            
            logger.info(`Simple video download: ${url}`);
            
            const ytDlp = spawn('yt-dlp', ytDlpArgs);
            let stderr = '';
            
            ytDlp.stderr.on('data', (data) => {
                stderr += data.toString();
            });
            
            ytDlp.on('close', (code) => {
                if (code === 0) {
                    // Find the downloaded file
                    const files = fs.readdirSync(this.downloadPath)
                        .filter(file => file.startsWith(outputFilename))
                        .filter(file => file.endsWith('.mp4') || file.endsWith('.webm') || file.endsWith('.mkv'));
                    
                    if (files.length > 0) {
                        const videoFile = files[0];
                        const filePath = path.join(this.downloadPath, videoFile);
                        const fileSize = fs.statSync(filePath).size;
                        
                        resolve({
                            path: filePath,
                            size: fileSize,
                            filename: videoFile
                        });
                    } else {
                        reject(new Error('Video file not found'));
                    }
                } else {
                    reject(new Error(`Download failed: ${stderr}`));
                }
            });
            
            ytDlp.on('error', (error) => {
                reject(error);
            });
        });
    }

    async downloadAudio(url) {
        return new Promise((resolve, reject) => {
            const outputFilename = `simple_audio_${Date.now()}`;
            const outputTemplate = path.join(this.downloadPath, `${outputFilename}.%(ext)s`);
            
            const ytDlpArgs = [
                '--extract-audio',
                '--audio-format', 'mp3',
                '--audio-quality', '0',
                '--output', outputTemplate,
                '--no-warnings',
                '--no-playlist',
                url
            ];
            
            logger.info(`Simple audio download: ${url}`);
            
            const ytDlp = spawn('yt-dlp', ytDlpArgs);
            let stderr = '';
            
            ytDlp.stderr.on('data', (data) => {
                stderr += data.toString();
            });
            
            ytDlp.on('close', (code) => {
                if (code === 0) {
                    // Find the downloaded file
                    const files = fs.readdirSync(this.downloadPath)
                        .filter(file => file.startsWith(outputFilename))
                        .filter(file => file.endsWith('.mp3') || file.endsWith('.m4a'));
                    
                    if (files.length > 0) {
                        const audioFile = files[0];
                        const filePath = path.join(this.downloadPath, audioFile);
                        const fileSize = fs.statSync(filePath).size;
                        
                        resolve({
                            path: filePath,
                            size: fileSize,
                            filename: audioFile
                        });
                    } else {
                        reject(new Error('Audio file not found'));
                    }
                } else {
                    reject(new Error(`Download failed: ${stderr}`));
                }
            });
            
            ytDlp.on('error', (error) => {
                reject(error);
            });
        });
    }
}

module.exports = new SimpleDownloader();