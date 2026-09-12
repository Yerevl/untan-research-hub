'use client';

import React, { useState } from 'react';
import { Article, Supervisor } from '@/lib/types';
import {
  FileText,
  Download,
  Calendar,
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
import { CitationButton } from './CitationButton';
import { HoldableButton } from './HoldableButton';
import { motion, Variants } from 'motion/react';

interface ArticleCardProps {
  article: Article;
  onReadPdf: (article: Article) => void;
  onFilterDosen?: (dosenName: string) => void;
  onFilterKeahlian?: (keahlianName: string) => void;
  onFilterProdi?: (prodiName: string) => void;
}

const comicCardVariants: Variants = {
  hidden: { opacity: 0, scale: 0.8 },
  show: {
    opacity: 1,
    scale: 1,
    transition: {
      type: 'spring',
      stiffness: 600,
      damping: 22,
      mass: 0.7,
    },
  },
};

export const ArticleCard: React.FC<ArticleCardProps> = ({
  article,
  onReadPdf,
  onFilterDosen,
  onFilterKeahlian,
  onFilterProdi,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  // Determine PDF URL
  const pdfUrl = article.storage_pdf_url || article.original_pdf_url || '';

  // Format publication date
  const formattedDate = article.publication_date
    ? new Date(article.publication_date.replace(/\//g, '-')).toLocaleDateString('id-ID', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    : null;

  // Student name (default author 0)
  const studentName = article.student || article.authors[0] || 'Mahasiswa';

  // Supervisors (authors 1 and 2)
  const supervisors: Supervisor[] =
    article.supervisors && article.supervisors.length > 0
      ? article.supervisors
      : article.authors.slice(1).map((a) => ({ name: a, cleanName: a, keahlian: [] }));

  // Determine prodi: SISKOM or SISFO
  const prodi =
    article.prodi ||
    (supervisors.some(
      (s) =>
        s.prodi === 'SISFO' ||
        s.cleanName.toLowerCase().includes('ilhamsyah') ||
        s.cleanName.toLowerCase().includes('ibnur') ||
        s.cleanName.toLowerCase().includes('mutiah') ||
        s.cleanName.toLowerCase().includes('renny') ||
        s.cleanName.toLowerCase().includes('prawira') ||
        s.cleanName.toLowerCase().includes('ferdy') ||
        s.cleanName.toLowerCase().includes('syahru') ||
        s.cleanName.toLowerCase().includes('gusmita')
    )
      ? 'SISFO'
      : 'SISKOM');

  // Color code keahlian badge with neo-brutalist punchy pastels
  const getKeahlianStyle = (k: string) => {
    if (k.includes('AES') || k.includes('Automation') || k.includes('Embeded')) {
      return {
        bg: 'bg-[#A3E635]',
        text: 'text-black',
        icon: <Cpu className="w-3.5 h-3.5 mr-1 stroke-[2.5]" />,
      };
    }
    if (k.includes('NIC') || k.includes('Network') || k.includes('Control')) {
      return {
        bg: 'bg-[#38BDF8]',
        text: 'text-black',
        icon: <Network className="w-3.5 h-3.5 mr-1 stroke-[2.5]" />,
      };
    }
    if (k.includes('Edge') || k.includes('Computing')) {
      return {
        bg: 'bg-[#C084FC]',
        text: 'text-black',
        icon: <Server className="w-3.5 h-3.5 mr-1 stroke-[2.5]" />,
      };
    }
    if (k.includes('Tata Kelola') || k.includes('TKTI')) {
      return {
        bg: 'bg-[#FBBF24]',
        text: 'text-black',
        icon: <Briefcase className="w-3.5 h-3.5 mr-1 stroke-[2.5]" />,
      };
    }
    if (k.includes('Intelejensi') || k.includes('Analisis Data')) {
      return {
        bg: 'bg-[#34D399]',
        text: 'text-black',
        icon: <Layers className="w-3.5 h-3.5 mr-1 stroke-[2.5]" />,
      };
    }
    if (k.includes('Perangkat Lunak') || k.includes('RPL')) {
      return {
        bg: 'bg-[#FB7185]',
        text: 'text-black',
        icon: <Layers className="w-3.5 h-3.5 mr-1 stroke-[2.5]" />,
      };
    }
    return {
      bg: 'bg-[#E2E8F0]',
      text: 'text-black',
      icon: <Layers className="w-3.5 h-3.5 mr-1 stroke-[2.5]" />,
    };
  };

  return (
    <motion.article
      variants={comicCardVariants}
      whileHover={{ x: -3, y: -3 }}
      className="group bg-white dark:bg-[#1A1F29] border-[2.5px] border-black dark:border-white shadow-[6px_6px_0px_0px_#16181D] dark:shadow-[6px_6px_0px_0px_#D4D4D8] p-6 hover:shadow-[9px_9px_0px_0px_#16181D] dark:hover:shadow-[9px_9px_0px_0px_#D4D4D8] transition-shadow flex flex-col justify-between"
    >
      <div>
        {/* Badges Row: Issue (flat stamp), Prodi (elevated button), Keahlian (elevated button), Date (flat stamp) */}
        <div className="flex flex-wrap items-center gap-2 mb-4">
          {article.issue_name && (
            <span className="inline-flex items-center px-2 py-0.5 text-[11px] font-bold bg-[#FEF08A]/70 dark:bg-[#FEF08A]/15 text-black dark:text-yellow-200 border border-black/30 dark:border-yellow-400/30 uppercase tracking-wider rounded-sm select-none cursor-default shadow-none">
              <Bookmark className="w-3 h-3 mr-1 stroke-[2.5] opacity-70" />
              <span>{article.issue_name.replace(/:.*/, '')}</span>
            </span>
          )}

          {/* Prodi Button: Interactive Filter (Elevated with Hard Shadow) */}
          {prodi && (
            <button
              onClick={() => onFilterProdi && onFilterProdi(prodi)}
              className={`inline-flex items-center px-2.5 py-1 text-xs font-black border-2 border-black dark:border-white shadow-[2.5px_2.5px_0px_0px_#16181D] dark:shadow-[2.5px_2.5px_0px_0px_#D4D4D8] uppercase tracking-wider active:translate-x-0.5 active:translate-y-0.5 transition-all ${
                prodi === 'SISFO'
                  ? 'bg-[#F472B6] text-black hover:bg-[#F472B6]/85'
                  : 'bg-[#38BDF8] text-black hover:bg-[#38BDF8]/85'
              }`}
              title={`Filter berdasarkan Program Studi ${prodi === 'SISFO' ? 'Sistem Informasi' : 'Rekayasa Sistem Komputer'}`}
            >
              <span>{prodi}</span>
            </button>
          )}

          {/* Keahlian Buttons: Interactive Filters (Elevated with Hard Shadow) */}
          {article.keahlian &&
            article.keahlian.map((k) => {
              const style = getKeahlianStyle(k);
              return (
                <button
                  key={k}
                  onClick={() => onFilterKeahlian && onFilterKeahlian(k)}
                  className={`inline-flex items-center px-2.5 py-1 text-xs font-black border-2 border-black dark:border-white shadow-[2px_2px_0px_0px_#16181D] dark:shadow-[2px_2px_0px_0px_#D4D4D8] active:translate-x-0.5 active:translate-y-0.5 transition-all ${style.bg} ${style.text}`}
                  title={`Filter riset bidang: ${k}`}
                >
                  {style.icon}
                  <span>{k.replace(/\s*\(.*/, '')}</span>
                </button>
              );
            })}

          {/* Date Stamp: Static Metadata (Flat, No Shadow) */}
          {formattedDate && (
            <span className="inline-flex items-center px-2 py-0.5 text-[11px] font-mono text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-[#20242C] border border-slate-300 dark:border-slate-700 ml-auto shrink-0 select-none cursor-default shadow-none rounded-sm">
              <Calendar className="w-3 h-3 mr-1 stroke-[2] opacity-70" />
              <span>{formattedDate}</span>
            </span>
          )}
        </div>

        {/* Title */}
        <h3 className="text-base sm:text-xl font-black text-black dark:text-white leading-snug mb-3 sm:mb-4">
          {article.title}
        </h3>

        {/* Authors Section: Student & Lecturers breakdown in Neo-brutalist box */}
        <div className="space-y-2 mb-4 p-2.5 sm:p-3 bg-[#F8FAFC] dark:bg-[#111317] border-2 border-black dark:border-white shadow-[3px_3px_0px_0px_#16181D] dark:shadow-[3px_3px_0px_0px_#D4D4D8] text-xs">
          {/* Mahasiswa (Icon-only badge, no text) */}
          <div className="flex items-center gap-2.5 min-h-[26px]">
            <span
              className="w-7 h-7 shrink-0 flex items-center justify-center bg-[#FEF08A] text-black border-2 border-black shadow-[1.5px_1.5px_0px_0px_#16181D] rounded-none"
              title="Penulis Utama (Mahasiswa)"
            >
              <GraduationCap className="w-4 h-4 stroke-[2.5]" />
            </span>
            <span className="font-bold text-black dark:text-white truncate">
              {studentName}
            </span>
          </div>

          {/* Dosen Pembimbing (Icon-only badge, no text) */}
          {supervisors.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5 pt-1.5 border-t border-black/15 dark:border-white/15">
              <span
                className="w-7 h-7 shrink-0 flex items-center justify-center bg-[#BAE6FD] text-black border-2 border-black shadow-[1.5px_1.5px_0px_0px_#16181D] rounded-none mr-1"
                title="Dosen Pembimbing"
              >
                <Briefcase className="w-4 h-4 stroke-[2.5]" />
              </span>
              {supervisors.map((s, idx) => (
                <div key={idx} className="inline-flex items-center">
                  <button
                    onClick={() => onFilterDosen && onFilterDosen(s.cleanName)}
                    className="text-left font-bold text-black dark:text-white hover:underline hover:text-[#38BDF8] transition-colors"
                    title={`Lihat riset bimbingan ${s.cleanName}`}
                  >
                    <span className="break-words">{s.cleanName}</span>
                    {s.keahlian && s.keahlian[0] && (
                      <span className="ml-1 text-[10px] font-mono opacity-80 shrink-0">
                        [{s.keahlian[0].replace(/.*\(|\).*/g, '')}]
                      </span>
                    )}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Abstract */}
        {article.abstract && (
          <div className="relative mb-4 sm:mb-5">
            <p
              className={`text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed font-normal ${
                !isExpanded ? 'line-clamp-3' : ''
              }`}
            >
              {article.abstract}
            </p>
            {article.abstract.length > 180 && (
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="mt-2 inline-flex items-center text-xs font-black uppercase tracking-wider text-black dark:text-yellow-300 hover:underline"
              >
                {isExpanded ? (
                  <>
                    <span>Tutup Abstrak</span>
                    <ChevronUp className="w-4 h-4 ml-1 stroke-[3]" />
                  </>
                ) : (
                  <>
                    <span>Baca Abstrak Selengkapnya</span>
                    <ChevronDown className="w-4 h-4 ml-1 stroke-[3]" />
                  </>
                )}
              </button>
            )}
          </div>
        )}
      </div>

      {/* Card Footer Actions */}
      <div className="pt-3.5 sm:pt-4 border-t-2 border-black dark:border-white flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 sm:gap-3 mt-auto">
        <div className="grid grid-cols-3 sm:flex sm:flex-wrap items-center gap-2">
          {pdfUrl ? (
            <>
              <HoldableButton
                onTrigger={() => onReadPdf(article)}
                icon={<FileText className="w-3.5 h-3.5 stroke-[2.5]" />}
                label="BACA PDF"
                title={`Baca PDF: ${article.title}`}
                className="justify-center"
              />

              <HoldableButton
                onTrigger={() => {
                  const downloadUrl = `/api/download?url=${encodeURIComponent(pdfUrl)}&title=${encodeURIComponent(article.title)}`;
                  const a = document.createElement('a');
                  a.href = downloadUrl;
                  a.download = `${article.title}.pdf`;
                  document.body.appendChild(a);
                  a.click();
                  document.body.removeChild(a);
                }}
                icon={<Download className="w-3.5 h-3.5 stroke-[2.5]" />}
                label="UNDUH"
                title={`Unduh: ${article.title}`}
                className="justify-center"
              />

              <CitationButton article={article} className="w-full flex" />
            </>
          ) : (
            <>
              <span className="text-xs text-slate-500 font-mono italic col-span-2 sm:col-span-1">PDF belum tersedia</span>
              <CitationButton article={article} className="w-full flex" />
            </>
          )}
        </div>

        <div className="flex items-center justify-end gap-2">
          {article.doi && (
            <a
              href={`https://doi.org/${article.doi.replace(/^https?:\/\/doi\.org\//, '')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-mono font-black text-black bg-[#FECDD3] hover:bg-[#FDA4AF] px-2.5 py-1 border-2 border-black shadow-[2px_2px_0px_0px_#16181D] active:translate-x-0.5 active:translate-y-0.5 transition-all inline-flex items-center"
              title={`DOI: ${article.doi}`}
            >
              DOI
            </a>
          )}
        </div>
      </div>
    </motion.article>
  );
};
