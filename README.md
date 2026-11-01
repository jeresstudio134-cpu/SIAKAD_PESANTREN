# SIAKAD Pesantren - Sistem Informasi Akademik Santri & Staf

Sistem Informasi Akademik Pesantren modern, cepat, dan mobile-friendly yang dirancang khusus untuk mengelola data 2.000+ santri, asatidz/staf pengajar, multi-lembaga pendidikan formal & diniyah, serta manajemen asrama dan kamar berbasis Cloudflare Workers, Cloudflare D1 (SQLite), dan Cloudflare R2 Storage.

---

## 🌟 Fitur Utama

1. **Master Tahun Ajaran & Semester (Fitur Wajib)**
   - Mendukung format tahun ajaran (contoh `2026/2027`) dan semester (`Ganjil`/`Genap`).
   - Aturan ketat **Tepat Satu Tahun Ajaran Aktif** pada satu waktu.
   - Semua filter dan tampilan default mengarah ke tahun ajaran aktif, dengan fleksibilitas melihat arsip tahun ajaran lain.
   - Data historis santri (keanggotaan lembaga/kelas dan penempatan kamar) disimpan permanen per tahun ajaran tanpa ditimpa.

2. **Proses Akhir Tahun & Naik Kelas Massal**
   - Pemilihan tahun ajaran asal dan tujuan serta opsi filter per lembaga.
   - Preview interaktif: klasifikasi otomatis siapa yang naik kelas, tinggal kelas, atau lulus di tingkat akhir (berstatus Lulus/Alumni).
   - Penyesuaian manual langsung per santri sebelum dikonfirmasi.
   - Opsi penyalinan penempatan kamar dari tahun sebelumnya.
   - Fitur **Rollback / Pembatalan** proses kenaikan kelas selama tahun ajaran baru belum dikunci.

