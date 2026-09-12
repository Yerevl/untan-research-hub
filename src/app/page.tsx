'use client';

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Article } from '@/lib/types';
import { DosenItem } from '@/lib/dosen';
import { IdleBackground } from '@/components/IdleBackground';
import { ArticleCard } from '@/components/ArticleCard';
import { PdfViewerModal } from '@/components/PdfViewerModal';
import { ThemeToggle } from '@/components/ThemeToggle';
import Link from 'next/link';
import { motion, AnimatePresence } from 'motion/react';
import {
  Search,
  BookOpen,
  X,
  SlidersHorizontal,
  Lock,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ArrowUpDown,
  Layers,
  ArrowUp,
  Database,
  RotateCcw,
  Bookmark,
} from 'lucide-react';
import {
  LocalVault,
  getLocalVault,
  saveLocalVault,
  toggleBookmarkLocal,
} from '@/lib/vault';
import { VaultTrigger } from '@/components/VaultTrigger';
import { VaultModal } from '@/components/VaultModal';
import { SecretKeyAnnouncementModal } from '@/components/SecretKeyAnnouncementModal';
import { lockTouchScrollOnPointerDown } from '@/lib/touchLock';

const PAGE_SIZE = 10;

interface CachedPageData {
  articles: Article[];
  issues: string[];
  years: string[];
  dosenList: DosenItem[];
  keahlianList: string[];
  total: number;
  filteredCount: number;
  totalPages: number;
  supabaseConnected: boolean;
}

function getPaginationItems(current: number, total: number): (number | string)[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }
  if (current <= 4) {
    return [1, 2, 3, 4, 5, '...', total];
  }
  if (current >= total - 3) {
    return [1, '...', total - 4, total - 3, total - 2, total - 1, total];
  }
  return [1, '...', current - 1, current, current + 1, '...', total];
}

