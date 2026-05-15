import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://vqgfdktovhqkgxzmalyr.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZxZ2Zka3Rvdmhxa2d4em1hbHlyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg0MDY1NTcsImV4cCI6MjA5Mzk4MjU1N30.0W6PfcbTtEInPsrcBpN92q-JRL6yryjsyHhM8rXbIOM'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)