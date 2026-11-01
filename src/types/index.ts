export type Role = 'superadmin' | 'admin_lembaga' | 'pengurus_asrama' | 'viewer';
export type JenisKelamin = 'L' | 'P';
export type KelompokGender = 'Putra' | 'Putri';
export type StatusSantri = 'aktif' | 'izin_pulang' | 'alpa' | 'skorsing' | 'lulus' | 'mutasi';
export type StatusSpp = 'lunas' | 'tunggakan_1_bulan' | 'tunggakan_2_bulan' | 'tunggakan_3_bulan_plus';

export interface TahunAjaran {
  id: string;
  nama: string; // e.g. "2026/2027"
  semester: 'Ganjil' | 'Genap';
  tanggalMulai?: string | null; // e.g. "2026-07-15"
  tanggalSelesai?: string | null; // e.g. "2026-12-23"
  isActive: number;
  totalSantri?: number;
  createdAt: string;
}

export interface Lembaga {
  id: string;
  kode: string; // 'SD' | 'SMP' | 'SMA' | 'SMK' | 'NGAJI' | 'DINIYAH'
  nama: string;
  tingkatKelas: string[]; // parsed JSON array
  keterangan?: string | null;
  totalSantri?: number;
  createdAt: string;
}

export interface Asrama {
  id: string;
  nama: string;
  kelompokGender: KelompokGender;
  kapasitas: number;
  musyrifStafId?: string | null;
  musyrifNama?: string | null;
  kamarCount?: number;
  totalSantri?: number;
  keterangan?: string | null;
  createdAt: string;
}

export interface Kamar {
  id: string;
  asramaId: string;
  asramaNama?: string;
  asramaGender?: KelompokGender;
  namaKamar: string;
  kapasitas: number;
  isFull?: number;
  terisiCount?: number;
  createdAt: string;
}

export interface Santri {
  id: string;
  nis: string;
  nisn?: string | null;
  nik?: string | null;
  namaLengkap: string;
  namaPanggilan?: string | null;
  jenisKelamin: JenisKelamin;
  tempatLahir?: string | null;
  tanggalLahir?: string | null;
  
  lembagaId?: string | null;
  asramaId?: string | null;
  kamarId?: string | null;
  tahunAjaranId?: string | null;
  
  jenjang: string;
  kelas: string;
  asrama: string;
  kamarLabel?: string | null;
  
  status: StatusSantri;
  namaAyah?: string | null;
  namaIbu?: string | null;
  namaWali?: string | null;
  noHpWali?: string | null;
  alamatAsal?: string | null;
  kotaAsal?: string | null;
  provinsiAsal?: string | null;
  targetJuzHafalan: number;
  capaianJuzHafalan: number;
  statusSpp: StatusSpp;
  poinPelanggaran: number;
  tanggalMasuk?: string | null;
  tahunMasuk: string;
  catatanKesehatan?: string | null;
  catatan?: string | null;
  fotoR2Key?: string | null;
  fotoUrl?: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
}

export interface Staf {
  id: string;
  nip: string;
  namaLengkap: string;
  jenisKelamin: JenisKelamin;
  tempatLahir?: string | null;
  tanggalLahir?: string | null;
  jabatan: string;
  bagian?: 'Guru' | 'Ustadz/Ustadzah' | 'Pengurus' | 'Tata Usaha' | 'Musyrif/Musyrifah' | 'Keamanan' | string;
  mataPelajaranKitab?: string | null;
  jenjangAjar?: string | null;
  noHp?: string | null;
  email?: string | null;
  statusKepegawaian: 'tetap' | 'kontrak' | 'khidmah' | 'honorer' | 'pengabdian';
  alamat?: string | null;
  pendidikanTerakhir?: string | null;
  tanggalBergabung?: string | null;
  tanggalMulaiTugas?: string | null;
  fotoR2Key?: string | null;
  fotoUrl?: string | null;
  isActive: number;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
}

export interface Kelas {
  id: string;
  lembagaId: string;
  lembagaNama?: string;
  tingkat: string | number; // e.g. "7", "10", "Awaliyah"
  namaKelas: string; // e.g. "VII-A Putra"
  jurusan?: string | null; // e.g. "IPA", "IPS", "TKJ", "RPL"
  kapasitas: number;
  waliKelasStafId?: string | null;
  waliKelasNama?: string | null;
  totalSantri?: number;
  createdAt: string;
  updatedAt?: string;
  deletedAt?: string | null;
}

export interface SantriKeanggotaan {
  id: string;
  santriId: string;
  santriNama?: string;
  santriNis?: string;
  tahunAjaranId: string;
  tahunAjaranNama?: string;
  semester?: string;
  lembagaId: string;
  lembagaNama?: string;
  lembagaKode?: string;
  kelasId?: string | null;
  kelasNama: string;
  tingkat?: string | number;
  status: 'aktif' | 'naik' | 'tinggal' | 'lulus' | 'keluar';
  catatan?: string | null;
  createdAt: string;
  updatedAt?: string;
  deletedAt?: string | null;
}

export interface SantriKamar {
  id: string;
  santriId: string;
  santriNama?: string;
  tahunAjaranId: string;
  tahunAjaranNama?: string;
  kamarId: string;
  kamarNama?: string;
  asramaId?: string;
  asramaNama?: string;
  tanggalMulai: string;
  tanggalSelesai?: string | null;
  status: 'aktif' | 'selesai' | 'pindah';
  createdAt: string;
  updatedAt?: string;
  deletedAt?: string | null;
}

