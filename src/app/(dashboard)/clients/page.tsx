// Server Component — no "use client"
import AddClientButton from "./_components/AddClientButton";
import ClientsList from "./_components/ClientsList";

export default async function ClientsPage() {
  return (
    <div style={{ padding: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1 style={{ margin: 0 }}>Clients</h1>
        <AddClientButton />
      </div>

      <div style={{ marginTop: 16, border: "1px solid #eee", borderRadius: 10, padding: 16 }}>
        <ClientsList />
      </div>
    </div>
  );
}

