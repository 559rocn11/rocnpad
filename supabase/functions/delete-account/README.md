# delete-account Edge Function

Deletes the **caller's own** Supabase auth account. Shared by ROCN Pad and
ROCNventory — same Supabase project (`wxftpsijhgrqogszmavr`), same Google-only
auth. One function, deployed once, serves both apps.

## What it does

1. Reads the caller's JWT from the `Authorization: Bearer` header.
2. Verifies the JWT with the anon-key client (`auth.getUser`).
3. Requires the JWT's `aal` claim to be `aal2` — i.e. the user re-authenticated
   with the emailed 6-digit code moments before calling. A stale/stolen JWT
   (`aal1`) is rejected with `REAUTH_REQUIRED`.
4. Deletes the auth user with the service-role client
   (`admin.auth.admin.deleteUser`). The user id comes **only** from the
   verified JWT — never from the request body — so nobody can delete anyone
   else's account.
5. `public.profiles` and `public.app_events` reference `auth.users(id)`
   `ON DELETE CASCADE`, so their rows go with the auth user automatically.
   The user's in-browser data (ROCN Pad IndexedDB/localStorage, ROCNventory
   localStorage) is wiped by the client **after** this function succeeds.

## Deploy (Roc's go required — do NOT run this without his review)

Prereq: Supabase CLI installed (`npm i -g supabase` — or use the
Supabase Dashboard → Edge Functions → Create function and paste the files).

```bash
supabase link --project-ref wxftpsijhgrqogszmavr
supabase functions deploy delete-account
```

The service-role key is auto-injected by Supabase as
`SUPABASE_SERVICE_ROLE_KEY` — no secret has to be set by hand. If the
function ever returns `NOT_CONFIGURED`, set it in the Dashboard:
Edge Functions → delete-account → Secrets → add
`SUPABASE_SERVICE_ROLE_KEY` = the project's service_role key
(Dashboard → Settings → API). **Never paste that key into chat or code.**

## Test (after deploy, before telling users about it)

1. Sign in to ROCN Pad or ROCNventory with a **test Google account**
   (never Roc's real account).
2. Settings → Download My Data — confirm the JSON has profile + activity +
   all app content.
3. Settings → Delete My Account → type DELETE → get the emailed code →
   enter it → confirm. Expect: account deleted, local data wiped, signed out.
4. Confirm in the Supabase Dashboard → Authentication that the test user is
   gone, and in Table Editor that their `profiles` / `app_events` rows are gone.

## Files

- `index.ts` — Deno entry point (thin wrapper).
- `handler.ts` — the logic, framework-free. Unit-tested locally with mocked
  Supabase clients (see the build report for results); the live aal2 upgrade
  and the real cascade still need the test above — they could NOT be verified
  without a deployed function and a real account.
