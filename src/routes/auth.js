const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');
const logger = require('../utils/logger');
const { getAuthUrls } = require('../utils/urlHelper');

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

        logger.auth('Login-Versuch gestartet', { email, hasPassword: !!password, remember });
        logger.debug('Login-Request-Details', {
            body: req.body,
            headers: req.headers,
            session: req.session,
            cookies: req.cookies
        });

        if (!email || !password) {
            logger.warn('Login fehlgeschlagen: Fehlende Felder', { email, hasPassword: !!password });
            return res.redirect('/auth/login?error=Bitte füllen Sie alle Felder aus');
        }

        // Supabase Login
        logger.auth('Supabase Login-Versuch', { email });
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password
        });

        if (error) {
            logger.error('Supabase Login-Fehler', {
                email,
                error: error.message,
                errorCode: error.status,
                fullError: error
            });

            // Bessere Fehlermeldungen basierend auf dem Fehlertyp
            if (error.message.includes('Invalid login credentials') || error.message.includes('Invalid email or password')) {
                return res.redirect('/auth/login?error=E-Mail oder Passwort ist falsch. Falls Sie noch kein Konto haben, registrieren Sie sich bitte.');
            } else if (error.message.includes('Email not confirmed')) {
                return res.redirect('/auth/login?error=Bitte bestätigen Sie zuerst Ihre E-Mail-Adresse.');
            } else {
                return res.redirect('/auth/login?error=Anmeldung fehlgeschlagen. Bitte versuchen Sie es erneut.');
            }
        }

        // Erfolgreicher Login
        if (data.user && data.session) {
            logger.auth('Supabase Login erfolgreich', {
                userId: data.user.id,
                email: data.user.email,
                emailConfirmed: data.user.email_confirmed_at,
                createdAt: data.user.created_at,
                hasSession: !!data.session,
                accessToken: data.session.access_token ? 'PRESENT' : 'MISSING'
            });

            // Supabase Session-Cookies setzen (für Vercel)
            res.cookie('sb-access-token', data.session.access_token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
                maxAge: remember ? 30 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000
            });

            res.cookie('sb-refresh-token', data.session.refresh_token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
                maxAge: remember ? 30 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000
            });

            // Express Session auch setzen (als Backup)
            req.session.userId = data.user.id;
            req.session.userEmail = data.user.email;

            if (remember) {
                req.session.cookie.maxAge = 30 * 24 * 60 * 60 * 1000; // 30 Tage
                logger.session('Remember-Me aktiviert', { userId: data.user.id, maxAge: req.session.cookie.maxAge });
            }

            logger.session('Session gesetzt', {
                sessionId: req.sessionID,
                userId: req.session.userId,
                userEmail: req.session.userEmail,
                sessionData: req.session,
                hasSupabaseCookies: !!data.session.access_token
            });

            logger.redirect('Weiterleitung zum Dashboard', {
                from: '/auth/login',
                to: '/dashboard',
                userId: data.user.id,
                sessionId: req.sessionID,
                sessionData: req.session
            });

            // Debug: Session vor Redirect überprüfen
            logger.debug('Session vor Dashboard-Redirect', {
                sessionId: req.sessionID,
                session: req.session,
                userId: req.session.userId,
                userEmail: req.session.userEmail,
                supabaseTokens: {
                    accessToken: !!data.session.access_token,
                    refreshToken: !!data.session.refresh_token
                }
            });

            res.redirect('/dashboard');
        } else {
            logger.error('Login fehlgeschlagen: Keine User-Daten oder Session', { email, data });
            res.redirect('/auth/login?error=Anmeldung fehlgeschlagen');
        }

    } catch (error) {
        logger.error('Login-Route unerwarteter Fehler', {
            email: req.body.email,
            error: error.message,
            stack: error.stack
        });
        res.redirect('/auth/login?error=Ein Fehler ist aufgetreten');
    }
});

// GET /auth/logout - Logout
router.get('/logout', (req, res) => {
    logger.auth('Logout gestartet', {
        sessionId: req.sessionID,
        hasSession: !!req.session,
        userId: req.session?.userId,
        userEmail: req.session?.userEmail
    });

    // Supabase-Cookies löschen
    res.clearCookie('sb-access-token');
    res.clearCookie('sb-refresh-token');

    // Express-Session löschen
    req.session.destroy((err) => {
        if (err) {
            logger.error('Logout-Fehler beim Löschen der Session', {
                error: err.message,
                sessionId: req.sessionID
            });
        } else {
            logger.auth('Logout erfolgreich', {
                sessionId: req.sessionID,
                cookiesCleared: true,
                sessionDestroyed: true
            });
        }
        res.redirect('/');
    });
});

