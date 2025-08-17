const sharp = require('sharp');
const jimp = require('jimp');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const logger = require('./logger');

class EnhancedStickerMaker {
    constructor() {
        this.stickerDir = './stickers';
        this.tempDir = './temp';
        this.maxFileSize = 1 * 1024 * 1024; // 1MB limit for stickers
        this.createDirectories();
        
        // Supported input formats
        this.supportedImageFormats = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.tiff', '.svg'];
        this.supportedVideoFormats = ['.mp4', '.mov', '.avi', '.mkv', '.webm', '.gif'];
    }

    createDirectories() {
        [this.stickerDir, this.tempDir].forEach(dir => {
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
        });
    }

    async createStickerFromAny(inputPath, options = {}) {
        try {
            const fileExtension = path.extname(inputPath).toLowerCase();
            
            // Determine file type and process accordingly
            if (this.supportedImageFormats.includes(fileExtension)) {
                if (fileExtension === '.gif') {
                    return await this.createAnimatedSticker(inputPath, options);
                } else {
                    return await this.createStaticSticker(inputPath, options);
                }
            } else if (this.supportedVideoFormats.includes(fileExtension)) {
                return await this.createVideoSticker(inputPath, options);
            } else {
                throw new Error(`Unsupported file format: ${fileExtension}`);
            }
        } catch (error) {
            logger.error(`Enhanced sticker creation error: ${error.message}`);
            throw error;
        }
    }

    async createStaticSticker(inputPath, options = {}) {
        try {
            const timestamp = Date.now();
            const outputPath = path.join(this.stickerDir, `sticker_${timestamp}.webp`);

            // Enhanced sticker options with auto-sizing
            const stickerOptions = {
                width: options.width || 512,
                height: options.height || 512,
                quality: options.quality || 90,
                background: options.background || { r: 0, g: 0, b: 0, alpha: 0 }
            };

            // Get original image metadata
            const metadata = await sharp(inputPath).metadata();
            
            // Smart sizing - maintain aspect ratio
            let { width, height } = this.calculateOptimalSize(
                metadata.width, 
                metadata.height, 
                stickerOptions.width, 
                stickerOptions.height
            );

            // Process image with Sharp - enhanced pipeline
            await sharp(inputPath)
                .resize(width, height, {
                    fit: 'inside', // Maintain aspect ratio
                    withoutEnlargement: false,
                    background: stickerOptions.background
                })
                .extend({
                    top: Math.max(0, Math.floor((stickerOptions.height - height) / 2)),
                    bottom: Math.max(0, Math.ceil((stickerOptions.height - height) / 2)),
                    left: Math.max(0, Math.floor((stickerOptions.width - width) / 2)),
                    right: Math.max(0, Math.ceil((stickerOptions.width - width) / 2)),
                    background: stickerOptions.background
                })
                .webp({ 
                    quality: stickerOptions.quality,
                    effort: 6 // Maximum compression effort
                })
                .toFile(outputPath);

            // Check file size and compress if needed
            let fileSize = fs.statSync(outputPath).size;
            if (fileSize > this.maxFileSize) {
                await this.compressStickerFile(outputPath);
                fileSize = fs.statSync(outputPath).size;
            }

            logger.info(`Static sticker created: ${outputPath} (${(fileSize / 1024).toFixed(1)}KB)`);
            
            return {
                success: true,
                filepath: outputPath,
                filename: path.basename(outputPath),
                size: fileSize,
                type: 'static',
                dimensions: `${stickerOptions.width}x${stickerOptions.height}`
            };

        } catch (error) {
            logger.error(`Static sticker creation error: ${error.message}`);
            throw new Error(`Failed to create static sticker: ${error.message}`);
        }
    }

    async createAnimatedSticker(inputPath, options = {}) {
        try {
            const timestamp = Date.now();
            const outputPath = path.join(this.stickerDir, `animated_sticker_${timestamp}.webp`);

            // For GIFs and animated content
            if (path.extname(inputPath).toLowerCase() === '.gif') {
                // Use FFmpeg for better GIF to WebP conversion
                await this.convertGifToAnimatedWebP(inputPath, outputPath, options);
            } else {
                // Fallback to Sharp for other animated formats
                await sharp(inputPath, { animated: true })
                    .resize(512, 512, {
                        fit: 'inside',
                        background: { r: 0, g: 0, b: 0, alpha: 0 }
                    })
                    .webp({ 
                        quality: 85,
                        effort: 6,
                        animated: true 
                    })
                    .toFile(outputPath);
            }

            // Check file size and compress if needed
            let fileSize = fs.statSync(outputPath).size;
            if (fileSize > this.maxFileSize) {
                await this.compressAnimatedSticker(outputPath);
                fileSize = fs.statSync(outputPath).size;
            }

            logger.info(`Animated sticker created: ${outputPath} (${(fileSize / 1024).toFixed(1)}KB)`);
            
            return {
                success: true,
                filepath: outputPath,
                filename: path.basename(outputPath),
                size: fileSize,
                type: 'animated',
                dimensions: '512x512'
            };

        } catch (error) {
            logger.error(`Animated sticker creation error: ${error.message}`);
            throw new Error(`Failed to create animated sticker: ${error.message}`);
        }
    }

