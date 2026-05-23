// Shared Supabase configuration check.
// Import this in server actions and the proxy to decide whether to
// hit the real backend or fall back to mock data.

export const isSupabaseConfigured: boolean =
  Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL) &&
  !process.env.NEXT_PUBLIC_SUPABASE_URL!.includes('placeholder')
