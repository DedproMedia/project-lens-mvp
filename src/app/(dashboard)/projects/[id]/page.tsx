// FILE 1: src/app/(dashboard)/projects/[id]/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase-browser";

const ALL_ELEMENTS = [
  "project_title","client_name","deliverables","project_dates_locations","project_status",
  "headline_description","client_budget","project_cost","style_direction","shotlist",
  "delivery_links","expenses","terms_and_conditions","rams","insurance","additional_requests","notes",
] as const;

type ElementKey = (typeof ALL_ELEMENTS)[number];

type Client = { id: string; name: string };
interface StatusType { id: number; name: string; color: string | null }
interface Currency { code: string; name?: string | null }

interface ProjectConfig {
  elements?: ElementKey[];
  visibility?: Record<ElementKey, boolean>;
  editability?: Record<ElementKey, boolean>;
  data?: Record<string, any>;
}

interface Project {
  id: string;
  name?: string | null;
  title?: string | null;
  client_id?: string | null;
  headline_description?: string | null;
  created_at?: string;
  config?: ProjectConfig | null;
}

export default function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const search = useSearchParams();

  const [editMode, setEditMode] = useState(false);
  const [proj, setProj] = useState<Project | null>(null);
  const [clients, setClients] = useState<Client[]>([]);
  const [statuses, setStatuses] = useState<StatusType[]>([]);
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  // form
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
  const [data, setData] = useState<Record<string, any>>({});

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let mounted = true;
    setEditMode(search.get("mode") === "edit");

    const load = async () => {
      setLoading(true); setErr(null);
      const supabase = supabaseBrowser();

      const [p, c, s, cur] = await Promise.all([
        supabase.from("projects").select("*").eq("id", id).single(),
        supabase.from("clients").select("id,name").order("name"),
        supabase.from("project_status_types").select("id,name,color").order("name"),
        supabase.from("currencies").select("code,name").order("code"),
      ]);
      if (!mounted) return;

      if (!c.error && c.data) setClients((c.data as any[]).map(x=>({id:String(x.id), name:String(x.name)})));
      if (!s.error && s.data) setStatuses((s.data as any[]).map(x=>({id:Number(x.id), name:String(x.name), color:x.color??null})));
      if (!cur.error && cur.data) setCurrencies((cur.data as any[]).map(x=>({code:String(x.code), name:x.name??null})));

      if (p.error) { setErr(p.error.message); setLoading(false); return; }

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

      const derivedTitle = record.name ?? record.title ?? "";
      setTitle(derivedTitle);
      setClientId(record.client_id ?? "");
      setHeadline(record.headline_description ?? "");

      const cfg = (record.config ?? {}) as ProjectConfig;
      const a = Object.fromEntries(ALL_ELEMENTS.map(k => [k, Boolean(cfg.elements?.includes(k))])) as Record<ElementKey, boolean>;
      const v = Object.fromEntries(ALL_ELEMENTS.map(k => [k, Boolean(cfg.visibility?.[k])])) as Record<ElementKey, boolean>;
      const e = Object.fromEntries(ALL_ELEMENTS.map(k => [k, Boolean(cfg.editability?.[k])])) as Record<ElementKey, boolean>;
      setActive(a); setVisible(v); setEditable(e);
      setData({ ...(cfg.data ?? {}) });

      // ensure project_status exists in data so dropdown works even if element disabled previously
      setData(d => ({
        "project_status.name": d["project_status.name"] ?? "",
        "project_status.custom": d["project_status.custom"] ?? "",
        ...d,
      }));

      setLoading(false);
    };

    load();
    return () => { mounted = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selectedElements = useMemo(() => ALL_ELEMENTS.filter(k => active[k]), [active]);
  const toggle = (state: any, setState: any, key: ElementKey) => setState((s:any)=>({ ...s, [key]: !s[key] }));
  const getD = <T,>(key:string, fallback:T):T => (data?.[key] ?? fallback) as T;
  const setD = (key:string, value:any) => setData(d => ({ ...d, [key]: value }));

  const save = async () => {
    if (!proj) return;
    setSaving(true); setErr(null);
    const supabase = supabaseBrowser();

    // persist config
    const config: ProjectConfig = { elements: selectedElements, visibility, editability, data };
    const base: any = { client_id: clientId || null, headline_description: headline || null, config };
    const attempt = async (field: "name"|"title") => supabase.from("projects").update({ ...base, [field]: title }).eq("id", proj.id);

    let ok = false; let updErr: string | null = null;
    const r1 = await attempt("name");
    if (r1.error) { const r2 = await attempt("title"); if (r2.error) updErr = r2.error.message; else ok = true; }
    else ok = true;

    setSaving(false);
    if (!ok) { setErr(updErr || "Failed to save project"); return; }
    router.replace(`/projects/${proj.id}`);
    setEditMode(false);
  };

  const fmtDate = (iso?: string) => iso ? new Date(iso).toLocaleDateString(undefined,{year:"numeric",month:"short",day:"numeric"}) : "—";

  if (loading) return <div style={{ padding: 16 }}>Loading project…</div>;
  if (err) return <div style={{ padding:16, color:"crimson" }}>Error: {err}</div>;
  if (!proj) return <div style={{ padding: 16 }}>Not found.</div>;

  return (
    <div style={{ padding: 16, maxWidth: 1100 }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", gap: 12 }}>
        <h1 style={{ margin: 0 }}>{editMode ? "Edit Project" : "Project Details"}</h1>
        <div style={{ display:"flex", gap: 8 }}>
          {!editMode ? (
            <button onClick={()=>setEditMode(true)}>Edit</button>
          ) : (
            <>
              <button onClick={()=>{ router.replace(`/projects/${proj.id}`); setEditMode(false); }}>Cancel</button>
              <button onClick={save} disabled={saving}>{saving ? "Saving…" : "Save"}</button>
            </>
          )}
        </div>
      </div>
      <div style={{ color: "#555", fontSize: 13, marginTop: 6 }}>Created: {fmtDate(proj.created_at)}</div>

      {/* Basics */}
      <Section title="Basics">
        {editMode ? (
          <Grid cols={1} gap={12} maxW={720}>
            <label>Project title<input value={title} onChange={e=>setTitle(e.target.value)} /></label>
            <label>Client
              <select value={clientId} onChange={e=>setClientId(e.target.value)}>
                <option value="">— Select client —</option>
                {clients.map(c=> <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </label>
            <label>Headline / description<textarea value={headline} onChange={e=>setHeadline(e.target.value)} style={{ minHeight: 80 }} /></label>
          </Grid>
        ) : (
          <Grid cols={1} gap={8}>
            <KV label="Title" value={title || "—"} />
            <KV label="Client" value={clientId ? clients.find(c=>c.id===clientId)?.name || "—" : "—"} />
            <KV label="Headline" value={headline || "—"} />
          </Grid>
        )}
      </Section>

      {/* Project Status — always visible & editable here */}
      <Section title="Project Status">
        {editMode ? (
          <div style={{ display:"flex", gap: 8, alignItems:"center", flexWrap:"wrap" }}>
            <select
              value={getD<string>("project_status.name", "")}
              onChange={(e)=> setD("project_status.name", e.target.value)}
              style={{ minWidth: 220 }}
            >
              <option value="">— Select status —</option>
              {statuses.map(st => (
                <option key={st.id} value={st.name}>{st.name}</option>
              ))}
            </select>
            <input
              placeholder="Or type a custom status"
              value={getD<string>("project_status.custom", "")}
              onChange={(e)=> setD("project_status.custom", e.target.value)}
              style={{ minWidth: 240 }}
            />
            <Link href="/settings/status-types" style={{ marginLeft: 8 }}>Manage status list →</Link>
          </div>
        ) : (
          <KV
            label="Status"
            value={getD<string>("project_status.custom", "") || getD<string>("project_status.name", "—")}
          />
        )}
      </Section>

      {/* Elements picker & permissions */}
      <Section title="Project Elements">
        {editMode ? (
          <Grid cols={3} gap={8}>
            {ALL_ELEMENTS.map(k => (
              <label key={k} style={{ display:"flex", gap: 8, alignItems:"center" }}>
                <input type="checkbox" checked={!!active[k]} onChange={()=>toggle(active,setActive,k)} />
                <span>{labelFor(k)}</span>
              </label>
            ))}
          </Grid>
        ) : (
          <ul style={{ margin:0, paddingLeft:18 }}>
            {ALL_ELEMENTS.filter(k=>active[k]).map(k=> <li key={k}>{labelFor(k)}</li>)}
            {ALL_ELEMENTS.every(k=>!active[k]) && <li>None selected.</li>}
          </ul>
        )}
      </Section>

      <Section title="Client Permissions">
        {editMode ? (
          <table style={{ width:"100%", borderCollapse:"collapse" }}>
            <thead><tr style={{ borderBottom:"1px solid #e5e7eb" }}>
              <th style={{ padding:8, textAlign:"left" }}>Element</th>
              <th style={{ padding:8, textAlign:"left" }}>Client can view</th>
              <th style={{ padding:8, textAlign:"left" }}>Client can edit</th>
            </tr></thead>
            <tbody>
              {ALL_ELEMENTS.filter(k=>active[k]).map(k=> (
                <tr key={k} style={{ borderBottom:"1px solid #f3f4f6" }}>
                  <td style={{ padding:8 }}>{labelFor(k)}</td>
                  <td style={{ padding:8 }}>
                    <input type="checkbox" checked={!!visible[k]} onChange={()=>toggle(visible,setVisible,k)} />
                  </td>
                  <td style={{ padding:8 }}>
                    <input type="checkbox" checked={!!editable[k]} onChange={()=>toggle(editable,setEditable,k)} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <table style={{ width:"100%", borderCollapse:"collapse" }}>
            <thead><tr style={{ borderBottom:"1px solid #e5e7eb" }}>
              <th style={{ padding:8, textAlign:"left" }}>Element</th>
              <th style={{ padding:8, textAlign:"left" }}>Visible</th>
              <th style={{ padding:8, textAlign:"left" }}>Editable</th>
            </tr></thead>
            <tbody>
              {ALL_ELEMENTS.filter(k=>active[k]).map(k=> (
                <tr key={k} style={{ borderBottom:"1px solid #f3f4f6" }}>
                  <td style={{ padding:8 }}>{labelFor(k)}</td>
                  <td style={{ padding:8 }}>{visible[k] ? "Yes" : "No"}</td>
                  <td style={{ padding:8 }}>{editable[k] ? "Yes" : "No"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Section>

      {/* Other element editors omitted here for brevity — keep your existing ones unchanged */}
    </div>
  );
}

function Section({ title, children }:{ title:string; children:React.ReactNode }){
  return <section style={{ border:"1px solid #000", borderRadius:10, padding:16, marginTop:16 }}>
    <h3 style={{ marginTop:0 }}>{title}</h3>
    {children}
  </section>;
}
function Grid({ cols, gap, children, maxW }:{ cols:number; gap:number; children:any; maxW?:number }){
  return <div style={{ display:"grid", gridTemplateColumns:`repeat(${cols}, minmax(0,1fr))`, gap, maxWidth:maxW ?? "unset" }}>{children}</div>;
}
function KV({ label, value }:{ label:string; value:any }){
  return <div><strong>{label}:</strong> {value ?? "—"}</div>;
}
function labelFor(key: ElementKey){
  switch(key){
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
