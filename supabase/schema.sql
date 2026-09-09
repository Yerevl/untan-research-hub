-- =========================================================
-- Skema Database Supabase untuk Untan Research Hub
-- Jalankan query ini di SQL Editor dashboard Supabase Anda
-- =========================================================

-- 1. Buat Tabel `articles`
create table if not exists public.articles (
  id uuid primary key default gen_random_uuid(),
  ojs_id text unique not null,
  title text not null,
  abstract text,
  authors text[] default '{}'::text[],
  student text,
  supervisors jsonb default '[]'::jsonb,
  keahlian text[] default '{}'::text[],
  institutions text[] default '{}'::text[],
  publication_date text,
  doi text,
  issue_name text,
  original_article_url text not null,
  original_pdf_url text,
  storage_pdf_path text,
  storage_pdf_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Index untuk Pencarian Cepat
create index if not exists idx_articles_ojs_id on public.articles (ojs_id);
create index if not exists idx_articles_issue on public.articles (issue_name);
create index if not exists idx_articles_pub_date on public.articles (publication_date);

-- Full-Text Search Index (Bahasa Inggris & Indonesia)
create index if not exists idx_articles_fts on public.articles 
using gin (to_tsvector('indonesian', coalesce(title, '') || ' ' || coalesce(abstract, '')));

-- 3. Row Level Security (RLS)
alter table public.articles enable row level security;

-- Kebijakan: Siapapun (Public/Anon) bisa membaca artikel
create policy "Allow public read access on articles" 
  on public.articles 
  for select 
  using (true);

-- Kebijakan: Service role / Authenticated bisa insert & update
create policy "Allow service role full access on articles" 
  on public.articles 
  for all 
  using (true)
  with check (true);

-- 4. Storage Bucket Setup untuk File PDF
-- Catatan: Anda juga bisa membuat bucket 'journal-pdfs' langsung melalui UI Supabase Storage:
-- Menu "Storage" -> "New bucket" -> Beri nama "journal-pdfs" -> Centang "Public bucket".
insert into storage.buckets (id, name, public)
values ('journal-pdfs', 'journal-pdfs', true)
on conflict (id) do update set public = true;

-- Kebijakan Storage: Siapapun bisa membaca/mengunduh PDF
create policy "Public Access to Journal PDFs"
  on storage.objects for select
  using (bucket_id = 'journal-pdfs');

-- Kebijakan Storage: Service Role dapat mengunggah PDF
create policy "Allow upload to journal-pdfs"
  on storage.objects for insert
  with check (bucket_id = 'journal-pdfs');

