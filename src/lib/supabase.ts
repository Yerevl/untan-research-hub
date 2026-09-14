import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Article } from './types';
import fs from 'fs';
import path from 'path';

// Environment variables (supports both manual and Vercel Supabase Integration)
const rawUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '').trim();
const rawKey = (
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  ''
).trim();

// Sanitize URL: Remove any trailing /rest/v1 or slashes so supabase-js doesn't duplicate paths
export const supabaseUrl = rawUrl.replace(/\/rest\/v1\/?$/, '').replace(/\/+$/, '');
export const supabaseKey = rawKey.replace(/[\r\n\t]/g, '');

export const isSupabaseConfigured = (): boolean => {
  return Boolean(
    supabaseUrl &&
    supabaseKey &&
    supabaseUrl.startsWith('https://') &&
    !supabaseUrl.includes('your-project')
  );
};

let supabaseInstance: SupabaseClient | null = null;

export const getSupabaseClient = (): SupabaseClient | null => {
  if (!isSupabaseConfigured()) return null;
  if (!supabaseInstance && supabaseUrl && supabaseKey) {
    supabaseInstance = createClient(supabaseUrl, supabaseKey);
  }
  return supabaseInstance;
};

// Local storage fallback helpers for development
const getLocalDataPath = () => path.join(process.cwd(), 'src', 'data', 'articles.json');
const getLocalPdfDir = () => path.join(process.cwd(), 'public', 'storage', 'pdfs');

export const getArticles = async (filter?: {
  query?: string;
  issue?: string;
  year?: string;
  dosen?: string;
  keahlian?: string;
}): Promise<Article[]> => {
  const client = getSupabaseClient();

  if (client) {
    let query = client.from('articles').select('*').order('publication_date', { ascending: false });

    if (filter?.issue && filter.issue !== 'all') {
      query = query.eq('issue_name', filter.issue);
    }

    const { data, error } = await query;
    if (error || !data || data.length === 0) {
      if (error) console.error('Error fetching articles from Supabase:', error.message);
      return getLocalArticles(filter);
    }

    let results = (data as Article[]) || [];
    if (filter?.query) {
      const q = filter.query.toLowerCase();
      results = results.filter(
        (a) =>
          a.title.toLowerCase().includes(q) ||
          a.abstract?.toLowerCase().includes(q) ||
          a.authors?.some((author) => author.toLowerCase().includes(q))
      );
    }
    if (filter?.year && filter.year !== 'all') {
      results = results.filter((a) => a.publication_date?.startsWith(filter.year!));
    }
    if (filter?.dosen && filter.dosen !== 'all') {
      const d = filter.dosen.toLowerCase();
      results = results.filter(
        (a) =>
          a.supervisors?.some(
            (s) => s.cleanName.toLowerCase().includes(d) || s.name.toLowerCase().includes(d)
          ) ||
          a.authors?.slice(1).some((author) => author.toLowerCase().includes(d))
      );
    }
    if (filter?.keahlian && filter.keahlian !== 'all') {
      results = results.filter(
        (a) =>
          a.keahlian?.includes(filter.keahlian!) ||
          a.supervisors?.some((s) => s.keahlian?.includes(filter.keahlian!))
      );
    }
    return results;
  }

  return getLocalArticles(filter);
};

export const saveArticle = async (article: Article): Promise<Article> => {
  const client = getSupabaseClient();

  if (client) {
    const { data, error } = await client
      .from('articles')
      .upsert(
        {
          ojs_id: article.ojs_id,
          title: article.title,
          abstract: article.abstract,
          authors: article.authors,
          student: article.student,
          supervisors: article.supervisors,
          keahlian: article.keahlian,
          institutions: article.institutions,
          publication_date: article.publication_date,
          doi: article.doi,
          issue_name: article.issue_name,
          original_article_url: article.original_article_url,
          original_pdf_url: article.original_pdf_url,
          storage_pdf_path: article.storage_pdf_path,
          storage_pdf_url: article.storage_pdf_url,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'ojs_id' }
      )
      .select()
      .single();

    if (error) {
      console.error(`Error saving article ${article.ojs_id} to Supabase:`, error.message);
      return saveLocalArticle(article);
    }
    return (data as Article) || article;
  }

  return saveLocalArticle(article);
};

