import { Article } from './types';

// Helper to remove academic degrees and clean author name
function cleanName(rawName: string): string {
  if (!rawName) return '';
  return rawName
    .replace(/,?\s*(S\.Kom|M\.Kom|S\.T|M\.T|S\.Si|M\.Cs|M\.M|Dr|Prof|Ph\.D|M\.Sc|B\.Sc|Ir)[.\w]*/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
}

// Convert a single name into APA author format: "Lastname, F. M." or "Mononym"
function formatAuthorApa(name: string): string {
  const cleaned = cleanName(name);
  if (!cleaned) return '';
  const parts = cleaned.split(' ').filter(Boolean);
  if (parts.length === 1) return parts[0];

  const lastName = parts[parts.length - 1];
  const initials = parts
    .slice(0, parts.length - 1)
    .map((p) => `${p.charAt(0).toUpperCase()}.`)
    .join(' ');

  return `${lastName}, ${initials}`;
}

// Convert a single name into IEEE author format: "F. M. Lastname" or "Mononym"
function formatAuthorIeee(name: string): string {
  const cleaned = cleanName(name);
  if (!cleaned) return '';
  const parts = cleaned.split(' ').filter(Boolean);
  if (parts.length === 1) return parts[0];

  const lastName = parts[parts.length - 1];
  const initials = parts
    .slice(0, parts.length - 1)
    .map((p) => `${p.charAt(0).toUpperCase()}.`)
    .join(' ');

  return `${initials} ${lastName}`;
}

// Format list of authors according to APA rules
function formatAuthorsApaList(authors: string[]): string {
  if (!authors || authors.length === 0) return 'Anonim';
  const formatted = authors.map(formatAuthorApa).filter(Boolean);
  if (formatted.length === 0) return 'Anonim';
  if (formatted.length === 1) return formatted[0];
  if (formatted.length === 2) return `${formatted[0]}, & ${formatted[1]}`;
  
  return `${formatted.slice(0, -1).join(', ')}, & ${formatted[formatted.length - 1]}`;
}

// Format list of authors according to IEEE rules
function formatAuthorsIeeeList(authors: string[]): string {
  if (!authors || authors.length === 0) return 'Anon.';
  const formatted = authors.map(formatAuthorIeee).filter(Boolean);
  if (formatted.length === 0) return 'Anon.';
  if (formatted.length === 1) return formatted[0];
  if (formatted.length === 2) return `${formatted[0]} and ${formatted[1]}`;
  
  return `${formatted.slice(0, -1).join(', ')}, and ${formatted[formatted.length - 1]}`;
}

// Parse issue metadata (Volume, Issue number, Year)
function parseIssueInfo(article: Article): { volume: string; issue: string; year: string } {
  let volume = '';
  let issue = '';
  let year = '';

  if (article.issue_name) {
    const volMatch = article.issue_name.match(/vol(?:ume)?\.?\s*(\d+)/i);
    if (volMatch) volume = volMatch[1];

    const issueMatch = article.issue_name.match(/no(?:mor)?\.?\s*(\d+)/i);
    if (issueMatch) issue = issueMatch[1];

    const yearMatch = article.issue_name.match(/\b(20\d\d)\b/);
    if (yearMatch) year = yearMatch[1];
  }

  if (!year && article.publication_date) {
    const match = article.publication_date.match(/\b(20\d\d)\b/);
    if (match) year = match[1];
  }

  return {
    volume: volume || '1',
    issue: issue || '1',
    year: year || '2026',
  };
}

/**
 * Generates an APA 7th Edition citation string.
 */
export function generateApaCitation(article: Article): string {
  const authorsStr = formatAuthorsApaList(article.authors || []);
  const { volume, issue, year } = parseIssueInfo(article);
  const title = article.title.trim().replace(/\.$/, '');
  const journal = 'Jurnal Computer Science dan Komunikasi Mahasiswa FMIPA UNTAN (JCSKOMMIPA)';
  
  const volIssue = `${volume}(${issue})`;
  let link = '';
  if (article.doi) {
    link = article.doi.startsWith('http')
      ? article.doi
      : `https://doi.org/${article.doi.replace(/^https?:\/\/doi\.org\//, '')}`;
  } else if (article.original_article_url) {
    link = article.original_article_url;
  }

  return `${authorsStr} (${year}). ${title}. ${journal}, ${volIssue}.${link ? ' ' + link : ''}`;
}

/**
 * Generates an IEEE citation string.
 */
export function generateIeeeCitation(article: Article): string {
  const authorsStr = formatAuthorsIeeeList(article.authors || []);
  const { volume, issue, year } = parseIssueInfo(article);
  const title = article.title.trim().replace(/\.$/, '');
  const journal = 'JCSKOMMIPA';
  
  let doiOrUrl = '';
  if (article.doi) {
    const cleanDoi = article.doi.replace(/^https?:\/\/doi\.org\//, '');
    doiOrUrl = `, doi: ${cleanDoi}.`;
  } else if (article.original_article_url) {
    doiOrUrl = `, [Online]. Available: ${article.original_article_url}.`;
  } else {
    doiOrUrl = '.';
  }

  return `${authorsStr}, "${title}," ${journal}, vol. ${volume}, no. ${issue}, ${year}${doiOrUrl}`;
}
