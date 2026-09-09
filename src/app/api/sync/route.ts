import { NextRequest, NextResponse } from 'next/server';
import { scrapeIssue, scrapeArchive } from '@/lib/scraper';

// Extend Vercel function timeout to maximum allowed on hobby plan (60 seconds)
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const mode = body.mode || 'single'; // 'single' or 'archive'
    const downloadPdf = body.downloadPdf !== false;
    const logs: string[] = [];

    if (mode === 'archive') {
      const maxIssues = body.maxIssues ? parseInt(body.maxIssues, 10) : 3; // Default 3 issues via web to avoid request timeout, or full via CLI
      const archiveUrl = body.url?.trim() || 'https://jurnal.untan.ac.id/index.php/jcskommipa/issue/archive';

      const result = await scrapeArchive(archiveUrl, {
        maxIssues,
        downloadPdf,
        onProgress: (msg) => logs.push(msg),
      });

      return NextResponse.json({
        success: true,
        mode: 'archive',
        data: result,
        logs,
      });
    }

    // Default: Single issue
    const url = body.url?.trim() || 'https://jurnal.untan.ac.id/index.php/jcskommipa/issue/view/2707';

    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      return NextResponse.json(
        { success: false, error: 'URL harus diawali dengan http:// atau https://' },
        { status: 400 }
      );
    }

    const result = await scrapeIssue(url, {
      downloadPdf,
      onProgress: (msg) => logs.push(msg),
    });

    return NextResponse.json({
      success: true,
      mode: 'single',
      data: result,
      logs,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      {
        success: false,
        error: msg,
      },
      { status: 500 }
    );
  }
}
