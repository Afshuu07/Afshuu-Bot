const logger = require('./logger');

class ConnectionStatusVisualizer {
    constructor() {
        this.currentStatus = 'disconnected';
        this.lastUpdate = null;
        this.connectionStartTime = null;
        this.reconnectAttempts = 0;
        this.totalMessages = 0;
        this.statusHistory = [];
        this.maxHistoryLength = 10;
    }

    updateStatus(status, details = {}) {
        const timestamp = new Date();
        const previousStatus = this.currentStatus;
        
        this.currentStatus = status;
        this.lastUpdate = timestamp;
        
        // Track connection start time
        if (status === 'open' && previousStatus !== 'open') {
            this.connectionStartTime = timestamp;
            this.reconnectAttempts = 0;
        }
        
        // Track reconnection attempts
        if (status === 'connecting' && previousStatus === 'close') {
            this.reconnectAttempts++;
        }
        
        // Add to status history
        this.statusHistory.unshift({
            status,
            timestamp,
            details,
            duration: this.getStatusDuration(previousStatus)
        });
        
        // Keep history limited
        if (this.statusHistory.length > this.maxHistoryLength) {
            this.statusHistory.pop();
        }
        
        // Display status update
        this.displayStatusUpdate(status, details);
        
        logger.info(`Connection status changed: ${previousStatus} → ${status}`, details);
    }
    
    getStatusDuration(previousStatus) {
        if (!this.lastUpdate) return 0;
        const lastStatusEntry = this.statusHistory.find(entry => entry.status === previousStatus);
        if (!lastStatusEntry) return 0;
        return Date.now() - lastStatusEntry.timestamp.getTime();
    }
    
    displayStatusUpdate(status, details) {
        const statusEmoji = this.getStatusEmoji(status);
        const statusColor = this.getStatusColor(status);
        const timestamp = new Date().toLocaleTimeString();
        
        console.log(`
${statusColor}╭─────────────────────────────────────────────────╮${this.colors.reset}
${statusColor}│  ${statusEmoji} CONNECTION STATUS UPDATE                   │${this.colors.reset}
${statusColor}├─────────────────────────────────────────────────┤${this.colors.reset}
${statusColor}│  Status: ${status.toUpperCase().padEnd(20)} │${this.colors.reset}
${statusColor}│  Time: ${timestamp.padEnd(22)} │${this.colors.reset}
${details.reason ? `${statusColor}│  Reason: ${details.reason.padEnd(21)} │${this.colors.reset}` : ''}
${statusColor}╰─────────────────────────────────────────────────╯${this.colors.reset}
        `);
    }
    
    getStatusEmoji(status) {
        const emojis = {
            'connecting': '🔄',
            'open': '🟢',
            'close': '🔴',
            'disconnected': '⚫',
            'qr': '📱',
            'loading': '⏳'
        };
        return emojis[status] || '❓';
    }
    
    getStatusColor(status) {
        return this.colors[status] || this.colors.default;
    }
    
    get colors() {
        return {
            connecting: '\x1b[33m',  // Yellow
            open: '\x1b[32m',        // Green
            close: '\x1b[31m',       // Red
            disconnected: '\x1b[90m', // Gray
            qr: '\x1b[36m',          // Cyan
            loading: '\x1b[35m',     // Magenta
            default: '\x1b[37m',     // White
            reset: '\x1b[0m'         // Reset
        };
    }
    
    displayFullStatus() {
        const uptime = this.getUptime();
        const statusEmoji = this.getStatusEmoji(this.currentStatus);
        const statusColor = this.getStatusColor(this.currentStatus);
        const timestamp = new Date().toLocaleTimeString();
        
        console.log(`
${statusColor}╭━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╮${this.colors.reset}
${statusColor}┃  ${statusEmoji} AFSHUU BOT - REAL-TIME CONNECTION STATUS DASHBOARD                                                      ┃${this.colors.reset}
${statusColor}├─────────────────────────────────────────────────────────────────────────────────────────────────────────────────┤${this.colors.reset}
${statusColor}┃  🔗 Current Status: ${this.currentStatus.toUpperCase().padEnd(20)} 📅 Last Update: ${timestamp.padEnd(15)} ┃${this.colors.reset}
${statusColor}┃  ⏱️  Connection Uptime: ${uptime.padEnd(18)} 🔄 Reconnects: ${this.reconnectAttempts.toString().padEnd(15)} ┃${this.colors.reset}
${statusColor}┃  📊 Messages Processed: ${this.totalMessages.toString().padEnd(16)} 🎯 Status Changes: ${this.statusHistory.length.toString().padEnd(12)} ┃${this.colors.reset}
${statusColor}├─────────────────────────────────────────────────────────────────────────────────────────────────────────────────┤${this.colors.reset}
${statusColor}┃  📈 RECENT STATUS HISTORY                                                                                           ┃${this.colors.reset}
${statusColor}├─────────────────────────────────────────────────────────────────────────────────────────────────────────────────┤${this.colors.reset}`);
        
        // Display recent status history
        this.statusHistory.slice(0, 5).forEach((entry, index) => {
            const emoji = this.getStatusEmoji(entry.status);
            const time = entry.timestamp.toLocaleTimeString();
            const duration = this.formatDuration(entry.duration);
            const statusText = entry.status.toUpperCase().padEnd(12);
            
            console.log(`${statusColor}┃  ${emoji} ${statusText} ${time.padEnd(12)} Duration: ${duration.padEnd(15)} ${entry.details.reason || ''.padEnd(20)} ┃${this.colors.reset}`);
        });
        
        console.log(`${statusColor}╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯${this.colors.reset}
        `);
    }
    
