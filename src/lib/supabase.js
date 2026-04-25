import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

// Use service_role key if available (for server-side admin actions), otherwise use anon key
const keyToUse = supabaseServiceKey || supabaseAnonKey;

export const supabase = createClient(supabaseUrl, keyToUse)
