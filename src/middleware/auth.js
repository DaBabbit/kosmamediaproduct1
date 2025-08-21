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

        // Prüfe Session
        if (!req.session.userId) {
            logger.warn('Auth-Middleware: Keine Session', { 
                url: req.url,
                sessionId: req.sessionID,
                session: req.session
            });
            return res.redirect('/auth/login');
        }

        logger.session('Session gefunden', { 
            sessionId: req.sessionID,
            userId: req.session.userId,
            userEmail: req.session.userEmail,
            sessionData: req.session
        });

        // Prüfe Supabase-Token (falls vorhanden)
        const token = req.cookies['sb-access-token'];
        
        if (token) {
            logger.auth('Supabase-Token gefunden', { 
                tokenLength: token.length,
                hasToken: !!token
            });
            
            try {
                const { data: { user }, error } = await supabase.auth.getUser(token);
                
                if (error || !user) {
                    logger.error('Token-Validierung fehlgeschlagen', { 
                        error: error?.message,
                        hasUser: !!user,
                        tokenLength: token.length
                    });
                    res.clearCookie('sb-access-token');
                    return res.redirect('/auth/login');
                }
                
                logger.auth('Token-Validierung erfolgreich', { 
                    userId: user.id,
                    email: user.email,
                    emailConfirmed: user.email_confirmed_at
                });
                
                req.user = user;
            } catch (error) {
                logger.error('Token-Validierung unerwarteter Fehler', { 
                    error: error.message,
                    stack: error.stack,
                    tokenLength: token.length
                });
                res.clearCookie('sb-access-token');
                return res.redirect('/auth/login');
            }
        } else {
            logger.session('Verwende Session-Daten (kein Token)', { 
                sessionId: req.sessionID,
                userId: req.session.userId,
                userEmail: req.session.userEmail
            });
            
            // Verwende Session-Daten
            req.user = {
                id: req.session.userId,
                email: req.session.userEmail
            };
        }
        
        logger.auth('Auth-Middleware erfolgreich', { 
            userId: req.user.id,
            email: req.user.email,
            url: req.url,
            sessionId: req.sessionID
        });
        
        next();
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
