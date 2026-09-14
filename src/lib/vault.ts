/**
 * Untan Research Hub - Local-First Bookmark & Cross-Device Sync (v2)
 *
 * Architecture:
 * 1. Local-First: localStorage is the primary store (0ms latency, 100% offline).
 * 2. Slang Passphrase: Fun, memorable 4-word Indonesian slang passkeys (e.g. "kopi-santai-skripsi-mantap").
 * 3. Cross-Device Sync: Enter code on mobile/laptop or open link with `?sync=<code>`.
 */

/**
 * Computer Engineering vocabulary dictionary for 4-word memorable sync passphrases.
 * Over 330 unique terms spanning Computer Architecture, Digital Circuits, Embedded Systems,
 * Operating Systems, Networks, Algorithms, and Robotics (>11.6 Billion combinations).
 */
export const COMPUTER_ENGINEERING_WORDS: string[] = [
  // Digital Logic, Circuits & Electronics
  'logic', 'gate', 'circuit', 'silicon', 'diode', 'transistor', 'resistor', 'capacitor',
  'inductor', 'voltage', 'current', 'ground', 'analog', 'digital', 'signal', 'pulse',
  'clock', 'oscillator', 'flipflop', 'latch', 'relay', 'switch', 'inverter', 'buffer',
  'multiplex', 'encoder', 'decoder', 'comparator', 'schematic', 'breadboard', 'pcb', 'solder',
  'probe', 'trace', 'nand', 'nor', 'xor', 'xnor', 'adder', 'shifter', 'demux',
  'waveform', 'capacitance', 'inductance', 'impedance', 'junction', 'anode', 'cathode',
  'collector', 'emitter', 'drain', 'source',

  // Computer Architecture & Microprocessors
  'processor', 'cpu', 'gpu', 'alu', 'fpu', 'register', 'pipeline', 'opcode', 'operand',
  'instruction', 'bus', 'cache', 'ram', 'rom', 'sram', 'dram', 'flash', 'eeprom',
  'risc', 'cisc', 'core', 'thread', 'socket', 'chipset', 'microcode', 'hazard',
  'stall', 'fetch', 'decode', 'execute', 'datapath', 'accumulator', 'counter',
  'endian', 'multicore', 'wafer', 'nanometer', 'throughput', 'interconnect',
  'bandwidth', 'vector',

  // Embedded Systems, Microcontrollers & IoT
  'embedded', 'firmware', 'bios', 'boot', 'bootloader', 'uart', 'spi', 'canbus',
  'gpio', 'pwm', 'adc', 'dac', 'dma', 'interrupt', 'timer', 'watchdog', 'sensor',
  'actuator', 'servo', 'stepper', 'motor', 'transducer', 'telemetry', 'beacon', 'modem',
  'antenna', 'rfid', 'nfc', 'zigbee', 'bluetooth', 'lora', 'arduino', 'cortex',
  'fpga', 'cpld', 'asic', 'verilog', 'vhdl', 'gyroscope', 'accelerometer', 'photodiode',
  'thermistor', 'potentiometer', 'piezo', 'display', 'oled', 'pinout', 'datasheet',

  // Operating Systems, Kernel & Low-Level Systems
  'kernel', 'daemon', 'driver', 'system', 'process', 'mutex', 'semaphore', 'lock',
  'atomic', 'deadlock', 'scheduler', 'paging', 'segment', 'virtual', 'memory', 'heap',
  'syscall', 'trap', 'fault', 'pipe', 'fifo', 'posix', 'unix', 'linux',
  'hypervisor', 'shell', 'root', 'fork', 'spawn', 'zombie', 'orphan', 'priority',
  'concurrency', 'parallel', 'sync', 'spinlock', 'barrier', 'affinity', 'context',
  'alignment', 'padding',

  // Networking, Protocols & Telecommunications
  'packet', 'frame', 'header', 'payload', 'trailer', 'checksum', 'parity', 'router',
  'switch', 'gateway', 'bridge', 'hub', 'subnet', 'ethernet', 'fiber', 'copper',
  'wireless', 'wifi', 'tcp', 'udp', 'dns', 'dhcp', 'http', 'mqtt', 'websocket',
  'port', 'latency', 'jitter', 'ping', 'hop', 'route',
  'topology', 'mesh', 'broadcast', 'unicast', 'multicast', 'firewall', 'proxy', 'handshake',
  'stream', 'session', 'protocol', 'uplink', 'downlink', 'datagram', 'simplex', 'duplex',
  'carrier', 'loopback',

  // Signal Processing & Robotics
  'sampling', 'nyquist', 'fourier', 'aliasing', 'convolution', 'impulse', 'spectral',
  'quantization', 'decimation', 'robotics', 'kinematics', 'odometry', 'feedback',
  'controller',

  // Data Structures, Algorithms & Computing Theory
  'array', 'matrix', 'tensor', 'string', 'struct', 'tuple', 'tree',
  'trie', 'graph', 'node', 'edge', 'vertex', 'queue', 'deque', 'stack',
  'hash', 'table', 'binary', 'octal', 'byte', 'nibble', 'bit', 'boolean',
  'integer', 'float', 'double', 'pointer', 'index', 'search', 'sort', 'filter',
  'traverse', 'recursion', 'iteration', 'greedy', 'dynamic', 'entropy',

  // Security, Cryptography & Hardware Protection
  'crypto', 'cipher', 'nonce', 'token', 'secret', 'vault', 'shield', 'armor',
  'key', 'rsa', 'aes', 'digest', 'sandbox', 'exploit', 'patch', 'audit',
  'privilege', 'secure', 'enclave', 'trust', 'auth', 'signature',

  // Compilers, Software & Development Tools
  'compiler', 'assembler', 'linker', 'loader', 'parser', 'lexer', 'syntax',
  'bytecode', 'native', 'runtime', 'debugger', 'profiler', 'symbol', 'trace',
  'dump', 'build', 'script', 'deploy', 'git', 'commit', 'branch', 'merge',
  'diff', 'clone', 'push', 'pull', 'terminal', 'console'
];

export const INDONESIAN_SLANG_WORDS = COMPUTER_ENGINEERING_WORDS; // backward compatibility

export interface LocalVault {
  syncCode: string | null;       // 4-word passphrase e.g. "kernel-router-matrix-sensor"
  bookmarks: string[];          // array of article ojs_id
  lastSyncedAt?: string;
  hasSeenWelcome?: boolean;
  isPrimary?: boolean;          // backward compatibility
  secretKey?: string | null;    // alias for syncCode for backward compatibility
}

const STORAGE_KEY_V2 = 'untan_bookmarks_v2';
const STORAGE_KEY_V1 = 'untan_bookmark_vault_v1';

/**
 * Generates a memorable 4-word Computer Engineering sync code
 */
export function generateSecretKey(): string {
  const words = [...COMPUTER_ENGINEERING_WORDS];
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
