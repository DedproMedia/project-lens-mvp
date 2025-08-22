// NOTE: This is a Server Component — do NOT add "use client"
import AddProjectButton from "./_components/AddProjectButton";

export default async function ProjectsPage() {
  return (
    <div style={{ padding: 16 }}>
      {/* Page header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1 style={{ margin: 0 }}>Projects</h1>
        <AddProjectButton />
      </div>

      {/* Content area (placeholder for now) */}
      <div style={{ marginTop: 16, border: "1px solid #eee", borderRadius: 10, padding: 16 }}>
        <p style={{ margin: 0, color: "#666" }}>
          Your projects will appear here. Click <em>New Project</em> to create one.
        </p>
      </div>
    </div>
  );
}



