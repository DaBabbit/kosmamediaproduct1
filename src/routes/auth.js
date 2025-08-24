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
        
        // WICHTIG: Supabase sendet den Code als Hash-Fragment, nicht als Query-Parameter
        // Wir müssen eine spezielle Route verwenden, die den Hash ausliest
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${baseUrl}/auth/reset-password`
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

// GET /auth/reset-password - Passwort zurücksetzen (Hash-Fragment-basiert)
router.get('/reset-password', async (req, res) => {
    logger.info('🔐 [RESET-PASSWORD] === START: Passwort-Reset-Seite geladen ===', {
        userAgent: req.get('User-Agent'),
        query: req.query,
        hasQueryParams: Object.keys(req.query).length > 0,
        queryKeys: Object.keys(req.query),
        timestamp: new Date().toISOString()
    });

    try {
        // SCHRITT 1: Prüfe ob wir einen Code oder Token aus der E-Mail haben
        const { code, token_hash, type, access_token, refresh_token } = req.query;
        
        logger.info('🔍 [RESET-PASSWORD] SCHRITT 1: Analysiere URL-Parameter', {
            hasCode: !!code,
            hasTokenHash: !!token_hash,
            hasType: !!type,
            hasAccessToken: !!access_token,
            hasRefreshToken: !!refresh_token,
            type: type || 'NONE'
        });

        // SCHRITT 2: Versuche bestehende Session abzurufen
        logger.info('🔍 [RESET-PASSWORD] SCHRITT 2: Versuche bestehende Session abzurufen...');
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        logger.info('🔍 [RESET-PASSWORD] SCHRITT 2a: getSession() Ergebnis', {
            hasSession: !!session,
            hasUser: !!session?.user,
            userId: session?.user?.id || 'NONE',
            userEmail: session?.user?.email || 'NONE',
            error: sessionError?.message || 'NONE'
        });

        let user = null;

        // SCHRITT 3: Wenn wir einen Code haben, tausche ihn gegen eine Session
        if (code) {
            logger.info('🔍 [RESET-PASSWORD] SCHRITT 3: Code gefunden, tausche gegen Session...');
            
            try {
                const { data, error } = await supabase.auth.exchangeCodeForSession(code);
                
                if (error) {
                    logger.error('❌ [RESET-PASSWORD] SCHRITT 3a: exchangeCodeForSession fehlgeschlagen', { 
                        error: error.message,
                        errorCode: error.code || 'NO_CODE'
                    });
                } else if (data?.session) {
                    user = data.session.user;
                    logger.info('✅ [RESET-PASSWORD] SCHRITT 3b: Session erfolgreich erstellt', { 
                        userId: user.id, 
                        email: user.email 
                    });
                }
            } catch (exchangeError) {
                logger.error('❌ [RESET-PASSWORD] SCHRITT 3c: exchangeCodeForSession Exception', { 
                    error: exchangeError.message 
                });
            }
        }
        
        // SCHRITT 4: Wenn wir einen Token-Hash haben, verifiziere ihn
        else if (token_hash && type === 'recovery') {
            logger.info('🔍 [RESET-PASSWORD] SCHRITT 4: Token-Hash gefunden, verifiziere...');
            
            try {
                const { data, error } = await supabase.auth.verifyOtp({
                    token_hash,
                    type: 'recovery'
                });
                
                if (error) {
                    logger.error('❌ [RESET-PASSWORD] SCHRITT 4a: verifyOtp fehlgeschlagen', { 
                        error: error.message 
                    });
                } else if (data?.user) {
                    user = data.user;
                    logger.info('✅ [RESET-PASSWORD] SCHRITT 4b: OTP erfolgreich verifiziert', { 
                        userId: user.id, 
                        email: user.email 
                    });
                }
            } catch (verifyError) {
                logger.error('❌ [RESET-PASSWORD] SCHRITT 4c: verifyOtp Exception', { 
                    error: verifyError.message 
                });
                logger.error('❌ [RESET-PASSWORD] SCHRITT 4c: verifyOtp Exception', { 
                    error: verifyError.message 
                });
            }
        }
        
        // SCHRITT 5: Wenn wir Access/Refresh Tokens haben, setze Session
        else if (access_token && refresh_token) {
            logger.info('🔍 [RESET-PASSWORD] SCHRITT 5: Tokens gefunden, setze Session...');
            
            try {
                const { data, error } = await supabase.auth.setSession({
                    access_token,
                    refresh_token
                });
                
                if (error) {
                    logger.error('❌ [RESET-PASSWORD] SCHRITT 5a: setSession fehlgeschlagen', { 
                        error: error.message 
                    });
                } else if (data?.session) {
                    user = data.session.user;
                    logger.info('✅ [RESET-PASSWORD] SCHRITT 5b: Session erfolgreich gesetzt', { 
                        userId: user.id, 
                        email: user.email 
                    });
                }
            } catch (setSessionError) {
                logger.error('❌ [RESET-PASSWORD] SCHRITT 5c: setSession Exception', { 
                    error: setSessionError.message 
                });
            }
        }
        
        // SCHRITT 5a: Wenn wir nur einen Access-Token haben (Recovery-Flow)
        else if (access_token && type === 'recovery') {
            logger.info('🔍 [RESET-PASSWORD] SCHRITT 5a: Recovery-Token gefunden, setze Session...');
            
            try {
                // Für Recovery verwenden wir den Access-Token direkt
                const { data, error } = await supabase.auth.setSession({
                    access_token,
                    refresh_token: null // Refresh-Token ist optional für Recovery
                });
                
                if (error) {
                    logger.error('❌ [RESET-PASSWORD] SCHRITT 5a: Recovery setSession fehlgeschlagen', { 
                        error: error.message 
                    });
                } else if (data?.session) {
                    user = data.session.user;
                    logger.info('✅ [RESET-PASSWORD] SCHRITT 5a: Recovery-Session erfolgreich gesetzt', { 
                        userId: user.id, 
                        email: user.email 
                    });
                }
            } catch (setSessionError) {
                logger.error('❌ [RESET-PASSWORD] SCHRITT 5a: Recovery setSession Exception', { 
                    error: setSessionError.message 
                });
            }
        }
        
        // SCHRITT 6: Wenn wir eine bestehende Session haben, verwende sie
        else if (session?.user) {
            logger.info('🔍 [RESET-PASSWORD] SCHRITT 6: Bestehende Session gefunden');
            user = session.user;
        }

        // SCHRITT 7: Überprüfe ob wir einen User haben
        if (!user) {
            logger.warn('❌ [RESET-PASSWORD] SCHRITT 7: Kein User gefunden', {
                triedCode: !!code,
                triedTokenHash: !!token_hash,
                triedTokens: !!(access_token && refresh_token),
                hadExistingSession: !!session?.user
            });
            
            // SCHRITT 7a: Rendere eine Seite, die den Hash-Fragment ausliest
            logger.info('🔍 [RESET-PASSWORD] SCHRITT 7a: Rendere Hash-Fragment-Seite...');
            return res.render('auth/reset-password', { 
                error: null,
                email: null,
                success: null,
                showHashExtractor: true
            });
        }

        // SCHRITT 8: User erfolgreich authentifiziert
        logger.info('✅ [RESET-PASSWORD] SCHRITT 8: User erfolgreich authentifiziert', { 
            userId: user.id, 
            email: user.email,
            authMethod: code ? 'CODE' : token_hash ? 'TOKEN_HASH' : access_token ? 'TOKENS' : 'EXISTING_SESSION'
        });
        
        // SCHRITT 9: Express-Session setzen
        logger.info('🔍 [RESET-PASSWORD] SCHRITT 9: Setze Express-Session...', {
            oldUserId: req.session.userId || 'NONE',
            oldUserEmail: req.session.userEmail || 'NONE'
        });
        
        req.session.userId = user.id;
        req.session.userEmail = user.email;
        
        logger.info('✅ [RESET-PASSWORD] SCHRITT 10: Express-Session gesetzt', { 
            newUserId: req.session.userId,
            newUserEmail: req.session.userEmail,
            sessionId: req.sessionID
        });
        
        // SCHRITT 11: Passwort-Reset-Seite rendern
        logger.info('✅ [RESET-PASSWORD] SCHRITT 11: Rendere Passwort-Reset-Seite', { 
            email: user.email,
            willRender: true
        });
        
        return res.render('auth/reset-password', { 
            error: null,
            email: user.email,
            success: null,
            showHashExtractor: false,
            access_token: access_token || null,
            refresh_token: refresh_token || null
        });

    } catch (error) {
        logger.error('💥 [RESET-PASSWORD] SCHRITT X: Route unerwarteter Fehler', { 
            error: error.message,
            errorStack: error.stack,
            errorType: typeof error,
            timestamp: new Date().toISOString()
        });
        return res.render('auth/reset-password', { 
            error: `SCHRITT X FEHLGESCHLAGEN: Technischer Fehler. Bitte versuchen Sie es erneut. Fehler: ${error.message}`,
            email: null,
            success: null,
            showHashExtractor: true,
            access_token: null,
            refresh_token: null
        });
    }
});

// POST /auth/reset-password - Neues Passwort setzen
router.post('/reset-password', async (req, res) => {
    const { password, access_token, refresh_token } = req.body;
    
    logger.info('🔐 [RESET-PASSWORD] Passwort-Update gestartet', {
        hasPassword: !!password,
        hasAccessToken: !!access_token,
        hasRefreshToken: !!refresh_token
    });

    if (!password || password.length < 6) {
        return res.render('auth/reset-password', { 
            error: 'Passwort muss mindestens 6 Zeichen lang sein.',
            email: req.body.email || null
        });
    }

    try {
        // PKCE-Flow (mit Tokens)
        if (access_token && refresh_token) {
            logger.info('🔄 [RESET-PASSWORD] PKCE-Flow Passwort-Update');
            
            // Session wiederherstellen
            const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
                access_token,
                refresh_token
            });

            if (sessionError || !sessionData?.session) {
                logger.error('❌ [RESET-PASSWORD] Session-Wiederherstellung fehlgeschlagen', { error: sessionError?.message });
                return res.render('auth/reset-password', { 
                    error: 'Sitzung konnte nicht wiederhergestellt werden. Bitte fordern Sie einen neuen Link an.',
                    email: req.body.email || null
                });
            }

            // Passwort aktualisieren
            const { data, error } = await supabase.auth.updateUser({
                password: password
            });

            if (error) {
                logger.error('❌ [RESET-PASSWORD] updateUser fehlgeschlagen', { error: error.message });
                return res.render('auth/reset-password', { 
                    error: 'Passwort konnte nicht aktualisiert werden: ' + error.message,
                    email: req.body.email || null
                });
            }

            logger.info('✅ [RESET-PASSWORD] Passwort erfolgreich aktualisiert (PKCE)', { userId: data.user.id });
        }
        
        // Legacy-Flow (mit Session)
        else if (req.session.userId) {
            logger.info('🔄 [RESET-PASSWORD] Legacy-Flow Passwort-Update');
            
            // Passwort aktualisieren
            const { data, error } = await supabase.auth.updateUser({
                password: password
            });

            if (error) {
                logger.error('❌ [RESET-PASSWORD] updateUser fehlgeschlagen', { error: error.message });
                return res.render('auth/reset-password', { 
                    error: 'Passwort konnte nicht aktualisiert werden: ' + error.message,
                    email: req.body.email || null
                });
            }

            logger.info('✅ [RESET-PASSWORD] Passwort erfolgreich aktualisiert (Legacy)', { userId: data.user.id });
        }
        
        else {
            logger.error('❌ [RESET-PASSWORD] Keine gültige Session oder Tokens');
            return res.render('auth/reset-password', { 
                error: 'Keine gültige Sitzung. Bitte fordern Sie einen neuen Link an.',
                email: req.body.email || null
            });
        }

        // Erfolg: Weiterleitung zum Dashboard
        logger.info('🎉 [RESET-PASSWORD] Passwort-Reset erfolgreich abgeschlossen');
        return res.redirect('/dashboard?success=Passwort wurde erfolgreich geändert');

    } catch (error) {
        logger.error('💥 [RESET-PASSWORD] Route unerwarteter Fehler', { error: error.message });
        return res.render('auth/reset-password', { 
            error: 'Technischer Fehler beim Aktualisieren des Passworts. Bitte versuchen Sie es erneut.',
            email: req.body.email || null
        });
    }
});

module.exports = router;


