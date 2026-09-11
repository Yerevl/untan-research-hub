import { Article, Supervisor } from './types';

export interface DosenItem {
  name: string;
  cleanName: string;
  keahlian: string[];
  prodi: 'SISKOM' | 'SISFO';
  jabatan?: string;
  nip?: string;
  nidn?: string;
}

// Master list of Rekayasa Sistem Komputer (Siskom) Untan Lecturers
export const SISKOM_DOSEN: DosenItem[] = [
  {
    name: "Ikhwan Ruslianto, S.Kom., M.Cs.",
    cleanName: "Ikhwan Ruslianto",
    keahlian: ["Network Intelligent Control (NIC)"],
    prodi: "SISKOM",
    jabatan: "Lektor",
  },
  {
    name: "Rahmi Hidayati, S.Kom., M.Cs.",
    cleanName: "Rahmi Hidayati",
    keahlian: ["Automation & Embeded System (AES)"],
    prodi: "SISKOM",
    jabatan: "Lektor",
  },
  {
    name: "Syamsul Bahri, S.Kom., M.Cs.",
    cleanName: "Syamsul Bahri",
    keahlian: ["Network Intelligent Control (NIC)"],
    prodi: "SISKOM",
    jabatan: "Lektor",
  },
  {
    name: "Dedi Triyanto, S.T., M.T.",
    cleanName: "Dedi Triyanto",
    keahlian: ["Edge Computing"],
    prodi: "SISKOM",
    jabatan: "Lektor",
  },
  {
    name: "Tedy Rismawan, S.Kom., M.Cs.",
    cleanName: "Tedy Rismawan",
    keahlian: ["Automation & Embeded System (AES)"],
    prodi: "SISKOM",
    jabatan: "Lektor",
  },
  {
    name: "Cucu Suhery, M.A.",
    cleanName: "Cucu Suhery",
    keahlian: ["Automation & Embeded System (AES)"],
    prodi: "SISKOM",
    jabatan: "Lektor",
  },
  {
    name: "Dwi Marisa Midyanti, S.T., M.Cs.",
    cleanName: "Dwi Marisa Midyanti",
    keahlian: ["Network Intelligent Control (NIC)"],
    prodi: "SISKOM",
    jabatan: "Lektor",
  },
  {
    name: "Irma Nirmala, S.T., M.T.",
    cleanName: "Irma Nirmala",
    keahlian: ["Automation & Embeded System (AES)"],
    prodi: "SISKOM",
    jabatan: "Asisten Ahli",
  },
  {
    name: "Suhardi, S.T., M.Eng.",
    cleanName: "Suhardi",
    keahlian: ["Automation & Embeded System (AES)"],
    prodi: "SISKOM",
    jabatan: "Asisten Ahli",
  },
  {
    name: "Uray Ristian, S.Kom., M.Kom.",
    cleanName: "Uray Ristian",
    keahlian: ["Network Intelligent Control (NIC)"],
    prodi: "SISKOM",
    jabatan: "Asisten Ahli",
  },
  {
    name: "Hirzen Hasfani, S.Kom., M.Cs.",
    cleanName: "Hirzen Hasfani",
    keahlian: ["Network Intelligent Control (NIC)"],
    prodi: "SISKOM",
    jabatan: "Tenaga Pengajar",
  },
  {
    name: "Kartika Sari, S.Kom., M.Cs.",
    cleanName: "Kartika Sari",
    keahlian: ["Automation & Embeded System (AES)"],
    prodi: "SISKOM",
    jabatan: "Tenaga Pengajar",
  },
  {
    name: "Kasliono, S.Mat., M.Cs.",
    cleanName: "Kasliono",
    keahlian: ["Network Intelligent Control (NIC)"],
    prodi: "SISKOM",
    jabatan: "Tenaga Pengajar",
  },
  {
    name: "Hafiz Muhardi, S.T., M.Kom.",
    cleanName: "Hafiz Muhardi",
    keahlian: ["Network Intelligent Control (NIC)"],
    prodi: "SISKOM",
    jabatan: "Tenaga Pengajar",
  },
  {
    name: "Sampe Hotlan Sitorus, S.Si., M.Kom.",
    cleanName: "Sampe Hotlan Sitorus",
    keahlian: ["Network Intelligent Control (NIC)"],
    prodi: "SISKOM",
    jabatan: "Lektor",
  },
  {
    name: "Fatma Agus Setyaningsih, S.Kom., M.Cs.",
    cleanName: "Fatma Agus Setyaningsih",
    keahlian: ["Network Intelligent Control (NIC)"],
    prodi: "SISKOM",
    jabatan: "Lektor",
  },
  {
    name: "Weldi, S.Kom.",
    cleanName: "Weldi",
    keahlian: ["Umum"],
    prodi: "SISKOM",
    jabatan: "Tenaga Pengajar",
  },
  {
    name: "Solihun, S.Kom.",
    cleanName: "Solihun",
    keahlian: ["Video Conference"],
    prodi: "SISKOM",
    jabatan: "Tenaga Pengajar",
  },
];

