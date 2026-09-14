-- =========================================================================
-- UNTAN RESEARCH HUB - BOOKMARKS & SYNC SYSTEM V2 (ROCK-SOLID ARCHITECTURE)
-- DILENGKAPI: AUTO-EXPIRATION SETELAH 30 HARI TIDAK AKTIF (INACTIVITY TTL)
-- =========================================================================
-- Jalankan query ini di Supabase -> SQL Editor (ikon >_)
-- =========================================================================

-- 1. Buat / Perbarui Tabel `user_bookmarks`
create table if not exists public.user_bookmarks (
  id uuid primary key default gen_random_uuid(),
  sync_code text unique not null,
  bookmarks text[] default '{}'::text[],
  created_at timestamptz default timezone('utc'::text, now()) not null,
  updated_at timestamptz default timezone('utc'::text, now()) not null,
  last_accessed_at timestamptz default timezone('utc'::text, now()) not null
);

-- Tambahkan kolom last_accessed_at jika tabel sudah ada sebelumnya
alter table public.user_bookmarks add column if not exists last_accessed_at timestamptz default timezone('utc'::text, now()) not null;

-- 2. Index untuk pencarian instan
create index if not exists idx_user_bookmarks_sync_code on public.user_bookmarks (sync_code);
create index if not exists idx_user_bookmarks_last_accessed on public.user_bookmarks (last_accessed_at);

-- 3. Row Level Security (RLS Aktif Resmi - 0 Security Warnings di Supabase Advisor)
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

-- 5. RPC FUNCTIONS DENGAN AUTO-EXPIRATION 30 HARI

-- Fungsi 1: Menyimpan / Memperbarui Bookmarks (Reset timer 30 hari)
create or replace function public.save_bookmarks(p_sync_code text, p_bookmarks text[])
returns text[]
language plpgsql
security definer
as $$
declare
  v_result text[];
begin
  insert into public.user_bookmarks (sync_code, bookmarks, updated_at, last_accessed_at)
  values (p_sync_code, p_bookmarks, timezone('utc'::text, now()), timezone('utc'::text, now()))
  on conflict (sync_code) do update
    set bookmarks = EXCLUDED.bookmarks,
        updated_at = timezone('utc'::text, now()),
        last_accessed_at = timezone('utc'::text, now())
  returning bookmarks into v_result;

  return coalesce(v_result, '{}'::text[]);
end;
$$;

-- Fungsi 2: Mengambil Bookmarks & Perpanjang Waktu Aktif (Hapus jika > 30 hari tidak dibuka)
create or replace function public.get_bookmarks(p_sync_code text)
returns text[]
language plpgsql
security definer
as $$
declare
  v_result text[];
  v_last_accessed timestamptz;
begin
  -- Periksa apakah data ada dan kapan terakhir diakses
  select last_accessed_at into v_last_accessed
  from public.user_bookmarks
  where sync_code = p_sync_code;

  if not found then
    return null;
  end if;

  -- Jika tidak aktif selama lebih dari 30 hari, hapus langsung (Expired)
  if v_last_accessed < timezone('utc'::text, now()) - interval '30 days' then
    delete from public.user_bookmarks where sync_code = p_sync_code;
    return null;
  end if;

  -- Jika masih aktif (< 30 hari), perbarui last_accessed_at ke saat ini (Reset timer 30 hari)
  update public.user_bookmarks
  set last_accessed_at = timezone('utc'::text, now())
  where sync_code = p_sync_code
  returning bookmarks into v_result;

  return v_result;
end;
$$;

-- Fungsi 3: Pembersih Berkala Seluruh Data yang Tidak Aktif > 30 Hari (Dipanggil oleh Cron Job)
create or replace function public.cleanup_expired_bookmarks()
returns integer
language plpgsql
security definer
as $$
declare
  deleted_count integer;
begin
  delete from public.user_bookmarks
  where last_accessed_at < timezone('utc'::text, now()) - interval '30 days';

  get diagnostics deleted_count = row_count;
  return coalesce(deleted_count, 0);
end;
$$;

-- 6. Berikan Izin Eksekusi Fungsi RPC
grant execute on function public.save_bookmarks(text, text[]) to anon, authenticated, service_role, authenticator;
grant execute on function public.get_bookmarks(text) to anon, authenticated, service_role, authenticator;
grant execute on function public.cleanup_expired_bookmarks() to anon, authenticated, service_role, authenticator;

-- 7. Bersihkan tabel eksperimen lama jika ada
drop table if exists public.user_vaults;

-- 8. Refresh Schema
notify pgrst, 'reload schema';
