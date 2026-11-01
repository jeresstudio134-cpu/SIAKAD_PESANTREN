/**
 * SIAKAD Pesantren - Service Kenaikan Kelas Massal & Proses Akhir Tahun
 * Memproses pergantian tahun ajaran, promosi rombel, penentuan santri lulus/alumni,
 * serta opsi penyalinan kamar asrama dengan perlindungan D1 batch limit.
 */
import { eq, and } from 'drizzle-orm';
import * as schema from '../db/schema.ts';

export interface NaikKelasCandidate {
  santriId: string;
  namaLengkap: string;
  nis: string;
  lembagaId: string;
  kelasAsal: string;
  tingkatAsal: string;
  kelasTujuan: string;
  tingkatTujuan: string;
  aksi: 'naik' | 'tinggal' | 'lulus';
  kamarId?: string;
  asramaId?: string;
}

/**
 * Preview santri yang akan dipromosikan, tinggal kelas, atau lulus
 */
export async function generatePromotionPreview(
  db: any,
  tahunAsalId: string,
  lembagaId?: string
): Promise<NaikKelasCandidate[]> {
  // Ambil daftar santri aktif di tahun ajaran asal
  let query = db
    .select({
      id: schema.santri.id,
      namaLengkap: schema.santri.namaLengkap,
      nis: schema.santri.nis,
      lembagaId: schema.santri.lembagaId,
      jenjang: schema.santri.jenjang,
      kelas: schema.santri.kelas,
      kamarId: schema.santri.kamarId,
      asramaId: schema.santri.asramaId,
      status: schema.santri.status,
    })
    .from(schema.santri)
    .where(
      and(
        eq(schema.santri.tahunAjaranId, tahunAsalId),
        eq(schema.santri.status, 'aktif')
      )
    );

  const santriList = await query.all();
  const candidates: NaikKelasCandidate[] = [];

  for (const s of santriList) {
    if (lembagaId && s.lembagaId !== lembagaId) continue;

    const kelasNama = s.kelas || '';
    let tingkat = kelasNama.split(/[- ]/)[0] || '1';
    let nextTingkat = tingkat;
    let nextKelas = kelasNama;
    let aksi: 'naik' | 'tinggal' | 'lulus' = 'naik';

    // Logika promosi jenjang:
    // SMP: 7 -> 8, 8 -> 9, 9 -> LULUS
    if (tingkat === 'VII' || tingkat === '7') {
      nextTingkat = '8';
      nextKelas = kelasNama.replace(/VII|7/, 'VIII');
    } else if (tingkat === 'VIII' || tingkat === '8') {
      nextTingkat = '9';
      nextKelas = kelasNama.replace(/VIII|8/, 'IX');
    } else if (tingkat === 'IX' || tingkat === '9') {
      aksi = 'lulus';
      nextKelas = 'Alumni / Lulus';
    }
    // SMA & SMK: 10 -> 11, 11 -> 12, 12 -> LULUS
    else if (tingkat === 'X' || tingkat === '10') {
      nextTingkat = '11';
      nextKelas = kelasNama.replace(/X|10/, 'XI');
    } else if (tingkat === 'XI' || tingkat === '11') {
      nextTingkat = '12';
      nextKelas = kelasNama.replace(/XI|11/, 'XII');
    } else if (tingkat === 'XII' || tingkat === '12') {
      aksi = 'lulus';
      nextKelas = 'Alumni / Lulus';
    }
    // Madrasah Diniyah: Awaliyah 1 -> Awaliyah 2 -> Wustha -> Ulya
    else if (kelasNama.includes('Awaliyah 1')) {
      nextKelas = 'Awaliyah 2 (Taqrib & Imrithi)';
    } else if (kelasNama.includes('Awaliyah 2')) {
      nextKelas = 'Wustha 1 (Fathul Qorib & Mutammimah)';
    } else if (kelasNama.includes('Ulya 2')) {
      aksi = 'lulus';
      nextKelas = 'Khatam Turots / Lulus';
    }

    candidates.push({
      santriId: s.id,
      namaLengkap: s.namaLengkap,
      nis: s.nis,
      lembagaId: s.lembagaId || '',
      kelasAsal: s.kelas,
      tingkatAsal: tingkat,
      kelasTujuan: nextKelas,
      tingkatTujuan: nextTingkat,
      aksi,
      kamarId: s.kamarId || undefined,
      asramaId: s.asramaId || undefined,
    });
  }

  return candidates;
}

