"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { supabaseBrowser } from "@/lib/supabase-browser";

type Client = { id: string; name: string };
type Status = { id: number; name: string; color: string | null };

type ProjectRow = {
  id: string;
  display_name: string;
  headline_description: string | null;
  created_at: string;
  client_id?: string | null;
  status_type_id?: number | null;
  client?: { name: string | null } | null;
  status?: { name: string; color?: string | null } | null;
};

export default function ProjectsList() {
  const supabase = supabaseBrowser();

  const [rows, setRows] = useState<ProjectRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const [clients, setClients] = useState<Record<string, Client>>({});
  const [statuses, setStatuses] = useState<Record<number, Status>>({});

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setErr(null);

      // 1) Flexible select: get everything from projects and try to embed relations.
      //    This avoids hard-coding a "name" column that may not exist in your schema.
      const projectsSel =
        "*, clients(name), project_status_types(name,color)";

      const [p, c, s] = await Promise.all([
        supabase.from("projects").select(projectsSel).order("created_at", { ascending: false }),
        supabase.from("clients").select("id,name"),
        supabase.from("project_status_types").select("id,name,color"),
      ]);

      if (cancelled) return;

      if (c.error || s.error) {
        setErr((c.error?.message || s.error?.message) ?? "Failed to load lookups");
        setLoading(false);
        return;
      }

      // lookup maps (used for fallback when embeds aren’t available)
      const clientMap: Record<string, Client> = {};
      (c.data || []).forEach((x: any) => (clientMap[x.id] = x as Client));
      setClients(clientMap);

      const statusMap: Record<number, Status> = {};
      (s.data || []).forEach((x: any) => (statusMap[x.id] = x as Status));
      setStatuses(statusMap);

      if (p.error) {
        setErr(p.error.message);
        setLoading(false);
        return;
      }

      // 2) Normalize projects → ProjectRow
      const normalized: ProjectRow[] = (p.data || []).map((r: any) => {
        // Derive a display name from any likely column
        const display =
          r.name ??
          r.project_name ??
          r.title ??
          "(untitled)";

        // headline/description flexible
        const headline =
          r.headline_description ??
          r.description ??
          r.summary ??
          null;

        // Relations may arrive under different keys / as arrays:
        const clientJoinRaw = r.client ?? r.clients ?? null;
        const clientJoin = Array.isArray(clientJoinRaw)
          ? clientJoinRaw[0] ?? null
          : clientJoinRaw ?? null;

        const statusJoinRaw = r.status ?? r.project_status_types ?? null;
        const statusJoin = Array.isArray(statusJoinRaw)
          ? statusJoinRaw[0] ?? null
          : statusJoinRaw ?? null;

        // FKs may use different names; keep both possibilities handy
        const statusId =
          typeof r.status_type_id === "number"
            ? r.status_type_id
            : typeof r.status_id === "number"
            ? r.status_id
            : null;

        return {
          id: String(r.id),
          display_name: String(display),
          headline_description: headline ? String(headline) : null,
          created_at: r.created_at ?? new Date().toISOString(),
          client_id: r.client_id ?? r.clientid ?? null,
          status_type_id: statusId,
          client: clientJoin ? { name: clientJoin.name ?? null } : null,
          status: statusJoin
            ? { name: statusJoin.name, color: statusJoin.color ?? null }
            : null,
        };
      });

      setRows(normalized);
      setLoading(false);
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [supabase]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return rows.filter((r) => {
      const nameHit = r.display_name.toLowerCase().includes(term);

      const clientName =
        r.client?.name ??
        (r.client_id && clients[r.client_id] ? clients[r.client_id].name : "");
      const clientHit = clientName?.toLowerCase().includes(term);

      const statusName =
        r.status?.name ??
        (r.status_type_id && statuses[r.status_type_id] ? statuses[r.status_type_id].name : "");
      const statusHit = statusName?.toLowerCase().includes(term);

      const termOk = !term || nameHit || clientHit || statusHit;
      const statusOk = !statusFilter || statusName === statusFilter;
      return termOk && statusOk;
    });
  }, [rows, clients, statuses, search, statusFilter]);

  const uniqueStatuses = useMemo(() => {
    const set = new Set<string>();
    rows.forEach((r) => {
      const n =
        r.status?.name ??
        (r.status_type_id && statuses[r.status_type_id] ? statuses[r.status_type_id].name : "");
      if (n) set.add(n);
    });
    return Array.from(set.values()).sort();
  }, [rows, statuses]);

  if (loading) {
    return <div style={{ padding: 12 }}>Loading projects…</div>;
  }
  if (err) {
    return (
      <div style={{ padding: 12, color: "crimson" }}>
        Failed to load projects: {err}
        <div style={{ color: "#666", marginTop: 6, fontSize: 12 }}>
          Tip: If you’re not signed in, RLS may block reads. Also check column names in Supabase.
        </div>
      </div>
    );
  }

  const fmtDate = (iso: string) =>
    new Date(iso).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });

  const getClientName = (r: ProjectRow) =>
    r.client?.name ??
    (r.client_id && clients[r.client_id] ? clients[r.client_id].name : "—");

  const getStatus = (r: ProjectRow) => {
    const name =
      r.status?.name ??
      (r.status_type_id && statuses[r.status_type_id] ? statuses[r.status_type_id].name : undefined);
    const color =
      r.status?.color ??
      (r.status_type_id && statuses[r.status_type_id] ? statuses[r.status_type_id].color : undefined);
    return { name: name || "—", color: color || "#9ca3af" };
  };

  return (
    <div>
      {/* Controls */}
      <div style={{ display: "flex", gap: 8, marginBottom: 12, alignItems: "center" }}>
        <input
          placeholder="Search by project, client, or status…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ padding: 8, border: "1px solid #e5e7eb", borderRadius: 6, flex: 1 }}
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          style={{ padding: 8, border: "1px solid #e5e7eb", borderRadius: 6 }}
        >
          <option value="">All statuses</option>
          {uniqueStatuses.map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ textAlign: "left", borderBottom: "1px solid #e5e7eb" }}>
              <th style={{ padding: "10px 8px" }}>Project</th>
              <th style={{ padding: "10px 8px" }}>Client</th>
              <th style={{ padding: "10px 8px" }}>Status</th>
              <th style={{ padding: "10px 8px" }}>Created</th>
              <th style={{ padding: "10px 8px", textAlign: "right" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ padding: 12, color: "#6b7280" }}>
                  No projects found.
                </td>
              </tr>
            ) : (
              filtered.map((r) => {
                const { name: statusName, color } = getStatus(r);
                return (
                  <tr key={r.id} style={{ borderBottom: "1px solid #f3f4f6" }}>
                    <td style={{ padding: "10px 8px" }}>
                      <div style={{ fontWeight: 600 }}>
                        <Link href={`/projects/${r.id}`} style={{ textDecoration: "underline" }}>
                          {r.display_name}
                        </Link>
                      </div>
                      {r.headline_description && (
                        <div
                          style={{
                            color: "#6b7280",
                            fontSize: 12,
                            marginTop: 2,
                            maxWidth: 560,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {r.headline_description}
                        </div>
                      )}
                    </td>
                    <td style={{ padding: "10px 8px" }}>{getClientName(r)}</td>
                    <td style={{ padding: "10px 8px" }}>
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 8,
                          padding: "2px 8px",
                          borderRadius: 999,
                          border: "1px solid #e5e7eb",
                          background: "#fff",
                        }}
                      >
                        <span
                          aria-hidden
                          style={{
                            width: 8,
                            height: 8,
                            borderRadius: 999,
                            background: color || "#9ca3af",
                            display: "inline-block",
                          }}
                        />
                        <span>{statusName}</span>
                      </span>
                    </td>
                    <td style={{ padding: "10px 8px" }}>{fmtDate(r.created_at)}</td>
                    <td style={{ padding: "10px 8px", textAlign: "right" }}>
                      <div style={{ display: "inline-flex", gap: 8 }}>
                        <Link href={`/projects/${r.id}`} title="View">View</Link>
                        <span aria-hidden style={{ color: "#e5e7eb" }}>|</span>
                        <Link href={`/projects/${r.id}?mode=edit`} title="Edit">Edit</Link>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

