import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// ============================================
// PASTE YOUR SUPABASE CREDENTIALS BELOW
// ============================================
const SUPABASE_URL = 'https://qbgcpwmqjwwgiginelqe.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_ZSqBLgYmunmSRYGrOPz5hg_YZvaYECl';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