3. **Struktur Multi-Lembaga & Kelas (Rombel)**
   - Mengakomodasi santri yang terdaftar di lebih dari satu lembaga secara simultan dalam satu tahun ajaran (contoh: pagi bersekolah di SMP/SMA/SMK, sore di Madrasah Diniyah, dan malam di Madrasah Al-Qur'an & Tahfidz).

4. **Manajemen Asrama & Kamar Hunian**
   - Pengelompokan asrama putra dan putri dengan musyrif pembina.
   - Pemantauan kapasitas terisi vs daya tampung maksimal secara visual.
   - Pemindahan santri antar kamar (transfer) disertai pencatatan riwayat tanggal masuk/selesai.
   - Penandaan manual status kamar penuh (`is_full`).

5. **Direktori Santri & Paginasi Server-Side**
   - Paginasi server-side efisien (50 data per halaman) untuk performa instan menangani 2.000+ santri.
   - Multi-kriteria filter yang dapat dikombinasikan (Tahun Ajaran, Lembaga, Kelas, Asrama, Kamar, Status, Gender, Capaian Juz).
   - Chip filter aktif, tombol reset, dan fitur "Tampilan Tersimpan".
   - Tampilan kartu interaktif di perangkat mobile dan kartu tanda santri (KTS) digital.

6. **Direktori & Penugasan Staf / Asatidz**
   - Manajemen profil ustadz/ustadzah, guru pengampu, musyrif, dan staf tata usaha.
   - Pencatatan penugasan akademik per tahun ajaran (wali kelas, mata pelajaran, kitab kuning).

7. **Impor & Ekspor Excel (XLSX)**
   - **Template Excel Resmi**: Dilengkapi petunjuk, format kolom bergaris bawah wajib, dan validasi tipe data.
   - **Pencegahan Error**: NIS, NISN, dan NIK dipertahankan sebagai teks murni (angka `0` di depan tidak hilang).
   - **Batching Aman D1**: Pengiriman data per batch 50 baris untuk mematuhi batas Cloudflare D1 (maks. 100 parameter terikat).
   - **Ekspor Kustom**: Unduh santri terpilih, staf, daftar penghuni kamar, atau rekapitulasi lembaga.

8. **Keamanan & Scoped RBAC (Role-Based Access Control)**
   - Peran pengguna: `superadmin`, `admin_lembaga`, `pengurus_asrama`, dan `viewer`.
   - **Kebijakan Sandi Awal Wajib Diganti**: Akun Super Admin bawaan wajib memperbarui kata sandi awal pada login pertama sebelum mendapatkan akses penuh.
   - Sesi berbasis HTTP-Only Cookie dan hashing aman Web Crypto PBKDF2 HMAC-SHA256.
   - Audit Trail lengkap mencatat siapa, kapan, aksi apa, dan rincian perubahan data.

---

## 📁 Struktur Direktori

```
├── /worker                    # Backend Cloudflare Workers (Edge Engine)
│   ├── index.ts               # Worker Fetch Entry Point
│   ├── app.ts                 # Hono Main Application & Routing
│   ├── /routes                # Modul Rute (auth, santri, staf, master, kamar, export-import, audit)
│   ├── /services              # Business Logic (naik-kelas, r2-storage, excel-service)
│   ├── /db                    # Skema Database D1 (Drizzle ORM)
│   └── /middleware            # Autentikasi sesi & otorisasi RBAC
│
├── /src                       # Frontend React 19 + TypeScript + Vite
│   ├── /components            # Komponen UI (Tabel, Modal, FilterBar, Navbar, dsb.)
│   ├── /types                 # Definisi tipe data TypeScript
│   ├── App.tsx                # Komponen Utama Dashboard SIAKAD
│   └── main.tsx               # Entry point React
│
├── /migrations                # File SQL Migrasi Cloudflare D1
│   └── 0000_init.sql          # Inisialisasi tabel, indeks unik & indeks pencarian
│
├── server.ts                  # Server pengembangan lokal Express (D1 & R2 emulator)
├── wrangler.jsonc             # Konfigurasi Cloudflare Workers, D1 binding, & R2 bucket
└── package.json
```

---

## 🚀 Cara Menjalankan Secara Lokal

### Prasyarat
- Node.js versi 18+ atau 20+
- npm atau bun

### Metode 1: Development Server Cepat (Direkomendasikan)
Menjalankan frontend Vite dan backend Express terintegrasi dengan emulator SQLite lokal D1 dan R2.

```bash
# 1. Pasang dependensi
npm install

# 2. Jalankan server lokal
npm run dev
```

Aplikasi akan otomatis:
- Membuat database SQLite lokal di `.d1_local.sqlite`.
- Menjalankan migrasi SQL skema tabel dan indeks.
- Melakukan auto-seeding master lembaga, 7 asrama, 70 kamar, 45 staf, serta 2.000 data santri contoh.
- Membuka server di `http://localhost:3000`.

---

### Metode 2: Menjalankan dengan Wrangler Dev (Simulasi Cloudflare D1 Lokal)

Untuk menguji perilaku murni Cloudflare Workers isolates secara lokal:

```bash
# 1. Jalankan migrasi ke D1 lokal via Wrangler
npx wrangler d1 execute siakad_db --local --file=./migrations/0000_init.sql

# 2. Build frontend React
npm run build

# 3. Jalankan Wrangler development server
npx wrangler dev
```

---

## 🗄️ Panduan Migrasi Database Cloudflare D1

### 1. Eksekusi Migrasi Lokal
```bash
npx wrangler d1 execute siakad_db --local --file=./migrations/0000_init.sql
```

### 2. Eksekusi Migrasi Remote (Produksi)
Setelah membuat database di dashboard Cloudflare atau CLI:
```bash
npx wrangler d1 execute siakad_db --remote --file=./migrations/0000_init.sql
```

---

## ☁️ Panduan Deploy ke Cloudflare (Workers + D1 + R2)

### 1. Buat Cloudflare D1 Database
```bash
npx wrangler d1 create siakad_db
```
Salin nilai `database_id` yang dihasilkan ke dalam file `wrangler.jsonc`:
```json
"d1_databases": [
  {
    "binding": "DB",
    "database_name": "siakad_db",
    "database_id": "MASUKKAN_DATABASE_ID_ANDA_DI_SINI",
    "migrations_dir": "./migrations"
  }
]
```

### 2. Buat Cloudflare R2 Storage Bucket
```bash
npx wrangler r2 bucket create siakad-storage
```

### 3. Jalankan Migrasi ke Cloudflare D1 Remote
```bash
npx wrangler d1 execute siakad_db --remote --file=./migrations/0000_init.sql
```

### 4. Build Frontend & Deploy ke Cloudflare Workers
```bash
# Kompilasi frontend Vite ke direktori /dist
npm run build

# Publikasikan aplikasi ke Cloudflare
npx wrangler deploy
```

---

## 🔑 Akun & Kredensial Pengujian (Demo RBAC)

Sistem telah dilengkapi dengan akun bawaan untuk menguji berbagai batasan hak akses:

| Peran | Username | Kata Sandi Awal | Hak Akses & Cakupan |
| :--- | :--- | :--- | :--- |
| **Super Admin** | `admin` | `adminpesantren123` | Akses penuh seluruh lembaga, master data, audit logs, dan kenaikan kelas. *(Wajib ganti password pada login pertama)* |
| **Admin Lembaga** | `admin_smp` | `adminpesantren123` | Akses dibatasi khusus mengelola santri di jenjang SMP |
| **Pengurus Asrama** | `musyrif_putra` | `adminpesantren123` | Akses dibatasi khusus kamar dan santri penghuni Asrama Putra |
| **Viewer** | `viewer_smp` | `adminpesantren123` | Akses baca saja (*Read-Only*); aksi tambah/ubah/hapus ditolak server |

---

## 📄 Lisensi
Sistem Informasi Akademik Pesantren (SIAKAD) dikembangkan untuk pengelolaan manajemen santri yang aman, akurat, dan scalable.
