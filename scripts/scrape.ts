import { scrapeIssue } from '../src/lib/scraper';
import { isSupabaseConfigured } from '../src/lib/supabase';

async function main() {
  const targetUrl = process.argv[2] || 'https://jurnal.untan.ac.id/index.php/jcskommipa/issue/view/2707';

  console.log('=====================================================');
  console.log('       UNTAN JOURNAL RESEARCH SCRAPER & SYNC         ');
  console.log('=====================================================');
  console.log(`Target URL : ${targetUrl}`);
  console.log(`Mode       : ${isSupabaseConfigured() ? 'Supabase Cloud (PostgreSQL + Storage)' : 'Local Storage Fallback (src/data & public/storage)'}`);
  console.log('-----------------------------------------------------');

  try {
    const result = await scrapeIssue(targetUrl, {
      downloadPdf: true,
      onProgress: (msg) => console.log(msg),
    });

    console.log('-----------------------------------------------------');
    console.log('HASIL SINKRONISASI:');
    console.log(`Edisi          : ${result.issueName}`);
    console.log(`Total Artikel  : ${result.totalFound}`);
    console.log(`Berhasil Disave: ${result.syncedCount}`);
    if (result.errors.length > 0) {
      console.log(`Error Terjadi  : ${result.errors.length}`);
      result.errors.forEach((e) => console.log(`  - ${e}`));
    }
    console.log('=====================================================');
    console.log('Selesai! Data siap ditampilkan di website.');
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('Fatal error saat scraping:', msg);
    process.exit(1);
  }
}

main();

