'use client';

import { createClient } from '@supabase/supabase-js';
import { useState } from 'react';
import Link from 'next/link';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function Page() {
  const [email, setEmail] = useState('');
  const [msg, setMsg] = useState<string | null>(null);

  async function signInWithMagicLink(e: React.FormEvent) {
    e.preventDefault();
    const { error } = await supabase.auth.signInWithOtp({ email });
    setMsg(error ? error.message : 'Check your email for the login link.');
  }

  async function signInWithGoogle() {
    await supabase.auth.signInWithOAuth({ provider: 'google' });
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-black text-white">
      <div className="w-full max-w-md p-8 rounded-2xl bg-[#111] shadow-xl border border-gray-800">
        <div className="mb-8">
          <div className="text-left text-3xl font-semibold">Project Lens</div>
          <p className="text-white/70 mt-1">Manage projects and collaborate with clients.</p>
        </div>
        <div className="space-y-3 mb-6">
          <button onClick={signInWithGoogle} className="w-full bg-white text-black rounded-lg py-3">Continue with Google</button>
        </div>
        <div className="flex items-center gap-3 my-6">
          <div className="h-px bg-white/20 flex-1" />
          <span className="text-white/60 text-sm">or</span>
          <div className="h-px bg-white/20 flex-1" />
        </div>
        <form onSubmit={signInWithMagicLink} className="space-y-3">
          <input className="w-full rounded-lg px-4 py-3 bg-black/60 border border-white/20"
            placeholder="Email address" value={email} onChange={(e)=>setEmail(e.target.value)} />
          <button className="w-full bg-[#003366] rounded-lg py-3">Sign in with Email</button>
        </form>
        {msg && <p className="mt-4 text-sm text-accent">{msg}</p>}

        <div className="mt-6">
          <Link href="/dashboard" className="underline text-white/70 text-sm">Skip to Dashboard (demo)</Link>
        </div>
      </div>
    </main>
  );
}
