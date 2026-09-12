'use client';

import React from 'react';

export const IdleBackground: React.FC = () => {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden select-none"
    >
      {/* Drifting Diagonal Comic & Academic Grid Pattern (Visible & Dynamic) */}
      <div className="absolute inset-0 bg-comic-grid-light dark:bg-comic-grid-dark animate-comic-grid opacity-90 dark:opacity-80" />

      {/* Floating Retro Academic / Comic Floating Symbols in the margins */}
      <div className="hidden md:block">
        {/* Top Left Accent */}
        <div className="absolute top-24 left-6 text-xs font-mono font-black text-black/25 dark:text-[#38BDF8]/35 animate-gentle-float">
          + UNTAN • LAB CS/IS
        </div>

        {/* Top Right Accent */}
        <div
          className="absolute top-28 right-8 text-xs font-mono font-black text-black/25 dark:text-[#38BDF8]/35 animate-gentle-float"
          style={{ animationDelay: '3s' }}
        >
          ◇ REPO ARCHIVE 2026
        </div>

        {/* Mid Left Accent */}
        <div
          className="absolute top-1/2 left-4 -translate-y-1/2 text-xs font-mono font-black text-black/20 dark:text-[#A3E635]/30 animate-gentle-float"
          style={{ animationDelay: '6s' }}
        >
          [ 0.0571° S • 109.3425° E ]
        </div>

        {/* Mid Right Accent */}
        <div
          className="absolute top-1/2 right-4 -translate-y-1/2 text-xs font-mono font-black text-black/20 dark:text-[#F472B6]/30 animate-gentle-float"
          style={{ animationDelay: '9s' }}
        >
          [ JCSKOMMIPA • OJS ]
        </div>

        {/* Bottom Left Accent */}
        <div
          className="absolute bottom-16 left-8 text-xs font-mono font-black text-black/25 dark:text-white/25 animate-gentle-float"
          style={{ animationDelay: '5s' }}
        >
          ★ SISKOM &amp; SISFO
        </div>

        {/* Bottom Right Accent */}
        <div
          className="absolute bottom-16 right-10 text-xs font-mono font-black text-black/25 dark:text-white/25 animate-gentle-float"
          style={{ animationDelay: '8s' }}
        >
          ✦ SYSTEM READY
        </div>
      </div>
    </div>
  );
};