export interface StafPenugasan {
  id: string;
  stafId: string;
  stafNama?: string;
  tahunAjaranId: string;
  tahunAjaranNama?: string;
  semester?: string;
  lembagaId?: string | null;
  lembagaNama?: string | null;
  tugasMapel: string;
  waliKelasId?: string | null;
  waliKelasNama?: string | null;
  keterangan?: string | null;
  createdAt: string;
  updatedAt?: string;
  deletedAt?: string | null;
}

export interface Dokumen {
  id: string;
  pemilikTipe: 'santri' | 'staf';
  pemilikId: string;
  pemilikNama?: string;
  jenis: string;
  fileKey: string;
  namaFile: string;
  ukuranBytes?: number;
  ukuran?: number;
  mimeType?: string;
  url?: string;
  fileUrl?: string;
  uploadedBy?: string;
  catatan?: string | null;
  createdAt: string;
  updatedAt?: string;
  deletedAt?: string | null;
}

export interface UserScope {
  id: string;
  userId: string;
  scopeType: 'lembaga' | 'asrama';
  lembagaId?: string | null;
  asramaId?: string | null;
  targetNama?: string;
  createdAt: string;
  updatedAt?: string;
  deletedAt?: string | null;
}

export interface AuditLog {
  id: string;
  userId?: string | null;
  userFullName?: string | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  details?: any;
  ipAddress?: string | null;
  createdAt: string;
}

export interface UserSession {
  id: string;
  username: string;
  fullName: string;
  role: Role;
  assignedLembagaIds: string[];
  assignedAsramaIds: string[];
  phone?: string | null;
  avatarUrl?: string | null;
  scopeSummary?: string;
  mustChangePassword?: boolean;
}

export interface UserItem {
  id: string;
  username: string;
  fullName: string;
  role: Role;
  assignedLembagaIds: string[];
  assignedAsramaIds: string[];
  phone?: string | null;
  isActive: number;
  mustChangePassword?: number | boolean;
  createdAt: string;
}

export interface TahfidzRecord {
  id: string;
  santriId: string;
  tanggal: string;
  juz: number;
  surat: string;
  ayatMulai: number;
  ayatSelesai: number;
  predikat: 'Mumtaz' | 'Jayyid Jiddan' | 'Jayyid' | 'Maqbul' | 'Rasib';
  pengujiStafId?: string | null;
  catatan?: string | null;
  createdAt: string;
}

export interface Perizinan {
  id: string;
  santriId: string;
  jenis: 'pulang_keluarga' | 'berobat' | 'lomba' | 'keperluan_mendesak';
  tanggalMulai: string;
  tanggalKembali: string;
  status: 'diajukan' | 'disetujui' | 'selesai' | 'terlambat';
  penjemput?: string | null;
  noHpPenjemput?: string | null;
  disetujuiOleh?: string | null;
  catatan?: string | null;
  createdAt: string;
}

export interface Pelanggaran {
  id: string;
  santriId: string;
  tanggal: string;
  kategori: 'ringan' | 'sedang' | 'berat';
  deskripsi: string;
  poin: number;
  sanksi?: string | null;
  pencatatStafId?: string | null;
  statusPenyelesaian: 'proses' | 'selesai';
  createdAt: string;
}

export interface DashboardStats {
  totalSantri: number;
  santriAktif: number;
  santriIzinPulang: number;
  santriAlpaAtauSkorsing: number;
  totalStaf: number;
  totalHafidz30Juz: number;
  tunggakanSppCount: number;
  santriPutra: number;
  santriPutri: number;
  jenjangCounts: Record<string, number>;
  sppCounts: Record<string, number>;
  asramaCounts: Record<string, number>;
  scopedRole?: Role;
  scopeLabel?: string;
}

export interface RiwayatAkademik {
  id: string;
  santriId: string;
  tahunAjaranId: string;
  tahunAjaranNama?: string;
  semester?: 'Ganjil' | 'Genap';
  lembagaId: string;
  lembagaNama?: string;
  jenjang: string;
  tingkatKelas: string;
  kelas: string;
  asramaNama?: string;
  kamarNama?: string;
  status: string;
  catatan?: string | null;
  createdAt: string;
}

export interface KenaikanKelasPreviewItem {
  santriId: string;
  nis: string;
  namaLengkap: string;
  jenisKelamin: JenisKelamin;
  lembagaId: string;
  lembagaNama: string;
  jenjang: string;
  currentKelas: string;
  currentAsramaId?: string;
  currentAsramaNama?: string;
  currentKamarId?: string;
  currentKamarNama?: string;
  targetAction: 'naik_kelas' | 'tinggal_kelas' | 'lulus' | 'mutasi';
  targetKelas: string;
  targetKamarId?: string;
  targetKamarNama?: string;
  isTingkatAkhir: boolean;
  availableClasses?: string[];
  catatan?: string;
}

export interface ProsesKenaikanKelasLog {
  id: string;
  fromTahunAjaranId: string;
  fromTahunAjaranNama: string;
  toTahunAjaranId: string;
  toTahunAjaranNama: string;
  lembagaId?: string | null;
  lembagaNama?: string;
  totalSantri: number;
  totalNaik: number;
  totalTinggal: number;
  totalLulus: number;
  salinKamar: number;
  status: 'selesai' | 'dibatalkan';
  canRollback: boolean;
  createdAt: string;
}

export interface FilterParams {
  tahunAjaranId?: string;
  search?: string;
  lembagaId?: string;
  jenjang?: string;
  kelas?: string;
  asramaId?: string;
  kamarId?: string;
  jenisKelamin?: string;
  status?: string;
  statusSpp?: string;
  minJuz?: number;
  maxJuz?: number;
  minPoin?: number;
  tahunMasuk?: string;
  kotaAsal?: string;
  sortField?: string;
  sortDir?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface SavedView {
  id: string;
  nama: string;
  filters: FilterParams;
  createdAt: string;
}
