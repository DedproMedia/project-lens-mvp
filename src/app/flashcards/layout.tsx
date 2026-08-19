import type { ReactNode } from "react";
import Link from "next/link";

export const metadata = {
  title: "Capital Cities Flashcards",
  description: "Learn the capital cities of the world",
};

export default function FlashcardsLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-black text-white px-6 py-4 flex items-center justify-between">
        <Link href="/flashcards" className="text-2xl font-bold">
          🌍 Capital Cities
        </Link>
        <Link href="/" className="text-sm text-white/60 hover:text-white">
          Back to Project Lens
        </Link>
      </header>
      <main className="flex-1 bg-white p-6">{children}</main>
    </div>
  );
}
