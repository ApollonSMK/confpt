import { createServerClient } from '@supabase/ssr'

// This function is for SERVER-SIDE use when you need to bypass RLS.
// It uses the service role key.
export const createServiceRoleClient = () => {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is not set in .env.local')
  }

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: {}, // No cookies needed for service role
    }
  );
}
