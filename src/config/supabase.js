// Mock Supabase für Demo-Zwecke
const createMockSupabase = () => ({
    auth: {
        signInWithOtp: async ({ email }) => {
            console.log(`Mock: Magic-Link würde an ${email} gesendet werden`);
            return { error: null };
        },
        getUser: async (token) => {
            // Mock-Benutzer für Demo
            return {
                data: {
                    user: {
                        id: 'mock-user-id',
                        email: 'demo@kosmamedia.com',
                        created_at: new Date().toISOString()
                    }
                },
                error: null
            };
        }
    }
});

let supabase;

try {
    const { createClient } = require('@supabase/supabase-js');
    
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
        console.log('⚠️  Supabase-Umgebungsvariablen fehlen - verwende Mock-Modus');
        supabase = createMockSupabase();
    } else {
        supabase = createClient(supabaseUrl, supabaseAnonKey);
        console.log('✅ Supabase-Client erfolgreich initialisiert');
    }
} catch (error) {
    console.log('⚠️  Supabase-Paket nicht verfügbar - verwende Mock-Modus');
    supabase = createMockSupabase();
}

module.exports = supabase;
