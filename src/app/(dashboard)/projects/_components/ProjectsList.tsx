"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { supabaseBrowser } from "@/lib/supabase-browser";

type ClientRef = { name: string | null };
type ProjectRow = {
  id: string;
  title: string;
  created_at?: string | null;
  client?: ClientRef | null;
  config?: any | null;
};
type StatusType = { id: number; name: string; color: string | null };

export default function ProjectsList() {
  const [rows, setRows] = useState<ProjectRow[]>([]);
  const [statusTypes, setStatusTypes] = useState<StatusType[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);
      setErr(null);
      const supabase = supabaseBrowser();

      const [p, s] = await Promise.all([
        supabase.from("projects").select("*, client:clients(name)").order("created_at", { ascending: false }).limit(200),
        supabase.from("project_status_types").select("id,name,color").order("name"),
      ]);

      if (!mounted) return;

      if (p.error) {
        setErr(p.error.message);
        setRows([]);
      } else {
        const mapped = (p.data || []).map((r: any) => ({
          id: String(r.id),
          title: String(r.name ?? r.title ?? "Untitled"),
          created_at: r.created_at ?? null,
          client: r.client ?? null,
          config: r.config ?? null,
        }));
        setRows(mapped);
      }

      if (!s.error && s.data) {
        setStatusTypes((s.data as any[]).map((x) => ({
          id: Number(x.id),
          name: String(x.name),
          color: x.color ?? null,
        })));
      }

      setLoading(false);
    };
    load();
    return () => {
      mounted = false;
    };
  }, []);

  const statusIndex = useMemo(() => {
    const idx = new Map<string, string | null>();
    statusTypes.forEach((st) => idx.set(st.name.toLowerCase(), st.color));
    return idx;
  }, [statusTypes]);

  const derived = rows.map((r) => {
    const data = (r.config?.data ?? {}) as Record<string, any>;
    const label: string = (data["project_status.custom"] as string) || (data["project_status.name"] as string) || "";
    const color = (label && statusIndex.get(label.trim().toLowerCase())) || null;
    return { ...r, statusLabel: label || "—", statusColor: color };
  });

  if (loading) return <div className="p-4 text-gray-600">Loading projects…</div>;
  if (err) return <div className="p-4 text-red-600">Error: {err}</div>;
  if (derived.length === 0) return <div className="p-4 text-gray-600">No projects yet.</div>;

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse rounded-lg shadow-sm text-sm">
        <thead>
          <tr className="bg-gray-100 text-left text-xs uppercase tracking-wide">
            <th className="px-4 py-2 font-semibold">Project</th>
            <th className="px-4 py-2 font-semibold">Client</th>
            <th className="px-4 py-2 font-semibold">Status</th>
            <th className="px-4 py-2 font-semibold">Created</th>
            <th className="px-4 py-2" />
          </tr>
        </thead>
        <tbody>
          {derived.map((r, i) => {
            const tint = r.statusColor ? hexToRgba(r.statusColor, 0.1) : i % 2 === 0 ? "#fafafa" : "#ffffff";
            return (
              <tr key={r.id} style={{ background: tint }}>
                <td className="px-4 py-2 font-medium text-black">
                  <Link href={`/projects/${r.id}`}>{r.title}</Link>
                </td>
                <td className="px-4 py-2 text-gray-700">{r.client?.name || "—"}</td>
                <td className="px-4 py-2">
                  <StatusBadge label={r.statusLabel} color={r.statusColor} />
                </td>
                <td className="px-4 py-2 text-gray-500 text-xs">{fmtDate(r.created_at)}</td>
                <td className="px-4 py-2 text-right">
                  <Link href={`/projects/${r.id}`} className="text-red-600 hover:text-red-800 font-medium text-xs">
                    Open →
                  </Link>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function StatusBadge({ label, color }: { label: string; color: string | null }) {
  return (
    <span