// GET /auth/register - Registrierungsseite
router.get('/register', (req, res) => {
    res.render('auth/register', {
        title: 'Registrierung',
        error: req.query.error,
        success: req.query.success
    });
});

// POST /auth/register - Registrierung
router.post('/register', async (req, res) => {
    try {
        const { email, password, confirmPassword } = req.body;

        if (!email || !password || !confirmPassword) {
            return res.redirect('/auth/register?error=Bitte füllen Sie alle Felder aus');
        }

        if (password !== confirmPassword) {
            return res.redirect('/auth/register?error=Passwörter stimmen nicht überein');
        }

        if (password.length < 6) {
            return res.redirect('/auth/register?error=Das Passwort muss mindestens 6 Zeichen lang sein');
        }

        // Entfernen der problematischen E-Mail-Überprüfung
        // Supabase wird uns beim signUp mitteilen, ob die E-Mail bereits existiert

        // Supabase Registrierung
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                emailRedirectTo: getAuthUrls(req).confirm
            }
        });

        if (error) {
            console.error('Registrierungs-Fehler:', error.message);

            if (error.message.includes('User already registered')) {
                return res.redirect('/auth/register?error=Diese E-Mail-Adresse ist bereits registriert. Möchten Sie sich stattdessen anmelden?&showLogin=true');
            } else if (error.message.includes('Invalid email')) {
                return res.redirect('/auth/register?error=Bitte geben Sie eine gültige E-Mail-Adresse ein.');
            } else {
                return res.redirect('/auth/register?error=Registrierung fehlgeschlagen: ' + error.message);
            }
        }

        if (data.user) {
            console.log(`✅ Benutzer ${email} erfolgreich registriert`);

            // Prüfe, ob E-Mail-Bestätigung erforderlich ist
            if (data.user.email_confirmed_at) {
                // E-Mail bereits bestätigt - direkter Login
                req.session.userId = data.user.id;
                req.session.userEmail = data.user.email;
                res.redirect('/dashboard');
            } else {
                // E-Mail-Bestätigung erforderlich
                res.redirect('/auth/login?success=Registrierung erfolgreich! Bitte bestätigen Sie Ihre E-Mail-Adresse.');
            }
        } else {
            res.redirect('/auth/register?error=Registrierung fehlgeschlagen');
        }

    } catch (error) {
        console.error('Registrierungs-Route Fehler:', error);
        res.redirect('/auth/register?error=Ein Fehler ist aufgetreten');
    }
});

// GET /auth/forgot-password - Passwort vergessen
router.get('/forgot-password', (req, res) => { 
    res.render('auth/forgot-password', {
        title: 'Passwort vergessen',
        error: req.query.error,
        success: req.query.success
    });
});

