/**
 * Local-First Bookmark & Secret-Key Sync Vault
 * 
 * Rules:
 * 1. Generates 4-word Indonesian slang secret passphrase on first bookmark.
 * 2. Local-first immediate storage (0ms latency), background cloud sync.
 * 3. Multi-device sync by entering the 4-word passphrase.
 * 4. Secondary device masks secret passphrase (••••-••••-••••-••••) for lab/public safety.
 * 5. Primary status can be transferred between devices.
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
  secretKey: string | null;       // 4-word passphrase e.g. "kopi-santai-skripsi-mantap"
  isPrimary: boolean;            // true if Primary Device (can view full key and transfer ownership)
  deviceId: string;              // unique persistent UUID for this browser
  bookmarks: string[];           // array of article ojs_id
  lastSyncedAt?: string;
  hasSeenWelcome?: boolean;      // whether first-time secret announcement modal has been seen
}

export interface CloudVaultRecord {
  secret_key: string;
  primary_device_id: string;
  secondary_device_ids: string[];
  bookmarks: string[];
  updated_at: string;
  created_at: string;
}

const DEVICE_ID_KEY = 'untan_vault_device_id';
const VAULT_STORAGE_KEY = 'untan_bookmark_vault_v1';

/**
 * Returns or creates persistent device ID for this browser
 */
export function getOrCreateDeviceId(): string {
  if (typeof window === 'undefined') return 'server_side';
  let devId = localStorage.getItem(DEVICE_ID_KEY);
  if (!devId) {
    devId = 'dev_' + Math.random().toString(36).substring(2, 9) + Date.now().toString(36).substring(4);
    localStorage.setItem(DEVICE_ID_KEY, devId);
  }
  return devId;
}

/**
 * Generates a memorable 4-word Indonesian slang secret key
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
 * Normalizes input secret key (trims whitespace, converts to lowercase, handles spaces/commas to hyphens)
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
 * Get current Local Vault from localStorage
 */
export function getLocalVault(): LocalVault {
  if (typeof window === 'undefined') {
    return {
      secretKey: null,
      isPrimary: false,
      deviceId: 'server_side',
      bookmarks: [],
    };
  }

  const deviceId = getOrCreateDeviceId();
  try {
    const stored = localStorage.getItem(VAULT_STORAGE_KEY);
    if (!stored) {
      return {
        secretKey: null,
        isPrimary: false,
        deviceId,
        bookmarks: [],
      };
    }
    const parsed = JSON.parse(stored);
    return {
      secretKey: parsed.secretKey || null,
      isPrimary: Boolean(parsed.isPrimary),
      deviceId: parsed.deviceId || deviceId,
      bookmarks: Array.isArray(parsed.bookmarks) ? parsed.bookmarks : [],
      lastSyncedAt: parsed.lastSyncedAt,
      hasSeenWelcome: Boolean(parsed.hasSeenWelcome),
    };
  } catch (e) {
    console.error('Error parsing local vault:', e);
    return {
      secretKey: null,
      isPrimary: false,
      deviceId,
      bookmarks: [],
    };
  }
}

/**
 * Save Local Vault to localStorage and dispatch custom event
 */
export function saveLocalVault(vault: LocalVault): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(VAULT_STORAGE_KEY, JSON.stringify(vault));
    window.dispatchEvent(new CustomEvent('untan_vault_updated', { detail: vault }));
  } catch (e) {
    console.error('Error saving local vault:', e);
  }
}

/**
 * Toggle an article bookmark in local vault.
 * If this is the user's very first bookmark ever, generates a new 4-word secret key and marks device as Primary.
 */
export function toggleBookmarkLocal(ojsId: string): {
  vault: LocalVault;
  isBookmarked: boolean;
  isFirstEver: boolean;
  generatedKey?: string;
} {
  const current = getLocalVault();
  const exists = current.bookmarks.includes(ojsId);
  let isFirstEver = false;
  let generatedKey: string | undefined = undefined;

  let nextBookmarks: string[];
  let secretKey = current.secretKey;
  let isPrimary = current.isPrimary;

  if (exists) {
    nextBookmarks = current.bookmarks.filter((id) => id !== ojsId);
  } else {
    nextBookmarks = [...current.bookmarks, ojsId];
    // If no secret key exists yet, this is first bookmark!
    if (!secretKey) {
      secretKey = generateSecretKey();
      isPrimary = true;
      isFirstEver = true;
      generatedKey = secretKey;
    }
  }

  const updated: LocalVault = {
    ...current,
    secretKey,
    isPrimary,
    bookmarks: nextBookmarks,
  };

  saveLocalVault(updated);

  return {
    vault: updated,
    isBookmarked: !exists,
    isFirstEver,
    generatedKey,
  };
}

/**
 * Check if an article is bookmarked in local vault
 */
export function isArticleBookmarked(ojsId: string, vault?: LocalVault): boolean {
  const v = vault || getLocalVault();
  return v.bookmarks.includes(ojsId);
}

/**
 * Disconnect / clear local vault on this device (e.g. logging out of a public PC)
 */
export function clearLocalVault(): void {
  if (typeof window === 'undefined') return;
  const deviceId = getOrCreateDeviceId();
  const empty: LocalVault = {
    secretKey: null,
    isPrimary: false,
    deviceId,
    bookmarks: [],
    hasSeenWelcome: false,
  };
  localStorage.setItem(VAULT_STORAGE_KEY, JSON.stringify(empty));
  window.dispatchEvent(new CustomEvent('untan_vault_updated', { detail: empty }));
}

/**
 * Reset vault and generate a brand new 4-word secret key for fresh testing
 */
export function resetAndGenerateNewVault(): LocalVault {
  if (typeof window === 'undefined') {
    return {
      secretKey: null,
      isPrimary: false,
      deviceId: 'server_side',
      bookmarks: [],
      hasSeenWelcome: false,
    };
  }
  const deviceId = getOrCreateDeviceId();
  const newKey = generateSecretKey();
  const fresh: LocalVault = {
    secretKey: newKey,
    isPrimary: true,
    deviceId,
    bookmarks: [],
    hasSeenWelcome: false,
  };
  saveLocalVault(fresh);
  return fresh;
}

