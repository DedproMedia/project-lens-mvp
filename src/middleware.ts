import { NextResponse, type NextRequest } from "next/server";

// flashlearnapp.com is the dedicated domain for the capital cities flashcard
// app, which otherwise lives at /flashcards inside this Next.js project
// alongside the unrelated Project Lens CRM. Serve the flashcard app straight
// from the root URL when visited via that domain.
const FLASHCARDS_HOSTS = new Set(["flashlearnapp.com", "www.flashlearnapp.com"]);

export function middleware(request: NextRequest) {
  const host = request.headers.get("host")?.split(":")[0] ?? "";
  if (FLASHCARDS_HOSTS.has(host)) {
    return NextResponse.rewrite(new URL("/flashcards", request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: "/",
};
