import fs from 'fs';
import path from 'path';
import { enrichArticleWithDosen } from '../src/lib/dosen';

const file = path.join(process.cwd(), 'src', 'data', 'articles.json');
if (fs.existsSync(file)) {
  const articles = JSON.parse(fs.readFileSync(file, 'utf-8'));
  const enriched = articles.map(enrichArticleWithDosen);
  fs.writeFileSync(file, JSON.stringify(enriched, null, 2), 'utf-8');
  console.log(`Enriched ${enriched.length} articles with student, supervisors & keahlian!`);
} else {
  console.log('File not found:', file);
}

