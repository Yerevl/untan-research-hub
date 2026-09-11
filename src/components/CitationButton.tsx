'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Article } from '@/lib/types';
import { generateApaCitation, generateIeeeCitation } from '@/lib/citation';
import { Quote, Check } from 'lucide-react';

interface CitationButtonProps {
  article: Article;
}

export const CitationButton: React.FC<CitationButtonProps> = ({ article }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeFormat, setActiveFormat] = useState<'APA' | 'IEEE' | null>(null);
  const [copiedFormat, setCopiedFormat] = useState<'APA' | 'IEEE' | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const flyoutRef = useRef<HTMLDivElement>(null);
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

      if (typeof window !== 'undefined' && window.navigator && window.navigator.vibrate) {
        window.navigator.vibrate([20, 30, 20]);
      }

      setTimeout(() => {
        setCopiedFormat(null);
        setToastMessage(null);
      }, 2500);
    },
    [article]
  );

  // Hit-test coordinates against the two side options
  const checkHoveredOption = useCallback((clientX: number, clientY: number) => {
    if (!flyoutRef.current) return null;

    const flyoutRect = flyoutRef.current.getBoundingClientRect();
    // Generous bounding area horizontally around the flyout
    if (
      clientX < flyoutRect.left - 15 ||
      clientX > flyoutRect.right + 25 ||
      clientY < flyoutRect.top - 15 ||
      clientY > flyoutRect.bottom + 15
    ) {
      return null;
    }

    // Check vertical midpoint to distinguish between top (APA) and bottom (IEEE)
    const midY = flyoutRect.top + flyoutRect.height / 2;
    if (clientY < midY) {
      return 'APA';
    } else {
      return 'IEEE';
    }
  }, []);

  const handlePointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0) return;

    startPosRef.current = { x: e.clientX, y: e.clientY };
    isDraggingRef.current = false;

    // Start hold detection timer (150ms)
    pressTimerRef.current = setTimeout(() => {
      isDraggingRef.current = true;
      setIsOpen(true);
      if (typeof window !== 'undefined' && window.navigator && window.navigator.vibrate) {
        window.navigator.vibrate(15);
      }
    }, 150);
  };

  useEffect(() => {
    const handleGlobalPointerMove = (e: PointerEvent) => {
      if (!isDraggingRef.current) {
        const dist = Math.hypot(e.clientX - startPosRef.current.x, e.clientY - startPosRef.current.y);
        if (dist > 7 && pressTimerRef.current) {
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
        const selected = checkHoveredOption(e.clientX, e.clientY);
        if (selected) {
          copyCitation(selected);
        } else {
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

  const handleClick = () => {
    if (!isDraggingRef.current) {
      setIsOpen((prev) => !prev);
    }
  };

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
        <div className="absolute -top-9 left-0 whitespace-nowrap z-50 px-2.5 py-1 bg-[#A3E635] text-black border-2 border-black shadow-[2px_2px_0px_0px_#000] text-[11px] font-black uppercase tracking-wider animate-in fade-in zoom-in-95 duration-150">
          ✓ {toastMessage}
        </div>
      )}

      {/* Side Hold-and-Drag / Click Menu Flyout */}
      {isOpen && (
        <div
          ref={flyoutRef}
          className="absolute left-full ml-1.5 top-1/2 -translate-y-1/2 z-50 flex flex-col border-[2.5px] border-black dark:border-white bg-white dark:bg-[#181B20] shadow-[4px_4px_0px_0px_#000] dark:shadow-[4px_4px_0px_0px_#fff] -skew-y-6 origin-left animate-in fade-in slide-in-from-left-2 duration-150 overflow-hidden"
        >
          {/* APA Option (Top) */}
          <button
            ref={apaBtnRef}
            type="button"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={() => copyCitation('APA')}
            className={`px-3.5 py-1.5 font-black text-xs uppercase border-b-2 border-black dark:border-white transition-all duration-100 flex items-center justify-center min-w-[70px] ${
              activeFormat === 'APA'
                ? 'bg-[#F472B6] text-black scale-105'
                : 'bg-white dark:bg-black text-black dark:text-white hover:bg-[#F472B6] hover:text-black'
            }`}
          >
            <span className="skew-y-6 inline-block">APA</span>
          </button>

          {/* IEEE Option (Bottom) */}
          <button
            ref={ieeeBtnRef}
            type="button"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={() => copyCitation('IEEE')}
            className={`px-3.5 py-1.5 font-black text-xs uppercase transition-all duration-100 flex items-center justify-center min-w-[70px] ${
              activeFormat === 'IEEE'
                ? 'bg-[#38BDF8] text-black scale-105'
                : 'bg-white dark:bg-black text-black dark:text-white hover:bg-[#38BDF8] hover:text-black'
            }`}
          >
            <span className="skew-y-6 inline-block">IEEE</span>
          </button>
        </div>
      )}

      {/* Main Trigger Button */}
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
        title="Klik atau Tahan & Geser (Hold & Drag) ke kanan untuk memilih format APA atau IEEE"
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