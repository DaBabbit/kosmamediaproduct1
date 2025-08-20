const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware für JSON-Parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Statische Dateien (CSS, JS, Bilder)
app.use(express.static(path.join(__dirname, 'public')));

// View Engine für Templates
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Basis-Route
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
});

module.exports = app;
