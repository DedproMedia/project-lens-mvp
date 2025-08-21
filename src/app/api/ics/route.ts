import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(_req: NextRequest) {
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

  const { data } = await supabase
    .from('project_dates')
    .select('starts_at, ends_at, location, project:projects(title)')
    .limit(50);

  const lines: string[] = [];
  lines.push('BEGIN:VCALENDAR');
  lines.push('VERSION:2.0');
  lines.push('PRODID:-//Project Lens//MVP//EN');

  function fmt(dt: string) {
    const d = new Date(dt);
    const yyyy = d.getUTCFullYear();
    const mm = String(d.getUTCMonth()+1).padStart(2,'0');
    const dd = String(d.getUTCDate()).padStart(2,'0');
    const HH = String(d.getUTCHours()).padStart(2,'0');
    const MM = String(d.getUTCMinutes()).padStart(2,'0');
    const SS = String(d.getUTCSeconds()).padStart(2,'0');
    return `${yyyy}${mm}${dd}T${HH}${MM}${SS}Z`;
  }

  (data || []).forEach((row: any, idx: number) => {
    lines.push('BEGIN:VEVENT');
    lines.push(`UID:${idx}@project-lens-mvp`);
    lines.push(`DTSTAMP:${fmt(new Date().toISOString())}`);
    lines.push(`DTSTART:${fmt(row.starts_at)}`);
    lines.push(`DTEND:${fmt(row.ends_at)}`);
    lines.push(`SUMMARY:${row.project?.title || 'Project'}`);
    if (row.location) lines.push(`LOCATION:${row.location}`);
    lines.push('END:VEVENT');
  });

  lines.push('END:VCALENDAR');
  const text = lines.join('\r\n');

  return new NextResponse(text, {
    headers: { 'Content-Type': 'text/calendar; charset=utf-8' }
  });
}
