import { createClient } from '@supabase/supabase-js';

// Hardcoded public credentials for zero-fail deployment
const supabaseUrl = 'https://npsczmdndbegqftdrwkn.supabase.co';
const supabaseAnonKey = 'YOUR_SUPABASE_ANON_KEY_HERE';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);