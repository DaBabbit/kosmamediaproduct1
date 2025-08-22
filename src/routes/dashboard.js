const express = require('express');
const requireAuth = require('../middleware/auth');
const logger = require('../utils/logger');
const router = express.Router();

// Dashboard-Seite (nur für eingeloggte Benutzer)
router.get('/', requireAuth, (req, res) => {
    logger.info('Dashboard-Zugriff erfolgreich', {
        userId: req.user.id,
        email: req.user.email,
        sessionId: req.sessionID,
        url: req.url,
        userAgent: req.get('User-Agent'),
        sessionData: req.session,
        cookies: req.cookies,
        hasSupabaseToken: !!req.cookies['sb-access-token']
    });

    // Debug: Session-Status überprüfen
    logger.debug('Dashboard-Session-Status', {
        hasSession: !!req.session,
        sessionId: req.sessionID,
        userId: req.session?.userId,
        userEmail: req.session?.userEmail,
        userObject: req.user,
        supabaseTokens: {
            accessToken: !!req.cookies['sb-access-token'],
            refreshToken: !!req.cookies['sb-refresh-token']
        }
    });

    res.render('dashboard/index', {
        title: 'Dashboard',
        user: req.user
    });
});

module.exports = router;
