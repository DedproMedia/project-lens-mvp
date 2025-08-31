"use client";

import { useEffect, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase-browser";

type Status = { id: string; name: string; color: string | null };

export default function StatusSelect({
  value,
  onChange,
}: {
  value: string | null;
  onChange: (id: string | null) => void;
}) {
  const [statuses, setStatuses] = useState<Status[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const load = async () => {
      const supabase = supabaseBrowser();
      const { data } = await supabase
        .from("project_status_types")
        .select("id, name, color")
        .order("name", { ascending: true });
      if (data) setStatuses(data);
    };
    load();
  }, []);

  const current = statuses.find((s) => s.id === value);

  return (
    <div className="relative inline-block">
      {/* Pill Display */}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="px-3 py-1 text-xs font-medium rounded-full"
        style={{
          backgroundColor: current?.color || "#9CA3AF",
          color: "#fff",
        }}
      >
        {current?.name || "—"}
      </button>

      {/* Dropdown Menu */}
      {open && (
        <div className="absolute z-10 mt-1 w-40 bg-white border border-gray-200 rounded shadow-lg">
          <ul className="max-h-48 overflow-y-auto text-sm">
            {statuses.map((s) => (
              <li key={s.id}>
                <button
                  type="button"
                  onClick={() => {
                    onChange(s.id);
                    setOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 hover:bg-gray-100"
                >
                  <span
                    className="inline-block w-3 h-3 rounded-full mr-2"
                    style={{ backgroundColor: s.color || "#999" }}
                  />
                  {s.name}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

