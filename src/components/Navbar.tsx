'use client';

import { BookOpen, Database } from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';

interface NavbarProps {
  onOpenSync?: () => void;
  supabaseConnected: boolean;
  totalArticles: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  supabaseConnected,
  totalArticles,
}) => {
  return (
    <header className="sticky top-0 z-40 w-full border-b-[3px] border-black dark:border-white bg-[#ECE7DE] dark:bg-[#0E1013] transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
        {/* Brand & Logo */}
        <div className="flex items-center space-x-3.5">
          <div className="w-11 h-11 rounded-none bg-[#FACC15] border-2 border-black dark:border-white shadow-[3px_3px_0px_0px_#16181D] dark:shadow-[3px_3px_0px_0px_#D4D4D8] flex items-center justify-center text-black font-extrabold transform -rotate-1 hover:rotate-0 transition-transform">
            <BookOpen className="w-6 h-6 stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-black text-xl text-black dark:text-white tracking-tight uppercase">
                Untan Research Hub
              </span>
            </div>
            <p className="text-xs font-medium text-slate-700 dark:text-slate-300 hidden sm:block">
              Portal Publikasi Riset Rekayasa Sistem Komputer Universitas Tanjungpura
            </p>
          </div>
        </div>

        {/* Action Controls & Badges */}
        <div className="flex items-center space-x-3">
          {/* Supabase Status Indicator */}
          <div className="flex items-center space-x-2 px-3 py-1 text-xs font-bold border-2 border-black dark:border-white bg-white dark:bg-black text-black dark:text-white shadow-[2.5px_2.5px_0px_0px_#16181D] dark:shadow-[2.5px_2.5px_0px_0px_#D4D4D8]">
            <span
              className={`w-2.5 h-2.5 rounded-full border border-black ${
                supabaseConnected ? 'bg-[#4ADE80] animate-pulse' : 'bg-[#FBBF24]'
              }`}
            />
            <Database className="w-3.5 h-3.5 stroke-[2.5]" />
            <span className="hidden sm:inline">{supabaseConnected ? 'SUPABASE CLOUD' : 'LOCAL STORAGE'}</span>
          </div>

          {/* Tactile Theme Toggle Switch */}
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
};
