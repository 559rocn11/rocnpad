// Type-only shim so the app project's `tsc --noEmit` (which knows nothing
// about Deno) can check this Edge Function. Deno itself ignores this file:
// it is never imported, and `supabase functions deploy` bundles only the
// code index.ts imports.
declare namespace Deno {
  export function serve(handler: (req: Request) => Response | Promise<Response>): void;
  export namespace env {
    export function get(key: string): string | undefined;
  }
}

declare module 'npm:@supabase/supabase-js@2.116.0' {
  export * from '@supabase/supabase-js';
}
