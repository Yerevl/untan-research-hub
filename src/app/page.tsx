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
  GraduationCap,
  X,
  SlidersHorizontal,
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
  const [selectedProdi, setSelectedProdi] = useState<string>('all');
  const [selectedIssue, setSelectedIssue] = useState<string>('all');
  const [selectedYear, setSelectedYear] = useState<string>('all');
  const [selectedDosen, setSelectedDosen] = useState<string>('all');
  const [selectedKeahlian, setSelectedKeahlian] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'title'>('newest');

  // Modal State
  const [activePdfArticle, setActivePdfArticle] = useState<Article | null>(null);

  // Fetch articles from API
  const fetchArticles = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchQuery.trim()) params.set('q', searchQuery.trim());
      if (selectedProdi !== 'all') params.set('prodi', selectedProdi);
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
  }, [searchQuery, selectedProdi, selectedIssue, selectedYear, selectedDosen, selectedKeahlian, sortBy]);

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
    selectedProdi !== 'all' ||
    selectedIssue !== 'all' ||
    selectedYear !== 'all' ||
    selectedDosen !== 'all' ||
    selectedKeahlian !== 'all';

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedProdi('all');
    setSelectedIssue('all');
    setSelectedYear('all');
    setSelectedDosen('all');
    setSelectedKeahlian('all');
    setSortBy('newest');
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FFFDF5] dark:bg-[#0D0F12] text-black dark:text-white transition-colors">
      {/* Top Navigation */}
      <Navbar supabaseConnected={supabaseConnected} totalArticles={totalCount} />

      {/* Hero Section - Neo Brutalism */}
      <section className="relative pt-10 pb-8 px-4 sm:px-6 lg:px-8 border-b-[3px] border-black dark:border-white">
        <div className="max-w-4xl mx-auto text-center space-y-4">
          {/* Sticker Tag */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1 text-xs font-black bg-[#FACC15] text-black border-2 border-black shadow-[3px_3px_0px_0px_#000] uppercase tracking-widest transform -rotate-1">
            <GraduationCap className="w-4 h-4 stroke-[2.5]" />
            <span>★ SISKOM &amp; SISFO • FMIPA UNTAN ★</span>
          </div>

          {/* Punchy Title */}
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-none uppercase">
            Eksplorasi Publikasi Riset
          </h1>

          <p className="text-sm sm:text-base font-medium text-slate-800 dark:text-slate-200 max-w-2xl mx-auto leading-relaxed">
            Koleksi riset Tugas Akhir &amp; Skripsi mahasiswa Rekayasa Sistem Komputer &amp; Sistem Informasi Untan bersama dosen pembimbing.
            Cari topik, saring bidang keahlian laboratorium, dan baca naskah PDF secara instan.
          </p>

          {/* Subtle Informational Stats Readout (Not Button-like) */}
          <p className="text-xs font-mono font-medium text-slate-600 dark:text-slate-400">
            Mengindeks <strong className="font-black text-black dark:text-white">{totalCount}</strong> artikel riset •{' '}
            <strong className="font-black text-black dark:text-white">{dosenList.length}</strong> dosen pembimbing •{' '}
            <strong className="font-black text-black dark:text-white">{stats.totalAuthors}</strong> penulis •{' '}
            <strong className="font-black text-black dark:text-white">{issues.length || 1}</strong> edisi publikasi
          </p>
        </div>
      </section>

      {/* Main Content & Articles Catalog */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Unified Search & Filters Control Panel - Neo-Brutalist Box */}
        <div className="mb-8 p-4 sm:p-5 bg-white dark:bg-[#181B20] border-[3px] border-black dark:border-white shadow-[6px_6px_0px_0px_#000] dark:shadow-[6px_6px_0px_0px_#fff] space-y-4">
          {/* Search Bar */}
          <div className="relative flex items-center bg-[#FFFDF5] dark:bg-[#0D0F12] border-2 border-black dark:border-white shadow-[3px_3px_0px_0px_#000] dark:shadow-[3px_3px_0px_0px_#fff]">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-black dark:text-white">
              <Search className="w-5 h-5 stroke-[2.5]" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari judul riset, nama mahasiswa, dosen pembimbing, atau topik..."
              className="w-full pl-12 pr-10 py-3.5 text-sm sm:text-base font-bold bg-transparent text-black dark:text-white placeholder-slate-400 focus:outline-none"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute inset-y-0 right-0 pr-4 flex items-center text-black dark:text-white hover:opacity-70"
                title="Hapus pencarian"
              >
                <X className="w-5 h-5 stroke-[2.5]" />
              </button>
            )}
          </div>

          {/* Filters & Results Counter Row */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 pt-3 border-t-2 border-dashed border-black/20 dark:border-white/20">
            {/* Filter Dropdowns */}
            <div className="flex flex-wrap items-center gap-2.5 text-xs font-bold">
              <div className="flex items-center gap-1.5 text-black dark:text-white mr-1 uppercase font-black">
                <SlidersHorizontal className="w-4 h-4 stroke-[2.5]" />
                <span>Filter:</span>
              </div>

              {/* Prodi Filter */}
              <select
                value={selectedProdi}
                onChange={(e) => setSelectedProdi(e.target.value)}
                className="px-3 py-2 bg-white dark:bg-black text-black dark:text-white border-2 border-black dark:border-white shadow-[2px_2px_0px_0px_#000] dark:shadow-[2px_2px_0px_0px_#fff] font-bold text-xs focus:outline-none"
              >
                <option value="all">Semua Prodi</option>
                <option value="SISKOM">Siskom</option>
                <option value="SISFO">Sisfo</option>
              </select>

              {/* Dosen Pembimbing Filter */}
              <select
                value={selectedDosen}
                onChange={(e) => setSelectedDosen(e.target.value)}
                className="px-3 py-2 bg-white dark:bg-black text-black dark:text-white border-2 border-black dark:border-white shadow-[2px_2px_0px_0px_#000] dark:shadow-[2px_2px_0px_0px_#fff] font-bold text-xs focus:outline-none max-w-[210px] truncate"
              >
                <option value="all">Semua Dosen Pembimbing</option>
                {dosenList.map((d) => (
                  <option key={d.cleanName} value={d.cleanName}>
                    {d.name} [{d.prodi}]
                  </option>
                ))}
              </select>

              {/* Keahlian Filter */}
              <select
                value={selectedKeahlian}
                onChange={(e) => setSelectedKeahlian(e.target.value)}
                className="px-3 py-2 bg-white dark:bg-black text-black dark:text-white border-2 border-black dark:border-white shadow-[2px_2px_0px_0px_#000] dark:shadow-[2px_2px_0px_0px_#fff] font-bold text-xs focus:outline-none max-w-[220px] truncate"
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
                className="px-3 py-2 bg-white dark:bg-black text-black dark:text-white border-2 border-black dark:border-white shadow-[2px_2px_0px_0px_#000] dark:shadow-[2px_2px_0px_0px_#fff] font-bold text-xs focus:outline-none max-w-[180px] truncate"
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
                  className="px-3 py-2 bg-white dark:bg-black text-black dark:text-white border-2 border-black dark:border-white shadow-[2px_2px_0px_0px_#000] dark:shadow-[2px_2px_0px_0px_#fff] font-bold text-xs focus:outline-none"
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
                className="px-3 py-2 bg-white dark:bg-black text-black dark:text-white border-2 border-black dark:border-white shadow-[2px_2px_0px_0px_#000] dark:shadow-[2px_2px_0px_0px_#fff] font-bold text-xs focus:outline-none"
              >
                <option value="newest">Terbaru</option>
                <option value="oldest">Terlama</option>
                <option value="title">Judul (A-Z)</option>
              </select>

              {/* Reset Button */}
              {hasActiveFilters && (
                <button
                  onClick={handleResetFilters}
                  className="px-3 py-1.5 bg-[#FECDD3] text-black border-2 border-black shadow-[2px_2px_0px_0px_#000] hover:bg-[#FDA4AF] active:translate-x-0.5 active:translate-y-0.5 transition-all flex items-center gap-1 font-black uppercase text-xs"
                >
                  <X className="w-3.5 h-3.5 stroke-[3]" />
                  <span>Reset</span>
                </button>
              )}
            </div>

            {/* Results Count Badge */}
            <div className="flex items-center gap-2 text-xs font-mono font-bold shrink-0 self-start lg:self-center">
              <span className="px-3 py-1.5 bg-[#FACC15] text-black border-2 border-black shadow-[2px_2px_0px_0px_#000] font-black uppercase tracking-wide">
                HASIL: {articles.length} / {totalCount} RISET
              </span>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {isLoading ? (
          <div className="py-20 flex flex-col items-center justify-center space-y-3">
            <div className="w-10 h-10 border-4 border-black border-t-[#FACC15] rounded-full animate-spin" />
            <p className="text-sm font-black uppercase tracking-wider">Memuat data riset...</p>
          </div>
        ) : articles.length === 0 ? (
          /* Empty State */
          <div className="py-16 px-6 text-center border-[3px] border-black dark:border-white bg-white dark:bg-[#181B20] shadow-[6px_6px_0px_0px_#000] dark:shadow-[6px_6px_0px_0px_#fff] max-w-lg mx-auto space-y-3">
            <div className="w-14 h-14 bg-[#FEF08A] text-black border-2 border-black shadow-[3px_3px_0px_0px_#000] flex items-center justify-center mx-auto">
              <BookOpen className="w-7 h-7 stroke-[2.5]" />
            </div>
            <h3 className="text-lg font-black uppercase text-black dark:text-white">
              {hasActiveFilters ? 'Tidak ada artikel yang cocok' : 'Belum ada data artikel'}
            </h3>
            <p className="text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-300">
              {hasActiveFilters
                ? 'Coba ganti kata kunci pencarian atau reset filter yang aktif.'
                : 'Data riset belum tersedia di database.'}
            </p>
            {hasActiveFilters && (
              <button
                onClick={handleResetFilters}
                className="mt-3 px-4 py-2 text-xs font-black uppercase bg-[#A3E635] text-black border-2 border-black shadow-[3px_3px_0px_0px_#000] active:translate-x-0.5 active:translate-y-0.5"
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
                onFilterProdi={(prodiName) => setSelectedProdi(prodiName)}
              />
            ))}
          </div>
        )}
      </main>

      {/* Footer - Neo-Brutalist */}
      <footer className="mt-20 border-t-[3px] border-black dark:border-white bg-white dark:bg-[#0D0F12] py-8 px-4 sm:px-6 lg:px-8 text-xs font-bold text-black dark:text-white">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
          <div>
            <p className="font-black text-sm uppercase tracking-wide">
              UNTAN RESEARCH HUB • JCSKOMMIPA
            </p>
            <p className="mt-1 text-slate-600 dark:text-slate-400 font-medium">
              Program Studi Rekayasa Sistem Komputer &amp; Sistem Informasi, Fakultas MIPA, Universitas Tanjungpura.
            </p>
          </div>
          <div className="flex items-center gap-3 font-black">
            <a
              href="https://siskom.untan.ac.id/dosen-staf"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:underline"
            >
              DOSEN SISKOM
            </a>
            <span>•</span>
            <a
              href="https://sisfo.untan.ac.id/dosen-staff"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:underline"
            >
              DOSEN SISFO
            </a>
            <span>•</span>
            <a
              href="https://jurnal.untan.ac.id/index.php/jcskommipa"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:underline"
            >
              OJS UNTAN
            </a>
            <span>•</span>
            <Link
              href="/admin"
              className="inline-flex items-center gap-1 px-2 py-0.5 bg-[#FEF08A] text-black border border-black shadow-[1.5px_1.5px_0px_0px_#000] hover:-translate-x-0.5 hover:-translate-y-0.5 active:shadow-none transition-all"
              title="Panel Pengelola Database"
            >
              <Lock className="w-3 h-3 stroke-[2.5]" />
              <span>ADMIN</span>
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
