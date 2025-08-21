'use client';

import { createClient } from '@supabase/supabase-js';
import { useEffect, useState } from 'react';
import Link from 'next/link';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

type Client = { id: string; name: string; email?: string | null };

export default function Clients() {
  const [clients, setClients] = useState<Client[]>([]);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from('clients').select('*').order('created_at', { ascending: false });
      setClients(data || []);
    })();
  }, []);

  async function addClient() {
    if (!name) return;
    const { data } = await supabase.from('clients').insert([{ name, email }]).select('*').single();
    if (data) setClients([data, ...clients]);
    setName(''); setEmail('');
  }

  return (
    <main className="min-h-screen grid grid-cols-[260px_1fr]">
      <aside className="bg-white/5 border-r border-white/10 p-4">
        <div className="text-xl font-semibold mb-4">Project Lens</div>
        <nav className="space-y-2">
          <Link href="/dashboard" className="block px-3 py-2 rounded hover:bg-white/10">Dashboard</Link>
          <Link href="/clients" className="block px-3 py-2 rounded hover:bg-white/10">Clients</Link>
        </nav>
      </aside>

      <section className="p-6">
        <h1 className="text-2xl font-semibold mb-4">Clients</h1>

        <div className="flex gap-2 mb-4">
          <input className="px-3 py-2 rounded bg-white/10 border border-white/20" placeholder="Client name"
            value={name} onChange={e=>setName(e.target.value)} />
          <input className="px-3 py-2 rounded bg-white/10 border border-white/20" placeholder="Email"
            value={email} onChange={e=>setEmail(e.target.value)} />
          <button onClick={addClient} className="bg-accent px-4 py-2 rounded">+ Add Client</button>
        </div>

        <ul className="space-y-2">
          {clients.map(c => (
            <li key={c.id} className="bg-white/5 rounded p-3 border border-white/10">
              {c.name} <span className="text-white/50 text-sm">{c.email || ''}</span>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
