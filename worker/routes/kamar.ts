/**
 * SIAKAD Pesantren - Rute Manajemen Asrama & Kamar (/api/kamar/*)
 * 
 * Alur Kerja:
 * 1. Monitoring Kapasitas: Menghitung santri aktif di kamar vs daya tampung maksimal (kapasitas).
 * 2. Visualisasi Penghuni: Menyajikan nama, NIS, kelas, dan kontak wali santri per kamar.
 * 3. Pemindahan Kamar (Transfer): Memindahkan santri ke kamar tujuan, otomatis menutup
 *    catatan kamar lama (`tanggalSelesai = now, status = 'pindah'`), dan membuat catatan kamar baru.
 * 4. Toggle Kamar Penuh: Penanda manual agar kamar tidak dipilih saat penempatan otomatis.
 */
import { Hono } from 'hono';

export const kamarRouter = new Hono();

// Kontrak Endpoint:
// GET    /api/kamar/:id/penghuni     -> Daftar santri penghuni kamar aktif
// POST   /api/kamar/pindah           -> Memindahkan santri ke kamar baru (validasi kapasitas)
// POST   /api/kamar/:id/toggle-penuh -> Tandai kamar penuh / tersedia
