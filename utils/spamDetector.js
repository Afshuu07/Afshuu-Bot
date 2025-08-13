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
            // English
            'scam', 'fraud', 'fake', 'spam', 'phishing', 'malware', 'virus',
            'hack', 'stolen', 'illegal', 'counterfeit', 'pyramid', 'ponzi',
            'mlm', 'multi-level', 'chain letter', 'advance fee', 'nigerian prince',
            
            // Hindi
            'धोखाधड़ी', 'जालसाजी', 'नकली', 'स्पैम', 'फिशिंग', 'मैलवेयर', 'वायरस',
            'हैक', 'चोरी', 'गैरकानूनी', 'जाली', 'पिरामिड', 'पोंजी', 'बहु-स्तरीय',
            
            // Spanish
            'estafa', 'fraude', 'falso', 'spam', 'phishing', 'malware', 'virus',
            'hackear', 'robado', 'ilegal', 'falsificado', 'pirámide', 'ponzi',
            
            // French
            'arnaque', 'fraude', 'faux', 'spam', 'hameçonnage', 'malware', 'virus',
            'pirater', 'volé', 'illégal', 'contrefait', 'pyramide', 'ponzi',
            
            // Arabic
            'احتيال', 'خداع', 'مزيف', 'سبام', 'تصيد', 'برمجيات خبيثة', 'فيروس',
            'اختراق', 'مسروق', 'غير قانوني', 'مزور', 'هرمي', 'بونزي',
            
            // Portuguese
            'golpe', 'fraude', 'falso', 'spam', 'phishing', 'malware', 'vírus',
            'hackear', 'roubado', 'ilegal', 'falsificado', 'pirâmide', 'ponzi',
            
            // German
            'betrug', 'schwindel', 'falsch', 'spam', 'phishing', 'malware', 'virus',
            'hacken', 'gestohlen', 'illegal', 'gefälscht', 'pyramide', 'ponzi',
            
            // Russian
            'мошенничество', 'обман', 'поддельный', 'спам', 'фишинг', 'вредонос', 'вирус',
            'взлом', 'украденный', 'незаконный', 'поддельный', 'пирамида', 'понци',
            
            // Chinese
            '诈骗', '欺诈', '假冒', '垃圾邮件', '钓鱼', '恶意软件', '病毒',
            '黑客', '被盗', '非法', '假冒', '金字塔', '庞氏',
            
            // Japanese
            '詐欺', '詐取', '偽物', 'スパム', 'フィッシング', 'マルウェア', 'ウイルス',
            'ハッキング', '盗難', '違法', '偽造', 'ピラミッド', 'ポンジ'
        ];

        // Multi-language abuse/sexual abuse patterns
        this.abusePatterns = [
            // English
            /\b(sexual|abuse|harass|rape|assault|molest|inappropriate|unwanted)\b/gi,
            /\b(nude|naked|explicit|porn|sexual|xxx|adult|nsfw)\b/gi,
            
            // Hindi
            /\b(यौन|दुर्व्यवहार|परेशान|बलात्कार|हमला|अनुचित|अवांछित)\b/gi,
            /\b(नग्न|अश्लील|वयस्क|गंदा|गलत)\b/gi,
            
            // Spanish  
            /\b(sexual|abuso|acoso|violación|agresión|inapropiado|no deseado)\b/gi,
            /\b(desnudo|explícito|pornografía|adulto|xxx)\b/gi,
            
            // French
            /\b(sexuel|abus|harcèlement|viol|agression|inapproprié|non désiré)\b/gi,
            /\b(nu|explicite|pornographie|adulte|xxx)\b/gi,
            
            // Arabic
            /\b(جنسي|إساءة|مضايقة|اغتصاب|اعتداء|غير مناسب|غير مرغوب)\b/gi,
            /\b(عاري|صريح|إباحي|للبالغين|xxx)\b/gi,
            
            // Portuguese
            /\b(sexual|abuso|assédio|estupro|agressão|inadequado|indesejado)\b/gi,
            /\b(nu|explícito|pornografia|adulto|xxx)\b/gi,
            
            // German
            /\b(sexuell|missbrauch|belästigung|vergewaltigung|angriff|unangemessen)\b/gi,
            /\b(nackt|explizit|pornografie|erwachsene|xxx)\b/gi,
            
            // Russian
            /\b(сексуальный|злоупотребление|домогательство|изнасилование|нападение)\b/gi,
            /\b(голый|откровенный|порнография|взрослый|xxx)\b/gi,
            
            // Chinese
            /\b(性|滥用|骚扰|强奸|攻击|不当|不受欢迎)\b/gi,
            /\b(裸体|明确|色情|成人|xxx)\b/gi,
            
            // Japanese
            /\b(性的|虐待|嫌がらせ|レイプ|攻撃|不適切|望ましくない)\b/gi,
            /\b(裸|明示的|ポルノ|大人|xxx)\b/gi
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

        // Check for abuse/sexual content
        let abuseMatches = 0;
        this.abusePatterns.forEach(pattern => {
            if (pattern.test(message)) {
                abuseMatches++;
                analysis.reasons.push('Inappropriate/abusive content detected');
            }
        });

        if (abuseMatches > 0) {
            analysis.isSuspicious = true;
            analysis.confidence += abuseMatches * 30;
            
            if (abuseMatches >= 2) {
                analysis.isSpam = true;
                analysis.severity = 'high';
            } else {
                analysis.severity = 'medium';
            }
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