# Project Lens MVP (Next.js + Supabase)

This is a **ready-to-run MVP**: Google/email login, Projects & Clients pages, ICS calendar feed, and Invoice PDF demo.

## Quick Start
1) Install Node (LTS) from https://nodejs.org/en
2) In Supabase: create a project → Settings → API → copy **Project URL** + **anon key**.
3) In this folder:
```bash
npm install
cp .env.example .env.local
# open .env.local and paste your two Supabase values
npm run dev
```
Open http://localhost:3000