// POST /auth/forgot-password - Passwort zurücksetzen
router.post('/forgot-password', async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.redirect('/auth/forgot-password?error=Bitte geben Sie Ihre E-Mail-Adresse ein');
        }

        // Supabase Passwort zurücksetzen (PKCE-Flow)
        const baseUrl = process.env.SITE_URL || (req.get('host') ? `https://${req.get('host')}` : 'http://localhost:3000');
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${baseUrl}/auth/confirm?redirectUrl=${encodeURIComponent(baseUrl + '/auth/reset-password')}`
        });

        console.log('Passwort-Reset-E-Mail gesendet an:', email);
        console.log('Redirect-URL:', getAuthUrls(req).resetPassword);

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

// GET /auth/confirm - PKCE-Flow für Passwort-Reset (code)
router.get('/confirm', async (req, res) => {
    try {
        const { code, redirectUrl } = req.query;

        logger.info('🔐 [PKCE-CONFIRM] Bestätigung gestartet', {
            code: code ? 'PRESENT' : 'MISSING',
            redirectUrl,
            userAgent: req.get('User-Agent')
        });

        if (!code) {
            logger.warn('❌ [PKCE-CONFIRM] Kein Code-Parameter', { query: req.query });
            return res.redirect('/auth/login?error=Ungültiger Bestätigungslink');
        }

        try {
            // Code gegen Session austauschen (wie in deinem Code)
            const { data, error } = await supabase.auth.exchangeCodeForSession(code);

            if (error || !data?.session) {
                logger.error('❌ [PKCE-CONFIRM] exchangeCodeForSession fehlgeschlagen', { error: error.message });
                return res.redirect('/auth/login?error=Bestätigung fehlgeschlagen: ' + error.message);
            }

            if (data.session?.user) {
                logger.info('✅ [PKCE-CONFIRM] User erfolgreich eingeloggt', {
                    userId: data.session.user.id,
                    email: data.session.user.email
                });

                // Session setzen
                req.session.userId = data.session.user.id;
                req.session.userEmail = data.session.user.email;
                
                // Weiterleitung zur Passwort-Änderungsseite mit Tokens
                const { access_token, refresh_token } = data.session;
                const finalRedirect = redirectUrl || '/auth/reset-password';
                
                logger.info('🔄 [PKCE-CONFIRM] Weiterleitung mit Tokens', { to: finalRedirect });
                
                return res.redirect(`${finalRedirect}?access_token=${access_token}&refresh_token=${refresh_token}`);
            } else {
                logger.warn('⚠️ [PKCE-CONFIRM] Keine Session in der Antwort');
                return res.redirect('/auth/login?error=Bestätigung unvollständig');
            }

        } catch (error) {
            logger.error('💥 [PKCE-CONFIRM] Unerwarteter Fehler', { error: error.message });
            return res.redirect('/auth/login?error=Technischer Fehler bei der Bestätigung');
        }
    } catch (error) {
        logger.error('💥 [PKCE-CONFIRM] Route unerwarteter Fehler', { error: error.message });
        return res.redirect('/auth/login?error=Technischer Fehler bei der Bestätigung');
    }
});



// GET /auth/reset-password - Passwort zurücksetzen (mit Token)
router.get('/reset-password', async (req, res) => {
    try {
        // Supabase sendet verschiedene Parameter je nach Konfiguration
        const { token_hash, type, access_token, refresh_token, error: urlError } = req.query;

        console.log('Reset-Password Query-Parameter:', req.query);
        console.log('Alle Query-Parameter:', Object.keys(req.query));

        // Prüfe verschiedene mögliche Parameter-Kombinationen
        // Supabase kann verschiedene Parameter senden, je nach Konfiguration
        if (token_hash || access_token || refresh_token || type === 'recovery') {
            const resetToken = token_hash || access_token;

            res.render('auth/reset-password', {
                title: 'Passwort zurücksetzen',
                token_hash: resetToken,
                error: urlError || req.query.error,
                success: req.query.success
            });
        } else {
            console.log('Ungültige Reset-Parameter:', req.query);
            res.redirect('/auth/login?error=Ungültiger Passwort-Reset-Link. Bitte verwenden Sie den Link aus der E-Mail.');
        }
    } catch (error) {
        console.error('Passwort-Reset Route Fehler:', error);
        res.redirect('/auth/login?error=Ein Fehler ist aufgetreten');
    }
});

// POST /auth/reset-password - Neues Passwort setzen
router.post('/reset-password', async (req, res) => {
    try {
        const { password, confirmPassword, token_hash } = req.body;

        if (!password || !confirmPassword || !token_hash) {
            return res.redirect('/auth/reset-password?error=Bitte füllen Sie alle Felder aus');
        }

        if (password !== confirmPassword) {
            return res.redirect('/auth/reset-password?error=Passwörter stimmen nicht überein');
        }

        if (password.length < 6) {
            return res.redirect('/auth/reset-password?error=Das Passwort muss mindestens 6 Zeichen lang sein');
        }

        // Zuerst den Recovery-Token verifizieren und verwenden
        const { data, error } = await supabase.auth.verifyOtp({
            token_hash,
            type: 'recovery'
        });

        if (error) {
            console.error('Token-Verifikation Fehler:', error.message);
            return res.redirect('/auth/reset-password?error=Ungültiger oder abgelaufener Reset-Link&token_hash=' + token_hash);
        }

        // Jetzt das Passwort aktualisieren
        const { data: updateData, error: updateError } = await supabase.auth.updateUser({
            password: password
        });

        if (updateError) {
            console.error('Passwort-Update Fehler:', updateError.message);
            return res.redirect('/auth/reset-password?error=Passwort konnte nicht zurückgesetzt werden&token_hash=' + token_hash);
        }

        if (updateData.user) {
            console.log(`✅ Passwort für ${updateData.user.email} erfolgreich zurückgesetzt`);
            res.redirect('/auth/login?success=Passwort erfolgreich zurückgesetzt! Sie können sich jetzt anmelden.');
        } else {
            res.redirect('/auth/reset-password?error=Passwort-Reset fehlgeschlagen&token_hash=' + token_hash);
        }

    } catch (error) {
        console.error('Passwort-Reset POST Route Fehler:', error);
        res.redirect('/auth/reset-password?error=Ein Fehler ist aufgetreten');
    }
});

module.exports = router;
