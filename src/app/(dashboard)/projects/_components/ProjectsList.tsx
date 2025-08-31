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
        // Pull config so we can read status from config.data
        supabase
          .from("projects")
          .select("id,name,title,created_at,client:clients(name),config")
          .order("created_at", { ascending: false })
          .limit(200),
        supabase
          .from("project_status_types")
          .select("id,name,color")
          .order("name"),
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
        setStatusTypes(
          (s.data as any[]).map((x) => ({
            id: Number(x.id),
            name: String(x.name),
            color: x.color ?? null,
          }))
        );
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
    const label: string =
      (data["project_status.custom"] as string) ||
      (data["project_status.name"] as string) ||
      "";
    const color =
      (label &&
        statusIndex.get(label.trim().toLowerCase()) &&
        (statusIndex.get(label.trim().toLowerCase()) as string)) ||
      null;

    return {
      ...r,
      statusLabel: label || "—",
      statusColor: color, // hex like #2563eb or null
    };
  });

  if (loading) return <div style={{ padding: 16 }}>Loading projects…</div>;
  if (err) return <div style={{ padding: 16, color: "crimson" }}>Error: {err}</div>;
  if (derived.length === 0) return <div style={{ padding: 16 }}>No projects yet.</div>;

  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ textAlign: "left", borderBottom: "1px solid #e5e7eb" }}>
            <th style={{ padding: 10 }}>Project</th>
            <th style={{ padding: 10 }}>Client</th>
            <th style={{ padding: 10 }}>Status</th>
            <th style={{ padding: 10 }}>Created</th>
            <th style={{ padding: 10 }} />
          </tr>
        </thead>
        <tbody>
          {derived.map((r) => {
            const tint = r.statusColor
              ? hexToRgba(r.statusColor, 0.2) // ~20% saturation tint
              : undefined;

            return (
              <tr
                key={r.id}
                style={{
                  borderBottom: "1px solid #f3f4f6",
                  background: tint,
                  transition: "background 120ms ease",
                }}
              >
                <td style={{ padding: 10, fontWeight: 500 }}>
                  <Link href={`/projects/${r.id}`}>{r.title}</Link>
                </td>
                <td style={{ padding: 10 }}>{r.client?.name || "—"}</td>
                <td style={{ padding: 10 }}>
                  <StatusBadge label={r.statusLabel} color={r.statusColor} />
                </td>
                <td style={{ padding: 10 }}>{fmtDate(r.created_at)}</td>
                <td style={{ padding: 10, textAlign: "right" }}>
                  <Link href={`/projects/${r.id}`}>Open</Link>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <p style={{ color: "#666", fontSize: 12, marginTop: 8 }}>
        Status colors come from <code>Settings → Status Types</code>. Custom statuses use no color unless the custom
        text equals a named status (case-insensitive).
      </p>
    </div>
  );
}

/** Tiny pill showing status + color */
function StatusBadge({ label, color }: { label: string; color: string | null }) {
  const pillStyle: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    padding: "4px 10px",
    borderRadius: 999,
    border: "1px solid #e5e7eb",
    background: "#fff",
    color: "#111",
    fontSize: 13,
    lineHeight: 1,
  };

  const dotStyle: React.CSSProperties = {
    width: 10,
    height: 10,
    borderRadius: 999,
    background: color || "#9ca3af", // gray if none
    boxShadow: "inset 0 0 0 1px rgba(0,0,0,0.08)",
  };

  return (
    <span style={pillStyle}>
      <span style={dotStyle} />
      <span>{label || "—"}</span>
    </span>
  );
}

function fmtDate(iso?: string | null) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return "—";
  }
}

/** Convert #RRGGBB (or #RGB) to rgba(r,g,b,alpha). Falls back to undefined on bad input. */
function hexToRgba(hex: string, alpha = 0.2): string | undefined {
  if (!hex) return undefined;
  let h = hex.trim();
  if (h.startsWith("#")) h = h.slice(1);
  if (h.length === 3) {
    const r = h[0] + h[0];
    const g = h[1] + h[1];
    const b = h[2] + h[2];
    return `rgba(${parseInt(r, 16)}, ${parseInt(g, 16)}, ${parseInt(b, 16)}, ${alpha})`;
  }
  if (h.length === 6) {
    const r = h.slice(0, 2);
    const g = h.slice(2, 4);
    const b = h.slice(4, 6);
    return `rgba(${parseInt(r, 16)}, ${parseInt(g, 16)}, ${parseInt(b, 16)}, ${alpha})`;
  }
  // unsupported (e.g. 8-digit w/ alpha) — return undefined to avoid breaking the UI
  return undefined;
}

