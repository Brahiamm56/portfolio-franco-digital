import { createClient } from '@supabase/supabase-js'
import type { Database } from './database.types'

const projectUrl = import.meta.env.VITE_SUPABASE_URL
const publishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY

export const supabase = projectUrl && publishableKey
  ? createClient<Database>(projectUrl, publishableKey)
  : null

export const isSupabaseConfigured = Boolean(supabase)
