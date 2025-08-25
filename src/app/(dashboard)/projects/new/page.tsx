"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase-browser";

const ALL_ELEMENTS = [
  "project_title","client_name","deliverables","project_dates_locations","project_status",
  "headline_description","client_budget","project_cost","style_direction","shotlist",
  "delivery_links","expenses","terms_and_conditions","rams","insurance","additional_requests","notes",
] as const;

type ElementKey = (typeof ALL_ELEMENTS)[number];
type Client = { id: string; name: string };

export default function NewProjectPage() {
  const router = useRouter();
  const supabase = supabaseBrowser();

  const [clients, setClients] = useState<Client[]>([]);
  const [loadingClients, setLoadingClients] = useState(true);

  const [title, setTitle] = useState("");
  const [clientId, setClientId] = useState("");
  const [headline, setHeadline] = useState("");

  const [active, setActive] = useState<Record<ElementKey, boolean>>(
    Object.fromEntries(ALL_ELEMENTS.map((k) => [k, false])) as Record<ElementKey, boolean>
  );
  const [visible, setVisible] = useState<Record<ElementKey, boolean>>(
    Object.fromEntries(ALL_ELEMENTS.map((k) => [k, false])) as Record<ElementKey, boolean>
  );
  const [editable, setEditable] = useState<Record<ElementKey, boolean>>(
    Object.fromEntries(ALL_ELEMENTS.map((k) => [k, false])) as Record<ElementKey, boolean>
  );

  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [collabLink, setCollabLink] = useState<string | null>(null);

  useEffect(() => {
    const loadClients = async () => {
      setLoadingClients(true);
      const { data, error } = await supabase.from("clients").select("id,name").order("name");
      setLoadingClients(false);
      if (error) {
        setErr(error.message);
        return;
      }
      setClients((data || []).map((c: any) => ({ id: String(c.id), name: String(c.name) })));
    };
    loadClients();
  }, [supabase]);

  const selectedElements = useMemo(() => ALL_ELEMENTS.filter((k) => active[k]), [active]);
  const toggle = (state: any, setState: any, key: ElementKey) =>
    setState((s: any) => ({ ...s, [key]: !s[key] }));

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    setSaving(true);

    const insertPayload: Record<string, any> = {
      headline_description: headline || null,
      client_id: clientId || null,
      config: {
        elements: selectedElements,
        visibility: visible,
        editability: editable,
      },
    };

    const attempt = async (field: "name" | "title") => {
      const payload = { ...insertPayload, [field]: title };
      return supabase.from("projects").insert(payload).select("id").single();
    };

    let projectId: string | null = null;
    let insertErr: string | null = null;

    {
      const { data, error } = await attempt("name");
      if (error) {
        const r2 = await attempt("title");
        if (r2.error) insertErr = r2.error.message;
        else projectId = String(r2.data.id);
      } else {
        projectId = String(data.id);
      }
    }

    if (!projectId) {
      setSaving(false);
      setErr(insertErr || "Failed to create project");
      return;
    }

    const token = cryptoRandom(24);
    const linkUrl = window.location.origin + `/share/${token}`;
    const { error: linkErr } = await supabase.from("project_collab_links").insert({
      project_id: projectId,
      token,
    });
    if (!linkErr) setCollabLink(linkUrl);

    setSaving(false);
    router.push(`/projects`);
  };

  return (
    <div className="pl-form" style={{ padding: 16, maxWidth: 900 }}>
      <h1 style={{ marginTop: 0 }}>New Project</h1>

      <form onSubmit={onSubmit} style={{ display: "grid", gap: 16 }}>
        <section style={{ border: "1px solid #eee", borderRadius: 10, padding: 16 }}>
          <h3 style={{ margin: "0 0 8px" }}>Basics</h3>

          <label style={{ display: "block", marginBottom: 8 }}>
            Project title
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              style={{ display: "block", width: "100%", padding: 8, marginTop: 4 }}
            />
          </label>

          <label style={{ display: "block", marginBottom: 8 }}>
            Client
            <select
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              required
              disabled={loadingClients}
              style={{ display: "block", width: "100%", padding: 8, marginTop: 4 }}
            >
              <option value="" disabled>
                {loadingClients ? "Loading clients…" : "Select a client"}
              </option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>

          <label style={{ display: "block" }}>
            Headline / description
            <textarea
              value={headline}
              onChange={(e) => setHeadline(e.target.value)}
              style={{ display: "block", width: "100%", padding: 8, marginTop: 4, minHeight: 80 }}
            />
          </label>
        </section>

        <section style={{ border: "1px solid #eee", borderRadius: 10, padding: 16 }}>
          <h3 style={{ margin: "0 0 8px" }}>Project Elements</h3>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
            {ALL_ELEMENTS.map((key) => (
              <label key={key} style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <input
                  type="checkbox"
                  checked={active[key]}
                  onChange={() => toggle(active, setActive, key)}
                />
                <span>{labelFor(key)}</span>
              </label>
            ))}
          </div>
        </section>

        {selectedElements.length > 0 && (
          <section style={{ border: "1px solid #eee", borderRadius: 10, padding: 16 }}>
            <h3 style={{ margin: "0 0 8px" }}>Client Permissions</h3>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ textAlign: "left", borderBottom: "1px solid #e5e7eb" }}>
                  <th style={{ padding: "8px" }}>Element</th>
                  <th style={{ padding: "8px" }}>Client can view</th>
                  <th style={{ padding: "8px" }}>Client can edit</th>
                </tr>
              </thead>
              <tbody>
                {selectedElements.map((key) => (
                  <tr key={key} style={{ borderBottom: "1px solid #f3f4f6" }}>
                    <td style={{ padding: "8px" }}>{labelFor(key)}</td>
                    <td style={{ padding: "8px" }}>
                      <input
                        type="checkbox"
                        checked={visible[key]}
                        onChange={() => toggle(visible, setVisible, key)}
                      />
                    </td>
                    <td style={{ padding: "8px" }}>
                      <input
                        type="checkbox"
                        checked={editable[key]}
                        onChange={() => toggle(editable, setEditable, key)}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        )}

        <div style={{ display: "flex", gap: 8 }}>
          <button type="submit" disabled={saving} style={{ padding: "10px 14px" }}>
            {saving ? "Creating…" : "Create project"}
          </button>
        </div>

        {err && <p style={{ color: "crimson" }}>Error: {err}</p>}
        {collabLink && (
          <p style={{ fontSize: 13 }}>
            Collaboration link: <code>{collabLink}</code>
          </p>
        )}
      </form>
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

function cryptoRandom(len: number) {
  const alphabet = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  const arr = new Uint32Array(len);
  // @ts-ignore
  (globalThis.crypto || (window as any).crypto).getRandomValues(arr);
  let out = "";
  for (let i = 0; i < len; i++) out += alphabet[arr[i] % alphabet.length];
  return out;
}

