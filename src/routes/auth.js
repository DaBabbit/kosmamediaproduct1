const express = require('express');
const supabase = require('../config/supabase');
const router = express.Router();

// Login-Seite anzeigen
router.get('/login', (req, res) => {
    res.render('auth/login', { 
        title: 'Anmelden',
        error: req.query.error,
        success: req.query.success
    });
});

// Magic-Link versenden
router.post('/login', async (req, res) => {
    try {
        const { email } = req.body;
        
        if (!email) {
            return res.redirect('/auth/login?error=Email ist erforderlich');
        }

        // Für Demo-Zwecke: Simuliere erfolgreichen Magic-Link-Versand
        console.log(`Demo: Magic-Link würde an ${email} gesendet werden`);
        
        // Simuliere Verzögerung
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        res.redirect('/auth/login?success=Magic-Link wurde an Ihre E-Mail gesendet (Demo-Modus)');
    } catch (error) {
        console.error('Login-Fehler:', error);
        res.redirect('/auth/login?error=Ein unerwarteter Fehler ist aufgetreten');
    }
});

// Magic-Link Callback verarbeiten
router.get('/callback', async (req, res) => {
    try {
        const { access_token, refresh_token } = req.query;
        
        if (!access_token) {
            return res.redirect('/auth/login?error=Ungültiger Magic-Link');
        }

        // Token in Cookies setzen
        res.cookie('sb-access-token', access_token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 Tage
        });

        if (refresh_token) {
            res.cookie('sb-refresh-token', refresh_token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                maxAge: 30 * 24 * 60 * 60 * 1000 // 30 Tage
            });
        }

        res.redirect('/dashboard');
    } catch (error) {
        console.error('Callback-Fehler:', error);
        res.redirect('/auth/login?error=Fehler bei der Anmeldung');
    }
});

// Logout
router.post('/logout', (req, res) => {
    res.clearCookie('sb-access-token');
    res.clearCookie('sb-refresh-token');
    res.redirect('/auth/login');
});

module.exports = router;
