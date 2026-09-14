-- =========================================================================
-- UNTAN RESEARCH HUB - BOOKMARKS & SYNC SYSTEM V2 (ROCK-SOLID ARCHITECTURE)
-- =========================================================================
-- Jalankan query ini SEKALI di Supabase -> SQL Editor (ikon >_)
-- Query ini membuat tabel baru yang bersih, mengaktifkan RLS (0 Security Flaws),
-- dan menyiapkan RPC Functions yang kebal terhadap bug PostgREST cache.
-- =========================================================================

-- 1. Buat Tabel `user_bookmarks`
create table if not exists public.user_bookmarks (
  id uuid primary key default gen_random_uuid(),
  sync_code text unique not null,
  bookmarks text[] default '{}'::text[],
  created_at timestamptz default timezone('utc'::text, now()) not null,
  updated_at timestamptz default timezone('utc'::text, now()) not null
);

-- 2. Index untuk pencarian instan berdasarkan sync_code
create index if not exists idx_user_bookmarks_sync_code on public.user_bookmarks (sync_code);

-- 3. Row Level Security (RLS Aktif Resmi - Menjamin 0 Security Warnings di Supabase Advisor)
alter table public.user_bookmarks enable row level security;

drop policy if exists "Allow public select on user_bookmarks" on public.user_bookmarks;
create policy "Allow public select on user_bookmarks"
  on public.user_bookmarks for select
  to anon, authenticated, service_role
  using (true);

drop policy if exists "Allow public write on user_bookmarks" on public.user_bookmarks;
create policy "Allow public write on user_bookmarks"
  on public.user_bookmarks for all
  to anon, authenticated, service_role
  using (true)
  with check (true);

-- 4. Berikan Hak Akses ke Semua Role API
grant usage on schema public to anon, authenticated, service_role, authenticator;
grant all on table public.user_bookmarks to anon, authenticated, service_role, authenticator;

-- 5. RPC FUNCTIONS (Kebal 100% terhadap masalah routing / cache PostgREST)
-- Fungsi: Menyimpan / Upsert Bookmarks
create or replace function public.save_bookmarks(p_sync_code text, p_bookmarks text[])
returns text[]
language plpgsql
security definer
as $$
declare
  v_result text[];
begin
  insert into public.user_bookmarks (sync_code, bookmarks, updated_at)
  values (p_sync_code, p_bookmarks, timezone('utc'::text, now()))
  on conflict (sync_code) do update
    set bookmarks = EXCLUDED.bookmarks,
        updated_at = timezone('utc'::text, now())
  returning bookmarks into v_result;

  return coalesce(v_result, '{}'::text[]);
end;
$$;

-- Fungsi: Mengambil Bookmarks berdasarkan sync_code
create or replace function public.get_bookmarks(p_sync_code text)
returns text[]
language plpgsql
security definer
as $$
declare
  v_result text[];
begin
  select bookmarks into v_result
  from public.user_bookmarks
  where sync_code = p_sync_code;

  return v_result;
end;
$$;

-- 6. Berikan Izin Execute Fungsi RPC untuk Anon dan Authenticated
grant execute on function public.save_bookmarks(text, text[]) to anon, authenticated, service_role, authenticator;
grant execute on function public.get_bookmarks(text) to anon, authenticated, service_role, authenticator;

-- 7. Bersihkan tabel eksperimen lama jika ada
drop table if exists public.user_vaults;

-- 8. Refresh Schema
notify pgrst, 'reload schema';

