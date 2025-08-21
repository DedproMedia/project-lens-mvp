import Sidebar from "../../components/Sidebar";

export default function DashboardPage() {
  return (
    <main className="min-h-screen grid grid-cols-[260px_1fr]">
      <Sidebar />

      <section className="p-6 space-y-6">
        <header className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Projects</h1>
          <a
            href="/dashboard?new=1"
            className="bg-accent px-4 py-2 rounded hover:opacity-90"
          >
            + New Project
          </a>
        </header>

        {/* Placeholder list/table (replace with your real table if you already have one) */}
        <div className="bg-white/5 border border-white/10 rounded-lg p-4">
          <p className="text-white/70">
            Your projects will appear here. Use <b>+ New Project</b> or select
            one from the list to edit details.
          </p>
        </div>
      </section>
    </main>
  );
}
