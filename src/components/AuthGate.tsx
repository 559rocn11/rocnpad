import React, { useEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase, ROCNPAD_URL, logEvent } from '../supabaseClient';

export function AuthGate({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;
    supabase.auth.getSession().then(({ data, error: e }) => {
      if (!mounted) return;
      if (e) setError(e.message);
      setSession(data.session);
      setLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      if (!mounted) return;
      setSession(s);
      setLoading(false);
    });
    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  async function signInWithGoogle() {
    setError('');
    const { error: e } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: ROCNPAD_URL },
    });
    if (e) setError(e.message);
  }

  async function signOut() {
    setError('');
    const { error: e } = await supabase.auth.signOut();
    if (e) setError(e.message);
  }

  // Log the first successful login (once per session mount)
  useEffect(() => {
    if (session?.user) {
      logEvent('rocnpad', 'login', { source: 'auth_gate' });
    }
  }, [session?.user?.id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-white">
        <div className="text-center">
          <div className="text-xl tracking-[0.3em] mb-2">ROCN PAD</div>
          <div className="text-sm text-white/50">LOADING...</div>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-white px-4">
        <div className="w-full max-w-sm text-center">
          <div className="text-3xl font-bold tracking-[0.2em] mb-2">
            ROCN PAD
          </div>
          <p className="text-white/60 mb-2">
            Capture. Connect. Understand.
          </p>
          <p className="text-white/40 text-sm mb-8">
            Sign in to access your pad.
          </p>
          <button
            type="button"
            onClick={signInWithGoogle}
            className="w-full py-3 px-4 rounded-xl bg-white text-black font-semibold hover:bg-white/90 transition"
          >
            Continue with Google
          </button>
          {error ? (
            <p className="mt-4 text-sm text-red-400" role="alert">
              {error}
            </p>
          ) : null}
          <p className="mt-8 text-xs text-white/30">
            ROCN // 559 // FRESNO CA
          </p>
          <p className="mt-3 text-xs text-white/40">
            <a href="/privacy-policy.html" className="underline hover:text-white/70">Privacy Policy</a>
            {' · '}
            <a href="/terms-of-service.html" className="underline hover:text-white/70">Terms of Service</a>
            {' · '}
            <a href="/account-deletion.html" className="underline hover:text-white/70">Delete Your Account</a>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between px-4 py-2 bg-black text-white text-xs border-b border-white/10">
        <span className="text-white/60">
          Signed in as {session.user.email}
        </span>
        <button
          type="button"
          onClick={signOut}
          className="px-3 py-1 rounded-lg bg-white/10 hover:bg-white/20 transition"
        >
          Sign out
        </button>
      </div>
      {error ? (
        <p className="px-4 py-2 text-sm text-red-400 bg-black" role="alert">
          {error}
        </p>
      ) : null}
      {children}
    </div>
  );
}
