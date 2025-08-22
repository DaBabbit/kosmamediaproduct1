/**
 * Automatische URL-Erkennung für Vercel
 * Verhindert, dass bei jedem Deployment die URLs manuell angepasst werden müssen
 */

const getCurrentUrl = (req) => {
    // Wenn BASE_URL als Umgebungsvariable gesetzt ist, verwende diese
    if (process.env.BASE_URL) {
        return process.env.BASE_URL;
    }
    
    // Fallback auf aktuelle Request-URL (funktioniert in Vercel)
    if (req && req.headers && req.headers.host) {
        const protocol = req.headers['x-forwarded-proto'] || req.protocol || 'https';
        return `${protocol}://${req.headers.host}`;
    }
    
    // Fallback auf Vercel-Domain (bleibt konstant)
    return 'https://kosmamediaproduct1.vercel.app';
};

const getAuthUrls = (req) => {
    const baseUrl = getCurrentUrl(req);
    
    // Für Passwort-Reset verwenden wir die aktuelle Domain
    const resetPasswordUrl = `${baseUrl}/auth/reset-password`;
    
    console.log('🔗 Auth-URLs generiert:', {
        baseUrl,
        resetPasswordUrl,
        headers: req?.headers?.host,
        protocol: req?.headers?.['x-forwarded-proto'] || req?.protocol
    });
    
    return {
        confirm: `${baseUrl}/auth/confirm`,
        resetPassword: resetPasswordUrl,
        login: `${baseUrl}/auth/login`,
        register: `${baseUrl}/auth/register`
    };
};

module.exports = {
    getCurrentUrl,
    getAuthUrls
};
