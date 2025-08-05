const sharp = require('sharp');
const jimp = require('jimp');
const fs = require('fs');
const path = require('path');
const logger = require('./logger');

class StickerMaker {
    constructor() {
        this.stickerDir = './stickers';
        this.createStickerDirectory();
    }

    createStickerDirectory() {
        if (!fs.existsSync(this.stickerDir)) {
            fs.mkdirSync(this.stickerDir, { recursive: true });
        }
    }

    async createSticker(inputPath, options = {}) {
        try {
            const timestamp = Date.now();
            const outputPath = path.join(this.stickerDir, `sticker_${timestamp}.webp`);

            // Default sticker options
            const stickerOptions = {
                width: options.width || 512,
                height: options.height || 512,
                quality: options.quality || 80,
                background: options.background || { r: 0, g: 0, b: 0, alpha: 0 }
            };

            // Process image with Sharp
            await sharp(inputPath)
                .resize(stickerOptions.width, stickerOptions.height, {
                    fit: 'contain',
                    background: stickerOptions.background
                })
                .webp({ quality: stickerOptions.quality })
                .toFile(outputPath);

            logger.info(`Sticker created: ${outputPath}`);
            
            return {
                success: true,
                filepath: outputPath,
                filename: path.basename(outputPath)
            };

        } catch (error) {
            logger.error(`Sticker creation error: ${error.message}`);
            throw new Error(`Failed to create sticker: ${error.message}`);
        }
    }

    async createAnimatedSticker(inputPath, options = {}) {
        try {
            const timestamp = Date.now();
            const outputPath = path.join(this.stickerDir, `animated_sticker_${timestamp}.webp`);

            // For animated stickers, we'll use a different approach
            // This is a simplified version - full animated sticker support would require ffmpeg
            await sharp(inputPath)
                .resize(512, 512, {
                    fit: 'contain',
                    background: { r: 0, g: 0, b: 0, alpha: 0 }
                })
                .webp({ quality: 90, animated: true })
                .toFile(outputPath);

            logger.info(`Animated sticker created: ${outputPath}`);
            
            return {
                success: true,
                filepath: outputPath,
                filename: path.basename(outputPath),
                animated: true
            };

        } catch (error) {
            logger.error(`Animated sticker creation error: ${error.message}`);
            throw new Error(`Failed to create animated sticker: ${error.message}`);
        }
    }

    async addTextToSticker(inputPath, text, options = {}) {
        try {
            const timestamp = Date.now();
            const outputPath = path.join(this.stickerDir, `text_sticker_${timestamp}.webp`);

            // Use Jimp for text manipulation
            const image = await jimp.read(inputPath);
            
            // Load font
            const font = await jimp.loadFont(options.fontSize === 'large' ? jimp.FONT_SANS_64_WHITE : 
                                          options.fontSize === 'medium' ? jimp.FONT_SANS_32_WHITE : 
                                          jimp.FONT_SANS_16_WHITE);

            // Add text to image
            image.print(font, 
                options.x || 10, 
                options.y || 10, 
                {
                    text: text,
                    alignmentX: jimp.HORIZONTAL_ALIGN_CENTER,
                    alignmentY: jimp.VERTICAL_ALIGN_MIDDLE
                },
                image.getWidth() - 20,
                image.getHeight() - 20
            );

            // Save as buffer then convert to WebP
            const buffer = await image.getBufferAsync(jimp.MIME_PNG);
            
            await sharp(buffer)
                .resize(512, 512, {
                    fit: 'contain',
                    background: { r: 0, g: 0, b: 0, alpha: 0 }
                })
                .webp({ quality: 80 })
                .toFile(outputPath);

            logger.info(`Text sticker created: ${outputPath}`);
            
            return {
                success: true,
                filepath: outputPath,
                filename: path.basename(outputPath)
            };

        } catch (error) {
            logger.error(`Text sticker creation error: ${error.message}`);
            throw new Error(`Failed to create text sticker: ${error.message}`);
        }
    }

    async createCircularSticker(inputPath, options = {}) {
        try {
            const timestamp = Date.now();
            const outputPath = path.join(this.stickerDir, `circular_sticker_${timestamp}.webp`);

            // Create circular mask
            const size = options.size || 512;
            const circle = Buffer.from(
                `<svg width="${size}" height="${size}">
                    <circle cx="${size/2}" cy="${size/2}" r="${size/2}" fill="white"/>
                </svg>`
            );

            await sharp(inputPath)
                .resize(size, size, { fit: 'cover' })
                .composite([{ input: circle, blend: 'dest-in' }])
                .webp({ quality: 80 })
                .toFile(outputPath);

            logger.info(`Circular sticker created: ${outputPath}`);
            
            return {
                success: true,
                filepath: outputPath,
                filename: path.basename(outputPath)
            };

        } catch (error) {
            logger.error(`Circular sticker creation error: ${error.message}`);
            throw new Error(`Failed to create circular sticker: ${error.message}`);
        }
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

    isValidImageFormat(filename) {
        const validFormats = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.tiff'];
        const ext = path.extname(filename).toLowerCase();
        return validFormats.includes(ext);
    }

    async getImageInfo(filepath) {
        try {
            const metadata = await sharp(filepath).metadata();
            return {
                width: metadata.width,
                height: metadata.height,
                format: metadata.format,
                size: metadata.size,
                hasAlpha: metadata.hasAlpha
            };
        } catch (error) {
            logger.error(`Error getting image info: ${error.message}`);
            throw error;
        }
    }
}

module.exports = new StickerMaker();