    async createVideoSticker(inputPath, options = {}) {
        try {
            const timestamp = Date.now();
            const outputPath = path.join(this.stickerDir, `video_sticker_${timestamp}.webp`);
            
            // Convert video to animated WebP using FFmpeg
            await this.convertVideoToAnimatedWebP(inputPath, outputPath, options);

            // Check file size and compress if needed
            let fileSize = fs.statSync(outputPath).size;
            if (fileSize > this.maxFileSize) {
                await this.compressAnimatedSticker(outputPath);
                fileSize = fs.statSync(outputPath).size;
            }

            logger.info(`Video sticker created: ${outputPath} (${(fileSize / 1024).toFixed(1)}KB)`);
            
            return {
                success: true,
                filepath: outputPath,
                filename: path.basename(outputPath),
                size: fileSize,
                type: 'video',
                dimensions: '512x512'
            };

        } catch (error) {
            logger.error(`Video sticker creation error: ${error.message}`);
            throw new Error(`Failed to create video sticker: ${error.message}`);
        }
    }

    async convertGifToAnimatedWebP(inputPath, outputPath, options = {}) {
        return new Promise((resolve, reject) => {
            const ffmpegArgs = [
                '-i', inputPath,
                '-vf', 'scale=512:512:force_original_aspect_ratio=decrease,pad=512:512:(ow-iw)/2:(oh-ih)/2:color=0x00000000',
                '-c:v', 'libwebp',
                '-quality', options.quality || '85',
                '-preset', 'default',
                '-loop', '0',
                '-an', // No audio
                '-y', // Overwrite
                outputPath
            ];

            const ffmpeg = spawn('ffmpeg', ffmpegArgs);
            
            ffmpeg.on('close', (code) => {
                if (code === 0) {
                    resolve();
                } else {
                    reject(new Error(`FFmpeg failed with code ${code}`));
                }
            });

            ffmpeg.on('error', (error) => {
                reject(error);
            });
        });
    }

    async convertVideoToAnimatedWebP(inputPath, outputPath, options = {}) {
        return new Promise((resolve, reject) => {
            const duration = options.duration || 3; // 3 seconds max
            const fps = options.fps || 15; // 15 fps for smaller file size

            const ffmpegArgs = [
                '-i', inputPath,
                '-t', duration.toString(),
                '-vf', `scale=512:512:force_original_aspect_ratio=decrease,pad=512:512:(ow-iw)/2:(oh-ih)/2:color=0x00000000,fps=${fps}`,
                '-c:v', 'libwebp',
                '-quality', options.quality || '75',
                '-preset', 'default',
                '-loop', '0',
                '-an', // No audio
                '-y', // Overwrite
                outputPath
            ];

            const ffmpeg = spawn('ffmpeg', ffmpegArgs);
            
            ffmpeg.on('close', (code) => {
                if (code === 0) {
                    resolve();
                } else {
                    reject(new Error(`FFmpeg failed with code ${code}`));
                }
            });

            ffmpeg.on('error', (error) => {
                reject(error);
            });
        });
    }

    async compressStickerFile(filePath) {
        const tempPath = filePath.replace('.webp', '_temp.webp');
        
        await sharp(filePath)
            .webp({ 
                quality: 70, // Lower quality for smaller size
                effort: 6 
            })
            .toFile(tempPath);
        
        // Replace original with compressed version
        fs.unlinkSync(filePath);
        fs.renameSync(tempPath, filePath);
    }

    async compressAnimatedSticker(filePath) {
        return new Promise((resolve, reject) => {
            const tempPath = filePath.replace('.webp', '_temp.webp');
            
            const ffmpegArgs = [
                '-i', filePath,
                '-c:v', 'libwebp',
                '-quality', '60', // Lower quality
                '-preset', 'default',
                '-y',
                tempPath
            ];

            const ffmpeg = spawn('ffmpeg', ffmpegArgs);
            
            ffmpeg.on('close', (code) => {
                if (code === 0) {
                    fs.unlinkSync(filePath);
                    fs.renameSync(tempPath, filePath);
                    resolve();
                } else {
                    reject(new Error(`Animation compression failed with code ${code}`));
                }
            });

            ffmpeg.on('error', (error) => {
                reject(error);
            });
        });
    }

    calculateOptimalSize(originalWidth, originalHeight, targetWidth, targetHeight) {
        const aspectRatio = originalWidth / originalHeight;
        
        let width = targetWidth;
        let height = targetHeight;
        
        if (aspectRatio > 1) {
            // Landscape
            height = Math.round(width / aspectRatio);
            if (height > targetHeight) {
                height = targetHeight;
                width = Math.round(height * aspectRatio);
            }
        } else {
            // Portrait or square
            width = Math.round(height * aspectRatio);
            if (width > targetWidth) {
                width = targetWidth;
                height = Math.round(width / aspectRatio);
            }
        }
        
        return { width, height };
    }

