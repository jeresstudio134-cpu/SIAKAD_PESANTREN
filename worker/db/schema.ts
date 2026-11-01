/**
 * SIAKAD Pesantren - Skema Database Cloudflare D1 (SQLite)
 * Dilengkapi relasi multi-lembaga, penempatan kamar per tahun ajaran, staf penugasan, dan audit log.
 */
import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';

// -------------------------------------------------------------
// 1. TAHUN AJARAN & SEMESTER
// -------------------------------------------------------------
export const tahunAjaran = sqliteTable('tahun_ajaran', {
  id: text('id').primaryKey(),
  nama: text('nama').notNull().unique(), // Contoh: "2026/2027"
  semester: text('semester').notNull().default('Ganjil'), // 'Ganjil' | 'Genap'
  tanggalMulai: text('tanggal_mulai'),
  tanggalSelesai: text('tanggal_selesai'),
  isActive: integer('is_active').notNull().default(1), // Hanya 1 tahun ajaran aktif pada satu waktu
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull().default(''),
  deletedAt: text('deleted_at'),
});

// -------------------------------------------------------------
// 2. LEMBAGA PENDIDIKAN & KELAS (ROMBEL)
// -------------------------------------------------------------
export const lembaga = sqliteTable('lembaga', {
  id: text('id').primaryKey(),
  kode: text('kode').notNull().unique(), // 'SD', 'SMP', 'SMA', 'SMK', 'NGAJI', 'DINIYAH'
  nama: text('nama').notNull(),
  tingkatKelas: text('tingkat_kelas').notNull(), // JSON string: ["Kelas 7", "Kelas 8", "Kelas 9"]
  keterangan: text('keterangan'),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull().default(''),
  deletedAt: text('deleted_at'),
});

export const kelas = sqliteTable('kelas', {
  id: text('id').primaryKey(),
  lembagaId: text('lembaga_id').notNull().references(() => lembaga.id),
  tingkat: text('tingkat').notNull(), // '7', '8', '9', '10', 'Awaliyah 1', dll
  namaKelas: text('nama_kelas').notNull(), // 'VII-A Putra', 'X-TKJ-1'
  jurusan: text('jurusan'), // nullable e.g. 'IPA', 'IPS', 'TKJ', 'RPL', 'Tahfidz'
  kapasitas: integer('kapasitas').notNull().default(35),
  waliKelasStafId: text('wali_kelas_staf_id'),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull().default(''),
  deletedAt: text('deleted_at'),
});

// -------------------------------------------------------------
// 3. ASRAMA & KAMAR
// -------------------------------------------------------------
export const asrama = sqliteTable('asrama', {
  id: text('id').primaryKey(),
  nama: text('nama').notNull(), // 'Gedung Al-Ghazali (Putra)'
  kelompokGender: text('kelompok_gender').notNull(), // 'Putra' | 'Putri'
  kapasitas: integer('kapasitas').notNull().default(100),
  musyrifStafId: text('musyrif_staf_id'),
  keterangan: text('keterangan'),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull().default(''),
  deletedAt: text('deleted_at'),
});

export const kamar = sqliteTable('kamar', {
  id: text('id').primaryKey(),
  asramaId: text('asrama_id').notNull().references(() => asrama.id),
  namaKamar: text('nama_kamar').notNull(), // 'Kamar 101'
  kapasitas: integer('kapasitas').notNull().default(10),
  isFull: integer('is_full').notNull().default(0), // Penanda manual kamar penuh
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull().default(''),
  deletedAt: text('deleted_at'),
});

// -------------------------------------------------------------
// 4. USERS, USER SCOPES & AUDIT LOGS (RBAC)
// -------------------------------------------------------------
export const users = sqliteTable('users', {
  id: text('id').primaryKey(),
  username: text('username').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  salt: text('salt').notNull(),
  fullName: text('full_name').notNull(),
  role: text('role').notNull().default('superadmin'), // 'superadmin' | 'admin_lembaga' | 'pengurus_asrama' | 'viewer'
  assignedLembagaIds: text('assigned_lembaga_ids'), // JSON array: ["lmb-smp"]
  assignedAsramaIds: text('assigned_asrama_ids'), // JSON array: ["asr-ptr-1"]
  avatarUrl: text('avatar_url'),
  phone: text('phone'),
  isActive: integer('is_active').notNull().default(1),
  mustChangePassword: integer('must_change_password').notNull().default(0), // Password awal wajib diganti
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
  deletedAt: text('deleted_at'),
});

