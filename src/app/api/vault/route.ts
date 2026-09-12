import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { getSupabaseClient, isSupabaseConfigured } from '@/lib/supabase';
import { CloudVaultRecord } from '@/lib/vault';

const getVaultFilePath = () => path.join(process.cwd(), 'src', 'data', 'vaults.json');

// Helper to read local JSON vaults fallback
function readLocalVaults(): Record<string, CloudVaultRecord> {
  try {
    const filePath = getVaultFilePath();
    if (!fs.existsSync(filePath)) return {};
    const content = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(content || '{}');
  } catch (err) {
    console.error('Error reading local vaults:', err);
    return {};
  }
}

// Helper to write local JSON vaults fallback
function writeLocalVaults(data: Record<string, CloudVaultRecord>): void {
  try {
    const filePath = getVaultFilePath();
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error writing local vaults:', err);
  }
}

interface SaveVaultResult {
  savedToLocal: boolean;
  savedToSupabase: boolean;
  tableUsed?: string | null;
  supabaseError?: string | null;
}

// Helper to get a vault record from Supabase or local fallback
async function getCloudVault(secretKey: string): Promise<CloudVaultRecord | null> {
  const client = getSupabaseClient();
  if (client) {
    const tableName = 'user_vaults';
    try {
      const { data, error } = await client
        .from(tableName)
        .select('*')
        .eq('secret_key', secretKey)
        .maybeSingle();

      if (!error && data) {
        let parsedBookmarks: string[] = [];
        if (Array.isArray(data.bookmarks)) {
          parsedBookmarks = data.bookmarks;
        } else if (typeof data.bookmarks === 'string') {
          try {
            const p = JSON.parse(data.bookmarks);
            if (Array.isArray(p)) parsedBookmarks = p;
          } catch {
            parsedBookmarks = [data.bookmarks];
          }
        }

        let parsedSecondary: string[] = [];
        if (Array.isArray(data.secondary_device_ids)) {
          parsedSecondary = data.secondary_device_ids;
        } else if (typeof data.secondary_device_ids === 'string') {
          try {
            const p = JSON.parse(data.secondary_device_ids);
            if (Array.isArray(p)) parsedSecondary = p;
          } catch {
            parsedSecondary = [data.secondary_device_ids];
          }
        }

        return {
          secret_key: data.secret_key,
          primary_device_id: data.primary_device_id,
          secondary_device_ids: parsedSecondary,
          bookmarks: parsedBookmarks,
          created_at: data.created_at,
          updated_at: data.updated_at,
        };
      }
    } catch (e) {
      console.warn(`[Vault] Error querying Supabase table "${tableName}":`, e);
    }
  }

  const localVaults = readLocalVaults();
  return localVaults[secretKey] || null;
}

