"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase-browser";

const ALL_ELEMENTS = [
  "project_title","client_name","deliverables","project_dates_locations","project_status",
  "headline_description","client_budget","project_cost","style_direction","shotlist",
  "delivery_links","expenses","terms_and_conditions","rams","insurance","additional_requests","notes",
] as const;
type ElementKey = (typeof ALL_ELEMENTS)[number];

type Client = { id: string; name: string };
type StatusType = { id: number; name: string; color: string | null };
type Currency = { code: string; name?: string | null };

// Structure we persist in projects.config
type ProjectConfig = {
  elements?: ElementKey[];
  visibility?: Record<ElementKey, boolean>;
  editability?: Record<ElementKey, boolean>;
  data?: Record<string, any>;
};

type Project = {
  id: string;
  name?: string | null;     // or
  title?: string | null;    // either exists
  client_id?: string | null;
  headline_description?: string | null;
  created_at?: string;
  config?: ProjectConfig | null;
};

export default function ProjectDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const search = useSearchParams();
  const supabase = supabaseBrowser();

  const modeParam = search.get("mode");
  const [editMode, setEditMode] = useState(modeParam === "edit");

  // loaded data
  const [proj, setProj] = useState<Project | null>(null);
  const [clients, setClients] = useState<Client[]>([]);
  const [statuses, setStatuses] = useState<StatusType[]>([]);
  const [currencies, setCurrencies] = useState<Currency[]>([]);

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  // UI state (form)
  const [title, setTitle] = useState("");
  const [clientId, setClientId] = useState("");
  const [headline, setHeadline] = useState("");

  const [active, setActive] = useState<Record<ElementKey, boolean>>(
    () => Object.fromEntries(ALL_ELEMENTS.map(k => [k, false])) as Record<ElementKey, boolean>
  );
  const [visible, setVisible] = useState<Record<ElementKey, boolean>>(
    () => Object.fromEntries(ALL_ELEMENTS.map(k => [k, false])) as Record<ElementKey, boolean>
  );
  const [editable, setEditable] = useState<Record<ElementKey, boolean>>(
    () => Object.fromEntries(ALL_ELEMENTS.map(k => [k, false])) as Record<ElementKey, boolean>
  );
  const [data, setData] = useState<Record<string, any>>({}); // element values

  const [saving, setSaving] = useState(false);

  // ----- load project + lookups -----
  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);
      setErr(null);

      const [p, c, s, cur] = await Promise.all([
        supabase.from("projects").select("*").eq("id", params.id).single(),
        supabase.from("clients").select("id,name").order("name"),
        supabase.from("project_status_types").select("id,name,color").order("name"),
        supabase.from("currencies").select("code,name").order("code"),
      ]);

      if (!mounted) return;

      if (c.error) setErr(c.error.message);
      else setClients(((c.data || []) as any[]).map(x => ({ id: String(x.id), name: String(x.name) })));

      if (!s.error && s.data) {
        setStatuses((s.data as any[]).map(x => ({ id: Number(x.id), name: String(x.name), color: x.color ?? null })));
      }

      if (!cur.error && cur.data) {
        setCurrencies((cur.data as any[]).map(x => ({ code: String(x.code), name: x.name ?? null })));
      }

      if (p.error) {
        setErr(p.error.message);
        setLoading(false);
        return;
      }

      const record: Project = {
        id: String(p.data.id),
        name: p.data.name ?? null,
        title: p.data.title ?? null,
        client_id: p.data.client_id ?? null,
        headline_description: p.data.headline_description ?? null,
        created_at: p.data.created_at ?? null,
        config: (p.data.config ?? null) as Project["config"],
      };
      setProj(record);

      // hydrate basics
      const derivedTitle = record.name ?? record.title ?? "";
      setTitle(derivedTitle);
      setClientId(record.client_id ?? "");
      setHeadline(record.headline_description ?? "");

      // hydrate config
      const cfg = (record.config ?? {}) as ProjectConfig;
      const a = Object.fromEntries(ALL_ELEMENTS.map(k => [k, Boolean(cfg.elements?.includes(k))])) as Record<ElementKey, boolean>;
      const v = Object.fromEntries(ALL_ELEMENTS.map(k => [k, Boolean(cfg.visibility?.[k])])) as Record<ElementKey, boolean>;
      const e = Object.fromEntries(ALL_ELEMENTS.map(k => [k, Boolean(cfg.editability?.[k])])) as Record<ElementKey, boolean>;
      setActive(a); setVisible(v); setEditable(e);
      setData({ ...(cfg.data ?? {}) });

      setLoading(false);
    };
    load();
    return () => { mounted = false; };
  }, [params.id, supabase]);

  const selectedElements = useMemo(() => ALL_ELEMENTS.filter(k => active[k]), [active]);
  const toggle = (state: any, setState: any, key: ElementKey) =>
    setState((s: any) => ({ ...s, [key]: !s[key] }));

  // helpers to read/write data
  const getD = <T,>(key: string, fallback: T): T =>
    (data?.[key] ?? fallback) as T;

  const setD = (key: string, value: any) =>
    setData(d => ({ ...d, [key]: value }));

  // ----- save -----
  const save = async () => {
    if (!proj) return;
    setSaving(true);
    setErr(null);

    const config: ProjectConfig = {
      elements: selectedElements,
      visibility: visible,
      editability: editable,
      data,
    };

    const base: any = {
      client_id: clientId || null,
      headline_description: headline || null,
      config,
    };

    const attempt = async (field: "name" | "title") =>
      supabase.from("projects").update({ ...base, [field]: title }).eq("id", proj.id);

    let ok = false;
    let updErr: string | null = null;

    const r1 = await attempt("name");
    if (r1.error) {
      const r2 = await attempt("title");
      if (r2.error) updErr = r2.error.message;
      else ok = true;
    } else ok = true;

    setSaving(false);
    if (!ok) {
      setErr(updErr || "Failed to save project");
      return;
    }
    router.replace(`/projects/${proj.id}`);
    setEditMode(false);
  };

  // ----- derived helpers -----
  const fmtDate = (iso?: string) =>
    iso ? new Date(iso).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" }) : "—";

  if (loading) return <div style={{ padding: 16 }}>Loading project…</div>;
  if (err) return <div style={{ padding: 16, color: "crimson" }}>Error: {err}</div>;
  if (!proj) return <div style={{ padding: 16 }}>Not found.</div>;

  return (
    <div style={{ padding: 16, maxWidth: 1100 }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
        <h1 style={{ margin: 0 }}>{editMode ? "Edit Project" : "Project Details"}</h1>
        <div style={{ display: "flex", gap: 8 }}>
          {!editMode ? (
            <button onClick={() => setEditMode(true)}>Edit</button>
          ) : (
            <>
              <button onClick={() => { router.replace(`/projects/${proj.id}`); setEditMode(false); }}>Cancel</button>
              <button onClick={save} disabled={saving}>{saving ? "Saving…" : "Save"}</button>
            </>
          )}
        </div>
      </div>

      {/* Meta line */}
      <div style={{ color: "#555", fontSize: 13, marginTop: 6 }}>
        Created: {fmtDate(proj.created_at)}
      </div>

      {/* Basics */}
      <Section title="Basics">
        {editMode ? (
          <Grid cols={1} gap={12} maxW={720}>
            <label>Project title
              <input value={title} onChange={(e) => setTitle(e.target.value)} />
            </label>
            <label>Client
              <select value={clientId} onChange={(e) => setClientId(e.target.value)}>
                <option value="">— Select client —</option>
                {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </label>
            <label>Headline / description
              <textarea value={headline} onChange={(e) => setHeadline(e.target.value)} style={{ minHeight: 80 }} />
            </label>
          </Grid>
        ) : (
          <Grid cols={1} gap={8}>
            <KV label="Title" value={title || "—"} />
            <KV label="Client" value={clients.find(c => c.id === clientId)?.name || "—"} />
            <KV label="Headline" value={headline || "—"} />
          </Grid>
        )}
      </Section>

      {/* Elements selection */}
      <Section title="Project Elements">
        {editMode ? (
          <Grid cols={3} gap={8}>
            {ALL_ELEMENTS.map(k => (
              <label key={k} style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <input type="checkbox" checked={active[k]} onChange={() => toggle(active, setActive, k)} />
                <span>{labelFor(k)}</span>
              </label>
            ))}
          </Grid>
        ) : (
          <ul style={{ margin: 0, paddingLeft: 18 }}>
            {ALL_ELEMENTS.filter(k => active[k]).map(k => <li key={k}>{labelFor(k)}</li>)}
            {ALL_ELEMENTS.every(k => !active[k]) && <li>None selected.</li>}
          </ul>
        )}
      </Section>

      {/* Client permissions */}
      <Section title="Client Permissions">
        {editMode ? (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ textAlign: "left", borderBottom: "1px solid #e5e7eb" }}>
                <th style={{ padding: 8 }}>Element</th>
                <th style={{ padding: 8 }}>Client can view</th>
                <th style={{ padding: 8 }}>Client can edit</th>
              </tr>
            </thead>
            <tbody>
              {ALL_ELEMENTS.filter(k => active[k]).map(k => (
                <tr key={k} style={{ borderBottom: "1px solid #f3f4f6" }}>
                  <td style={{ padding: 8 }}>{labelFor(k)}</td>
                  <td style={{ padding: 8 }}>
                    <input type="checkbox" checked={!!visible[k]} onChange={() => toggle(visible, setVisible, k)} />
                  </td>
                  <td style={{ padding: 8 }}>
                    <input type="checkbox" checked={!!editable[k]} onChange={() => toggle(editable, setEditable, k)} />
                  </td>
                </tr>
              ))}
              {ALL_ELEMENTS.filter(k => active[k]).length === 0 && (
                <tr><td colSpan={3} style={{ padding: 8, color: "#6b7280" }}>No elements selected.</td></tr>
              )}
            </tbody>
          </table>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ textAlign: "left", borderBottom: "1px solid #e5e7eb" }}>
                <th style={{ padding: 8 }}>Element</th>
                <th style={{ padding: 8 }}>Visible</th>
                <th style={{ padding: 8 }}>Editable</th>
              </tr>
            </thead>
            <tbody>
              {ALL_ELEMENTS.filter(k => active[k]).map(k => (
                <tr key={k} style={{ borderBottom: "1px solid #f3f4f6" }}>
                  <td style={{ padding: 8 }}>{labelFor(k)}</td>
                  <td style={{ padding: 8 }}>{visible[k] ? "Yes" : "No"}</td>
                  <td style={{ padding: 8 }}>{editable[k] ? "Yes" : "No"}</td>
                </tr>
              ))}
              {ALL_ELEMENTS.filter(k => active[k]).length === 0 && (
                <tr><td colSpan={3} style={{ padding: 8, color: "#6b7280" }}>No elements selected.</td></tr>
              )}
            </tbody>
          </table>
        )}
      </Section>

      {/* Element editors (only shown if active) */}
      {active["project_status"] && (
        <Section title="Project Status">
          {editMode ? (
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <select
                value={getD<string>("project_status.name", "")}
                onChange={(e) => setD("project_status.name", e.target.value)}
              >
                <option value="">— Select status —</option>
                {statuses.map(st => <option key={st.id} value={st.name}>{st.name}</option>)}
              </select>
              <input
                placeholder="Or type a custom status"
                value={getD<string>("project_status.custom", "")}
                onChange={(e) => setD("project_status.custom", e.target.value)}
              />
            </div>
          ) : (
            <KV label="Status" value={getD<string>("project_status.custom", "") || getD<string>("project_status.name","—")} />
          )}
        </Section>
      )}

      {active["client_budget"] && (
        <Section title="Client Budget">
          {editMode ? (
            <Row>
              <input
                type="number"
                step="0.01"
                placeholder="Amount"
                value={getD<number>("client_budget.amount", "" as any)}
                onChange={(e) => setD("client_budget.amount", e.target.value === "" ? null : Number(e.target.value))}
                style={{ maxWidth: 200 }}
              />
              <select
                value={getD<string>("client_budget.currency", "")}
                onChange={(e) => setD("client_budget.currency", e.target.value)}
                style={{ maxWidth: 160 }}
              >
                <option value="">Currency</option>
                {currencies.map(c => <option key={c.code} value={c.code}>{c.code}</option>)}
              </select>
            </Row>
          ) : (
            <KV label="Client Budget"
                value={fmtMoney(getD<number>("client_budget.amount", 0), getD<string>("client_budget.currency","")) || "—"} />
          )}
        </Section>
      )}

      {active["project_cost"] && (
        <Section title="Project Cost">
          {editMode ? (
            <Row>
              <input
                type="number"
                step="0.01"
                placeholder="Amount"
                value={getD<number>("project_cost.amount", "" as any)}
                onChange={(e) => setD("project_cost.amount", e.target.value === "" ? null : Number(e.target.value))}
                style={{ maxWidth: 200 }}
              />
              <select
                value={getD<string>("project_cost.currency", "")}
                onChange={(e) => setD("project_cost.currency", e.target.value)}
                style={{ maxWidth: 160 }}
              >
                <option value="">Currency</option>
                {currencies.map(c => <option key={c.code} value={c.code}>{c.code}</option>)}
              </select>
            </Row>
          ) : (
            <KV label="Project Cost"
                value={fmtMoney(getD<number>("project_cost.amount", 0), getD<string>("project_cost.currency","")) || "—"} />
          )}
        </Section>
      )}

      {active["style_direction"] && (
        <Section title="Style Direction">
          {editMode ? (
            <textarea
              value={getD<string>("style_direction.text", "")}
              onChange={(e) => setD("style_direction.text", e.target.value)}
              style={{ minHeight: 120 }}
              placeholder="References, links, moodboards…"
            />
          ) : (
            <Pre value={getD<string>("style_direction.text","—")} />
          )}
        </Section>
      )}

      {active["deliverables"] && (
        <Section title="Deliverables">
          <ArrayTable
            edit={editMode}
            rows={getD<any[]>("deliverables.rows", [])}
            onChange={(rows) => setD("deliverables.rows", rows)}
            columns={[
              { key: "type", label: "Type", input: "select", options: ["Stills","Video","Other"] },
              { key: "description", label: "Description", input: "text" },
              { key: "notes", label: "Notes", input: "text" },
            ]}
          />
        </Section>
      )}

      {active["project_dates_locations"] && (
        <Section title="Project Dates & Locations">
          <ArrayTable
            edit={editMode}
            rows={getD<any[]>("dates.rows", [])}
            onChange={(rows) => setD("dates.rows", rows)}
            columns={[
              { key: "date", label: "Date", input: "date" },
              { key: "time", label: "Time", input: "text", placeholder: "e.g. 09:00–17:00" },
              { key: "location", label: "Location", input: "text" },
            ]}
          />
        </Section>
      )}

      {active["shotlist"] && (
        <Section title="Shotlist">
          <ArrayTable
            edit={editMode}
            rows={getD<any[]>("shotlist.rows", [])}
            onChange={(rows) => setD("shotlist.rows", rows)}
            columns={[
              { key: "shot", label: "Shot description", input: "text" },
              { key: "notes", label: "Notes", input: "text" },
            ]}
          />
        </Section>
      )}

      {active["delivery_links"] && (
        <Section title="Delivery Links">
          {editMode ? (
            <textarea
              value={getD<string>("delivery_links.text", "")}
              onChange={(e) => setD("delivery_links.text", e.target.value)}
              style={{ minHeight: 100 }}
              placeholder="One link per line"
            />
          ) : (
            <ListLines text={getD<string>("delivery_links.text","")} empty="—" />
          )}
        </Section>
      )}

      {active["expenses"] && (
        <Section title="Expenses">
          <ArrayTable
            edit={editMode}
            rows={getD<any[]>("expenses.rows", [])}
            onChange={(rows) => setD("expenses.rows", rows)}
            columns={[
              { key: "description", label: "Description", input: "text" },
              { key: "category", label: "Category", input: "text" },
              { key: "qty", label: "Qty", input: "number", step: "1" },
              { key: "unit_cost", label: "Unit Cost", input: "number", step: "0.01" },
              { key: "total", label: "Total", input: "calc", calc: (r:any) => num(r.qty)*num(r.unit_cost) },
            ]}
            footerTotal={(rows:any[]) =>
              rows.reduce((sum,r)=>sum + num(r.qty)*num(r.unit_cost), 0)
            }
          />
        </Section>
      )}

      {active["terms_and_conditions"] && (
        <Section title="Terms & Conditions">
          {editMode ? (
            <textarea
              value={getD<string>("terms.text","")}
              onChange={(e)=>setD("terms.text", e.target.value)}
              style={{ minHeight: 100 }}
              placeholder="Paste or reference your T&Cs (we'll wire the document store later)."
            />
          ) : (
            <Pre value={getD<string>("terms.text","—")} />
          )}
        </Section>
      )}

      {active["rams"] && (
        <Section title="RAMS">
          <ArrayTable
            edit={editMode}
            rows={getD<any[]>("rams.rows", [])}
            onChange={(rows) => setD("rams.rows", rows)}
            columns={[
              { key: "name", label: "Document", input: "text" },
              { key: "expires", label: "Expiry", input: "date" },
              { key: "notes", label: "Notes", input: "text" },
            ]}
          />
        </Section>
      )}

      {active["insurance"] && (
        <Section title="Insurance">
          <ArrayTable
            edit={editMode}
            rows={getD<any[]>("insurance.rows", [])}
            onChange={(rows) => setD("insurance.rows", rows)}
            columns={[
              { key: "name", label: "Document", input: "text" },
              { key: "expires", label: "Expiry", input: "date" },
              { key: "notes", label: "Notes", input: "text" },
            ]}
          />
        </Section>
      )}

      {active["additional_requests"] && (
        <Section title="Additional Requests">
          {editMode ? (
            <textarea
              value={getD<string>("additional.text","")}
              onChange={(e)=>setD("additional.text", e.target.value)}
              style={{ minHeight: 100 }}
            />
          ) : (
            <Pre value={getD<string>("additional.text","—")} />
          )}
        </Section>
      )}

      {active["notes"] && (
        <Section title="Notes">
          {editMode ? (
            <textarea
              value={getD<string>("notes.text","")}
              onChange={(e)=>setD("notes.text", e.target.value)}
              style={{ minHeight: 100 }}
            />
          ) : (
            <Pre value={getD<string>("notes.text","—")} />
          )}
        </Section>
      )}
    </div>
  );
}

