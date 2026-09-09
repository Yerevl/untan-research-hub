import { NextRequest, NextResponse } from 'next/server';
import { getArticles, isSupabaseConfigured } from '@/lib/supabase';
import { getDosenList, getKeahlianList, enrichArticleWithDosen } from '@/lib/dosen';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || undefined;
    const issue = searchParams.get('issue') || undefined;
    const year = searchParams.get('year') || undefined;
    const dosen = searchParams.get('dosen') || undefined;
    const keahlian = searchParams.get('keahlian') || undefined;
    const prodi = searchParams.get('prodi') || undefined;
    const sortBy = searchParams.get('sortBy') || 'newest';

    const rawAllArticles = await getArticles();
    const allArticles = rawAllArticles.map((a) => enrichArticleWithDosen(a));

    // Extract unique issues and years for filter dropdowns
    const uniqueIssues = Array.from(new Set(allArticles.map((a) => a.issue_name).filter(Boolean))) as string[];
    const uniqueYears = Array.from(
      new Set(
        allArticles
          .map((a) => a.publication_date?.slice(0, 4))
          .filter((y): y is string => Boolean(y && !isNaN(Number(y))))
      )
    ).sort((a, b) => b.localeCompare(a));

    // Master dosen and keahlian lists
    const dosenList = getDosenList();
    const keahlianList = getKeahlianList();

    const rawFiltered = await getArticles({ query, issue, year, dosen, keahlian });
    let filtered = rawFiltered.map((a) => enrichArticleWithDosen(a));

    if (prodi && prodi !== 'all') {
      filtered = filtered.filter((a) => a.prodi?.toUpperCase() === prodi.toUpperCase());
    }

    if (sortBy === 'title') {
      filtered = filtered.sort((a, b) => a.title.localeCompare(b.title));
    } else if (sortBy === 'oldest') {
      filtered = filtered.sort((a, b) => (a.publication_date || '').localeCompare(b.publication_date || ''));
    } else {
      // Default: newest
      filtered = filtered.sort((a, b) => (b.publication_date || '').localeCompare(a.publication_date || ''));
    }

    return NextResponse.json({
      success: true,
      supabaseConnected: isSupabaseConfigured(),
      total: allArticles.length,
      filteredCount: filtered.length,
      issues: uniqueIssues,
      years: uniqueYears,
      dosenList,
      keahlianList,
      articles: filtered,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
