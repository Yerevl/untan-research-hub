import { scrapeArchive } from '../src/lib/scraper';
import { isSupabaseConfigured } from '../src/lib/supabase';

async function main() {
  const maxIssuesArg = process.argv[2];
  const maxIssues = maxIssuesArg ? parseInt(maxIssuesArg, 10) : undefined;

  console.log('=====================================================');
  console.log('      UNTAN JOURNAL ARCHIVE BATCH SCRAPER            ');
  console.log('=====================================================');
  console.log(`Target     : Seluruh Arsip (https://jurnal.untan.ac.id/index.php/jcskommipa/issue/archive)`);
  console.log(`Maks Edisi : ${maxIssues ? `${maxIssues} edisi` : 'Semua edisi yang ada'}`);
  console.log(`Database   : ${isSupabaseConfigured() ? 'Supabase Cloud' : 'Local Storage Fallback'}`);
  console.log('-----------------------------------------------------');

  try {
    const summary = await scrapeArchive(undefined, {
      maxIssues,
      downloadPdf: true,
      onProgress: (msg) => console.log(msg),
    });

    console.log('=====================================================');
    console.log('RINGKASAN SCRAPING ARSIP:');
    console.log(`Total Edisi Diproses : ${summary.totalIssues}`);
    console.log(`Total Artikel Masuk  : ${summary.totalArticles}`);
    console.log('=====================================================');
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('Fatal error saat scraping arsip:', msg);
    process.exit(1);
  }
}

main();

