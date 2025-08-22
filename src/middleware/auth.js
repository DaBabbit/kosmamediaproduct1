const supabase = require('../config/supabase');
const logger = require('../utils/logger');

const requireAuth = async (req, res, next) => {
    try {
        logger.auth('Auth-Middleware gestartet', {
            url: req.url,
            method: req.method,
            sessionId: req.sessionID,
            hasSession: !!req.session,
            sessionData: req.session,
            cookies: req.cookies
        });

        // Prüfe zuerst Supabase-Token (Priorität für Vercel)
        const accessToken = req.cookies['sb-access-token'];
        const refreshToken = req.cookies['sb-refresh-token'];

        if (accessToken) {
            logger.auth('Supabase-Token gefunden', {
                tokenLength: accessToken.length,
                hasToken: !!accessToken,
                hasRefreshToken: !!refreshToken
            });

            try {
                // Token validieren
                const { data: { user }, error } = await supabase.auth.getUser(accessToken);

                if (error || !user) {
                    logger.warn('Token-Validierung fehlgeschlagen', {
                        error: error?.message,
                        hasUser: !!user,
                        tokenLength: accessToken.length
                    });

                    // Token ist ungültig - löschen und neu versuchen
                    res.clearCookie('sb-access-token');
                    res.clearCookie('sb-refresh-token');

                    // Fallback auf Express-Session
                    if (req.session.userId) {
                        logger.session('Fallback auf Express-Session', {
                            sessionId: req.sessionID,
                            userId: req.session.userId,
                            userEmail: req.session.userEmail
                        });

                        req.user = {
                            id: req.session.userId,
                            email: req.session.userEmail
                        };

                        logger.auth('Auth-Middleware erfolgreich (Express-Session)', {
                            userId: req.user.id,
                            email: req.user.email,
                            url: req.url,
                            sessionId: req.sessionID
                        });

                        return next();
                    }

                    return res.redirect('/auth/login');
                }

                logger.auth('Token-Validierung erfolgreich', {
                    userId: user.id,
                    email: user.email,
                    emailConfirmed: user.email_confirmed_at
                });

                req.user = user;

                // Express-Session synchronisieren
                req.session.userId = user.id;
                req.session.userEmail = user.email;

                logger.auth('Auth-Middleware erfolgreich (Supabase-Token)', {
                    userId: req.user.id,
                    email: req.user.email,
                    url: req.url,
                    sessionId: req.sessionID
                });

                return next();
            } catch (error) {
                logger.error('Token-Validierung unerwarteter Fehler', {
                    error: error.message,
                    stack: error.stack,
                    tokenLength: accessToken.length
                });

                res.clearCookie('sb-access-token');
                res.clearCookie('sb-refresh-token');

                // Fallback auf Express-Session
                if (req.session.userId) {
                    logger.session('Fallback auf Express-Session nach Token-Fehler', {
                        sessionId: req.sessionID,
                        userId: req.session.userId,
                        userEmail: req.session.userEmail
                    });

                    req.user = {
                        id: req.session.userId,
                        email: req.session.userEmail
                    };

                    logger.auth('Auth-Middleware erfolgreich (Express-Session Fallback)', {
                        userId: req.user.id,
                        email: req.user.email,
                        url: req.url,
                        sessionId: req.sessionID
                    });

                    return next();
                }

                return res.redirect('/auth/login');
            }
        } else {
            logger.session('Kein Supabase-Token - verwende Express-Session', {
                sessionId: req.sessionID,
                hasSession: !!req.session,
                userId: req.session?.userId,
                userEmail: req.session?.userEmail
            });

            // Fallback auf Express-Session
            if (!req.session.userId) {
                logger.warn('Auth-Middleware: Keine Session', {
                    url: req.url,
                    sessionId: req.sessionID,
                    session: req.session
                });
                return res.redirect('/auth/login');
            }

            logger.session('Express-Session gefunden', {
                sessionId: req.sessionID,
                userId: req.session.userId,
                userEmail: req.session.userEmail,
                sessionData: req.session
            });

            req.user = {
                id: req.session.userId,
                email: req.session.userEmail
            };

            logger.auth('Auth-Middleware erfolgreich (Express-Session)', {
                userId: req.user.id,
                email: req.user.email,
                url: req.url,
                sessionId: req.sessionID
            });

            return next();
        }

    } catch (error) {
        logger.error('Auth-Middleware unerwarteter Fehler', {
            error: error.message,
            stack: error.stack,
            url: req.url,
            sessionId: req.sessionID
        });
        return res.redirect('/auth/login');
    }
};

module.exports = requireAuth;
