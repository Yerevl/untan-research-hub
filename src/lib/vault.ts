/**
 * Untan Research Hub - Local-First Bookmark & Cross-Device Sync (v2)
 *
 * Architecture:
 * 1. Local-First: localStorage is the primary store (0ms latency, 100% offline).
 * 2. Slang Passphrase: Fun, memorable 4-word Indonesian slang passkeys (e.g. "kopi-santai-skripsi-mantap").
 * 3. Cross-Device Sync: Enter code on mobile/laptop or open link with `?sync=<code>`.
 */

export const INDONESIAN_SLANG_WORDS: string[] = [
  // Kampus & Pontianak
  'untan', 'pontianak', 'khatulistiwa', 'kapuas', 'digulis', 'ayani', 'sepakat', 'reformasi',
  'gajahmada', 'tanjungpura', 'siantan', 'jeruju', 'sungairaya', 'kotabaru', 'flamboyan', 'pancadarma',
  'kampus', 'kuliah', 'gedung', 'rektorat', 'aula', 'fakultas', 'mipa', 'teknik', 'siskom',
  'sisfo', 'informatika', 'lab', 'perpus', 'kantin', 'gazebo', 'pendopo', 'warkop', 'asiang',
  'ambing', 'choipan', 'suntan', 'hujan', 'panas', 'terik', 'angin', 'sore', 'pagi', 'malam', 'senja',

  // Skripsi, Riset & Akademik
  'skripsi', 'wisuda', 'sarjana', 'gelar', 'dosen', 'pembimbing', 'penguji', 'sidang', 'seminar',
  'proposal', 'kompre', 'revisi', 'acc', 'bab', 'abstrak', 'jurnal', 'sitasi', 'riset', 'data',
  'metode', 'teori', 'analisis', 'uji', 'valid', 'fokus', 'pustaka', 'arsip', 'simpan', 'catat',
  'jelajah', 'cari', 'temu', 'sukses', 'lulus', 'tuntas', 'kelar', 'beres', 'cumlaude', 'beasiswa',
  'toefl', 'target', 'jadwal', 'deadline', 'turnitin', 'bimbingan', 'konsul', 'nilai', 'ilmu',
  'buku', 'pulpen', 'kertas', 'map', 'fotokopi', 'print', 'jilid', 'toga', 'ijazah', 'transkrip',
  'ipk', 'sks', 'semester', 'krs', 'khs', 'magang', 'kkn', 'studi', 'tugas', 'kuis', 'uts', 'uas',
  'praktek', 'praktikum', 'asisten', 'asprak', 'ketua', 'panitia', 'rapat', 'publikasi',

  // IT, Ngoding & Rekayasa
  'ngoding', 'koding', 'alpro', 'basisdata', 'jaringan', 'laptop', 'wifi', 'kuota', 'sinyal',
  'koneksi', 'server', 'cloud', 'bug', 'debug', 'error', 'deploy', 'git', 'commit', 'push',
  'pull', 'merge', 'branch', 'terminal', 'script', 'query', 'database', 'frontend', 'backend',
  'fullstack', 'api', 'auth', 'token', 'cache', 'build', 'syntax', 'array', 'loop', 'fungsi',
  'boolean', 'integer', 'string', 'logic', 'sistem', 'algoritma', 'robot', 'sensor', 'iot',
  'web', 'mobile', 'app', 'python', 'react', 'nextjs', 'code', 'cyber', 'packet', 'byte',
  'pixel', 'design', 'prototype', 'patch', 'update', 'release', 'online', 'offline', 'link',
  'klik', 'copy', 'paste', 'save', 'load', 'undo', 'redo', 'icon', 'button', 'matrix',

  // Makanan & Tongkrongan Mahasiswa
  'kopi', 'ngopi', 'teh', 'esteh', 'boba', 'bakso', 'seblak', 'cireng', 'geprek', 'indomie',
  'gorengan', 'tahu', 'tempe', 'nasi', 'uduk', 'liwet', 'sambal', 'pedas', 'manis', 'gurih',
  'renyah', 'nikmat', 'mantep', 'manteb', 'lezat', 'sotong', 'pangkong', 'lemang', 'pancong',
  'dimsum', 'martabak', 'roti', 'keju', 'cokelat', 'susu', 'esjeruk', 'soda', 'cemilan',
  'snack', 'jajan', 'cilok', 'batagor', 'siomay', 'pentol', 'mieayam', 'sate', 'rawon', 'soto', 'pecel',

  // Slang & Gaul Mahasiswa
  'santai', 'santuy', 'rebahan', 'mager', 'ambis', 'gaspol', 'gaskeun', 'mantap', 'mantul',
  'gokil', 'kece', 'gercep', 'satset', 'woles', 'kalem', 'paten', 'ciamik', 'asoy', 'jos',
  'sabi', 'auto', 'semangat', 'juara', 'aman', 'rapi', 'cuan', 'heboh', 'nongkrong', 'kuy',
  'mabar', 'chill', 'vibes', 'keren', 'top', 'ngacir', 'gaslur', 'sip', 'oke', 'asik', 'seru',
  'hebat', 'solutif', 'solid', 'cadas', 'jempol', 'slay', 'gacor', 'spill', 'circle', 'relate',
  'fomo', 'burnout', 'healing', 'estetik', 'humble', 'glowup', 'kerad', 'hype', 'mode', 'pro',
  'suhu', 'sepuh', 'mastah', 'gagas', 'kocak', 'parah', 'adem', 'fresh', 'epic', 'legend',
  'yoi', 'skuy', 'sans', 'cihuy', 'ajib', 'keceparah', 'gokilparah'
];

