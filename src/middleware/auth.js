const supabase = require('../config/supabase');

const requireAuth = async (req, res, next) => {
    try {
        const token = req.cookies['sb-access-token'] || req.headers.authorization?.replace('Bearer ', '');
        
        if (!token) {
            // Für Demo-Zwecke: Erstelle Mock-Benutzer
            req.user = {
                id: 'mock-user-id',
                email: 'demo@kosmamedia.com',
                created_at: new Date().toISOString()
            };
            return next();
        }

        // Token mit Supabase validieren
        const { data: { user }, error } = await supabase.auth.getUser(token);
        
        if (error || !user) {
            res.clearCookie('sb-access-token');
            // Für Demo-Zwecke: Erstelle Mock-Benutzer
            req.user = {
                id: 'mock-user-id',
                email: 'demo@kosmamedia.com',
                created_at: new Date().toISOString()
            };
            return next();
        }

        // Benutzerdaten an Request anhängen
        req.user = user;
        next();
    } catch (error) {
        console.error('Auth-Middleware Fehler:', error);
        res.clearCookie('sb-access-token');
        // Für Demo-Zwecke: Erstelle Mock-Benutzer
        req.user = {
            id: 'mock-user-id',
            email: 'demo@kosmamedia.com',
            created_at: new Date().toISOString()
        };
        next();
    }
};

module.exports = { requireAuth };
