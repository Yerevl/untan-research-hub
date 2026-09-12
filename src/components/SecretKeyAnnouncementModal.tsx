'use client';

import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Key, Copy, Check, Sparkles, CheckCircle2, ArrowRight } from 'lucide-react';

interface SecretKeyAnnouncementModalProps {
  isOpen: boolean;
  secretKey: string;
  onClose: () => void;
}

export const SecretKeyAnnouncementModal: React.FC<SecretKeyAnnouncementModalProps> = ({
  isOpen,
  secretKey,
  onClose,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen || !secretKey) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(secretKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        transition={{ type: 'spring', damping: 25, stiffness: 450 }}
        className="relative w-full max-w-sm sm:max-w-md bg-white dark:bg-[#181B22] border-[3px] border-black dark:border-white shadow-[8px_8px_0px_0px_#16181D] dark:shadow-[8px_8px_0px_0px_#D4D4D8] p-5 sm:p-6 text-center select-none"
      >
        <div className="w-14 h-14 mx-auto mb-3 bg-[#FEF08A] text-black border-2 border-black shadow-none flex items-center justify-center -rotate-2">
          <Key className="w-7 h-7 stroke-[2.5]" />
        </div>

        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-[#A3E635] text-black text-[11px] font-black uppercase border border-black shadow-none mb-2.5">
          <Sparkles className="w-3.5 h-3.5 stroke-[2.5]" />
          <span>Artikel Berhasil Disimpan</span>
        </div>

        <h3 className="text-lg font-black text-black dark:text-white uppercase leading-snug mb-1.5">
          Kode Rahasia untuk Buka di HP
        </h3>

        <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mb-4">
          Mau buka artikel yang kamu simpan ini di HP atau laptop lain? Cukup ketik 4 kata ini:
        </p>

        {/* 4-Word Box (Non-button: flat container, no shadow) */}
        <div className="bg-[#FEF08A] dark:bg-yellow-400 border-2 border-black shadow-none p-3 mb-3.5">
          <code className="block font-mono font-black text-base sm:text-lg text-black tracking-wide break-all select-all">
            {secretKey}
          </code>
        </div>

        {/* Copy Button */}
        <button
          onClick={handleCopy}
          className="w-full py-2.5 px-3 mb-4 text-xs font-black uppercase tracking-wider bg-black text-white dark:bg-yellow-400 dark:text-black border-2 border-black shadow-[2px_2px_0px_0px_#16181D] dark:shadow-[2px_2px_0px_0px_#D4D4D8] active:translate-x-0.5 active:translate-y-0.5 transition-all flex items-center justify-center gap-1.5"
        >
          {copied ? (
            <>
              <Check className="w-4 h-4 text-emerald-400 dark:text-black stroke-[3]" />
              <span>KODE BERHASIL DISALIN!</span>
            </>
          ) : (
            <>
              <Copy className="w-4 h-4 stroke-[2.5]" />
              <span>SALIN 4 KATA INI</span>
            </>
          )}
        </button>

        {/* Helpful Tip */}
        <p className="text-[11px] text-slate-500 mb-4 text-center">
          💡 Kamu bisa melihat atau menyalin kode ini lagi kapan saja lewat tombol <strong>KOLEKSI</strong> di layar.
        </p>

        {/* Dismiss Button */}
        <button
          onClick={onClose}
          className="w-full py-2.5 px-4 text-xs font-black uppercase tracking-wider bg-[#38BDF8] text-black border-2 border-black shadow-[2px_2px_0px_0px_#16181D] hover:bg-[#0284C7] hover:text-white active:translate-x-0.5 active:translate-y-0.5 transition-all flex items-center justify-center gap-1"
        >
          <span>OKE, SAYA MENGERTI</span>
          <ArrowRight className="w-4 h-4 stroke-[3]" />
        </button>
      </motion.div>
    </div>
  );
};
