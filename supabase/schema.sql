-- Minimal schema for clients/projects/project_dates and invoices
create extension if not exists pgcrypto;

create table if not exists clients (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text,
  phone text,
  created_at timestamp with time zone default now()
);

create table if not exists projects (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  client_id uuid references clients(id) on delete set null,
  status text default 'PROSPECT',
  headline text,
  notes text,
  created_at timestamp with time zone default now()
);

create table if not exists project_dates (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references projects(id) on delete cascade,
  starts_at timestamp with time zone not null,
  ends_at timestamp with time zone not null,
  location text
);

create table if not exists invoices (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references projects(id) on delete set null,
  client_id uuid references clients(id) on delete set null,
  invoice_number text not null,
  issue_date date not null,
  due_date date not null,
  status text default 'draft',
  notes text,
  total numeric
);

create table if not exists invoice_items (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid references invoices(id) on delete cascade,
  description text not null,
  quantity int default 1,
  unit_cost numeric default 0,
  tax_rate numeric
);
