import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { getSupabaseClient, supabaseUrl } from '@/lib/supabase';
import { Article } from '@/lib/types';

export const maxDuration = 60; // Allow up to 60s for seeding

export async function POST(request: NextRequest) {
  try {
    const client = getSupabaseClient();
    if (!client) {
      return NextResponse.json(
        { success: false, error: 'Supabase client is not configured' },
        { status: 500 }
      );
    }

    // 1. Ensure Storage Bucket exists
    let bucketCreated = false;
    try {
      const { data: buckets } = await client.storage.listBuckets();
      const exists = buckets?.some((b) => b.name === 'journal-pdfs' || b.id === 'journal-pdfs');
      if (!exists) {
        const { error: createErr } = await client.storage.createBucket('journal-pdfs', {
          public: true,
        });
        bucketCreated = !createErr;
      } else {
        bucketCreated = true;
      }
    } catch (e: any) {
      console.warn('Bucket check/create deferred:', e?.message);
    }

    // 2. Read all 324 articles from articles.json
    const filePath = path.join(process.cwd(), 'src', 'data', 'articles.json');
    if (!fs.existsSync(filePath)) {
      return NextResponse.json(
        { success: false, error: 'articles.json not found' },
        { status: 404 }
      );
    }

    const rawArticles: Article[] = JSON.parse(fs.readFileSync(filePath, 'utf-8') || '[]');
    if (rawArticles.length === 0) {
      return NextResponse.json({ success: false, error: 'articles.json is empty' }, { status: 400 });
    }

    // Format articles for Supabase insertion
    const records = rawArticles.map((a) => ({
      ojs_id: a.ojs_id,
      title: a.title,
      abstract: a.abstract,
      authors: a.authors || [],
      student: a.student || null,
      supervisors: a.supervisors || [],
      keahlian: a.keahlian || [],
      institutions: a.institutions || ['Universitas Tanjungpura'],
      publication_date: a.publication_date || null,
      doi: a.doi || null,
      issue_name: a.issue_name || null,
      original_article_url: a.original_article_url,
      original_pdf_url: a.original_pdf_url || null,
      storage_pdf_path: `journal-pdfs/${a.ojs_id}.pdf`,
      storage_pdf_url: `${supabaseUrl}/storage/v1/object/public/journal-pdfs/${a.ojs_id}.pdf`,
      updated_at: new Date().toISOString(),
    }));

    // Batch insert in chunks of 50 to avoid payload size limits
    const CHUNK_SIZE = 50;
    let insertedCount = 0;
    const errors: any[] = [];

    for (let i = 0; i < records.length; i += CHUNK_SIZE) {
      const chunk = records.slice(i, i + CHUNK_SIZE);
      const { error } = await client
        .from('articles')
        .upsert(chunk, { onConflict: 'ojs_id' });

      if (error) {
        errors.push({ chunk: i, error: error.message, code: error.code });
      } else {
        insertedCount += chunk.length;
      }
    }

    return NextResponse.json({
      success: errors.length === 0,
      totalToSeed: records.length,
      insertedCount,
      bucketReady: bucketCreated,
      errors: errors.length > 0 ? errors : null,
      message:
        errors.length === 0
          ? `Berhasil meng-upload ${insertedCount} artikel skripsi langsung ke Supabase!`
          : `Terdapat kendala saat meng-upload beberapa data.`,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

// GET: Check Supabase database population status
export async function GET() {
  try {
    const client = getSupabaseClient();
    if (!client) {
      return NextResponse.json({ success: false, error: 'Supabase client not configured' });
    }

    const { count, error } = await client
      .from('articles')
      .select('*', { count: 'exact', head: true });

    const { data: buckets } = await client.storage.listBuckets();

    return NextResponse.json({
      success: !error,
      articlesInSupabase: count ?? 0,
      buckets: buckets?.map((b) => b.name) || [],
      error: error ? { code: error.code, message: error.message } : null,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
