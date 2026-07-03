import { createClient } from '@supabase/supabase-js';
import config from '../config/index.js';

const supabaseUrl = config.supabase.url;
const supabaseAnonKey = config.supabase.anonKey;
const supabaseServiceKey = config.supabase.serviceRoleKey;

function createSupabaseClient(url, key) {
  if (!url || !key) {
    return null;
  }
  return createClient(url, key);
}

export const supabase = createSupabaseClient(supabaseUrl, supabaseAnonKey);
export const supabaseAdmin = createSupabaseClient(supabaseUrl, supabaseServiceKey || supabaseAnonKey);

export function requireSupabase() {
  if (!supabase) {
    throw new Error('Supabase is not configured. Set SUPABASE_URL and SUPABASE_ANON_KEY in .env');
  }
  return supabase;
}

export function requireSupabaseAdmin() {
  if (!supabaseAdmin) {
    throw new Error('Supabase admin is not configured. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env');
  }
  return supabaseAdmin;
}
