import { createClient } from '@supabase/supabase-js';

// Type assertion prevents TypeScript build errors on import.meta.env
const env = (import.meta as any).env || {};

const supabaseUrl = env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = env.VITE_SUPABASE_ANON_KEY || 'placeholder-anon-key';

if (!env.VITE_SUPABASE_URL || !env.VITE_SUPABASE_ANON_KEY) {
  console.warn('⚠️ Supabase environment variables missing!');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);