    getUptime() {
        if (!this.connectionStartTime) return 'Not connected';
        const uptime = Date.now() - this.connectionStartTime.getTime();
        return this.formatDuration(uptime);
    }
    
    formatDuration(ms) {
        if (ms < 1000) return `${ms}ms`;
        if (ms < 60000) return `${Math.floor(ms / 1000)}s`;
        if (ms < 3600000) return `${Math.floor(ms / 60000)}m ${Math.floor((ms % 60000) / 1000)}s`;
        return `${Math.floor(ms / 3600000)}h ${Math.floor((ms % 3600000) / 60000)}m`;
    }
    
    incrementMessageCount() {
        this.totalMessages++;
    }
    
    displayConnectionHealth() {
        const health = this.assessConnectionHealth();
        const healthEmoji = health.score >= 80 ? '💚' : health.score >= 60 ? '💛' : '❤️';
        const color = health.score >= 80 ? this.colors.open : health.score >= 60 ? this.colors.connecting : this.colors.close;
        
        console.log(`
${color}╭─────────────────────────────────────────────────╮${this.colors.reset}
${color}│  ${healthEmoji} CONNECTION HEALTH ASSESSMENT              │${this.colors.reset}
${color}├─────────────────────────────────────────────────┤${this.colors.reset}
${color}│  Overall Score: ${health.score}/100                   │${this.colors.reset}
${color}│  Status: ${health.status.padEnd(28)} │${this.colors.reset}
${color}├─────────────────────────────────────────────────┤${this.colors.reset}
${color}│  📊 Health Factors:                             │${this.colors.reset}`);
        
        health.factors.forEach(factor => {
            const indicator = factor.good ? '✅' : '⚠️';
            console.log(`${color}│  ${indicator} ${factor.description.padEnd(41)} │${this.colors.reset}`);
        });
        
        console.log(`${color}╰─────────────────────────────────────────────────╯${this.colors.reset}
        `);
        
        return health;
    }
    
    assessConnectionHealth() {
        const factors = [];
        let score = 100;
        
        // Check current connection status
        if (this.currentStatus === 'open') {
            factors.push({ description: 'Connection is active', good: true });
        } else {
            factors.push({ description: 'Connection is not active', good: false });
            score -= 40;
        }
        
        // Check reconnection attempts
        if (this.reconnectAttempts <= 2) {
            factors.push({ description: 'Low reconnection attempts', good: true });
        } else {
            factors.push({ description: `High reconnection attempts (${this.reconnectAttempts})`, good: false });
            score -= Math.min(30, this.reconnectAttempts * 5);
        }
        
        // Check uptime stability
        const uptime = this.connectionStartTime ? Date.now() - this.connectionStartTime.getTime() : 0;
        if (uptime > 300000) { // 5 minutes
            factors.push({ description: 'Stable connection uptime', good: true });
        } else if (this.currentStatus === 'open') {
            factors.push({ description: 'Recent connection, monitoring', good: true });
            score -= 10;
        } else {
            factors.push({ description: 'Unstable connection', good: false });
            score -= 20;
        }
        
        // Check message processing
        if (this.totalMessages > 0) {
            factors.push({ description: 'Processing messages successfully', good: true });
        } else {
            factors.push({ description: 'No messages processed yet', good: true });
        }
        
        let status = 'Excellent';
        if (score < 60) status = 'Poor - Needs Attention';
        else if (score < 80) status = 'Fair - Some Issues';
        else if (score < 95) status = 'Good - Minor Issues';
        
        return { score: Math.max(0, score), status, factors };
    }
    
    startPeriodicHealthCheck(intervalMs = 300000) { // 5 minutes
        setInterval(() => {
            console.log('\n🔍 Periodic Connection Health Check:');
            this.displayConnectionHealth();
        }, intervalMs);
    }
    
    getStatusSummary() {
        return {
            status: this.currentStatus,
            uptime: this.getUptime(),
            reconnectAttempts: this.reconnectAttempts,
            totalMessages: this.totalMessages,
            lastUpdate: this.lastUpdate,
            health: this.assessConnectionHealth()
        };
    }
}

module.exports = new ConnectionStatusVisualizer();