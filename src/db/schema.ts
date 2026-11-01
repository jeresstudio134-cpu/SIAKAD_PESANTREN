import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';

// -------------------------------------------------------------
// 1. TAHUN AJARAN
// -------------------------------------------------------------
export const tahunAjaran = sqliteTable('tahun_ajaran', {
  id: text('id').primaryKey(),
  nama: text('nama').notNull().unique(), // e.g. "2026/2027"
  semester: text('semester').notNull().default('Ganjil'), // 'Ganjil' | 'Genap'
  tanggalMulai: text('tanggal_mulai'), // e.g. "2026-07-15"
  tanggalSelesai: text('tanggal_selesai'), // e.g. "2026-12-23"
  isActive: integer('is_active').notNull().default(1),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull().default(''),
  deletedAt: text('deleted_at'),
});

// -------------------------------------------------------------
// 2. LEMBAGA PENDIDIKAN & KELAS
// -------------------------------------------------------------
export const lembaga = sqliteTable('lembaga', {
  id: text('id').primaryKey(),
  kode: text('kode').notNull().unique(), // 'SD', 'SMP', 'SMA', 'SMK', 'NGAJI', 'DINIYAH'
  nama: text('nama').notNull(), // 'SMP Plus Al-Barokah'
  tingkatKelas: text('tingkat_kelas').notNull(), // JSON string: ["Kelas 7", "Kelas 8", "Kelas 9"]
  keterangan: text('keterangan'),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull().default(''),
  deletedAt: text('deleted_at'),
});

export const kelas = sqliteTable('kelas', {
  id: text('id').primaryKey(),
  lembagaId: text('lembaga_id').notNull().references(() => lembaga.id),
  tingkat: text('tingkat').notNull(), // '7', '8', '9', '10', '11', '12', 'Awaliyah 1', 'Jilid 1'
  namaKelas: text('nama_kelas').notNull(), // 'VII-A Putra', 'X-TKJ-1'
  jurusan: text('jurusan'), // nullable e.g. 'IPA', 'IPS', 'TKJ', 'RPL', 'Tahfidz'
  kapasitas: integer('kapasitas').notNull().default(35),
  waliKelasStafId: text('wali_kelas_staf_id'),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull().default(''),
  deletedAt: text('deleted_at'),
});

// -------------------------------------------------------------
// 3. STAF & ASATIDZ & STAF PENUGASAN
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
  statusKepegawaian: text('status_kepegawaian').notNull().default('tetap'), // 'tetap', 'kontrak', 'khidmah', 'honorer'
  alamat: text('alamat'),
  pendidikanTerakhir: text('pendidikan_terakhir'),
  tanggalBergabung: text('tanggal_bergabung'),
  tanggalMulaiTugas: text('tanggal_mulai_tugas'),
  fotoR2Key: text('foto_r2_key'),
  fotoUrl: text('foto_url'),
  isActive: integer('is_active').notNull().default(1),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
  deletedAt: text('deleted_at'),
});

export const stafPenugasan = sqliteTable('staf_penugasan', {
  id: text('id').primaryKey(),
  stafId: text('staf_id').notNull().references(() => staf.id),
  tahunAjaranId: text('tahun_ajaran_id').notNull().references(() => tahunAjaran.id),
  lembagaId: text('lembaga_id').references(() => lembaga.id),
  tugasMapel: text('tugas_mapel').notNull(), // 'Guru Fiqih & Tafsir', 'Musyrif Asrama Putra 1', 'Wali Kelas VII-A'
  waliKelasId: text('wali_kelas_id').references(() => kelas.id),
  keterangan: text('keterangan'),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull().default(''),
  deletedAt: text('deleted_at'),
});

// -------------------------------------------------------------
// 4. ASRAMA & KAMAR
// -------------------------------------------------------------
export const asrama = sqliteTable('asrama', {
  id: text('id').primaryKey(),
  nama: text('nama').notNull().unique(), // e.g. "Gedung Al-Ghazali"
  kelompokGender: text('kelompok_gender').notNull(), // 'Putra' | 'Putri'
  kapasitas: integer('kapasitas').notNull().default(100),
  musyrifStafId: text('musyrif_staf_id').references(() => staf.id),
  keterangan: text('keterangan'),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull().default(''),
  deletedAt: text('deleted_at'),
});

