# Kuis El-Kisai

Web app kuis interaktif untuk El-Kisai Education.

- **Frontend:** HTML/CSS/JS statis di `public/` (Cloudflare Pages)
- **Backend:** Pages Functions di `functions/api/` (Cloudflare Workers runtime)
- **Database:** Cloudflare D1 (`schema.sql`)
- **Admin:** `/admin.html`, dilindungi password (secret `ADMIN_PASSWORD`)
- **Tamu:** daftar dengan nama tanpa login, skor tersimpan di D1

## Struktur

```
public/            halaman statis, css, js, logo
functions/api/     endpoint API (players, questions, answer, leaderboard, admin)
lib/               helper: auth admin, validasi soal, JSON response
schema.sql         tabel + contoh soal awal
wrangler.toml      konfigurasi Cloudflare
```

## 1. Setup lokal

```bash
npm install
cp .dev.vars.example .dev.vars        # isi ADMIN_PASSWORD
npm run db:local                      # buat tabel di D1 lokal
npm run dev                           # http://localhost:8788
```

## 2. Buat resource di Cloudflare

```bash
npx wrangler login
npx wrangler d1 create elkisai-quiz
# salin database_id yang muncul ke wrangler.toml
npx wrangler d1 execute elkisai-quiz --remote --file=schema.sql
npx wrangler pages project create elkisai-quiz --production-branch main
npx wrangler pages secret put ADMIN_PASSWORD --project-name elkisai-quiz
```

## 3. Push ke GitHub

```bash
git init
git add .
git commit -m "feat: kuis El-Kisai MVP"
git branch -M main
git remote add origin https://github.com/<username>/elkisai-quiz.git
git push -u origin main
```

## 4. Deploy

**Opsi A: Git integration (disarankan).** Di dashboard Cloudflare: *Workers & Pages → Create → Pages → Connect to Git* lalu pilih repo ini.

- Build command: kosongkan
- Build output directory: `public`
- Setelah project dibuat, buka *Settings → Bindings* dan tambahkan D1 binding dengan variable name `DB` ke database `elkisai-quiz`. Lakukan untuk environment Production dan Preview.
- Setiap push ke `main` akan otomatis deploy.

**Opsi B: Manual dari terminal.**

```bash
npm run deploy
```

## Catatan

- Halaman admin ada di `/admin.html`. Ganti password dengan `wrangler pages secret put ADMIN_PASSWORD` kapan saja.
- Soal yang sudah pernah dijawab tidak bisa dihapus, hanya dinonaktifkan. Ini menjaga skor pemain tetap utuh.
- Pemain menjawab setiap soal hanya sekali. Penilaian dilakukan di server sehingga kunci jawaban tidak dikirim ke browser.
