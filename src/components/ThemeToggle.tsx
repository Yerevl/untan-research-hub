'use client';

import React, { useEffect, useState } from 'react';
import { Sun, Moon } from 'lucide-react';
import { motion } from 'motion/react';

export const ThemeToggle: React.FC = () => {
  const [isDark, setIsDark] = useState<boolean>(false);
  const [mounted, setMounted] = useState<boolean>(false);

  useEffect(() => {
    setMounted(true);
    const savedTheme = localStorage.getItem('theme');
    const hasDarkClass = document.documentElement.classList.contains('dark');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const initialDark = savedTheme ? savedTheme === 'dark' : hasDarkClass || prefersDark;

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

  if (!mounted) {
    return (
      <div className="w-[82px] h-[34px] border-2 border-black dark:border-white bg-[#E5DFD3] dark:bg-[#252B37] opacity-60" />
    );
  }

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="relative flex items-center justify-between w-[84px] h-[34px] px-2 border-2 border-black dark:border-white bg-[#E5DFD3] dark:bg-[#252B37] shadow-[2.5px_2.5px_0px_0px_#16181D] dark:shadow-[2.5px_2.5px_0px_0px_#D4D4D8] active:translate-x-0.5 active:translate-y-0.5 transition-all select-none cursor-pointer"
      title={isDark ? 'Beralih ke Mode Terang (Light Mode)' : 'Beralih ke Mode Gelap (Dark Mode)'}
      aria-label="Toggle theme mode"
    >
      {/* Label under sliding knob */}
      <span
        className={`text-[10px] font-black uppercase tracking-wider transition-all duration-150 ${
          isDark ? 'text-white font-extrabold opacity-100' : 'opacity-0'
        }`}
      >
        DARK
      </span>

      <span
        className={`text-[10px] font-black uppercase tracking-wider transition-all duration-150 ${
          !isDark ? 'text-black font-extrabold opacity-100 ml-auto' : 'opacity-0'
        }`}
      >
        LIGHT
      </span>

      {/* Tactile Sliding Knob */}
      <motion.div
        layout
        transition={{ type: 'spring', stiffness: 550, damping: 26 }}
        className={`absolute top-[3px] w-[30px] h-[24px] border-2 border-black flex items-center justify-center shadow-[1.5px_1.5px_0px_0px_#16181D] ${
          isDark
            ? 'right-[4px] bg-[#38BDF8] text-black'
            : 'left-[4px] bg-[#FACC15] text-black'
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
