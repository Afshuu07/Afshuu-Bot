const logger = require('./logger');

class SpamDetector {
    constructor() {
        this.suspiciousPatterns = [
            // Cryptocurrency/Investment scams
            /bitcoin|crypto|investment|profit|trading|forex|mining|wallet/gi,
            /guaranteed.*returns?|easy.*money|get.*rich|double.*money/gi,
            /invest.*now|limited.*time|act.*fast|don't.*miss/gi,
            
            // Phishing patterns
            /click.*here|verify.*account|update.*payment|suspended.*account/gi,
            /urgent.*action|immediate.*response|account.*blocked/gi,
            /congratulations.*won|lottery|prize.*money|claim.*now/gi,
            
            // Job/MLM scams
            /work.*from.*home|part.*time.*job|easy.*income|no.*experience/gi,
            /join.*our.*team|network.*marketing|recruiting|downline/gi,
            
            // Romance/catfish scams
            /lonely|single|looking.*for.*love|soulmate|relationship/gi,
            /send.*money|western.*union|gift.*card|help.*me/gi,
            
            // Fake product/service scams
            /magic.*pill|lose.*weight.*fast|miracle.*cure|secret.*method/gi,
            /limited.*stock|order.*now|special.*discount|exclusive.*offer/gi,
            
            // Common spam indicators
            /free.*money|cash.*prize|no.*cost|risk.*free/gi,
            /call.*now|text.*stop|unsubscribe|opt.*out/gi
        ];

        this.spamKeywords = [
            'scam', 'fraud', 'fake', 'spam', 'phishing', 'malware', 'virus',
            'hack', 'stolen', 'illegal', 'counterfeit', 'pyramid', 'ponzi',
            'mlm', 'multi-level', 'chain letter', 'advance fee', 'nigerian prince'
        ];

        this.suspiciousUrls = [
            /bit\.ly|tinyurl|goo\.gl|t\.co|short\.link/gi,
            /[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+/g, // IP addresses
            /[a-z0-9-]+\.tk|\.ml|\.ga|\.cf/gi // Suspicious TLDs
        ];

        // Message frequency tracking
        this.messageCount = new Map();
        this.spamWarnings = new Map();
    }

    analyzeMessage(message, contact) {
        const analysis = {
            isSpam: false,
            isSuspicious: false,
            confidence: 0,
            reasons: [],
            severity: 'low'
        };

        if (!message || typeof message !== 'string') {
            return analysis;
        }

        const messageText = message.toLowerCase();
        const userId = contact.id.user;

        // Check message frequency
        this.trackMessageFrequency(userId);
        if (this.isFloodSpam(userId)) {
            analysis.isSpam = true;
            analysis.reasons.push('Message flooding detected');
            analysis.confidence += 30;
            analysis.severity = 'high';
        }

        // Check for suspicious patterns
        let patternMatches = 0;
        this.suspiciousPatterns.forEach(pattern => {
            if (pattern.test(message)) {
                patternMatches++;
                analysis.reasons.push(`Suspicious pattern detected: ${pattern.source.substring(0, 30)}...`);
            }
        });

        if (patternMatches > 0) {
            analysis.isSuspicious = true;
            analysis.confidence += patternMatches * 15;
            
            if (patternMatches >= 3) {
                analysis.isSpam = true;
                analysis.severity = 'high';
            } else if (patternMatches >= 2) {
                analysis.severity = 'medium';
            }
        }

        // Check for spam keywords
        let keywordMatches = 0;
        this.spamKeywords.forEach(keyword => {
            if (messageText.includes(keyword)) {
                keywordMatches++;
                analysis.reasons.push(`Spam keyword detected: ${keyword}`);
            }
        });

        if (keywordMatches > 0) {
            analysis.isSuspicious = true;
            analysis.confidence += keywordMatches * 20;
            
            if (keywordMatches >= 2) {
                analysis.isSpam = true;
                analysis.severity = 'high';
            }
        }

        // Check for suspicious URLs
        this.suspiciousUrls.forEach(pattern => {
            if (pattern.test(message)) {
                analysis.isSuspicious = true;
                analysis.reasons.push('Suspicious URL detected');
                analysis.confidence += 25;
                
                if (analysis.confidence > 60) {
                    analysis.isSpam = true;
                    analysis.severity = 'medium';
                }
            }
        });

        // Check for excessive capitalization
        const capsRatio = (message.match(/[A-Z]/g) || []).length / message.length;
        if (capsRatio > 0.7 && message.length > 10) {
            analysis.isSuspicious = true;
            analysis.reasons.push('Excessive capitalization');
            analysis.confidence += 10;
        }

        // Check for excessive special characters
        const specialChars = (message.match(/[!@#$%^&*()_+=\[\]{}|;:,.<>?]/g) || []).length;
        const specialRatio = specialChars / message.length;
        if (specialRatio > 0.3) {
            analysis.isSuspicious = true;
            analysis.reasons.push('Excessive special characters');
            analysis.confidence += 15;
        }

        // Check for repetitive characters
        if (/(.)\1{4,}/.test(message)) {
            analysis.isSuspicious = true;
            analysis.reasons.push('Repetitive character patterns');
            analysis.confidence += 10;
        }

        // Check for phone numbers (potential spam)
        const phonePattern = /(\+\d{1,3}[-.\s]?)?\(?\d{1,4}\)?[-.\s]?\d{1,4}[-.\s]?\d{1,9}/g;
        const phoneMatches = message.match(phonePattern);
        if (phoneMatches && phoneMatches.length > 1) {
            analysis.isSuspicious = true;
            analysis.reasons.push('Multiple phone numbers detected');
            analysis.confidence += 20;
        }

        // Final confidence adjustment
        if (analysis.confidence > 70) {
            analysis.isSpam = true;
            analysis.severity = 'high';
        } else if (analysis.confidence > 50) {
            analysis.isSuspicious = true;
            analysis.severity = 'medium';
        }

        // Log analysis if suspicious
        if (analysis.isSuspicious || analysis.isSpam) {
            logger.warn(`Spam analysis for user ${userId}: ${JSON.stringify(analysis)}`);
        }

        return analysis;
    }

    trackMessageFrequency(userId) {
        const now = Date.now();
        const userMessages = this.messageCount.get(userId) || [];
        
        // Remove messages older than 1 minute
        const recentMessages = userMessages.filter(timestamp => now - timestamp < 60000);
        recentMessages.push(now);
        
        this.messageCount.set(userId, recentMessages);
    }

    isFloodSpam(userId) {
        const userMessages = this.messageCount.get(userId) || [];
        return userMessages.length > 10; // More than 10 messages per minute
    }

    addSpamWarning(userId) {
        const warnings = this.spamWarnings.get(userId) || 0;
        this.spamWarnings.set(userId, warnings + 1);
        return warnings + 1;
    }

    getSpamWarnings(userId) {
        return this.spamWarnings.get(userId) || 0;
    }

    shouldAutoBlock(analysis, userId) {
        if (analysis.isSpam && analysis.severity === 'high') {
            const warnings = this.getSpamWarnings(userId);
            return warnings >= 2; // Auto-block after 2 warnings
        }
        return false;
    }

    generateSpamReport(analysis, contact) {
        if (!analysis.isSuspicious && !analysis.isSpam) {
            return null;
        }

        let report = `🚨 *Spam/Suspicious Activity Detected*\n\n`;
        report += `👤 *User:* @${contact.id.user}\n`;
        report += `⚠️ *Status:* ${analysis.isSpam ? 'SPAM' : 'SUSPICIOUS'}\n`;
        report += `📊 *Confidence:* ${analysis.confidence}%\n`;
        report += `🔥 *Severity:* ${analysis.severity.toUpperCase()}\n\n`;
        
        if (analysis.reasons.length > 0) {
            report += `📋 *Reasons:*\n`;
            analysis.reasons.forEach((reason, index) => {
                report += `${index + 1}. ${reason}\n`;
            });
        }

        report += `\n🛡️ *Action Required:* Review and take appropriate action`;

        return report;
    }

    // Clean up old data periodically
    cleanup() {
        const now = Date.now();
        const oneHour = 60 * 60 * 1000;
        
        // Clean message count data older than 1 hour
        for (const [userId, messages] of this.messageCount.entries()) {
            const recentMessages = messages.filter(timestamp => now - timestamp < oneHour);
            if (recentMessages.length === 0) {
                this.messageCount.delete(userId);
            } else {
                this.messageCount.set(userId, recentMessages);
            }
        }
        
        logger.info('Spam detector cleanup completed');
    }
}

module.exports = new SpamDetector();