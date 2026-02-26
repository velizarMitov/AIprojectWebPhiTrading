import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// ============================================
// PASTE YOUR SUPABASE CREDENTIALS BELOW
// ============================================
const SUPABASE_URL = 'https://qbgcpwmqjwwgiginelqe.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFiZ2Nwd21xand3Z2lnaW5lbHFlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE5NDkzOTMsImV4cCI6MjA4NzUyNTM5M30.ep-1_DuvdWx2S5ZznoIOUKVct6rhtVF3mSz0FIX4190';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
