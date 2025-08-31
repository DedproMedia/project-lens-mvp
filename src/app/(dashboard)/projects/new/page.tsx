"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase-browser";

type Client = { id: string; name: string };

export default function NewProjectPage() {
  const [title, setTitle] = useState("");
  const [headline, setHeadline] = useState("");
  const [clientId, setClientId] = useState<string | null>(null);
  const [clients, setClients] = useState<Client[]>([]);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const router = useRouter();

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      const supabase = supabaseBrowser();
      const { data, error } = await supabase.from("clients").select("id,name").order("name");

      if (!mounted) return;
      if (!error && data) {
        setClients(data.map((c) => ({ id: String(c.id), name: c.name })));
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setErr(null);

    const supabase = supabaseBrowser();
    const { error } = await supabase.from("projects").insert([
      {
        name: title,
        title,
        headline_description: headline,
        client_id: clientId,
        config: { elements: {}, visibility: {}, editability: {}, data: {} },
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
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-xl font-semibold mb-4">New Project</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        {err && <p className="text-sm text-red-600">{err}</p>}

        {/* Project Title */}
        <div>
          <label className="block text-sm font-medium mb-1 text-gray-800">Project Title</label>
          <input
            type="text"
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm bg-white focus:outline-none focus:ring-1 focus:ring-red-500"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </div>

        {/* Headline Description */}
        <div>
          <label className="block text-sm font-medium mb-1 text-gray-800">Headline Description</label>
          <textarea
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm bg-white focus:outline-none focus:ring-1 focus:ring-red-500"
            rows={3}
            value={headline}
            onChange={(e) => setHeadline(e.target.value)}
          />
        </div>

        {/* Client */}
        <div>
          <label className="block text-sm font-medium mb-1 text-gray-800">Client</label>
          <select
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm bg-white focus:outline-none focus:ring-1 focus:ring-red-500"
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
          <p className="mt-1 text-xs text-gray-500">
            Need a new client? <a href="/clients/new" className="text-red-600 hover:underline">+ Add one</a>
          </p>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4">
          <button
            type="button"
            onClick={() => router.push("/projects")}
            className="px-4 py-2 rounded-md border text-sm font-medium text-gray-700 hover:bg-gray-100"
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
  );
}


