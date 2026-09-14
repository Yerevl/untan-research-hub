import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { getSupabaseClient } from '@/lib/supabase';
import { normalizeSecretKey } from '@/lib/vault';

const getFallbackFilePath = () => path.join(process.cwd(), 'src', 'data', 'vaults_v2.json');

function readLocalFallback(): Record<string, string[]> {
  try {
    const p = getFallbackFilePath();
    if (!fs.existsSync(p)) return {};
    return JSON.parse(fs.readFileSync(p, 'utf-8') || '{}');
  } catch {
    return {};
  }
}

function writeLocalFallback(data: Record<string, string[]>): void {
  try {
    const p = getFallbackFilePath();
    const dir = path.dirname(p);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(p, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.warn('[Vault] Local fallback write deferred:', err);
  }
}

// GET: Retrieve bookmarks by sync code
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const rawCode = searchParams.get('code') || searchParams.get('key');
    const isHealthCheck = searchParams.get('health') === 'true' || searchParams.get('diag') === 'true';

    const client = getSupabaseClient();

    // Healthcheck mode
    if (isHealthCheck) {
      let rpcWorks = false;
      let tableWorks = false;

      if (client) {
        try {
          const { error: rpcErr } = await client.rpc('get_bookmarks', { p_sync_code: '__healthcheck__' });
          rpcWorks = !rpcErr || rpcErr.code === 'PGRST116';
        } catch {}

        try {
          const { error: tblErr } = await client.from('user_bookmarks').select('sync_code').limit(1);
          tableWorks = !tblErr;
        } catch {}
      }

      return NextResponse.json({
        service: 'Untan Bookmarks Sync API v2',
        cloudConfigured: Boolean(client),
        rpcReady: rpcWorks,
        tableReady: tableWorks,
        operational: rpcWorks || tableWorks,
      });
    }

    if (!rawCode) {
      return NextResponse.json({ service: 'Untan Bookmarks Sync API v2', status: 'ready' });
    }

    const syncCode = normalizeSecretKey(rawCode);

    // 1. Try Supabase RPC (PostgREST cache-immune)
    if (client) {
      try {
        const { data, error } = await client.rpc('get_bookmarks', { p_sync_code: syncCode });
        if (!error && Array.isArray(data)) {
          return NextResponse.json({ success: true, syncCode, bookmarks: data, source: 'supabase-rpc' });
        }
      } catch {}

      // 2. Try Supabase Table direct query fallback
      try {
        const { data, error } = await client
          .from('user_bookmarks')
          .select('bookmarks')
          .eq('sync_code', syncCode)
          .maybeSingle();

        if (!error && data && Array.isArray(data.bookmarks)) {
          return NextResponse.json({ success: true, syncCode, bookmarks: data.bookmarks, source: 'supabase-table' });
        }
      } catch {}
    }

    // 3. Fallback to local server JSON store
    const local = readLocalFallback();
    if (local[syncCode]) {
      return NextResponse.json({ success: true, syncCode, bookmarks: local[syncCode], source: 'local-fallback' });
    }

    return NextResponse.json(
      { success: false, error: 'Koleksi dengan kode tersebut tidak ditemukan.' },
      { status: 404 }
    );
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message || 'Server error' }, { status: 500 });
  }
}

// POST: Save or sync bookmarks
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const rawCode = body.code || body.syncCode || body.secretKey;
    const rawBookmarks = body.bookmarks;

    if (!rawCode) {
      return NextResponse.json({ success: false, error: 'Kode sinkronisasi wajib diisi.' }, { status: 400 });
    }

    const syncCode = normalizeSecretKey(rawCode);
    const bookmarks: string[] = Array.isArray(rawBookmarks) ? rawBookmarks : [];

    // Always update server local fallback
    try {
      const local = readLocalFallback();
      local[syncCode] = bookmarks;
      writeLocalFallback(local);
    } catch {}

    const client = getSupabaseClient();
    let syncedToCloud = false;

    if (client) {
      // 1. Try Supabase RPC (PostgREST cache-immune)
      try {
        const { data, error } = await client.rpc('save_bookmarks', {
          p_sync_code: syncCode,
          p_bookmarks: bookmarks,
        });
        if (!error) {
          syncedToCloud = true;
        }
      } catch {}

      // 2. Try Supabase Table fallback if RPC failed
      if (!syncedToCloud) {
        try {
          const { error } = await client.from('user_bookmarks').upsert(
            { sync_code: syncCode, bookmarks, updated_at: new Date().toISOString() },
            { onConflict: 'sync_code' }
          );
          if (!error) {
            syncedToCloud = true;
          }
        } catch {}
      }
    }

    return NextResponse.json({
      success: true,
      syncCode,
      bookmarks,
      syncedToCloud,
      updatedAt: new Date().toISOString(),
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message || 'Server error' }, { status: 500 });
  }
}
