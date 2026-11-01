/**
 * SIAKAD Pesantren - Rute Santri & Akademik (/api/santri/*)
 * 
 * Alur Kerja:
 * 1. Paginasi Server-Side: Query default dibatasi 50 baris per halaman guna mencegah
 *    beban memori berlebih saat menangani 2.000+ data santri.
 * 2. Multi-Kriteria Filter: Mendukung kombinasi tahun ajaran aktif/terpilih, lembaga, kelas/rombel,
 *    asrama, kamar, status santri, jenis kelamin, serta rentang capaian juz tahfidz.
 * 3. Scoped RBAC: Admin lembaga hanya melihat data santri di lembaganya; Pengurus asrama
 *    hanya melihat santri di blok asramanya.
 * 4. Detail Santri: Mengembalikan profil lengkap, riwayat keanggotaan multi-lembaga,
 *    riwayat penempatan kamar lintas tahun ajaran, dan berkas digital.
 */
import { Hono } from 'hono';

export const santriRouter = new Hono();

// Kontrak Endpoint:
// GET    /api/santri             -> Daftar santri berpaginasi (limit=50) + filter multi-kriteria
// GET    /api/santri/:id         -> Detail lengkap profil & riwayat akademik
// POST   /api/santri             -> Tambah data santri baru (validasi Zod)
// PUT    /api/santri/:id         -> Perbarui data santri
// DELETE /api/santri/:id         -> Soft-delete santri (deleted_at)
// POST   /api/santri/batch       -> Operasi massal (update status/asrama/lembaga)
