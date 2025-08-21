import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function fmt(dt: string) {
  const d = new Date(dt);
  const yyyy = d.getUTCFullYear();
  const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(d.getUTCDate()).padStart(2, '0');
  const HH = String(d.getUTCHours()).padStart(2, '0');
  const MM = String(d.getUTCMinutes()).padStart(2, '0');
  const SS = String(d.getUTCSeconds()).padStart(2, '0');
  return `${yyyy}${mm}${dd}T${HH}${MM}${SS}Z`;
}

export async function GET(req: NextRequest) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const { searchParams } = new URL(req.url);
  const sinceDays = Number(searchParams.get('sinceDays') ?? '1');
  const includePast = searchParams.get('past') === 'include';
  const sinceISO = new Date(Date.now() - sinceDays * 24 * 3600 * 1000).toISOString();

  const q = supabase
    .from('project_dates')
    .select('id, project_id, starts_at, ends_at, location')
    .order('starts_at', { ascending: true })
    .limit(500);

  const { data: dates, error } = includePast
    ? await q.gte('ends_at', sinceISO)
    : await q.gte('starts_at', new Date().toISOString());

  if (error) {
    const errIcs = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Project Lens//ICS//EN',
      `X-ERROR:${error.message}`,
      'END:VCALENDAR'
    ].join('\r\n');
    return new NextResponse(errIcs, { headers: { 'Content-Type': 'text/calendar; charset=utf-8' } });
  }

  const ids = Array.from(new Set((dates ?? []).map(d => d.project_id))).filter(Boolean) as string[];
  let titleById: Record<string, string> = {};
  if (ids.length > 0) {
    const { data: projects } = await supabase.from('projects').select('id, title').in('id', ids);
    if (projects) projects.forEach(p => (titleById[p.id] = p.title));
  }

  const lines: string[] = [];
  lines.push('BEGIN:VCALENDAR');
  lines.push('VERSION:2.0');
  lines.push('PRODID:-//Project Lens//ICS//EN');

  (dates || []).forEach((row, idx) => {
    const summary = titleById[row.project_id] || 'Project';
    lines.push('BEGIN:VEVENT');
    lines.push(`UID:${row.id || idx}@project-lens`);
    lines.push(`DTSTAMP:${fmt(new Date().toISOString())}`);
    if (row.starts_at) lines.push(`DTSTART:${fmt(row.starts_at)}`);
    if (row.ends_at)   lines.push(`DTEND:${fmt(row.ends_at)}`);
    lines.push(`SUMMARY:${summary.replace(/\r?\n/g, ' ')}`);
    if (row.location)  lines.push(`LOCATION:${row.location.replace(/\r?\n/g, ' ')}`);
    lines.push('END:VEVENT');
  });

  lines.push('END:VCALENDAR');

  return new NextResponse(lines.join('\r\n'), {
    headers: {
      'Content-Type': 'text/calendar; charset=utf-8',
      'Cache-Control': 'no-store'
    }
  });
}
