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
  Laptop,
  Copy,
  Check,
  RefreshCw,
  LogOut,
  FileText,
  Trash2,
  ExternalLink,
  Info,
  ArrowRightLeft,
  Sparkles,
  Layers,
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
  const [syncMessage, setSyncMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Link device form state
  const [inputKey, setInputKey] = useState('');
  const [isLinking, setIsLinking] = useState(false);

  // Transfer primary state
  const [targetDeviceId, setTargetDeviceId] = useState('');
  const [isTransferring, setIsTransferring] = useState(false);
  const [connectedDevices, setConnectedDevices] = useState<string[]>([]);

  // Filter bookmarked articles
  const bookmarkedArticles = allArticles.filter((a) => vault.bookmarks.includes(a.ojs_id));

  // Auto-clear notification messages after 4 seconds
  useEffect(() => {
    if (syncMessage) {
      const timer = setTimeout(() => setSyncMessage(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [syncMessage]);

  // Fetch connected devices when sync tab opens
  useEffect(() => {
    if (isOpen && vault.secretKey) {
      fetch(`/api/vault?key=${encodeURIComponent(vault.secretKey)}&deviceId=${encodeURIComponent(vault.deviceId)}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.success && data.vault) {
            setConnectedDevices(data.vault.secondaryDevices || []);
            // Update primary status if changed
            if (data.vault.isPrimary !== vault.isPrimary) {
              onVaultSynced({
                ...vault,
                isPrimary: data.vault.isPrimary,
              });
            }
          }
        })
        .catch((err) => console.warn('Gagal memuat status perangkat:', err));
    }
  }, [isOpen, vault.secretKey, vault.deviceId, activeTab]);

  // Copy secret key
  const handleCopyKey = () => {
    if (!vault.secretKey) return;
    navigator.clipboard.writeText(vault.secretKey);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  // Manual cloud sync
  const handleManualSync = async () => {
    if (!vault.secretKey) {
      setSyncMessage({ type: 'error', text: 'Simpan minimal satu artikel untuk mengaktifkan sinkronisasi.' });
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
        setSyncMessage({ type: 'success', text: 'Koleksi berhasil disinkronkan dengan Cloud!' });
      } else {
        setSyncMessage({ type: 'error', text: data.error || 'Gagal sinkronisasi.' });
      }
    } catch (e: any) {
      setSyncMessage({ type: 'error', text: 'Koneksi gagal. Perubahan tersimpan secara lokal.' });
    } finally {
      setIsSyncing(false);
    }
  };

  // Link this device to an existing secret key
  const handleLinkDevice = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanKey = normalizeSecretKey(inputKey);
    if (!cleanKey || cleanKey.split('-').length < 4) {
      setSyncMessage({ type: 'error', text: 'Masukkan 4 kata rahasia yang dipisahkan tanda strip (contoh: ngopi-santai-skripsi-mantap).' });
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
        setSyncMessage({
          type: 'success',
          text: data.vault.isPrimary
            ? 'Perangkat ini terhubung sebagai Perangkat Utama!'
            : 'Perangkat berhasil terhubung! Kunci dirahasiakan demi privasi Anda.',
        });
        setActiveTab('bookmarks');
      } else {
        setSyncMessage({ type: 'error', text: data.error || 'Kunci rahasia tidak ditemukan.' });
      }
    } catch (e: any) {
      setSyncMessage({ type: 'error', text: 'Gagal menghubungkan perangkat.' });
    } finally {
      setIsLinking(false);
    }
  };

  // Transfer primary status to another device
  const handleTransferPrimary = async () => {
    if (!targetDeviceId || !vault.secretKey) return;
    if (!confirm('Pindahkan status Perangkat Utama ke perangkat ini? Setelah dipindahkan, kunci rahasia akan disembunyikan di perangkat saat ini.')) {
      return;
    }

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
        onVaultSynced({
          ...vault,
          isPrimary: false,
        });
        setSyncMessage({ type: 'success', text: 'Status Perangkat Utama berhasil dipindahkan!' });
        setTargetDeviceId('');
      } else {
        setSyncMessage({ type: 'error', text: data.error || 'Gagal memindahkan status.' });
      }
    } catch (e: any) {
      setSyncMessage({ type: 'error', text: 'Terjadi kesalahan jaringan.' });
    } finally {
      setIsTransferring(false);
    }
  };

  // Disconnect / clear local vault on this device
  const handleDisconnect = () => {
    if (confirm('Putus sinkronisasi di perangkat ini? Koleksi Anda tetap aman di cloud dan perangkat utama.')) {
      onVaultSynced({
        secretKey: null,
        isPrimary: false,
        deviceId: vault.deviceId,
        bookmarks: [],
      });
      setSyncMessage({ type: 'success', text: 'Data lokal di perangkat ini berhasil dihapus.' });
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/65 backdrop-blur-sm animate-in fade-in duration-150">
      <motion.div
        initial={{ scale: 0.93, opacity: 0, y: 15 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.93, opacity: 0, y: 15 }}
        transition={{ type: 'spring', damping: 26, stiffness: 450 }}
        className="relative w-full max-w-2xl bg-white dark:bg-[#181B22] border-[3px] border-black dark:border-white shadow-[8px_8px_0px_0px_#16181D] dark:shadow-[8px_8px_0px_0px_#D4D4D8] max-h-[90vh] flex flex-col overflow-hidden"
      >
        {/* Modal Top Bar */}
        <div className="flex items-center justify-between p-4 bg-[#FEF08A] dark:bg-[#232936] border-b-[2.5px] border-black dark:border-white select-none">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 flex items-center justify-center bg-black text-white dark:bg-yellow-400 dark:text-black border-2 border-black font-black text-sm">
              <Bookmark className="w-4 h-4 fill-current" />
            </div>
            <div>
              <h2 className="font-black text-base sm:text-lg uppercase tracking-tight text-black dark:text-white leading-tight">
                Brankas Koleksi Riset
              </h2>
              <p className="text-[11px] font-mono text-slate-700 dark:text-slate-300">
                {vault.bookmarks.length} Artikel Disimpan • Local-First Cloud Sync
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center bg-white dark:bg-black text-black dark:text-white border-2 border-black dark:border-white shadow-[2px_2px_0px_0px_#16181D] dark:shadow-[2px_2px_0px_0px_#D4D4D8] hover:bg-[#FECDD3] hover:text-black active:translate-x-0.5 active:translate-y-0.5 transition-all"
            title="Tutup Brankas"
          >
            <X className="w-4 h-4 stroke-[3]" />
          </button>
        </div>

        {/* Tab Selection Row */}
        <div className="flex border-b-[2.5px] border-black dark:border-white bg-[#F1F5F9] dark:bg-[#13151A]">
          <button
            onClick={() => setActiveTab('bookmarks')}
            className={`flex-1 py-2.5 px-4 font-black text-xs sm:text-sm uppercase tracking-wider transition-all flex items-center justify-center gap-2 border-r-[2px] border-black dark:border-white ${
              activeTab === 'bookmarks'
                ? 'bg-white dark:bg-[#181B22] text-black dark:text-white border-b-2 border-b-white dark:border-b-[#181B22] -mb-[2px]'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800'
            }`}
          >
            <Bookmark className="w-4 h-4 stroke-[2.5]" />
            <span>Koleksi ({vault.bookmarks.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('sync')}
            className={`flex-1 py-2.5 px-4 font-black text-xs sm:text-sm uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
              activeTab === 'sync'
                ? 'bg-white dark:bg-[#181B22] text-black dark:text-white border-b-2 border-b-white dark:border-b-[#181B22] -mb-[2px]'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800'
            }`}
          >
            <Key className="w-4 h-4 stroke-[2.5]" />
            <span>Kunci & Sinkron</span>
            {vault.isPrimary ? (
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" title="Perangkat Utama" />
            ) : vault.secretKey ? (
              <span className="w-2 h-2 rounded-full bg-sky-500" title="Perangkat Kedua" />
            ) : null}
          </button>
        </div>

        {/* Sync Toast Feedback */}
        <AnimatePresence>
          {syncMessage && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className={`px-4 py-2 text-xs font-bold border-b-2 border-black flex items-center gap-2 select-none ${
                syncMessage.type === 'success'
                  ? 'bg-[#A3E635] text-black'
                  : 'bg-[#FDA4AF] text-black'
              }`}
            >
              <Info className="w-4 h-4 shrink-0 stroke-[2.5]" />
              <span className="flex-1">{syncMessage.text}</span>
              <button onClick={() => setSyncMessage(null)} className="font-mono text-sm underline">OK</button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
          {/* TAB 1: DAFTAR BUKUMARK */}
          {activeTab === 'bookmarks' && (
            <div className="space-y-4">
              {/* Quick Action Bar for Bookmarks */}
              {vault.bookmarks.length > 0 && onFilterBookmarksOnly && (
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 p-3 bg-[#FEF08A]/30 dark:bg-yellow-400/10 border-2 border-black dark:border-yellow-400/30">
                  <div className="flex items-center gap-2 text-xs font-bold text-black dark:text-yellow-200">
                    <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
                    <span>Tampilkan hanya koleksi tersimpan di halaman utama?</span>
                  </div>
                  <button
                    onClick={() => {
                      onFilterBookmarksOnly();
                      onClose();
                    }}
                    className={`px-3 py-1.5 text-xs font-black uppercase tracking-wider border-2 border-black dark:border-white shadow-[2px_2px_0px_0px_#16181D] dark:shadow-[2px_2px_0px_0px_#D4D4D8] active:translate-x-0.5 active:translate-y-0.5 transition-all ${
                      isFilterActive
                        ? 'bg-[#FDA4AF] text-black hover:bg-[#FB7185]'
                        : 'bg-[#FACC15] text-black hover:bg-[#EAB308]'
                    }`}
                  >
                    {isFilterActive ? 'RESET KE SEMUA ARTIKEL' : 'FILTER KATALOG UTAMA'}
                  </button>
                </div>
              )}

              {/* Bookmarked Articles List */}
              {bookmarkedArticles.length === 0 ? (
                <div className="text-center py-12 px-4 border-2 border-dashed border-black/30 dark:border-white/30 p-8">
                  <div className="w-12 h-12 mx-auto mb-3 bg-[#FEF08A] text-black border-2 border-black flex items-center justify-center shadow-[3px_3px_0px_0px_#16181D]">
                    <Bookmark className="w-6 h-6 stroke-[2.5]" />
                  </div>
                  <h3 className="text-base font-black text-black dark:text-white uppercase mb-1">
                    Belum Ada Koleksi Tersimpan
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400 max-w-md mx-auto mb-4 leading-relaxed">
                    Tandai artikel skripsi yang menarik dengan menekan tombol <strong>🔖 SIMPAN</strong> pada kartu artikel. 
                    Artikel akan tersimpan otomatis dan Anda akan diberikan 4 kata rahasia slang unik!
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {bookmarkedArticles.map((art) => (
                    <div
                      key={art.ojs_id}
                      className="p-3.5 bg-white dark:bg-[#1F242D] border-2 border-black dark:border-white shadow-[3px_3px_0px_0px_#16181D] dark:shadow-[3px_3px_0px_0px_#D4D4D8] flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="flex-1 min-w-0">
                        <span className="text-[10px] font-bold font-mono px-1.5 py-0.5 bg-slate-200 dark:bg-slate-700 text-black dark:text-white uppercase border border-black/20 mr-2">
                          {art.prodi || 'UNTAN'}
                        </span>
                        <h4 className="font-bold text-xs sm:text-sm text-black dark:text-white leading-snug line-clamp-2 mt-1">
                          {art.title}
                        </h4>
                        <p className="text-[11px] text-slate-600 dark:text-slate-400 font-mono mt-0.5 truncate">
                          {art.student || (art.authors && art.authors[0]) || 'Mahasiswa'} • {art.issue_name?.replace(/:.*/, '') || 'Jurnal'}
                        </p>
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
                        <button
                          onClick={() => {
                            onReadPdf(art);
                            onClose();
                          }}
                          className="px-2.5 py-1.5 text-xs font-black bg-[#A3E635] text-black border-2 border-black shadow-[1.5px_1.5px_0px_0px_#16181D] hover:bg-[#84CC16] active:translate-x-0.5 active:translate-y-0.5 transition-all flex items-center gap-1"
                          title="Baca PDF langsung"
                        >
                          <FileText className="w-3.5 h-3.5 stroke-[2.5]" />
                          <span>BACA</span>
                        </button>

                        <CitationButton article={art} />

                        <button
                          onClick={() => onToggleBookmark(art.ojs_id)}
                          className="p-1.5 text-xs font-black bg-[#FDA4AF] text-black border-2 border-black shadow-[1.5px_1.5px_0px_0px_#16181D] hover:bg-[#FB7185] active:translate-x-0.5 active:translate-y-0.5 transition-all"
                          title="Hapus dari koleksi tersimpan"
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

          {/* TAB 2: KUNCI RAHASIA & SINKRONISASI */}
          {activeTab === 'sync' && (
            <div className="space-y-6">
              {/* Device Status Header Badge */}
              <div className="p-4 bg-slate-50 dark:bg-[#13151A] border-2 border-black dark:border-white shadow-[3px_3px_0px_0px_#16181D] dark:shadow-[3px_3px_0px_0px_#D4D4D8] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-1">
                    STATUS IDENTITAS PERANGKAT
                  </span>
                  <div className="flex items-center gap-2">
                    {vault.isPrimary ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-[#A3E635] text-black border-2 border-black text-xs font-black uppercase tracking-wider shadow-[2px_2px_0px_0px_#16181D]">
                        <ShieldCheck className="w-4 h-4 stroke-[2.5]" />
                        ★ Perangkat Utama
                      </span>
                    ) : vault.secretKey ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-[#38BDF8] text-black border-2 border-black text-xs font-black uppercase tracking-wider shadow-[2px_2px_0px_0px_#16181D]">
                        <Smartphone className="w-4 h-4 stroke-[2.5]" />
                        Perangkat Kedua (Terhubung)
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-200 dark:bg-slate-700 text-black dark:text-white border-2 border-black text-xs font-black uppercase tracking-wider">
                        Belum Terhubung
                      </span>
                    )}
                    <span className="text-xs font-mono text-slate-500">
                      ID: {vault.deviceId.substring(0, 10)}...
                    </span>
                  </div>
                </div>

                {/* Manual Sync Button */}
                {vault.secretKey && (
                  <button
                    onClick={handleManualSync}
                    disabled={isSyncing}
                    className="px-3 py-1.5 text-xs font-black uppercase tracking-wider bg-white dark:bg-black text-black dark:text-white border-2 border-black dark:border-white shadow-[2px_2px_0px_0px_#16181D] dark:shadow-[2px_2px_0px_0px_#D4D4D8] hover:bg-[#FEF08A] hover:text-black active:translate-x-0.5 active:translate-y-0.5 transition-all flex items-center gap-1.5 shrink-0"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 stroke-[2.5] ${isSyncing ? 'animate-spin' : ''}`} />
                    <span>{isSyncing ? 'Sinkron...' : 'Sinkronkan'}</span>
                  </button>
                )}
              </div>

              {/* Secret Key Display Box */}
              {vault.secretKey ? (
                <div className="p-4 bg-white dark:bg-[#1E232E] border-2 border-black dark:border-white shadow-[4px_4px_0px_0px_#16181D] dark:shadow-[4px_4px_0px_0px_#D4D4D8]">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-black uppercase tracking-wider text-black dark:text-white flex items-center gap-1.5">
                      <Key className="w-3.5 h-3.5 text-amber-500 stroke-[2.5]" />
                      <span>Kunci Rahasia (4 Kata Slang)</span>
                    </span>
                    {vault.isPrimary ? (
                      <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                        Dapat dilihat di perangkat utama
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold text-sky-600 dark:text-sky-400 font-mono">
                        Disembunyikan demi privasi
                      </span>
                    )}
                  </div>

                  {/* Primary view: Plaintext key + Copy button */}
                  {vault.isPrimary ? (
                    <div>
                      <div className="flex items-center gap-2 bg-[#FEF08A] p-3 border-2 border-black shadow-[2px_2px_0px_0px_#16181D]">
                        <code className="font-mono font-black text-sm sm:text-base text-black tracking-wider flex-1 select-all break-all">
                          {vault.secretKey}
                        </code>
                        <button
                          onClick={handleCopyKey}
                          className="px-3 py-1.5 text-xs font-black uppercase bg-black text-white hover:bg-slate-800 active:scale-95 transition-transform flex items-center gap-1 shrink-0"
                          title="Salin Kunci Rahasia"
                        >
                          {copiedKey ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-green-400 stroke-[3]" />
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
                      <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-2 leading-relaxed">
                        💡 <strong>Catat 4 kata ini!</strong> Masukkan kunci ini di HP, tablet, atau laptop lain untuk menyinkronkan seluruh daftar jurnal tersimpan Anda secara instan tanpa perlu akun/kata sandi.
                      </p>
                    </div>
                  ) : (
                    /* Secondary view: Masked key for public/lab PC safety */
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 bg-slate-100 dark:bg-black/40 p-3 border-2 border-black dark:border-white">
                        <code className="font-mono font-bold text-sm tracking-widest text-slate-500 dark:text-slate-400 flex-1 select-none">
                          •••• - •••• - •••• - ••••
                        </code>
                        <span className="text-[10px] font-black uppercase bg-slate-200 dark:bg-slate-700 px-2 py-1 text-slate-700 dark:text-slate-300">
                          TERKUNCI
                        </span>
                      </div>
                      <div className="flex items-start gap-2 p-2.5 bg-blue-50 dark:bg-sky-950/30 border border-sky-300 dark:border-sky-800 text-[11px] text-sky-900 dark:text-sky-300 leading-relaxed">
                        <ShieldAlert className="w-4 h-4 shrink-0 text-sky-600 dark:text-sky-400 mt-0.5" />
                        <span>
                          <strong>Perlindungan Privasi Aktif:</strong> Kunci rahasia disengaja disembunyikan di perangkat ini agar orang lain di lab kampus tidak dapat mencuri atau menyalin kunci brankas Anda.
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              ) : null}

              {/* Form: Hubungkan Perangkat Lain dengan Kunci 4 Kata */}
              <div className="p-4 bg-white dark:bg-[#1E232E] border-2 border-black dark:border-white shadow-[4px_4px_0px_0px_#16181D] dark:shadow-[4px_4px_0px_0px_#D4D4D8]">
                <h4 className="text-xs font-black uppercase tracking-wider text-black dark:text-white mb-1.5 flex items-center gap-1.5">
                  <Smartphone className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>Hubungkan dengan Kunci dari Perangkat Lain</span>
                </h4>
                <p className="text-[11px] text-slate-600 dark:text-slate-400 mb-3 leading-relaxed">
                  Sudah punya kunci 4 kata dari HP atau laptop Anda? Masukkan di sini untuk menyinkronkan artikel tersimpan ke perangkat ini.
                </p>

                <form onSubmit={handleLinkDevice} className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    value={inputKey}
                    onChange={(e) => setInputKey(e.target.value)}
                    placeholder="contoh: ngopi-santai-skripsi-mantap"
                    className="flex-1 px-3 py-2 text-xs font-mono bg-[#F8FAFC] dark:bg-[#13151A] text-black dark:text-white border-2 border-black dark:border-white focus:outline-none focus:ring-2 focus:ring-yellow-400"
                  />
                  <button
                    type="submit"
                    disabled={isLinking || !inputKey.trim()}
                    className="px-4 py-2 text-xs font-black uppercase tracking-wider bg-[#38BDF8] text-black border-2 border-black shadow-[2px_2px_0px_0px_#16181D] hover:bg-[#0284C7] hover:text-white active:translate-x-0.5 active:translate-y-0.5 disabled:opacity-50 transition-all shrink-0"
                  >
                    {isLinking ? 'Menghubungkan...' : 'HUBUNGKAN'}
                  </button>
                </form>
              </div>

              {/* Transfer Primary Status (Visible only to Primary Device) */}
              {vault.isPrimary && (
                <div className="p-4 bg-white dark:bg-[#1E232E] border-2 border-black dark:border-white shadow-[4px_4px_0px_0px_#16181D] dark:shadow-[4px_4px_0px_0px_#D4D4D8]">
                  <h4 className="text-xs font-black uppercase tracking-wider text-black dark:text-white mb-1.5 flex items-center gap-1.5">
                    <ArrowRightLeft className="w-3.5 h-3.5 stroke-[2.5]" />
                    <span>Alihkan Status Perangkat Utama</span>
                  </h4>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400 mb-3 leading-relaxed">
                    Anda dapat menyerahkan status Perangkat Utama ke perangkat lain yang telah terhubung.
                  </p>

                  {connectedDevices.length > 0 ? (
                    <div className="space-y-2">
                      <div className="flex flex-col sm:flex-row gap-2">
                        <select
                          value={targetDeviceId}
                          onChange={(e) => setTargetDeviceId(e.target.value)}
                          className="flex-1 px-3 py-2 text-xs font-mono bg-[#F8FAFC] dark:bg-[#13151A] text-black dark:text-white border-2 border-black dark:border-white"
                        >
                          <option value="">-- Pilih Perangkat Terhubung --</option>
                          {connectedDevices.map((dev, idx) => (
                            <option key={dev} value={dev}>
                              Perangkat #{idx + 1} ({dev.substring(0, 12)}...)
                            </option>
                          ))}
                        </select>
                        <button
                          type="button"
                          onClick={handleTransferPrimary}
                          disabled={isTransferring || !targetDeviceId}
                          className="px-4 py-2 text-xs font-black uppercase tracking-wider bg-[#F472B6] text-black border-2 border-black shadow-[2px_2px_0px_0px_#16181D] hover:bg-[#DB2777] hover:text-white active:translate-x-0.5 active:translate-y-0.5 disabled:opacity-50 transition-all shrink-0"
                        >
                          {isTransferring ? 'Memproses...' : 'ALIHKAN STATUS'}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-[11px] font-mono text-slate-500 italic">
                      Belum ada perangkat kedua yang terhubung dengan kunci ini. Hubungkan perangkat kedua terlebih dahulu.
                    </p>
                  )}
                </div>
              )}

              {/* Danger Zone: Disconnect Local Vault */}
              {vault.secretKey && (
                <div className="pt-3 border-t-2 border-black/15 dark:border-white/15 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                      Selesai Menggunakan di Komputer Lab?
                    </span>
                    <span className="text-[10px] text-slate-500">
                      Putus sinkronisasi agar riwayat tidak tertinggal di komputer umum.
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleDisconnect}
                    className="px-3 py-1.5 text-xs font-black uppercase text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 border border-red-400 transition-colors flex items-center gap-1 shrink-0"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>PUTUS KONEKSI</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Bottom Footer */}
        <div className="p-3 bg-[#F8FAFC] dark:bg-[#111317] border-t-2 border-black dark:border-white flex items-center justify-between text-[11px] font-mono text-slate-500 select-none">
          <span>UNTAN Research Hub Vault v1.0</span>
          <span>{vault.lastSyncedAt ? `Tersinkron: ${vault.lastSyncedAt}` : 'Lokal Pertama'}</span>
        </div>
      </motion.div>
    </div>
  );
};
