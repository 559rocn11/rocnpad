// delete-account — Supabase Edge Function (Deno entry point).
//
// Deletes the CALLER's own auth account. Shared by ROCN Pad and ROCNventory
// (same Supabase project wxftpsijhgrqogszmavr, same Google-only auth).
// The real logic lives in handler.ts; this file is a thin Deno wrapper.
//
// DEPLOY (run on a machine with the Supabase CLI; do NOT deploy without
// Roc's go — see README.md in this folder):
//   supabase link --project-ref wxftpsijhgrqogszmavr
//   supabase functions deploy delete-account
//
// The service_role key is auto-injected by Supabase as
// SUPABASE_SERVICE_ROLE_KEY. It must NEVER appear in client code.

import { createClient } from 'npm:@supabase/supabase-js@2.116.0';
import { handleDeleteAccount } from './handler.ts';

const corsHeaders: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

Deno.serve(async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }
  if (req.method !== 'POST') {
    return Response.json({ error: 'Method not allowed. Use POST.' }, { status: 405, headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!supabaseUrl || !anonKey || !serviceRoleKey) {
    return Response.json(
      { error: 'NOT_CONFIGURED', message: 'Account deletion is not configured on the server yet.' },
      { status: 500, headers: corsHeaders },
    );
  }

  const userClient = createClient(supabaseUrl, anonKey);
  const adminClient = createClient(supabaseUrl, serviceRoleKey);

  const result = await handleDeleteAccount(req, { userClient, adminClient });
  if (result.ok) {
    return Response.json({ ok: true, deleted_user_id: result.userId }, { status: 200, headers: corsHeaders });
  }
  return Response.json(
    { error: result.code, message: result.message },
    { status: result.status, headers: corsHeaders },
  );
});
