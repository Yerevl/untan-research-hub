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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-5xl h-[92vh] bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/80 backdrop-blur">
          <div className="flex items-center space-x-3 overflow-hidden mr-4">
            <div className="p-2 bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 rounded-lg shrink-0">
              <FileText className="w-5 h-5" />
            </div>
            <div className="overflow-hidden">
              <h4 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white truncate">
                {article.title}
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                {article.authors.join(', ')} • {article.issue_name || 'Jurnal Untan'}
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
                  className="p-2 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-800 rounded-lg transition-colors"
                  title="Buka di tab baru"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
                <a
                  href={pdfUrl}
                  download
                  className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium transition-colors"
                  title="Unduh file PDF"
                >
                  <Download className="w-4 h-4" />
                  <span className="hidden sm:inline">Unduh PDF</span>
                </a>
              </>
            )}
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body / PDF Viewer */}
        <div className="flex-1 w-full bg-slate-100 dark:bg-slate-950 relative overflow-hidden">
          {pdfUrl ? (
            <iframe
              src={`${pdfUrl}#toolbar=1`}
              className="w-full h-full border-0"
              title={`PDF viewer: ${article.title}`}
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-full p-8 text-center text-slate-500">
              <FileText className="w-12 h-12 mb-3 text-slate-400" />
              <p className="text-sm font-medium">Dokumen PDF tidak ditemukan untuk artikel ini.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

