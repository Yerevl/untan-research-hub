'use client';

import React from 'react';

export const IdleBackground: React.FC = () => {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden select-none"
    >
      {/* Drifting Academic Grid Pattern Layer */}
      <div className="absolute inset-[-60px] bg-academic-grid animate-ambient-drift opacity-80" />

      {/* Subtle Floating Corner Crosshairs & Geometric Accents */}
      <div className="hidden lg:block">
        {/* Top Left Accent */}
        <div className="absolute top-24 left-8 text-[11px] font-mono font-bold text-black/15 dark:text-white/10 animate-gentle-float">
          + LAT: 0.0571° S
        </div>

        {/* Top Right Accent */}
        <div className="absolute top-28 right-10 text-[11px] font-mono font-bold text-black/15 dark:text-white/10 animate-gentle-float" style={{ animationDelay: '4s' }}>
          + LON: 109.3425° E
        </div>

        {/* Bottom Left Accent */}
        <div className="absolute bottom-20 left-10 text-[12px] font-mono font-bold text-black/15 dark:text-white/10 animate-gentle-float" style={{ animationDelay: '8s' }}>
          [ UNTAN • CS/IS ]
        </div>

        {/* Bottom Right Accent */}
        <div className="absolute bottom-24 right-12 text-[14px] font-mono font-bold text-black/15 dark:text-white/10 animate-gentle-float" style={{ animationDelay: '12s' }}>
          ◇ REPO // ARCHIVE
        </div>
      </div>
    </div>
  );
};