export const userScopes = sqliteTable('user_scopes', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id),
  scopeType: text('scope_type').notNull(), // 'lembaga' | 'asrama'
  lembagaId: text('lembaga_id').references(() => lembaga.id),
  asramaId: text('asrama_id').references(() => asrama.id),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull().default(''),
  deletedAt: text('deleted_at'),
});

export const auditLogs = sqliteTable('audit_logs', {
  id: text('id').primaryKey(),
  userId: text('user_id').references(() => users.id),
  action: text('action').notNull(), // 'CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'NAIK_KELAS', 'CHANGE_PASSWORD', dll
  entityType: text('entity_type').notNull(), // 'santri', 'staf', 'tahun_ajaran', 'lembaga', 'kamar', 'kelas'
  entityId: text('entity_id'),
  details: text('details'), // JSON string ringkasan perubahan
  ipAddress: text('ip_address'),
  createdAt: text('created_at').notNull(),
});

export const sessions = sqliteTable('sessions', {
  id: text('id').primaryKey(),
  token: text('token').notNull().unique(),
  userId: text('user_id').notNull().references(() => users.id),
  expiresAt: text('expires_at').notNull(),
  createdAt: text('created_at').notNull(),
});

// -------------------------------------------------------------
// 5. SANTRI, KEANGGOTAAN MULTI-LEMBAGA & PENEMPATAN KAMAR
// -------------------------------------------------------------
export const santri = sqliteTable('santri', {
  id: text('id').primaryKey(),
  nis: text('nis').notNull().unique(),
  nisn: text('nisn'),
  nik: text('nik'),
  namaLengkap: text('nama_lengkap').notNull(),
  namaPanggilan: text('nama_panggilan'),
  jenisKelamin: text('jenis_kelamin').notNull(), // 'L' | 'P'
  tempatLahir: text('tempat_lahir'),
  tanggalLahir: text('tanggal_lahir'),
  
  lembagaId: text('lembaga_id').references(() => lembaga.id),
  asramaId: text('asrama_id').references(() => asrama.id),
  kamarId: text('kamar_id').references(() => kamar.id),
  tahunAjaranId: text('tahun_ajaran_id').references(() => tahunAjaran.id),
  
  jenjang: text('jenjang').notNull(),
  kelas: text('kelas').notNull(),
  asrama: text('asrama').notNull(),
  kamarLabel: text('kamar_label'),
  
  status: text('status').notNull().default('aktif'), // 'aktif' | 'izin_pulang' | 'alpa' | 'skorsing' | 'lulus' | 'mutasi'
  namaAyah: text('nama_ayah'),
  namaIbu: text('nama_ibu'),
  namaWali: text('nama_wali'),
  noHpWali: text('no_hp_wali'),
  alamatAsal: text('alamat_asal'),
  kotaAsal: text('kota_asal'),
  provinsiAsal: text('provinsi_asal'),
  targetJuzHafalan: integer('target_juz_hafalan').notNull().default(30),
  capaianJuzHafalan: real('capaian_juz_hafalan').notNull().default(0.0),
  statusSpp: text('status_spp').notNull().default('lunas'),
  poinPelanggaran: integer('poin_pelanggaran').notNull().default(0),
  tanggalMasuk: text('tanggal_masuk'),
  tahunMasuk: text('tahun_masuk').notNull().default('2024'),
  catatanKesehatan: text('catatan_kesehatan'),
  catatan: text('catatan'),
  fotoR2Key: text('foto_r2_key'),
  fotoUrl: text('foto_url'),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
  deletedAt: text('deleted_at'),
});

// Riwayat keanggotaan santri per lembaga & tahun ajaran (satu santri bisa ikut SMP + Ngaji + Diniyah)
export const santriKeanggotaan = sqliteTable('santri_keanggotaan', {
  id: text('id').primaryKey(),
  santriId: text('santri_id').notNull().references(() => santri.id),
  tahunAjaranId: text('tahun_ajaran_id').notNull().references(() => tahunAjaran.id),
  lembagaId: text('lembaga_id').notNull().references(() => lembaga.id),
  kelasId: text('kelas_id').references(() => kelas.id),
  kelasNama: text('kelas_nama').notNull(),
  status: text('status').notNull().default('aktif'), // 'aktif' | 'naik' | 'tinggal' | 'lulus' | 'keluar'
  catatan: text('catatan'),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull().default(''),
  deletedAt: text('deleted_at'),
});

