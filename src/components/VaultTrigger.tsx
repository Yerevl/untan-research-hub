'use client';

import React from 'react';
import { Bookmark, ShieldCheck, Key } from 'lucide-react';
import { LocalVault } from '@/lib/vault';
import { motion } from 'motion/react';

interface VaultTriggerProps {
  vault: LocalVault;
  onClick: () => void;
  isFilterActive?: boolean;
}

export const VaultTrigger: React.FC<VaultTriggerProps> = ({
  vault,
  onClick,
  isFilterActive,
}) => {
  const bookmarkCount = vault.bookmarks.length;

  return (
    <>
      {/* 1. MOBILE TRIGGER: Always on TOP-RIGHT of screen (sm:hidden) */}
      <div className="fixed top-3.5 right-3.5 z-40 sm:hidden">
        <motion.button
          whileTap={{ scale: 0.94, x: 1, y: 1 }}
          onClick={onClick}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-black uppercase tracking-wider border-[2.5px] border-black shadow-[3px_3px_0px_0px_#16181D] active:shadow-none transition-all ${
            isFilterActive
              ? 'bg-[#FDA4AF] text-black ring-2 ring-pink-500 ring-offset-1'
              : bookmarkCount > 0
              ? 'bg-[#FEF08A] text-black hover:bg-[#FDE047]'
              : 'bg-white text-black hover:bg-slate-100'
          }`}
          title="Buka Brankas Koleksi & Kunci Rahasia"
        >
          <Bookmark className={`w-3.5 h-3.5 ${bookmarkCount > 0 ? 'fill-black stroke-[2.5]' : 'stroke-[2.5]'}`} />
          <span>KOLEKSI</span>
          <span className="w-5 h-5 flex items-center justify-center bg-black text-white text-[10px] font-black rounded-full ml-0.5">
            {bookmarkCount}
          </span>
          {vault.isPrimary && (
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse ml-0.5" title="Perangkat Utama" />
          )}
        </motion.button>
      </div>

      {/* 2. PC / DESKTOP TRIGGER: Always on BOTTOM-RIGHT of screen (hidden sm:flex) */}
      <div className="fixed bottom-6 right-6 z-40 hidden sm:flex items-center">
        <motion.button
          whileHover={{ x: -2, y: -2 }}
          whileTap={{ scale: 0.95, x: 2, y: 2 }}
          onClick={onClick}
          className={`group flex items-center gap-2.5 px-4 py-2.5 font-black uppercase tracking-wider text-xs border-[2.5px] border-black dark:border-white shadow-[4px_4px_0px_0px_#16181D] dark:shadow-[4px_4px_0px_0px_#D4D4D8] hover:shadow-[6px_6px_0px_0px_#16181D] dark:hover:shadow-[6px_6px_0px_0px_#D4D4D8] transition-all select-none ${
            isFilterActive
              ? 'bg-[#FDA4AF] text-black ring-2 ring-pink-500 ring-offset-2'
              : bookmarkCount > 0
              ? 'bg-[#FEF08A] dark:bg-[#FACC15] text-black hover:bg-[#FDE047]'
              : 'bg-white dark:bg-[#1A1F29] text-black dark:text-white hover:bg-slate-50'
          }`}
          title="Buka Brankas Koleksi Jurnal & Kunci Sinkronisasi Rahasia"
        >
          <div className="relative">
            <Bookmark className={`w-4 h-4 ${bookmarkCount > 0 ? 'fill-black stroke-[2.5]' : 'stroke-[2.5]'}`} />
            {vault.isPrimary && (
              <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            )}
          </div>

          <span className="font-black">
            {isFilterActive ? 'FILTER KOLEKSI AKTIF' : 'KOLEKSI SAYA'}
          </span>

          <span className="px-2 py-0.5 bg-black text-white dark:bg-black dark:text-yellow-400 text-xs font-mono font-black border border-black shadow-none">
            {bookmarkCount}
          </span>

          {vault.secretKey && !vault.isPrimary && (
            <span className="text-[10px] font-mono text-sky-700 dark:text-sky-300 font-bold ml-1">
              [PAIRED]
            </span>
          )}
        </motion.button>
      </div>
    </>
  );
};

