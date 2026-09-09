'use client';

import React, { useState } from 'react';
import { Article } from '@/lib/types';
import {
  FileText,
  Download,
  Calendar,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Bookmark,
  GraduationCap,
  Briefcase,
  Building2,
  Cpu,
  Network,
  Server,
  Layers,
} from 'lucide-react';

interface ArticleCardProps {
  article: Article;
  onReadPdf: (article: Article) => void;
  onFilterDosen?: (dosenName: string) => void;
  onFilterKeahlian?: (keahlianName: string) => void;
}

export const ArticleCard: React.FC<ArticleCardProps> = ({
  article,
  onReadPdf,
  onFilterDosen,
  onFilterKeahlian,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  // Determine PDF URL
  const pdfUrl = article.storage_pdf_url || article.original_pdf_url || '';

  // Format publication date
  const formattedDate = article.publication_date
    ? new Date(article.publication_date.replace(/\//g, '-')).toLocaleDateString('id-ID', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : null;

  // Student name (default author 0)
  const studentName = article.student || article.authors[0] || 'Mahasiswa';

  // Supervisors (authors 1 and 2)
  const supervisors = article.supervisors && article.supervisors.length > 0
    ? article.supervisors
    : article.authors.slice(1).map((a) => ({ name: a, cleanName: a, keahlian: [] }));

  // Helper to color-code keahlian badge
  const getKeahlianStyle = (k: string) => {
    if (k.includes('AES') || k.includes('Automation') || k.includes('Embeded')) {
      return {
        bg: 'bg-emerald-50 dark:bg-emerald-950/70',
        text: 'text-emerald-700 dark:text-emerald-300',
        border: 'border-emerald-200 dark:border-emerald-800',
        icon: <Cpu className="w-3 h-3 mr-1 text-emerald-600" />,
      };
    }
    if (k.includes('NIC') || k.includes('Network') || k.includes('Control')) {
      return {
        bg: 'bg-sky-50 dark:bg-sky-950/70',
        text: 'text-sky-700 dark:text-sky-300',
        border: 'border-sky-200 dark:border-sky-800',
        icon: <Network className="w-3 h-3 mr-1 text-sky-600" />,
      };
    }
    if (k.includes('Edge') || k.includes('Computing')) {
      return {
        bg: 'bg-purple-50 dark:bg-purple-950/70',
        text: 'text-purple-700 dark:text-purple-300',
        border: 'border-purple-200 dark:border-purple-800',
        icon: <Server className="w-3 h-3 mr-1 text-purple-600" />,
      };
    }
    return {
      bg: 'bg-amber-50 dark:bg-amber-950/70',
      text: 'text-amber-700 dark:text-amber-300',
      border: 'border-amber-200 dark:border-amber-800',
      icon: <Layers className="w-3 h-3 mr-1 text-amber-600" />,
    };
  };

  return (
    <article className="group bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between">
      <div>
        {/* Badges: Issue, Keahlian, Date */}
        <div className="flex flex-wrap items-center gap-1.5 mb-3">
          {article.issue_name && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 dark:bg-indigo-950/80 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800/60">
              <Bookmark className="w-3 h-3 mr-1" />
              {article.issue_name}
            </span>
          )}

          {/* Keahlian Badges */}
          {article.keahlian && article.keahlian.map((k) => {
            const style = getKeahlianStyle(k);
            return (
              <button
                key={k}
                onClick={() => onFilterKeahlian && onFilterKeahlian(k)}
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border transition-colors hover:opacity-80 ${style.bg} ${style.text} ${style.border}`}
                title={`Klik untuk filter riset bidang: ${k}`}
              >
                {style.icon}
                <span>{k}</span>
              </button>
            );
          })}

          {formattedDate && (
            <span className="inline-flex items-center text-xs text-slate-500 dark:text-slate-400 ml-auto">
              <Calendar className="w-3 h-3 mr-1 text-slate-400" />
              {formattedDate}
            </span>
          )}
        </div>

        {/* Title */}
        <h3 className="text-lg font-bold text-slate-900 dark:text-white leading-snug mb-3 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
          <a
            href={article.original_article_url}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:underline flex items-baseline gap-1"
          >
            <span>{article.title}</span>
            <ExternalLink className="w-3.5 h-3.5 text-slate-400 shrink-0 inline-block opacity-0 group-hover:opacity-100 transition-opacity" />
          </a>
        </h3>

        {/* Authors Section: Student & Lecturers breakdown */}
        <div className="space-y-2 mb-4 p-3 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/50 dark:border-slate-800/60 text-xs">
          {/* Mahasiswa / Penulis Utama */}
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center px-2 py-0.5 rounded bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 font-semibold text-[11px] shrink-0">
              <GraduationCap className="w-3 h-3 mr-1" />
              Mahasiswa
            </span>
            <span className="font-medium text-slate-800 dark:text-slate-200 truncate">
              {studentName}
            </span>
          </div>

          {/* Dosen Pembimbing */}
          {supervisors.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-slate-200/40 dark:border-slate-800/40">
              <span className="inline-flex items-center px-2 py-0.5 rounded bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300 font-semibold text-[11px] shrink-0">
                <Briefcase className="w-3 h-3 mr-1" />
                Pembimbing
              </span>
              <div className="flex flex-wrap items-center gap-1">
                {supervisors.map((s, idx) => (
                  <button
                    key={idx}
                    onClick={() => onFilterDosen && onFilterDosen(s.cleanName)}
                    className="inline-flex items-center px-2 py-0.5 rounded-md bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:border-indigo-400 hover:text-indigo-600 transition-colors"
                    title={`Klik untuk filter semua riset bimbingan ${s.cleanName}`}
                  >
                    <span>
                      {idx + 1}. {s.cleanName}
                    </span>
                    {s.keahlian && s.keahlian[0] && (
                      <span className="ml-1 text-[10px] text-slate-400 font-mono">
                        ({s.keahlian[0].replace(/.*\(|\).*/g, '')})
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Abstract */}
        {article.abstract && (
          <div className="relative mb-4">
            <p
              className={`text-sm text-slate-600 dark:text-slate-300 leading-relaxed ${
                !isExpanded ? 'line-clamp-3' : ''
              }`}
            >
              {article.abstract}
            </p>
            {article.abstract.length > 180 && (
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="mt-1.5 inline-flex items-center text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 focus:outline-none"
              >
                {isExpanded ? (
                  <>
                    <span>Sembunyikan</span>
                    <ChevronUp className="w-3.5 h-3.5 ml-0.5" />
                  </>
                ) : (
                  <>
                    <span>Baca Abstrak Selengkapnya</span>
                    <ChevronDown className="w-3.5 h-3.5 ml-0.5" />
                  </>
                )}
              </button>
            )}
          </div>
        )}
      </div>

      {/* Card Footer Actions */}
      <div className="pt-4 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-2 mt-auto">
        <div className="flex items-center gap-2">
          {pdfUrl ? (
            <>
              <button
                onClick={() => onReadPdf(article)}
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-xs font-medium shadow-sm transition-colors"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Baca PDF</span>
              </button>

              <a
                href={pdfUrl}
                download
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 text-xs font-medium transition-colors"
                title="Download file PDF hasil riset"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Unduh</span>
              </a>
            </>
          ) : (
            <span className="text-xs text-slate-400 italic">PDF belum tersedia</span>
          )}
        </div>

        <div className="flex items-center gap-3">
          {article.doi && (
            <a
              href={`https://doi.org/${article.doi.replace(/^https?:\/\/doi\.org\//, '')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400 font-mono hover:underline"
            >
              DOI
            </a>
          )}
          <a
            href={article.original_article_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 flex items-center gap-1 transition-colors"
          >
            <span>OJS Asli</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>
    </article>
  );
};
