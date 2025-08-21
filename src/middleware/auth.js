const supabase = require('../config/supabase');

const requireAuth = async (req, res, next) => {
    try {
        // Prüfe Session
        if (!req.session.userId) {
            return res.redirect('/auth/login');
        }

        // Prüfe Supabase-Token (falls vorhanden)
        const token = req.cookies['sb-access-token'];
        
        if (token) {
            try {
                const { data: { user }, error } = await supabase.auth.getUser(token);
                
                if (error || !user) {
                    res.clearCookie('sb-access-token');
                    return res.redirect('/auth/login');
                }
                
                req.user = user;
            } catch (error) {
                console.error('Token-Validierung Fehler:', error);
                res.clearCookie('sb-access-token');
                return res.redirect('/auth/login');
            }
        } else {
            // Verwende Session-Daten
            req.user = {
                id: req.session.userId,
                email: req.session.userEmail
            };
        }
        
        next();
    } catch (error) {
        console.error('Auth-Middleware Fehler:', error);
        return res.redirect('/auth/login');
    }
};

module.exports = requireAuth;
