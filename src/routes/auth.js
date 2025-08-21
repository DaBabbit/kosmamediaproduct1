const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');

// GET /auth/login - Login-Seite anzeigen
router.get('/login', (req, res) => {
    res.render('auth/login', {
        title: 'Login',
        error: req.query.error,
        success: req.query.success
    });
});

// POST /auth/login - Login-Verarbeitung
router.post('/login', async (req, res) => {
    try {
        const { email, password, remember } = req.body;

        if (!email || !password) {
            return res.redirect('/auth/login?error=Bitte füllen Sie alle Felder aus');
        }

        // Supabase Login
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password
        });

        if (error) {
            console.error('Login-Fehler:', error.message);
            return res.redirect('/auth/login?error=Ungültige Anmeldedaten');
        }

        // Erfolgreicher Login
        if (data.user) {
            // Session setzen
            req.session.userId = data.user.id;
            req.session.userEmail = data.user.email;
            
            // Remember-Me-Funktionalität
            if (remember) {
                req.session.cookie.maxAge = 30 * 24 * 60 * 60 * 1000; // 30 Tage
            }

            console.log(`✅ Benutzer ${email} erfolgreich angemeldet`);
            res.redirect('/dashboard');
        } else {
            res.redirect('/auth/login?error=Anmeldung fehlgeschlagen');
        }

    } catch (error) {
        console.error('Login-Route Fehler:', error);
        res.redirect('/auth/login?error=Ein Fehler ist aufgetreten');
    }
});

// GET /auth/logout - Logout
router.get('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error('Logout-Fehler:', err);
        }
        res.redirect('/');
    });
});

// GET /auth/register - Registrierungsseite (Platzhalter)
router.get('/register', (req, res) => {
    res.render('auth/register', {
        title: 'Registrierung'
    });
});

// POST /auth/register - Registrierung (Platzhalter)
router.post('/register', async (req, res) => {
    try {
        const { email, password, confirmPassword } = req.body;

        if (!email || !password || !confirmPassword) {
            return res.redirect('/auth/register?error=Bitte füllen Sie alle Felder aus');
        }

        if (password !== confirmPassword) {
            return res.redirect('/auth/register?error=Passwörter stimmen nicht überein');
        }

        // Supabase Registrierung
        const { data, error } = await supabase.auth.signUp({
            email,
            password
        });

        if (error) {
            console.error('Registrierungs-Fehler:', error.message);
            return res.redirect('/auth/register?error=Registrierung fehlgeschlagen');
        }

        if (data.user) {
            console.log(`✅ Benutzer ${email} erfolgreich registriert`);
            res.redirect('/auth/login?success=Registrierung erfolgreich! Bitte bestätigen Sie Ihre E-Mail');
        } else {
            res.redirect('/auth/register?error=Registrierung fehlgeschlagen');
        }

    } catch (error) {
        console.error('Registrierungs-Route Fehler:', error);
        res.redirect('/auth/register?error=Ein Fehler ist aufgetreten');
    }
});

// GET /auth/forgot-password - Passwort vergessen (Platzhalter)
router.get('/forgot-password', (req, res) => {
    res.render('auth/forgot-password', {
        title: 'Passwort vergessen'
    });
});

// POST /auth/forgot-password - Passwort zurücksetzen (Platzhalter)
router.post('/forgot-password', async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.redirect('/auth/forgot-password?error=Bitte geben Sie Ihre E-Mail-Adresse ein');
        }

        // Supabase Passwort zurücksetzen
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${req.protocol}://${req.get('host')}/auth/reset-password`
        });

        if (error) {
            console.error('Passwort-Reset-Fehler:', error.message);
            return res.redirect('/auth/forgot-password?error=Fehler beim Senden der E-Mail');
        }

        console.log(`✅ Passwort-Reset-E-Mail an ${email} gesendet`);
        res.redirect('/auth/login?success=E-Mail zum Zurücksetzen des Passworts wurde gesendet');

    } catch (error) {
        console.error('Passwort-Reset-Route Fehler:', error);
        res.redirect('/auth/forgot-password?error=Ein Fehler ist aufgetreten');
    }
});

module.exports = router;
