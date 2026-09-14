'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Bookmark,
  Smartphone,
  Copy,
  Check,
  Trash2,
  FileText,
  Share2,
  RefreshCw,
  Search,
  ExternalLink,
} from 'lucide-react';
import { LocalVault, normalizeSecretKey, generateShareUrl, resetAndGenerateNewVault } from '@/lib/vault';
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
  onShowKeyAnnouncement?: (key: string) => void;
}

export const VaultModal: React.FC<VaultModalProps> = ({
  isOpen,
  onClose,
  vault,
  allArticles,
  onToggleBookmark,
  onVaultSynced,
  onReadPdf,
}) => {
  const [activeTab, setActiveTab] = useState<'bookmarks' | 'sync'>('bookmarks');
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [inputCode, setInputCode] = useState('');
  const [isLinking, setIsLinking] = useState(false);
  const [filterQuery, setFilterQuery] = useState('');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Filter bookmarked articles
  const bookmarkedArticles = allArticles.filter((art) =>
    vault.bookmarks.includes(art.ojs_id)
  );

  const displayArticles = filterQuery.trim()
    ? bookmarkedArticles.filter(
        (art) =>
          art.title.toLowerCase().includes(filterQuery.toLowerCase()) ||
          art.student?.toLowerCase().includes(filterQuery.toLowerCase()) ||
          art.supervisors?.some((s) => s.cleanName.toLowerCase().includes(filterQuery.toLowerCase()))
      )
    : bookmarkedArticles;

  const handleCopyCode = () => {
    if (!vault.syncCode) return;
    navigator.clipboard.writeText(vault.syncCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleCopyLink = () => {
    if (!vault.syncCode) return;
    const url = generateShareUrl(vault.syncCode);
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleLinkDevice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputCode.trim()) return;

    const normalized = normalizeSecretKey(inputCode);
    setIsLinking(true);
    setFeedback(null);

    try {
      const res = await fetch(`/api/vault?code=${encodeURIComponent(normalized)}`);
      const data = await res.json();

      if (res.ok && data.success && Array.isArray(data.bookmarks)) {
        // Merge cloud bookmarks with local
        const merged = Array.from(new Set([...vault.bookmarks, ...data.bookmarks]));
        const updated: LocalVault = {
          syncCode: normalized,
          bookmarks: merged,
          lastSyncedAt: new Date().toLocaleTimeString('id-ID'),
        };
        onVaultSynced(updated);
        setInputCode('');
        setFeedback({
          type: 'success',
          message: `Berhasil terhubung! ${data.bookmarks.length} skripsi berhasil disinkronkan.`,
        });
        setActiveTab('bookmarks');
      } else {
        setFeedback({
          type: 'error',
          message: data.error || 'Kode tidak ditemukan. Pastikan 4 kata sandi sudah sesuai.',
        });
      }
    } catch {
      setFeedback({
        type: 'error',
        message: 'Gagal menghubungi server. Periksa koneksi internet Anda.',
      });
    } finally {
      setIsLinking(false);
    }
  };

  const handleCreateNewCode = () => {
    if (confirm('Buat 4 kata kode baru? Koleksi Anda saat ini akan tetap tersimpan.')) {
      const fresh = resetAndGenerateNewVault();
      // Keep existing bookmarks with new code
      fresh.bookmarks = vault.bookmarks;
      onVaultSynced(fresh);
      setFeedback({
        type: 'success',
        message: 'Kode sinkronisasi baru berhasil dibuat!',
      });
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.2 }}
          className="relative w-full max-w-xl bg-[#FFFDF0] dark:bg-[#1A1D20] text-slate-900 dark:text-slate-100 border-3 border-black dark:border-white shadow-[6px_6px_0px_0px_#000] dark:shadow-[6px_6px_0px_0px_#FFF] flex flex-col max-h-[90vh] overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-[#FEF08A] dark:bg-[#2D3339] border-b-3 border-black dark:border-white">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-black text-[#FEF08A] border border-black shadow-[1.5px_1.5px_0px_0px_#000]">
                <Bookmark className="w-4 h-4 fill-current" />
              </div>
              <div>
                <h2 className="text-sm sm:text-base font-black uppercase tracking-tight">
                  Koleksi Skripsi Saya
                </h2>
                <p className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                  {bookmarkedArticles.length} artikel tersimpan
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 bg-white dark:bg-[#1A1D20] border-2 border-black dark:border-white shadow-[2px_2px_0px_0px_#000] hover:bg-red-400 dark:hover:bg-red-500 hover:text-white transition-colors cursor-pointer"
              title="Tutup Modal"
            >
              <X className="w-4 h-4 stroke-[3]" />
            </button>
          </div>

          {/* Navigation Tabs */}
          <div className="grid grid-cols-2 border-b-3 border-black dark:border-white bg-slate-100 dark:bg-black/20 text-xs font-black uppercase">
            <button
              onClick={() => {
                setActiveTab('bookmarks');
                setFeedback(null);
              }}
              className={`py-2.5 flex items-center justify-center gap-2 border-r-3 border-black dark:border-white transition-colors cursor-pointer ${
                activeTab === 'bookmarks'
                  ? 'bg-white dark:bg-[#1A1D20] text-black dark:text-white underline decoration-2'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-yellow-100/60 dark:hover:bg-slate-800'
              }`}
            >
              <Bookmark className="w-3.5 h-3.5" />
              <span>Tersimpan ({bookmarkedArticles.length})</span>
            </button>
            <button
              onClick={() => {
                setActiveTab('sync');
                setFeedback(null);
              }}
              className={`py-2.5 flex items-center justify-center gap-2 transition-colors cursor-pointer ${
                activeTab === 'sync'
                  ? 'bg-white dark:bg-[#1A1D20] text-black dark:text-white underline decoration-2'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-yellow-100/60 dark:hover:bg-slate-800'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>Buka di HP / Laptop</span>
            </button>
          </div>

          {/* Feedback Toast Banner */}
          {feedback && (
            <div
              className={`px-4 py-2 text-xs font-bold border-b-2 border-black flex items-center justify-between ${
                feedback.type === 'success'
                  ? 'bg-emerald-200 text-emerald-950 dark:bg-emerald-900/60 dark:text-emerald-100'
                  : 'bg-red-200 text-red-950 dark:bg-red-900/60 dark:text-red-100'
              }`}
            >
              <span>{feedback.message}</span>
              <button
                onClick={() => setFeedback(null)}
                className="text-xs font-black underline ml-2 cursor-pointer"
              >
                ✕
              </button>
            </div>
          )}

          {/* Modal Body */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {/* TAB 1: DAFTAR ARTIKEL TERSIMPAN */}
            {activeTab === 'bookmarks' && (
              <div className="space-y-3">
                {bookmarkedArticles.length > 3 && (
                  <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-slate-500" />
                    <input
                      type="text"
                      value={filterQuery}
                      onChange={(e) => setFilterQuery(e.target.value)}
                      placeholder="Cari di antara skripsi tersimpan..."
                      className="w-full pl-8 pr-3 py-1.5 text-xs bg-white dark:bg-[#111317] border-2 border-black dark:border-white font-medium focus:outline-none shadow-[2px_2px_0px_0px_#000]"
                    />
                  </div>
                )}

                {displayArticles.length === 0 ? (
                  <div className="p-8 text-center bg-white dark:bg-[#111317] border-2 border-dashed border-black/40 dark:border-white/30 space-y-2">
                    <Bookmark className="w-8 h-8 mx-auto text-slate-400 stroke-[1.5]" />
                    <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      {filterQuery ? 'Tidak ada skripsi tersimpan yang cocok dengan kata kunci.' : 'Belum ada skripsi tersimpan.'}
                    </p>
                    <p className="text-[11px] text-slate-500 max-w-xs mx-auto">
                      Klik tombol <strong>&ldquo;SIMPAN&rdquo;</strong> atau ikon bintang pada artikel untuk menyimpannya di sini.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {displayArticles.map((art) => (
                      <div
                        key={art.ojs_id}
                        className="p-3 bg-white dark:bg-[#111317] border-2 border-black dark:border-white shadow-[3px_3px_0px_0px_#000] dark:shadow-[3px_3px_0px_0px_#FFF] space-y-2"
                      >
                        <h3 className="text-xs font-black line-clamp-2 leading-snug">
                          {art.title}
                        </h3>
                        <div className="text-[11px] text-slate-600 dark:text-slate-400 font-medium flex flex-wrap items-center gap-x-2">
                          {art.student && <span>Oleh: <strong>{art.student}</strong></span>}
                          {art.publication_date && <span>• {art.publication_date}</span>}
                        </div>

                        {/* Action buttons */}
                        <div className="flex items-center justify-between pt-1 border-t border-black/10 dark:border-white/10 text-xs">
                          <div className="flex items-center gap-1.5">
                            {art.original_pdf_url && (
                              <button
                                onClick={() => onReadPdf(art)}
                                className="px-2 py-1 text-[10px] font-black uppercase bg-[#86EFAC] text-black border border-black shadow-[1.5px_1.5px_0px_0px_#000] hover:bg-emerald-400 flex items-center gap-1 cursor-pointer active:translate-x-0.5 active:translate-y-0.5"
                              >
                                <FileText className="w-3 h-3" />
                                <span>Baca PDF</span>
                              </button>
                            )}
                            <CitationButton article={art} />
                          </div>

                          <button
                            onClick={() => onToggleBookmark(art.ojs_id)}
                            className="p-1 text-slate-400 hover:text-red-500 transition-colors cursor-pointer"
                            title="Hapus dari tersimpan"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: SINKRONISASI KE HP / LAPTOP */}
            {activeTab === 'sync' && (
              <div className="space-y-4">
                {/* Kode Rahasia Anda */}
                <div className="p-3.5 bg-white dark:bg-[#111317] border-2 border-black dark:border-white shadow-[3px_3px_0px_0px_#000] space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-600 dark:text-slate-400">
                      Kode Sinkronisasi Perangkat Ini
                    </span>
                    <span className="px-1.5 py-0.5 text-[9px] font-black uppercase bg-emerald-300 text-black border border-black">
                      Otomatis
                    </span>
                  </div>

                  <div className="p-3 bg-[#FEF08A] text-black border-2 border-black font-mono text-center text-sm sm:text-base font-black tracking-wider select-all shadow-[2px_2px_0px_0px_#000]">
                    {vault.syncCode || 'buat-bookmark-dulu'}
                  </div>

                  <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
                    Ketik 4 kata di atas pada HP atau browser lain untuk langsung membuka koleksi skripsi ini.
                  </p>

                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <button
                      type="button"
                      onClick={handleCopyCode}
                      className="py-1.5 px-2 bg-white dark:bg-[#202428] text-black dark:text-white border-2 border-black dark:border-white text-xs font-black uppercase shadow-[2px_2px_0px_0px_#000] flex items-center justify-center gap-1.5 hover:bg-yellow-100 cursor-pointer active:translate-x-0.5 active:translate-y-0.5"
                    >
                      {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedCode ? 'Tersalin ✓' : 'Salin Kode'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleCopyLink}
                      className="py-1.5 px-2 bg-[#86EFAC] text-black border-2 border-black text-xs font-black uppercase shadow-[2px_2px_0px_0px_#000] flex items-center justify-center gap-1.5 hover:bg-emerald-300 cursor-pointer active:translate-x-0.5 active:translate-y-0.5"
                    >
                      {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-800" /> : <Share2 className="w-3.5 h-3.5" />}
                      <span>{copiedLink ? 'Link Tersalin ✓' : 'Salin Link HP'}</span>
                    </button>
                  </div>

                  <p className="text-[10px] text-slate-500 dark:text-slate-400 italic pt-1">
                    ⚡ Koleksi di cloud otomatis diperbarui dan tetap aktif selama dibuka minimal sekali dalam 30 hari.
                  </p>
                </div>

                {/* Hubungkan dari Perangkat Lain */}
                <form
                  onSubmit={handleLinkDevice}
                  className="p-3.5 bg-white dark:bg-[#111317] border-2 border-black dark:border-white shadow-[3px_3px_0px_0px_#000] space-y-2.5"
                >
                  <div className="flex items-center gap-1.5">
                    <Smartphone className="w-3.5 h-3.5 text-slate-600" />
                    <span className="text-xs font-black uppercase">
                      Punya Kode dari Perangkat Lain?
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-600 dark:text-slate-400">
                    Masukkan 4 kata rahasia dari laptop/HP Anda untuk menyinkronkan koleksi ke sini:
                  </p>

                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={inputCode}
                      onChange={(e) => setInputCode(e.target.value)}
                      placeholder="contoh: kernel-router-matrix-sensor"
                      className="flex-1 px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-black border-2 border-black dark:border-white font-mono placeholder:text-slate-400 focus:outline-none shadow-[2px_2px_0px_0px_#000]"
                    />
                    <button
                      type="submit"
                      disabled={isLinking || !inputCode.trim()}
                      className="px-3 py-1.5 bg-[#93C5FD] text-black border-2 border-black text-xs font-black uppercase shadow-[2px_2px_0px_0px_#000] hover:bg-blue-400 disabled:opacity-50 cursor-pointer active:translate-x-0.5 active:translate-y-0.5 flex items-center gap-1"
                    >
                      {isLinking && <RefreshCw className="w-3 h-3 animate-spin" />}
                      <span>Hubungkan</span>
                    </button>
                  </div>
                </form>

                {/* Tombol Buat Kode Baru */}
                <div className="pt-2 text-center">
                  <button
                    type="button"
                    onClick={handleCreateNewCode}
                    className="text-[10px] font-bold text-slate-500 hover:text-black dark:hover:text-white underline cursor-pointer"
                  >
                    Ganti / Buat Kode Sinkronisasi Baru
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Modal Footer */}
          <div className="px-4 py-2.5 bg-slate-100 dark:bg-[#111317] border-t-2 border-black dark:border-white flex items-center justify-between text-[10px] text-slate-600 dark:text-slate-400 font-bold">
            <span>UNTAN RESEARCH HUB</span>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-pulse" />
              <span>Lokal-First (0ms Latency)</span>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
