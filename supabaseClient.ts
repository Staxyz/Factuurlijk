import { createClient } from '@supabase/supabase-js';

// Use environment variables for security
// Create a .env file in the root directory with:
// VITE_SUPABASE_URL=your_supabase_url
// VITE_SUPABASE_ANON_KEY=your_anon_key
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://pprqqanddnixolmbwile.supabase.co';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBwcnFxYW5kZG5peG9sbWJ3aWxlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIxNTA1MDQsImV4cCI6MjA3NzcyNjUwNH0.BKM3Sx9KmJljS37xPEJq_kwPIfDQbaLcugEkH3GAEyg';

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file.');
}

export const supabase = createClient(supabaseUrl, supabaseKey);