export const uploadPdf = async (ojsId: string, pdfBuffer: Buffer): Promise<{ path: string; url: string }> => {
  const client = getSupabaseClient();
  const filename = `${ojsId}.pdf`;

  if (client) {
    const bucket = 'journal-pdfs';
    const storagePath = `issues/${filename}`;

    const { error: uploadError } = await client.storage
      .from(bucket)
      .upload(storagePath, pdfBuffer, {
        contentType: 'application/pdf',
        upsert: true,
      });

    if (uploadError) {
      console.warn(`Supabase Storage upload warning for ${ojsId}:`, uploadError.message);
      return saveLocalPdf(ojsId, pdfBuffer);
    }

    const { data: publicUrlData } = client.storage.from(bucket).getPublicUrl(storagePath);
    return {
      path: storagePath,
      url: publicUrlData.publicUrl,
    };
  }

  return saveLocalPdf(ojsId, pdfBuffer);
};

// Local storage implementations
function getLocalArticles(filter?: {
  query?: string;
  issue?: string;
  year?: string;
  dosen?: string;
  keahlian?: string;
}): Article[] {
  try {
    const filePath = getLocalDataPath();
    if (!fs.existsSync(filePath)) return [];
    const content = fs.readFileSync(filePath, 'utf-8');
    let articles: Article[] = JSON.parse(content || '[]');

    if (filter?.issue && filter.issue !== 'all') {
      articles = articles.filter((a) => a.issue_name === filter.issue);
    }
    if (filter?.year && filter.year !== 'all') {
      articles = articles.filter((a) => a.publication_date?.startsWith(filter.year!));
    }
    if (filter?.dosen && filter.dosen !== 'all') {
      const d = filter.dosen.toLowerCase();
      articles = articles.filter(
        (a) =>
          a.supervisors?.some(
            (s) => s.cleanName.toLowerCase().includes(d) || s.name.toLowerCase().includes(d)
          ) ||
          a.authors?.slice(1).some((author) => author.toLowerCase().includes(d))
      );
    }
    if (filter?.keahlian && filter.keahlian !== 'all') {
      articles = articles.filter(
        (a) =>
          a.keahlian?.includes(filter.keahlian!) ||
          a.supervisors?.some((s) => s.keahlian?.includes(filter.keahlian!))
      );
    }
    if (filter?.query) {
      const q = filter.query.toLowerCase();
      articles = articles.filter(
        (a) =>
          a.title.toLowerCase().includes(q) ||
          a.abstract?.toLowerCase().includes(q) ||
          a.authors?.some((author) => author.toLowerCase().includes(q)) ||
          a.student?.toLowerCase().includes(q) ||
          a.supervisors?.some((s) => s.name.toLowerCase().includes(q) || s.cleanName.toLowerCase().includes(q)) ||
          a.keahlian?.some((k) => k.toLowerCase().includes(q))
      );
    }

    return articles.sort((a, b) => (b.publication_date || '').localeCompare(a.publication_date || ''));
  } catch (err) {
    console.error('Error reading local articles:', err);
    return [];
  }
}

function saveLocalArticle(article: Article): Article {
  const filePath = getLocalDataPath();
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  let list: Article[] = [];
  if (fs.existsSync(filePath)) {
    try {
      list = JSON.parse(fs.readFileSync(filePath, 'utf-8') || '[]');
    } catch {
      list = [];
    }
  }

  const existingIdx = list.findIndex((a) => a.ojs_id === article.ojs_id);
  const now = new Date().toISOString();
  const record: Article = {
    ...article,
    id: article.id || `local-${article.ojs_id}`,
    updated_at: now,
    created_at: existingIdx >= 0 ? list[existingIdx].created_at : now,
  };

  if (existingIdx >= 0) {
    list[existingIdx] = record;
  } else {
    list.push(record);
  }

  fs.writeFileSync(filePath, JSON.stringify(list, null, 2), 'utf-8');
  return record;
}

function saveLocalPdf(ojsId: string, pdfBuffer: Buffer): { path: string; url: string } {
  const dir = getLocalPdfDir();
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  const filename = `${ojsId}.pdf`;
  const fullPath = path.join(dir, filename);
  fs.writeFileSync(fullPath, pdfBuffer);

  return {
    path: `public/storage/pdfs/${filename}`,
    url: `/storage/pdfs/${filename}`,
  };
}

