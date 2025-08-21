const fs = require('fs');
const path = require('path');

class Logger {
    constructor() {
        this.logDir = path.join(__dirname, '../logs');
        this.ensureLogDirectory();
    }

    ensureLogDirectory() {
        if (!fs.existsSync(this.logDir)) {
            fs.mkdirSync(this.logDir, { recursive: true });
        }
    }

    formatMessage(level, message, data = null) {
        const timestamp = new Date().toISOString();
        const logEntry = {
            timestamp,
            level,
            message,
            data,
            url: process.env.BASE_URL || 'localhost',
            environment: process.env.NODE_ENV || 'development'
        };
        return JSON.stringify(logEntry) + '\n';
    }

    writeToFile(level, message, data = null) {
        try {
            const logFile = path.join(this.logDir, `${level}.log`);
            const logEntry = this.formatMessage(level, message, data);
            fs.appendFileSync(logFile, logEntry);
        } catch (error) {
            console.error('Fehler beim Schreiben in Log-Datei:', error);
        }
    }

    info(message, data = null) {
        const logMessage = `[INFO] ${message}`;
        console.log(logMessage, data || '');
        this.writeToFile('info', message, data);
    }

    warn(message, data = null) {
        const logMessage = `[WARN] ${message}`;
        console.warn(logMessage, data || '');
        this.writeToFile('warn', message, data);
    }

    error(message, data = null) {
        const logMessage = `[ERROR] ${message}`;
        console.error(logMessage, data || '');
        this.writeToFile('error', message, data);
    }

    debug(message, data = null) {
        if (process.env.NODE_ENV === 'development') {
            const logMessage = `[DEBUG] ${message}`;
            console.log(logMessage, data || '');
            this.writeToFile('debug', message, data);
        }
    }

    auth(message, data = null) {
        const logMessage = `[AUTH] ${message}`;
        console.log(logMessage, data || '');
        this.writeToFile('auth', message, data);
    }

    session(message, data = null) {
        const logMessage = `[SESSION] ${message}`;
        console.log(logMessage, data || '');
        this.writeToFile('session', message, data);
    }

    redirect(message, data = null) {
        const logMessage = `[REDIRECT] ${message}`;
        console.log(logMessage, data || '');
        this.writeToFile('redirect', message, data);
    }
}

module.exports = new Logger();
