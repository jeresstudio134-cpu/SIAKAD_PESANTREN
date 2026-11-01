# Panduan Deployment Cloudflare Workers, D1 & R2
## SIAKAD Pesantren (Sistem Informasi Akademik)

Aplikasi ini dibangun khusus untuk infrastruktur **Cloudflare** menggunakan arsitektur serverless edge:
- **Backend:** Hono framework di Cloudflare Workers
- **Database:** Cloudflare D1 (SQLite serverless di edge) dengan Drizzle ORM
- **Storage:** Cloudflare R2 (Object storage untuk foto santri, staf, berkas, dan ekspor excel)
- **Frontend:** React + Vite + Tailwind CSS di-serve via Workers Static Assets
- **Akses Data:** 100% menggunakan binding `c.env.DB` dan `c.env.BUCKET` tanpa koneksi eksternal.

---

### Prasyarat
1. Node.js (v18+) & npm
2. Akun Cloudflare (Free / Paid)
3. Cloudflare Wrangler CLI (terinstal secara lokal atau global):
   ```bash
   npm install -g wrangler
   wrangler login
   ```

---

### Langkah 1: Buat Database Cloudflare D1
Jalankan perintah berikut di terminal:
```bash
wrangler d1 create siakad_db
```

Output terminal akan menampilkan detail seperti:
```
✅ Successfully created DB 'siakad_db'!
[[d1_databases]]
binding = "DB"
database_name = "siakad_db"
database_id = "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
```

Salin `database_id` tersebut ke dalam file `wrangler.jsonc` pada bagian:
```jsonc
"d1_databases": [
  {
    "binding": "DB",
    "database_name": "siakad_db",
    "database_id": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx", // Masukkan database_id di sini
    "migrations_dir": "./migrations"
  }
]
```

---

### Langkah 2: Buat Bucket Cloudflare R2
Jalankan perintah berikut untuk membuat bucket penyimpanan foto & berkas:
```bash
wrangler r2 bucket create siakad-storage
```

Jika ingin menggunakan nama bucket lain, sesuaikan `bucket_name` di `wrangler.jsonc`.

---

### Langkah 3: Jalankan File Migrasi Database D1
Eksekusi file migrasi SQL `0000_init.sql` ke database D1 produksi Anda:
```bash
# Untuk database remote (Cloudflare Production):
wrangler d1 execute siakad_db --remote --file=./migrations/0000_init.sql

# Untuk pengujian lokal wrangler:
wrangler d1 execute siakad_db --local --file=./migrations/0000_init.sql
```

*(Opsional) Jika menggunakan Drizzle Kit:*
```bash
npx drizzle-kit push
```

---

### Langkah 4: Set Secret Kunci Enkripsi Sesi (JWT_SECRET)
Atur token secret acak untuk otentikasi sesi:
```bash
wrangler secret put JWT_SECRET
# Masukkan kata sandi rahasia panjang, contoh: siakad_pesantren_super_secret_2026_key
```

---

### Langkah 5: Build Frontend & Deploy ke Cloudflare Workers
Build frontend React menggunakan Vite, lalu lakukan deploy:
```bash
# 1. Build assets frontend
npm run build

# 2. Deploy worker bersama static assets ke Cloudflare
wrangler deploy
```

Setelah deploy selesai, Wrangler akan memberikan URL produksi Cloudflare Workers Anda, misalnya:
`https://siakad-pesantren.<subdomain-anda>.workers.dev`

---

### Akun Awal & Login Bawaan
Setelah migrasi dijalankan, pengguna awal dapat login dengan:
- **Username:** `admin`
- **Password:** `adminpesantren123`
- **Role:** Super Admin / Administrator Akademik

*Catatan Keamanan:* Segera ganti kata sandi setelah login pertama kali di menu Pengaturan Akun.
