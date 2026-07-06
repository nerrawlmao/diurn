import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

export const isSupabaseConfigured = Boolean(url && anonKey)

/**
 * The app gates all authenticated screens behind `isSupabaseConfigured`
 * (see App.tsx), so modules that import `supabase` only ever run when
 * the client exists.
 */
export const supabase: SupabaseClient = isSupabaseConfigured
  ? createClient(url!, anonKey!)
  : (null as unknown as SupabaseClient)

export const IMAGE_BUCKET = 'diary-images'
