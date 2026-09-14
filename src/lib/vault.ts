/**
 * Untan Research Hub - Local-First Bookmark & Cross-Device Sync (v2)
 *
 * Architecture:
 * 1. Local-First: localStorage is the primary store (0ms latency, 100% offline).
 * 2. Slang Passphrase: Fun, memorable 4-word Indonesian slang passkeys (e.g. "kopi-santai-skripsi-mantap").
 * 3. Cross-Device Sync: Enter code on mobile/laptop or open link with `?sync=<code>`.
 */

export const INDONESIAN_SLANG_WORDS: string[] = [
  'santai', 'ngopi', 'gaspol', 'ambis', 'rebahan', 'mantap', 'gokil', 'santuy',
  'ngoding', 'skripsi', 'wisuda', 'cuan', 'kece', 'gercep', 'heboh', 'mager',
  'nongkrong', 'kalem', 'paten', 'ciamik', 'asoy', 'jos', 'sabi', 'woles',
  'auto', 'fokus', 'semangat', 'juara', 'beres', 'aman', 'rapi', 'kopi',
  'boba', 'bakso', 'seblak', 'cireng', 'untan', 'siskom', 'sisfo', 'lab',
  'laptop', 'wifi', 'pontianak', 'khatulistiwa', 'teh', 'jurnal', 'alpro',
  'basisdata', 'jaringan', 'koding', 'kampus', 'kuliah', 'revisi', 'sidang',
  'seminar', 'acc', 'dosen', 'senja', 'kuy', 'mabar', 'gaskeun', 'chill',
  'satset', 'vibes', 'keren', 'top', 'ngacir', 'mantul', 'gaslur', 'sip',
  'oke', 'asik', 'seru', 'pedas', 'manis', 'gurih', 'renyah', 'nikmat',
  'mantep', 'kelar', 'tuntas', 'lulus', 'sarjana', 'gelar', 'ilmu', 'riset',
  'pustaka', 'arsip', 'simpan', 'catat', 'jelajah', 'cari', 'temu', 'sukses',
  'hebat', 'solutif', 'solid', 'koneksi', 'sinyal', 'kuota', 'cadas', 'jempol'
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
