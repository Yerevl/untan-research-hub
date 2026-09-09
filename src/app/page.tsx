'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Article } from '@/lib/types';
import { DosenItem } from '@/lib/dosen';
import { Navbar } from '@/components/Navbar';
import { ArticleCard } from '@/components/ArticleCard';
import { PdfViewerModal } from '@/components/PdfViewerModal';
import Link from 'next/link';
import {
  Search,
  BookOpen,
  Filter,
  Sparkles,
  RefreshCw,
  Users,
  GraduationCap,
  Calendar,
  X,
  FileText,
  SlidersHorizontal,
  Briefcase,
  Cpu,
  Network,
  Server,
  Layers,
  Lock,
} from 'lucide-react';

export default function HomePage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [issues, setIssues] = useState<string[]>([]);
  const [years, setYears] = useState<string[]>([]);
  const [dosenList, setDosenList] = useState<DosenItem[]>([]);
  const [keahlianList, setKeahlianList] = useState<string[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [supabaseConnected, setSupabaseConnected] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Filters State
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedIssue, setSelectedIssue] = useState<string>('all');
  const [selectedYear, setSelectedYear] = useState<string>('all');
  const [selectedDosen, setSelectedDosen] = useState<string>('all');
  const [selectedKeahlian, setSelectedKeahlian] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'title'>('newest');

  // Modals State
  const [activePdfArticle, setActivePdfArticle] = useState<Article | null>(null);

  // Fetch articles from API
  const fetchArticles = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchQuery.trim()) params.set('q', searchQuery.trim());
      if (selectedIssue !== 'all') params.set('issue', selectedIssue);
      if (selectedYear !== 'all') params.set('year', selectedYear);
      if (selectedDosen !== 'all') params.set('dosen', selectedDosen);
      if (selectedKeahlian !== 'all') params.set('keahlian', selectedKeahlian);
      params.set('sortBy', sortBy);

      const res = await fetch(`/api/articles?${params.toString()}`);
      const data = await res.json();

      if (data.success) {
        setArticles(data.articles || []);
        setIssues(data.issues || []);
        setYears(data.years || []);
        setDosenList(data.dosenList || []);
        setKeahlianList(data.keahlianList || []);
        setTotalCount(data.total || 0);
        setSupabaseConnected(data.supabaseConnected || false);
      }
    } catch (err) {
      console.error('Error loading articles:', err);
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery, selectedIssue, selectedYear, selectedDosen, selectedKeahlian, sortBy]);

  useEffect(() => {
    fetchArticles();
  }, [fetchArticles]);

  // Derived statistics
  const stats = useMemo(() => {
    const allAuthors = new Set<string>();
    articles.forEach((a) => {
      a.authors?.forEach((author) => allAuthors.add(author));
    });
    return {
      totalFound: articles.length,
      totalAuthors: allAuthors.size,
      totalIssues: issues.length || 1,
    };
  }, [articles, issues]);

  const hasActiveFilters =
    searchQuery !== '' ||
    selectedIssue !== 'all' ||
    selectedYear !== 'all' ||
    selectedDosen !== 'all' ||
    selectedKeahlian !== 'all';

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedIssue('all');
    setSelectedYear('all');
    setSelectedDosen('all');
    setSelectedKeahlian('all');
    setSortBy('newest');
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50/50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors">
      {/* Top Navigation */}
      <Navbar
        supabaseConnected={supabaseConnected}
        totalArticles={totalCount}
      />

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-indigo-900/10 via-white to-slate-50/50 dark:from-indigo-950/40 dark:via-slate-950 dark:to-slate-950 pt-12 pb-10 px-4 sm:px-6 lg:px-8 border-b border-slate-200/60 dark:border-slate-800/60">
        <div className="max-w-4xl mx-auto text-center space-y-4">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
            <GraduationCap className="w-3.5 h-3.5" />
            <span>Katalog Riset Rekayasa Sistem Komputer • Untan</span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-tight">
            Eksplorasi Publikasi Ilmiah{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-blue-600 dark:from-indigo-400 dark:to-blue-400">
              JCSKOMMIPA Untan
            </span>
          </h1>

          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed">
            Akses hasil riset mahasiswa dan dosen pembimbing Siskom Untan. Dilengkapi pencarian instan, filter
            dosen pembimbing, klasifikasi bidang keahlian, dan pembaca PDF online.
          </p>

          {/* Search Bar */}
          <div className="pt-2 max-w-2xl mx-auto">
            <div className="relative flex items-center shadow-lg shadow-indigo-500/5 rounded-2xl">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                <Search className="w-5 h-5" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari judul riset, nama mahasiswa, dosen pembimbing, atau topik..."
                className="w-full pl-11 pr-10 py-3.5 text-sm sm:text-base rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Quick Keahlian Chips */}
          <div className="pt-1 flex flex-wrap items-center justify-center gap-2">
            <button
              onClick={() => setSelectedKeahlian('all')}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                selectedKeahlian === 'all'
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-sm'
                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:border-slate-400'
              }`}
            >
              Semua Keahlian
            </button>
            <button
              onClick={() => setSelectedKeahlian('Automation & Embeded System (AES)')}
              className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                selectedKeahlian === 'Automation & Embeded System (AES)'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 hover:border-emerald-400'
              }`}
            >
              <Cpu className="w-3 h-3 mr-1" />
              <span>Automation & Embeded System (AES)</span>
            </button>
            <button
              onClick={() => setSelectedKeahlian('Network Intelligent Control (NIC)')}
              className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                selectedKeahlian === 'Network Intelligent Control (NIC)'
                  ? 'bg-sky-600 text-white shadow-sm'
                  : 'bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800 hover:border-sky-400'
              }`}
            >
              <Network className="w-3 h-3 mr-1" />
              <span>Network Intelligent Control (NIC)</span>
            </button>
            <button
              onClick={() => setSelectedKeahlian('Edge Computing')}
              className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                selectedKeahlian === 'Edge Computing'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 hover:border-purple-400'
              }`}
            >
              <Server className="w-3 h-3 mr-1" />
              <span>Edge Computing</span>
            </button>
          </div>

          {/* Stats Badges */}
          <div className="pt-2 flex flex-wrap items-center justify-center gap-4 sm:gap-8 text-xs sm:text-sm text-slate-600 dark:text-slate-400">
            <div className="flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span>
                <strong>{totalCount}</strong> Artikel Riset
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span>
                <strong>{issues.length || 1}</strong> Edisi Terbit
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <Briefcase className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>
                <strong>{dosenList.length}</strong> Dosen Siskom
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <Users className="w-4 h-4 text-teal-600 dark:text-teal-400" />
              <span>
                <strong>{stats.totalAuthors}</strong> Total Penulis
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content & Articles Catalog */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters & Sorting Bar */}
        <div className="mb-8 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          {/* Filter selectors */}
          <div className="flex flex-wrap items-center gap-2.5 text-xs sm:text-sm">
            <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 mr-1">
              <SlidersHorizontal className="w-4 h-4" />
              <span className="font-semibold">Filter:</span>
            </div>

            {/* Dosen Pembimbing Filter */}
            <select
              value={selectedDosen}
              onChange={(e) => setSelectedDosen(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 max-w-[200px] truncate"
            >
              <option value="all">Semua Dosen Pembimbing</option>
              {dosenList.map((d) => (
                <option key={d.cleanName} value={d.cleanName}>
                  {d.name}
                </option>
              ))}
            </select>

            {/* Keahlian Filter */}
            <select
              value={selectedKeahlian}
              onChange={(e) => setSelectedKeahlian(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 max-w-[220px] truncate"
            >
              <option value="all">Semua Bidang Keahlian</option>
              {keahlianList.map((k) => (
                <option key={k} value={k}>
                  {k}
                </option>
              ))}
            </select>

            {/* Issue Selector */}
            <select
              value={selectedIssue}
              onChange={(e) => setSelectedIssue(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 max-w-[180px] truncate"
            >
              <option value="all">Semua Edisi ({issues.length})</option>
              {issues.map((iss) => (
                <option key={iss} value={iss}>
                  {iss}
                </option>
              ))}
            </select>

            {/* Year Selector */}
            {years.length > 0 && (
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="all">Semua Tahun</option>
                {years.map((y) => (
                  <option key={y} value={y}>
                    Tahun {y}
                  </option>
                ))}
              </select>
            )}

            {/* Sort Selector */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'newest' | 'oldest' | 'title')}
              className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="newest">Terbaru</option>
              <option value="oldest">Terlama</option>
              <option value="title">Judul (A-Z)</option>
            </select>

            {/* Reset Button */}
            {hasActiveFilters && (
              <button
                onClick={handleResetFilters}
                className="px-2.5 py-1 text-xs text-rose-600 hover:text-rose-700 dark:text-rose-400 hover:underline flex items-center gap-1 font-medium"
              >
                <X className="w-3.5 h-3.5" />
                <span>Reset Filter</span>
              </button>
            )}
          </div>

          {/* Results Count */}
          <div className="flex items-center justify-between lg:justify-end gap-3 text-xs text-slate-500 dark:text-slate-400 shrink-0">
            <span>
              Menampilkan <strong>{articles.length}</strong> riset
            </span>
          </div>
        </div>

        {/* Loading State */}
        {isLoading ? (
          <div className="py-20 flex flex-col items-center justify-center space-y-3 text-slate-500">
            <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin" />
            <p className="text-sm font-medium">Memuat data riset...</p>
          </div>
        ) : articles.length === 0 ? (
          /* Empty State */
          <div className="py-16 px-4 text-center rounded-3xl border border-dashed border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900/50 max-w-lg mx-auto">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto mb-3">
              <BookOpen className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">
              {hasActiveFilters ? 'Tidak ada artikel yang cocok' : 'Belum ada data artikel'}
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mb-5">
              {hasActiveFilters
                ? 'Coba ganti filter dosen, bidang keahlian, atau kata kunci pencarian.'
                : 'Data riset belum tersedia. Silakan hubungi admin untuk melakukan sinkronisasi database.'}
            </p>
            {hasActiveFilters && (
              <button
                onClick={handleResetFilters}
                className="px-4 py-2 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors"
              >
                Reset Filter Pencarian
              </button>
            )}
          </div>
        ) : (
          /* Articles Grid */
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {articles.map((article) => (
              <ArticleCard
                key={article.ojs_id}
                article={article}
                onReadPdf={(art) => setActivePdfArticle(art)}
                onFilterDosen={(dosenName) => setSelectedDosen(dosenName)}
                onFilterKeahlian={(keahlianName) => setSelectedKeahlian(keahlianName)}
              />
            ))}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="mt-16 border-t border-slate-200 dark:border-slate-800/80 bg-white dark:bg-slate-950 py-8 px-4 sm:px-6 lg:px-8 text-xs text-slate-500 dark:text-slate-400">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
          <div>
            <p className="font-semibold text-slate-800 dark:text-slate-200">
              Untan Research Hub • JCSKOMMIPA
            </p>
            <p className="mt-0.5">
              Program Studi Rekayasa Sistem Komputer, Fakultas MIPA, Universitas Tanjungpura.
            </p>
          </div>
          <div className="flex items-center gap-4">
            <a
              href="https://siskom.untan.ac.id/dosen-staf"
              target="_blank"
              rel="noopener noreferrer"
              className="text-indigo-600 dark:text-indigo-400 hover:underline"
            >
              Direktori Dosen Siskom
            </a>
            <span className="text-slate-300 dark:text-slate-700">•</span>
            <a
              href="https://jurnal.untan.ac.id/index.php/jcskommipa"
              target="_blank"
              rel="noopener noreferrer"
              className="text-indigo-600 dark:text-indigo-400 hover:underline"
            >
              OJS Untan
            </a>
            <span className="text-slate-300 dark:text-slate-700">•</span>
            <Link
              href="/admin"
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 flex items-center gap-1 transition-colors"
              title="Khusus Pengelola / Admin Database"
            >
              <Lock className="w-3 h-3" />
              <span>Admin Sync</span>
            </Link>
          </div>
        </div>
      </footer>

      {/* In-App PDF Viewer Modal */}
      <PdfViewerModal
        article={activePdfArticle}
        onClose={() => setActivePdfArticle(null)}
      />
    </div>
  );
}
