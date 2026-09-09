export interface Supervisor {
  name: string;
  cleanName: string;
  keahlian: string[];
  prodi?: 'SISKOM' | 'SISFO' | string;
}

export interface Article {
  id?: string;
  ojs_id: string;
  title: string;
  abstract: string;
  authors: string[];
  student?: string;
  supervisors?: Supervisor[];
  keahlian?: string[];
  institutions: string[];
  prodi?: 'SISKOM' | 'SISFO' | string;
  publication_date?: string;
  doi?: string;
  issue_name?: string;
  original_article_url: string;
  original_pdf_url?: string;
  storage_pdf_path?: string;
  storage_pdf_url?: string;
  created_at?: string;
  updated_at?: string;
}

export interface SyncResult {
  success: boolean;
  issueName: string;
  totalFound: number;
  syncedCount: number;
  errors: string[];
  articles: Article[];
}

export interface FilterOptions {
  query?: string;
  issue?: string;
  year?: string;
  author?: string;
  dosen?: string;
  keahlian?: string;
  prodi?: string;
  sortBy?: "newest" | "oldest" | "title";
}

