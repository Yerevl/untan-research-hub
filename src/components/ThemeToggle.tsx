'use client';

import React, { useEffect, useState } from 'react';
import { Sun, Moon } from 'lucide-react';
import { motion } from 'motion/react';

export const ThemeToggle: React.FC = () => {
  const [isDark, setIsDark] = useState<boolean>(false);
  const [mounted, setMounted] = useState<boolean>(false);

  useEffect(() => {
    setMounted(true);
    // Determine initial theme
    const savedTheme = localStorage.getItem('theme');
    const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const initialDark = savedTheme ? savedTheme === 'dark' : systemDark;

    setIsDark(initialDark);
    if (initialDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  const toggleTheme = () => {
    const nextDark = !isDark;
    setIsDark(nextDark);

    if (nextDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  // Prevent hydration mismatch
  if (!mounted) {
    return (
      <div className="w-[74px] h-[30px] border-2 border-black dark:border-white bg-[#EAE5DA] dark:bg-[#181B20] opacity-50" />
    );
  }

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="relative flex items-center justify-between w-[76px] h-[32px] p-1 border-2 border-black dark:border-white bg-[#EAE5DA] dark:bg-[#181B20] shadow-[2.5px_2.5px_0px_0px_#16181D] dark:shadow-[2.5px_2.5px_0px_0px_#D4D4D8] active:translate-x-0.5 active:translate-y-0.5 transition-all select-none cursor-pointer"
      title={isDark ? 'Ganti ke Mode Terang (Light Mode)' : 'Ganti ke Mode Gelap (Dark Mode)'}
      aria-label="Toggle dark/light theme"
    >
      {/* Background Track Indicators */}
      <span
        className={`text-[9px] font-black uppercase tracking-wider pl-1.5 transition-opacity ${
          isDark ? 'text-slate-400 opacity-100' : 'opacity-0'
        }`}
      >
        DARK
      </span>

      <span
        className={`text-[9px] font-black uppercase tracking-wider pr-1.5 transition-opacity ${
          !isDark ? 'text-slate-600 opacity-100' : 'opacity-0'
        }`}
      >
        LIGHT
      </span>

      {/* Sliding Tactile Knob */}
      <motion.div
        layout
        transition={{ type: 'spring', stiffness: 500, damping: 28 }}
        className={`absolute top-[2.5px] w-[28px] h-[23px] border-2 border-black flex items-center justify-center shadow-[1px_1px_0px_0px_#16181D] ${
          isDark
            ? 'right-[3px] bg-[#38BDF8] text-black'
            : 'left-[3px] bg-[#FACC15] text-black'
        }`}
      >
        {isDark ? (
          <Moon className="w-3.5 h-3.5 stroke-[2.5] fill-black" />
        ) : (
          <Sun className="w-3.5 h-3.5 stroke-[2.5] fill-yellow-400" />
        )}
      </motion.div>
    </button>
  );
};
