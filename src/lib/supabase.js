import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://fqaqwoawbixvvovkgirc.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZxYXF3b2F3Yml4dnZvdmtnaXJjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQzNzk2MjcsImV4cCI6MjA2OTk1NTYyN30.YNZz_ZnMVI1aVSmDp4mVkfZ-vOYjjvsZEbkRXe-5C24'

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    storage: localStorage,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
})