// Helper to persist a vault record to Supabase and local fallback
async function saveCloudVault(record: CloudVaultRecord): Promise<SaveVaultResult> {
  const result: SaveVaultResult = {
    savedToLocal: false,
    savedToSupabase: false,
    tableUsed: null,
    supabaseError: null,
  };

  // Always update local fallback for offline resilience
  try {
    const localVaults = readLocalVaults();
    localVaults[record.secret_key] = record;
    writeLocalVaults(localVaults);
    result.savedToLocal = true;
  } catch (e: any) {
    console.warn('[Vault] Local JSON fallback deferred (read-only environment):', e?.message);
  }

  // If Supabase is active, persist to database
  const client = getSupabaseClient();
  if (!client) {
    result.supabaseError = 'Supabase client is not configured (missing URL or API keys in environment variables)';
    return result;
  }

  const tableName = 'user_vaults';
  try {
    // 1. Check if record already exists to avoid ON CONFLICT constraint requirements
    const { data: existingRow, error: checkErr } = await client
      .from(tableName)
      .select('secret_key')
      .eq('secret_key', record.secret_key)
      .maybeSingle();

    // If relation does not exist or route invalid (PGRST125/PGRST106)
    if (
      checkErr &&
      (checkErr.code === '42P01' ||
        checkErr.code === 'PGRST106' ||
        checkErr.code === 'PGRST125' ||
        checkErr.message?.includes('does not exist') ||
        checkErr.message?.includes('Invalid path'))
    ) {
      result.supabaseError = `Tabel "user_vaults" di Supabase belum terdeteksi oleh API PostgREST (Error ${checkErr.code}). Jalankan di SQL Editor Supabase: notify pgrst, 'reload schema';`;
      return result;
    }

    // If RLS blocked reading, report it
    if (checkErr && (checkErr.code === '42501' || checkErr.message?.includes('row-level security') || checkErr.message?.includes('policy'))) {
      result.supabaseError = `Supabase RLS memblokir read/write di tabel "${tableName}". Jalankan di SQL Editor: alter table public.${tableName} disable row level security;`;
      return result;
    }

      // Base payload
      const basePayload: Record<string, any> = {
        secret_key: record.secret_key,
        primary_device_id: record.primary_device_id,
        secondary_device_ids: record.secondary_device_ids,
        bookmarks: record.bookmarks,
        updated_at: record.updated_at,
      };

      if (existingRow) {
        // UPDATE existing row
        let { error: updateErr } = await client
          .from(tableName)
          .update(basePayload)
          .eq('secret_key', record.secret_key);

        // Fallback: If column types expect text instead of jsonb/array
        if (updateErr && (updateErr.message?.includes('json') || updateErr.message?.includes('array') || updateErr.code === '42804')) {
          const stringPayload = {
            ...basePayload,
            bookmarks: JSON.stringify(record.bookmarks),
            secondary_device_ids: JSON.stringify(record.secondary_device_ids),
          };
          const { error: stringErr } = await client
            .from(tableName)
            .update(stringPayload)
            .eq('secret_key', record.secret_key);
          updateErr = stringErr;
        }

        if (!updateErr) {
          result.savedToSupabase = true;
          result.tableUsed = tableName;
          result.supabaseError = null;
          console.log(`[Vault] Successfully updated Supabase table "${tableName}"`);
          return result;
        }

        result.supabaseError = `[${tableName} UPDATE] ${updateErr.message} (code: ${updateErr.code})`;
      } else {
        // INSERT new row
        let insertPayload: Record<string, any> = {
          ...basePayload,
          created_at: record.created_at,
        };

        let { error: insertErr } = await client
          .from(tableName)
          .insert(insertPayload);

        // Retry 1: If table requires an 'id' column without a default UUID generator
        if (insertErr && (insertErr.code === '23502' || insertErr.message?.includes('column "id"'))) {
          try {
            insertPayload = {
              ...insertPayload,
              id: typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `vault_${Date.now()}`,
            };
            const { error: idRetryErr } = await client.from(tableName).insert(insertPayload);
            insertErr = idRetryErr;
          } catch {}
        }

        // Retry 2: If table has 'device_id' column instead of 'primary_device_id'
        if (insertErr && insertErr.message?.includes('primary_device_id')) {
          delete insertPayload.primary_device_id;
          insertPayload.device_id = record.primary_device_id;
          const { error: devRetryErr } = await client.from(tableName).insert(insertPayload);
          insertErr = devRetryErr;
        }

        // Retry 3: Stringified JSON fallback for text columns
        if (insertErr && (insertErr.message?.includes('json') || insertErr.message?.includes('array') || insertErr.code === '42804')) {
          insertPayload.bookmarks = JSON.stringify(record.bookmarks);
          insertPayload.secondary_device_ids = JSON.stringify(record.secondary_device_ids);
          const { error: strRetryErr } = await client.from(tableName).insert(insertPayload);
          insertErr = strRetryErr;
        }

        // Retry 4: If created_at or updated_at columns don't exist in table
        if (insertErr && (insertErr.message?.includes('created_at') || insertErr.message?.includes('updated_at') || insertErr.code === 'PGRST204')) {
          delete insertPayload.created_at;
          delete insertPayload.updated_at;
          const { error: noTimeErr } = await client.from(tableName).insert(insertPayload);
          insertErr = noTimeErr;
        }

        if (!insertErr) {
          result.savedToSupabase = true;
          result.tableUsed = tableName;
          result.supabaseError = null;
          console.log(`[Vault] Successfully inserted into Supabase table "${tableName}"`);
          return result;
        }

        // Check if RLS is blocking insert
        if (insertErr.code === '42501' || insertErr.message?.includes('row-level security') || insertErr.message?.includes('policy')) {
          result.supabaseError = `Supabase RLS memblokir insert di tabel "${tableName}". Jalankan di SQL Editor: alter table public.${tableName} disable row level security;`;
          return result;
        }

        result.supabaseError = `[${tableName} INSERT] ${insertErr.message} (code: ${insertErr.code})`;
      }
    } catch (e: any) {
      console.error(`[Vault] Exception during save to "${tableName}":`, e);
      result.supabaseError = e?.message || 'Exception during upsert';
    }

  return result;
}

