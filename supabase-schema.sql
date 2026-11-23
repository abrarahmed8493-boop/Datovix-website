-- Run this script in Supabase SQL Editor.
create extension if not exists pgcrypto;

create table if not exists public.enquiries (
  id uuid primary key default gen_random_uuid(),
  reference_code text not null unique default ('DVX-' || upper(substr(replace(gen_random_uuid()::text,'-',''),1,10))),
  full_name text not null,
  company_name text,
  email text not null,
  phone text,
  industry text,
  company_size text,
  services text[] not null default '{}',
  data_method text,
  budget text,
  description text not null,
  attachment_path text,
  contact_method text,
  consent boolean not null default false,
  status text not null default 'New' check (status in ('New','Contacted','In Discussion','Converted','Rejected')),
  internal_notes text,
  created_at timestamptz not null default now()
);

create table if not exists public.clients (
  id uuid primary key default gen_random_uuid(),
  company_name text not null,
  contact_name text,
  email text,
  phone text,
  created_at timestamptz not null default now()
);
create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references public.clients(id) on delete set null,
  project_name text not null,
  description text,
  status text not null default 'Planning',
  created_at timestamptz not null default now()
);
create table if not exists public.services (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  description text,
  active boolean not null default true
);
create table if not exists public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  email text not null,
  message text not null,
  created_at timestamptz not null default now()
);

-- Enable RLS on all business tables.
alter table public.enquiries enable row level security;
alter table public.clients enable row level security;
alter table public.projects enable row level security;
alter table public.services enable row level security;
alter table public.contact_messages enable row level security;

-- Public visitors may create enquiries only. No public read/update/delete.
drop policy if exists "Public can submit enquiries" on public.enquiries;
create policy "Public can submit enquiries" on public.enquiries
for insert to anon, authenticated
with check (consent = true and length(trim(full_name)) between 2 and 100
  and length(trim(email)) between 5 and 254
  and length(trim(description)) between 10 and 3000);

-- Only authenticated users who are explicitly listed as admins can read/manage records.
create table if not exists public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade
);
alter table public.admin_users enable row level security;
-- Users cannot self-enrol as admins. Add admin user UUID manually in SQL editor.
drop policy if exists "Admins can view own admin record" on public.admin_users;
create policy "Admins can view own admin record" on public.admin_users
for select to authenticated using (auth.uid() = user_id);
create or replace function public.is_datovix_admin()
returns boolean language sql stable security definer
set search_path = public
as $$ select exists(select 1 from public.admin_users where user_id = auth.uid()) $$;

drop policy if exists "Admins can read enquiries" on public.enquiries;
create policy "Admins can read enquiries" on public.enquiries
for select to authenticated using (public.is_datovix_admin());
drop policy if exists "Admins can update enquiries" on public.enquiries;
create policy "Admins can update enquiries" on public.enquiries
for update to authenticated using (public.is_datovix_admin())
with check (public.is_datovix_admin());
drop policy if exists "Admins can manage clients" on public.clients;
create policy "Admins can manage clients" on public.clients
for all to authenticated using (public.is_datovix_admin()) with check (public.is_datovix_admin());
drop policy if exists "Admins can manage projects" on public.projects;
create policy "Admins can manage projects" on public.projects
for all to authenticated using (public.is_datovix_admin()) with check (public.is_datovix_admin());
drop policy if exists "Anyone can read active services" on public.services;
create policy "Anyone can read active services" on public.services
for select to anon, authenticated using (active = true);
drop policy if exists "Admins can manage services" on public.services;
create policy "Admins can manage services" on public.services
for all to authenticated using (public.is_datovix_admin()) with check (public.is_datovix_admin());
drop policy if exists "Public can send contact messages" on public.contact_messages;
create policy "Public can send contact messages" on public.contact_messages
for insert to anon, authenticated with check (length(trim(full_name)) between 2 and 100 and length(trim(message)) between 5 and 3000);
drop policy if exists "Admins can read contact messages" on public.contact_messages;
create policy "Admins can read contact messages" on public.contact_messages
for select to authenticated using (public.is_datovix_admin());

-- Private file bucket. The upload policy restricts anonymous uploads to a per-submission folder.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('enquiry-files','enquiry-files',false,5242880,
array['application/pdf','text/csv','application/vnd.ms-excel','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'])
on conflict (id) do nothing;

drop policy if exists "Public can upload enquiry files" on storage.objects;
create policy "Public can upload enquiry files" on storage.objects
for insert to anon, authenticated with check (
  bucket_id = 'enquiry-files'
  and (storage.foldername(name))[1] is not null
);
drop policy if exists "Admins can read enquiry files" on storage.objects;
create policy "Admins can read enquiry files" on storage.objects
for select to authenticated using (bucket_id='enquiry-files' and public.is_datovix_admin());
