// NOTE: This is a Server Component — do NOT add "use client" here.
import AddClientButton from "./_components/AddClientButton";

export default async function ClientsPage() {
  return (
    <div style={{ padding: 16, display: "grid", gap: 12 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
        <h1 style={{ margin: 0 }}>Clients</h1>
        <AddClientButton />
      </div>

      {/* Optional toolbar (keep if you need it) */}
      {/* 
      <form action="/clients" method="get" style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <input
          name="q"
          placeholder="Search clients"
          style={{ padding: 8, border: "1px solid #ddd", borderRadius: 6 }}
          defaultValue=""
        />
        <button type="submit" style={{ padding: "8px 12px", border: "1px solid #ddd", borderRadius: 6 }}>
          Search
        </button>
      </form>
      */}

      <div style={{ border: "1px solid #eee", borderRadius: 10, padding: 16, minHeight: 120 }}>
        <p style={{ margin: 0, color: "#666" }}>
          Your clients will appear here. Click <em>New Client</em> to create one.
        </p>
      </div>
    </div>
  );
}



