'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Shield,
  RefreshCw,
  Database,
  Layers,
  Globe,
  Terminal,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  FileText,
  Lock,
  Unlock,
  Sparkles,
} from 'lucide-react';

export default function AdminPage() {
  // Passkey protection (default 'admin123' or whatever is set)
  const [passkey, setPasskey] = useState<string>('');
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [authError, setAuthError] = useState<string>('');

  // Scraper Form State
  const [syncMode, setSyncMode] = useState<'single' | 'archive'>('single');
  const [url, setUrl] = useState<string>('https://jurnal.untan.ac.id/index.php/jcskommipa/issue/view/2707');
  const [maxIssues, setMaxIssues] = useState<number>(3);
  const [downloadPdf, setDownloadPdf] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [successInfo, setSuccessInfo] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Stats State
  const [stats, setStats] = useState<{ total: number; issuesCount: number; supabaseConnected: boolean } | null>(null);

  // Load stats
  const loadStats = async () => {
    try {
      const res = await fetch('/api/articles');
      const data = await res.json();
      if (data.success) {
        setStats({
          total: data.total || 0,
          issuesCount: data.issues?.length || 0,
          supabaseConnected: data.supabaseConnected || false,
        });
      }
    } catch (err) {
      console.error('Error fetching admin stats:', err);
    }
  };

  useEffect(() => {
    // Check session storage for saved auth
    const saved = sessionStorage.getItem('untan_admin_auth');
    if (saved === 'true') {
      setIsAuthenticated(true);
      loadStats();
    }
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // Default passkey is 'admin123' (bisa diganti kapan saja)
    if (passkey === 'admin123' || passkey === 'siskomuntan') {
      setIsAuthenticated(true);
      sessionStorage.setItem('untan_admin_auth', 'true');
      setAuthError('');
      loadStats();
    } else {
      setAuthError('Kata sandi admin tidak sesuai. Coba gunakan: admin123');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    sessionStorage.removeItem('untan_admin_auth');
  };

  const handleStartSync = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccessInfo(null);
    setLogs([
      syncMode === 'archive'
        ? `[ADMIN] Memulai batch scraping ${maxIssues} edisi dari arsip jurnal Untan...`
        : `[ADMIN] Memulai scraping edisi: ${url}...`,
      'Menghubungi server OJS Untan dengan browser signature...',
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
          `Selesai! Berhasil memproses ${data.data.totalIssues} edisi dengan total ${data.data.totalArticles} artikel ke database!`
        );
      } else {
        setSuccessInfo(
          `Selesai! Edisi "${data.data.issueName}": ${data.data.syncedCount} dari ${data.data.totalFound} artikel berhasil masuk database!`
        );
      }

      loadStats();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
      setLogs((prev) => [...prev, `[ERROR] ${msg}`]);
    } finally {
      setIsLoading(false);
    }
  };

  // Login view if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl space-y-6">
          <div className="text-center space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-indigo-950 text-indigo-400 flex items-center justify-center mx-auto border border-indigo-800">
              <Lock className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-bold text-white">Panel Pengelola / Admin</h2>
            <p className="text-xs text-slate-400">
              Halaman ini dikhususkan untuk Anda selaku pemilik/pengelola database scraper.
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Kata Sandi Admin
              </label>
              <input
                type="password"
                required
                value={passkey}
                onChange={(e) => setPasskey(e.target.value)}
                placeholder="Masukkan kata sandi (default: admin123)"
                className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {authError && (
              <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{authError}</span>
              </div>
            )}

            <button
              type="submit"
              className="w-full py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-sm font-semibold shadow-lg shadow-indigo-600/20 transition-all"
            >
              Buka Panel Scraper
            </button>
          </form>

          <div className="text-center pt-2">
            <Link
              href="/"
              className="inline-flex items-center text-xs text-slate-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5 mr-1" />
              Kembali ke Katalog Publik
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      {/* Admin Top Header */}
      <header className="border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Link
              href="/"
              className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="Kembali ke Katalog Publik"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <div className="flex items-center space-x-2">
                <Shield className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <h1 className="font-bold text-base text-slate-900 dark:text-white">
                  Admin Scraper & Database Control
                </h1>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Pusat kendali scraping & sinkronisasi jurnal Untan ke database
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="hidden sm:inline-flex items-center px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              Lihat Katalog Teman-teman →
            </Link>
            <button
              onClick={handleLogout}
              className="text-xs text-slate-400 hover:text-rose-600 transition-colors"
            >
              Keluar
            </button>
          </div>
        </div>
      </header>

      {/* Main Admin Workspace */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Status & Overview Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center space-x-4">
            <div className="p-3 bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 rounded-xl">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Total Artikel Tersimpan</p>
              <h4 className="text-2xl font-extrabold text-slate-900 dark:text-white">
                {stats ? stats.total : '...'}
              </h4>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center space-x-4">
            <div className="p-3 bg-blue-50 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400 rounded-xl">
              <Layers className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Edisi Terindeks</p>
              <h4 className="text-2xl font-extrabold text-slate-900 dark:text-white">
                {stats ? stats.issuesCount : '...'}
              </h4>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center space-x-4">
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 rounded-xl">
              <Database className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Target Database</p>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5 mt-0.5">
                <span
                  className={`w-2 h-2 rounded-full ${
                    stats?.supabaseConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
                  }`}
                />
                {stats?.supabaseConnected ? 'Supabase Cloud' : 'Penyimpanan Lokal'}
              </h4>
            </div>
          </div>
        </div>

        {/* Scraper Action Form */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-sm">
          <div className="border-b border-slate-100 dark:border-slate-800 pb-5 mb-6">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              Jalankan Scraper Jurnal OJS Untan
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Data yang Anda scrape di sini akan langsung tersimpan di database dan otomatis muncul di website
              yang diakses oleh teman-teman Anda.
            </p>
          </div>

          <form onSubmit={handleStartSync} className="space-y-6">
            {/* Mode Switcher */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                Pilih Mode Scraping
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setSyncMode('single')}
                  className={`p-4 rounded-2xl border text-left transition-all flex items-start space-x-3 ${
                    syncMode === 'single'
                      ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/30 text-indigo-950 dark:text-indigo-200 shadow-sm'
                      : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <Globe className="w-5 h-5 text-indigo-600 mt-0.5 shrink-0" />
                  <div>
                    <h5 className="font-bold text-sm">Satu Edisi Tertentu</h5>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Scrape artikel dari URL satu issue spesifik (misal issue 2707 atau 3062).
                    </p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setSyncMode('archive')}
                  className={`p-4 rounded-2xl border text-left transition-all flex items-start space-x-3 ${
                    syncMode === 'archive'
                      ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/30 text-indigo-950 dark:text-indigo-200 shadow-sm'
                      : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <Layers className="w-5 h-5 text-indigo-600 mt-0.5 shrink-0" />
                  <div>
                    <h5 className="font-bold text-sm">Batch Scrape Arsip Jurnal</h5>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Scrape otomatis banyak edisi sekaligus dari halaman arsip Untan (~25 edisi).
                    </p>
                  </div>
                </button>
              </div>
            </div>

            {/* Inputs by mode */}
            {syncMode === 'single' ? (
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Tautan URL Issue OJS
                </label>
                <input
                  type="url"
                  required
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  disabled={isLoading}
                  placeholder="https://jurnal.untan.ac.id/index.php/jcskommipa/issue/view/..."
                  className="w-full px-4 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-60"
                />
                <div className="flex flex-wrap items-center gap-2 pt-1 text-xs text-slate-500">
                  <span className="font-medium">Preset Cepat:</span>
                  <button
                    type="button"
                    onClick={() => setUrl('https://jurnal.untan.ac.id/index.php/jcskommipa/issue/view/2707')}
                    className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300"
                  >
                    Issue 2707 (Vol 13 No 1 2025)
                  </button>
                  <button
                    type="button"
                    onClick={() => setUrl('https://jurnal.untan.ac.id/index.php/jcskommipa/issue/view/3062')}
                    className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300"
                  >
                    Issue 3062 (Terbaru)
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Berapa Banyak Edisi yang Ingin Di-scrape?
                </label>
                <select
                  value={maxIssues}
                  onChange={(e) => setMaxIssues(Number(e.target.value))}
                  disabled={isLoading}
                  className="w-full sm:max-w-xs px-3 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value={2}>2 Edisi (~20 artikel)</option>
                  <option value={5}>5 Edisi (~50 artikel)</option>
                  <option value={10}>10 Edisi (~100 artikel)</option>
                  <option value={25}>Seluruh 25 Edisi Arsip (~250 artikel)</option>
                </select>
                <p className="text-xs text-slate-400">
                  Catatan: Untuk scrape 25 edisi penuh tanpa khawatir batasan timeout koneksi browser, Anda juga
                  dapat menjalankan <code className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 font-mono text-indigo-500">npm run scrape:all</code> di terminal laptop Anda.
                </p>
              </div>
            )}

            {/* Checkbox download PDF */}
            <div className="flex items-center space-x-2 pt-1">
              <input
                type="checkbox"
                id="downloadPdfAdmin"
                checked={downloadPdf}
                onChange={(e) => setDownloadPdf(e.target.checked)}
                disabled={isLoading}
                className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
              />
              <label htmlFor="downloadPdfAdmin" className="text-xs text-slate-600 dark:text-slate-300 cursor-pointer">
                Unduh file fisik PDF dan upload ke Supabase Storage (atau direktori lokal)
              </label>
            </div>

            {/* Terminal Live Logs */}
            {logs.length > 0 && (
              <div className="rounded-2xl bg-slate-950 border border-slate-800 p-4 text-slate-300 font-mono text-xs overflow-hidden">
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800 text-slate-400 text-[11px]">
                  <div className="flex items-center gap-1.5">
                    <Terminal className="w-4 h-4 text-indigo-400" />
                    <span>Live Scraping Execution Console</span>
                  </div>
                  {isLoading && (
                    <span className="flex items-center gap-1.5 text-indigo-400">
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      Sedang memproses...
                    </span>
                  )}
                </div>
                <div className="max-h-56 overflow-y-auto space-y-1 scrollbar-thin">
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

            {/* Alerts */}
            {successInfo && (
              <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800/60 text-emerald-800 dark:text-emerald-200 text-xs space-y-1">
                <div className="flex items-center gap-2 font-bold text-sm">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Sinkronisasi Sukses!</span>
                </div>
                <p>{successInfo}</p>
              </div>
            )}

            {error && (
              <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800/60 text-rose-800 dark:text-rose-200 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <div>
                  <strong>Terjadi Kesalahan:</strong> {error}
                </div>
              </div>
            )}

            {/* Submit Button */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className="inline-flex items-center space-x-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 disabled:opacity-60 text-white text-sm font-semibold rounded-xl shadow-md shadow-indigo-600/20 transition-all"
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                <span>{isLoading ? 'Sedang Memproses...' : 'Jalankan Scraping Sekarang'}</span>
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}

