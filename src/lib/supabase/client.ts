import { createBrowserClient as createSupabaseBrowserClient } from '@supabase/ssr'

// This function is intended for CLIENT COMPONENTS.
export const createClient = () =>
  createSupabaseBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      db: {
        schema: 'public',
      },
    }
  )
