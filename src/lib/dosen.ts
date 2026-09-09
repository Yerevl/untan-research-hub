import { Article, Supervisor } from './types';

export interface DosenItem {
  name: string;
  cleanName: string;
  keahlian: string[];
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
    jabatan: "Lektor",
  },
  {
    name: "Rahmi Hidayati, S.Kom., M.Cs.",
    cleanName: "Rahmi Hidayati",
    keahlian: ["Automation & Embeded System (AES)"],
    jabatan: "Lektor",
  },
  {
    name: "Syamsul Bahri, S.Kom., M.Cs.",
    cleanName: "Syamsul Bahri",
    keahlian: ["Network Intelligent Control (NIC)"],
    jabatan: "Lektor",
  },
  {
    name: "Dedi Triyanto, S.T., M.T.",
    cleanName: "Dedi Triyanto",
    keahlian: ["Edge Computing"],
    jabatan: "Lektor",
  },
  {
    name: "Tedy Rismawan, S.Kom., M.Cs.",
    cleanName: "Tedy Rismawan",
    keahlian: ["Automation & Embeded System (AES)"],
    jabatan: "Lektor",
  },
  {
    name: "Cucu Suhery, M.A.",
    cleanName: "Cucu Suhery",
    keahlian: ["Automation & Embeded System (AES)"],
    jabatan: "Lektor",
  },
  {
    name: "Dwi Marisa Midyanti, S.T., M.Cs.",
    cleanName: "Dwi Marisa Midyanti",
    keahlian: ["Network Intelligent Control (NIC)"],
    jabatan: "Lektor",
  },
  {
    name: "Irma Nirmala, S.T., M.T.",
    cleanName: "Irma Nirmala",
    keahlian: ["Automation & Embeded System (AES)"],
    jabatan: "Asisten Ahli",
  },
  {
    name: "Suhardi, S.T., M.Eng.",
    cleanName: "Suhardi",
    keahlian: ["Automation & Embeded System (AES)"],
    jabatan: "Asisten Ahli",
  },
  {
    name: "Uray Ristian, S.Kom., M.Kom.",
    cleanName: "Uray Ristian",
    keahlian: ["Network Intelligent Control (NIC)"],
    jabatan: "Asisten Ahli",
  },
  {
    name: "Hirzen Hasfani, S.Kom., M.Cs.",
    cleanName: "Hirzen Hasfani",
    keahlian: ["Network Intelligent Control (NIC)"],
    jabatan: "Tenaga Pengajar",
  },
  {
    name: "Kartika Sari, S.Kom., M.Cs.",
    cleanName: "Kartika Sari",
    keahlian: ["Automation & Embeded System (AES)"],
    jabatan: "Tenaga Pengajar",
  },
  {
    name: "Kasliono, S.Mat., M.Cs.",
    cleanName: "Kasliono",
    keahlian: ["Network Intelligent Control (NIC)"],
    jabatan: "Tenaga Pengajar",
  },
  {
    name: "Hafiz Muhardi, S.T., M.Kom.",
    cleanName: "Hafiz Muhardi",
    keahlian: ["Network Intelligent Control (NIC)"],
    jabatan: "Tenaga Pengajar",
  },
  {
    name: "Weldi, S.Kom.",
    cleanName: "Weldi",
    keahlian: ["Umum"],
    jabatan: "Tenaga Pengajar",
  },
  {
    name: "Solihun, S.Kom.",
    cleanName: "Solihun",
    keahlian: ["Video Conference"],
    jabatan: "Tenaga Pengajar",
  },
];

/**
 * Matches an author name string from journal article to a Siskom lecturer
 */
export function matchAuthorToDosen(authorName: string): DosenItem | null {
  if (!authorName) return null;
  const clean = authorName.toLowerCase().replace(/[^a-z0-9\s]/g, '').trim();

  for (const d of SISKOM_DOSEN) {
    const dClean = d.cleanName.toLowerCase().replace(/[^a-z0-9\s]/g, '').trim();
    // Direct inclusion or all words match (handles "Suhardi Suhardi" matching "Suhardi")
    if (clean.includes(dClean) || dClean.includes(clean)) {
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
 * Enriches an article with identified student, supervising lecturers, and keahlian
 */
export function enrichArticleWithDosen(article: Article): Article {
  const authors = article.authors || [];
  const student = authors[0] || 'Mahasiswa';
  const supervisorAuthors = authors.slice(1);

  const supervisors: Supervisor[] = [];
  const keahlianSet = new Set<string>();

  supervisorAuthors.forEach((authorName) => {
    const matched = matchAuthorToDosen(authorName);
    if (matched) {
      supervisors.push({
        name: matched.name,
        cleanName: matched.cleanName,
        keahlian: matched.keahlian,
      });
      matched.keahlian.forEach((k) => keahlianSet.add(k));
    } else {
      supervisors.push({
        name: authorName,
        cleanName: authorName,
        keahlian: [],
      });
    }
  });

  return {
    ...article,
    student,
    supervisors,
    keahlian: Array.from(keahlianSet),
  };
}

/**
 * Returns list of all known Keahlian categories
 */
export function getKeahlianList(): string[] {
  const set = new Set<string>();
  SISKOM_DOSEN.forEach((d) => {
    d.keahlian.forEach((k) => {
      if (k && k !== '-' && k !== 'Umum') set.add(k);
    });
  });
  return Array.from(set).sort();
}

/**
 * Returns list of all known Siskom Dosen names
 */
export function getDosenList(): DosenItem[] {
  return SISKOM_DOSEN;
}

