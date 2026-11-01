/**
 * SIAKAD Pesantren - Rute Direktori & Penugasan Staf/Asatidz (/api/staf/*)
 * 
 * Alur Kerja:
 * 1. Manajemen Kepegawaian: Mencatat guru madrasah/sekolah, ustadz/ustadzah diniyah & tahfidz,
 *    musyrif/musyrifah asrama, tata usaha, serta staf operasional.
 * 2. Penugasan per Tahun Ajaran: Menyimpan riwayat tugas (Wali Kelas, Guru Pengampu Mapel/Kitab,
 *    Musyrif Kamar) tanpa menimpa data historis tahun ajaran sebelumnya.
 * 3. Filter Terarah: Mendukung filter berdasarkan bagian, jabatan, status kepegawaian, dan jenis kelamin.
 */
import { Hono } from 'hono';

export const stafRouter = new Hono();

// Kontrak Endpoint:
// GET    /api/staf               -> Daftar staf berpaginasi + filter bagian & jabatan
// GET    /api/staf/:id           -> Profil biodata & riwayat penugasan akademik
// POST   /api/staf               -> Pendaftaran staf baru (validasi NIP unik)
// PUT    /api/staf/:id           -> Pembaruan data staf
// DELETE /api/staf/:id           -> Soft delete data staf
// POST   /api/staf/:id/penugasan -> Penugasan akademik baru per tahun ajaran
