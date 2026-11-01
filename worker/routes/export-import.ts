/**
 * SIAKAD Pesantren - Rute Impor & Ekspor Excel (/api/export/* & /api/import/*)
 * 
 * Alur Kerja:
 * 1. Unduh Template Excel: Menghasilkan format XLSX resmi dengan kolom bergaris bawah wajib,
 *    sheet petunjuk, serta validasi nilai kolom (Jenis Kelamin, Lembaga, dll).
 * 2. Impor Excel:
 *    - Parsing sisi klien/server.
 *    - Validasi duplikasi NIS/NIP baik di file maupun di database.
 *    - Pengawetan format teks NIS/NISN/NIK agar angka '0' depan tidak hilang.
 *    - Mode impor: "Tambah baru saja", "Update berdasarkan NIS", "Tambah + Update".
 *    - Transaksi per batch (50 baris per request) guna mematuhi batas parameter Cloudflare D1.
 * 3. Ekspor Excel:
 *    - Mengikuti filter multi-kriteria yang sedang aktif.
 *    - Pemilihan kolom yang ingin diekspor (Export santri, staf, penghuni kamar, rekap lembaga).
 */
import { Hono } from 'hono';

export const exportImportRouter = new Hono();

// Kontrak Endpoint:
// GET    /api/import/template        -> Download template kosong XLSX
// POST   /api/import/santri          -> Impor batch santri (maks 50 baris/batch)
// POST   /api/export/custom          -> Ekspor kustom file XLSX santri/staf/kamar
// GET    /api/export/rekap-lembaga   -> Ekspor rekap statistik lembaga ke Excel
