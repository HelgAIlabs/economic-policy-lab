import { createClient } from "@supabase/supabase-js";
const SUPABASE_URL =
  "https://ucjswqnoidsyfouwbbnp.supabase.co";
const SUPABASE_PUBLISHABLE_KEY =
  "sb_publishable_DLn5wDAnjCvfAwTc8M1i5w_0sJX_jS6";
export const supabase = createClient(
  SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY
);
export { SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY };
