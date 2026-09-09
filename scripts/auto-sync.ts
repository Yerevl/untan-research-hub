import * as cheerio from 'cheerio';
import { getArticles } from '../src/lib/supabase';
import { scrapeIssue } from '../src/lib/scraper';

const BROWSER_HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
  'Accept-Language': 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7',
};

/**
 * Intelligent Auto-Sync:
 * 1. Checks current latest issue on Untan journal OJS
 * 2. Compares with articles already stored in our database
 * 3. Only scrapes if new articles or a new issue have been published
 */
export async function runAutoSync(options?: { onProgress?: (msg: string) => void }) {
  const log = options?.onProgress || ((msg: string) => console.log(msg));

  log('=====================================================');
  log('       UNTAN JOURNAL INTELLIGENT AUTO-SYNC           ');
  log('=====================================================');
  log(`Waktu Pemeriksaan: ${new Date().toISOString()}`);

  try {
    // 1. Fetch archive page to discover latest issue
    const archiveUrl = 'https://jurnal.untan.ac.id/index.php/jcskommipa/issue/archive';
    log(`Memeriksa edisi terbaru dari: ${archiveUrl}...`);

    const res = await fetch(archiveUrl, {
      headers: BROWSER_HEADERS,
      cache: 'no-store',
    });

    if (!res.ok) {
      throw new Error(`Gagal membuka halaman arsip: HTTP ${res.status}`);
    }

    const html = await res.text();
    const $ = cheerio.load(html);

    // Find the latest issue URL (first /issue/view/[0-9]+ link)
    let latestIssueUrl = '';
    $('a[href*="/issue/view/"]').each((_, el) => {
      const href = $(el).attr('href');
      if (!href) return;
      const clean = href.split('#')[0].split('?')[0];
      if (/\/issue\/view\/[0-9]+$/.test(clean) && !latestIssueUrl) {
        latestIssueUrl = clean;
      }
    });

    if (!latestIssueUrl) {
      log('[INFO] Tidak menemukan tautan issue pada halaman arsip.');
      return { status: 'no_issue_found', newArticlesCount: 0 };
    }

    log(`Tautan edisi terbaru ditemukan: ${latestIssueUrl}`);

    // 2. Extract article IDs in that issue
    const issueRes = await fetch(latestIssueUrl, {
      headers: BROWSER_HEADERS,
      cache: 'no-store',
    });

    const issueHtml = await issueRes.text();
    const $issue = cheerio.load(issueHtml);

    const issueArticleIds: string[] = [];
    $issue('a[href*="/article/view/"]').each((_, el) => {
      const href = $issue(el).attr('href');
      if (!href) return;
      const match = href.match(/\/article\/view\/([0-9]+)$/);
      if (match && !issueArticleIds.includes(match[1])) {
        issueArticleIds.push(match[1]);
      }
    });

    log(`Ditemukan ${issueArticleIds.length} artikel di edisi terbaru.`);

    // 3. Check which articles are already in our database
    const existingArticles = await getArticles();
    const existingIds = new Set(existingArticles.map((a) => a.ojs_id));

    const missingIds = issueArticleIds.filter((id) => !existingIds.has(id));

    if (missingIds.length === 0) {
      log('✓ DATABASE SUDAH UP-TO-DATE! Semua artikel pada edisi terbaru sudah tersimpan.');
      log('Tidak ada proses scraping baru yang diperlukan (hemat bandwidth & resource).');
      return {
        status: 'up_to_date',
        latestIssueUrl,
        newArticlesCount: 0,
      };
    }

    log(`[UPDATE BARU DITEMUKAN!] Ada ${missingIds.length} artikel baru yang belum ada di database.`);
    log(`Memulai scraping otomatis untuk edisi: ${latestIssueUrl}...`);

    // 4. Scrape the issue
    const syncResult = await scrapeIssue(latestIssueUrl, {
      downloadPdf: true,
      onProgress: log,
    });

    log('=====================================================');
    log('✓ AUTO-SYNC SELESAI!');
    log(`Edisi: ${syncResult.issueName}`);
    log(`Artikel baru berhasil disimpan: ${syncResult.syncedCount}`);
    log('=====================================================');

    return {
      status: 'synced_new',
      latestIssueUrl,
      issueName: syncResult.issueName,
      newArticlesCount: syncResult.syncedCount,
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    log(`[ERROR AUTO-SYNC] ${msg}`);
    throw err;
  }
}

if (require.main === module || process.argv[1]?.includes('auto-sync')) {
  runAutoSync().catch(() => process.exit(1));
}

