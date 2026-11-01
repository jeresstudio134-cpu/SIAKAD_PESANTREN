/**
 * SIAKAD Pesantren - Rute Audit Trail & Jejak Aktivitas (/api/audit-logs)
 * 
 * Alur Kerja:
 * 1. Log Aktivitas Administratif: Mencatat aksi mutasi (CREATE, UPDATE, DELETE, NAIK_KELAS,
 *    PINDAH_KAMAR, CHANGE_PASSWORD).
 * 2. RBAC Khusus: Hanya Super Admin yang berhak meninjau log aktivitas sistem.
 * 3. Informasi Lengkap: Menyimpan actor ID, waktu mutasi, entitas target, dan rincian perubahan JSON.
 */
import { Hono } from 'hono';

export const auditRouter = new Hono();

// Kontrak Endpoint:
// GET    /api/audit-logs             -> Mengambil daftar riwayat audit log terbaru
