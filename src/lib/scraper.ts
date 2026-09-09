import * as cheerio from 'cheerio';
import { Article, SyncResult } from './types';
import { saveArticle, uploadPdf } from './supabase';
import { enrichArticleWithDosen } from './dosen';

const BROWSER_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
  'Accept-Language': 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7',
};

/**
 * Normalizes an OJS URL into a direct PDF download URL
 * OJS often formats viewer as /article/view/<id>/<galley>
 * and download endpoint as /article/download/<id>/<galley>
 */
export function getDirectPdfUrl(rawUrl: string): string {
  if (!rawUrl) return '';
  if (rawUrl.includes('/article/download/')) {
    return rawUrl;
  }
  return rawUrl.replace('/article/view/', '/article/download/');
}

/**
 * Scrapes a single article page by URL
 */
export async function scrapeArticle(
  articleUrl: string,
  issueNameFallback?: string,
  downloadPdfFile: boolean = true
): Promise<Article | null> {
  try {
    const res = await fetch(articleUrl, {
      headers: BROWSER_HEADERS,
      cache: 'no-store',
    });

    if (!res.ok) {
      console.error(`Failed to fetch article ${articleUrl}: HTTP ${res.status}`);
      return null;
    }

    const html = await res.text();
    const $ = cheerio.load(html);

    // Extract OJS ID from URL (e.g. /article/view/88115 -> 88115)
    const ojsIdMatch = articleUrl.match(/\/article\/view\/([0-9]+)/);
    const ojsId = ojsIdMatch ? ojsIdMatch[1] : `art-${Date.now()}`;

    // Title
    const title =
      $('meta[name="citation_title"]').attr('content') ||
      $('meta[name="DC.Title"]').attr('content') ||
      $('h1.page_title, h1.title').first().text().trim() ||
      'Untitled Article';

    // Authors
    const authors: string[] = [];
    $('meta[name="citation_author"], meta[name="DC.Creator"]').each((_, el) => {
      const author = $(el).attr('content')?.trim();
      if (author && !authors.includes(author)) {
        authors.push(author);
      }
    });

    // Institutions / Affiliations
    const institutions: string[] = [];
    $('meta[name="citation_author_institution"]').each((_, el) => {
      const inst = $(el).attr('content')?.trim();
      if (inst && !institutions.includes(inst)) {
        institutions.push(inst);
      }
    });

    // Publication Date
    const publicationDate =
      $('meta[name="citation_date"]').attr('content') ||
      $('meta[name="citation_publication_date"]').attr('content') ||
      $('meta[name="DC.Date.created"]').attr('content') ||
      $('meta[name="DC.Date.issued"]').attr('content') ||
      '';

    // DOI
    const doi =
      $('meta[name="citation_doi"]').attr('content') ||
      $('meta[name="DC.Identifier.DOI"]').attr('content') ||
      $('a[href*="doi.org"]').first().attr('href') ||
      '';

    // Issue Name
    const issueName =
      $('meta[name="citation_issue"]').attr('content') ||
      $('nav.cmp_breadcrumbs, .breadcrumb').text().trim() ||
      issueNameFallback ||
      'General Issue';

    // Abstract extraction
    let abstract = '';
    const abstractSection = $('section.item.abstract, .item.abstract, #articleAbstract, div.abstract');
    if (abstractSection.length) {
      // Remove header label if present
      abstractSection.find('h2, h3, .label').remove();
      abstract = abstractSection.text().trim();
    }
    if (!abstract) {
      abstract = $('meta[name="DC.Description"]').attr('content') || '';
    }
    // Clean up excessive whitespace
    abstract = abstract.replace(/\s+/g, ' ').trim();

    // PDF URL extraction
    let originalPdfUrl =
      $('meta[name="citation_pdf_url"]').attr('content') ||
      $('a[href*="/article/view/"][href*="/"], a[href*="/article/download/"]').first().attr('href') ||
      '';

    if (originalPdfUrl) {
      originalPdfUrl = getDirectPdfUrl(originalPdfUrl);
    }

    let storagePdfPath = '';
    let storagePdfUrl = '';

    // Download PDF and store in Supabase Storage (or local storage fallback)
    if (downloadPdfFile && originalPdfUrl) {
      try {
        console.log(`[Scraper] Downloading PDF for ${ojsId}: ${originalPdfUrl}`);
        const pdfRes = await fetch(originalPdfUrl, {
          headers: BROWSER_HEADERS,
        });

        if (pdfRes.ok) {
          const arrayBuffer = await pdfRes.arrayBuffer();
          const buffer = Buffer.from(arrayBuffer);

          // Verify it is actually a PDF file
          if (buffer.subarray(0, 5).toString('ascii').startsWith('%PDF-')) {
            const uploaded = await uploadPdf(ojsId, buffer);
            storagePdfPath = uploaded.path;
            storagePdfUrl = uploaded.url;
            console.log(`[Scraper] Successfully saved PDF for ${ojsId}: ${uploaded.url}`);
          } else {
            console.warn(`[Scraper] Downloaded content for ${ojsId} is not a valid PDF`);
          }
        } else {
          console.warn(`[Scraper] Failed to download PDF for ${ojsId}: HTTP ${pdfRes.status}`);
        }
      } catch (pdfErr) {
        console.warn(`[Scraper] PDF download/upload failed for ${ojsId}:`, pdfErr);
      }
    }

    const articleData: Article = {
      ojs_id: ojsId,
      title,
      abstract,
      authors: authors.length > 0 ? authors : ['Penulis Tidak Diketahui'],
      institutions,
      publication_date: publicationDate,
      doi,
      issue_name: issueNameFallback || issueName,
      original_article_url: articleUrl,
      original_pdf_url: originalPdfUrl,
      storage_pdf_path: storagePdfPath,
      storage_pdf_url: storagePdfUrl || originalPdfUrl,
    };

    // Enrich with Siskom Dosen matching, student separation, and keahlian
    const enrichedData = enrichArticleWithDosen(articleData);

    // Save to database/storage
    const saved = await saveArticle(enrichedData);
    return saved;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[Scraper] Error parsing article ${articleUrl}:`, message);
    return null;
  }
}

/**
 * Scrapes an entire journal issue (e.g. https://jurnal.untan.ac.id/index.php/jcskommipa/issue/view/2707)
 */
export async function scrapeIssue(
  issueUrl: string,
  options?: { downloadPdf?: boolean; onProgress?: (msg: string) => void }
): Promise<SyncResult> {
  const downloadPdf = options?.downloadPdf !== false;
  const onProgress = options?.onProgress || ((msg: string) => console.log(msg));

  onProgress(`Mengakses URL Issue: ${issueUrl}...`);

  const res = await fetch(issueUrl, {
    headers: BROWSER_HEADERS,
    cache: 'no-store',
  });

  if (!res.ok) {
    throw new Error(`Gagal mengakses website jurnal: HTTP ${res.status} ${res.statusText}`);
  }

  const html = await res.text();
  const $ = cheerio.load(html);

  // Extract Issue Title (e.g. "Vol. 13 No. 1 (2025): Edisi April 2025")
  const rawIssueTitle =
    $('h1').first().text().trim() ||
    $('h2.current_issue_title, .issue-title').first().text().trim() ||
    $('title').text().replace(/\|.*/, '').trim() ||
    'Issue Riset';
  const issueName = rawIssueTitle.replace(/\s+/g, ' ');

  onProgress(`Edisi Ditemukan: ${issueName}`);

  // Find all unique article links (matches /article/view/[0-9]+ but NOT with secondary galley IDs)
  const articleUrlMap = new Map<string, string>();

  $('a[href*="/article/view/"]').each((_, el) => {
    const href = $(el).attr('href');
    if (!href) return;

    // Normalize URL
    const cleanUrl = href.split('#')[0].split('?')[0];
    // Check if it's an article landing page (format: .../article/view/12345)
    const match = cleanUrl.match(/\/article\/view\/([0-9]+)$/);
    if (match) {
      const ojsId = match[1];
      if (!articleUrlMap.has(ojsId)) {
        articleUrlMap.set(ojsId, cleanUrl);
      }
    }
  });

  const articleUrls = Array.from(articleUrlMap.values());
  onProgress(`Ditemukan ${articleUrls.length} artikel pada edisi ini.`);

  const savedArticles: Article[] = [];
  const errors: string[] = [];

  for (let i = 0; i < articleUrls.length; i++) {
    const url = articleUrls[i];
    onProgress(`[${i + 1}/${articleUrls.length}] Memproses riset: ${url}...`);

    try {
      const article = await scrapeArticle(url, issueName, downloadPdf);
      if (article) {
        savedArticles.push(article);
        onProgress(`✓ Berhasil menyimpan: "${article.title.slice(0, 50)}..."`);
      } else {
        errors.push(`Gagal mengekstrak data dari ${url}`);
      }
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err);
      errors.push(`Error pada ${url}: ${errMsg}`);
    }

    // Gentle delay between requests to be polite to Untan server
    await new Promise((resolve) => setTimeout(resolve, 800));
  }

  return {
    success: savedArticles.length > 0,
    issueName,
    totalFound: articleUrls.length,
    syncedCount: savedArticles.length,
    errors,
    articles: savedArticles,
  };
}

/**
 * Scrapes all journal issues from the archive page
 * (e.g. https://jurnal.untan.ac.id/index.php/jcskommipa/issue/archive)
 */
export async function scrapeArchive(
  archiveUrl: string = 'https://jurnal.untan.ac.id/index.php/jcskommipa/issue/archive',
  options?: {
    maxIssues?: number;
    downloadPdf?: boolean;
    onProgress?: (msg: string) => void;
  }
): Promise<{ totalIssues: number; totalArticles: number; issues: SyncResult[] }> {
  const onProgress = options?.onProgress || ((msg: string) => console.log(msg));
  onProgress(`Mengakses halaman arsip jurnal: ${archiveUrl}...`);

  const res = await fetch(archiveUrl, {
    headers: BROWSER_HEADERS,
    cache: 'no-store',
  });

  if (!res.ok) {
    throw new Error(`Gagal membuka halaman arsip: HTTP ${res.status}`);
  }

  const html = await res.text();
  const $ = cheerio.load(html);

  // Extract all unique issue URLs
  const issueUrls: string[] = [];
  $('a[href*="/issue/view/"]').each((_, el) => {
    const href = $(el).attr('href');
    if (!href) return;
    const clean = href.split('#')[0].split('?')[0];
    if (/\/issue\/view\/[0-9]+$/.test(clean) && !issueUrls.includes(clean)) {
      issueUrls.push(clean);
    }
  });

  const limit = options?.maxIssues ? Math.min(options.maxIssues, issueUrls.length) : issueUrls.length;
  const targetIssues = issueUrls.slice(0, limit);

  onProgress(`Ditemukan ${issueUrls.length} edisi di arsip. Menjadwalkan scraping untuk ${targetIssues.length} edisi.`);

  const results: SyncResult[] = [];
  let totalArticles = 0;

  for (let i = 0; i < targetIssues.length; i++) {
    const issueUrl = targetIssues[i];
    onProgress(`\n=== [Edisi ${i + 1}/${targetIssues.length}] Memproses: ${issueUrl} ===`);

    try {
      const result = await scrapeIssue(issueUrl, {
        downloadPdf: options?.downloadPdf,
        onProgress,
      });
      results.push(result);
      totalArticles += result.syncedCount;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      onProgress(`[ERROR] Gagal memproses edisi ${issueUrl}: ${msg}`);
    }

    // Delay between issues
    if (i < targetIssues.length - 1) {
      await new Promise((r) => setTimeout(r, 1500));
    }
  }

  onProgress(`\n✓ Selesai! Berhasil memproses ${results.length} edisi dengan total ${totalArticles} artikel.`);
  return {
    totalIssues: results.length,
    totalArticles,
    issues: results,
  };
}

