'use client';

import React from 'react';
import { BookOpen, RefreshCw, ExternalLink, Database, Sparkles } from 'lucide-react';

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
    <header className="sticky top-0 z-40 w-full border-b border-slate-200 bg-white/90 backdrop-blur-md dark:border-slate-800 dark:bg-slate-950/90 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand & Logo */}
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 to-blue-700 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-bold text-lg text-slate-900 dark:text-white tracking-tight">
                Untan Research Hub
              </span>
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-indigo-50 text-indigo-700 dark:bg-indigo-950/70 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                JCSKOMMIPA
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 hidden sm:block">
              Portal Hasil Riset Jurnal Komputer & Aplikasi Universitas Tanjungpura
            </p>
          </div>
        </div>

        {/* Action Controls & Badges */}
        <div className="flex items-center space-x-3">
          {/* Supabase Status Indicator */}
          <div className="hidden md:flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-medium border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-300">
            <span
              className={`w-2 h-2 rounded-full ${
                supabaseConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
              }`}
            />
            <Database className="w-3.5 h-3.5 text-slate-400" />
            <span>{supabaseConnected ? 'Supabase Cloud' : 'Penyimpanan Lokal'}</span>
          </div>

          {/* External Untan Link */}
          <a
            href="https://jurnal.untan.ac.id/index.php/jcskommipa"
            target="_blank"
            rel="noopener noreferrer"
            title="Kunjungi website OJS Untan asli"
            className="p-2 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <ExternalLink className="w-5 h-5" />
          </a>
        </div>
      </div>
    </header>
  );
};

