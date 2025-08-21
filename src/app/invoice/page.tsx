'use client';
import Link from 'next/link';
export default function Page() {
  return (
    <main className="p-10">
      <h1 className="text-2xl font-semibold mb-2">Invoice Demo</h1>
      <p className="text-white/70 mb-4">Generate a simple invoice PDF (single template).</p>
      <Link className="underline text-accent" href="/api/invoice?demo=1" target="_blank">Generate Demo Invoice PDF</Link>
    </main>
  );
}
