import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const fileUrl = searchParams.get('url');
    const title = searchParams.get('title') || 'jurnal-untan';

    if (!fileUrl) {
      return new NextResponse('URL file tidak ditemukan', { status: 400 });
    }

    // Clean title for safe filename across Windows, macOS, Linux
    let safeTitle = title
      .replace(/[\/\\?%*:|"<>]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    if (safeTitle.length > 120) {
      safeTitle = safeTitle.slice(0, 120).trim();
    }

    const filename = `${safeTitle}.pdf`;
    const encodedFilename = encodeURIComponent(filename);

    let pdfBuffer: Buffer;

    // Handle local storage files
    if (fileUrl.startsWith('/storage/pdfs/')) {
      const localRelPath = fileUrl.replace('/storage/pdfs/', '');
      const localFilePath = path.join(process.cwd(), 'public', 'storage', 'pdfs', localRelPath);
      if (!fs.existsSync(localFilePath)) {
        return new NextResponse('File lokal tidak ditemukan', { status: 404 });
      }
      pdfBuffer = fs.readFileSync(localFilePath);
    } else {
      // Remote URL (Supabase Storage or OJS)
      const res = await fetch(fileUrl);
      if (!res.ok) {
        return new NextResponse('Gagal mengunduh file dari storage', { status: res.status });
      }
      const arrayBuffer = await res.arrayBuffer();
      pdfBuffer = Buffer.from(arrayBuffer);
    }

    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename.replace(/"/g, '')}"; filename*=UTF-8''${encodedFilename}`,
        'Cache-Control': 'public, max-age=86400',
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return new NextResponse(`Download error: ${message}`, { status: 500 });
  }
}
