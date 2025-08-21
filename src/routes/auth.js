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
        if (data.user) {
            logger.auth('Supabase Login erfolgreich', { 
                userId: data.user.id, 
                email: data.user.email,
                emailConfirmed: data.user.email_confirmed_at,
                createdAt: data.user.created_at
            });

            // Session setzen
            req.session.userId = data.user.id;
            req.session.userEmail = data.user.email;
            
            // Remember-Me-Funktionalität
            if (remember) {
                req.session.cookie.maxAge = 30 * 24 * 60 * 60 * 1000; // 30 Tage
                logger.session('Remember-Me aktiviert', { userId: data.user.id, maxAge: req.session.cookie.maxAge });
            }

            logger.session('Session gesetzt', { 
                sessionId: req.sessionID,
                userId: req.session.userId,
                userEmail: req.session.userEmail,
                sessionData: req.session
            });

            logger.redirect('Weiterleitung zum Dashboard', { 
                from: '/auth/login', 
                to: '/dashboard',
                userId: data.user.id,
                sessionId: req.sessionID
            });

            res.redirect('/dashboard');
        } else {
            logger.error('Login fehlgeschlagen: Keine User-Daten', { email, data });
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
    req.session.destroy((err) => {
        if (err) {
            console.error('Logout-Fehler:', err);
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

        // Supabase Passwort zurücksetzen
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: getAuthUrls(req).resetPassword
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

// GET /auth/confirm - E-Mail-Bestätigung
router.get('/confirm', async (req, res) => {
    try {
        // Supabase sendet verschiedene Parameter je nach Konfiguration
        const { token_hash, type, access_token, refresh_token } = req.query;
        
        logger.auth('E-Mail-Bestätigung gestartet', { 
            query: req.query,
            headers: req.headers,
            url: req.url,
            method: req.method,
            userAgent: req.get('User-Agent')
        });
        
        logger.debug('E-Mail-Bestätigung Query-Parameter', { 
            token_hash, 
            type, 
            access_token: access_token ? 'PRESENT' : 'MISSING', 
            refresh_token: refresh_token ? 'PRESENT' : 'MISSING',
            allParams: Object.keys(req.query),
            fullQuery: req.query
        });
        
        // Prüfe verschiedene mögliche Parameter-Kombinationen
        if (token_hash || access_token || refresh_token || type === 'email_confirmation') {
            const confirmToken = token_hash || access_token;
            
            logger.auth('OTP-Verifikation gestartet', { 
                tokenType: token_hash ? 'token_hash' : 'access_token',
                tokenLength: confirmToken ? confirmToken.length : 0,
                type
            });
            
            try {
                const { data, error } = await supabase.auth.verifyOtp({
                    token_hash: confirmToken,
                    type: 'email_confirmation'
                });
                
                if (error) {
                    logger.error('OTP-Verifikation fehlgeschlagen', { 
                        error: error.message,
                        errorCode: error.status,
                        tokenType: token_hash ? 'token_hash' : 'access_token',
                        type,
                        fullError: error
                    });
                    return res.redirect('/auth/login?error=E-Mail-Bestätigung fehlgeschlagen: ' + error.message);
                }
                
                if (data.user) {
                    logger.auth('E-Mail-Bestätigung erfolgreich', { 
                        userId: data.user.id,
                        email: data.user.email,
                        emailConfirmed: data.user.email_confirmed_at,
                        createdAt: data.user.created_at,
                        lastSignIn: data.user.last_sign_in_at
                    });
                    
                    logger.redirect('Weiterleitung nach E-Mail-Bestätigung', { 
                        from: '/auth/confirm', 
                        to: '/auth/login?success=E-Mail erfolgreich bestätigt! Sie können sich jetzt anmelden.',
                        userId: data.user.id
                    });
                    
                    res.redirect('/auth/login?success=E-Mail erfolgreich bestätigt! Sie können sich jetzt anmelden.');
                } else {
                    logger.error('E-Mail-Bestätigung fehlgeschlagen: Keine User-Daten', { 
                        data, 
                        tokenType: token_hash ? 'token_hash' : 'access_token',
                        type
                    });
                    res.redirect('/auth/login?error=E-Mail-Bestätigung fehlgeschlagen');
                }
            } catch (verifyError) {
                logger.error('OTP-Verifikation unerwarteter Fehler', { 
                    error: verifyError.message,
                    stack: verifyError.stack,
                    tokenType: token_hash ? 'token_hash' : 'access_token',
                    type
                });
                res.redirect('/auth/login?error=E-Mail-Bestätigung fehlgeschlagen');
            }
        } else {
            logger.warn('E-Mail-Bestätigung: Keine gültigen Parameter', { 
                query: req.query,
                headers: req.headers,
                url: req.url
            });
            
            logger.redirect('Weiterleitung ohne Parameter', { 
                from: '/auth/confirm', 
                to: '/auth/login?success=E-Mail-Bestätigung erfolgreich! Sie können sich jetzt anmelden.',
                reason: 'Keine gültigen Parameter'
            });
            
            // Wenn keine spezifischen Parameter vorhanden sind, zur Login-Seite weiterleiten
            res.redirect('/auth/login?success=E-Mail-Bestätigung erfolgreich! Sie können sich jetzt anmelden.');
        }
    } catch (error) {
        logger.error('E-Mail-Bestätigung Route unerwarteter Fehler', { 
            error: error.message,
            stack: error.stack,
            query: req.query,
            url: req.url
        });
        res.redirect('/auth/login?error=Ein Fehler ist aufgetreten');
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