export interface LocalVault {
  syncCode: string | null;       // 4-word passphrase e.g. "kopi-santai-skripsi-mantap"
  bookmarks: string[];          // array of article ojs_id
  lastSyncedAt?: string;
  hasSeenWelcome?: boolean;
  isPrimary?: boolean;          // backward compatibility
  secretKey?: string | null;    // alias for syncCode for backward compatibility
}

const STORAGE_KEY_V2 = 'untan_bookmarks_v2';
const STORAGE_KEY_V1 = 'untan_bookmark_vault_v1';

/**
 * Generates a memorable 4-word Indonesian slang sync code
 */
export function generateSecretKey(): string {
  const words = [...INDONESIAN_SLANG_WORDS];
  const selected: string[] = [];
  for (let i = 0; i < 4; i++) {
    const idx = Math.floor(Math.random() * words.length);
    selected.push(words[idx]);
    words.splice(idx, 1);
  }
  return selected.join('-');
}

/**
 * Normalizes input code (trims whitespace, converts to lowercase, handles spaces/commas to hyphens)
 */
export function normalizeSecretKey(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/[\s,_]+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-');
}

/**
 * Reads local vault from localStorage with backward compatibility for v1
 */
export function getLocalVault(): LocalVault {
  if (typeof window === 'undefined') {
    return { syncCode: null, bookmarks: [] };
  }

  try {
    // 1. Try reading v2
    const storedV2 = localStorage.getItem(STORAGE_KEY_V2);
    if (storedV2) {
      const parsed = JSON.parse(storedV2);
      return {
        syncCode: parsed.syncCode || null,
        bookmarks: Array.isArray(parsed.bookmarks) ? parsed.bookmarks : [],
        lastSyncedAt: parsed.lastSyncedAt,
        hasSeenWelcome: Boolean(parsed.hasSeenWelcome),
      };
    }

    // 2. Migration: Try reading legacy v1
    const storedV1 = localStorage.getItem(STORAGE_KEY_V1);
    if (storedV1) {
      const parsed = JSON.parse(storedV1);
      const migrated: LocalVault = {
        syncCode: parsed.secretKey || null,
        bookmarks: Array.isArray(parsed.bookmarks) ? parsed.bookmarks : [],
        hasSeenWelcome: Boolean(parsed.hasSeenWelcome),
      };
      saveLocalVault(migrated);
      return migrated;
    }
  } catch (err) {
    console.warn('Error reading local vault:', err);
  }

  return { syncCode: null, bookmarks: [] };
}

/**
 * Saves local vault to localStorage and triggers cross-tab/component sync event
 */
export function saveLocalVault(vault: LocalVault): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY_V2, JSON.stringify(vault));
    window.dispatchEvent(new CustomEvent('untan_vault_updated', { detail: vault }));
  } catch (err) {
    console.error('Error saving local vault:', err);
  }
}

/**
 * Toggles an article in bookmarks.
 * If this is the user's first bookmark, generates a 4-word sync code automatically.
 */
export function toggleBookmarkLocal(ojsId: string): {
  vault: LocalVault;
  isBookmarked: boolean;
  isFirstEver: boolean;
  generatedCode?: string;
} {
  const current = getLocalVault();
  const exists = current.bookmarks.includes(ojsId);
  let isFirstEver = false;
  let syncCode = current.syncCode;
  let generatedCode: string | undefined = undefined;

  let nextBookmarks: string[];
  if (exists) {
    nextBookmarks = current.bookmarks.filter((id) => id !== ojsId);
  } else {
    nextBookmarks = [...current.bookmarks, ojsId];
    if (!syncCode) {
      syncCode = generateSecretKey();
      isFirstEver = true;
      generatedCode = syncCode;
    }
  }

  const updated: LocalVault = {
    ...current,
    syncCode,
    bookmarks: nextBookmarks,
  };

  saveLocalVault(updated);

  return {
    vault: updated,
    isBookmarked: !exists,
    isFirstEver,
    generatedCode,
  };
}

/**
 * Checks if an article is bookmarked
 */
export function isArticleBookmarked(ojsId: string, vault?: LocalVault): boolean {
  const v = vault || getLocalVault();
  return v.bookmarks.includes(ojsId);
}

/**
 * Clears local vault (disconnects device)
 */
export function clearLocalVault(): void {
  if (typeof window === 'undefined') return;
  const empty: LocalVault = { syncCode: null, bookmarks: [] };
  saveLocalVault(empty);
}

/**
 * Generates a direct URL that automatically loads this vault on another device
 */
export function generateShareUrl(syncCode: string): string {
  if (typeof window === 'undefined') return `https://untan-research-hub.vercel.app?sync=${syncCode}`;
  return `${window.location.origin}?sync=${syncCode}`;
}

/**
 * Resets and generates a fresh 4-word sync code
 */
export function resetAndGenerateNewVault(): LocalVault {
  const newCode = generateSecretKey();
  const fresh: LocalVault = {
    syncCode: newCode,
    bookmarks: [],
    hasSeenWelcome: false,
  };
  saveLocalVault(fresh);
  return fresh;
}
