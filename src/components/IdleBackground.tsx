'use client';

import React from 'react';

export const IdleBackground: React.FC = () => {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden select-none"
    >
      {/* Container for Ambient Glow Orbs with smooth theme transitions */}
      <div className="absolute inset-0 transition-opacity duration-700 opacity-90 dark:opacity-85">
        {/* =========================================================================
            ORB 1 (Top-Left / Header Aura)
            Light: Warm Golden Amber & Honey glow (evokes warm academic sunlight)
            Dark: Electric Sky Blue & Neon Cyan glow (high-tech cybernetic radiance)
           ========================================================================= */}
        <div
          className="absolute -top-24 -left-20 sm:-top-32 sm:-left-32 w-[380px] h-[380px] sm:w-[560px] sm:h-[560px] lg:w-[680px] lg:h-[680px] rounded-full 
          bg-gradient-to-br from-[#FDE047]/35 via-[#F59E0B]/22 to-transparent 
          dark:from-[#0284C7]/30 dark:via-[#0EA5E9]/18 dark:to-transparent 
          blur-[90px] sm:blur-[120px] lg:blur-[150px] animate-aurora-1"
        />

        {/* =========================================================================
            ORB 2 (Bottom-Right / Deep Catalog Base)
            Light: Soft Sky Blue & Lavender Mist
            Dark: Deep Cosmic Indigo & Royal Violet (adds incredible depth to dark mode)
           ========================================================================= */}
        <div
          className="absolute -bottom-28 -right-20 sm:-bottom-40 sm:-right-32 w-[400px] h-[400px] sm:w-[600px] sm:h-[600px] lg:w-[740px] lg:h-[740px] rounded-full 
          bg-gradient-to-tl from-[#38BDF8]/30 via-[#818CF8]/20 to-transparent 
          dark:from-[#6366F1]/30 dark:via-[#8B5CF6]/18 dark:to-transparent 
          blur-[100px] sm:blur-[130px] lg:blur-[160px] animate-aurora-2"
        />

        {/* =========================================================================
            ORB 3 (Mid-Right / Article Cards Center)
            Light: Soft Peach Blossom & Warm Rose
            Dark: Neon Orchid & Cyber Magenta (subtle accent behind search filters)
           ========================================================================= */}
        <div
          className="absolute top-1/3 -right-16 sm:right-[10%] w-[320px] h-[320px] sm:w-[480px] sm:h-[480px] lg:w-[560px] lg:h-[560px] rounded-full 
          bg-gradient-to-bl from-[#F472B6]/24 via-[#FDA4AF]/16 to-transparent 
          dark:from-[#EC4899]/20 dark:via-[#D946EF]/14 dark:to-transparent 
          blur-[85px] sm:blur-[115px] lg:blur-[140px] animate-aurora-3"
        />

        {/* =========================================================================
            ORB 4 (Mid-Left / Lateral Floating Accent)
            Light: Gentle Fresh Mint & Spring Sage (calming paper contrast)
            Dark: Aurora Borealis Emerald & Deep Aquamarine
           ========================================================================= */}
        <div
          className="absolute top-2/3 -left-16 sm:left-[5%] w-[300px] h-[300px] sm:w-[440px] sm:h-[440px] lg:w-[520px] lg:h-[520px] rounded-full 
          bg-gradient-to-tr from-[#34D399]/22 via-[#38BDF8]/14 to-transparent 
          dark:from-[#10B981]/18 dark:via-[#06B6D4]/14 dark:to-transparent 
          blur-[80px] sm:blur-[110px] lg:blur-[135px] animate-aurora-4"
        />
      </div>

      {/* Subtle Ambient Vignette to softly frame viewport edges */}
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_center,transparent_60%,rgba(0,0,0,0.03)_100%)] dark:bg-[radial-gradient(ellipse_at_center,transparent_55%,rgba(0,0,0,0.35)_100%)]" />
    </div>
  );
};
