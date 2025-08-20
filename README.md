# KosmaMedia Product 1 🚀

Eine moderne Krypto-Trading-Plattform mit Magic-Link-Authentifizierung, Multi-Tenant-Architektur und KI-gestützten Funktionen.

## ✨ Features

- 🔐 **Magic-Link-Authentifizierung** - Passwortlose Anmeldung per E-Mail
- 🏢 **Multi-Tenant-Architektur** - Unterstützung für mehrere Organisationen
- 🎨 **Modernes UI/UX** - DaisyUI + Tailwind CSS für ein sauberes Design
- 📱 **Responsive Design** - Funktioniert auf allen Geräten
- 🔒 **Row Level Security (RLS)** - Sichere Datenzugriffskontrolle
- 🚀 **Vercel-ready** - Einfache Bereitstellung
- 🔌 **N8N Integration** - Bereit für Workflow-Automatisierung

## 🛠️ Technologie-Stack

- **Backend**: Node.js + Express.js
- **Frontend**: EJS Templates + DaisyUI + Tailwind CSS
- **Datenbank**: Supabase (PostgreSQL)
- **Authentifizierung**: Supabase Auth mit Magic-Links
- **Styling**: DaisyUI Components + Custom CSS
- **Deployment**: Vercel (vorbereitet)

## 📋 Voraussetzungen

- Node.js (Version 16 oder höher)
- npm oder yarn
- Supabase-Konto und Projekt
- E-Mail-Service (für Magic-Links)

## 🚀 Installation

### 1. Repository klonen
```bash
git clone <repository-url>
cd kosmamediaproduct1
```

### 2. Abhängigkeiten installieren
```bash
npm install
```

### 3. Umgebungsvariablen konfigurieren
```bash
cp env.example .env
```

Bearbeiten Sie die `.env`-Datei und fügen Sie Ihre Supabase-Credentials hinzu:
```env
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SESSION_SECRET=your-super-secret-session-key
NODE_ENV=development
```

### 4. Supabase-Datenbank einrichten

1. Erstellen Sie ein neues Supabase-Projekt
2. Führen Sie das SQL-Schema aus `supabase/schema.sql` in der SQL-Editor aus
3. Konfigurieren Sie E-Mail-Templates für Magic-Links in den Supabase-Einstellungen

### 5. Entwicklungsserver starten
```bash
npm run dev
```

Die Anwendung läuft dann unter: http://localhost:3000

## 🔐 Authentifizierung

### Magic-Link-Login
1. Besuchen Sie `/auth/login`
2. Geben Sie Ihre E-Mail-Adresse ein
3. Sie erhalten einen Magic-Link per E-Mail
4. Klicken Sie auf den Link, um sich automatisch anzumelden

### Geschützte Routen
- `/dashboard` - Nur für eingeloggte Benutzer zugänglich
- Alle anderen Routen sind öffentlich

## 🏗️ Datenbankstruktur

### Tabellen

#### `users`
- Erweitert Supabase `auth.users`
- Speichert Benutzerprofile und Einstellungen

#### `tenants`
- Organisationen/Teams
- Unterstützt verschiedene Abonnement-Pläne

#### `tenant_members`
- Verknüpfung zwischen Benutzern und Tenants
- Rollenbasierte Berechtigungen (admin, user, viewer)

### Row Level Security (RLS)
- Benutzer können nur ihre eigenen Daten sehen
- Tenant-Mitglieder können nur ihre Tenant-Daten einsehen
- Admins haben erweiterte Berechtigungen

## 🎨 UI-Komponenten

### Login-Seite
- Modernes Gradient-Design
- Glassmorphism-Effekte
- Responsive Layout

### Dashboard
- Sidebar-Navigation im Stil des Screenshots
- Header mit Benutzer-Avatar und Aktionen
- Statistik-Karten mit Hover-Effekten
- Platzhalter für zukünftige Funktionen

## 🔌 N8N Integration

Die Plattform ist vorbereitet für N8N-Integration:

- **Webhook-Endpunkte** für externe Systeme
- **Event-basierte Architektur** für Workflow-Trigger
- **API-Endpunkte** für Datenzugriff
- **Webhook-Authentifizierung** über API-Keys

## 🚀 Deployment

### Vercel
```bash
npm run build
vercel --prod
```

### Andere Plattformen
Die Anwendung kann auf jeder Node.js-fähigen Plattform bereitgestellt werden.

## 📁 Projektstruktur

```
kosmamediaproduct1/
├── src/
│   ├── app.js                 # Hauptanwendung
│   ├── config/
│   │   └── supabase.js        # Supabase-Konfiguration
│   ├── middleware/
│   │   └── auth.js            # Authentifizierungs-Middleware
│   ├── routes/
│   │   ├── auth.js            # Authentifizierungs-Routen
│   │   └── dashboard.js       # Dashboard-Routen
│   ├── views/
│   │   ├── auth/
│   │   │   └── login.ejs      # Login-Seite
│   │   └── dashboard/
│   │       └── index.ejs      # Dashboard-Hauptseite
│   └── public/                # Statische Dateien
├── supabase/
│   └── schema.sql             # Datenbankschema
├── package.json
├── tailwind.config.js
├── vercel.json
└── README.md
```

## 🔧 Entwicklung

### Verfügbare Scripts
- `npm start` - Produktionsserver starten
- `npm run dev` - Entwicklungsserver mit Nodemon
- `npm run build` - Build für Produktion

### Code-Struktur
- **MVC-Pattern** mit Express.js
- **Middleware-basierte** Authentifizierung
- **Template-basiertes** Frontend mit EJS
- **Modulare** Routen-Struktur

## 🚧 Nächste Schritte

- [ ] Vollständiges Dashboard mit Trading-Funktionen
- [ ] Echtzeit-Marktdaten-Integration
- [ ] KI-gestützte Trading-Strategien
- [ ] N8N-Workflow-Integration
- [ ] Erweiterte Tenant-Verwaltung
- [ ] Mobile App

## 🤝 Beitragen

1. Fork das Repository
2. Erstellen Sie einen Feature-Branch
3. Committen Sie Ihre Änderungen
4. Pushen Sie den Branch
5. Öffnen Sie einen Pull Request

## 📄 Lizenz

Dieses Projekt ist unter der ISC-Lizenz lizenziert.

## 📞 Support

Bei Fragen oder Problemen erstellen Sie bitte ein Issue im Repository.

---

**Entwickelt mit ❤️ von KosmaMedia**
