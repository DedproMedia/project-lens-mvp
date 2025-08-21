import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/** Escape per RFC 5545 */
function esc(v: string) {
  return v
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r?\n/g, '\\n');
}

/** UTC -> YYYYMMDDTHHMMSSZ */
function fmt(dt: string | Date) {
  const d = typeof dt === 'string' ? new Date(dt) : dt;
  const yyyy = d.getUTCFullYear();
  const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(d.getUTCDate()).padStart(2, '0');
  const HH = String(d.getUTCHours()).padStart(2, '0');
  const MM = String(d.getUTCMinutes()).padStart(2, '0');
  const SS = String(d.getUTCSeconds()).padStart(2, '0');
  return `${yyyy}${mm}${dd}T${HH}${MM}${SS}Z`;
}

function mapStatus(s?: string) {
  if (!s) return 'TENTATIVE';
  const S = s.toUpperCase();
  if (S === 'CANCELLED') return 'CANCELLED';
  if (['CONFIRMED','PAID','DELIVERED','INVOICED'].includes(S)) return 'CONFIRMED';
  return 'TENTATIVE'; // PROSPECT, IN_EDIT, etc.
}

export async function GET(req: NextRequest) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const { searchParams } = new URL(req.url);
  const calname = searchParams.get('calname') || 'Project Lens — Projects';
  const includePast = searchParams.get('past') === 'include';
  const sinceDays = Number(searchParams.get('sinceDays') ?? '1');
  const alarmMinutes = Number(searchParams.get('alarm') ?? '0');
  const sinceISO = new Date(Date.now() - sinceDays * 24 * 3600 * 1000).toISOString();

  // 1) Dates
  const base = supabase
    .from('project_dates')
    .select('id, project_id, starts_at, ends_at, location')
    .order('starts_at', { ascending: true })
    .limit(500);

  const { data: dates, error: dErr } = includePast
    ? await base.gte('ends_at', sinceISO)
    : await base.gte('starts_at', new Date().toISOString());

  if (dErr) {
    const errIcs = [
      'BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//Project Lens//ICS//EN',
      `X-ERROR:${esc(dErr.message)}`,'END:VCALENDAR'
    ].join('\r\n');
    return new NextResponse(errIcs, { headers: { 'Content-Type': 'text/calendar; charset=utf-8' } });
  }

  // 2) Projects
  const pIds = Array.from(new Set((dates ?? []).map(d => d.project_id))).filter(Boolean) as string[];
  let projectsById: Record<string, { id: string; title: string; status: string | null; client_id: string | null }> = {};
  if (pIds.length) {
    const { data: projs } = await supabase
      .from('projects')
      .select('id, title, status, client_id')
      .in('id', pIds);
    (projs || []).forEach(p => (projectsById[p.id] = p));
  }

  // 3) Clients
  const cIds = Array.from(new Set(Object.values(projectsById).map(p => p.client_id).filter(Boolean))) as string[];
  let clientsById: Record<string, { id: string; name: string | null }> = {};
  if (cIds.length) {
    const { data: clients } = await supabase
      .from('clients')
      .select('id, name')
      .in('id', cIds);
    (clients || []).forEach(c => (clientsById[c.id] = { id: c.id, name: c.name }));
  }

  // 4) Build ICS
  const origin = process.env.APP_BASE_URL || '';
  const lines: string[] = [];
  lines.push('BEGIN:VCALENDAR');
  lines.push('VERSION:2.0');
  lines.push('PRODID:-//Project Lens//ICS//EN');
  lines.push(`X-WR-CALNAME:${esc(calname)}`);
  lines.push('CALSCALE:GREGORIAN');
  lines.push('METHOD:PUBLISH');

  (dates || []).forEach((row, idx) => {
    const proj = projectsById[row.project_id];
    const title = proj?.title || 'Project';
    const status = (proj?.status || 'PROSPECT').replace(/_/g, ' ');
    const clientName = proj?.client_id ? clientsById[proj.client_id!]?.name || '' : '';

    // #### SUMMARY with client name ####
    // Format: Project Title — STATUS — Client
    const summaryParts = [title, status.toUpperCase()];
    if (clientName) summaryParts.push(clientName);
    const summary = summaryParts.join(' — ');

    // #### DESCRIPTION with spacing ####
    // We create "paragraphs" separated by a blank line.
    const descSections: string[] = [];
    const infoBlock: string[] = [];
    if (clientName) infoBlock.push(`Client: ${clientName}`);
    if (row.location) infoBlock.push(`Location: ${row.location}`);
    if (infoBlock.length) descSections.push(infoBlock.join('\\n')); // block 1

    const link = origin ? `${origin}/projects/${row.project_id}` : '';
    if (link) descSections.push(`Open: ${link}`); // block 2

    const description = descSections.join('\\n\\n'); // <-- blank line between blocks

    lines.push('BEGIN:VEVENT');
    lines.push(`UID:${row.id || idx}@project-lens`);
    lines.push(`DTSTAMP:${fmt(new Date())}`);
    if (row.starts_at) lines.push(`DTSTART:${fmt(row.starts_at)}`);
    if (row.ends_at)   lines.push(`DTEND:${fmt(row.ends_at)}`);
    lines.push(`SUMMARY:${esc(summary)}`);
    if (row.location)  lines.push(`LOCATION:${esc(row.location)}`);
    if (description)   lines.push(`DESCRIPTION:${esc(description)}`);
    lines.push(`STATUS:${mapStatus(proj?.status || undefined)}`);
    if (link)          lines.push(`URL:${esc(link)}`);

    if (alarmMinutes > 0) {
      lines.push('BEGIN:VALARM');
      lines.push(`TRIGGER:-PT${Math.round(alarmMinutes)}M`);
      lines.push('ACTION:DISPLAY');
      lines.push(`DESCRIPTION:${esc(summary)}`);
      lines.push('END:VALARM');
    }

    lines.push('END:VEVENT');
  });

  lines.push('END:VCALENDAR');

  return new NextResponse(lines.join('\r\n'), {
    headers: {
      'Content-Type': 'text/calendar; charset=utf-8',
      'Cache-Control': 'no-store, max-age=0'
    }
  });
}