// Master list of Sistem Informasi (Sisfo) Untan Lecturers
// Sourced from https://sisfo.untan.ac.id/dosen-staff/
export const SISFO_DOSEN: DosenItem[] = [
  {
    name: "Renny Puspita Sari, S.T., M.T.",
    cleanName: "Renny Puspita Sari",
    keahlian: ["Tata Kelola TI"],
    prodi: "SISFO",
    jabatan: "Ketua Jurusan Sistem Informasi",
  },
  {
    name: "Ibnur Rusi, S.Kom., M.M.",
    cleanName: "Ibnur Rusi",
    keahlian: ["Tata Kelola TI"],
    prodi: "SISFO",
    jabatan: "Sekretaris Jurusan Sistem Informasi",
  },
  {
    name: "Nurul Mutiah, S.T., M.T.",
    cleanName: "Nurul Mutiah",
    keahlian: ["Tata Kelola TI"],
    prodi: "SISFO",
    jabatan: "Ketua Kelompok Keahlian Tata Kelola TI",
  },
  {
    name: "Dian Prawira, S.T., M.Eng.",
    cleanName: "Dian Prawira",
    keahlian: ["Intelejensi Bisnis dan Analisis Data"],
    prodi: "SISFO",
    jabatan: "Ketua Kelompok Keahlian Intelejensi Bisnis dan Analisis Data",
  },
  {
    name: "Ilhamsyah, S.Si., M.Cs.",
    cleanName: "Ilhamsyah",
    keahlian: ["Intelejensi Bisnis dan Analisis Data"],
    prodi: "SISFO",
    jabatan: "Anggota Kelompok Keahlian Intelejensi Bisnis dan Analisis Data",
  },
  {
    name: "Syahrul Rahmayuda, S.Kom., M.Kom.",
    cleanName: "Syahrul Rahmayuda",
    keahlian: ["Rekayasa Perangkat Lunak"],
    prodi: "SISFO",
    jabatan: "Anggota Kelompok Keahlian Rekayasa Perangkat Lunak",
  },
  {
    name: "Ferdy Febriyanto, S.Kom., M.Kom.",
    cleanName: "Ferdy Febriyanto",
    keahlian: ["Rekayasa Perangkat Lunak"],
    prodi: "SISFO",
    jabatan: "Ketua Kelompok Keahlian Rekayasa Perangkat Lunak",
  },
  {
    name: "Devi Gusmita, S.Kom., M.Kom.",
    cleanName: "Devi Gusmita",
    keahlian: ["Tata Kelola TI"],
    prodi: "SISFO",
    jabatan: "Anggota Kelompok Keahlian Tata Kelola TI",
  },
];

// All combined lecturers
export const ALL_DOSEN: DosenItem[] = [...SISKOM_DOSEN, ...SISFO_DOSEN];

/**
 * Normalizes author names from OJS:
 * - Strips degree suffixes
 * - Collapses duplicate mononym names like "Ilhamsyah Ilhamsyah" -> "Ilhamsyah"
 */
