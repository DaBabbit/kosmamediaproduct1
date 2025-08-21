const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('❌ Supabase-Umgebungsvariablen fehlen!');
    console.error('Bitte setzen Sie SUPABASE_URL und SUPABASE_ANON_KEY in Ihrer .env-Datei');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

console.log('✅ Supabase-Client erfolgreich initialisiert');
console.log(`🌐 URL: ${supabaseUrl}`);

module.exports = supabase;
