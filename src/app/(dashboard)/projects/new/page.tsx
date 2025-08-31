"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase-browser";
import StatusSelect from "@/app/components/StatusSelect";

type Client = { id: string; name: string };

const AVAILABLE_ELEMENTS = [
  "Deliverables",
  "Dates",
  "Location",
  "Budget",
  "Cost",
  "Style Direction",
  "Shotlist",
  "Delivery Links",
  "Expenses",
  "Terms & Conditions",
  "RAMS",
  "Insurance",
  "Additional Requests",
  "Notes",
];

export default function NewProjectPage() {
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [headline, setHeadline] = useState("");
  const [clientId, setClientId] = useState<string | null>(null);
  const [clients, setClients] = useState<Client[]>([]);
  const [statusId, setStatusId] = useState<string | null>(null);

  const [activeElements, setActiveElements] = useState<string[]>([]);
  const [visible, setVisible] = useState<Record<string, boolean>>({});
  const [editable, setEditable] = useState<Record<string, boolean>>({});
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      const supabase = supabaseBrowser();
      const { data, error } = await supabase.from("clients").select("id,name").order("name");
      if (!mounted) return;
      if (!error && data) setClients(data.map((c) => ({ id: String(c.id), name: c.name })));
    };
    load();
    return () => {
      mounted = false;
    };
  }, []);

  const addElement = (el: string) => {
    if (!activeElements.includes(el)) {
      setActiveElements([...activeElements, el]);
    }
  };

  const removeElement = (el: string) => {
    setActiveElements(activeElements.filter((e) => e !== el));
    setVisible({ ...visible, [el]: false });
    setEditable({ ...editable, [el]: false });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setErr(null);

    const supabase = supabaseBrowser();
    const { error } = await supabase.from("projects").insert([
      {
        title,
        headline_description: headline,
        client_id: clientId,
        status_type_id: statusId,
        config: {
          elements: activeElements,
          visibility: visible,
          editability: editable,
          data: {},
        },
      },
    ]);

    if (error) {
      setErr(error.message);
      setSaving(false);
      return;
    }

    router.push("/projects");
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-6">
      {/* Left: Element Picker */}
      <div className="md:col-span-1 border-r pr-4">
        <h2 className="text-sm font-semibold mb-3">Available Elements</h2>
        <ul className="space-y-2">
          {AVAILABLE_ELEMENTS.map((el) => (
            <li key={el}>
              <button
                type="button"
                onClick={() => addElement(el)}
                className="w-full text-left px-3 py-2 border rounded-md text-sm hover:bg-gray-100"
              >
                ➕ Add {el}
              </button>
            </li>
          ))}
        </ul>
      </div>

      {/* Right: Form */}
      <div className="md:col-span-2 space-y-6">
        <h1 className="text-xl font-semibold">New Project</h1>

        {err && <p className="text-sm text-red-600">{err}</p>}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Base fields */}
          <div>
            <label className="block text-sm font-medium mb-1">Project Title</label>
            <input
              type="text"
              className="w-full border rounded-md px-3 py-2 text-sm"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Headline Description</label>
            <textarea
              className="w-full border rounded-md px-3 py-2 text-sm"
              rows={2}
              value={headline}
              onChange={(e) => setHeadline(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Client</label>
            <select
              className="w-full border rounded-md px-3 py-2 text-sm"
              value={clientId || ""}
              onChange={(e) => setClientId(e.target.value || null)}
              required
            >
              <option value="">Select client…</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-medium mb-1">Project Status</label>
            <StatusSelect value={statusId} onChange={setStatusId} />
          </div>

          {/* Dynamic Element Sections */}
          {activeElements.map((el) => (
            <div key={el} className="border rounded-md p-4 relative bg-gray-50">
              <div className="absolute top-2 right-2 flex gap-2 items-center">
                <label className="flex items-center gap-1 text-xs">
                  <input
                    type="checkbox"
                    checked={visible[el] || false}
                    onChange={(e) =>
                      setVisible({ ...visible, [el]: e.target.checked })
                    }
                  />
                  Visible
                </label>
                <label className="flex items-center gap-1 text-xs">
                  <input
                    type="checkbox"
                    checked={editable[el] || false}
                    onChange={(e) =>
                      setEditable({ ...editable, [el]: e.target.checked })
                    }
                  />
                  Editable
                </label>
                <button
                  type="button"
                  onClick={() => removeElement(el)}
                  className="text-xs text-red-600 hover:underline"
                >
                  ✖ Remove
                </button>
              </div>
              <h3 className="text-sm font-semibold mb-2">{el}</h3>
              <p className="text-xs text-gray-500 italic">[Input fields for {el} will go here]</p>
            </div>
          ))}

          {/* Actions */}
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => router.push("/projects")}
              className="px-4 py-2 border rounded-md text-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 rounded-md bg-red-600 text-white text-sm font-semibold hover:bg-red-700 disabled:opacity-50"
            >
              {saving ? "Saving…" : "Save Project"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