    async addTextToSticker(inputPath, text, options = {}) {
        try {
            const timestamp = Date.now();
            const outputPath = path.join(this.stickerDir, `text_sticker_${timestamp}.webp`);

            // Enhanced text options
            const textOptions = {
                fontSize: options.fontSize || 'medium',
                color: options.color || 'white',
                position: options.position || 'bottom',
                shadow: options.shadow !== false, // Default to true
                x: options.x,
                y: options.y
            };

            // Use Jimp for text manipulation with better fonts
            const image = await jimp.read(inputPath);
            
            // Load appropriate font based on size
            let font;
            switch (textOptions.fontSize) {
                case 'large':
                    font = await jimp.loadFont(jimp.FONT_SANS_64_WHITE);
                    break;
                case 'medium':
                    font = await jimp.loadFont(jimp.FONT_SANS_32_WHITE);
                    break;
                case 'small':
                default:
                    font = await jimp.loadFont(jimp.FONT_SANS_16_WHITE);
                    break;
            }

            // Calculate text position if not specified
            let x = textOptions.x;
            let y = textOptions.y;
            
            if (x === undefined || y === undefined) {
                const textWidth = jimp.measureText(font, text);
                const textHeight = jimp.measureTextHeight(font, text, textWidth);
                
                switch (textOptions.position) {
                    case 'top':
                        x = x !== undefined ? x : (image.getWidth() - textWidth) / 2;
                        y = y !== undefined ? y : 20;
                        break;
                    case 'center':
                        x = x !== undefined ? x : (image.getWidth() - textWidth) / 2;
                        y = y !== undefined ? y : (image.getHeight() - textHeight) / 2;
                        break;
                    case 'bottom':
                    default:
                        x = x !== undefined ? x : (image.getWidth() - textWidth) / 2;
                        y = y !== undefined ? y : image.getHeight() - textHeight - 20;
                        break;
                }
            }

            // Add shadow effect if enabled
            if (textOptions.shadow) {
                image.print(
                    font,
                    x + 2, y + 2,
                    {
                        text: text,
                        alignmentX: jimp.HORIZONTAL_ALIGN_CENTER,
                        alignmentY: jimp.VERTICAL_ALIGN_MIDDLE
                    }
                );
            }

            // Add main text
            image.print(
                font,
                x, y,
                {
                    text: text,
                    alignmentX: jimp.HORIZONTAL_ALIGN_CENTER,
                    alignmentY: jimp.VERTICAL_ALIGN_MIDDLE
                }
            );

            // Convert to buffer and then to WebP
            const buffer = await image.getBufferAsync(jimp.MIME_PNG);
            
            await sharp(buffer)
                .resize(512, 512, {
                    fit: 'inside',
                    background: { r: 0, g: 0, b: 0, alpha: 0 }
                })
                .webp({ quality: 85 })
                .toFile(outputPath);

            const fileSize = fs.statSync(outputPath).size;

            logger.info(`Text sticker created: ${outputPath}`);
            
            return {
                success: true,
                filepath: outputPath,
                filename: path.basename(outputPath),
                size: fileSize,
                type: 'text'
            };

        } catch (error) {
            logger.error(`Text sticker creation error: ${error.message}`);
            throw new Error(`Failed to create text sticker: ${error.message}`);
        }
    }

    isValidFormat(filename) {
        const ext = path.extname(filename).toLowerCase();
        return [...this.supportedImageFormats, ...this.supportedVideoFormats].includes(ext);
    }

    getSupportedFormats() {
        return {
            images: this.supportedImageFormats,
            videos: this.supportedVideoFormats,
            all: [...this.supportedImageFormats, ...this.supportedVideoFormats]
        };
    }

    async cleanup(filepath) {
        try {
            if (fs.existsSync(filepath)) {
                fs.unlinkSync(filepath);
                logger.info(`Cleaned up sticker: ${filepath}`);
            }
        } catch (error) {
            logger.error(`Sticker cleanup error: ${error.message}`);
        }
    }

    cleanupOldFiles() {
        try {
            const directories = [this.stickerDir, this.tempDir];
            const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
            
            directories.forEach(dir => {
                if (fs.existsSync(dir)) {
                    const files = fs.readdirSync(dir);
                    files.forEach(file => {
                        const filePath = path.join(dir, file);
                        const stats = fs.statSync(filePath);
                        
                        if (stats.mtime.getTime() < oneDayAgo) {
                            fs.unlinkSync(filePath);
                            logger.info(`Cleaned up old file: ${file}`);
                        }
                    });
                }
            });
        } catch (error) {
            logger.error(`Failed to cleanup old files: ${error.message}`);
        }
    }
}

module.exports = new EnhancedStickerMaker();