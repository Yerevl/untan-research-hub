'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Article } from '@/lib/types';
import { generateApaCitation, generateIeeeCitation } from '@/lib/citation';
import { Quote, Check, Sparkles } from 'lucide-react';

interface CitationButtonProps {
  article: Article;
}

export const CitationButton: React.FC<CitationButtonProps> = ({ article }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeFormat, setActiveFormat] = useState<'APA' | 'IEEE' | null>(null);
  const [copiedFormat, setCopiedFormat] = useState<'APA' | 'IEEE' | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const apaBtnRef = useRef<HTMLButtonElement>(null);
  const ieeeBtnRef = useRef<HTMLButtonElement>(null);

  const isDraggingRef = useRef(false);
  const pressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const startPosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  const copyCitation = useCallback(
    async (format: 'APA' | 'IEEE') => {
      const citationText =
        format === 'APA' ? generateApaCitation(article) : generateIeeeCitation(article);

      try {
        await navigator.clipboard.writeText(citationText);
      } catch {
        // Fallback for older browsers
        const textarea = document.createElement('textarea');
        textarea.value = citationText;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }

      setCopiedFormat(format);
      setToastMessage(`Sitasi ${format} disalin!`);
      setIsOpen(false);
      setActiveFormat(null);

      // Trigger subtle haptic on mobile if supported
      if (typeof window !== 'undefined' && window.navigator && window.navigator.vibrate) {
        window.navigator.vibrate([25, 40, 25]);
      }

      setTimeout(() => {
        setCopiedFormat(null);
        setToastMessage(null);
      }, 2500);
    },
    [article]
  );

  // Hit test coordinates against the flyout options
  const checkHoveredOption = useCallback((clientX: number, clientY: number) => {
    if (apaBtnRef.current) {
      const rect = apaBtnRef.current.getBoundingClientRect();
      if (
        clientX >= rect.left - 10 &&
        clientX <= rect.right + 10 &&
        clientY >= rect.top - 10 &&
        clientY <= rect.bottom + 10
      ) {
        return 'APA';
      }
    }
    if (ieeeBtnRef.current) {
      const rect = ieeeBtnRef.current.getBoundingClientRect();
      if (
        clientX >= rect.left - 10 &&
        clientX <= rect.right + 10 &&
        clientY >= rect.top - 10 &&
        clientY <= rect.bottom + 10
      ) {
        return 'IEEE';
      }
    }
    return null;
  }, []);

  const handlePointerDown = (e: React.PointerEvent) => {
    // Only handle primary button (left mouse click or touch)
    if (e.button !== 0) return;

    startPosRef.current = { x: e.clientX, y: e.clientY };
    isDraggingRef.current = false;

    // Start hold detection timer (180ms)
    pressTimerRef.current = setTimeout(() => {
      isDraggingRef.current = true;
      setIsOpen(true);
      if (typeof window !== 'undefined' && window.navigator && window.navigator.vibrate) {
        window.navigator.vibrate(15);
      }
    }, 180);
  };

  useEffect(() => {
    const handleGlobalPointerMove = (e: PointerEvent) => {
      if (!isDraggingRef.current) {
        // If moved more than 8px before timer expires, treat as immediate drag
        const dist = Math.hypot(e.clientX - startPosRef.current.x, e.clientY - startPosRef.current.y);
        if (dist > 8 && pressTimerRef.current) {
          clearTimeout(pressTimerRef.current);
          isDraggingRef.current = true;
          setIsOpen(true);
        }
      }

      if (isDraggingRef.current) {
        const hovered = checkHoveredOption(e.clientX, e.clientY);
        setActiveFormat((prev) => {
          if (prev !== hovered && hovered) {
            if (typeof window !== 'undefined' && window.navigator && window.navigator.vibrate) {
              window.navigator.vibrate(10);
            }
          }
          return hovered;
        });
      }
    };

    const handleGlobalPointerUp = (e: PointerEvent) => {
      if (pressTimerRef.current) {
        clearTimeout(pressTimerRef.current);
        pressTimerRef.current = null;
      }

      if (isDraggingRef.current) {
        // Drag release
        const selected = checkHoveredOption(e.clientX, e.clientY);
        if (selected) {
          copyCitation(selected);
        } else {
          // Released outside: close menu
          setIsOpen(false);
          setActiveFormat(null);
        }
        isDraggingRef.current = false;
      }
    };

    const handleGlobalPointerCancel = () => {
      if (pressTimerRef.current) {
        clearTimeout(pressTimerRef.current);
        pressTimerRef.current = null;
      }
      isDraggingRef.current = false;
      setActiveFormat(null);
    };

    window.addEventListener('pointermove', handleGlobalPointerMove);
    window.addEventListener('pointerup', handleGlobalPointerUp);
    window.addEventListener('pointercancel', handleGlobalPointerCancel);

    return () => {
      window.removeEventListener('pointermove', handleGlobalPointerMove);
      window.removeEventListener('pointerup', handleGlobalPointerUp);
      window.removeEventListener('pointercancel', handleGlobalPointerCancel);
    };
  }, [checkHoveredOption, copyCitation]);

  // Click handler for standard tap without dragging
  const handleClick = () => {
    // If it was not a drag release, toggle the menu
    if (!isDraggingRef.current) {
      setIsOpen((prev) => !prev);
    }
  };

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setActiveFormat(null);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div ref={containerRef} className="relative inline-block select-none touch-none">
      {/* Toast Feedback */}
      {toastMessage && (
        <div className="absolute -top-10 left-0 whitespace-nowrap z-50 px-2.5 py-1 bg-[#A3E635] text-black border-2 border-black shadow-[2px_2px_0px_0px_#000] text-[11px] font-black uppercase tracking-wider animate-in fade-in zoom-in-95 duration-150">
          ✓ {toastMessage}
        </div>
      )}

      {/* Hold-and-Drag / Click Menu Flyout */}
      {isOpen && (
        <div
          className="absolute bottom-full mb-3 left-0 z-50 flex flex-col p-2 bg-white dark:bg-[#181B20] border-[2.5px] border-black dark:border-white shadow-[5px_5px_0px_0px_#000] dark:shadow-[5px_5px_0px_0px_#fff] animate-in fade-in slide-in-from-bottom-2 duration-150 min-w-[200px]"
        >
          {/* Header Hint */}
          <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b-2 border-dashed border-black/20 dark:border-white/20 text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
            <span className="flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-[#FACC15] stroke-[2.5]" />
              PILIH FORMAT SITASI
            </span>
            <span className="font-mono text-[9px]">HOLD &amp; DRAG</span>
          </div>

          {/* Options Row */}
          <div className="flex items-center gap-2">
            {/* APA Option */}
            <button
              ref={apaBtnRef}
              type="button"
              onPointerDown={(e) => e.stopPropagation()}
              onClick={() => copyCitation('APA')}
              className={`flex-1 flex flex-col items-center justify-center p-2 border-2 border-black dark:border-white font-black text-xs uppercase transition-all duration-100 ${
                activeFormat === 'APA'
                  ? 'bg-[#F472B6] text-black shadow-[3px_3px_0px_0px_#000] scale-105 -translate-y-1'
                  : 'bg-[#FFFDF5] dark:bg-black text-black dark:text-white shadow-[1.5px_1.5px_0px_0px_#000] dark:shadow-[1.5px_1.5px_0px_0px_#fff] hover:bg-[#F472B6] hover:text-black'
              }`}
            >
              <span className="text-xs">APA 7th</span>
              <span className="text-[9px] font-mono font-medium opacity-80 mt-0.5">SISFO</span>
            </button>

            {/* IEEE Option */}
            <button
              ref={ieeeBtnRef}
              type="button"
              onPointerDown={(e) => e.stopPropagation()}
              onClick={() => copyCitation('IEEE')}
              className={`flex-1 flex flex-col items-center justify-center p-2 border-2 border-black dark:border-white font-black text-xs uppercase transition-all duration-100 ${
                activeFormat === 'IEEE'
                  ? 'bg-[#38BDF8] text-black shadow-[3px_3px_0px_0px_#000] scale-105 -translate-y-1'
                  : 'bg-[#FFFDF5] dark:bg-black text-black dark:text-white shadow-[1.5px_1.5px_0px_0px_#000] dark:shadow-[1.5px_1.5px_0px_0px_#fff] hover:bg-[#38BDF8] hover:text-black'
              }`}
            >
              <span className="text-xs">IEEE</span>
              <span className="text-[9px] font-mono font-medium opacity-80 mt-0.5">SISKOM</span>
            </button>
          </div>
        </div>
      )}

      {/* Main Hold-and-Drag Trigger Button */}
      <button
        type="button"
        onPointerDown={handlePointerDown}
        onClick={handleClick}
        className={`inline-flex items-center space-x-1.5 px-3 py-2 border-2 border-black dark:border-white font-black text-xs uppercase tracking-wide transition-all active:translate-x-0.5 active:translate-y-0.5 ${
          copiedFormat
            ? 'bg-[#A3E635] text-black shadow-[3px_3px_0px_0px_#000]'
            : isOpen
            ? 'bg-[#FEF08A] text-black shadow-[3px_3px_0px_0px_#000]'
            : 'bg-white dark:bg-black text-black dark:text-white shadow-[3px_3px_0px_0px_#000] dark:shadow-[3px_3px_0px_0px_#fff] hover:bg-[#FEF08A] hover:text-black'
        }`}
        title="Klik atau Tahan & Geser (Hold & Drag) untuk menyalin sitasi APA atau IEEE"
      >
        {copiedFormat ? (
          <>
            <Check className="w-3.5 h-3.5 stroke-[3]" />
            <span>{copiedFormat} ✓</span>
          </>
        ) : (
          <>
            <Quote className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>KUTIP</span>
          </>
        )}
      </button>
    </div>
  );
};
