'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import Sidebar from '../../../components/Sidebar';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type Project = { id: string; title: string; status: string; client_id: string | null; notes?: string | null };
type PDate = { id: string; starts_at: string; ends_at: string; location: string | null };

export default function ProjectDetail() {
  const params = useParams<{ id: string }>();
  const id = useMemo(() => (Array.isArray(params.id) ? params.id[0] : params.id), [params.id]);

  const [project, setProject] = useState<Project | null>(null);
  const [dates, setDates] = useState<PDate[]>([]);
  const [loading, setLoading] = useState(true);

  const [title, setTitle] = useState('');
  const [status, setStatus] = useState('PROSPECT');

  const [newDate, setNewDate] = useState({ starts_at: '', ends_at: '', location: '' });
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    (async () => {
      setLoading(true);
      const { data: proj, error: projErr } = await supabase.from('projects').select('*').eq('id', id).single();
      if (projErr) setError(projErr.message);
      if (proj) {
        setProject(proj);
        setTitle(proj.title);
        setStatus(proj.status || 'PROSPECT');
      }
      const { data: pds, error: datesErr } = await supabase
        .from('project_dates').select('*').eq('project_id', id).order('starts_at');
      if (datesErr) setError(datesErr.message);
      setDates(pds || []);
      setLoading(false);
    })();
  }, [id]);

  async function saveProject() {
    if (!project) return;
    setError(null); setMessage(null);
    const { data, error } = await supabase
      .from('projects')
      .update({ title, status })
      .eq('id', project.id)
      .select('*')
      .single();
    if (error) setError(error.message);
    if (data) { setProject(data); setMessage('Saved'); }
  }

  function toISO(value: string) {
    try {
      const d = new Date(value);
      if (isNaN(d.getTime())) return null;
      return d.toISOString();
    } catch {
      return null;
    }
  }

  async function addDate() {
    if (!project) return;
    setError(null); setMessage(null);

    if (!newDate.starts_at || !newDate.ends_at) {
      setError('Please set both start and end.');
      return;
    }

    const startISO = toISO(newDate.starts_at);
    const endISO = toISO(newDate.ends_at);
    if (!startISO || !endISO) {
      setError('Invalid date/time format.'); return;
    }
    if (new Date(endISO) <= new Date(startISO)) {
      setError('End must be after Start.'); return;
    }

    try {
      setAdding(true);
      const { data, error } = await supabase
        .from('project_dates')
        .insert([{
          project_id: project.id,
          starts_at: startISO,
          ends_at: endISO,
          location: newDate.location || null
        }])
        .select('*')
        .single();
      if (error) { setError(error.message); return; }
      if (data) {
        setDates([...dates, data]);
        setNewDate({ starts_at: '', ends_at: '', location: '' });
        setMessage('Date added');
      }
    } finally {
      setAdding(false);
    }
  }

  async function deleteDate(idToDelete: string) {
    setError(null); setMessage(null);
    const { error } = await supabase.from('project_dates').delete().eq('id', idToDelete);
    if (error) { setError(error.message); return; }
    setDates(dates.filter(d => d.id !== idToDelete));
    setMessage('Date deleted');
  }

  if (loading) return (
    <main className="min-h-screen grid grid-cols-[260px_1fr]">
      <Sidebar />
      <section className="p-6">Loading…</section>
    </main>
  );

  if (!project) return (
    <main className="min-h-screen grid grid-cols-[260px_1fr]">
      <Sidebar />
      <section className="p-6">Project not found.</section>
    </main>
  );

  const canAdd = Boolean(newDate.starts_at && newDate.ends_at);

  return (
    <main className="min-h-screen grid grid-cols-[260px_1fr]">
      <Sidebar />

      <section className="p-6 space-y-8">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Project Details</h1>
          <button onClick={saveProject} className="bg-accent px-4 py-2 rounded">Save</button>
        </div>

        {error && <div className="bg-red-500/20 border border-red-500/40 text-red-300 px-3 py-2 rounded">{error}</div>}
        {message && <div className="bg-green-500/20 border border-green-500/40 text-green-300 px-3 py-2 rounded">{message}</div>}

        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="block text-sm text-white/70">Title</label>
            <input className="w-full px-3 py-2 rounded bg-white/10 border border-white/20" value={title} onChange={e=>setTitle(e.target.value)} />
          </div>
          <div className="space-y-2">
            <label className="block text-sm text-white/70">Status</label>
            <select className="w-full px-3 py-2 rounded bg-white/10 border border-white/20" value={status} onChange={e=>setStatus(e.target.value)}>
              <option>PROSPECT</option>
              <option>CONFIRMED</option>
              <option>IN_EDIT</option>
              <option>DELIVERED</option>
              <option>INVOICED</option>
              <option>PAID</option>
              <option>CANCELLED</option>
            </select>
          </div>
        </div>

        <div className="space-y-3">
          <h2 className="text-xl font-semibold">Dates & Locations</h2>
          <div className="grid md:grid-cols-4 gap-2 items-end">
            <div>
              <label className="block text-sm text-white/70">Start</label>
              <input type="datetime-local" className="w-full px-3 py-2 rounded bg-white/10 border border-white/20" value={newDate.starts_at} onChange={e=>setNewDate({...newDate, starts_at:e.target.value})} />
            </div>
            <div>
              <label className="block text-sm text-white/70">End</label>
              <input type="datetime-local" className="w-full px-3 py-2 rounded bg-white/10 border border-white/20" value={newDate.ends_at} onChange={e=>setNewDate({...newDate, ends_at:e.target.value})} />
            </div>
            <div>
              <label className="block text-sm text-white/70">Location</label>
              <input className="w-full px-3 py-2 rounded bg-white/10 border border-white/20" placeholder="Studio A" value={newDate.location} onChange={e=>setNewDate({...newDate, location:e.target.value})} />
            </div>
            <button onClick={addDate} disabled={!canAdd || adding} className={`px-4 py-2 rounded mt-6 ${(!canAdd || adding) ? 'bg-white/20 cursor-not-allowed' : 'bg-accent'}`}>
              {adding ? 'Adding…' : '+ Add'}
            </button>
          </div>

          <table className="w-full text-left text-white/90 mt-3">
            <thead className="text-white/70">
              <tr><th className="py-2">Start</th><th>End</th><th>Location</th><th></th></tr>
            </thead>
            <tbody>
              {dates.map(d => (
                <tr key={d.id} className="border-t border-white/10">
                  <td className="py-2">{new Date(d.starts_at).toLocaleString()}</td>
                  <td>{new Date(d.ends_at).toLocaleString()}</td>
                  <td>{d.location || '—'}</td>
                  <td><button onClick={()=>deleteDate(d.id)} className="text-red-400 underline">Delete</button></td>
                </tr>
              ))}
              {dates.length === 0 && <tr><td className="py-2 text-white/60" colSpan={4}>No dates yet.</td></tr>}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}


