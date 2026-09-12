'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Bookmark,
  Key,
  ShieldCheck,
  ShieldAlert,
  Smartphone,
  Copy,
  Check,
  RefreshCw,
  LogOut,
  FileText,
  Trash2,
  ChevronDown,
  ChevronUp,
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
  const [activeTab, setActiveTab] = useState<'bookmarks' | 'sync'>('bookmarks');
  const [copiedKey, setCopiedKey] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncFeedback, setSyncFeedback] = useState<string | null>(null);

  // Progressive disclosure accordions for secondary actions
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [showTransferSelect, setShowTransferSelect] = useState(false);

  // Form states
  const [inputKey, setInputKey] = useState('');
  const [isLinking, setIsLinking] = useState(false);
  const [targetDeviceId, setTargetDeviceId] = useState('');
  const [isTransferring, setIsTransferring] = useState(false);
  const [connectedDevices, setConnectedDevices] = useState<string[]>([]);

  // Filter bookmarked articles
  const bookmarkedArticles = allArticles.filter((a) => vault.bookmarks.includes(a.ojs_id));

  // Clear toast feedback
  useEffect(() => {
    if (syncFeedback) {
      const timer = setTimeout(() => setSyncFeedback(null), 3500);
      return () => clearTimeout(timer);
    }
  }, [syncFeedback]);

  // Fetch connected devices when sync tab opens
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

  // Copy key
  const handleCopyKey = () => {
    if (!vault.secretKey) return;
    navigator.clipboard.writeText(vault.secretKey);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  // Manual cloud sync
  const handleManualSync = async () => {
    if (!vault.secretKey) {
      setSyncFeedback('Simpan minimal 1 artikel untuk sinkronisasi.');
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
        setSyncFeedback('Tersinkronisasi dengan Cloud!');
      } else {
        setSyncFeedback(data.error || 'Gagal sinkronisasi.');
      }
    } catch {
      setSyncFeedback('Tersimpan di perangkat lokal.');
    } finally {
      setIsSyncing(false);
    }
  };

  // Link device
  const handleLinkDevice = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanKey = normalizeSecretKey(inputKey);
    if (!cleanKey || cleanKey.split('-').length < 4) {
      setSyncFeedback('Format: 4 kata slang (contoh: ngopi-santai-skripsi-mantap)');
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
        setShowLinkInput(false);
        setSyncFeedback('Berhasil terhubung!');
        setActiveTab('bookmarks');
      } else {
        setSyncFeedback(data.error || 'Kunci rahasia tidak ditemukan.');
      }
    } catch {
      setSyncFeedback('Gagal menghubungkan perangkat.');
    } finally {
      setIsLinking(false);
    }
  };

  // Transfer primary
  const handleTransferPrimary = async () => {
    if (!targetDeviceId || !vault.secretKey) return;
    if (!confirm('Pindahkan status Perangkat Utama? Kunci akan disembunyikan di perangkat ini setelahnya.')) return;

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
        setSyncFeedback('Status Utama berhasil dialihkan.');
        setShowTransferSelect(false);
      } else {
        setSyncFeedback(data.error || 'Gagal mengalihkan status.');
      }
    } catch {
      setSyncFeedback('Kesalahan jaringan.');
    } finally {
      setIsTransferring(false);
    }
  };

  // Disconnect
  const handleDisconnect = () => {
    if (confirm('Putus sinkronisasi di perangkat ini? Koleksi Anda tetap tersimpan di cloud & perangkat utama.')) {
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
    <>
      {/* Light click-outside backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 z-40 bg-black/35 backdrop-blur-[2px] transition-opacity animate-in fade-in"
      />

      {/* Floating Widget: Expands from Top-Right on Mobile, Bottom-Right on PC */}
      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.94, y: 10 }}
        transition={{ type: 'spring', damping: 26, stiffness: 450 }}
        className="fixed z-50 bg-white dark:bg-[#161920] border-[2.5px] border-black dark:border-white shadow-[6px_6px_0px_0px_#16181D] dark:shadow-[6px_6px_0px_0px_#D4D4D8] flex flex-col overflow-hidden
          top-14 right-3 left-3 sm:left-auto sm:top-auto sm:bottom-20 sm:right-6 sm:w-[410px] max-h-[82vh]"
      >
        {/* Compact Header */}
        <div className="flex items-center justify-between px-3.5 py-2.5 bg-[#FEF08A] dark:bg-[#202530] border-b-2 border-black dark:border-white select-none">
          <div className="flex items-center gap-2">
            <Bookmark className="w-4 h-4 fill-current stroke-[2.5]" />
            <span className="font-black text-xs uppercase tracking-wider text-black dark:text-white">
              Koleksi & Kunci
            </span>
          </div>

          <button
            onClick={onClose}
            className="w-6 h-6 flex items-center justify-center bg-white dark:bg-black text-black dark:text-white border border-black dark:border-white hover:bg-[#FECDD3] hover:text-black transition-colors"
            title="Tutup"
          >
            <X className="w-3.5 h-3.5 stroke-[3]" />
          </button>
        </div>

        {/* Minimalist Tabs */}
        <div className="flex border-b-2 border-black dark:border-white bg-[#F8FAFC] dark:bg-[#111317]">
          <button
            onClick={() => setActiveTab('bookmarks')}
            className={`flex-1 py-2 px-3 text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-colors border-r-2 border-black dark:border-white ${
              activeTab === 'bookmarks'
                ? 'bg-white dark:bg-[#161920] text-black dark:text-white border-b-2 border-b-transparent -mb-[2px]'
                : 'text-slate-500 hover:text-black dark:hover:text-white'
            }`}
          >
            <Bookmark className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Koleksi ({vault.bookmarks.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('sync')}
            className={`flex-1 py-2 px-3 text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-colors ${
              activeTab === 'sync'
                ? 'bg-white dark:bg-[#161920] text-black dark:text-white border-b-2 border-b-transparent -mb-[2px]'
                : 'text-slate-500 hover:text-black dark:hover:text-white'
            }`}
          >
            <Key className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Kunci & Sync</span>
            {vault.isPrimary ? (
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            ) : vault.secretKey ? (
              <span className="w-1.5 h-1.5 rounded-full bg-sky-500" />
            ) : null}
          </button>
        </div>

        {/* Feedback Bar */}
        <AnimatePresence>
          {syncFeedback && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="px-3 py-1.5 text-[11px] font-bold bg-[#A3E635] text-black border-b border-black flex items-center justify-between"
            >
              <span>{syncFeedback}</span>
              <button onClick={() => setSyncFeedback(null)} className="font-mono text-xs underline ml-2">OK</button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-3.5 space-y-3">
          {/* TAB 1: KOLEKSI ARTIKEL */}
          {activeTab === 'bookmarks' && (
            <div className="space-y-2.5">
              {/* Filter Catalog Quick Button */}
              {vault.bookmarks.length > 0 && onFilterBookmarksOnly && (
                <div className="flex items-center justify-between pb-2 border-b border-black/15 dark:border-white/15">
                  <span className="text-[11px] font-medium text-slate-600 dark:text-slate-400">
                    Filter katalog utama?
                  </span>
                  <button
                    onClick={() => {
                      onFilterBookmarksOnly();
                      onClose();
                    }}
                    className={`px-2.5 py-1 text-[10px] font-black uppercase border border-black dark:border-white shadow-[1.5px_1.5px_0px_0px_#16181D] active:translate-x-0.5 active:translate-y-0.5 transition-all ${
                      isFilterActive ? 'bg-[#FDA4AF] text-black' : 'bg-[#FEF08A] text-black'
                    }`}
                  >
                    {isFilterActive ? 'BATAL FILTER' : 'FILTER SEKARANG'}
                  </button>
                </div>
              )}

              {/* Bookmarked list */}
              {bookmarkedArticles.length === 0 ? (
                <div className="text-center py-8 px-3">
                  <Bookmark className="w-8 h-8 stroke-[2] mx-auto text-slate-400 mb-2" />
                  <p className="text-xs font-bold text-black dark:text-white uppercase mb-1">
                    Belum Ada Artikel Tersimpan
                  </p>
                  <p className="text-[11px] text-slate-500 leading-relaxed max-w-xs mx-auto">
                    Klik tombol <strong>🔖 SIMPAN</strong> pada artikel skripsi yang Anda minati.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {bookmarkedArticles.map((art) => (
                    <div
                      key={art.ojs_id}
                      className="p-2.5 bg-slate-50 dark:bg-[#1c202a] border border-black/30 dark:border-white/30 flex flex-col gap-2"
                    >
                      <div>
                        <span className="text-[9px] font-black font-mono px-1 py-0.2 bg-slate-200 dark:bg-slate-700 text-black dark:text-white uppercase mr-1.5">
                          {art.prodi || 'UNTAN'}
                        </span>
                        <h4 className="font-bold text-xs text-black dark:text-white leading-snug line-clamp-2 inline">
                          {art.title}
                        </h4>
                      </div>

                      <div className="flex items-center justify-between pt-1.5 border-t border-black/10 dark:border-white/10">
                        <span className="text-[10px] text-slate-500 truncate max-w-[170px] font-mono">
                          {art.student || (art.authors && art.authors[0])}
                        </span>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            onClick={() => {
                              onReadPdf(art);
                              onClose();
                            }}
                            className="px-2 py-0.5 text-[10px] font-black bg-[#A3E635] text-black border border-black shadow-[1px_1px_0px_0px_#16181D] hover:bg-[#84CC16]"
                          >
                            BACA
                          </button>

                          <CitationButton article={art} />

                          <button
                            onClick={() => onToggleBookmark(art.ojs_id)}
                            className="p-1 text-[10px] font-black bg-[#FDA4AF] text-black border border-black hover:bg-[#FB7185]"
                            title="Hapus"
                          >
                            <Trash2 className="w-3 h-3 stroke-[2.5]" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: KUNCI & SYNC (CLEAN, UN-CLUTTERED) */}
          {activeTab === 'sync' && (
            <div className="space-y-3.5 text-xs">
              {/* Status Header Row */}
              <div className="flex items-center justify-between pb-2 border-b border-black/15 dark:border-white/15">
                <div className="flex items-center gap-1.5">
                  {vault.isPrimary ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-[#A3E635] text-black text-[10px] font-black uppercase border border-black">
                      <ShieldCheck className="w-3 h-3 stroke-[3]" />
                      Perangkat Utama
                    </span>
                  ) : vault.secretKey ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-[#38BDF8] text-black text-[10px] font-black uppercase border border-black">
                      <Smartphone className="w-3 h-3 stroke-[2.5]" />
                      Perangkat Kedua
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold text-slate-500">Belum Terhubung</span>
                  )}
                </div>

                {vault.secretKey && (
                  <button
                    onClick={handleManualSync}
                    disabled={isSyncing}
                    className="inline-flex items-center gap-1 px-2.5 py-1 text-[10px] font-black uppercase bg-white dark:bg-black text-black dark:text-white border border-black dark:border-white shadow-[1.5px_1.5px_0px_0px_#16181D] hover:bg-[#FEF08A] hover:text-black transition-all"
                  >
                    <RefreshCw className={`w-3 h-3 ${isSyncing ? 'animate-spin' : ''}`} />
                    <span>{isSyncing ? 'Sync...' : 'Sinkron'}</span>
                  </button>
                )}
              </div>

              {/* Secret Key Box */}
              {vault.secretKey ? (
                <div className="space-y-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                    Kunci Rahasia (4 Kata)
                  </span>

                  {vault.isPrimary ? (
                    <div className="flex items-center gap-1.5 bg-[#FEF08A] dark:bg-yellow-400 p-2 border-2 border-black">
                      <code className="font-mono font-black text-xs text-black tracking-wide flex-1 break-all select-all">
                        {vault.secretKey}
                      </code>
                      <button
                        onClick={handleCopyKey}
                        className="px-2 py-1 text-[10px] font-black uppercase bg-black text-white hover:bg-slate-800 transition-colors flex items-center gap-1 shrink-0"
                      >
                        {copiedKey ? (
                          <>
                            <Check className="w-3 h-3 text-green-400 stroke-[3]" />
                            <span>SALIN!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3 stroke-[2.5]" />
                            <span>SALIN</span>
                          </>
                        )}
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 bg-slate-100 dark:bg-black/40 p-2 border border-black/40 dark:border-white/40">
                        <code className="font-mono font-bold text-xs tracking-widest text-slate-500 flex-1 select-none">
                          •••• - •••• - •••• - ••••
                        </code>
                        <span className="text-[9px] font-bold uppercase bg-slate-200 dark:bg-slate-700 px-1.5 py-0.5 text-slate-600 dark:text-slate-300">
                          TERKUNCI
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-500 leading-tight">
                        🔒 Kunci disembunyikan demi keamanan di komputer umum/lab.
                      </p>
                    </div>
                  )}
                </div>
              ) : null}

              {/* Accordion 1: Hubungkan Kunci Lain */}
              <div className="pt-2 border-t border-black/15 dark:border-white/15">
                <button
                  type="button"
                  onClick={() => setShowLinkInput(!showLinkInput)}
                  className="w-full flex items-center justify-between text-[11px] font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 hover:text-black dark:hover:text-white"
                >
                  <span>+ Hubungkan Kunci dari Perangkat Lain</span>
                  {showLinkInput ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </button>

                <AnimatePresence>
                  {showLinkInput && (
                    <motion.form
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      onSubmit={handleLinkDevice}
                      className="pt-2 flex gap-1.5 overflow-hidden"
                    >
                      <input
                        type="text"
                        value={inputKey}
                        onChange={(e) => setInputKey(e.target.value)}
                        placeholder="kata1-kata2-kata3-kata4"
                        className="flex-1 px-2 py-1 text-xs font-mono bg-white dark:bg-black text-black dark:text-white border border-black dark:border-white focus:outline-none"
                      />
                      <button
                        type="submit"
                        disabled={isLinking || !inputKey.trim()}
                        className="px-2.5 py-1 text-[10px] font-black uppercase bg-[#38BDF8] text-black border border-black hover:bg-[#0284C7] hover:text-white disabled:opacity-50"
                      >
                        {isLinking ? '...' : 'LINK'}
                      </button>
                    </motion.form>
                  )}
                </AnimatePresence>
              </div>

              {/* Accordion 2: Alihkan Status Utama (Khusus Primary) */}
              {vault.isPrimary && (
                <div className="pt-2 border-t border-black/15 dark:border-white/15">
                  <button
                    type="button"
                    onClick={() => setShowTransferSelect(!showTransferSelect)}
                    className="w-full flex items-center justify-between text-[11px] font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 hover:text-black dark:hover:text-white"
                  >
                    <span>⇄ Alihkan Status Perangkat Utama</span>
                    {showTransferSelect ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  </button>

                  <AnimatePresence>
                    {showTransferSelect && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="pt-2 overflow-hidden"
                      >
                        {connectedDevices.length > 0 ? (
                          <div className="flex gap-1.5">
                            <select
                              value={targetDeviceId}
                              onChange={(e) => setTargetDeviceId(e.target.value)}
                              className="flex-1 px-2 py-1 text-[10px] font-mono bg-white dark:bg-black text-black dark:text-white border border-black dark:border-white"
                            >
                              <option value="">Pilih Perangkat</option>
                              {connectedDevices.map((dev, idx) => (
                                <option key={dev} value={dev}>
                                  Perangkat #{idx + 1} ({dev.substring(0, 8)})
                                </option>
                              ))}
                            </select>
                            <button
                              type="button"
                              onClick={handleTransferPrimary}
                              disabled={isTransferring || !targetDeviceId}
                              className="px-2.5 py-1 text-[10px] font-black uppercase bg-[#F472B6] text-black border border-black hover:bg-[#DB2777] hover:text-white disabled:opacity-50"
                            >
                              {isTransferring ? '...' : 'ALIHKAN'}
                            </button>
                          </div>
                        ) : (
                          <p className="text-[10px] text-slate-400 italic">
                            Belum ada perangkat kedua yang terhubung.
                          </p>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}

              {/* Disconnect text link */}
              {vault.secretKey && (
                <div className="pt-2.5 border-t border-black/15 dark:border-white/15 flex justify-end">
                  <button
                    type="button"
                    onClick={handleDisconnect}
                    className="text-[10px] font-bold text-red-500 hover:text-red-700 hover:underline flex items-center gap-1"
                  >
                    <LogOut className="w-3 h-3" />
                    <span>Putus koneksi di perangkat ini</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </motion.div>
    </>
  );
};
