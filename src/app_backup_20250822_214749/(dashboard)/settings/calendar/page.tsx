'use client';

import { useEffect, useMemo, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

type PDate = { id: string; project_id: string; starts_at: string; ends_at: string; location: string | null };
type Proj = { id: string; title: string; status: string | null; client_id: string | null };
type Client = { id: string; name: string | null };

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function CalendarSettingsPage() {
  const [alarm, setAlarm] = useState<number>(15);
  const [copied, setCopied] = useState(false);
  const [events, setEvents] = useState<Array<{title: string; status: string; client?: string|null; starts_at: string; ends_at: string; location?: string|null}>>([]);
  const [loading, setLoading] = useState(true);

  const origin = useMemo(() => {
    if (typeof window !== 'undefined') return window.location.origin;
    return process.env.APP_BASE_URL || 'http://localhost:3000';
  }, []);

  const httpsUrl = `${origin}/api/ics${alarm > 0 ? `?alarm=${alarm}` : ''}`;
  const webcalUrl = httpsUrl.replace(/^https?:/, 'webcal:');

  useEffect(() => {
    (async () => {
      setLoading(true);
      const nowISO = new Date().toISOString();
      const { data: pds, error } = await supabase
        .from('project_dates')
        .select('id, project_id, starts_at, ends_at, location')
        .gte('starts_at', nowISO)
        .order('starts_at', { ascending: true })
        .limit(5);
      if (error) { setLoading(false); return; }

      const ids = Array.from(new Set((pds||[]).map(d => d.project_id))).filter(Boolean) as string[];
      let titleById: Record<string, Proj> = {};
      let clientById: Record<string, Client> = {};

      if (ids.length) {
        const { data: projs } = await supabase
          .from('projects')
          .select('id, title, status, client_id')
          .in('id', ids);
        (projs||[]).forEach(p => { titleById[p.id] = p; });

        const cids = Array.from(new Set((projs||[]).map(p => p.client_id).filter(Boolean))) as string[];
        if (cids.length) {
          const { data: clients } = await supabase
            .from('clients')
            .select('id, name')
            .in('id', cids);
          (clients||[]).forEach(c => { clientById[c.id] = c; });
        }
      }

      const rows = (pds||[]).map(d => {
        const proj = titleById[d.project_id];
        const client = proj?.client_id ? clientById[proj.client_id]?.name : null;
        return {
          title: proj?.title || 'Project',
          status: (proj?.status || 'PROSPECT').replace(/_/g, ' '),
          client,
          starts_at: d.starts_at,
          ends_at: d.ends_at,
          location: d.location || null
        };
      });
      setEvents(rows);
      setLoading(false);
    })();
  }, [alarm]);

  async function copyLink() {
    await navigator.clipboard.writeText(httpsUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  function openInCalendar() {
    window.location.href = webcalUrl;
  }

  const dateFmt = (iso: string) => new Date(iso).toLocaleString();

  return (
    <main className="min-h-screen grid grid-cols-[260px_1fr]">
      <Sidebar />

      <section className="p-6 space-y-8">
        <header>
          <h1 className="text-2xl font-semibold">Sync your Projects with your Calendar</h1>
          <p className="text-white/70 mt-1">Subscribe to your Project Lens calendar feed in Apple Calendar, Google Calendar, or Outlook.</p>
        </header>

        <div className="bg-white/5 border border-white/10 rounded-lg p-4 space-y-3">
          <label className="block text-sm text-white/70">Your ICS feed</label>
          <div className="flex flex-col md:flex-row gap-2">
            <input
              readOnly
              value={httpsUrl}
              className="flex-1 px-3 py-2 rounded bg-white/10 border border-white/20"
            />
            <div className="flex gap-2">
              <button onClick={copyLink} className="px-4 py-2 rounded bg-accent">{copied ? 'Copied!' : 'Copy Link'}</button>
              <button onClick={openInCalendar} className="px-4 py-2 rounded bg-white/10 border border-white/20">Open in Calendar</button>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <label className="text-sm text-white/70">Default reminder:</label>
            <select
              value={alarm}
              onChange={e => setAlarm(Number(e.target.value))}
              className="px-3 py-2 rounded bg-white/10 border border-white/20"
            >
              <option value={0}>None</option>
              <option value={5}>5 minutes</option>
              <option value={15}>15 minutes</option>
              <option value={30}>30 minutes</option>
              <option value={60}>1 hour</option>
            </select>
            <span className="text-white/50 text-sm">Changes the URL with <code>?alarm=…</code></span>
          </div>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-lg p-4 space-y-2">
          <h2 className="text-lg font-semibold">How to subscribe</h2>
          <ul className="list-disc list-inside text-white/80 space-y-1">
            <li><b>Apple Calendar (Mac/iOS):</b> Click <i>Open in Calendar</i> above and confirm subscription.</li>
            <li><b>Google Calendar (web):</b> Copy the link → Google Calendar → <i>Other calendars</i> → <i>From URL</i> → paste → Add.</li>
            <li><b>Outlook:</b> Add calendar → <i>Subscribe from web</i> → paste the link.</li>
          </ul>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-lg p-4">
          <h2 className="text-lg font-semibold mb-2">Upcoming events (preview)</h2>
          {loading ? (
            <div className="text-white/60">Loading…</div>
          ) : events.length === 0 ? (
            <div className="text-white/60">No upcoming events yet.</div>
          ) : (
            <ul className="divide-y divide-white/10">
              {events.map((e, i) => (
                <li key={i} className="py-2">
                  <div className="font-medium">
                    {e.title} — {(e.status || 'PROSPECT').toUpperCase()}{e.client ? ` — ${e.client}` : ''}
                  </div>
                  <div className="text-white/70 text-sm">
                    🗓 {dateFmt(e.starts_at)} – {dateFmt(e.ends_at)}
                    {e.location ? ` — ${e.location}` : ''}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </main>
  );
}

