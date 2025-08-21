import Sidebar from "@/components/Sidebar";

export default function ClientsPage() {
  return (
    <main className="min-h-screen grid grid-cols-[260px_1fr]">
      <Sidebar />

      <section className="p-6 space-y-6">
        <header className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Clients</h1>
          <a
            href="/clients?new=1"
            className="px-4 py-2 rounded bg-accent hover:opacity-90"
          >
            + Add Client
          </a>
        </header>

        <div className="bg-white/5 border border-white/10 rounded-lg p-4">
          <p className="text-white/70">
            Your client directory will show here. Search, sort and add new
            contacts as needed.
          </p>
        </div>
      </section>
    </main>
  );
}

