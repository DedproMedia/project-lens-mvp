import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(req: NextRequest) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const nowISO = new Date().toISOString();

  const { data: futureDates, error } = await supabase
    .from('project_dates')
    .select('id, project_id, starts_at, ends_at, location')
    .gte('starts_at', nowISO)
    .order('starts_at', { ascending: true })
    .limit(5);

  let projects: any[] = [];
  if (futureDates?.length) {
    const ids = Array.from(new Set(futureDates.map(d => d.project_id)));
    const { data } = await supabase.from('projects').select('id, title').in('id', ids as string[]);
    projects = data || [];
  }

  return NextResponse.json({
    env: {
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || '(missing)',
      NEXT_PUBLIC_SUPABASE_ANON_KEY_present: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    },
    counts: {
      futureDates: futureDates?.length || 0,
      projects: projects.length
    },
    sample: {
      futureDates,
      projects
    },
    error: error?.message || null,
    nowISO
  });
}
