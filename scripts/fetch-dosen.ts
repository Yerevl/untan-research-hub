import * as cheerio from 'cheerio';
import fs from 'fs';
import path from 'path';

export interface DosenData {
  name: string;
  cleanName: string;
  keahlian: string[];
  jabatan?: string;
  nip?: string;
  nidn?: string;
  profileUrl?: string;
  photoUrl?: string;
}

export async function fetchAllDosen(): Promise<DosenData[]> {
  try {
    const res = await fetch('https://siskom.untan.ac.id/dosen-staf', {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      },
    });

    const html = await res.text();
    const $ = cheerio.load(html);

    const dosenList: DosenData[] = [];

    $('.card').each((_, card) => {
      const titleLink = $(card).find('.card-title a');
      if (!titleLink.length) return;

      const rawName = titleLink.text().replace(/\s+/g, ' ').trim();
      const profileUrl = titleLink.attr('href') || '';
      const photoUrl = $(card).find('img').attr('src') || '';

      // Clean name: e.g. "Suhardi , S.T., M.Eng." -> "Suhardi"
      const cleanName = rawName
        .replace(/,\s*(S\.Kom|S\.T|M\.Cs|M\.T|M\.Eng|M\.Kom|M\.A|S\.Mat|M\.Sc|Dr\.).*$/i, '')
        .replace(/^(Dr\.|Ir\.)\s*/i, '')
        .trim();

      // Extract skills / keahlian
      const keahlian: string[] = [];
      $(card)
        .find('.skills li')
        .each((_, li) => {
          const k = $(li).text().trim();
          if (k && k !== '-' && !keahlian.includes(k)) {
            keahlian.push(k);
          }
        });

      // If no li found, check text
      if (!keahlian.length) {
        const skillsText = $(card).find('.skills').text().replace(/Keahlian\s*:/i, '').trim();
        if (skillsText && skillsText !== '-') {
          keahlian.push(skillsText);
        }
      }

      // NIP, NIDN, Jabatan
      const nip = $(card).find('.nip').text().replace(/NIP\s*:/i, '').trim();
      const nidn = $(card).find('.nidn').text().replace(/NIDN\s*:/i, '').trim();
      const jabatan = $(card).find('.jabatan-fungsional').text().replace(/Jabatan Fungsional\s*:/i, '').trim();

      if (cleanName) {
        dosenList.push({
          name: rawName,
          cleanName,
          keahlian: keahlian.length > 0 ? keahlian : ['Umum'],
          jabatan,
          nip,
          nidn,
          profileUrl,
          photoUrl,
        });
      }
    });

    return dosenList;
  } catch (err) {
    console.error('Error fetching dosen:', err);
    return [];
  }
}

async function main() {
  console.log('Fetching dosen data from https://siskom.untan.ac.id/dosen-staf...');
  const dosen = await fetchAllDosen();
  console.log(`Total dosen ditemukan: ${dosen.length}`);

  const outPath = path.join(process.cwd(), 'src', 'data', 'dosen.json');
  fs.writeFileSync(outPath, JSON.stringify(dosen, null, 2), 'utf-8');
  console.log(`Saved to ${outPath}`);

  dosen.forEach((d) => {
    console.log(`- ${d.cleanName} (${d.name}) => Keahlian: ${d.keahlian.join(', ')}`);
  });
}

if (require.main === module || process.argv[1]?.includes('fetch-dosen')) {
  main();
}

