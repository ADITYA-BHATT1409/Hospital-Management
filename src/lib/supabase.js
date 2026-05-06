import { createClient } from '@supabase/supabase-js'

// IMPORTANT: Replace these with your actual Supabase project URL and anon key
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL !== 'YOUR_SUPABASE_URL' ? import.meta.env.VITE_SUPABASE_URL : 'https://placeholder.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY !== 'YOUR_SUPABASE_ANON_KEY' ? import.meta.env.VITE_SUPABASE_ANON_KEY : 'placeholder-key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
