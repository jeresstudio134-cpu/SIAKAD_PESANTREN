/**
 * SIAKAD Pesantren - Rute Autentikasi & Akun Pengguna (/api/auth/*)
 * 
 * Alur Kerja:
 * 1. Login: Memverifikasi username & PBKDF2 hash, mencocokkan scope lembaga/asrama,
 *    mengeluarkan HTTP-Only cookie `siakad_session`.
 * 2. Cek Password Awal: Jika akun memiliki `mustChangePassword === 1`, sistem mewajibkan
 *    pergantian kata sandi sebelum akses menu lainnya dibuka.
 * 3. Change Password: Validasi kecocokan sandi lama, minimal 8 karakter huruf + angka,
 *    dan mencatat riwayat ke audit_logs.
 * 4. Logout: Menghapus sesi aktif dari tabel sessions dan mengosongkan cookie.
 */
import { Hono } from 'hono';

export const authRouter = new Hono();

// Kontrak Endpoint:
// POST /api/auth/login          -> Autentikasi kredensial pengguna
// POST /api/auth/quick-login    -> Beralih peran (demo/testing RBAC)
// GET  /api/auth/me             -> Mendapatkan data sesi aktif & hak akses
// POST /api/auth/change-password-> Pergantian kata sandi wajib/mandiri
// POST /api/auth/logout         -> Menghancurkan token sesi
