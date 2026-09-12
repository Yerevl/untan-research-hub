'use client';

import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, SlidersHorizontal, RotateCcw, Check } from 'lucide-react';
import { DosenItem } from '@/lib/dosen';

interface MobileFilterDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDosen: string;
  onDosenChange: (val: string) => void;
  displayedDosenList: DosenItem[];
  selectedKeahlian: string;
  onKeahlianChange: (val: string) => void;
  displayedKeahlianList: string[];
  selectedIssue: string;
  onIssueChange: (val: string) => void;
  issues: string[];
  selectedYear: string;
  onYearChange: (val: string) => void;
  years: string[];
  sortBy: 'newest' | 'oldest' | 'title';
  onSortChange: (val: 'newest' | 'oldest' | 'title') => void;
  onResetFilters: () => void;
  hasActiveFilters: boolean;
  filteredCount: number;
}

export const MobileFilterDrawer: React.FC<MobileFilterDrawerProps> = ({
  isOpen,
  onClose,
  selectedDosen,
  onDosenChange,
  displayedDosenList,
  selectedKeahlian,
  onKeahlianChange,
  displayedKeahlianList,
  selectedIssue,
  onIssueChange,
  issues,
  selectedYear,
  onYearChange,
  years,
  sortBy,
  onSortChange,
  onResetFilters,
  hasActiveFilters,
  filteredCount,
}) => {
  // Prevent background body scrolling when bottom sheet is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Count active specific filters (excluding prodi and search which are visible on top)
  const activeCount =
    (selectedDosen !== 'all' ? 1 : 0) +
    (selectedKeahlian !== 'all' ? 1 : 0) +
    (selectedIssue !== 'all' ? 1 : 0) +
    (selectedYear !== 'all' ? 1 : 0) +
    (sortBy !== 'newest' ? 1 : 0);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex flex-col justify-end">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-xs"
            aria-hidden="true"
          />

          {/* Bottom Sheet Modal */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 320 }}
            className="relative z-10 w-full max-h-[88vh] bg-[#FAF8F4] dark:bg-[#1A1F29] border-t-[3.5px] border-black dark:border-white shadow-[0_-8px_24px_rgba(0,0,0,0.25)] flex flex-col rounded-t-xl overflow-hidden"
          >
            {/* Grab Handle */}
            <div className="w-12 h-1.5 bg-black/30 dark:bg-white/30 rounded-full mx-auto mt-2.5 mb-1" />

            {/* Header */}
            <div className="px-5 py-3 border-b-2 border-black dark:border-white flex items-center justify-between bg-white dark:bg-[#12151B]">
              <div className="flex items-center gap-2">
                <div className="p-1 bg-[#FACC15] text-black border border-black shadow-[1.5px_1.5px_0px_0px_#000]">
                  <SlidersHorizontal className="w-4 h-4 stroke-[2.5]" />
                </div>
                <h3 className="font-black text-sm uppercase tracking-tight text-black dark:text-white">
                  Saring Publikasi Riset
                </h3>
                {activeCount > 0 && (
                  <span className="px-2 py-0.2 bg-[#F472B6] text-black text-[10px] font-black border border-black">
                    {activeCount} AKTIF
                  </span>
                )}
              </div>

              <button
                onClick={onClose}
                className="p-1.5 text-black dark:text-white border-2 border-black dark:border-white bg-white dark:bg-black hover:bg-slate-100 dark:hover:bg-slate-800 shadow-[2px_2px_0px_0px_#16181D] dark:shadow-[2px_2px_0px_0px_#D4D4D8] active:translate-x-0.5 active:translate-y-0.5"
                title="Tutup Filter"
              >
                <X className="w-4 h-4 stroke-[3]" />
              </button>
            </div>

            {/* Scrollable Form Content */}
            <div className="p-5 overflow-y-auto space-y-4 flex-1 overscroll-contain">
              {/* Dosen Pembimbing */}
              <div className="space-y-1.5">
                <label className="block text-xs font-black uppercase text-black dark:text-white">
                  Dosen Pembimbing
                </label>
                <div className="relative">
                  <select
                    value={selectedDosen}
                    onChange={(e) => onDosenChange(e.target.value)}
                    className="w-full px-3 py-2.5 bg-white dark:bg-black text-black dark:text-white border-2 border-black dark:border-white text-xs font-bold shadow-[2.5px_2.5px_0px_0px_#16181D] dark:shadow-[2.5px_2.5px_0px_0px_#D4D4D8] focus:outline-none"
                  >
                    <option value="all">Semua Dosen Pembimbing ({displayedDosenList.length})</option>
                    {displayedDosenList.map((d) => (
                      <option key={d.cleanName} value={d.cleanName}>
                        {d.name} [{d.prodi}]
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Bidang Keahlian */}
              <div className="space-y-1.5">
                <label className="block text-xs font-black uppercase text-black dark:text-white">
                  Bidang Keahlian Laboratorium
                </label>
                <div className="relative">
                  <select
                    value={selectedKeahlian}
                    onChange={(e) => onKeahlianChange(e.target.value)}
                    className="w-full px-3 py-2.5 bg-white dark:bg-black text-black dark:text-white border-2 border-black dark:border-white text-xs font-bold shadow-[2.5px_2.5px_0px_0px_#16181D] dark:shadow-[2.5px_2.5px_0px_0px_#D4D4D8] focus:outline-none"
                  >
                    <option value="all">Semua Bidang Keahlian ({displayedKeahlianList.length})</option>
                    {displayedKeahlianList.map((k) => (
                      <option key={k} value={k}>
                        {k}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Grid 2 Kolom: Edisi & Tahun */}
              <div className="grid grid-cols-2 gap-3">
                {/* Edisi Jurnal */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-black uppercase text-black dark:text-white">
                    Edisi Jurnal
                  </label>
                  <select
                    value={selectedIssue}
                    onChange={(e) => onIssueChange(e.target.value)}
                    className="w-full px-2.5 py-2 bg-white dark:bg-black text-black dark:text-white border-2 border-black dark:border-white text-xs font-bold shadow-[2px_2px_0px_0px_#16181D] dark:shadow-[2px_2px_0px_0px_#D4D4D8] focus:outline-none"
                  >
                    <option value="all">Semua Edisi</option>
                    {issues.map((issue) => (
                      <option key={issue} value={issue}>
                        {issue}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Tahun Terbit */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-black uppercase text-black dark:text-white">
                    Tahun Terbit
                  </label>
                  <select
                    value={selectedYear}
                    onChange={(e) => onYearChange(e.target.value)}
                    className="w-full px-2.5 py-2 bg-white dark:bg-black text-black dark:text-white border-2 border-black dark:border-white text-xs font-bold shadow-[2px_2px_0px_0px_#16181D] dark:shadow-[2px_2px_0px_0px_#D4D4D8] focus:outline-none"
                  >
                    <option value="all">Semua Tahun</option>
                    {years.map((year) => (
                      <option key={year} value={year}>
                        {year}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Urutan Publikasi */}
              <div className="space-y-1.5">
                <label className="block text-xs font-black uppercase text-black dark:text-white">
                  Urutan Hasil
                </label>
                <select
                  value={sortBy}
                  onChange={(e) => onSortChange(e.target.value as 'newest' | 'oldest' | 'title')}
                  className="w-full px-3 py-2 bg-white dark:bg-black text-black dark:text-white border-2 border-black dark:border-white text-xs font-bold shadow-[2px_2px_0px_0px_#16181D] dark:shadow-[2px_2px_0px_0px_#D4D4D8] focus:outline-none"
                >
                  <option value="newest">Terbaru (Default)</option>
                  <option value="oldest">Terlama</option>
                  <option value="title">Judul (A-Z)</option>
                </select>
              </div>
            </div>

            {/* Bottom Actions Bar */}
            <div className="p-4 border-t-2 border-black dark:border-white bg-white dark:bg-[#12151B] flex items-center gap-3">
              {hasActiveFilters && (
                <button
                  onClick={onResetFilters}
                  className="px-3.5 py-2.5 border-2 border-black dark:border-white bg-slate-100 dark:bg-slate-800 text-black dark:text-white text-xs font-black uppercase shadow-[2px_2px_0px_0px_#16181D] dark:shadow-[2px_2px_0px_0px_#D4D4D8] active:translate-x-0.5 active:translate-y-0.5 flex items-center gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>Reset</span>
                </button>
              )}

              <button
                onClick={onClose}
                className="flex-1 py-2.5 px-4 bg-[#FACC15] text-black border-2 border-black shadow-[3px_3px_0px_0px_#16181D] active:translate-x-0.5 active:translate-y-0.5 font-black text-xs uppercase flex items-center justify-center gap-2"
              >
                <Check className="w-4 h-4 stroke-[3]" />
                <span>Tampilkan {filteredCount} Hasil</span>
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
