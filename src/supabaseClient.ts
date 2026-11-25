// ROCN Pad — Supabase client (shared ROCN backend)
// Publishable key is browser-safe by design (RLS enforces access).
// Never put a secret/service_role key here.
import { createClient } from '@supabase/supabase-js';

export const SUPABASE_URL = 'https://wxftpsijhgrqogszmavr.supabase.co';
export const SUPABASE_ANON_KEY = 'sb_publishable_UIwMIqJ_vYvZX3J2Q2JhrA_DiS9jzdp';
export const ROCNPAD_URL = 'https://rocnpad.559rocn.workers.dev/';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export async function logEvent(
  appName: string,
  eventName: string,
  metadata: Record<string, unknown> = {},
) {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError || !user) {
    console.warn('Event skipped: no authenticated user.');
    return { error: userError || new Error('Not signed in') };
  }
  const { error } = await supabase.from('app_events').insert({
    user_id: user.id,
    app: appName,
    event: eventName,
    metadata,
  });
  if (error) console.error('Event log failed:', error.message);
  return { error };
}
