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
  Lock,
  Sparkles,
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

  // Modal State
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
    <div className="min-h-screen flex flex-col bg-[#FFFDF5] dark:bg-[#0D0F12] text-black dark:text-white transition-colors">
      {/* Top Navigation */}
      <Navbar supabaseConnected={supabaseConnected} totalArticles={totalCount} />

      {/* Hero Section - Neo Brutalism */}
      <section className="relative pt-12 pb-10 px-4 sm:px-6 lg:px-8 border-b-[3px] border-black dark:border-white">
        <div className="max-w-4xl mx-auto text-center space-y-5">
          {/* Sticker Tag */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1 text-xs font-black bg-[#FACC15] text-black border-2 border-black shadow-[3px_3px_0px_0px_#000] uppercase tracking-widest transform -rotate-1">
            <GraduationCap className="w-4 h-4 stroke-[2.5]" />
            <span>★ REKAYASA SISTEM KOMPUTER • UNTAN ★</span>
          </div>

          {/* Punchy Title */}
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-none uppercase">
            Eksplorasi Publikasi Riset{' '}
            <span className="inline-block mt-1 sm:mt-0 bg-[#A3E635] text-black px-3 py-1 border-[3px] border-black shadow-[5px_5px_0px_0px_#000] transform rotate-1">
              JCSKOMMIPA
            </span>
          </h1>

          <p className="text-sm sm:text-base font-medium text-slate-800 dark:text-slate-200 max-w-2xl mx-auto leading-relaxed">
            Koleksi riset Tugas Akhir & Skripsi mahasiswa Siskom Untan bersama dosen pembimbing.
            Cari topik, saring bidang keahlian laboratorium, dan baca dokumen PDF secara instan.
          </p>

          {/* Neo-brutalist Search Bar */}
          <div className="pt-2 max-w-2xl mx-auto">
            <div className="relative flex items-center bg-white dark:bg-[#181B20] border-[3px] border-black dark:border-white shadow-[6px_6px_0px_0px_#000] dark:shadow-[6px_6px_0px_0px_#fff]">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-black dark:text-white">
                <Search className="w-5 h-5 stroke-[2.5]" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari judul riset, nama mahasiswa, dosen, atau kata kunci..."
                className="w-full pl-12 pr-10 py-4 text-sm sm:text-base font-bold bg-transparent text-black dark:text-white placeholder-slate-400 focus:outline-none"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-black dark:text-white hover:opacity-70"
                >
                  <X className="w-5 h-5 stroke-[2.5]" />
                </button>
              )}
            </div>
          </div>

          {/* Quick Keahlian Chips - Tactile Neo-Brutalist Buttons */}
          <div className="pt-2 flex flex-wrap items-center justify-center gap-2 sm:gap-2.5">
            <button
              onClick={() => setSelectedKeahlian('all')}
              className={`px-3.5 py-1.5 text-xs font-black uppercase tracking-wide border-2 border-black dark:border-white transition-all ${
                selectedKeahlian === 'all'
                  ? 'bg-black text-white dark:bg-white dark:text-black shadow-[3px_3px_0px_0px_#000] dark:shadow-[3px_3px_0px_0px_#fff]'
                  : 'bg-white dark:bg-black text-black dark:text-white shadow-[2px_2px_0px_0px_#000] dark:shadow-[2px_2px_0px_0px_#fff] hover:-translate-x-0.5 hover:-translate-y-0.5'
              }`}
            >
              Semua Keahlian
            </button>

            <button
              onClick={() => setSelectedKeahlian('Automation & Embeded System (AES)')}
              className={`inline-flex items-center px-3.5 py-1.5 text-xs font-black uppercase tracking-wide border-2 border-black dark:border-white transition-all ${
                selectedKeahlian === 'Automation & Embeded System (AES)'
                  ? 'bg-[#A3E635] text-black shadow-[4px_4px_0px_0px_#000] -translate-x-0.5 -translate-y-0.5'
                  : 'bg-[#A3E635]/60 hover:bg-[#A3E635] text-black shadow-[2px_2px_0px_0px_#000] hover:-translate-x-0.5 hover:-translate-y-0.5'
              }`}
            >
              <Cpu className="w-3.5 h-3.5 mr-1.5 stroke-[2.5]" />
              <span>AES (Automation & Embedded)</span>
            </button>

            <button
              onClick={() => setSelectedKeahlian('Network Intelligent Control (NIC)')}
              className={`inline-flex items-center px-3.5 py-1.5 text-xs font-black uppercase tracking-wide border-2 border-black dark:border-white transition-all ${
                selectedKeahlian === 'Network Intelligent Control (NIC)'
                  ? 'bg-[#38BDF8] text-black shadow-[4px_4px_0px_0px_#000] -translate-x-0.5 -translate-y-0.5'
                  : 'bg-[#38BDF8]/60 hover:bg-[#38BDF8] text-black shadow-[2px_2px_0px_0px_#000] hover:-translate-x-0.5 hover:-translate-y-0.5'
              }`}
            >
              <Network className="w-3.5 h-3.5 mr-1.5 stroke-[2.5]" />
              <span>NIC (Network & Intelligent)</span>
            </button>

            <button
              onClick={() => setSelectedKeahlian('Edge Computing')}
              className={`inline-flex items-center px-3.5 py-1.5 text-xs font-black uppercase tracking-wide border-2 border-black dark:border-white transition-all ${
                selectedKeahlian === 'Edge Computing'
                  ? 'bg-[#C084FC] text-black shadow-[4px_4px_0px_0px_#000] -translate-x-0.5 -translate-y-0.5'
                  : 'bg-[#C084FC]/60 hover:bg-[#C084FC] text-black shadow-[2px_2px_0px_0px_#000] hover:-translate-x-0.5 hover:-translate-y-0.5'
              }`}
            >
              <Server className="w-3.5 h-3.5 mr-1.5 stroke-[2.5]" />
              <span>Edge Computing</span>
            </button>
          </div>

          {/* Stats Bar - Sticker Boxes */}
          <div className="pt-3 flex flex-wrap items-center justify-center gap-3 text-xs font-mono font-bold">
            <div className="px-3 py-1.5 bg-white dark:bg-[#181B20] border-2 border-black dark:border-white shadow-[2.5px_2.5px_0px_0px_#000] dark:shadow-[2.5px_2.5px_0px_0px_#fff] flex items-center gap-1.5">
              <FileText className="w-4 h-4 stroke-[2]" />
              <span>
                <strong>{totalCount}</strong> ARTIKEL
              </span>
            </div>
            <div className="px-3 py-1.5 bg-white dark:bg-[#181B20] border-2 border-black dark:border-white shadow-[2.5px_2.5px_0px_0px_#000] dark:shadow-[2.5px_2.5px_0px_0px_#fff] flex items-center gap-1.5">
              <Calendar className="w-4 h-4 stroke-[2]" />
              <span>
                <strong>{issues.length || 1}</strong> EDISI
              </span>
            </div>
            <div className="px-3 py-1.5 bg-white dark:bg-[#181B20] border-2 border-black dark:border-white shadow-[2.5px_2.5px_0px_0px_#000] dark:shadow-[2.5px_2.5px_0px_0px_#fff] flex items-center gap-1.5">
              <Briefcase className="w-4 h-4 stroke-[2]" />
              <span>
                <strong>{dosenList.length}</strong> DOSEN SISKOM
              </span>
            </div>
            <div className="px-3 py-1.5 bg-white dark:bg-[#181B20] border-2 border-black dark:border-white shadow-[2.5px_2.5px_0px_0px_#000] dark:shadow-[2.5px_2.5px_0px_0px_#fff] flex items-center gap-1.5">
              <Users className="w-4 h-4 stroke-[2]" />
              <span>
                <strong>{stats.totalAuthors}</strong> PENULIS
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content & Articles Catalog */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters & Sorting Bar - Neo-Brutalist Box */}
        <div className="mb-8 p-5 bg-white dark:bg-[#181B20] border-[2.5px] border-black dark:border-white shadow-[5px_5px_0px_0px_#000] dark:shadow-[5px_5px_0px_0px_#fff] flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          {/* Selectors */}
          <div className="flex flex-wrap items-center gap-2.5 text-xs font-bold">
            <div className="flex items-center gap-1.5 text-black dark:text-white mr-1 uppercase font-black">
              <SlidersHorizontal className="w-4 h-4 stroke-[2.5]" />
              <span>Filter:</span>
            </div>

            {/* Dosen Pembimbing Filter */}
            <select
              value={selectedDosen}
              onChange={(e) => setSelectedDosen(e.target.value)}
              className="px-3 py-2 bg-white dark:bg-black text-black dark:text-white border-2 border-black dark:border-white shadow-[2px_2px_0px_0px_#000] dark:shadow-[2px_2px_0px_0px_#fff] font-bold text-xs focus:outline-none max-w-[200px] truncate"
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

          {/* Results Count */}
          <div className="flex items-center justify-between lg:justify-end gap-3 text-xs font-mono font-bold text-black dark:text-white shrink-0">
            <span className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 border border-black dark:border-white">
              HASIL: <strong>{articles.length}</strong> RISET
            </span>
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
              Program Studi Rekayasa Sistem Komputer, Fakultas MIPA, Universitas Tanjungpura.
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