export const kamar = sqliteTable('kamar', {
  id: text('id').primaryKey(),
  asramaId: text('asrama_id').notNull().references(() => asrama.id),
  namaKamar: text('nama_kamar').notNull(), // e.g. "Kamar 101"
  kapasitas: integer('kapasitas').notNull().default(10),
  isFull: integer('is_full').notNull().default(0),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull().default(''),
  deletedAt: text('deleted_at'),
});

// -------------------------------------------------------------
// 5. USERS, USER SCOPES & AUDIT LOGS
// -------------------------------------------------------------
export const users = sqliteTable('users', {
  id: text('id').primaryKey(),
  username: text('username').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  salt: text('salt').notNull(),
  fullName: text('full_name').notNull(),
  role: text('role').notNull().default('superadmin'), // 'superadmin' | 'admin_lembaga' | 'pengurus_asrama' | 'viewer'
  assignedLembagaIds: text('assigned_lembaga_ids'), // JSON array: ["lembaga-smp"]
  assignedAsramaIds: text('assigned_asrama_ids'), // JSON array: ["asrama-putra-1"]
  scopeAsrama: text('scope_asrama').notNull().default('semua'), // 'putra' | 'putri' | 'semua'
  avatarUrl: text('avatar_url'),
  phone: text('phone'),
  isActive: integer('is_active').notNull().default(1),
  mustChangePassword: integer('must_change_password').notNull().default(0),
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
  action: text('action').notNull(), // 'CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'NAIK_KELAS', etc.
  entityType: text('entity_type').notNull(), // 'santri', 'staf', 'tahun_ajaran', 'lembaga', 'kamar', 'kelas'
  entityId: text('entity_id'),
  details: text('details'), // JSON string
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
// 6. SANTRI & RELASI PER TAHUN AJARAN
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
  
  // Scoped Relations
  lembagaId: text('lembaga_id').references(() => lembaga.id),
  asramaId: text('asrama_id').references(() => asrama.id),
  kamarId: text('kamar_id').references(() => kamar.id),
  tahunAjaranId: text('tahun_ajaran_id').references(() => tahunAjaran.id),
  
  // Denormalized readable labels for display & fast indexing
  jenjang: text('jenjang').notNull(), // 'SD' | 'SMP' | 'SMA' | 'SMK' | 'Ngaji Alquran' | 'Madrasah Diniyah'
  kelas: text('kelas').notNull(), // 'VII-A', 'X-TKJ-1', 'Jilid 4', dll
  asrama: text('asrama').notNull(), // 'Gedung Al-Ghazali - Kamar 101'
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

// Keanggotaan Lembaga / Kelas Santri per Tahun Ajaran (Multi-Lembaga Support: SMP + Ngaji + Diniyah)
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

// Alias for backwards compatibility with riwayatAkademik
export const riwayatAkademik = sqliteTable('riwayat_akademik', {
  id: text('id').primaryKey(),
  santriId: text('santri_id').notNull().references(() => santri.id),
  tahunAjaranId: text('tahun_ajaran_id').notNull().references(() => tahunAjaran.id),
  lembagaId: text('lembaga_id').notNull().references(() => lembaga.id),
  jenjang: text('jenjang').notNull(),
  tingkatKelas: text('tingkat_kelas').notNull(),
  kelas: text('kelas').notNull(),
  status: text('status').notNull().default('aktif'), // 'aktif' | 'naik_kelas' | 'tinggal_kelas' | 'lulus' | 'mutasi'
  catatan: text('catatan'),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull().default(''),
  deletedAt: text('deleted_at'),
});

// Penempatan Kamar Santri per Tahun Ajaran
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

// Alias for backwards compatibility with penempatanKamar
export const penempatanKamar = sqliteTable('penempatan_kamar', {
  id: text('id').primaryKey(),
  santriId: text('santri_id').notNull().references(() => santri.id),
  asramaId: text('asrama_id').references(() => asrama.id),
  kamarId: text('kamar_id').notNull().references(() => kamar.id),
  tahunAjaranId: text('tahun_ajaran_id').notNull().references(() => tahunAjaran.id),
  tanggalMulai: text('tanggal_mulai').notNull(),
  tanggalSelesai: text('tanggal_selesai'),
  status: text('status').notNull().default('aktif'), // 'aktif' | 'selesai' | 'pindah'
  catatan: text('catatan'),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull().default(''),
  deletedAt: text('deleted_at'),
});

// -------------------------------------------------------------
// 7. DOKUMEN & BERKAS DIGITAL (R2 STORAGE)
// -------------------------------------------------------------
export const dokumen = sqliteTable('dokumen', {
  id: text('id').primaryKey(),
  pemilikTipe: text('pemilik_tipe').notNull(), // 'santri' | 'staf'
  pemilikId: text('pemilik_id').notNull(),
  jenis: text('jenis').notNull(), // 'KK', 'Akta Kelahiran', 'Ijazah', 'KTP Wali', 'SKHU', 'Sertifikat', 'Lainnya'
  fileKey: text('file_key').notNull(),
  namaFile: text('nama_file').notNull(),
  ukuranBytes: integer('ukuran_bytes').notNull().default(0),
  mimeType: text('mime_type'),
  url: text('url'),
  uploadedBy: text('uploaded_by'),
  catatan: text('catatan'),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull().default(''),
  deletedAt: text('deleted_at'),
});

// -------------------------------------------------------------
// 8. PROSES KENAIKAN KELAS, TAHFIDZ, PERIZINAN & PELANGGARAN
// -------------------------------------------------------------
export const prosesKenaikanKelas = sqliteTable('proses_kenaikan_kelas', {
  id: text('id').primaryKey(),
  fromTahunAjaranId: text('from_tahun_ajaran_id').notNull().references(() => tahunAjaran.id),
  toTahunAjaranId: text('to_tahun_ajaran_id').notNull().references(() => tahunAjaran.id),
  lembagaId: text('lembaga_id'), // null for all, or specific lembaga
  totalSantri: integer('total_santri').notNull().default(0),
  totalNaik: integer('total_naik').notNull().default(0),
  totalTinggal: integer('total_tinggal').notNull().default(0),
  totalLulus: integer('total_lulus').notNull().default(0),
  salinKamar: integer('salin_kamar').notNull().default(1),
  status: text('status').notNull().default('selesai'), // 'selesai' | 'dibatalkan'
  snapshotData: text('snapshot_data'), // JSON string for rollback capability
  processedByUserId: text('processed_by_user_id'),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull().default(''),
  deletedAt: text('deleted_at'),
});

export const tahfidzRecords = sqliteTable('tahfidz_records', {
  id: text('id').primaryKey(),
  santriId: text('santri_id').notNull().references(() => santri.id),
  tanggal: text('tanggal').notNull(),
  juz: integer('juz').notNull(),
  surat: text('surat').notNull(),
  ayatMulai: integer('ayat_mulai').notNull(),
  ayatSelesai: integer('ayat_selesai').notNull(),
  predikat: text('predikat').notNull(),
  pengujiStafId: text('penguji_staf_id'),
  catatan: text('catatan'),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull().default(''),
  deletedAt: text('deleted_at'),
});

export const perizinan = sqliteTable('perizinan', {
  id: text('id').primaryKey(),
  santriId: text('santri_id').notNull().references(() => santri.id),
  jenis: text('jenis').notNull(),
  tanggalMulai: text('tanggal_mulai').notNull(),
  tanggalKembali: text('tanggal_kembali').notNull(),
  status: text('status').notNull().default('diajukan'),
  penjemput: text('penjemput'),
  noHpPenjemput: text('no_hp_penjemput'),
  disetujuiOleh: text('disetujui_oleh'),
  catatan: text('catatan'),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull().default(''),
  deletedAt: text('deleted_at'),
});

export const pelanggaran = sqliteTable('pelanggaran', {
  id: text('id').primaryKey(),
  santriId: text('santri_id').notNull().references(() => santri.id),
  tanggal: text('tanggal').notNull(),
  kategori: text('kategori').notNull(),
  deskripsi: text('deskripsi').notNull(),
  poin: integer('poin').notNull(),
  sanksi: text('sanksi'),
  pencatatStafId: text('pencatat_staf_id'),
  statusPenyelesaian: text('status_penyelesaian').notNull().default('proses'),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull().default(''),
  deletedAt: text('deleted_at'),
});

export const storageFiles = sqliteTable('storage_files', {
  id: text('id').primaryKey(),
  r2Key: text('r2_key').notNull().unique(),
  originalFilename: text('original_filename').notNull(),
  contentType: text('content_type').notNull(),
  sizeBytes: integer('size_bytes').notNull(),
  uploadedBy: text('uploaded_by'),
  category: text('category').notNull(),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull().default(''),
  deletedAt: text('deleted_at'),
});
