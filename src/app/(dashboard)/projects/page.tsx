import RequireAuth from "@/app/components/RequireAuth";
import AddProjectButton from "./_components/AddProjectButton";
import ProjectsList from "./_components/ProjectsList";

export default async function ProjectsPage() {
  return (
    <RequireAuth>
      <div style={{ padding: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h1 style={{ margin: 0 }}>Projects</h1>
          <AddProjectButton />
        </div>

        <div style={{ marginTop: 16, border: "1px solid #eee", borderRadius: 10, padding: 16 }}>
          <ProjectsList />
        </div>
      </div>
    </RequireAuth>
  );
}

