import { NextRequest, NextResponse } from 'next/server';
import { runAutoSync } from '../../../../scripts/auto-sync';

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
    const result = await runAutoSync({
      onProgress: (msg) => logs.push(msg),
    });

    return NextResponse.json({
      success: true,
      result,
      logs,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

