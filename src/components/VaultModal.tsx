'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Bookmark,
  Key,
  Copy,
  Check,
  RefreshCw,
  LogOut,
  FileText,
  Trash2,
  Smartphone,
  ArrowRightLeft,
  Sparkles,
} from 'lucide-react';
import { LocalVault, normalizeSecretKey } from '@/lib/vault';
import { Article } from '@/lib/types';
import { CitationButton } from './CitationButton';

interface VaultModalProps {
  isOpen: boolean;
  onClose: () => void;
  vault: LocalVault;
  allArticles: Article[];
  onToggleBookmark: (ojsId: string) => void;
  onVaultSynced: (updatedVault: LocalVault) => void;
  onReadPdf: (article: Article) => void;
  onFilterBookmarksOnly?: () => void;
  isFilterActive?: boolean;
}

export const VaultModal: React.FC<VaultModalProps> = ({
  isOpen,
  onClose,
  vault,
  allArticles,
  onToggleBookmark,
  onVaultSynced,
  onReadPdf,
  onFilterBookmarksOnly,
  isFilterActive,
}) => {
  const [activeTab, setActiveTab] = useState<'bookmarks' | 'my-key' | 'enter-key'>('bookmarks');
  const [copiedKey, setCopiedKey] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Form states
  const [inputKey, setInputKey] = useState('');
  const [isLinking, setIsLinking] = useState(false);
  const [targetDeviceId, setTargetDeviceId] = useState('');
  const [isTransferring, setIsTransferring] = useState(false);
  const [connectedDevices, setConnectedDevices] = useState<string[]>([]);

  // Filter bookmarked articles
  const bookmarkedArticles = allArticles.filter((a) => vault.bookmarks.includes(a.ojs_id));

  // Auto-clear notification
  useEffect(() => {
    if (feedback) {
      const timer = setTimeout(() => setFeedback(null), 3500);
      return () => clearTimeout(timer);
    }
  }, [feedback]);

  // Fetch connected devices when modal opens
  useEffect(() => {
    if (isOpen && vault.secretKey) {
      fetch(`/api/vault?key=${encodeURIComponent(vault.secretKey)}&deviceId=${encodeURIComponent(vault.deviceId)}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.success && data.vault) {
            setConnectedDevices(data.vault.secondaryDevices || []);
            if (data.vault.isPrimary !== vault.isPrimary) {
              onVaultSynced({ ...vault, isPrimary: data.vault.isPrimary });
            }
          }
        })
        .catch(() => {});
    }
  }, [isOpen, vault.secretKey, vault.deviceId, activeTab]);

  // Copy secret key
  const handleCopyKey = () => {
    if (!vault.secretKey) return;
    navigator.clipboard.writeText(vault.secretKey);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  // Manual sync
  const handleManualSync = async () => {
    if (!vault.secretKey) {
      setFeedback({ type: 'error', text: 'Simpan minimal satu artikel terlebih dahulu.' });
      return;
    }
    setIsSyncing(true);
    try {
      const res = await fetch('/api/vault', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'sync',
          secretKey: vault.secretKey,
          deviceId: vault.deviceId,
          bookmarks: vault.bookmarks,
        }),
      });
      const data = await res.json();
      if (data.success && data.vault) {
        onVaultSynced({
          ...vault,
          bookmarks: data.vault.bookmarks,
          isPrimary: data.vault.isPrimary,
          lastSyncedAt: new Date().toLocaleTimeString('id-ID'),
        });
        setFeedback({ type: 'success', text: 'Daftar artikel berhasil diperbarui!' });
      } else {
        setFeedback({ type: 'error', text: data.error || 'Gagal memperbarui.' });
      }
    } catch {
      setFeedback({ type: 'error', text: 'Gagal menghubungkan ke server.' });
    } finally {
      setIsSyncing(false);
    }
  };

  // Connect from another device using 4 words
  const handleLinkDevice = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanKey = normalizeSecretKey(inputKey);
    if (!cleanKey || cleanKey.split('-').length < 4) {
      setFeedback({ type: 'error', text: 'Masukkan 4 kata (contoh: ngopi-santai-skripsi-mantap).' });
      return;
    }

    setIsLinking(true);
    try {
      const res = await fetch('/api/vault', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'link',
          secretKey: cleanKey,
          deviceId: vault.deviceId,
        }),
      });
      const data = await res.json();
      if (data.success && data.vault) {
        onVaultSynced({
          ...vault,
          secretKey: cleanKey,
          isPrimary: data.vault.isPrimary,
          bookmarks: data.vault.bookmarks,
          lastSyncedAt: new Date().toLocaleTimeString('id-ID'),
        });
        setInputKey('');
        setFeedback({ type: 'success', text: 'Berhasil! Artikel tersimpan kamu sudah muncul.' });
        setActiveTab('bookmarks');
      } else {
        setFeedback({ type: 'error', text: data.error || 'Kode salah atau tidak ditemukan.' });
      }
    } catch {
      setFeedback({ type: 'error', text: 'Gagal terhubung ke server.' });
    } finally {
      setIsLinking(false);
    }
  };

  // Transfer permission to another connected device
  const handleTransferPrimary = async () => {
    if (!targetDeviceId || !vault.secretKey) return;
    if (!confirm('Pindahkan izin melihat kode ke perangkat ini?')) return;

    setIsTransferring(true);
    try {
      const res = await fetch('/api/vault', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'transfer_primary',
          secretKey: vault.secretKey,
          currentDeviceId: vault.deviceId,
          targetDeviceId,
        }),
      });
      const data = await res.json();
      if (data.success) {
        onVaultSynced({ ...vault, isPrimary: false });
        setFeedback({ type: 'success', text: 'Izin berhasil dipindahkan ke perangkat tersebut.' });
        setTargetDeviceId('');
      } else {
        setFeedback({ type: 'error', text: data.error || 'Gagal memindahkan izin.' });
      }
    } catch {
      setFeedback({ type: 'error', text: 'Terjadi kesalahan jaringan.' });
    } finally {
      setIsTransferring(false);
    }
  };

  // Remove local data on this computer
  const handleDisconnect = () => {
    if (confirm('Hapus daftar tersimpan dari komputer ini? Artikel kamu tetap aman di HP / laptop utama.')) {
      onVaultSynced({
        secretKey: null,
        isPrimary: false,
        deviceId: vault.deviceId,
        bookmarks: [],
      });
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
      <motion.div
        initial={{ scale: 0.94, opacity: 0, y: 15 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.94, opacity: 0, y: 15 }}
        transition={{ type: 'spring', damping: 26, stiffness: 450 }}
        className="relative w-full max-w-lg bg-white dark:bg-[#181B22] border-[3px] border-black dark:border-white shadow-[8px_8px_0px_0px_#16181D] dark:shadow-[8px_8px_0px_0px_#D4D4D8] flex flex-col max-h-[85vh] overflow-hidden select-none"
      >
        {/* Modal Top Bar - Clean & Human */}
        <div className="flex items-center justify-between p-3.5 sm:p-4 bg-[#FEF08A] dark:bg-[#202530] border-b-[2.5px] border-black dark:border-white">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 flex items-center justify-center bg-black text-white dark:bg-yellow-400 dark:text-black border-2 border-black font-black text-sm">
              <Bookmark className="w-4 h-4 fill-current" />
            </div>
            <div>
              <h2 className="font-black text-base sm:text-lg uppercase tracking-tight text-black dark:text-white leading-tight">
                Koleksi Skripsi Saya
              </h2>
              <p className="text-[11px] text-slate-700 dark:text-slate-300 font-medium">
                {vault.bookmarks.length} artikel tersimpan
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center bg-white dark:bg-black text-black dark:text-white border-2 border-black dark:border-white shadow-[2px_2px_0px_0px_#16181D] dark:shadow-[2px_2px_0px_0px_#D4D4D8] hover:bg-[#FECDD3] hover:text-black active:translate-x-0.5 active:translate-y-0.5 transition-all"
            title="Tutup"
          >
            <X className="w-4 h-4 stroke-[3]" />
          </button>
        </div>

        {/* 3 Simple, Distinct Tabs */}
        <div className="flex border-b-[2.5px] border-black dark:border-white bg-[#F1F5F9] dark:bg-[#13151A] text-xs">
          {/* Tab 1: Tersimpan */}
          <button
            onClick={() => setActiveTab('bookmarks')}
            className={`flex-1 py-2.5 px-2 font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 border-r border-black dark:border-white ${
              activeTab === 'bookmarks'
                ? 'bg-white dark:bg-[#181B22] text-black dark:text-white border-b-2 border-b-white dark:border-b-[#181B22] -mb-[2px]'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800'
            }`}
          >
            <Bookmark className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Tersimpan ({vault.bookmarks.length})</span>
          </button>

          {/* Tab 2: Kode Akses HP */}
          <button
            onClick={() => setActiveTab('my-key')}
            className={`flex-1 py-2.5 px-2 font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 border-r border-black dark:border-white ${
              activeTab === 'my-key'
                ? 'bg-white dark:bg-[#181B22] text-black dark:text-white border-b-2 border-b-white dark:border-b-[#181B22] -mb-[2px]'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800'
            }`}
          >
            <Key className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Buka di HP</span>
            {vault.isPrimary ? (
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" title="Perangkat Utama" />
            ) : vault.secretKey ? (
              <span className="w-2 h-2 rounded-full bg-sky-500" title="Perangkat Terhubung" />
            ) : null}
          </button>

          {/* Tab 3: Masukkan Kode */}
          <button
            onClick={() => setActiveTab('enter-key')}
            className={`flex-1 py-2.5 px-2 font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'enter-key'
                ? 'bg-white dark:bg-[#181B22] text-black dark:text-white border-b-2 border-b-white dark:border-b-[#181B22] -mb-[2px]'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Hubungkan HP</span>
          </button>
        </div>

        {/* Feedback Alert */}
        <AnimatePresence>
          {feedback && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className={`px-4 py-2 text-xs font-bold border-b-2 border-black flex items-center justify-between ${
                feedback.type === 'success' ? 'bg-[#A3E635] text-black' : 'bg-[#FDA4AF] text-black'
              }`}
            >
              <span>{feedback.text}</span>
              <button onClick={() => setFeedback(null)} className="font-mono text-xs underline">TUTUP</button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5">
          {/* TAB 1: DAFTAR ARTIKEL TERSIMPAN */}
          {activeTab === 'bookmarks' && (
            <div className="space-y-3">
              {/* Quick Filter Bar */}
              {vault.bookmarks.length > 0 && onFilterBookmarksOnly && (
                <div className="flex items-center justify-between p-2.5 bg-[#FEF08A]/30 dark:bg-yellow-400/10 border border-black/30 dark:border-white/30 text-xs">
                  <span className="font-bold text-slate-800 dark:text-yellow-200">
                    Saring katalog utama?
                  </span>
                  <button
                    onClick={() => {
                      onFilterBookmarksOnly();
                      onClose();
                    }}
                    className={`px-2.5 py-1 text-[11px] font-black uppercase border border-black dark:border-white shadow-[1.5px_1.5px_0px_0px_#16181D] active:translate-x-0.5 active:translate-y-0.5 transition-all ${
                      isFilterActive ? 'bg-[#FDA4AF] text-black' : 'bg-[#FACC15] text-black'
                    }`}
                  >
                    {isFilterActive ? 'RESET KATALOG' : 'TAMPILKAN SAJA'}
                  </button>
                </div>
              )}

              {/* Bookmarks List */}
              {bookmarkedArticles.length === 0 ? (
                <div className="text-center py-12 px-4">
                  <div className="w-12 h-12 mx-auto mb-3 bg-[#FEF08A] text-black border-2 border-black flex items-center justify-center shadow-[3px_3px_0px_0px_#16181D]">
                    <Bookmark className="w-6 h-6 stroke-[2.5]" />
                  </div>
                  <h3 className="text-sm font-black text-black dark:text-white uppercase mb-1">
                    Belum Ada Artikel yang Disimpan
                  </h3>
                  <p className="text-xs text-slate-500 max-w-xs mx-auto leading-relaxed">
                    Klik tombol <strong>🔖 SIMPAN</strong> pada artikel mana pun untuk menyimpannya ke daftar ini.
                  </p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {bookmarkedArticles.map((art) => (
                    <div
                      key={art.ojs_id}
                      className="p-3 bg-slate-50 dark:bg-[#1E232E] border-2 border-black dark:border-white shadow-[3px_3px_0px_0px_#16181D] dark:shadow-[3px_3px_0px_0px_#D4D4D8] flex flex-col sm:flex-row sm:items-center justify-between gap-2.5"
                    >
                      <div className="flex-1 min-w-0">
                        <span className="text-[10px] font-bold font-mono px-1.5 py-0.2 bg-slate-200 dark:bg-slate-700 text-black dark:text-white uppercase mr-1.5">
                          {art.prodi || 'UNTAN'}
                        </span>
                        <h4 className="font-bold text-xs sm:text-sm text-black dark:text-white leading-snug line-clamp-2 inline">
                          {art.title}
                        </h4>
                        <p className="text-[11px] text-slate-500 font-mono mt-0.5 truncate">
                          {art.student || (art.authors && art.authors[0])} • {art.issue_name?.replace(/:.*/, '')}
                        </p>
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
                        <button
                          onClick={() => {
                            onReadPdf(art);
                            onClose();
                          }}
                          className="px-2.5 py-1 text-xs font-black bg-[#A3E635] text-black border border-black shadow-[1.5px_1.5px_0px_0px_#16181D] hover:bg-[#84CC16]"
                        >
                          BACA
                        </button>

                        <CitationButton article={art} />

                        <button
                          onClick={() => onToggleBookmark(art.ojs_id)}
                          className="p-1 text-xs font-black bg-[#FDA4AF] text-black border border-black shadow-[1.5px_1.5px_0px_0px_#16181D] hover:bg-[#FB7185]"
                          title="Hapus"
                        >
                          <Trash2 className="w-3.5 h-3.5 stroke-[2.5]" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: KODE RAHASIA SAYA (UNTUK DIBUKA DI HP) */}
          {activeTab === 'my-key' && (
            <div className="space-y-4">
              {vault.secretKey ? (
                <>
                  <div className="text-center py-2">
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-black uppercase tracking-wider bg-[#FEF08A] text-black border-2 border-black shadow-[2px_2px_0px_0px_#16181D] mb-3">
                      <Sparkles className="w-3.5 h-3.5 stroke-[2.5]" />
                      <span>{vault.isPrimary ? 'Perangkat Utama Anda' : 'Perangkat Terhubung'}</span>
                    </span>

                    <h3 className="text-sm font-black text-black dark:text-white uppercase mb-1">
                      Kode Rahasia untuk Buka di HP
                    </h3>
                    <p className="text-xs text-slate-600 dark:text-slate-300 max-w-sm mx-auto leading-relaxed">
                      Ketik 4 kata ini di HP atau laptop lain agar semua artikel tersimpan kamu otomatis muncul:
                    </p>
                  </div>

                  {/* The 4-word code display */}
                  {vault.isPrimary ? (
                    <div className="p-3.5 bg-[#FEF08A] dark:bg-yellow-400 border-2 border-black shadow-[3px_3px_0px_0px_#16181D] flex items-center justify-between gap-2">
                      <code className="font-mono font-black text-sm sm:text-base text-black tracking-wide break-all select-all flex-1">
                        {vault.secretKey}
                      </code>
                      <button
                        onClick={handleCopyKey}
                        className="px-3 py-1.5 text-xs font-black uppercase bg-black text-white hover:bg-slate-800 transition-colors flex items-center gap-1.5 shrink-0"
                      >
                        {copiedKey ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-400 stroke-[3]" />
                            <span>TERSALIN!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5 stroke-[2.5]" />
                            <span>SALIN</span>
                          </>
                        )}
                      </button>
                    </div>
                  ) : (
                    <div className="p-3 bg-slate-100 dark:bg-[#1E232E] border-2 border-black dark:border-white text-center space-y-2">
                      <code className="font-mono font-bold text-sm tracking-widest text-slate-500 block">
                        •••• - •••• - •••• - ••••
                      </code>
                      <p className="text-xs text-slate-500">
                        Kode disembunyikan di perangkat ini agar tetap aman saat digunakan di komputer umum atau lab.
                      </p>
                    </div>
                  )}

                  {/* Sync status & Refresh */}
                  <div className="pt-2 flex items-center justify-between text-xs text-slate-500 border-t border-black/10 dark:border-white/10">
                    <span>{vault.lastSyncedAt ? `Sinkron terakhir: ${vault.lastSyncedAt}` : 'Tersimpan lokal'}</span>
                    <button
                      onClick={handleManualSync}
                      disabled={isSyncing}
                      className="font-bold text-black dark:text-white hover:underline flex items-center gap-1"
                    >
                      <RefreshCw className={`w-3 h-3 ${isSyncing ? 'animate-spin' : ''}`} />
                      <span>{isSyncing ? 'Menyinkronkan...' : 'Perbarui'}</span>
                    </button>
                  </div>

                  {/* Optional: Pindahkan izin jika Perangkat Utama */}
                  {vault.isPrimary && connectedDevices.length > 0 && (
                    <div className="pt-3 border-t border-black/10 dark:border-white/10 text-xs">
                      <span className="font-bold text-black dark:text-white block mb-1.5">
                        Pindahkan Izin Melihat Kode ke HP:
                      </span>
                      <div className="flex gap-2">
                        <select
                          value={targetDeviceId}
                          onChange={(e) => setTargetDeviceId(e.target.value)}
                          className="flex-1 px-2.5 py-1.5 text-xs font-mono bg-white dark:bg-black text-black dark:text-white border-2 border-black dark:border-white"
                        >
                          <option value="">-- Pilih HP / Laptop Terhubung --</option>
                          {connectedDevices.map((dev, idx) => (
                            <option key={dev} value={dev}>
                              Perangkat #{idx + 1}
                            </option>
                          ))}
                        </select>
                        <button
                          onClick={handleTransferPrimary}
                          disabled={isTransferring || !targetDeviceId}
                          className="px-3 py-1.5 text-xs font-black uppercase bg-[#F472B6] text-black border-2 border-black hover:bg-[#DB2777] hover:text-white disabled:opacity-50"
                        >
                          {isTransferring ? '...' : 'PINDAHKAN'}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Keluar dari komputer lab */}
                  <div className="pt-3 border-t border-black/10 dark:border-white/10 flex items-center justify-between text-xs">
                    <span className="text-slate-500 text-[11px]">Pakai komputer lab kampus?</span>
                    <button
                      onClick={handleDisconnect}
                      className="font-bold text-red-500 hover:text-red-700 hover:underline flex items-center gap-1 text-[11px]"
                    >
                      <LogOut className="w-3 h-3" />
                      <span>Hapus data dari komputer ini</span>
                    </button>
                  </div>
                </>
              ) : (
                <div className="text-center py-10 px-4">
                  <p className="text-xs text-slate-500 max-w-xs mx-auto leading-relaxed mb-3">
                    Kamu belum menyimpan artikel apa pun. Simpan minimal satu artikel untuk mendapatkan 4 kata rahasia.
                  </p>
                  <button
                    onClick={() => setActiveTab('bookmarks')}
                    className="px-3 py-1.5 text-xs font-black uppercase bg-[#FEF08A] text-black border-2 border-black shadow-[2px_2px_0px_0px_#16181D]"
                  >
                    KEMBALI KE KOLEKSI
                  </button>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: MASUKKAN KODE DARI HP / PERANGKAT LAIN */}
          {activeTab === 'enter-key' && (
            <div className="space-y-4 py-2">
              <div className="text-center">
                <div className="w-10 h-10 mx-auto mb-2 bg-[#38BDF8] text-black border-2 border-black flex items-center justify-center shadow-[2px_2px_0px_0px_#16181D]">
                  <Smartphone className="w-5 h-5 stroke-[2.5]" />
                </div>
                <h3 className="text-sm font-black text-black dark:text-white uppercase mb-1">
                  Punya Kode dari HP atau Laptop Lain?
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-300 max-w-xs mx-auto leading-relaxed">
                  Masukkan 4 kata rahasia kamu di bawah ini untuk memunculkan semua artikel yang sudah kamu simpan:
                </p>
              </div>

              {/* Input form */}
              <form onSubmit={handleLinkDevice} className="space-y-2.5 max-w-sm mx-auto">
                <input
                  type="text"
                  value={inputKey}
                  onChange={(e) => setInputKey(e.target.value)}
                  placeholder="contoh: ngopi-santai-skripsi-mantap"
                  className="w-full px-3 py-2 text-xs font-mono bg-white dark:bg-black text-black dark:text-white border-2 border-black dark:border-white focus:outline-none focus:ring-2 focus:ring-yellow-400"
                />

                <button
                  type="submit"
                  disabled={isLinking || !inputKey.trim()}
                  className="w-full py-2 px-4 text-xs font-black uppercase tracking-wider bg-[#38BDF8] text-black border-2 border-black shadow-[2px_2px_0px_0px_#16181D] hover:bg-[#0284C7] hover:text-white disabled:opacity-50 transition-all flex items-center justify-center gap-1.5"
                >
                  <Smartphone className="w-3.5 h-3.5" />
                  <span>{isLinking ? 'Menghubungkan...' : 'BUKA ARTIKEL SAYA'}</span>
                </button>
              </form>
            </div>
          )}
        </div>

        {/* Minimal Footer */}
        <div className="px-4 py-2.5 bg-[#F8FAFC] dark:bg-[#111317] border-t-2 border-black dark:border-white flex items-center justify-between text-[10px] font-mono text-slate-500">
          <span>UNTAN RESEARCH HUB</span>
          <span>{vault.bookmarks.length} TERSIMPAN</span>
        </div>
      </motion.div>
    </div>
  );
};
