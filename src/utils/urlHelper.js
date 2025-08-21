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
    return {
        confirm: `${baseUrl}/auth/confirm`,
        resetPassword: `${baseUrl}/auth/reset-password`,
        login: `${baseUrl}/auth/login`,
        register: `${baseUrl}/auth/register`
    };
};

module.exports = {
    getCurrentUrl,
    getAuthUrls
};
