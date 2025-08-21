export default function Page() {
  return (
    <main className="p-10">
      <h1 className="text-2xl font-semibold mb-2">Calendar ICS Feed</h1>
      <p className="text-white/70 mb-4">Subscribe to your project dates in Apple/Google/Outlook.</p>
      <p>Copy this URL into your calendar app:</p>
      <pre className="bg-white/10 p-3 rounded mt-2">
        {process.env.APP_BASE_URL || 'http://localhost:3000'}/api/ics
      </pre>
    </main>
  );
}
