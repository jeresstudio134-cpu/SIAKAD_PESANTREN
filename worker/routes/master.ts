/**
 * SIAKAD Pesantren - Rute Master Data (/api/master/*)
 * 
 * Alur Kerja:
 * 1. Single Active Academic Year: Hanya TEPAT SATU tahun ajaran yang boleh berstatus AKTIF.
 *    Saat tahun ajaran diaktifkan, semua tahun ajaran lain otomatis dinonaktifkan (isActive = 0),
 *    dan santri disinkronisasi ke riwayat tahun ajaran tersebut.
 * 2. Lembaga Pendidikan: Menampung multi-lembaga (SD, SMP, SMA, SMK, Ngaji Al-Qur'an, Diniyah).
 * 3. Kelas / Rombel: Rombongan belajar yang berafiliasi dengan lembaga tertentu.
 * 4. Asrama & Kamar: Struktur gedung asrama (putra/putri) dan inventaris kamar hunian.
 */
import { Hono } from 'hono';

export const masterRouter = new Hono();

// Kontrak Endpoint:
// GET    /api/master/tahun-ajaran             -> Daftar seluruh tahun ajaran & semester
// GET    /api/tahun-ajaran/active             -> Mengambil tahun ajaran aktif saat ini
// POST   /api/master/tahun-ajaran             -> Buat master tahun ajaran baru
// PUT    /api/master/tahun-ajaran/:id         -> Edit nama/semester/tanggal tahun ajaran
// POST   /api/master/tahun-ajaran/:id/activate-> Aktifkan sebagai tahun ajaran utama (Single Active)
// GET    /api/master/lembaga                  -> Daftar master lembaga pendidikan
// GET    /api/master/kelas                    -> Daftar master kelas / rombel per lembaga
// GET    /api/master/asrama                   -> Daftar asrama putra & putri
// GET    /api/master/kamar                    -> Daftar kamar beserta rekap kapasitas terisi
