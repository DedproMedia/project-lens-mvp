'use client';

import { createClient } from '@supabase/supabase-js';
import { useEffect, useState } from 'react';
import Link from 'next/link';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

type Client = { id: string; name: string };
type Project = { id: string; title: string; status: string; client_id: string | null };

export default function Dashboard() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [form, setForm] = useState({ title: '', client_id: '' });

  useEffect(() => {
    (async () => {
      const { data: cs } = await supabase.from('clients').select('*').order('name');
      setClients(cs || []);
      const { data: ps } = await supabase.from('projects').select('*').order('created_at', { ascending: false });
      setProjects(ps || []);
    })();
  }, []);

  async function createProject() {
    if (!form.title) return;
    const { data } = await supabase.from('projects').insert([{
      title: form.title,
      client_id: form.client_id || null
    }]).select('*').single();
    if (data) setProjects([data, ...projects]);
    setForm({ title: '', client_id: '' });
  }

  return (
    <main className="min-h-screen grid grid-cols-[260px_1fr]">
      <aside className="bg-white/5 border-r border-white/10 p-4">
        <div className="text-xl font-semibold mb-4">Project Lens</div>
        <nav className="space-y-2">
          <Link href="/dashboard" className="block px-3 py-2 rounded hover:bg-white/10">Dashboard</Link>
          <Link href="/clients" className="block px-3 py-2 rounded hover:bg-white/10">Clients</Link>
          <Link href="/ics" className="block px-3 py-2 rounded hover:bg-white/10">ICS Feed</Link>
          <Link href="/invoice" className="block px-3 py-2 rounded hover:bg-white/10">Invoice Demo</Link>
        </nav>
      </aside>

      <section className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-semibold">Projects</h1>
          <div className="flex gap-2">
            <input value={form.title} onChange={(e)=>setForm({...form, title:e.target.value})}
              placeholder="Project title" className="px-3 py-2 rounded bg-white/10 border border-white/20" />
            <select value={form.client_id} onChange={(e)=>setForm({...form, client_id:e.target.value})}
              className="px-3 py-2 rounded bg-white/10 border border-white/20">
              <option value="">No client</option>
              {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <button onClick={createProject} className="bg-accent px-4 py-2 rounded">+ New Project</button>
          </div>
        </div>

        <table className="w-full text-left text-white/90">
          <thead className="text-white/70">
            <tr><th className="py-2">Title</th><th>Client</th><th>Status</th></tr>
          </thead>
          <tbody>
            {projects.map(p => (
              <tr key={p.id} className="border-t border-white/10">
                <td className="py-2">
                  <Link href={`/projects/${p.id}`} className="underline hover:text-accent">{p.title}</Link>
                </td>
                <td>{clients.find(c=>c.id===p.client_id)?.name || '—'}</td>
                <td><span className="bg-white/10 px-2 py-1 rounded text-xs">{p.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </main>
  );
}
