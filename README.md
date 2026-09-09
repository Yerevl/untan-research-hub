# Untan Research Hub 🎓

Tool otomatis untuk scraping hasil riset jurnal ilmiah Universitas Tanjungpura (**JCSKOMMIPA - OJS**), mengunduh file PDF ke cloud storage, menyimpan metadata ke database **Supabase (PostgreSQL)**, dan menampilkan katalog riset interaktif berbasis **Next.js** yang siap di-hosting gratis ke **Vercel**.

---

## 🌟 Fitur Utama

1. **Scraper Otomatis OJS & Arsip Jurnal**:
   - Mengekstrak metadata akademis lengkap: Judul, Penulis (Mahasiswa & Dosen Pembimbing), Afiliasi, Abstrak, Tanggal Terbit, DOI, dan Edisi.
   - Mengunduh dokumen fisik PDF riset langsung dari server OJS Untan.
   - **Mode Batch Scrape Arsip**: Mampu menelusuri ke-25 edisi dari `/issue/archive` secara otomatis.
2. **Pemisahan Mahasiswa & Dosen Pembimbing**:
   - Mengidentifikasi otomatis Penulis 1 sebagai **Mahasiswa** (Penulis Utama).
   - Mengidentifikasi otomatis Penulis 2 & 3 sebagai **Dosen Pembimbing**.
3. **Pemetaan Otomatis Bidang Keahlian Dosen Siskom**:
   - Terintegrasi dengan direktori resmi dosen di [siskom.untan.ac.id/dosen-staf](https://siskom.untan.ac.id/dosen-staf).
   - Melabeli riset secara otomatis berdasarkan laboratorium/keahlian dosen pembimbing:
     - 🤖 **Automation & Embeded System (AES)**
     - 🌐 **Network Intelligent Control (NIC)**
     - ⚡ **Edge Computing**
     - 📹 **Video Conference / Umum**
4. **Integrasi Supabase**:
   - **PostgreSQL Database**: Penyimpanan terstruktur dengan Full-Text Search.
   - **Supabase Storage**: Bucket `journal-pdfs` untuk menyimpan file PDF secara permanen.
5. **Web Portal Interaktif (Next.js + Tailwind CSS)**:
   - Pencarian instan (judul riset, nama mahasiswa, nama dosen pembimbing, kata kunci abstrak).
   - **Filter Dosen Pembimbing**: Pilih dosen pembimbing untuk melihat seluruh bimbingannya.
   - **Filter Bidang Keahlian**: Filter cepat 1-klik untuk laboratorium AES, NIC, Edge Computing.
   - **In-App PDF Viewer**: Membaca dokumen PDF langsung di dalam browser tanpa harus meninggalkan web.
   - **Modal Sinkronisasi**: Opsi scrape 1 edisi tertentu atau batch scrape banyak edisi dari arsip.

---

## 🚀 Panduan Memulai Cepat (Localhost)

### 1. Jalankan Aplikasi
Karena data dari issue `2707` sudah di-scrape, dipetakan ke dosen & keahlian, serta tersimpan di folder lokal:

```bash
npm run dev
```

Buka peramban di [http://localhost:3000](http://localhost:3000).

### 2. Jalankan Scraper Manual via Terminal (Opsional)
- Scrape 1 issue tertentu:
  ```bash
  npm run scrape https://jurnal.untan.ac.id/index.php/jcskommipa/issue/view/2707
  ```
- Scrape seluruh arsip jurnal (semua edisi):
  ```bash
  npm run scrape:all
  ```
- Scrape N edisi terbaru dari arsip (misal 5 edisi):
  ```bash
  npm run scrape:all 5
  ```

---

## 🗄️ Menghubungkan ke Supabase (Cloud Database & Storage)

Untuk menyimpan data ke cloud Supabase agar website bisa diakses online oleh Anda dan teman-teman:

### Langkah 1: Buat Project di Supabase
1. Masuk ke [https://supabase.com](https://supabase.com) (Gratis).
2. Klik **"New project"**, beri nama (misal `untan-research-hub`), dan pilih region terdekat (misal: *Singapore*).

### Langkah 2: Buat Tabel & Storage
1. Buka menu **SQL Editor** di dashboard Supabase.
2. Salin isi file [`supabase/schema.sql`](./supabase/schema.sql) dan klik **Run**.
   - Ini akan membuat tabel `articles` lengkap dengan kolom `student`, `supervisors`, `keahlian`, serta indeks pencarian.
3. Buka menu **Storage** di dashboard Supabase:
   - Buat bucket baru bernama `journal-pdfs`.
   - Pastikan opsi **Public bucket** dicentang.

### Langkah 3: Konfigurasi Environment Variables
1. Buat file `.env.local` di root folder (lihat [`.env.example`](./.env.example)):
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://xyzcompany.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=ey...
   SUPABASE_SERVICE_ROLE_KEY=ey...
   ```
2. Jalankan kembali `npm run scrape` atau `npm run scrape:all` untuk mengunggah semua artikel dan file PDF ke cloud Supabase!

---

## 🌐 Panduan Hosting Gratis ke Vercel

Agar teman-teman Anda bisa mengakses website ini kapanpun melalui link:

1. **Upload project ke GitHub**:
   ```bash
   git add .
   git commit -m "feat: untan research hub with lecturer & expertise filters"
   git branch -M main
   git remote add origin https://github.com/USERNAME/untan-research-hub.git
   git push -u origin main
   ```
2. **Deploy di Vercel**:
   - Buka [https://vercel.com](https://vercel.com) dan pilih repository `untan-research-hub`.
   - Di bagian **Environment Variables**, tambahkan 3 variabel Supabase Anda.
   - Klik **"Deploy"**.
3. Selesai! Website sudah online dengan domain HTTPS gratis (contoh: `https://untan-research.vercel.app`).
