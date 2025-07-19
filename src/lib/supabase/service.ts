import { createClient } from '@supabase/supabase-js'

// This function is for SERVER-SIDE use when you need to bypass RLS.
// It uses the service role key.
// NOTE: We are using createClient from supabase-js directly to avoid any
// dependencies on cookies or next/headers, as this client is for server-side
// logic that doesn't involve a user session.
export const createServiceRoleClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    throw new Error('Supabase URL or Service Role Key is not set in .env.local');
  }

  return createClient(
    supabaseUrl,
    supabaseServiceRoleKey,
    {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    }
  );
}
