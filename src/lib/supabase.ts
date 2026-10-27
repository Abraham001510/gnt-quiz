import { createClient } from '@supabase/supabase-js';

// Hardcoded public credentials for zero-fail deployment
const supabaseUrl = 'https://npsczmdndbegqftdrwkn.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5wc2N6bWRuZGJlZ3FmdGRyd2tuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTI3NTg2NTksImV4cCI6MjEwODMzNDY1OX0.2T0f1Gx154vL4nW7QYEpB-kXiimhOYEZE_rH7ckps1o';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);