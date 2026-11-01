/**
 * SIAKAD Pesantren - Main Hono Application for Cloudflare Workers
 * Menggabungkan seluruh endpoint dan middleware ke dalam satu instans Hono.
 *
 * Alur Utama:
 * 1. Autentikasi & RBAC: Pengelolaan cookie siakad_session, PBKDF2 hash, hak akses lembaga/asrama.
 * 2. Master Data: Tahun Ajaran (Single Active), Lembaga Multi-jenjang, Kelas, Asrama & Kamar.
 * 3. Santri & Staf: Query berpaginasi server-side (50/hal), filter multi-kriteria, detail riwayat.
 * 4. Kenaikan Kelas Massal: Transisi antar tahun ajaran, salin kamar, auto-lulus tingkat akhir.
 * 5. Import/Export Excel: Batch D1 50-baris, teks NIS preserve, template validasi.
 * 6. Berkas R2: Upload dan streaming dokumen berotentikasi.
 * 7. Audit Trail: Pencatatan mutasi dan aksi administratif.
 */
export { app } from '../src/server/app.ts';
