import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';

export const tahunAjaran = sqliteTable('tahun_ajaran', {
  id: text('id').primaryKey(),
  nama: text('nama').notNull().unique(), // e.g. "2026/2027"
  semester: text('semester').notNull().default('Ganjil'), // 'Ganjil' | 'Genap'
  tanggalMulai: text('tanggal_mulai'), // e.g. "2026-07-15"
  tanggalSelesai: text('tanggal_selesai'), // e.g. "2026-12-23"
  isActive: integer('is_active').notNull().default(1),
  createdAt: text('created_at').notNull(),
});

export const lembaga = sqliteTable('lembaga', {
  id: text('id').primaryKey(),
  kode: text('kode').notNull().unique(), // 'SD', 'SMP', 'SMA', 'SMK', 'NGAJI', 'DINIYAH'
  nama: text('nama').notNull(), // 'SMP Plus Al-Barokah'
  tingkatKelas: text('tingkat_kelas').notNull(), // JSON string: ["Kelas 7", "Kelas 8", "Kelas 9"]
  keterangan: text('keterangan'),
  createdAt: text('created_at').notNull(),
});

export const staf = sqliteTable('staf', {
  id: text('id').primaryKey(),
  nip: text('nip').notNull().unique(),
  namaLengkap: text('nama_lengkap').notNull(),
  jenisKelamin: text('jenis_kelamin').notNull(), // 'L' | 'P'
  jabatan: text('jabatan').notNull(),
  mataPelajaranKitab: text('mata_pelajaran_kitab'),
  jenjangAjar: text('jenjang_ajar'),
  noHp: text('no_hp'),
  email: text('email'),
  statusKepegawaian: text('status_kepegawaian').notNull().default('tetap'),
  alamat: text('alamat'),
  pendidikanTerakhir: text('pendidikan_terakhir'),
  tanggalBergabung: text('tanggal_bergabung'),
  fotoR2Key: text('foto_r2_key'),
  fotoUrl: text('foto_url'),
  isActive: integer('is_active').notNull().default(1),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

export const asrama = sqliteTable('asrama', {
  id: text('id').primaryKey(),
  nama: text('nama').notNull().unique(), // e.g. "Gedung Al-Ghazali"
  kelompokGender: text('kelompok_gender').notNull(), // 'Putra' | 'Putri'
  kapasitas: integer('kapasitas').notNull().default(100),
  musyrifStafId: text('musyrif_staf_id').references(() => staf.id),
  keterangan: text('keterangan'),
  createdAt: text('created_at').notNull(),
});

export const kamar = sqliteTable('kamar', {
  id: text('id').primaryKey(),
  asramaId: text('asrama_id').notNull().references(() => asrama.id),
  namaKamar: text('nama_kamar').notNull(), // e.g. "Kamar 101"
  kapasitas: integer('kapasitas').notNull().default(10),
  createdAt: text('created_at').notNull(),
});

export const users = sqliteTable('users', {
  id: text('id').primaryKey(),
  username: text('username').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  salt: text('salt').notNull(),
  fullName: text('full_name').notNull(),
  role: text('role').notNull().default('superadmin'), // 'superadmin' | 'admin_lembaga' | 'pengurus_asrama' | 'viewer'
  assignedLembagaIds: text('assigned_lembaga_ids'), // JSON array: ["lembaga-smp"]
  assignedAsramaIds: text('assigned_asrama_ids'), // JSON array: ["asrama-putra-1"]
  avatarUrl: text('avatar_url'),
  phone: text('phone'),
  isActive: integer('is_active').notNull().default(1),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

export const sessions = sqliteTable('sessions', {
  id: text('id').primaryKey(),
  token: text('token').notNull().unique(),
  userId: text('user_id').notNull().references(() => users.id),
  expiresAt: text('expires_at').notNull(),
  createdAt: text('created_at').notNull(),
});

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
  
  // Denormalized readable labels for display & indexing
  jenjang: text('jenjang').notNull(), // 'SD' | 'SMP' | 'SMA' | 'SMK' | 'Ngaji Alquran' | 'Madrasah Diniyah'
  kelas: text('kelas').notNull(), // 'VII-A', 'X-TKJ-1', 'Jilid 4', dll
  asrama: text('asrama').notNull(), // 'Gedung Al-Ghazali - Kamar 101'
  kamarLabel: text('kamar_label'),
  
  status: text('status').notNull().default('aktif'), // 'aktif' | 'izin_pulang' | 'alpa' | 'skorsing' | 'lulus' | 'mutasi'
  namaAyah: text('nama_ayah'),
  namaIbu: text('nama_ibu'),
  noHpWali: text('no_hp_wali'),
  alamatAsal: text('alamat_asal'),
  kotaAsal: text('kota_asal'),
  provinsiAsal: text('provinsi_asal'),
  targetJuzHafalan: integer('target_juz_hafalan').notNull().default(30),
  capaianJuzHafalan: real('capaian_juz_hafalan').notNull().default(0.0),
  statusSpp: text('status_spp').notNull().default('lunas'),
  poinPelanggaran: integer('poin_pelanggaran').notNull().default(0),
  tahunMasuk: text('tahun_masuk').notNull().default('2024'),
  catatanKesehatan: text('catatan_kesehatan'),
  fotoR2Key: text('foto_r2_key'),
  fotoUrl: text('foto_url'),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

export const penempatanKamar = sqliteTable('penempatan_kamar', {
  id: text('id').primaryKey(),
  santriId: text('santri_id').notNull().references(() => santri.id),
  asramaId: text('asrama_id').references(() => asrama.id),
  kamarId: text('kamar_id').notNull().references(() => kamar.id),
  tahunAjaranId: text('tahun_ajaran_id').notNull().references(() => tahunAjaran.id),
  tanggalMulai: text('tanggal_mulai').notNull(),
  tanggalSelesai: text('tanggal_selesai'),
  status: text('status').notNull().default('aktif'), // 'aktif' | 'selesai' | 'pindah'
  createdAt: text('created_at').notNull(),
});

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
});

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
});