/* ---------- small presentational helpers ---------- */

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ border: "1px solid #000", borderRadius: 10, padding: 16, marginTop: 16 }}>
      <h3 style={{ marginTop: 0 }}>{title}</h3>
      {children}
    </section>
  );
}

function Grid({ cols, gap, children, maxW }:{ cols:number; gap:number; children:any; maxW?:number }) {
  return (
    <div style={{
      display: "grid",
      gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
      gap,
      maxWidth: maxW ?? "unset"
    }}>
      {children}
    </div>
  );
}

function Row({ children }:{ children: React.ReactNode }) {
  return <div style={{ display: "flex", gap: 8, alignItems: "center" }}>{children}</div>;
}

function KV({ label, value }:{ label:string; value:any }) {
  return <div><strong>{label}:</strong> {value ?? "—"}</div>;
}

function Pre({ value }:{ value:string }) {
  return <pre style={{ margin: 0, whiteSpace: "pre-wrap" }}>{value}</pre>;
}

function ListLines({ text, empty }:{ text:string; empty:string }) {
  const lines = (text || "").split(/\r?\n/).map(s=>s.trim()).filter(Boolean);
  if (lines.length === 0) return <span>{empty}</span>;
  return <ul style={{ margin: 0, paddingLeft: 18 }}>{lines.map((l,i)=><li key={i}>{l}</li>)}</ul>;
}

