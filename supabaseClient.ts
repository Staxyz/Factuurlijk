import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://pprqqanddnixolmbwile.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBwcnFxYW5kZG5peG9sbWJ3aWxlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIxNTA1MDQsImV4cCI6MjA3NzcyNjUwNH0.BKM3Sx9KmJljS37xPEJq_kwPIfDQbaLcugEkH3GAEyg';

// In een productie-applicatie is het beter om deze sleutels in environment variables op te slaan.
// Bijvoorbeeld met Vite:
// const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
// const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseKey);
