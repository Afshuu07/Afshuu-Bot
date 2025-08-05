const fs = require('fs');
const path = require('path');

class Logger {
    constructor() {
        this.logDir = './logs';
        this.logFile = path.join(this.logDir, 'afshuu-bot.log');
        this.maxLogSize = 10 * 1024 * 1024; // 10MB
        this.maxLogFiles = 5;
        
        this.createLogDirectory();
    }

    createLogDirectory() {
        if (!fs.existsSync(this.logDir)) {
            fs.mkdirSync(this.logDir, { recursive: true });
        }
    }

    rotateLog() {
        try {
            if (fs.existsSync(this.logFile)) {
                const stats = fs.statSync(this.logFile);
                if (stats.size > this.maxLogSize) {
                    // Rotate logs
                    for (let i = this.maxLogFiles - 1; i > 0; i--) {
                        const oldFile = `${this.logFile}.${i}`;
                        const newFile = `${this.logFile}.${i + 1}`;
                        
                        if (fs.existsSync(oldFile)) {
                            if (i === this.maxLogFiles - 1) {
                                fs.unlinkSync(oldFile);
                            } else {
                                fs.renameSync(oldFile, newFile);
                            }
                        }
                    }
                    
                    fs.renameSync(this.logFile, `${this.logFile}.1`);
                }
            }
        } catch (error) {
            console.error('Error rotating log:', error);
        }
    }

    formatMessage(level, message) {
        const timestamp = new Date().toISOString();
        return `[${timestamp}] [${level.toUpperCase()}] ${message}\n`;
    }

    writeLog(level, message) {
        try {
            this.rotateLog();
            const formattedMessage = this.formatMessage(level, message);
            fs.appendFileSync(this.logFile, formattedMessage);
        } catch (error) {
            console.error('Error writing to log file:', error);
        }
    }

    info(message) {
        console.log(`ℹ️  ${message}`);
        this.writeLog('info', message);
    }

    warn(message) {
        console.warn(`⚠️  ${message}`);
        this.writeLog('warn', message);
    }

    error(message) {
        console.error(`❌ ${message}`);
        this.writeLog('error', message);
    }

    debug(message) {
        if (process.env.DEBUG === 'true') {
            console.log(`🐛 ${message}`);
            this.writeLog('debug', message);
        }
    }

    success(message) {
        console.log(`✅ ${message}`);
        this.writeLog('success', message);
    }
}

module.exports = new Logger();
