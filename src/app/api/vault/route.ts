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
    const tableCandidates = ['user_vaults', 'user_vault'];
    for (const tableName of tableCandidates) {
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

  // If Supabase is active, upsert
  const client = getSupabaseClient();
  if (!client) {
    result.supabaseError = 'Supabase client is not configured (missing URL or API keys)';
    return result;
  }

  const tableCandidates = ['user_vaults', 'user_vault'];
  for (const tableName of tableCandidates) {
    try {
      // 1. Try standard upsert with native array / json
      const payload: Record<string, any> = {
        secret_key: record.secret_key,
        primary_device_id: record.primary_device_id,
        secondary_device_ids: record.secondary_device_ids,
        bookmarks: record.bookmarks,
        updated_at: record.updated_at,
        created_at: record.created_at,
      };

      const { data, error } = await client
        .from(tableName)
        .upsert(payload, { onConflict: 'secret_key' })
        .select();

      if (!error) {
        result.savedToSupabase = true;
        result.tableUsed = tableName;
        result.supabaseError = null;
        console.log(`[Vault] Successfully synced secret key "${record.secret_key}" to Supabase table "${tableName}"`);
        return result;
      }

      console.warn(`[Vault] Upsert to "${tableName}" failed:`, error.message, error.details);

      // If relation does not exist, try next candidate table name
      if (error.code === '42P01' || error.message?.includes('does not exist')) {
        result.supabaseError = `Table "${tableName}" does not exist in Supabase.`;
        continue;
      }

      // If type error, attempt stringified JSON fallback
      if (error.message?.includes('type') || error.message?.includes('syntax') || error.code === '22P02') {
        try {
          const stringifiedPayload = {
            ...payload,
            bookmarks: JSON.stringify(record.bookmarks),
            secondary_device_ids: JSON.stringify(record.secondary_device_ids),
          };
          const retryRes = await client.from(tableName).upsert(stringifiedPayload, { onConflict: 'secret_key' }).select();
          if (!retryRes.error) {
            result.savedToSupabase = true;
            result.tableUsed = tableName;
            result.supabaseError = null;
            return result;
          }
        } catch {}
      }

      result.supabaseError = error.message || 'Supabase upsert rejected';
    } catch (e: any) {
      console.error(`[Vault] Exception during save to "${tableName}":`, e);
      result.supabaseError = e?.message || 'Exception during upsert';
    }
  }

  return result;
}

// GET: Retrieve vault info
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const key = searchParams.get('key');
    const deviceId = searchParams.get('deviceId');

    if (!key) {
      return NextResponse.json({ success: false, error: 'Parameter key dibutuhkan.' }, { status: 400 });
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

