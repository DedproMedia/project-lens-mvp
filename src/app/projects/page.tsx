// NOTE: This is a Server Component — do NOT add "use client" here.
import AddProjectButton from "./_components/AddProjectButton";

export default async function ProjectsPage() {
  return (
    <div style={{ padding: 16, display: "grid", gap: 12 }}>
      {/* Header row */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
        <h1 style={{ margin: 0 }}>Projects</h1>
        <AddProjectButton />
      </div>

      {/* Optional toolbar (keep if you need it) */}
      {/* 
      <form action="/projects" method="get" style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <input
          name="q"
          placeholder="Search projects"
          style={{ padding: 8, border: "1px solid #ddd", borderRadius: 6 }}
          defaultValue=""
        />
        <button type="submit" style={{ padding: "8px 12px", border: "1px solid #ddd", borderRadius: 6 }}>
          Search
        </button>
      </form>
      */}

      {/* Content area (placeholder for now) */}
      <div style={{ border: "1px solid #eee", borderRadius: 10, padding: 16, minHeight: 120 }}>
        <p style={{ margin: 0, color: "#666" }}>
          Your projects will appear here. Click <em>New Project</em> to create one.
        </p>
      </div>
    </div>
  );
}



