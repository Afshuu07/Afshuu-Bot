const ytdl = require('ytdl-core');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { promisify } = require('util');
const logger = require('./logger');

class MediaDownloader {
    constructor() {
        this.downloadDir = './downloads';
        this.createDownloadDirectory();
    }

    createDownloadDirectory() {
        if (!fs.existsSync(this.downloadDir)) {
            fs.mkdirSync(this.downloadDir, { recursive: true });
        }
    }

    async downloadYouTubeVideo(url, options = {}) {
        try {
            if (!ytdl.validateURL(url)) {
                throw new Error('Invalid YouTube URL');
            }

            const info = await ytdl.getInfo(url);
            const title = this.sanitizeFilename(info.videoDetails.title);
            const duration = parseInt(info.videoDetails.lengthSeconds);

            // Limit video duration to 10 minutes (600 seconds)
            if (duration > 600) {
                throw new Error('Video is too long. Maximum duration is 10 minutes.');
            }

            const format = options.audioOnly ? 'audioonly' : 'videoandaudio';
            const extension = options.audioOnly ? 'mp3' : 'mp4';
            const filename = `${title}.${extension}`;
            const filepath = path.join(this.downloadDir, filename);

            return new Promise((resolve, reject) => {
                const stream = ytdl(url, {
                    filter: format,
                    quality: options.audioOnly ? 'highestaudio' : 'highest'
                });

                stream.pipe(fs.createWriteStream(filepath));

                stream.on('end', () => {
                    logger.info(`Downloaded: ${filename}`);
                    resolve({
                        success: true,
                        filepath,
                        filename,
                        title: info.videoDetails.title,
                        duration
                    });
                });

                stream.on('error', (error) => {
                    logger.error(`Download error: ${error.message}`);
                    reject(error);
                });
            });

        } catch (error) {
            logger.error(`YouTube download error: ${error.message}`);
            throw error;
        }
    }

    async downloadFromUrl(url, options = {}) {
        try {
            const response = await axios({
                method: 'GET',
                url: url,
                responseType: 'stream',
                timeout: 30000,
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                }
            });

            // Check file size (limit to 50MB)
            const contentLength = response.headers['content-length'];
            if (contentLength && parseInt(contentLength) > 50 * 1024 * 1024) {
                throw new Error('File is too large. Maximum size is 50MB.');
            }

            const urlObj = new URL(url);
            const filename = options.filename || path.basename(urlObj.pathname) || `download_${Date.now()}`;
            const filepath = path.join(this.downloadDir, filename);

            return new Promise((resolve, reject) => {
                const writer = fs.createWriteStream(filepath);
                response.data.pipe(writer);

                writer.on('finish', () => {
                    logger.info(`Downloaded: ${filename}`);
                    resolve({
                        success: true,
                        filepath,
                        filename
                    });
                });

                writer.on('error', (error) => {
                    logger.error(`Download error: ${error.message}`);
                    reject(error);
                });
            });

        } catch (error) {
            logger.error(`URL download error: ${error.message}`);
            throw error;
        }
    }

    sanitizeFilename(filename) {
        return filename
            .replace(/[<>:"/\\|?*]/g, '')
            .replace(/\s+/g, '_')
            .substring(0, 100);
    }

    async cleanup(filepath) {
        try {
            if (fs.existsSync(filepath)) {
                fs.unlinkSync(filepath);
                logger.info(`Cleaned up: ${filepath}`);
            }
        } catch (error) {
            logger.error(`Cleanup error: ${error.message}`);
        }
    }

    extractVideoId(url) {
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
        const match = url.match(regExp);
        return (match && match[2].length === 11) ? match[2] : null;
    }

    isYouTubeUrl(url) {
        return ytdl.validateURL(url);
    }

    isSupportedUrl(url) {
        try {
            new URL(url);
            const supportedDomains = [
                'youtube.com', 'youtu.be', 'twitter.com', 'x.com',
                'instagram.com', 'tiktok.com', 'facebook.com',
                'vimeo.com', 'dailymotion.com'
            ];
            
            const domain = new URL(url).hostname.replace('www.', '');
            return supportedDomains.some(d => domain.includes(d));
        } catch {
            return false;
        }
    }
}

module.exports = new MediaDownloader();