export default function HomePage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [issues, setIssues] = useState<string[]>([]);
  const [years, setYears] = useState<string[]>([]);
  const [dosenList, setDosenList] = useState<DosenItem[]>([]);
  const [keahlianList, setKeahlianList] = useState<string[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [filteredCount, setFilteredCount] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [showAll, setShowAll] = useState<boolean>(false);
  const [supabaseConnected, setSupabaseConnected] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Search input state with debouncing
  const [searchInput, setSearchInput] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Filters State
  const [selectedProdi, setSelectedProdi] = useState<string>('all');
  const [selectedIssue, setSelectedIssue] = useState<string>('all');
  const [selectedYear, setSelectedYear] = useState<string>('all');
  const [selectedDosen, setSelectedDosen] = useState<string>('all');
  const [selectedKeahlian, setSelectedKeahlian] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'title'>('newest');

  // Modal State
  const [activePdfArticle, setActivePdfArticle] = useState<Article | null>(null);

  // Vault & Bookmark State
  const [vault, setVault] = useState<LocalVault>({
    secretKey: null,
    isPrimary: false,
    deviceId: 'client',
    bookmarks: [],
  });
  const [isVaultOpen, setIsVaultOpen] = useState<boolean>(false);
  const [newSecretKeyAnnounce, setNewSecretKeyAnnounce] = useState<string | null>(null);
  const [isBookmarkFilterActive, setIsBookmarkFilterActive] = useState<boolean>(false);

  // Sync vault on client mount and listen for storage/custom events
  useEffect(() => {
    const v = getLocalVault();
    setVault(v);

    // If local vault has secret key, auto-sync to cloud on load
    if (v.secretKey) {
      fetch('/api/vault', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'sync',
          secretKey: v.secretKey,
          deviceId: v.deviceId,
          bookmarks: v.bookmarks,
        }),
      })
        .then((r) => r.json())
        .then((data) => {
          if (data.success && data.vault) {
            const updated: LocalVault = {
              ...v,
              bookmarks: data.vault.bookmarks,
              isPrimary: data.vault.isPrimary,
              lastSyncedAt: new Date().toLocaleTimeString('id-ID'),
            };
            saveLocalVault(updated);
            setVault(updated);
          }
        })
        .catch((e) => console.warn('Auto-sync deferred:', e));
    }

    const handleVaultUpdate = (e: any) => {
      if (e.detail) {
        setVault(e.detail);
      } else {
        setVault(getLocalVault());
      }
    };

    window.addEventListener('untan_vault_updated', handleVaultUpdate);
    window.addEventListener('storage', handleVaultUpdate);
    return () => {
      window.removeEventListener('untan_vault_updated', handleVaultUpdate);
      window.removeEventListener('storage', handleVaultUpdate);
    };
  }, []);

  // Toggle bookmark handler (instant local save, background cloud sync, first-time key popup)
  const handleToggleBookmark = useCallback(async (article: Article) => {
    const res = toggleBookmarkLocal(article.ojs_id);
    setVault(res.vault);

    // Show celebration announcement modal on first bookmark or if user hasn't seen it yet
    if ((res.isFirstEver && res.generatedKey) || (!res.vault.hasSeenWelcome && res.vault.secretKey)) {
      setNewSecretKeyAnnounce(res.vault.secretKey);
      const updatedVault: LocalVault = { ...res.vault, hasSeenWelcome: true };
      saveLocalVault(updatedVault);
      setVault(updatedVault);
    }

    if (res.vault.secretKey) {
      try {
        const syncRes = await fetch('/api/vault', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'sync',
            secretKey: res.vault.secretKey,
            deviceId: res.vault.deviceId,
            bookmarks: res.vault.bookmarks,
          }),
        });
        const syncData = await syncRes.json();
        if (syncData.success && syncData.vault) {
          const updated: LocalVault = {
            ...res.vault,
            bookmarks: syncData.vault.bookmarks,
            isPrimary: syncData.vault.isPrimary,
            lastSyncedAt: new Date().toLocaleTimeString('id-ID'),
          };
          saveLocalVault(updated);
          setVault(updated);
        }
      } catch (err) {
        console.warn('Background sync deferred:', err);
      }
    }
  }, []);

  // In-memory page cache to retain visited pages and avoid redundant network calls
  const pageCacheRef = useRef<Map<string, CachedPageData>>(new Map());

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchQuery(searchInput);
    }, 250);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // Generate cache key based on current filters and page/all mode
  const getCacheKey = useCallback(
    (page: number, allMode: boolean) => {
      return [
        searchQuery.trim().toLowerCase(),
        selectedProdi,
        selectedIssue,
        selectedYear,
        selectedDosen,
        selectedKeahlian,
        sortBy,
        `p:${page}`,
        `all:${allMode}`,
      ].join('|');
    },
    [searchQuery, selectedProdi, selectedIssue, selectedYear, selectedDosen, selectedKeahlian, sortBy]
  );

  // Fetch or retrieve from cache
  const loadData = useCallback(
    async (pageToLoad: number, allMode: boolean) => {
      const cacheKey = getCacheKey(pageToLoad, allMode);

      // Check client-side memory cache first
      if (pageCacheRef.current.has(cacheKey)) {
        const cached = pageCacheRef.current.get(cacheKey)!;
        setArticles(cached.articles);
        setIssues(cached.issues);
        setYears(cached.years);
        setDosenList(cached.dosenList);
        setKeahlianList(cached.keahlianList);
        setTotalCount(cached.total);
        setFilteredCount(cached.filteredCount);
        setTotalPages(cached.totalPages);
        setSupabaseConnected(cached.supabaseConnected);
        setCurrentPage(pageToLoad);
        setShowAll(allMode);
        setIsLoading(false);
        return;
      }

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

        if (allMode) {
          params.set('all', 'true');
        } else {
          params.set('page', pageToLoad.toString());
          params.set('limit', PAGE_SIZE.toString());
        }

        const res = await fetch(`/api/articles?${params.toString()}`);
        const data = await res.json();

        if (data.success) {
          const cacheData: CachedPageData = {
            articles: data.articles || [],
            issues: data.issues || [],
            years: data.years || [],
            dosenList: data.dosenList || [],
            keahlianList: data.keahlianList || [],
            total: data.total || 0,
            filteredCount: data.filteredCount || 0,
            totalPages: data.totalPages || 1,
            supabaseConnected: data.supabaseConnected || false,
          };

          // Save to in-memory cache
          pageCacheRef.current.set(cacheKey, cacheData);

          setArticles(cacheData.articles);
          setIssues(cacheData.issues);
          setYears(cacheData.years);
          setDosenList(cacheData.dosenList);
          setKeahlianList(cacheData.keahlianList);
          setTotalCount(cacheData.total);
          setFilteredCount(cacheData.filteredCount);
          setTotalPages(cacheData.totalPages);
          setSupabaseConnected(cacheData.supabaseConnected);
          setCurrentPage(pageToLoad);
          setShowAll(allMode);
        }
      } catch (err) {
        console.error('Error loading articles:', err);
      } finally {
        setIsLoading(false);
      }
    },
    [getCacheKey, searchQuery, selectedProdi, selectedIssue, selectedYear, selectedDosen, selectedKeahlian, sortBy]
  );

  // Trigger data load when filters change (resets to page 1 in paginated mode)
  useEffect(() => {
    loadData(1, false);
  }, [searchQuery, selectedProdi, selectedIssue, selectedYear, selectedDosen, selectedKeahlian, sortBy, loadData]);

  // Page navigation handlers
  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > totalPages || newPage === currentPage) return;
    loadData(newPage, false);
    document.getElementById('catalog-top')?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleToggleShowAll = () => {
    if (showAll) {
      loadData(1, false);
    } else {
      loadData(1, true);
    }
    document.getElementById('catalog-top')?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleResetFilters = () => {
    setSearchInput('');
    setSearchQuery('');
    setSelectedProdi('all');
    setSelectedIssue('all');
    setSelectedYear('all');
    setSelectedDosen('all');
    setSelectedKeahlian('all');
    setSortBy('newest');
    setIsBookmarkFilterActive(false);
  };

  // Two-way synchronization handlers between Prodi, Dosen, and Keahlian
  const handleDosenChange = (val: string) => {
    if (val === '__clear_keahlian__') {
      setSelectedKeahlian('all');
      setSelectedDosen('all');
      return;
    }
    setSelectedDosen(val);
    if (val !== 'all') {
      const matched = dosenList.find((d) => d.cleanName === val);
      if (matched && matched.keahlian && matched.keahlian.length > 0) {
        setSelectedKeahlian(matched.keahlian[0]);
        if (matched.prodi && selectedProdi !== 'all' && selectedProdi !== matched.prodi) {
          setSelectedProdi(matched.prodi);
        }
      }
    }
  };

  const handleKeahlianChange = (val: string) => {
    setSelectedKeahlian(val);
    if (val !== 'all') {
      // If currently selected dosen doesn't belong to this keahlian, reset dosen
      if (selectedDosen !== 'all') {
        const currentDosen = dosenList.find((d) => d.cleanName === selectedDosen);
        if (!currentDosen || !currentDosen.keahlian.includes(val)) {
          setSelectedDosen('all');
        }
      }
    }
  };

  const handleProdiChange = (newProdi: 'all' | 'SISKOM' | 'SISFO') => {
    setSelectedProdi(newProdi);
    if (newProdi !== 'all') {
      if (selectedDosen !== 'all') {
        const currentDosen = dosenList.find((d) => d.cleanName === selectedDosen);
        if (currentDosen && currentDosen.prodi !== newProdi) {
          setSelectedDosen('all');
        }
      }
      if (selectedKeahlian !== 'all') {
        const prodiDosen = dosenList.filter((d) => d.prodi === newProdi);
        const hasKeahlian = prodiDosen.some((d) => d.keahlian.includes(selectedKeahlian));
        if (!hasKeahlian) {
          setSelectedKeahlian('all');
        }
      }
    }
  };

  // Filtered dosen options based on active keahlian and prodi filters
  const displayedDosenList = useMemo(() => {
    return dosenList.filter((d) => {
      if (selectedProdi !== 'all' && d.prodi !== selectedProdi) return false;
      if (selectedKeahlian !== 'all' && !d.keahlian.includes(selectedKeahlian)) return false;
      return true;
    });
  }, [dosenList, selectedProdi, selectedKeahlian]);

  // Filtered keahlian options based on active prodi filter
  const displayedKeahlianList = useMemo(() => {
    if (selectedProdi === 'all') return keahlianList;
    const prodiDosen = dosenList.filter((d) => d.prodi === selectedProdi);
    const prodiKeahlian = new Set<string>();
    prodiDosen.forEach((d) => d.keahlian.forEach((k) => prodiKeahlian.add(k)));
    return keahlianList.filter((k) => prodiKeahlian.has(k));
  }, [keahlianList, dosenList, selectedProdi]);

  // Scroll to catalog top on badge clicks
  const scrollToCatalog = () => {
    setTimeout(() => {
      document.getElementById('catalog-top')?.scrollIntoView({ behavior: 'smooth' });
    }, 50);
  };

  // Filtered articles when bookmark filter is active
  const displayedArticles = useMemo(() => {
    if (!isBookmarkFilterActive) return articles;
    return articles.filter((a) => vault.bookmarks.includes(a.ojs_id));
  }, [articles, isBookmarkFilterActive, vault.bookmarks]);

  const hasActiveFilters =
    searchQuery !== '' ||
    selectedProdi !== 'all' ||
    selectedIssue !== 'all' ||
    selectedYear !== 'all' ||
    selectedDosen !== 'all' ||
    selectedKeahlian !== 'all' ||
    isBookmarkFilterActive;

  return (
    <div className="min-h-screen flex flex-col relative bg-[#FAF8F4] dark:bg-[#101216] text-black dark:text-white transition-colors overflow-x-hidden">
      {/* Idle Ambient Background Animation */}
      <IdleBackground />

      {/* Main Content: Direct Straight-Up Search, Filters & Article Catalog */}
      <main className="relative z-10 flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 pt-5 sm:pt-8 pb-10">
        <div id="catalog-top" className="scroll-mt-6" />

        {/* Unified Search & Filters Control Panel - Neo-Brutalist Box */}
        <div className="mb-8 p-3.5 sm:p-5 bg-white dark:bg-[#1A1F29] border-[3px] border-black dark:border-white shadow-[6px_6px_0px_0px_#16181D] dark:shadow-[6px_6px_0px_0px_#D4D4D8] space-y-3 sm:space-y-4">
          {/* Search Bar */}
          <div className="relative flex items-center bg-[#FAF8F4] dark:bg-[#101216] border-2 border-black dark:border-white shadow-[3px_3px_0px_0px_#16181D] dark:shadow-[3px_3px_0px_0px_#D4D4D8]">
            <div className="absolute inset-y-0 left-0 pl-3.5 sm:pl-4 flex items-center pointer-events-none text-black dark:text-white">
              <Search className="w-5 h-5 stroke-[2.5]" />
            </div>
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Cari judul riset, nama mahasiswa, dosen pembimbing, atau topik..."
              className="w-full pl-11 sm:pl-12 pr-10 py-3 sm:py-3.5 text-sm sm:text-base font-bold bg-transparent text-black dark:text-white placeholder-slate-400 focus:outline-none"
            />
            {searchInput && (
              <button
                onClick={() => {
                  setSearchInput('');
                  setSearchQuery('');
                }}
                className="absolute inset-y-0 right-0 pr-4 flex items-center text-black dark:text-white hover:opacity-70"
                title="Hapus pencarian"
              >
                <X className="w-5 h-5 stroke-[2.5]" />
              </button>
            )}
          </div>

          {/* Filters & Results Controls Row (Directly shown on all screens) */}
          <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-3 pt-3 border-t-2 border-dashed border-black/20 dark:border-white/20">
            {/* Filter Dropdowns & Segmented Prodi Control */}
            <div className="flex flex-wrap items-center gap-2 sm:gap-2.5 text-xs font-bold">
              <div className="flex items-center gap-1.5 text-black dark:text-white mr-1 uppercase font-black">
                <SlidersHorizontal className="w-4 h-4 stroke-[2.5]" />
                <span>Filter:</span>
              </div>

              {/* Segmented Prodi Control */}
              <div className="inline-flex border-2 border-black dark:border-white shadow-[2px_2px_0px_0px_#16181D] dark:shadow-[2px_2px_0px_0px_#D4D4D8] overflow-hidden text-xs font-black uppercase">
                <button
                  type="button"
                  onClick={() => handleProdiChange('all')}
                  className={`px-3 py-1.5 transition-all ${
                    selectedProdi === 'all'
                      ? 'bg-black text-white dark:bg-white dark:text-black font-black'
                      : 'bg-white dark:bg-[#181B20] text-black dark:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                  title="Tampilkan riset dari semua program studi"
                >
                  Semua
                </button>
                <button
                  type="button"
                  onClick={() => handleProdiChange('SISKOM')}
                  className={`px-3 py-1.5 border-l-2 border-black dark:border-white transition-all ${
                    selectedProdi === 'SISKOM'
                      ? 'bg-[#38BDF8] text-black font-black'
                      : 'bg-white dark:bg-[#181B20] text-black dark:text-white hover:bg-[#38BDF8]/20'
                  }`}
                  title="Saring riset Prodi Rekayasa Sistem Komputer"
                >
                  Siskom
                </button>
                <button
                  type="button"
                  onClick={() => handleProdiChange('SISFO')}
                  className={`px-3 py-1.5 border-l-2 border-black dark:border-white transition-all ${
                    selectedProdi === 'SISFO'
                      ? 'bg-[#F472B6] text-black font-black'
                      : 'bg-white dark:bg-[#181B20] text-black dark:text-white hover:bg-[#F472B6]/20'
                  }`}
                  title="Saring riset Prodi Sistem Informasi"
                >
                  Sisfo
                </button>
              </div>

              {/* Dosen Pembimbing Filter (Yellow active pop with auto-sync & clear keahlian option) */}
              <div className="relative inline-flex items-center">
                <select
                  value={selectedDosen}
                  onChange={(e) => handleDosenChange(e.target.value)}
                  className={`appearance-none pl-3 pr-7 py-1.5 border-2 border-black dark:border-white text-xs font-bold transition-all focus:outline-none max-w-[210px] truncate ${
                    selectedDosen !== 'all'
                      ? 'bg-[#FEF08A] text-black shadow-[2px_2px_0px_0px_#16181D] font-black'
                      : 'bg-white dark:bg-black text-black dark:text-white shadow-[2px_2px_0px_0px_#16181D] dark:shadow-[2px_2px_0px_0px_#D4D4D8]'
                  }`}
                  title={selectedDosen !== 'all' ? `Filter dosen: ${selectedDosen}` : 'Pilih Dosen Pembimbing'}
                >
                  {selectedKeahlian !== 'all' ? (
                    <>
                      <option value="all" className="text-black bg-white font-bold">
                        Semua Dosen [{selectedKeahlian.replace(/\s*\(.*/, '')}] ({displayedDosenList.length})
                      </option>
                      <option value="__clear_keahlian__" className="text-blue-700 bg-amber-50 font-black">
                        🌐 Tampilkan Semua Dosen (Hapus Filter Keahlian)
                      </option>
                      <option disabled className="text-slate-400 bg-slate-100">
                        ── Dosen {selectedKeahlian.replace(/\s*\(.*/, '')} ──
                      </option>
                    </>
                  ) : (
                    <option value="all" className="text-black bg-white">
                      Semua Dosen Pembimbing ({displayedDosenList.length})
                    </option>
                  )}
                  {displayedDosenList.map((d) => (
                    <option key={d.cleanName} value={d.cleanName} className="text-black bg-white">
                      {d.name} [{d.prodi}]
                    </option>
                  ))}
                </select>
                <ChevronDown className={`w-3.5 h-3.5 absolute right-2 pointer-events-none stroke-[2.5] ${selectedDosen !== 'all' ? 'text-black' : 'text-black dark:text-white'}`} />
              </div>

              {/* Keahlian Filter (Mint active pop) */}
              <div className="relative inline-flex items-center">
                <select
                  value={selectedKeahlian}
                  onChange={(e) => handleKeahlianChange(e.target.value)}
                  className={`appearance-none pl-3 pr-7 py-1.5 border-2 border-black dark:border-white text-xs font-bold transition-all focus:outline-none max-w-[210px] truncate ${
                    selectedKeahlian !== 'all'
                      ? 'bg-[#A7F3D0] text-black shadow-[2px_2px_0px_0px_#16181D] font-black'
                      : 'bg-white dark:bg-black text-black dark:text-white shadow-[2px_2px_0px_0px_#16181D] dark:shadow-[2px_2px_0px_0px_#D4D4D8]'
                  }`}
                  title={selectedKeahlian !== 'all' ? `Filter keahlian: ${selectedKeahlian}` : 'Pilih Bidang Keahlian'}
                >
                  <option value="all" className="text-black bg-white">Semua Bidang Keahlian</option>
                  {displayedKeahlianList.map((k) => (
                    <option key={k} value={k} className="text-black bg-white">
                      {k}
                    </option>
                  ))}
                </select>
                <ChevronDown className={`w-3.5 h-3.5 absolute right-2 pointer-events-none stroke-[2.5] ${selectedKeahlian !== 'all' ? 'text-black' : 'text-black dark:text-white'}`} />
              </div>

              {/* Issue Selector (Peach active pop) */}
              <div className="relative inline-flex items-center">
                <select
                  value={selectedIssue}
                  onChange={(e) => setSelectedIssue(e.target.value)}
                  className={`appearance-none pl-3 pr-7 py-1.5 border-2 border-black dark:border-white text-xs font-bold transition-all focus:outline-none max-w-[175px] truncate ${
                    selectedIssue !== 'all'
                      ? 'bg-[#FED7AA] text-black shadow-[2px_2px_0px_0px_#16181D] font-black'
                      : 'bg-white dark:bg-black text-black dark:text-white shadow-[2px_2px_0px_0px_#16181D] dark:shadow-[2px_2px_0px_0px_#D4D4D8]'
                  }`}
                  title={selectedIssue !== 'all' ? `Filter edisi: ${selectedIssue}` : 'Pilih Edisi Publikasi'}
                >
                  <option value="all" className="text-black bg-white">Semua Edisi ({issues.length})</option>
                  {issues.map((iss) => (
                    <option key={iss} value={iss} className="text-black bg-white">
                      {iss}
                    </option>
                  ))}
                </select>
                <ChevronDown className={`w-3.5 h-3.5 absolute right-2 pointer-events-none stroke-[2.5] ${selectedIssue !== 'all' ? 'text-black' : 'text-black dark:text-white'}`} />
              </div>

              {/* Year Selector (Lavender active pop) */}
              {years.length > 0 && (
                <div className="relative inline-flex items-center">
                  <select
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(e.target.value)}
                    className={`appearance-none pl-3 pr-7 py-1.5 border-2 border-black dark:border-white text-xs font-bold transition-all focus:outline-none ${
                      selectedYear !== 'all'
                        ? 'bg-[#DDD6FE] text-black shadow-[2px_2px_0px_0px_#16181D] font-black'
                        : 'bg-white dark:bg-black text-black dark:text-white shadow-[2px_2px_0px_0px_#16181D] dark:shadow-[2px_2px_0px_0px_#D4D4D8]'
                    }`}
                    title={selectedYear !== 'all' ? `Filter tahun: ${selectedYear}` : 'Pilih Tahun'}
                  >
                    <option value="all" className="text-black bg-white">Semua Tahun</option>
                    {years.map((y) => (
                      <option key={y} value={y} className="text-black bg-white">
                        Tahun {y}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className={`w-3.5 h-3.5 absolute right-2 pointer-events-none stroke-[2.5] ${selectedYear !== 'all' ? 'text-black' : 'text-black dark:text-white'}`} />
                </div>
              )}
            </div>

            {/* Right Side: Sort Controls, Results Count, & View Mode */}
            <div className="flex flex-wrap items-center gap-2.5 text-xs font-bold shrink-0 self-start xl:self-center">
              {/* Sort Selector */}
              <div className="relative inline-flex items-center">
                <div className="absolute left-2.5 pointer-events-none text-black dark:text-white">
                  <ArrowUpDown className="w-3.5 h-3.5 stroke-[2.5]" />
                </div>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as 'newest' | 'oldest' | 'title')}
                  className="appearance-none pl-8 pr-7 py-1.5 bg-white dark:bg-black text-black dark:text-white border-2 border-black dark:border-white shadow-[2px_2px_0px_0px_#16181D] dark:shadow-[2px_2px_0px_0px_#D4D4D8] font-bold text-xs focus:outline-none"
                  title="Urutkan daftar riset"
                >
                  <option value="newest" className="text-black bg-white">Terbaru</option>
                  <option value="oldest" className="text-black bg-white">Terlama</option>
                  <option value="title" className="text-black bg-white">Judul (A-Z)</option>
                </select>
                <ChevronDown className="w-3.5 h-3.5 absolute right-2 pointer-events-none stroke-[2.5] text-black dark:text-white" />
              </div>

              {/* Results Count Badge (Flat metadata stamp) */}
              <span className="px-3 py-1.5 bg-slate-100 dark:bg-[#1E232B] text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 font-mono font-bold uppercase tracking-wider select-none cursor-default shadow-none rounded-sm">
                HASIL: {filteredCount} / {totalCount} RISET
              </span>

              {/* Quick View Mode Toggle */}
              <button
                onClick={handleToggleShowAll}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-black uppercase border-2 border-black dark:border-white shadow-[2.5px_2.5px_0px_0px_#16181D] dark:shadow-[2.5px_2.5px_0px_0px_#D4D4D8] active:translate-x-0.5 active:translate-y-0.5 transition-all ${
                  showAll
                    ? 'bg-[#FEF08A] text-black hover:bg-[#FACC15]'
                    : 'bg-[#38BDF8] text-black hover:bg-[#0EA5E9]'
                }`}
                title={showAll ? 'Kembali ke mode 10 riset per halaman' : 'Tampilkan seluruh riset dalam satu halaman'}
              >
                <Layers className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>{showAll ? '10 PER HAL' : 'SEMUA RISET'}</span>
              </button>
            </div>
          </div>

          {/* Active Filter Chips Bar with Motion Spring Physics */}
          <AnimatePresence>
            {hasActiveFilters && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.18 }}
                className="flex flex-wrap items-center gap-2 pt-3 border-t-2 border-dashed border-black/20 dark:border-white/20 text-xs overflow-hidden"
              >
                <span className="font-mono font-bold text-slate-500 dark:text-slate-400 uppercase text-[11px] mr-1 select-none">
                  Filter Aktif:
                </span>

                <AnimatePresence>
                  {/* Active Bookmarks Filter Chip */}
                  {/* Active Bookmark Filter */}
                  {isBookmarkFilterActive && (
                    <motion.button
                      layout
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      transition={{ type: 'spring', stiffness: 500, damping: 28 }}
                      type="button"
                      onPointerDown={lockTouchScrollOnPointerDown}
                      onClick={() => setIsBookmarkFilterActive(false)}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-black bg-[#FEF08A] text-black border-2 border-black shadow-[2px_2px_0px_0px_#16181D] uppercase transition-all hover:opacity-85 active:translate-x-0.5 active:translate-y-0.5 touch-none select-none"
                      style={{ touchAction: 'none', WebkitTouchCallout: 'none', userSelect: 'none' }}
                      title="Hapus filter koleksi tersimpan"
                    >
                      <Bookmark className="w-3.5 h-3.5 fill-black stroke-[2.5]" />
                      <span>Koleksi Tersimpan ({vault.bookmarks.length})</span>
                      <X className="w-3.5 h-3.5 stroke-[3]" />
                    </motion.button>
                  )}

                  {/* Active Prodi Chip */}
                  {selectedProdi !== 'all' && (
                    <motion.button
                      layout
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      transition={{ type: 'spring', stiffness: 500, damping: 28 }}
                      type="button"
                      onPointerDown={lockTouchScrollOnPointerDown}
                      onClick={() => handleProdiChange('all')}
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-black border-2 border-black shadow-[2px_2px_0px_0px_#16181D] uppercase transition-all hover:opacity-85 active:translate-x-0.5 active:translate-y-0.5 touch-none select-none ${
                        selectedProdi === 'SISFO' ? 'bg-[#F472B6] text-black' : 'bg-[#38BDF8] text-black'
                      }`}
                      style={{ touchAction: 'none', WebkitTouchCallout: 'none', userSelect: 'none' }}
                      title="Hapus filter prodi"
                    >
                      <span>Prodi: {selectedProdi}</span>
                      <X className="w-3.5 h-3.5 stroke-[3]" />
                    </motion.button>
                  )}

                  {/* Active Keahlian Chip */}
                  {selectedKeahlian !== 'all' && (
                    <motion.button
                      layout
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      transition={{ type: 'spring', stiffness: 500, damping: 28 }}
                      type="button"
                      onPointerDown={lockTouchScrollOnPointerDown}
                      onClick={() => handleKeahlianChange('all')}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-black bg-[#A7F3D0] text-black border-2 border-black shadow-[2px_2px_0px_0px_#16181D] uppercase transition-all hover:opacity-85 active:translate-x-0.5 active:translate-y-0.5 touch-none select-none"
                      style={{ touchAction: 'none', WebkitTouchCallout: 'none', userSelect: 'none' }}
                      title="Hapus filter bidang keahlian"
                    >
                      <span>Keahlian: {selectedKeahlian}</span>
                      <X className="w-3.5 h-3.5 stroke-[3]" />
                    </motion.button>
                  )}

                  {/* Active Dosen Chip */}
                  {selectedDosen !== 'all' && (
                    <motion.button
                      layout
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      transition={{ type: 'spring', stiffness: 500, damping: 28 }}
                      type="button"
                      onPointerDown={lockTouchScrollOnPointerDown}
                      onClick={() => handleDosenChange('all')}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-black bg-[#FEF08A] text-black border-2 border-black shadow-[2px_2px_0px_0px_#16181D] uppercase transition-all hover:opacity-85 active:translate-x-0.5 active:translate-y-0.5 touch-none select-none"
                      style={{ touchAction: 'none', WebkitTouchCallout: 'none', userSelect: 'none' }}
                      title="Hapus filter dosen"
                    >
                      <span>Dosen: {selectedDosen}</span>
                      <X className="w-3.5 h-3.5 stroke-[3]" />
                    </motion.button>
                  )}

                  {/* Active Issue Chip */}
                  {selectedIssue !== 'all' && (
                    <motion.button
                      layout
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      transition={{ type: 'spring', stiffness: 500, damping: 28 }}
                      type="button"
                      onPointerDown={lockTouchScrollOnPointerDown}
                      onClick={() => setSelectedIssue('all')}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-black bg-[#FED7AA] text-black border-2 border-black shadow-[2px_2px_0px_0px_#16181D] uppercase transition-all hover:opacity-85 active:translate-x-0.5 active:translate-y-0.5 touch-none select-none"
                      style={{ touchAction: 'none', WebkitTouchCallout: 'none', userSelect: 'none' }}
                      title="Hapus filter edisi"
                    >
                      <span>Edisi: {selectedIssue}</span>
                      <X className="w-3.5 h-3.5 stroke-[3]" />
                    </motion.button>
                  )}

                  {/* Active Year Chip */}
                  {selectedYear !== 'all' && (
                    <motion.button
                      layout
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      transition={{ type: 'spring', stiffness: 500, damping: 28 }}
                      type="button"
                      onPointerDown={lockTouchScrollOnPointerDown}
                      onClick={() => setSelectedYear('all')}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-black bg-[#DDD6FE] text-black border-2 border-black shadow-[2px_2px_0px_0px_#16181D] uppercase transition-all hover:opacity-85 active:translate-x-0.5 active:translate-y-0.5 touch-none select-none"
                      style={{ touchAction: 'none', WebkitTouchCallout: 'none', userSelect: 'none' }}
                      title="Hapus filter tahun"
                    >
                      <span>Tahun: {selectedYear}</span>
                      <X className="w-3.5 h-3.5 stroke-[3]" />
                    </motion.button>
                  )}

                  {/* Active Search Query Chip */}
                  {searchQuery && (
                    <motion.button
                      layout
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      transition={{ type: 'spring', stiffness: 500, damping: 28 }}
                      type="button"
                      onPointerDown={lockTouchScrollOnPointerDown}
                      onClick={() => {
                        setSearchInput('');
                        setSearchQuery('');
                      }}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-black bg-slate-200 dark:bg-slate-700 text-black dark:text-white border-2 border-black dark:border-white shadow-[2px_2px_0px_0px_#16181D] uppercase transition-all hover:opacity-85 active:translate-x-0.5 active:translate-y-0.5 touch-none select-none"
                      style={{ touchAction: 'none', WebkitTouchCallout: 'none', userSelect: 'none' }}
                      title="Hapus kata kunci pencarian"
                    >
                      <span>Cari: &quot;{searchQuery}&quot;</span>
                      <X className="w-3.5 h-3.5 stroke-[3]" />
                    </motion.button>
                  )}
                </AnimatePresence>

                {/* Reset All Button */}
                <motion.button
                  layout
                  whileTap={{ scale: 0.95 }}
                  type="button"
                  onPointerDown={lockTouchScrollOnPointerDown}
                  onClick={handleResetFilters}
                  className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-black bg-[#FECDD3] text-black border-2 border-black shadow-[2px_2px_0px_0px_#16181D] hover:bg-[#FDA4AF] active:translate-x-0.5 active:translate-y-0.5 transition-all ml-auto uppercase touch-none select-none"
                  style={{ touchAction: 'none', WebkitTouchCallout: 'none', userSelect: 'none' }}
                  title="Reset semua filter ke default"
                >
                  <X className="w-3.5 h-3.5 stroke-[3]" />
                  <span>Reset Semua</span>
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Loading State */}
        {isLoading ? (
          <div className="py-20 flex flex-col items-center justify-center space-y-3">
            <div className="w-10 h-10 border-4 border-black border-t-[#FACC15] rounded-full animate-spin" />
            <p className="text-sm font-black uppercase tracking-wider">Memuat data riset...</p>
          </div>
        ) : displayedArticles.length === 0 ? (
          /* Empty State */
          <div className="py-16 px-6 text-center border-[3px] border-black dark:border-white bg-white dark:bg-[#181B20] shadow-[6px_6px_0px_0px_#16181D] dark:shadow-[6px_6px_0px_0px_#D4D4D8] max-w-lg mx-auto space-y-3">
            <div className="w-14 h-14 bg-[#FEF08A] text-black border-2 border-black shadow-[3px_3px_0px_0px_#16181D] flex items-center justify-center mx-auto">
              <Bookmark className="w-7 h-7 stroke-[2.5]" />
            </div>
            <h3 className="text-lg font-black uppercase text-black dark:text-white">
              {isBookmarkFilterActive
                ? 'Belum Ada Koleksi Tersimpan'
                : hasActiveFilters
                ? 'Tidak ada artikel yang cocok'
                : 'Belum ada data artikel'}
            </h3>
            <p className="text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-300">
              {isBookmarkFilterActive
                ? 'Anda belum menyimpan artikel ke brankas rahasia, atau artikel tersimpan tidak cocok dengan filter lain yang aktif.'
                : hasActiveFilters
                ? 'Coba ganti kata kunci pencarian atau reset filter yang aktif.'
                : 'Data riset belum tersedia di database.'}
            </p>
            {hasActiveFilters && (
              <button
                type="button"
                onPointerDown={lockTouchScrollOnPointerDown}
                onClick={handleResetFilters}
                className="mt-3 px-4 py-2 text-xs font-black uppercase bg-[#A3E635] text-black border-2 border-black shadow-[3px_3px_0px_0px_#16181D] active:translate-x-0.5 active:translate-y-0.5 touch-none select-none"
                style={{ touchAction: 'none', WebkitTouchCallout: 'none', userSelect: 'none' }}
              >
                Reset Filter Pencarian
              </button>
            )}
          </div>
        ) : (
          <>
            {/* Articles Grid */}
            <motion.div
              key={`${selectedDosen}-${selectedKeahlian}-${selectedProdi}-${selectedYear}-${selectedIssue}-${searchQuery}-${currentPage}-${sortBy}-${showAll}-${isBookmarkFilterActive}`}
              initial="hidden"
              animate="show"
              variants={{
                hidden: { opacity: 0 },
                show: {
                  opacity: 1,
                  transition: {
                    staggerChildren: 0.035,
                  },
                },
              }}
              className="grid grid-cols-1 lg:grid-cols-2 gap-6"
            >
              {displayedArticles.map((article) => (
                <ArticleCard
                  key={article.ojs_id}
                  article={article}
                  isBookmarked={vault.bookmarks.includes(article.ojs_id)}
                  onToggleBookmark={handleToggleBookmark}
                  onReadPdf={(art) => setActivePdfArticle(art)}
                  onFilterDosen={(dosenName) => {
                    handleDosenChange(dosenName);
                    scrollToCatalog();
                  }}
                  onFilterKeahlian={(keahlianName) => {
                    handleKeahlianChange(keahlianName);
                    scrollToCatalog();
                  }}
                  onFilterProdi={(prodiName) => {
                    handleProdiChange(prodiName as 'SISKOM' | 'SISFO');
                    scrollToCatalog();
                  }}
                />
              ))}
            </motion.div>

            {/* Neo-Brutalist Pagination & View Bar */}
            <div className="mt-10 p-4 sm:p-5 bg-white dark:bg-[#181B20] border-[3px] border-black dark:border-white shadow-[6px_6px_0px_0px_#16181D] dark:shadow-[6px_6px_0px_0px_#D4D4D8] flex flex-col md:flex-row items-center justify-between gap-4">
              {/* Pagination Info Readout */}
              <div className="text-xs font-mono font-bold text-black dark:text-white text-center md:text-left">
                {showAll ? (
                  <span className="inline-flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#A3E635] border border-black inline-block" />
                    Menampilkan seluruh <strong className="font-black text-black dark:text-white">{filteredCount}</strong> riset (Satu Halaman)
                  </span>
                ) : (
                  <span>
                    Menampilkan riset <strong className="font-black">{(currentPage - 1) * PAGE_SIZE + 1}</strong> -{' '}
                    <strong className="font-black">{Math.min(currentPage * PAGE_SIZE, filteredCount)}</strong> dari{' '}
                    <strong className="font-black">{filteredCount}</strong> artikel
                    {totalPages > 1 && (
                      <span className="opacity-70 ml-1.5 font-normal">
                        (Halaman {currentPage} dari {totalPages})
                      </span>
                    )}
                  </span>
                )}
              </div>

              {/* Numbered Page Controls (Active in Paginated Mode) */}
              {!showAll && totalPages > 1 && (
                <div className="flex flex-wrap items-center justify-center gap-1.5">
                  {/* Prev Button */}
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage <= 1}
                    className={`inline-flex items-center gap-1 px-3 py-1.5 text-xs font-black uppercase border-2 border-black dark:border-white transition-all ${
                      currentPage <= 1
                        ? 'opacity-40 cursor-not-allowed bg-slate-100 dark:bg-slate-800 text-slate-400'
                        : 'bg-white dark:bg-black text-black dark:text-white shadow-[2px_2px_0px_0px_#16181D] dark:shadow-[2px_2px_0px_0px_#D4D4D8] hover:bg-[#FEF08A] hover:text-black active:translate-x-0.5 active:translate-y-0.5'
                    }`}
                    title="Halaman Sebelumnya"
                  >
                    <ChevronLeft className="w-4 h-4 stroke-[3]" />
                    <span className="hidden sm:inline">Prev</span>
                  </button>

                  {/* Smart Windowed Page Numbers */}
                  {getPaginationItems(currentPage, totalPages).map((item, idx) => {
                    if (item === '...') {
                      return (
                        <span
                          key={`ellipsis-${idx}`}
                          className="px-2 py-1 text-xs font-mono font-bold opacity-60"
                        >
                          ...
                        </span>
                      );
                    }
                    const pageNum = Number(item);
                    const isActive = pageNum === currentPage;
                    return (
                      <button
                        key={pageNum}
                        onClick={() => handlePageChange(pageNum)}
                        className={`min-w-[34px] px-2 py-1.5 text-xs font-black border-2 border-black dark:border-white transition-all ${
                          isActive
                            ? 'bg-[#FACC15] text-black shadow-[2.5px_2.5px_0px_0px_#16181D] dark:shadow-[2.5px_2.5px_0px_0px_#D4D4D8] scale-105'
                            : 'bg-white dark:bg-black text-black dark:text-white shadow-[1.5px_1.5px_0px_0px_#16181D] dark:shadow-[1.5px_1.5px_0px_0px_#D4D4D8] hover:bg-[#FEF08A] hover:text-black active:translate-x-0.5 active:translate-y-0.5'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}

                  {/* Next Button */}
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage >= totalPages}
                    className={`inline-flex items-center gap-1 px-3 py-1.5 text-xs font-black uppercase border-2 border-black dark:border-white transition-all ${
                      currentPage >= totalPages
                        ? 'opacity-40 cursor-not-allowed bg-slate-100 dark:bg-slate-800 text-slate-400'
                        : 'bg-white dark:bg-black text-black dark:text-white shadow-[2px_2px_0px_0px_#16181D] dark:shadow-[2px_2px_0px_0px_#D4D4D8] hover:bg-[#FEF08A] hover:text-black active:translate-x-0.5 active:translate-y-0.5'
                    }`}
                    title="Halaman Selanjutnya"
                  >
                    <span className="hidden sm:inline">Next</span>
                    <ChevronRight className="w-4 h-4 stroke-[3]" />
                  </button>
                </div>
              )}

              {/* Show All Toggle Button */}
              <button
                onClick={handleToggleShowAll}
                className={`inline-flex items-center gap-2 px-3.5 py-2 text-xs font-black uppercase tracking-wider border-2 border-black shadow-[3px_3px_0px_0px_#16181D] dark:shadow-[3px_3px_0px_0px_#D4D4D8] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all ${
                  showAll
                    ? 'bg-[#FEF08A] text-black hover:bg-[#FACC15]'
                    : 'bg-[#38BDF8] text-black hover:bg-[#0EA5E9]'
                }`}
              >
                <Layers className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>{showAll ? 'Tampilkan Per Halaman (10 Riset)' : 'Tampilkan Semua Riset (1 Halaman)'}</span>
              </button>
            </div>
          </>
        )}
      </main>

      {/* Bottom Status & Control Bar - Neo-Brutalist Footer */}
      <footer className="mt-16 border-t-[3.5px] border-black dark:border-white bg-[#E5DFD3] dark:bg-[#1A1F29] py-6 px-4 sm:px-6 lg:px-8 text-xs font-bold text-black dark:text-white transition-colors relative z-20">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-5">
          {/* Left: Cloud Database Status Indicator */}
          <div className="flex items-center space-x-2 px-3 py-1.5 text-xs font-bold border-2 border-black dark:border-white bg-white dark:bg-black text-black dark:text-white shadow-[2.5px_2.5px_0px_0px_#16181D] dark:shadow-[2.5px_2.5px_0px_0px_#D4D4D8]">
            <span
              className={`w-2.5 h-2.5 rounded-full border border-black ${
                supabaseConnected ? 'bg-[#4ADE80] animate-pulse' : 'bg-[#FBBF24]'
              }`}
            />
            <Database className="w-3.5 h-3.5 stroke-[2.5]" />
            <span className="font-mono">{supabaseConnected ? 'SUPABASE CLOUD' : 'LOCAL STORAGE'}</span>
          </div>

          {/* Center: Minimal Links & Brand */}
          <div className="flex flex-wrap items-center justify-center gap-2.5 sm:gap-3 font-black text-xs text-center">
            <span className="uppercase font-black text-black dark:text-white">UNTAN RESEARCH HUB</span>
            <span className="text-slate-400 hidden sm:inline">•</span>
            <a
              href="https://siskom.untan.ac.id/dosen-staf"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:underline hover:text-[#38BDF8] transition-colors"
            >
              DOSEN SISKOM
            </a>
            <span className="text-slate-400">•</span>
            <a
              href="https://sisfo.untan.ac.id/dosen-staff"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:underline hover:text-[#F472B6] transition-colors"
            >
              DOSEN SISFO
            </a>
            <span className="text-slate-400">•</span>
            <a
              href="https://jurnal.untan.ac.id/index.php/jcskommipa"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:underline hover:text-[#FACC15] transition-colors"
            >
              OJS UNTAN
            </a>
            <span className="text-slate-400">•</span>
            <Link
              href="/admin"
              className="inline-flex items-center gap-1 px-2 py-0.5 bg-[#FEF08A] text-black border border-black shadow-[1.5px_1.5px_0px_0px_#16181D] hover:-translate-x-0.5 hover:-translate-y-0.5 active:shadow-none transition-all"
              title="Panel Pengelola Database"
            >
              <Lock className="w-3 h-3 stroke-[2.5]" />
              <span>ADMIN</span>
            </Link>
          </div>

          {/* Right: Tactile Theme Toggle Switch */}
          <div className="flex items-center gap-2.5">
            <span className="text-xs font-black uppercase text-black dark:text-white hidden sm:inline">MODE:</span>
            <ThemeToggle />
          </div>
        </div>
      </footer>

      {/* In-App PDF Viewer Modal */}
      <PdfViewerModal
        article={activePdfArticle}
        onClose={() => setActivePdfArticle(null)}
      />

      {/* Floating Quick Action Pill for Show All Mode (Stacked above Vault Trigger on PC) */}
      {showAll && (
        <div className="fixed bottom-20 right-6 z-40 flex items-center gap-2 bg-white dark:bg-[#181B20] border-[2.5px] border-black dark:border-white p-1.5 shadow-[4px_4px_0px_0px_#16181D] dark:shadow-[4px_4px_0px_0px_#D4D4D8]">
          <button
            onClick={handleToggleShowAll}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-black uppercase bg-[#FACC15] text-black border-2 border-black shadow-[2px_2px_0px_0px_#16181D] hover:bg-[#EAB308] active:translate-x-0.5 active:translate-y-0.5 transition-all"
            title="Kembali ke tampilan 10 artikel per halaman"
          >
            <Layers className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>10 PER HALAMAN</span>
          </button>
          <button
            onClick={() => document.getElementById('catalog-top')?.scrollIntoView({ behavior: 'smooth' })}
            className="p-2 text-xs font-black bg-white dark:bg-black text-black dark:text-white border-2 border-black dark:border-white shadow-[2px_2px_0px_0px_#16181D] dark:shadow-[2px_2px_0px_0px_#D4D4D8] hover:bg-[#FEF08A] hover:text-black active:translate-x-0.5 active:translate-y-0.5 transition-all"
            title="Kembali ke Atas"
          >
            <ArrowUp className="w-4 h-4 stroke-[3]" />
          </button>
        </div>
      )}

      {/* Floating Vault Trigger (Mobile: Top-Right, PC: Bottom-Right) */}
      <VaultTrigger
        vault={vault}
        onClick={() => setIsVaultOpen(true)}
        isFilterActive={isBookmarkFilterActive}
      />

      {/* Neo-Brutalist Vault Modal */}
      <VaultModal
        isOpen={isVaultOpen}
        onClose={() => setIsVaultOpen(false)}
        vault={vault}
        allArticles={articles}
        onToggleBookmark={(ojsId) => {
          const art = articles.find((a) => a.ojs_id === ojsId);
          if (art) {
            handleToggleBookmark(art);
          } else {
            const res = toggleBookmarkLocal(ojsId);
            setVault(res.vault);
          }
        }}
        onVaultSynced={(updatedVault) => {
          saveLocalVault(updatedVault);
          setVault(updatedVault);
        }}
        onReadPdf={(art) => setActivePdfArticle(art)}
        onFilterBookmarksOnly={() => setIsBookmarkFilterActive(!isBookmarkFilterActive)}
        isFilterActive={isBookmarkFilterActive}
      />

      {/* First-Time Secret Key Celebration Modal */}
      <SecretKeyAnnouncementModal
        isOpen={Boolean(newSecretKeyAnnounce)}
        secretKey={newSecretKeyAnnounce || ''}
        onClose={() => setNewSecretKeyAnnounce(null)}
      />
    </div>
  );
}
