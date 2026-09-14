import { NextRequest, NextResponse } from 'next/server';
import { runAutoSync } from '../../../../scripts/auto-sync';
import { getSupabaseClient } from '@/lib/supabase';

// Extend Vercel function timeout to maximum allowed on hobby plan (60 seconds)
export const maxDuration = 60;

export async function GET(request: NextRequest) {
  try {
    // Optional: Protect cron route with Vercel Cron Secret if set
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const logs: string[] = [];

    // 1. Clean up expired user bookmarks (> 30 days of inactivity)
    let expiredVaultsCleaned = 0;
    const client = getSupabaseClient();
    if (client) {
      try {
        const { data: count, error: cleanErr } = await client.rpc('cleanup_expired_bookmarks');
        if (!cleanErr && typeof count === 'number') {
          expiredVaultsCleaned = count;
          logs.push(`[CRON] Berhasil membersihkan ${count} brankas bookmark yang tidak aktif >30 hari.`);
        }
      } catch (e: any) {
        logs.push(`[CRON] Warning pembersihan bookmark: ${e?.message}`);
      }
    }

    // 2. Run intelligent journal auto-sync
    const result = await runAutoSync({
      onProgress: (msg) => logs.push(msg),
    });

    return NextResponse.json({
      success: true,
      expiredVaultsCleaned,
      result,
      logs,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

