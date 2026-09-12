'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Key, Copy, Check, Sparkles, ShieldCheck, ArrowRight } from 'lucide-react';

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
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <motion.div
        initial={{ scale: 0.88, opacity: 0, y: 25 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.88, opacity: 0, y: 25 }}
        transition={{ type: 'spring', damping: 24, stiffness: 400 }}
        className="relative w-full max-w-md bg-white dark:bg-[#1A1F29] border-[3.5px] border-black dark:border-white shadow-[10px_10px_0px_0px_#16181D] dark:shadow-[10px_10px_0px_0px_#D4D4D8] p-6 text-center select-none"
      >
        {/* Celebration Header Graphic */}
        <div className="w-16 h-16 mx-auto mb-4 bg-[#FEF08A] text-black border-3 border-black shadow-[4px_4px_0px_0px_#16181D] flex items-center justify-center -rotate-3">
          <Key className="w-8 h-8 stroke-[2.5]" />
        </div>

        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#A3E635] text-black text-xs font-black uppercase tracking-wider border-2 border-black shadow-[2px_2px_0px_0px_#16181D] mb-3">
          <Sparkles className="w-3.5 h-3.5 stroke-[2.5]" />
          <span>Koleksi Rahasia Dibuat</span>
        </div>

        <h3 className="text-xl font-black text-black dark:text-white uppercase leading-tight mb-2">
          Kunci Rahasia Brankas Anda
        </h3>

        <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mb-4">
          Artikel pertama Anda berhasil disimpan! Ini adalah <strong>4 kata rahasia unik</strong> Anda. 
          Gunakan untuk mengakses koleksi skripsi ini di HP atau perangkat lain tanpa perlu akun/password:
        </p>

        {/* The 4-word Slang Passphrase Box */}
        <div className="bg-[#FEF08A] border-3 border-black shadow-[4px_4px_0px_0px_#16181D] p-3.5 mb-4">
          <code className="block font-mono font-black text-lg sm:text-xl text-black tracking-wider break-all select-all">
            {secretKey}
          </code>
        </div>

        {/* Copy Button */}
        <button
          onClick={handleCopy}
          className="w-full py-2.5 px-4 mb-4 text-xs font-black uppercase tracking-wider bg-black text-white dark:bg-yellow-400 dark:text-black border-2 border-black shadow-[3px_3px_0px_0px_#16181D] dark:shadow-[3px_3px_0px_0px_#D4D4D8] hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0 active:translate-y-0 transition-all flex items-center justify-center gap-2"
        >
          {copied ? (
            <>
              <Check className="w-4 h-4 text-emerald-400 dark:text-black stroke-[3]" />
              <span>KUNCI BERHASIL DISALIN!</span>
            </>
          ) : (
            <>
              <Copy className="w-4 h-4 stroke-[2.5]" />
              <span>SALIN KUNCI 4 KATA</span>
            </>
          )}
        </button>

        {/* Security Note */}
        <div className="flex items-start gap-2 p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-left text-[11px] text-slate-600 dark:text-slate-400 mb-5">
          <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
          <span>
            Perangkat ini terdaftar sebagai <strong>Perangkat Utama</strong>. Anda dapat melihat kunci kapan saja melalui tombol <strong>KOLEKSI</strong> di layar.
          </span>
        </div>

        {/* Dismiss Button */}
        <button
          onClick={onClose}
          className="w-full py-3 px-4 text-xs font-black uppercase tracking-wider bg-[#38BDF8] text-black border-2 border-black shadow-[3px_3px_0px_0px_#16181D] hover:bg-[#0284C7] hover:text-white active:translate-x-0.5 active:translate-y-0.5 transition-all flex items-center justify-center gap-1.5"
        >
          <span>SAYA MENGERTI & LANJUTKAN</span>
          <ArrowRight className="w-4 h-4 stroke-[3]" />
        </button>
      </motion.div>
    </div>
  );
};

