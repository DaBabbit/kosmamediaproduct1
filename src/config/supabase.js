const { createClient } = require('@supabase/supabase-js');

// Umgebungserkennung
const isDevelopment = process.env.NODE_ENV === 'development';
const isProduction = process.env.NODE_ENV === 'production';

// Supabase-Konfiguration basierend auf Umgebung
let supabaseUrl, supabaseAnonKey;

if (isDevelopment) {
    // Lokale Entwicklung - verwende DEV-Supabase-Projekt
    supabaseUrl = process.env.SUPABASE_URL_DEV || process.env.SUPABASE_URL;
    supabaseAnonKey = process.env.SUPABASE_ANON_KEY_DEV || process.env.SUPABASE_ANON_KEY;
    console.log('🔧 Entwicklungsumgebung erkannt - verwende DEV-Supabase-Projekt');
} else if (isProduction) {
    // Produktion - verwende PROD-Supabase-Projekt
    supabaseUrl = process.env.SUPABASE_URL_PROD || process.env.SUPABASE_URL;
    supabaseAnonKey = process.env.SUPABASE_ANON_KEY_PROD || process.env.SUPABASE_ANON_KEY;
    console.log('🚀 Produktionsumgebung erkannt - verwende PROD-Supabase-Projekt');
} else {
    // Fallback
    supabaseUrl = process.env.SUPABASE_URL;
    supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
    console.log('⚠️  Standardumgebung - verwende Fallback-Supabase-Konfiguration');
}

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('❌ Supabase-Umgebungsvariablen fehlen!');
    console.error('');
    if (isDevelopment) {
        console.error('🔧 Für lokale Entwicklung (.env.local):');
        console.error('SUPABASE_URL_DEV=https://kosmamedia-dev.supabase.co');
        console.error('SUPABASE_ANON_KEY_DEV=your-dev-anon-key');
    } else if (isProduction) {
        console.error('🚀 Für Produktion (Vercel Environment Variables):');
        console.error('SUPABASE_URL_PROD=https://kosmamedia-prod.supabase.co');
        console.error('SUPABASE_ANON_KEY_PROD=your-prod-anon-key');
    }
    process.exit(1);
}

// Supabase-Client erstellen
const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        persistSession: true,
        autoRefreshToken: true
    }
});

console.log('✅ Supabase-Client erfolgreich initialisiert');
console.log(`🌐 URL: ${supabaseUrl}`);
console.log(`🔑 Umgebung: ${isDevelopment ? 'Entwicklung (localhost:3000)' : 'Produktion (Vercel)'}`);
console.log(`📱 Site URL: ${process.env.SITE_URL || 'Nicht gesetzt'}`);

module.exports = supabase;