function num(x:any){ const n = Number(x); return Number.isFinite(n) ? n : 0; }
function fmtMoney(amount:number, code?:string){
  if(!amount) return "";
  try { return new Intl.NumberFormat(undefined, { style:"currency", currency: code || "USD" }).format(amount); }
  catch { return `${code||""} ${amount.toFixed(2)}`.trim(); }
}

/* A tiny dynamic table editor used for array-based elements */
function ArrayTable({
  edit, rows, onChange, columns, footerTotal
}:{
  edit: boolean;
  rows: any[];
  onChange: (rows:any[]) => void;
  columns: Array<
    { key:string; label:string; input:"text"|"number"|"date"|"select"|"calc"; options?:string[]; step?:string; placeholder?:string; calc?:(row:any)=>number }
  >;
  footerTotal?: (rows:any[]) => number;
}) {
  const addRow = () => onChange([...(rows || []), {}]);
  const removeRow = (idx:number) => onChange((rows || []).filter((_,i)=>i!==idx));
  const change = (idx:number, key:string, value:any) => {
    const next = (rows || []).slice();
    next[idx] = { ...(next[idx]||{}), [key]: value };
    onChange(next);
  };

  return (
    <div style={{ overflowX:"auto" }}>
      <table style={{ width:"100%", borderCollapse:"collapse" }}>
        <thead>
          <tr style={{ textAlign:"left", borderBottom:"1px solid #e5e7eb" }}>
            {columns.map(col => <th key={col.key} style={{ padding:8 }}>{col.label}</th>)}
            {edit && <th style={{ padding:8, textAlign:"right" }}>Actions</th>}
          </tr>
        </thead>
        <tbody>
          {(rows||[]).length === 0 ? (
            <tr><td colSpan={columns.length + (edit?1:0)} style={{ padding: 10, color:"#6b7280" }}>
              No rows yet.
            </td></tr>
          ) : (
            (rows||[]).map((row, idx) => (
              <tr key={idx} style={{ borderBottom:"1px solid #f3f4f6" }}>
                {columns.map(col => {
                  const val = row?.[col.key] ?? (col.input === "number" ? "" : "");
                  if (!edit) {
                    const display = col.input === "calc" && col.calc ? col.calc(row) : val || "—";
                    return <td key={col.key} style={{ padding:8 }}>{String(display)}</td>;
                  }
                  switch (col.input) {
                    case "text":
                      return (
                        <td key={col.key} style={{ padding:8 }}>
                          <input
                            value={val}
                            onChange={(e)=>change(idx, col.key, e.target.value)}
                            placeholder={col.placeholder}
                          />
                        </td>
                      );
                    case "number":
                      return (
                        <td key={col.key} style={{ padding:8 }}>
                          <input
                            type="number"
                            step={col.step || "1"}
                            value={val}
                            onChange={(e)=>change(idx, col.key, e.target.value === "" ? null : Number(e.target.value))}
                          />
                        </td>
                      );
                    case "date":
                      return (
                        <td key={col.key} style={{ padding:8 }}>
                          <input
                            type="date"
                            value={val || ""}
                            onChange={(e)=>change(idx, col.key, e.target.value || null)}
                          />
                        </td>
                      );
                    case "select":
                      return (
                        <td key={col.key} style={{ padding:8 }}>
                          <select
                            value={val || ""}
                            onChange={(e)=>change(idx, col.key, e.target.value || null)}
                          >
                            <option value="">—</option>
                            {(col.options||[]).map(opt => <option key={opt} value={opt}>{opt}</option>)}
                          </select>
                        </td>
                      );
                    case "calc":
                      return (
                        <td key={col.key} style={{ padding:8 }}>
                          {col.calc ? col.calc(row).toFixed(2) : "—"}
                        </td>
                      );
                  }
                })}
                {edit && (
                  <td style={{ padding:8, textAlign:"right" }}>
                    <button type="button" onClick={()=>removeRow(idx)}>Remove</button>
                  </td>
                )}
              </tr>
            ))
          )}
        </tbody>
        {edit && (
          <tfoot>
            <tr>
              <td colSpan={columns.length} style={{ padding:8 }}>
                <button type="button" onClick={addRow}>+ Add row</button>
              </td>
              {typeof footerTotal === "function" && (
                <td style={{ padding:8, textAlign:"right" }}>
                  <strong>{footerTotal(rows || []).toFixed(2)}</strong>
                </td>
              )}
            </tr>
          </tfoot>
        )}
      </table>
    </div>
  );
}

function labelFor(key: ElementKey) {
  switch (key) {
    case "project_title": return "Project Title";
    case "client_name": return "Client Name";
    case "deliverables": return "Deliverables";
    case "project_dates_locations": return "Project Date & Location";
    case "project_status": return "Project Status";
    case "headline_description": return "Headline Description";
    case "client_budget": return "Client Budget";
    case "project_cost": return "Project Cost";
    case "style_direction": return "Style Direction";
    case "shotlist": return "Shotlist";
    case "delivery_links": return "Delivery Links";
    case "expenses": return "Expenses";
    case "terms_and_conditions": return "Terms & Conditions";
    case "rams": return "RAMS";
    case "insurance": return "Insurance";
    case "additional_requests": return "Additional Requests";
    case "notes": return "Notes";
  }
}


