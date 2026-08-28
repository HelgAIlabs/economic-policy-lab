import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

export const SUPABASE_URL = 'https://ucjswqnoidsyfouwbbnp.supabase.co';
export const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_DLn5wDAnjCvfAwTc8M1i5w_0sJX_jS6';
export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
