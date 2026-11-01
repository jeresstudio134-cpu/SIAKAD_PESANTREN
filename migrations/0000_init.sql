-- Migration: 0000_init.sql
-- Cloudflare D1 (SQLite) Schema for SIAKAD Pesantren with Multi-Lembaga, Asrama-Kamar & Scoped RBAC

CREATE TABLE IF NOT EXISTS `tahun_ajaran` (
  `id` TEXT PRIMARY KEY NOT NULL,
  `nama` TEXT NOT NULL UNIQUE,
  `semester` TEXT NOT NULL DEFAULT 'Ganjil',
  `tanggal_mulai` TEXT,
  `tanggal_selesai` TEXT,
  `is_active` INTEGER NOT NULL DEFAULT 1,
  `created_at` TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS `lembaga` (
  `id` TEXT PRIMARY KEY NOT NULL,
  `kode` TEXT NOT NULL UNIQUE,
  `nama` TEXT NOT NULL,
  `tingkat_kelas` TEXT NOT NULL,
  `keterangan` TEXT,
  `created_at` TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS `staf` (
  `id` TEXT PRIMARY KEY NOT NULL,
  `nip` TEXT NOT NULL UNIQUE,
  `nama_lengkap` TEXT NOT NULL,
  `jenis_kelamin` TEXT NOT NULL,
  `jabatan` TEXT NOT NULL,
  `mata_pelajaran_kitab` TEXT,
  `jenjang_ajar` TEXT,
  `no_hp` TEXT,
  `email` TEXT,
  `status_kepegawaian` TEXT NOT NULL DEFAULT 'tetap',
  `alamat` TEXT,
  `pendidikan_terakhir` TEXT,
  `tanggal_bergabung` TEXT,
  `foto_r2_key` TEXT,
  `foto_url` TEXT,
  `is_active` INTEGER NOT NULL DEFAULT 1,
  `created_at` TEXT NOT NULL,
  `updated_at` TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS `asrama` (
  `id` TEXT PRIMARY KEY NOT NULL,
  `nama` TEXT NOT NULL UNIQUE,
  `kelompok_gender` TEXT NOT NULL,
  `kapasitas` INTEGER NOT NULL DEFAULT 100,
  `musyrif_staf_id` TEXT REFERENCES `staf`(`id`),
  `keterangan` TEXT,
  `created_at` TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS `kamar` (
  `id` TEXT PRIMARY KEY NOT NULL,
  `asrama_id` TEXT NOT NULL REFERENCES `asrama`(`id`) ON DELETE CASCADE,
  `nama_kamar` TEXT NOT NULL,
  `kapasitas` INTEGER NOT NULL DEFAULT 10,
  `created_at` TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS `users` (
  `id` TEXT PRIMARY KEY NOT NULL,
  `username` TEXT NOT NULL UNIQUE,
  `password_hash` TEXT NOT NULL,
  `salt` TEXT NOT NULL,
  `full_name` TEXT NOT NULL,
  `role` TEXT NOT NULL DEFAULT 'superadmin',
  `assigned_lembaga_ids` TEXT,
  `assigned_asrama_ids` TEXT,
  `avatar_url` TEXT,
  `phone` TEXT,
  `is_active` INTEGER NOT NULL DEFAULT 1,
  `created_at` TEXT NOT NULL,
  `updated_at` TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS `sessions` (
  `id` TEXT PRIMARY KEY NOT NULL,
  `token` TEXT NOT NULL UNIQUE,
  `user_id` TEXT NOT NULL REFERENCES `users`(`id`) ON DELETE CASCADE,
  `expires_at` TEXT NOT NULL,
  `created_at` TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS `santri` (
  `id` TEXT PRIMARY KEY NOT NULL,
  `nis` TEXT NOT NULL UNIQUE,
  `nisn` TEXT,
  `nik` TEXT,
  `nama_lengkap` TEXT NOT NULL,
  `nama_panggilan` TEXT,
  `jenis_kelamin` TEXT NOT NULL,
  `tempat_lahir` TEXT,
  `tanggal_lahir` TEXT,
  `lembaga_id` TEXT REFERENCES `lembaga`(`id`),
  `asrama_id` TEXT REFERENCES `asrama`(`id`),
  `kamar_id` TEXT REFERENCES `kamar`(`id`),
  `tahun_ajaran_id` TEXT REFERENCES `tahun_ajaran`(`id`),
  `jenjang` TEXT NOT NULL,
  `kelas` TEXT NOT NULL,
  `asrama` TEXT NOT NULL,
  `kamar_label` TEXT,
  `status` TEXT NOT NULL DEFAULT 'aktif',
  `nama_ayah` TEXT,
  `nama_ibu` TEXT,
  `no_hp_wali` TEXT,
  `alamat_asal` TEXT,
  `kota_asal` TEXT,
  `provinsi_asal` TEXT,
  `target_juz_hafalan` INTEGER NOT NULL DEFAULT 30,
  `capaian_juz_hafalan` REAL NOT NULL DEFAULT 0.0,
  `status_spp` TEXT NOT NULL DEFAULT 'lunas',
  `poin_pelanggaran` INTEGER NOT NULL DEFAULT 0,
  `tahun_masuk` TEXT NOT NULL DEFAULT '2024',
  `catatan_kesehatan` TEXT,
  `foto_r2_key` TEXT,
  `foto_url` TEXT,
  `created_at` TEXT NOT NULL,
  `updated_at` TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS `penempatan_kamar` (
  `id` TEXT PRIMARY KEY NOT NULL,
  `santri_id` TEXT NOT NULL REFERENCES `santri`(`id`) ON DELETE CASCADE,
  `asrama_id` TEXT REFERENCES `asrama`(`id`),
  `kamar_id` TEXT NOT NULL REFERENCES `kamar`(`id`) ON DELETE CASCADE,
  `tahun_ajaran_id` TEXT NOT NULL REFERENCES `tahun_ajaran`(`id`),
  `tanggal_mulai` TEXT NOT NULL,
  `tanggal_selesai` TEXT,
  `status` TEXT NOT NULL DEFAULT 'aktif',
  `created_at` TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS `riwayat_akademik` (
  `id` TEXT PRIMARY KEY NOT NULL,
  `santri_id` TEXT NOT NULL REFERENCES `santri`(`id`) ON DELETE CASCADE,
  `tahun_ajaran_id` TEXT NOT NULL REFERENCES `tahun_ajaran`(`id`),
  `lembaga_id` TEXT NOT NULL REFERENCES `lembaga`(`id`),
  `jenjang` TEXT NOT NULL,
  `tingkat_kelas` TEXT NOT NULL,
  `kelas` TEXT NOT NULL,
  `status` TEXT NOT NULL DEFAULT 'aktif',
  `catatan` TEXT,
  `created_at` TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS `proses_kenaikan_kelas` (
  `id` TEXT PRIMARY KEY NOT NULL,
  `from_tahun_ajaran_id` TEXT NOT NULL REFERENCES `tahun_ajaran`(`id`),
  `to_tahun_ajaran_id` TEXT NOT NULL REFERENCES `tahun_ajaran`(`id`),
  `lembaga_id` TEXT,
  `total_santri` INTEGER NOT NULL DEFAULT 0,
  `total_naik` INTEGER NOT NULL DEFAULT 0,
  `total_tinggal` INTEGER NOT NULL DEFAULT 0,
  `total_lulus` INTEGER NOT NULL DEFAULT 0,
  `salin_kamar` INTEGER NOT NULL DEFAULT 1,
  `status` TEXT NOT NULL DEFAULT 'selesai',
  `snapshot_data` TEXT,
  `processed_by_user_id` TEXT,
  `created_at` TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS `tahfidz_records` (
  `id` TEXT PRIMARY KEY NOT NULL,
  `santri_id` TEXT NOT NULL REFERENCES `santri`(`id`) ON DELETE CASCADE,
  `tanggal` TEXT NOT NULL,
  `juz` INTEGER NOT NULL,
  `surat` TEXT NOT NULL,
  `ayat_mulai` INTEGER NOT NULL,
  `ayat_selesai` INTEGER NOT NULL,
  `predikat` TEXT NOT NULL,
  `penguji_staf_id` TEXT,
  `catatan` TEXT,
  `created_at` TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS `perizinan` (
  `id` TEXT PRIMARY KEY NOT NULL,
  `santri_id` TEXT NOT NULL REFERENCES `santri`(`id`) ON DELETE CASCADE,
  `jenis` TEXT NOT NULL,
  `tanggal_mulai` TEXT NOT NULL,
  `tanggal_kembali` TEXT NOT NULL,
  `status` TEXT NOT NULL DEFAULT 'diajukan',
  `penjemput` TEXT,
  `no_hp_penjemput` TEXT,
  `disetujui_oleh` TEXT,
  `catatan` TEXT,
  `created_at` TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS `pelanggaran` (
  `id` TEXT PRIMARY KEY NOT NULL,
  `santri_id` TEXT NOT NULL REFERENCES `santri`(`id`) ON DELETE CASCADE,
  `tanggal` TEXT NOT NULL,
  `kategori` TEXT NOT NULL,
  `deskripsi` TEXT NOT NULL,
  `poin` INTEGER NOT NULL,
  `sanksi` TEXT,
  `pencatat_staf_id` TEXT,
  `status_penyelesaian` TEXT NOT NULL DEFAULT 'proses',
  `created_at` TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS `storage_files` (
  `id` TEXT PRIMARY KEY NOT NULL,
  `r2_key` TEXT NOT NULL UNIQUE,
  `original_filename` TEXT NOT NULL,
  `content_type` TEXT NOT NULL,
  `size_bytes` INTEGER NOT NULL,
  `uploaded_by` TEXT,
  `category` TEXT NOT NULL,
  `created_at` TEXT NOT NULL
);

-- Indexes for lightning-fast filtered queries on 2,000+ Santri & Staf
CREATE INDEX IF NOT EXISTS idx_santri_nis ON santri(nis);
CREATE INDEX IF NOT EXISTS idx_santri_nama ON santri(nama_lengkap);
CREATE INDEX IF NOT EXISTS idx_santri_lembaga ON santri(lembaga_id);
CREATE INDEX IF NOT EXISTS idx_santri_asrama_id ON santri(asrama_id);
CREATE INDEX IF NOT EXISTS idx_santri_kamar_id ON santri(kamar_id);
CREATE INDEX IF NOT EXISTS idx_santri_gender ON santri(jenis_kelamin);
CREATE INDEX IF NOT EXISTS idx_santri_kelas ON santri(kelas);
CREATE INDEX IF NOT EXISTS idx_santri_status ON santri(status);
CREATE INDEX IF NOT EXISTS idx_asrama_gender ON asrama(kelompok_gender);
CREATE INDEX IF NOT EXISTS idx_kamar_asrama ON kamar(asrama_id);
CREATE INDEX IF NOT EXISTS idx_riwayat_santri_ta ON riwayat_akademik(santri_id, tahun_ajaran_id);
CREATE INDEX IF NOT EXISTS idx_penempatan_santri_ta ON penempatan_kamar(santri_id, tahun_ajaran_id);
CREATE INDEX IF NOT EXISTS idx_proses_kenaikan ON proses_kenaikan_kelas(from_tahun_ajaran_id, to_tahun_ajaran_id);
