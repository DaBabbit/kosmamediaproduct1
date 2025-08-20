# KosmaMedia Product 1 🚀

Eine moderne Webanwendung, gebaut mit Node.js, Express.js, Tailwind CSS und DaisyUI.

## ✨ Features

- 🎨 Moderne, responsive Benutzeroberfläche
- 🌙 Dark/Light Mode Toggle
- 📱 Mobile-first Design
- ⚡ Schnelle Performance
- 🔧 Einfach zu erweitern
- 🚀 Vercel-ready

## 🛠️ Technologien

- **Backend**: Node.js, Express.js
- **Frontend**: HTML, CSS, JavaScript
- **Styling**: Tailwind CSS, DaisyUI
- **Templates**: EJS
- **Development**: Nodemon

## 📁 Projektstruktur

```
kosmamediaproduct1/
├── src/
│   ├── app.js              # Hauptanwendungsdatei
│   ├── routes/             # API-Routen
│   ├── views/              # HTML-Templates (EJS)
│   ├── public/             # Statische Dateien
│   │   ├── css/            # Stylesheets
│   │   ├── js/             # JavaScript
│   │   └── images/         # Bilder
│   ├── middleware/         # Express-Middleware
│   └── config/             # Konfigurationsdateien
├── package.json            # Projektabhängigkeiten
├── tailwind.config.js      # Tailwind-Konfiguration
└── README.md               # Diese Datei
```

## 🚀 Installation

1. **Repository klonen**
   ```bash
   git clone https://github.com/DaBabbit/kosmamediaproduct1.git
   cd kosmamediaproduct1
   ```

2. **Abhängigkeiten installieren**
   ```bash
   npm install
   ```

3. **CSS bauen**
   ```bash
   npm run build:css
   ```

4. **Entwicklungsserver starten**
   ```bash
   npm run dev
   ```

5. **Im Browser öffnen**
   ```
   http://localhost:3000
   ```

## 📝 Verfügbare Scripts

- `npm start` - Produktionsserver starten
- `npm run dev` - Entwicklungsserver mit Nodemon
- `npm run build:css` - CSS mit Tailwind bauen (Watch-Modus)
- `npm run build` - CSS für Produktion bauen (minifiziert)

## 🎨 Anpassungen

### Farben ändern
Bearbeite `tailwind.config.js`:
```javascript
theme: {
  extend: {
    colors: {
      primary: '#3B82F6',    // Hauptfarbe
      secondary: '#10B981',  // Sekundärfarbe
      accent: '#F59E0B'      // Akzentfarbe
    }
  }
}
```

### Neue Seiten hinzufügen
1. Template in `src/views/` erstellen
2. Route in `src/app.js` hinzufügen
3. Navigation aktualisieren

## 🌐 Deployment auf Vercel

1. **Projekt auf GitHub pushen**
   ```bash
   git add .
   git commit -m "Initial commit"
   git push origin main
   ```

2. **Vercel verbinden**
   - Gehe zu [vercel.com](https://vercel.com)
   - Verbinde dein GitHub-Repository
   - Vercel erkennt automatisch, dass es ein Node.js-Projekt ist

3. **Build-Einstellungen**
   - **Build Command**: `npm run build`
   - **Output Directory**: `src/public`
   - **Install Command**: `npm install`

4. **Umgebungsvariablen** (falls benötigt)
   - `NODE_ENV=production`
   - `PORT=3000`

## 🔧 Entwicklung

### Neue Features hinzufügen
1. Feature in `src/app.js` implementieren
2. Template in `src/views/` erstellen
3. Styles in `src/public/css/style.css` hinzufügen
4. Tests schreiben (später)

### Code-Struktur
- **Routes**: API-Endpunkte in `src/routes/`
- **Middleware**: Zwischenschichten in `src/middleware/`
- **Views**: HTML-Templates in `src/views/`
- **Public**: Statische Dateien in `src/public/`

## 📱 Responsive Design

Die Anwendung ist vollständig responsive und funktioniert auf:
- 📱 Mobilgeräte
- 💻 Desktop-Computer
- 📱 Tablets
- 🖥️ Große Bildschirme

## 🌙 Themes

- **Light Mode**: Standard-Theme
- **Dark Mode**: Dunkles Theme
- **Cupcake**: Süßes Theme
- **Cyberpunk**: Futuristisches Theme

## 🤝 Beitragen

1. Fork das Repository
2. Erstelle einen Feature-Branch
3. Committe deine Änderungen
4. Push zum Branch
5. Erstelle einen Pull Request

## 📄 Lizenz

Dieses Projekt steht unter der ISC-Lizenz.

## 🆘 Support

Bei Fragen oder Problemen:
- Erstelle ein Issue auf GitHub
- Kontaktiere den Entwickler

---

**Viel Spaß beim Entwickeln! 🚀**