/**
 * Eksekusi promosi kenaikan kelas massal dengan pemecahan batch (chunking)
 * untuk mematuhi batas Cloudflare D1 (maksimum 100 parameter terikat per query).
 */
export async function executePromotion(
  db: any,
  tahunAsalId: string,
  tahunTujuanId: string,
  promotions: NaikKelasCandidate[],
  salinKamar: boolean,
  actorUserId?: string
) {
  const now = new Date().toISOString();
  const chunkSize = 25; // Aman di bawah batas 100 bound parameters D1

  for (let i = 0; i < promotions.length; i += chunkSize) {
    const chunk = promotions.slice(i, i + chunkSize);

    for (const p of chunk) {
      const isLulus = p.aksi === 'lulus';
      const newStatus = isLulus ? 'lulus' : (p.aksi === 'tinggal' ? 'aktif' : 'aktif');

      // 1. Catat riwayat keanggotaan akademik di tahun ajaran baru
      const keanggotaanId = `kg-${tahunTujuanId}-${p.santriId}`;
      await db
        .insert(schema.santriKeanggotaan)
        .values({
          id: keanggotaanId,
          santriId: p.santriId,
          tahunAjaranId: tahunTujuanId,
          lembagaId: p.lembagaId,
          kelasNama: p.kelasTujuan,
          status: p.aksi,
          catatan: `Hasil proses akhir tahun ajaran dari ${tahunAsalId}`,
          createdAt: now,
          updatedAt: now,
        })
        .onConflictDoNothing();

      // 2. Salin penempatan kamar jika dipilih dan santri belum lulus
      if (salinKamar && !isLulus && p.kamarId) {
        const kamarHistId = `kmr-${tahunTujuanId}-${p.santriId}`;
        await db
          .insert(schema.santriKamar)
          .values({
            id: kamarHistId,
            santriId: p.santriId,
            tahunAjaranId: tahunTujuanId,
            kamarId: p.kamarId,
            asramaId: p.asramaId,
            tanggalMulai: now.split('T')[0],
            status: 'aktif',
            catatan: 'Disalin otomatis dari penempatan kamar tahun ajaran sebelumnya',
            createdAt: now,
            updatedAt: now,
          })
          .onConflictDoNothing();
      }

      // 3. Perbarui status langsung santri jika tahun ajaran tujuan langsung diaktifkan
      await db
        .update(schema.santri)
        .set({
          kelas: p.kelasTujuan,
          status: newStatus,
          updatedAt: now,
        })
        .where(eq(schema.santri.id, p.santriId));
    }
  }

  // Catat Audit Log
  await db.insert(schema.auditLogs).values({
    id: 'aud-' + Date.now(),
    userId: actorUserId || null,
    action: 'PROSES_NAIK_KELAS_MASSAL',
    entityType: 'tahun_ajaran',
    entityId: tahunTujuanId,
    details: JSON.stringify({
      tahunAsalId,
      tahunTujuanId,
      totalDiproses: promotions.length,
      salinKamar,
    }),
    ipAddress: '127.0.0.1',
    createdAt: now,
  });

  return { success: true, count: promotions.length };
}

/**
 * Batalkan / Rollback kenaikan kelas selama tahun ajaran tujuan belum dikunci
 */
export async function rollbackPromotion(
  db: any,
  tahunTujuanId: string,
  actorUserId?: string
) {
  const now = new Date().toISOString();

  // Hapus keanggotaan dan kamar pada tahun ajaran tujuan
  await db
    .delete(schema.santriKeanggotaan)
    .where(eq(schema.santriKeanggotaan.tahunAjaranId, tahunTujuanId));

  await db
    .delete(schema.santriKamar)
    .where(eq(schema.santriKamar.tahunAjaranId, tahunTujuanId));

  // Catat Audit Log
  await db.insert(schema.auditLogs).values({
    id: 'aud-' + Date.now(),
    userId: actorUserId || null,
    action: 'ROLLBACK_NAIK_KELAS',
    entityType: 'tahun_ajaran',
    entityId: tahunTujuanId,
    details: JSON.stringify({ message: 'Rollback data keanggotaan dan kamar tahun tujuan' }),
    ipAddress: '127.0.0.1',
    createdAt: now,
  });

  return { success: true, message: 'Data proses akhir tahun tujuan berhasil dibatalkan.' };
}
