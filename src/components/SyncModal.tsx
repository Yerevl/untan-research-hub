'use client';

import React, { useState } from 'react';
import { X, RefreshCw, CheckCircle2, AlertCircle, Sparkles, Terminal, Globe, Layers, BookOpen } from 'lucide-react';

interface SyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSyncComplete: () => void;
}

export const SyncModal: React.FC<SyncModalProps> = ({ isOpen, onClose, onSyncComplete }) => {
  const [syncMode, setSyncMode] = useState<'single' | 'archive'>('single');
  const [url, setUrl] = useState('https://jurnal.untan.ac.id/index.php/jcskommipa/issue/view/2707');
  const [maxIssues, setMaxIssues] = useState<number>(3);
  const [downloadPdf, setDownloadPdf] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [successInfo, setSuccessInfo] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleStartSync = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccessInfo(null);
    setLogs([
      syncMode === 'archive'
        ? `Memulai sinkronisasi ${maxIssues} edisi dari arsip jurnal Untan...`
        : `Memulai sinkronisasi dari: ${url}...`,
      'Menghubungi server OJS Untan...',
    ]);

    try {
      const res = await fetch('/api/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: syncMode,
          url: syncMode === 'single' ? url.trim() : undefined,
          maxIssues: syncMode === 'archive' ? maxIssues : undefined,
          downloadPdf,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Gagal melakukan sinkronisasi issue.');
      }

      if (data.logs && data.logs.length > 0) {
        setLogs(data.logs);
      }

      if (syncMode === 'archive') {
        setSuccessInfo(
          `Berhasil memproses ${data.data.totalIssues} edisi dengan total ${data.data.totalArticles} artikel!`
        );
      } else {
        setSuccessInfo(
          `Edisi "${data.data.issueName}": ${data.data.syncedCount} dari ${data.data.totalFound} artikel berhasil diimpor!`
        );
      }

      onSyncComplete();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
      setLogs((prev) => [...prev, `[ERROR] ${msg}`]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 rounded-lg">
              <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white">Sinkronisasi Jurnal Untan</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Scrape metadata riset & download PDF langsung dari server OJS Untan
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isLoading}
            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleStartSync} className="p-6 space-y-4">
          {/* Mode Switcher */}
          <div className="flex rounded-xl bg-slate-100 dark:bg-slate-800/80 p-1">
            <button
              type="button"
              onClick={() => setSyncMode('single')}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                syncMode === 'single'
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <Globe className="w-3.5 h-3.5" />
              <span>Satu Edisi Tertentu</span>
            </button>
            <button
              type="button"
              onClick={() => setSyncMode('archive')}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                syncMode === 'archive'
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Seluruh Arsip Jurnal (Batch)</span>
            </button>
          </div>

          {syncMode === 'single' ? (
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                URL Issue OJS Jurnal
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Globe className="w-4 h-4" />
                </div>
                <input
                  type="url"
                  required
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  disabled={isLoading}
                  placeholder="https://jurnal.untan.ac.id/index.php/jcskommipa/issue/view/..."
                  className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all disabled:opacity-60"
                />
              </div>

              {/* Preset Buttons */}
              <div className="flex flex-wrap items-center gap-1.5 mt-2 text-xs text-slate-500">
                <span className="font-medium text-slate-400">Contoh Edisi:</span>
                <button
                  type="button"
                  onClick={() => setUrl('https://jurnal.untan.ac.id/index.php/jcskommipa/issue/view/2707')}
                  className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 transition-colors"
                >
                  Issue 2707 (Vol 13 No 1 2025)
                </button>
                <button
                  type="button"
                  onClick={() => setUrl('https://jurnal.untan.ac.id/index.php/jcskommipa/issue/view/3062')}
                  className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 transition-colors"
                >
                  Issue 3062 (Terbaru)
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="p-3 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200/60 dark:border-indigo-800/60 text-xs text-indigo-900 dark:text-indigo-200 leading-relaxed">
                Di halaman arsip Untan terdapat <strong>25 edisi terbitan</strong> (~250 artikel riset). Sistem akan
                mengambil metadata dan mengunduh seluruh PDF-nya secara berurutan.
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                  Jumlah Edisi yang Ingin Di-scrape Sekaligus
                </label>
                <select
                  value={maxIssues}
                  onChange={(e) => setMaxIssues(Number(e.target.value))}
                  disabled={isLoading}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value={2}>2 Edisi Terbaru (~20 artikel)</option>
                  <option value={5}>5 Edisi Terbaru (~50 artikel)</option>
                  <option value={10}>10 Edisi (~100 artikel)</option>
                  <option value={25}>Seluruh 25 Edisi Arsip (~250 artikel)</option>
                </select>
                <p className="mt-1 text-[11px] text-slate-400">
                  Tip: Untuk scrape seluruh 25 edisi tanpa batasan timeout browser, Anda juga bisa jalankan{' '}
                  <code className="bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded">npm run scrape:all</code> di terminal.
                </p>
              </div>
            </div>
          )}

          {/* Download PDF Option */}
          <div className="flex items-center space-x-2 pt-1">
            <input
              type="checkbox"
              id="downloadPdf"
              checked={downloadPdf}
              onChange={(e) => setDownloadPdf(e.target.checked)}
              disabled={isLoading}
              className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
            />
            <label htmlFor="downloadPdf" className="text-xs text-slate-600 dark:text-slate-300 cursor-pointer">
              Unduh file PDF dan simpan ke Supabase Storage (atau lokal)
            </label>
          </div>

          {/* Log Window */}
          {logs.length > 0 && (
            <div className="mt-3 rounded-xl bg-slate-950 border border-slate-800 p-3 text-slate-300 font-mono text-xs overflow-hidden">
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800 text-slate-400 text-[11px]">
                <div className="flex items-center gap-1.5">
                  <Terminal className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Proses Scraper Log</span>
                </div>
                {isLoading && (
                  <span className="flex items-center gap-1 text-indigo-400">
                    <RefreshCw className="w-3 h-3 animate-spin" />
                    Sedang Mengunduh...
                  </span>
                )}
              </div>
              <div className="max-h-40 overflow-y-auto space-y-1 scrollbar-thin">
                {logs.map((log, idx) => (
                  <div
                    key={idx}
                    className={`leading-relaxed ${
                      log.startsWith('✓')
                        ? 'text-emerald-400'
                        : log.startsWith('[ERROR]')
                        ? 'text-rose-400'
                        : log.includes('===')
                        ? 'text-indigo-400 font-bold'
                        : 'text-slate-300'
                    }`}
                  >
                    {log}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Success Summary */}
          {successInfo && (
            <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800/60 text-emerald-800 dark:text-emerald-200 text-xs space-y-1">
              <div className="flex items-center gap-2 font-bold text-sm">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Sinkronisasi Berhasil!</span>
              </div>
              <p>{successInfo}</p>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800/60 text-rose-800 dark:text-rose-200 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <strong>Terjadi Kendala:</strong> {error}
              </div>
            </div>
          )}

          {/* Footer Submit Button */}
          <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
            >
              Tutup
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="inline-flex items-center space-x-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 disabled:opacity-60 text-white text-sm font-medium rounded-xl shadow-sm transition-all"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              <span>{isLoading ? 'Sedang Sinkronisasi...' : 'Mulai Sinkronisasi'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
