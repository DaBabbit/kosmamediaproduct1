const express = require('express');
const requireAuth = require('../middleware/auth');
const logger = require('../utils/logger');
const router = express.Router();

// Dashboard-Seite (nur für eingeloggte Benutzer)
router.get('/', requireAuth, (req, res) => {
    logger.info('Dashboard-Zugriff', { 
        userId: req.user.id,
        email: req.user.email,
        sessionId: req.sessionID,
        url: req.url,
        userAgent: req.get('User-Agent')
    });
    
    res.render('dashboard/index', { 
        title: 'Dashboard',
        user: req.user
    });
});

module.exports = router;
