// delete-account — request handler (framework-free, Deno-free).
//
// Shared by ROCN Pad and ROCNventory (same Supabase project
// wxftpsijhgrqogszmavr, same Google-only auth). The Deno entry point is
// index.ts in this folder; it builds the two Supabase clients and calls
// handleDeleteAccount().
//
// SECURITY MODEL
// - The service_role key NEVER leaves the server. It is injected by Supabase
//   into Edge Functions as SUPABASE_SERVICE_ROLE_KEY and is used only by the
//   admin client below. No client code ever sees it.
// - The caller is identified ONLY from their verified JWT — never from a
//   user_id in the request body. A user can only delete their OWN account.
// - The JWT must show aal2 (fresh re-authentication). The client runs
//   supabase.auth.reauthenticate() + verifyOtp({ type: 'reauthentication' })
//   immediately before calling this function. A stale/stolen JWT (aal1) is
//   rejected with REAUTH_REQUIRED.
// - Deleting the auth user cascades (ON DELETE CASCADE) to public.profiles
//   and public.app_events. The user's in-browser data (ROCN Pad IndexedDB /
//   localStorage, ROCNventory localStorage) is wiped by the client AFTER this
//   function succeeds, so a server failure never leaves the user locked out
//   of their own data.

import type { SupabaseClient } from '@supabase/supabase-js';

export type DeleteAccountDeps = {
  /** Client created with the anon key — used ONLY to verify the caller's JWT. */
  userClient: SupabaseClient;
  /** Client created with the service_role key — used ONLY to delete the verified user. */
  adminClient: SupabaseClient;
};

export type DeleteResult = {
  ok: boolean;
  userId?: string;
  status?: number;
  code?: string;
  message?: string;
};

// NOTE: this is a flat object type, not a discriminated union, on purpose.
// The app projects run tsc WITHOUT "strict", and without strictNullChecks
// TypeScript does not narrow discriminated unions at the call sites, so
// `result.message` after `if (!result.ok)` fails to compile. A flat type
// with optional fields keeps every consumer compiling in this codebase.
// Callers must check `ok` first; failure results always carry status/code/message.

function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const payload = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const json = decodeURIComponent(
      atob(payload)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join(''),
    );
    return JSON.parse(json) as Record<string, unknown>;
  } catch {
    return null;
  }
}

export async function handleDeleteAccount(
  req: Request,
  deps: DeleteAccountDeps,
): Promise<DeleteResult> {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return {
      ok: false,
      status: 401,
      code: 'NO_SESSION',
      message: 'No session found. Please sign in again.',
    };
  }
  const token = authHeader.slice('Bearer '.length).trim();
  if (!token) {
    return {
      ok: false,
      status: 401,
      code: 'NO_SESSION',
      message: 'No session found. Please sign in again.',
    };
  }

  // Verify the JWT against the Auth server (validates the signature).
  const {
    data: { user },
    error: userError,
  } = await deps.userClient.auth.getUser(token);
  if (userError || !user) {
    return {
      ok: false,
      status: 401,
      code: 'BAD_SESSION',
      message: 'Your session could not be verified. Please sign in again.',
    };
  }

  // Fresh re-authentication required: the JWT's aal claim must be aal2.
  // (The User object itself carries no aal field — the claim lives in the JWT.)
  const claims = decodeJwtPayload(token);
  if (claims?.aal !== 'aal2') {
    return {
      ok: false,
      status: 403,
      code: 'REAUTH_REQUIRED',
      message:
        'For your safety, please re-authenticate with the code emailed to you, then try again.',
    };
  }

  // Delete the caller — and ONLY the caller (id comes from the verified JWT).
  // public.profiles and public.app_events reference auth.users(id)
  // ON DELETE CASCADE, so their rows go with the auth user automatically.
  const { error: deleteError } = await deps.adminClient.auth.admin.deleteUser(user.id);
  if (deleteError) {
    return {
      ok: false,
      status: 500,
      code: 'DELETE_FAILED',
      message: `Could not delete your account: ${deleteError.message}`,
    };
  }

  return { ok: true, userId: user.id };
}
