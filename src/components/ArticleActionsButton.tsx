'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Article } from '@/lib/types';
import { FileText, Download, Bookmark, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ArticleActionsButtonProps {
  article: Article;
  isBookmarked?: boolean;
  onReadPdf: (article: Article) => void;
  onToggleBookmark?: (article: Article) => void;
  className?: string;
  size?: 'default' | 'sm';
}

type ActionOption = 'BACA' | 'UNDUH' | 'SIMPAN';

export const ArticleActionsButton: React.FC<ArticleActionsButtonProps> = ({
  article,
  isBookmarked = false,
  onReadPdf,
  onToggleBookmark,
  className = '',
  size = 'default',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeOption, setActiveOption] = useState<ActionOption | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isHolding, setIsHolding] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const flyoutRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);
  const pressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const startPosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  const pdfUrl = article.storage_pdf_url || article.original_pdf_url || '';

  const triggerAction = useCallback(
    (action: ActionOption) => {
      setIsOpen(false);
      setActiveOption(null);
      setIsHolding(false);

      if (typeof window !== 'undefined' && window.navigator && window.navigator.vibrate) {
        window.navigator.vibrate([20, 30, 20]);
      }

      if (action === 'BACA') {
        if (!pdfUrl) {
          setToastMessage('PDF belum tersedia');
        } else {
          onReadPdf(article);
          setToastMessage('Membuka PDF...');
        }
      } else if (action === 'UNDUH') {
        if (!pdfUrl) {
          setToastMessage('PDF belum tersedia');
        } else {
          const downloadUrl = `/api/download?url=${encodeURIComponent(pdfUrl)}&title=${encodeURIComponent(article.title)}`;
          const a = document.createElement('a');
          a.href = downloadUrl;
          a.download = `${article.title}.pdf`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          setToastMessage('Mengunduh PDF...');
        }
      } else if (action === 'SIMPAN') {
        if (onToggleBookmark) {
          onToggleBookmark(article);
          setToastMessage(isBookmarked ? 'Dihapus dari Koleksi' : 'Disimpan ke Koleksi!');
        }
      }

      setTimeout(() => {
        setToastMessage(null);
      }, 2500);
    },
    [article, pdfUrl, isBookmarked, onReadPdf, onToggleBookmark]
  );

  // Hit-test coordinates against 3 stacked options: BACA (top 1/3), UNDUH (middle 1/3), SIMPAN (bottom 1/3)
  const checkHoveredOption = useCallback((clientX: number, clientY: number): ActionOption | null => {
    if (!flyoutRef.current) return null;

    const flyoutRect = flyoutRef.current.getBoundingClientRect();
    if (
      clientX < flyoutRect.left - 15 ||
      clientX > flyoutRect.right + 25 ||
      clientY < flyoutRect.top - 15 ||
      clientY > flyoutRect.bottom + 15
    ) {
      return null;
    }

    const third = flyoutRect.height / 3;
    const relY = clientY - flyoutRect.top;

    if (relY < third) {
      return 'BACA';
    } else if (relY < third * 2) {
      return 'UNDUH';
    } else {
      return 'SIMPAN';
    }
  }, []);

  const handlePointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0) return;

    startPosRef.current = { x: e.clientX, y: e.clientY };
    isDraggingRef.current = false;

    // Start hold detection timer (150ms)
    pressTimerRef.current = setTimeout(() => {
      isDraggingRef.current = true;
      setIsHolding(true);
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
          setIsHolding(true);
          setIsOpen(true);
        }
      }

      if (isDraggingRef.current) {
        const hovered = checkHoveredOption(e.clientX, e.clientY);
        setActiveOption((prev) => {
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
      setIsHolding(false);

      if (isDraggingRef.current) {
        const selected = checkHoveredOption(e.clientX, e.clientY);
        if (selected) {
          triggerAction(selected);
        } else {
          // If released over trigger button, keep open for tap
          const containerRect = containerRef.current?.getBoundingClientRect();
          const inContainer =
            containerRect &&
            e.clientX >= containerRect.left &&
            e.clientX <= containerRect.right &&
            e.clientY >= containerRect.top &&
            e.clientY <= containerRect.bottom;

          if (!inContainer) {
            setIsOpen(false);
          }
        }
        isDraggingRef.current = false;
        setActiveOption(null);
      }
    };

    window.addEventListener('pointermove', handleGlobalPointerMove);
    window.addEventListener('pointerup', handleGlobalPointerUp);
    return () => {
      window.removeEventListener('pointermove', handleGlobalPointerMove);
      window.removeEventListener('pointerup', handleGlobalPointerUp);
    };
  }, [checkHoveredOption, triggerAction]);

  const handleClick = () => {
    if (!isDraggingRef.current) {
      setIsOpen((prev) => !prev);
    }
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setActiveOption(null);
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
    <div ref={containerRef} className={`relative inline-block select-none touch-none ${className}`}>
      {/* Toast Feedback */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.88 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.88 }}
            transition={{ type: 'spring', stiffness: 500, damping: 25 }}
            className="absolute -top-9 left-0 whitespace-nowrap z-50 px-2.5 py-1 bg-[#A3E635] text-black border-2 border-black shadow-[2px_2px_0px_0px_#16181D] text-[11px] font-black uppercase tracking-wider"
          >
            ✓ {toastMessage}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Side Hold-and-Drag / Click Menu Flyout (Neo-Brutalist 3-Option Stack) */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            ref={flyoutRef}
            initial={{ opacity: 0, scaleX: 0.4, x: 12, y: '-50%', skewY: -6 }}
            animate={{ opacity: 1, scaleX: 1, x: 0, y: '-50%', skewY: -6 }}
            exit={{ opacity: 0, scaleX: 0.4, x: 10, y: '-50%', skewY: -6 }}
            transition={{ type: 'spring', stiffness: 500, damping: 26 }}
            style={{ transformOrigin: 'left center' }}
            className="absolute left-full -ml-2.5 top-1/2 z-50 flex flex-col border-[2.5px] border-black dark:border-white bg-white dark:bg-[#181B20] shadow-[4px_4px_0px_0px_#16181D] dark:shadow-[4px_4px_0px_0px_#D4D4D8] overflow-hidden min-w-[100px]"
          >
            {/* 1. BACA Option (Top) */}
            <button
              type="button"
              onPointerDown={(e) => e.stopPropagation()}
              onClick={() => triggerAction('BACA')}
              className={`px-3 py-1.5 font-black text-xs uppercase border-b-2 border-black dark:border-white transition-all duration-100 flex items-center justify-start gap-1.5 ${
                activeOption === 'BACA'
                  ? 'bg-[#A3E635] text-black scale-105'
                  : 'bg-white dark:bg-black text-black dark:text-white hover:bg-[#A3E635] hover:text-black'
              }`}
            >
              <span className="skew-y-6 inline-flex items-center gap-1.5 font-black">
                <FileText className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>BACA</span>
              </span>
            </button>

            {/* 2. UNDUH Option (Middle) */}
            <button
              type="button"
              onPointerDown={(e) => e.stopPropagation()}
              onClick={() => triggerAction('UNDUH')}
              className={`px-3 py-1.5 font-black text-xs uppercase border-b-2 border-black dark:border-white transition-all duration-100 flex items-center justify-start gap-1.5 ${
                activeOption === 'UNDUH'
                  ? 'bg-[#38BDF8] text-black scale-105'
                  : 'bg-white dark:bg-black text-black dark:text-white hover:bg-[#38BDF8] hover:text-black'
              }`}
            >
              <span className="skew-y-6 inline-flex items-center gap-1.5 font-black">
                <Download className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>UNDUH</span>
              </span>
            </button>

            {/* 3. SIMPAN Option (Bottom) */}
            <button
              type="button"
              onPointerDown={(e) => e.stopPropagation()}
              onClick={() => triggerAction('SIMPAN')}
              className={`px-3 py-1.5 font-black text-xs uppercase transition-all duration-100 flex items-center justify-start gap-1.5 ${
                activeOption === 'SIMPAN'
                  ? 'bg-[#FEF08A] text-black scale-105'
                  : isBookmarked
                  ? 'bg-[#FEF08A]/70 text-black hover:bg-[#FEF08A]'
                  : 'bg-white dark:bg-black text-black dark:text-white hover:bg-[#FEF08A] hover:text-black'
              }`}
            >
              <span className="skew-y-6 inline-flex items-center gap-1.5 font-black">
                <Bookmark className={`w-3.5 h-3.5 stroke-[2.5] ${isBookmarked ? 'fill-black' : ''}`} />
                <span>{isBookmarked ? 'TERSIMPAN ★' : 'SIMPAN'}</span>
              </span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Trigger Button (Identical style & height to CitationButton) */}
      <button
        type="button"
        onPointerDown={handlePointerDown}
        onClick={handleClick}
        className={`w-full inline-flex items-center justify-center space-x-1.5 border-2 border-black dark:border-white font-black text-xs uppercase tracking-wide transition-all duration-150 active:translate-x-0.5 active:translate-y-0.5 ${
          size === 'sm' ? 'h-8 px-2.5 py-0' : 'px-3 py-2'
        } ${
          isHolding ? 'blur-[1.5px] opacity-70 scale-[0.98]' : 'blur-none opacity-100'
        } ${
          isBookmarked
            ? 'bg-[#FEF08A] text-black shadow-[3px_3px_0px_0px_#16181D]'
            : isOpen
            ? 'bg-[#FEF08A] text-black shadow-[3px_3px_0px_0px_#16181D]'
            : size === 'sm'
            ? 'bg-white dark:bg-black text-black dark:text-white shadow-[2px_2px_0px_0px_#16181D] dark:shadow-[2px_2px_0px_0px_#D4D4D8] hover:bg-[#FEF08A] hover:text-black'
            : 'bg-white dark:bg-black text-black dark:text-white shadow-[3px_3px_0px_0px_#16181D] dark:shadow-[3px_3px_0px_0px_#D4D4D8] hover:bg-[#FEF08A] hover:text-black'
        }`}
        title="Klik atau Tahan & Geser (Hold & Drag) untuk BACA, UNDUH, atau SIMPAN"
      >
        <FileText className="w-3.5 h-3.5 stroke-[2.5]" />
        <span>BACA PDF</span>
        {isBookmarked && <span className="font-bold text-amber-600">★</span>}
      </button>
    </div>
  );
};
