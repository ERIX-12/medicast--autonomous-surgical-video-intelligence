/**
 * MediCast — Supabase Client
 *
 * Singleton Supabase client used for Auth, Realtime, and database queries.
 * The anon key is publishable-safe; never put secret keys here.
 */
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://ijtpwwbfuukouqpdvrtp.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlqdHB3d2JmdXVrb3VxcGR2cnRwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI5MjY2NDMsImV4cCI6MjA5ODUwMjY0M30.P3_JrMavXg4b2Ypy9os-v7fjTzz_OJUOKRurOGs5DZI';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    flowType: 'implicit',
  },
});