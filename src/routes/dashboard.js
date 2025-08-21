const express = require('express');
const requireAuth = require('../middleware/auth');
const router = express.Router();

// Dashboard-Seite (nur für eingeloggte Benutzer)
router.get('/', requireAuth, (req, res) => {
    res.render('dashboard/index', { 
        title: 'Dashboard',
        user: req.user
    });
});

module.exports = router;