// Riwayat penempatan kamar santri per tahun ajaran
export const santriKamar = sqliteTable('santri_kamar', {
  id: text('id').primaryKey(),
  santriId: text('santri_id').notNull().references(() => santri.id),
  tahunAjaranId: text('tahun_ajaran_id').notNull().references(() => tahunAjaran.id),
  kamarId: text('kamar_id').notNull().references(() => kamar.id),
  asramaId: text('asrama_id').references(() => asrama.id),
  tanggalMulai: text('tanggal_mulai').notNull(),
  tanggalSelesai: text('tanggal_selesai'),
  status: text('status').notNull().default('aktif'), // 'aktif' | 'selesai' | 'pindah'
  catatan: text('catatan'),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull().default(''),
  deletedAt: text('deleted_at'),
});

// Alias tabel kompatibilitas
export const riwayatAkademik = santriKeanggotaan;
export const penempatanKamar = santriKamar;

// -------------------------------------------------------------
// 6. STAF, ASATIDZ & PENUGASAN AKADEMIK
// -------------------------------------------------------------
export const staf = sqliteTable('staf', {
  id: text('id').primaryKey(),
  nip: text('nip').notNull().unique(),
  namaLengkap: text('nama_lengkap').notNull(),
  jenisKelamin: text('jenis_kelamin').notNull(), // 'L' | 'P'
  tempatLahir: text('tempat_lahir'),
  tanggalLahir: text('tanggal_lahir'),
  jabatan: text('jabatan').notNull(),
  bagian: text('bagian').notNull().default('Guru'), // 'Guru', 'Ustadz/Ustadzah', 'Pengurus', 'Tata Usaha', 'Musyrif/Musyrifah', 'Keamanan'
  mataPelajaranKitab: text('mata_pelajaran_kitab'),
  jenjangAjar: text('jenjang_ajar'),
  noHp: text('no_hp'),
  email: text('email'),
  alamat: text('alamat'),
  statusKepegawaian: text('status_kepegawaian').notNull().default('tetap'), // 'tetap' | 'kontrak' | 'honorer' | 'pengabdian'
  tanggalMulaiTugas: text('tanggal_mulai_tugas'),
  isActive: integer('is_active').notNull().default(1),
  fotoR2Key: text('foto_r2_key'),
  fotoUrl: text('foto_url'),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
  deletedAt: text('deleted_at'),
});

export const stafPenugasan = sqliteTable('staf_penugasan', {
  id: text('id').primaryKey(),
  stafId: text('staf_id').notNull().references(() => staf.id),
  tahunAjaranId: text('tahun_ajaran_id').notNull().references(() => tahunAjaran.id),
  lembagaId: text('lembaga_id').references(() => lembaga.id),
  kelasId: text('kelas_id').references(() => kelas.id),
  tugas: text('tugas').notNull(), // 'Wali Kelas', 'Guru Pengampu', 'Musyrif Asrama'
  mataPelajaran: text('mata_pelajaran'),
  keterangan: text('keterangan'),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull().default(''),
  deletedAt: text('deleted_at'),
});

// -------------------------------------------------------------
// 7. DOKUMEN DIGITAL (BERKAS R2)
// -------------------------------------------------------------
export const dokumen = sqliteTable('dokumen', {
  id: text('id').primaryKey(),
  pemilikTipe: text('pemilik_tipe').notNull(), // 'santri' | 'staf'
  pemilikId: text('pemilik_id').notNull(),
  jenis: text('jenis').notNull(), // 'KK', 'Akta Kelahiran', 'Ijazah Terakhir', 'KTP Orang Tua'
  fileKey: text('file_key').notNull(),
  namaFile: text('nama_file').notNull(),
  ukuranBytes: integer('ukuran_bytes').notNull().default(0),
  mimeType: text('mime_type').notNull(),
  uploadedBy: text('uploaded_by'),
  catatan: text('catatan'),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull().default(''),
  deletedAt: text('deleted_at'),
});

export const dokumenSantri = dokumen;
