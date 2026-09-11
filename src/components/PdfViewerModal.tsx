'use client';

import React, { useEffect } from 'react';
import { Article } from '@/lib/types';
import { X, Download, ExternalLink, FileText } from 'lucide-react';

interface PdfViewerModalProps {
  article: Article | null;
  onClose: () => void;
}

export const PdfViewerModal: React.FC<PdfViewerModalProps> = ({ article, onClose }) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (article) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = 'auto';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [article, onClose]);

  if (!article) return null;

  const pdfUrl = article.storage_pdf_url || article.original_pdf_url || '';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-black/70 backdrop-blur-[2px] animate-in fade-in duration-150">
      <div className="relative w-full max-w-5xl h-[92vh] bg-white dark:bg-[#181B20] border-[3px] border-black dark:border-white shadow-[10px_10px_0px_0px_#16181D] dark:shadow-[10px_10px_0px_0px_#D4D4D8] flex flex-col overflow-hidden">
        {/* Retro Window Titlebar */}
        <div className="flex items-center justify-between px-5 py-3 border-b-[3px] border-black dark:border-white bg-[#FACC15] text-black">
          <div className="flex items-center space-x-3 overflow-hidden mr-3">
            <div className="p-1 bg-white border-2 border-black shadow-[2px_2px_0px_0px_#16181D] shrink-0">
              <FileText className="w-4 h-4 stroke-[2.5]" />
            </div>
            <div className="overflow-hidden">
              <h4 className="text-sm sm:text-base font-black truncate uppercase tracking-tight">
                {article.title}
              </h4>
              <p className="text-[11px] font-bold text-slate-800 truncate font-mono">
                {article.student ? `Mhs: ${article.student}` : ''} • {article.issue_name || 'Jurnal Untan'}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 shrink-0">
            {pdfUrl && (
              <>
                <a
                  href={pdfUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1.5 bg-white text-black border-2 border-black shadow-[2px_2px_0px_0px_#16181D] hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all"
                  title="Buka tab baru"
                >
                  <ExternalLink className="w-4 h-4 stroke-[2.5]" />
                </a>
                <a
                  href={`/api/download?url=${encodeURIComponent(pdfUrl)}&title=${encodeURIComponent(article.title)}`}
                  className="inline-flex items-center space-x-1 px-3 py-1.5 bg-[#A3E635] text-black border-2 border-black shadow-[2px_2px_0px_0px_#16181D] hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0.5 active:translate-y-0.5 active:shadow-none text-xs font-black uppercase transition-all"
                  title={`Unduh: ${article.title}`}
                >
                  <Download className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span className="hidden sm:inline">UNDUH PDF</span>
                </a>
              </>
            )}
            <button
              onClick={onClose}
              className="p-1.5 bg-[#FB7185] hover:bg-[#F43F5E] text-black border-2 border-black shadow-[2px_2px_0px_0px_#16181D] hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all"
              title="Tutup (ESC)"
            >
              <X className="w-4 h-4 stroke-[3]" />
            </button>
          </div>
        </div>

        {/* Modal Body / PDF Viewer Frame */}
        <div className="flex-1 w-full bg-slate-200 dark:bg-slate-900 relative overflow-hidden">
          {pdfUrl ? (
            <iframe
              src={`${pdfUrl}#toolbar=1`}
              className="w-full h-full border-0"
              title={`PDF viewer: ${article.title}`}
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-full p-8 text-center">
              <FileText className="w-12 h-12 mb-3 text-black dark:text-white stroke-[2]" />
              <p className="text-sm font-black uppercase">Dokumen PDF belum tersedia di penyimpanan.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