export function normalizeAuthorName(name: string): string {
  if (!name) return '';
  let cleaned = name
    .replace(/,\s*.*$/, '')
    .replace(/[^a-zA-Z\s]/g, ' ')
    .trim()
    .replace(/\s+/g, ' ');

  // If name has 2 identical words (e.g. "Ilhamsyah Ilhamsyah", "Kasliono Kasliono", "Suhardi Suhardi")
  const parts = cleaned.split(' ');
  if (parts.length === 2 && parts[0].toLowerCase() === parts[1].toLowerCase()) {
    cleaned = parts[0];
  }
  return cleaned;
}

/**
 * Matches an author name string from journal article to Siskom or Sisfo lecturer
 */
export function matchAuthorToDosen(authorName: string): DosenItem | null {
  if (!authorName) return null;
  const clean = normalizeAuthorName(authorName).toLowerCase();

  // Alias checks for variations in OJS spelling
  if (clean.includes('syahru') && (clean.includes('rahmayuda') || clean.includes('rahmayudha'))) {
    return SISFO_DOSEN.find((d) => d.cleanName === 'Syahrul Rahmayuda') || null;
  }

  for (const d of ALL_DOSEN) {
    const dClean = d.cleanName.toLowerCase().replace(/[^a-z0-9\s]/g, '').trim();
    // Exact or inclusion match
    if (clean === dClean || clean.includes(dClean) || dClean.includes(clean)) {
      return d;
    }
    const dWords = dClean.split(/\s+/).filter(Boolean);
    if (dWords.length > 1 && dWords.every((w) => clean.includes(w))) {
      return d;
    }
  }
  return null;
}

/**
 * Enriches an article with identified student, supervising lecturers, keahlian, and prodi (SISKOM / SISFO)
 */
export function enrichArticleWithDosen(article: Article): Article {
  const authors = article.authors || [];
  const rawStudent = authors[0] || 'Mahasiswa';
  const student = normalizeAuthorName(rawStudent) || rawStudent;
  const supervisorAuthors = authors.slice(1);

  const supervisors: Supervisor[] = [];
  const keahlianSet = new Set<string>();
  let articleProdi: 'SISKOM' | 'SISFO' | undefined = undefined;

  supervisorAuthors.forEach((authorName) => {
    const matched = matchAuthorToDosen(authorName);
    if (matched) {
      supervisors.push({
        name: matched.name,
        cleanName: matched.cleanName,
        keahlian: matched.keahlian,
        prodi: matched.prodi,
      });
      matched.keahlian.forEach((k) => keahlianSet.add(k));
      if (!articleProdi) {
        articleProdi = matched.prodi;
      }
    } else {
      const cleanNorm = normalizeAuthorName(authorName) || authorName;
      supervisors.push({
        name: authorName,
        cleanName: cleanNorm,
        keahlian: [],
      });
    }
  });

  // If prodi not inferred from matched supervisor, infer from title/abstract/institutions
  if (!articleProdi) {
    const textToCheck = `${article.title} ${article.abstract || ''} ${(article.institutions || []).join(' ')}`.toLowerCase();
    if (
      textToCheck.includes('sistem informasi') ||
      textToCheck.includes('ui/ux') ||
      textToCheck.includes('tata kelola ti') ||
      textToCheck.includes('double diamond')
    ) {
      articleProdi = 'SISFO';
    } else {
      articleProdi = 'SISKOM';
    }
  }

  return {
    ...article,
    student,
    supervisors,
    prodi: articleProdi,
    keahlian: Array.from(keahlianSet),
  };
}

/**
 * Returns list of all known Keahlian categories across Siskom and Sisfo
 */
export function getKeahlianList(): string[] {
  const set = new Set<string>();
  ALL_DOSEN.forEach((d) => {
    d.keahlian.forEach((k) => {
      if (k && k !== '-' && k !== 'Umum') set.add(k);
    });
  });
  return Array.from(set).sort();
}

/**
 * Returns list of all known Siskom and Sisfo Dosen
 */
export function getDosenList(): DosenItem[] {
  return ALL_DOSEN;
}