// GET: Retrieve vault info or run live diagnostic
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const key = searchParams.get('key');
    const deviceId = searchParams.get('deviceId');

    // LIVE DIAGNOSTIC MODE (?diag=true)
    if (searchParams.get('diag') === 'true' || searchParams.has('diag')) {
      const client = getSupabaseClient();
      const urlRaw = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '';
      const hasUrl = Boolean(urlRaw && urlRaw.startsWith('https://'));
      const maskedUrl = hasUrl ? urlRaw.replace(/(https:\/\/[^.]+)\..*/, '$1.supabase.co') : null;
      const hasServiceKey = Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY);
      const hasAnonKey = Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY);

      if (!client) {
        return NextResponse.json({
          status: 'UNCONFIGURED',
          message: 'Supabase credentials missing or invalid on server environment.',
          env: {
            hasUrl,
            maskedUrl,
            hasServiceKey,
            hasAnonKey,
          },
          help: 'Tambahkan NEXT_PUBLIC_SUPABASE_URL dan NEXT_PUBLIC_SUPABASE_ANON_KEY (atau SUPABASE_SERVICE_ROLE_KEY) di Vercel Settings -> Environment Variables.',
        }, { status: 200 });
      }

      // Probe tables
      const tableReport: Record<string, any> = {};
      const candidates = ['user_vaults'];

      for (const table of candidates) {
        try {
          // 1. SELECT test
          const { data: selectData, error: selectErr } = await client
            .from(table)
            .select('*')
            .limit(1);

          if (selectErr) {
            const isCacheError = selectErr.code === 'PGRST125' || selectErr.code === 'PGRST106';
            tableReport[table] = {
              exists: isCacheError ? true : false,
              readable: false,
              writable: false,
              errorCode: selectErr.code,
              errorMessage: isCacheError
                ? `Tabel "${table}" sudah dibuat di Table Editor, namun API PostgREST belum mengenali rutenya (Error ${selectErr.code}).`
                : selectErr.message,
              details: selectErr.details,
              hint: isCacheError
                ? 'Jalankan query di bawah pada Supabase SQL Editor untuk reload cache API PostgREST.'
                : selectErr.hint,
            };
            continue;
          }

          // 2. INSERT probe test
          const probeKey = `diag-probe-${Date.now()}`;
          const { error: insertErr } = await client
            .from(table)
            .insert({
              secret_key: probeKey,
              primary_device_id: 'probe-diag-device',
              secondary_device_ids: [],
              bookmarks: ['probe_test_art'],
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            });

          if (insertErr) {
            tableReport[table] = {
              exists: true,
              readable: true,
              writable: false,
              sampleRowsCount: selectData?.length || 0,
              writeError: {
                code: insertErr.code,
                message: insertErr.message,
                details: insertErr.details,
                hint: insertErr.hint,
              },
            };
          } else {
            // Delete probe row
            await client.from(table).delete().eq('secret_key', probeKey);
            tableReport[table] = {
              exists: true,
              readable: true,
              writable: true,
              sampleRowsCount: selectData?.length || 0,
              message: 'Tabel aktif dan dapat dibaca serta ditulis secara normal!',
            };
          }
        } catch (err: any) {
          tableReport[table] = {
            error: err?.message || 'Exception during table test',
          };
        }
      }

      // Check articles table for general database health
      let articlesStatus: any = null;
      try {
        const { count, error: artErr } = await client.from('articles').select('*', { count: 'exact', head: true });
        articlesStatus = artErr ? { readable: false, error: artErr.message } : { readable: true, totalArticles: count };
      } catch (e: any) {
        articlesStatus = { error: e.message };
      }

      const activeTable = candidates.find((t) => tableReport[t]?.writable) || null;

      return NextResponse.json({
        status: activeTable ? 'OPERATIONAL' : 'ACTION_REQUIRED',
        env: {
          hasUrl,
          maskedUrl,
          hasServiceKey,
          hasAnonKey,
          authRole: hasServiceKey ? 'SERVICE_ROLE (RLS dibypass)' : 'ANON_KEY (Tergantung RLS)',
        },
        activeTable,
        tables: tableReport,
        articlesTable: articlesStatus,
        sqlHelp: !activeTable ? {
          title: 'Aktifkan Akses API Tabel Supabase',
          instruction: 'Buka Dashboard Supabase -> SQL Editor, lalu jalankan query di bawah:',
          sql: `-- 1. Berikan izin akses penuh ke tabel user_vaults untuk API
grant usage on schema public to postgres, anon, authenticated, service_role;
grant all on table public.user_vaults to postgres, anon, authenticated, service_role;

-- 2. Pastikan RLS dinonaktifkan
alter table public.user_vaults disable row level security;

-- 3. Paksa API PostgREST merefresh cache skema (Mengatasi error PGRST106)
notify pgrst, 'reload schema';`
        } : null,
      }, { status: 200 });
    }

    // Default overview if no key provided
    if (!key) {
      return NextResponse.json({
        service: 'Untan Research Hub Vault API',
        status: 'ready',
        help: 'Untuk cek kesehatan database Supabase, buka: /api/vault?diag=true',
      }, { status: 200 });
    }

    const vault = await getCloudVault(key);
    if (!vault) {
      return NextResponse.json({ success: false, error: 'Kunci tidak ditemukan.' }, { status: 404 });
    }

    const isPrimary = vault.primary_device_id === deviceId;
    return NextResponse.json({
      success: true,
      vault: {
        secretKey: vault.secret_key,
        isPrimary,
        primaryDeviceId: vault.primary_device_id,
        secondaryDevices: vault.secondary_device_ids,
        bookmarks: vault.bookmarks,
        updatedAt: vault.updated_at,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// POST: Actions (sync, link, transfer_primary)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const action = body.action;

    if (!action) {
      return NextResponse.json({ success: false, error: 'Action parameter required.' }, { status: 400 });
    }

    // 1. ACTION: SYNC (Local-First Sync: merges local bookmarks with cloud bookmarks)
    if (action === 'sync') {
      const { secretKey, deviceId, bookmarks } = body;
      if (!secretKey || !deviceId) {
        return NextResponse.json({ success: false, error: 'secretKey dan deviceId wajib diisi.' }, { status: 400 });
      }

      const localBookmarks: string[] = Array.isArray(bookmarks) ? bookmarks : [];
      let vault = await getCloudVault(secretKey);
      const now = new Date().toISOString();

      if (!vault) {
        // First time cloud sync for this key: register device as Primary
        vault = {
          secret_key: secretKey,
          primary_device_id: deviceId,
          secondary_device_ids: [],
          bookmarks: localBookmarks,
          created_at: now,
          updated_at: now,
        };
      } else {
        // Existing cloud vault: merge bookmarks prioritizing union
        const mergedSet = new Set<string>([...localBookmarks, ...vault.bookmarks]);
        vault.bookmarks = Array.from(mergedSet);
        vault.updated_at = now;

        // Ensure device is registered in list
        if (vault.primary_device_id !== deviceId && !vault.secondary_device_ids.includes(deviceId)) {
          vault.secondary_device_ids.push(deviceId);
        }
      }

      const saveResult = await saveCloudVault(vault);

      const isPrimary = vault.primary_device_id === deviceId;
      return NextResponse.json({
        success: true,
        vault: {
          secretKey: vault.secret_key,
          isPrimary,
          primaryDeviceId: vault.primary_device_id,
          secondaryDevices: vault.secondary_device_ids,
          bookmarks: vault.bookmarks,
          updatedAt: vault.updated_at,
        },
        supabaseStatus: {
          saved: saveResult.savedToSupabase,
          table: saveResult.tableUsed || null,
          error: saveResult.supabaseError || null,
        },
      });
    }

    // 2. ACTION: LINK (Pairs a new secondary device using the 4-word secret passphrase)
    if (action === 'link') {
      const { secretKey, deviceId } = body;
      if (!secretKey || !deviceId) {
        return NextResponse.json({ success: false, error: 'secretKey dan deviceId wajib diisi.' }, { status: 400 });
      }

      const vault = await getCloudVault(secretKey);
      if (!vault) {
        return NextResponse.json(
          {
            success: false,
            error: 'Kunci rahasia tidak ditemukan. Pastikan 4 kata slang Indonesian sudah sesuai.',
          },
          { status: 404 }
        );
      }

      // Add device to secondary devices if not already primary
      if (vault.primary_device_id !== deviceId && !vault.secondary_device_ids.includes(deviceId)) {
        vault.secondary_device_ids.push(deviceId);
        vault.updated_at = new Date().toISOString();
      }

      const saveResult = await saveCloudVault(vault);

      const isPrimary = vault.primary_device_id === deviceId;

      return NextResponse.json({
        success: true,
        vault: {
          // If secondary, the frontend will mask the key, but we confirm validity here
          secretKey: vault.secret_key,
          isPrimary,
          primaryDeviceId: vault.primary_device_id,
          secondaryDevices: vault.secondary_device_ids,
          bookmarks: vault.bookmarks,
          updatedAt: vault.updated_at,
        },
        supabaseStatus: {
          saved: saveResult.savedToSupabase,
          table: saveResult.tableUsed || null,
          error: saveResult.supabaseError || null,
        },
      });
    }

    // 3. ACTION: TRANSFER_PRIMARY (Primary device transfers ownership to another device)
    if (action === 'transfer_primary') {
      const { secretKey, currentDeviceId, targetDeviceId } = body;
      if (!secretKey || !currentDeviceId || !targetDeviceId) {
        return NextResponse.json(
          { success: false, error: 'secretKey, currentDeviceId, dan targetDeviceId wajib diisi.' },
          { status: 400 }
        );
      }

      const vault = await getCloudVault(secretKey);
      if (!vault) {
        return NextResponse.json({ success: false, error: 'Kunci rahasia tidak ditemukan.' }, { status: 404 });
      }

      if (vault.primary_device_id !== currentDeviceId) {
        return NextResponse.json(
          { success: false, error: 'Hanya Perangkat Utama saat ini yang berhak memindahkan status kepemilikan.' },
          { status: 403 }
        );
      }

      // Transfer primary to target device
      vault.primary_device_id = targetDeviceId;
      // Demote current device to secondary
      if (!vault.secondary_device_ids.includes(currentDeviceId)) {
        vault.secondary_device_ids.push(currentDeviceId);
      }
      // Remove target device from secondary list
      vault.secondary_device_ids = vault.secondary_device_ids.filter((id) => id !== targetDeviceId);
      vault.updated_at = new Date().toISOString();

      const saveResult = await saveCloudVault(vault);

      return NextResponse.json({
        success: true,
        message: 'Status Perangkat Utama berhasil dialihkan.',
        vault: {
          secretKey: vault.secret_key,
          isPrimary: false, // The current device is now secondary
          primaryDeviceId: targetDeviceId,
          secondaryDevices: vault.secondary_device_ids,
          bookmarks: vault.bookmarks,
          updatedAt: vault.updated_at,
        },
        supabaseStatus: {
          saved: saveResult.savedToSupabase,
          table: saveResult.tableUsed || null,
          error: saveResult.supabaseError || null,
        },
      });
    }

    return NextResponse.json({ success: false, error: `Action '${action}' tidak dikenal.` }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

