// Account self-service: data export + account deletion (ROCN Pad).
//
// "Your data is yours — delete it or take it with you in one click."
//
// WHERE THE DATA LIVES
// - Supabase (project wxftpsijhgrqogszmavr) holds ONLY the auth user,
//   public.profiles (Google profile) and public.app_events (action types).
//   No notes, no projects, no content of any kind — see storage.ts, which has
//   zero Supabase references for content.
// - ALL user content lives in the BROWSER ONLY: IndexedDB database
//   rocn_pad_vault_v1 (notes, projects, settings, recaps) with a localStorage
//   fallback (rocn_notes, rocn_projects, rocn_settings).
//
// That split is why both halves matter:
// - "Download my data" merges the Supabase snapshot (profile + activity)
//   with the full local vault export. An export without the vault would be
//   incomplete.
// - "Delete my account" deletes the auth user server-side (Edge Function
//   delete-account — profiles + app_events cascade) and THEN wipes the local
//   vault. Wiping local data first would be fake: a server failure would
//   leave the user signed in with nothing. Order matters.
//
// AUTH — there is NO password for these accounts (Google OAuth only), so a
// password field would be fake security. Re-authentication is an emailed
// 6-digit code: supabase.auth.reauthenticate() sends it,
// verifyOtp({ type: 'reauthentication' }) confirms it and upgrades the
// session to aal2, which the Edge Function requires.

import { supabase } from '../supabaseClient';
import { storage } from './storage';

export type AccountSnapshot = {
  account: {
    userId: string;
    email: string | undefined;
    fullName: string | undefined;
    avatarUrl: string | undefined;
    createdAt: string | undefined;
    provider: string;
  };
  profile: Record<string, unknown> | null;
  appEvents: Array<Record<string, unknown>>;
};

export async function getSignedInUser() {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user) throw new Error('You are not signed in.');
  return user;
}

/** Everything Supabase holds on this user: profile row + activity log. */
export async function getMySupabaseData(): Promise<AccountSnapshot> {
  const user = await getSignedInUser();

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .maybeSingle();
  if (profileError) throw new Error(`Could not read your profile: ${profileError.message}`);

  const { data: events, error: eventsError } = await supabase
    .from('app_events')
    .select('*')
    .eq('user_id', user.id)
    .eq('app', 'rocnpad')
    .order('created_at', { ascending: true });
  if (eventsError) throw new Error(`Could not read your activity log: ${eventsError.message}`);

  return {
    account: {
      userId: user.id,
      email: user.email,
      fullName:
        (user.user_metadata?.full_name as string | undefined) ??
        (user.user_metadata?.name as string | undefined),
      avatarUrl: user.user_metadata?.avatar_url as string | undefined,
      createdAt: user.created_at,
      provider: 'google',
    },
    profile: (profile ?? null) as Record<string, unknown> | null,
    appEvents: (events ?? []) as Array<Record<string, unknown>>,
  };
}

/**
 * One-click export of EVERYTHING ROCN Pad holds on the user: account +
 * profile + activity (Supabase) + the full local vault (notes, projects,
 * settings, recaps). Downloads as a JSON file. No manual steps.
 *
 * WARNING: the vault export includes saved API keys (Settings → AI Keys).
 * The file itself says so, and the UI must say so too.
 */
export async function downloadFullExport(): Promise<{ fileName: string; noteCount: number; projectCount: number }> {
  const snapshot = await getMySupabaseData();
  const vaultJson = await storage.exportAllJSON();
  const vault = JSON.parse(vaultJson) as Record<string, unknown>;

  const payload = {
    app: 'ROCN Pad',
    exportedAt: new Date().toISOString(),
    exportedBy: snapshot.account.email ?? snapshot.account.userId,
    warning:
      'PRIVATE — this file contains your notes, projects, and your saved API keys. Keep it somewhere safe and do not share it.',
    account: snapshot.account,
    profile: snapshot.profile,
    appEvents: snapshot.appEvents,
    vault,
  };

  const date = new Date().toISOString().slice(0, 10);
  const fileName = `rocnpad_my_data_${date}.json`;
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);

  const notes = vault.notes as unknown[] | undefined;
  const projects = vault.projects as unknown[] | undefined;
  return {
    fileName,
    noteCount: Array.isArray(notes) ? notes.length : 0,
    projectCount: Array.isArray(projects) ? projects.length : 0,
  };
}

/** Step 1 of re-auth: email the user a 6-digit code. Returns the address it went to. */
export async function sendReauthCode(): Promise<{ email: string }> {
  const user = await getSignedInUser();
  if (!user.email) throw new Error('Your account has no email address on file.');
  const { error } = await supabase.auth.reauthenticate();
  if (error) throw new Error(`Could not send the code: ${error.message}`);
  return { email: user.email };
}

/** Step 2 of re-auth: verify the emailed code and confirm the session upgraded to aal2. */
export async function verifyReauthCode(code: string): Promise<void> {
  const user = await getSignedInUser();
  if (!user.email) throw new Error('Your account has no email address on file.');
  const { error } = await supabase.auth.verifyOtp({
    email: user.email,
    token: code.trim(),
    type: 'reauthentication',
  });
  if (error) throw new Error(`That code did not work: ${error.message}`);

  const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  if (aal?.currentLevel !== 'aal2') {
    throw new Error('Your session did not upgrade after the code. Please request a new code and try again.');
  }
}

export type DeleteAccountOutcome = {
  ok: boolean;
  code?: string;
  message?: string;
  notDeployed?: boolean;
};

// NOTE: flat object type, not a discriminated union, on purpose. The app
// projects run tsc WITHOUT "strict", and without strictNullChecks TypeScript
// does not narrow discriminated unions at the call sites, so
// `result.message` after `if (!result.ok)` fails to compile. Callers must
// check `ok` first; failure results always carry code + message.

/**
 * Calls the delete-account Edge Function. Returns ok:true only when the
 * server confirms the auth user is deleted. On any failure the caller must
 * NOT wipe local data — report the reason instead.
 */
export async function requestAccountDeletion(): Promise<DeleteAccountOutcome> {
  const { data, error } = await supabase.functions.invoke('delete-account', { method: 'POST' });
  if (error) {
    const status = (error as { status?: number }).status;
    const context = (error as { context?: { error?: string; message?: string } }).context;
    if (status === 404) {
      return {
        ok: false,
        code: 'NOT_DEPLOYED',
        notDeployed: true,
        message:
          'The account-deletion service is not live yet. Your account and data are untouched — please use the email option on the account-deletion page instead.',
      };
    }
    if (context?.error === 'REAUTH_REQUIRED') {
      return {
        ok: false,
        code: 'REAUTH_REQUIRED',
        message: context.message ?? 'Please re-authenticate with a fresh code, then try again.',
      };
    }
    return { ok: false, code: 'DELETE_FAILED', message: error.message || 'Account deletion failed.' };
  }
  if (data && typeof data === 'object' && (data as { error?: string }).error) {
    const body = data as { error: string; message?: string };
    return { ok: false, code: body.error, message: body.message ?? 'Account deletion failed.' };
  }
  return { ok: true };
}

/**
 * Wipes ALL local ROCN Pad data: IndexedDB vault + every rocn_* localStorage
 * key (notes, projects, settings, recaps, fallbacks). Call ONLY after the
 * server confirms the account is deleted.
 */
export async function wipeLocalAccountData(): Promise<void> {
  await storage.wipeAllLocalData();
}

/** Signs out locally (no server call — the account no longer exists). */
export async function signOutLocally(): Promise<void> {
  await supabase.auth.signOut({ scope: 'local' });
}
