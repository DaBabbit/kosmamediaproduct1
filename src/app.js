// Lade Umgebungsvariablen aus .env-Datei
require('dotenv').config();

const express = require('express');
const path = require('path');
const session = require('express-session');
const cookieParser = require('cookie-parser');

// Routen importieren
const authRoutes = require('./routes/auth');
const dashboardRoutes = require('./routes/dashboard');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware für JSON-Parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Cookie-Parser und Session-Middleware
app.use(cookieParser());
app.use(session({
    secret: process.env.SESSION_SECRET || 'kosmamedia-secret-key',
    resave: true, // Für Vercel auf true setzen
    saveUninitialized: true, // Für Vercel auf true setzen
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000, // 24 Stunden
        sameSite: 'lax' // Für bessere Kompatibilität
    },
    name: 'kosmamedia-session' // Eindeutiger Session-Name
}));

// Statische Dateien (CSS, JS, Bilder)
app.use(express.static(path.join(__dirname, 'public')));

// View Engine für Templates
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Session-Debugging Middleware
app.use((req, res, next) => {
    console.log(`[SESSION-DEBUG] ${req.method} ${req.url}`, {
        sessionId: req.sessionID,
        hasSession: !!req.session,
        userId: req.session?.userId,
        userEmail: req.session?.userEmail
    });
    next();
});

// Routen registrieren
app.use('/auth', authRoutes);
app.use('/dashboard', dashboardRoutes);

// Landing Page (öffentlich)
app.get('/', (req, res) => {
    res.render('index', { 
        title: 'KosmaMedia Product 1',
        message: 'Willkommen bei deiner neuen Anwendung!'
    });
});

// API-Route Beispiel
app.get('/api/status', (req, res) => {
    res.json({ 
        status: 'success', 
        message: 'Server läuft!',
        timestamp: new Date().toISOString()
    });
});

// 404-Handler
app.use((req, res) => {
    res.status(404).render('404', { title: 'Seite nicht gefunden' });
});

// Server starten
app.listen(PORT, () => {
    console.log(`🚀 Server läuft auf http://localhost:${PORT}`);
    console.log(`📁 Öffne Cursor und navigiere zu diesem Ordner: ${__dirname}`);
    console.log(`🏠 Landing Page: http://localhost:${PORT}`);
    console.log(`🔐 Login: http://localhost:${PORT}/auth/login`);
    console.log(`📊 Dashboard: http://localhost:${PORT}/dashboard`);
});

module.exports = app;
