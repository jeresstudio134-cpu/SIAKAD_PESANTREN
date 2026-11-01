import { Hono } from 'hono';
import { drizzle } from 'drizzle-orm/d1';
import { eq, and, sql, desc, asc, like, or, gte, lte, inArray, isNull } from 'drizzle-orm';
import * as schema from '../db/schema.ts';
import { hashPassword, verifyPassword, generateSessionToken, getCookie } from './auth.ts';
import * as XLSX from 'xlsx';

export interface AppEnv {
  Bindings: {
    DB: any;
    BUCKET: any;
    JWT_SECRET?: string;
  };
}

export const app = new Hono<AppEnv>();

function getDb(c: any) {
  return drizzle(c.env.DB, { schema });
}

// Helper to resolve effective asrama scope: 'putra' | 'putri' | 'semua'
export function resolveUserScopeAsrama(user: any): 'putra' | 'putri' | 'semua' {
  if (!user || user.role === 'superadmin') return 'semua';
  if (user.scopeAsrama === 'putra' || user.scopeAsrama === 'putri') {
    return user.scopeAsrama;
  }
  const un = (user.username || '').toLowerCase();
  const fn = (user.fullName || '').toLowerCase();
  if (un.includes('putra') || fn.includes('putra') || un === 'musyrif_putra') return 'putra';
  if (un.includes('putri') || fn.includes('putri') || un === 'musyrifah_putri') return 'putri';
  return 'semua';
}

// Helper to check if a santri is within the user's authority scope
export function isSantriInScope(user: any, santri: any): boolean {
  if (!user || user.role === 'superadmin') return true;
  const scope = resolveUserScopeAsrama(user);
  if (scope === 'putra' && santri.jenisKelamin !== 'L') return false;
  if (scope === 'putri' && santri.jenisKelamin !== 'P') return false;

  if (user.role === 'admin_lembaga' && user.assignedLembagaIds && user.assignedLembagaIds.length > 0) {
    if (santri.lembagaId && !user.assignedLembagaIds.includes(santri.lembagaId)) return false;
  }
  if (user.role === 'pengurus_asrama' && user.assignedAsramaIds && user.assignedAsramaIds.length > 0) {
    if (santri.asramaId && !user.assignedAsramaIds.includes(santri.asramaId)) return false;
  }
  return true;
}

// Helper to get authenticated user and their scoped permissions
async function getAuthUser(c: any) {
  const cookieHeader = c.req.header('Cookie');
  const token = getCookie(cookieHeader, 'siakad_session');
  if (!token) return null;

  const db = getDb(c);
  const session = await db
    .select({
      sessionId: schema.sessions.id,
      expiresAt: schema.sessions.expiresAt,
      userId: schema.users.id,
      username: schema.users.username,
      fullName: schema.users.fullName,
      role: schema.users.role,
      assignedLembagaIds: schema.users.assignedLembagaIds,
      assignedAsramaIds: schema.users.assignedAsramaIds,
      scopeAsrama: schema.users.scopeAsrama,
      phone: schema.users.phone,
      avatarUrl: schema.users.avatarUrl,
      isActive: schema.users.isActive,
      mustChangePassword: schema.users.mustChangePassword,
    })
    .from(schema.sessions)
    .innerJoin(schema.users, eq(schema.sessions.userId, schema.users.id))
    .where(eq(schema.sessions.token, token))
    .get();

  if (!session || new Date(session.expiresAt) < new Date() || !session.isActive) {
    return null;
  }

  let lembagaIds: string[] = [];
  let asramaIds: string[] = [];

  try {
    if (session.assignedLembagaIds) {
      lembagaIds = JSON.parse(session.assignedLembagaIds);
    }
  } catch (e) {}

  try {
    if (session.assignedAsramaIds) {
      asramaIds = JSON.parse(session.assignedAsramaIds);
    }
  } catch (e) {}

  const scopeAsrama = resolveUserScopeAsrama(session);

  return {
    id: session.userId,
    username: session.username,
    fullName: session.fullName,
    role: session.role as 'superadmin' | 'admin_lembaga' | 'pengurus_asrama' | 'viewer',
    assignedLembagaIds: lembagaIds,
    assignedAsramaIds: asramaIds,
    scopeAsrama,
    phone: session.phone,
    avatarUrl: session.avatarUrl,
    mustChangePassword: session.mustChangePassword === 1,
  };
}

// -------------------------------------------------------------
// AUTH & SESSION ENDPOINTS
// -------------------------------------------------------------

app.post('/api/auth/login', async (c) => {
  try {
    const { username, password } = await c.req.json();
    if (!username || !password) {
      return c.json({ error: 'Username dan kata sandi wajib diisi' }, 400);
    }

    const db = getDb(c);
    const user = await db
      .select()
      .from(schema.users)
      .where(eq(schema.users.username, username.trim().toLowerCase()))
      .get();

    if (!user) {
      return c.json({ error: 'Username atau kata sandi tidak sesuai' }, 401);
    }

    const isMatch = await verifyPassword(password, user.passwordHash, user.salt);
    if (!isMatch) {
      return c.json({ error: 'Username atau kata sandi tidak sesuai' }, 401);
    }

    if (!user.isActive) {
      return c.json({ error: 'Akun dinonaktifkan oleh administrator' }, 403);
    }

    const token = generateSessionToken();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

    await db.insert(schema.sessions).values({
      id: 'sess-' + Math.random().toString(36).substring(2),
      token,
      userId: user.id,
      expiresAt,
      createdAt: new Date().toISOString(),
    });

    c.header('Set-Cookie', `siakad_session=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${7 * 86400}`);

    let assignedLembaga: string[] = [];
    let assignedAsrama: string[] = [];
    try {
      if (user.assignedLembagaIds) assignedLembaga = JSON.parse(user.assignedLembagaIds);
      if (user.assignedAsramaIds) assignedAsrama = JSON.parse(user.assignedAsramaIds);
    } catch (e) {}

    return c.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        fullName: user.fullName,
        role: user.role,
        assignedLembagaIds: assignedLembaga,
        assignedAsramaIds: assignedAsrama,
        scopeAsrama: resolveUserScopeAsrama(user),
        phone: user.phone,
        avatarUrl: user.avatarUrl,
        mustChangePassword: user.mustChangePassword === 1,
      },
    });
  } catch (err: any) {
    return c.json({ error: err.message }, 500);
  }
});

app.post('/api/auth/quick-login', async (c) => {
  try {
    const { username, role } = await c.req.json();
    const db = getDb(c);

    let user;
    if (username) {
      user = await db.select().from(schema.users).where(eq(schema.users.username, username)).get();
    } else if (role === 'pengurus_asrama_putra') {
      user = await db.select().from(schema.users).where(eq(schema.users.username, 'musyrif_putra')).get();
      if (!user) {
        user = await db.select().from(schema.users).where(eq(schema.users.scopeAsrama, 'putra')).get();
      }
    } else if (role === 'pengurus_asrama_putri') {
      user = await db.select().from(schema.users).where(eq(schema.users.username, 'musyrifah_putri')).get();
      if (!user) {
        user = await db.select().from(schema.users).where(eq(schema.users.scopeAsrama, 'putri')).get();
      }
    } else if (role) {
      user = await db.select().from(schema.users).where(eq(schema.users.role, role)).get();
    } else {
      user = await db.select().from(schema.users).where(eq(schema.users.role, 'superadmin')).get();
    }

    if (!user) {
      user = await db.select().from(schema.users).get();
    }

    if (!user) {
      return c.json({ error: 'Pengguna tidak ditemukan' }, 404);
    }

    const token = generateSessionToken();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

    await db.insert(schema.sessions).values({
      id: 'sess-' + Math.random().toString(36).substring(2),
      token,
      userId: user.id,
      expiresAt,
      createdAt: new Date().toISOString(),
    });

    c.header('Set-Cookie', `siakad_session=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${7 * 86400}`);

    let assignedLembaga: string[] = [];
    let assignedAsrama: string[] = [];
    try {
      if (user.assignedLembagaIds) assignedLembaga = JSON.parse(user.assignedLembagaIds);
      if (user.assignedAsramaIds) assignedAsrama = JSON.parse(user.assignedAsramaIds);
    } catch (e) {}

    return c.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        fullName: user.fullName,
        role: user.role,
        assignedLembagaIds: assignedLembaga,
        assignedAsramaIds: assignedAsrama,
        scopeAsrama: resolveUserScopeAsrama(user),
        phone: user.phone,
        avatarUrl: user.avatarUrl,
        mustChangePassword: user.mustChangePassword === 1,
      },
    });
  } catch (err: any) {
    return c.json({ error: err.message }, 500);
  }
});

app.get('/api/auth/me', async (c) => {
  const user = await getAuthUser(c);
  return c.json({ user });
});

app.post('/api/auth/change-password', async (c) => {
  try {
    const authUser = await getAuthUser(c);
    if (!authUser) {
      return c.json({ error: 'Sesi telah berakhir, silakan login kembali' }, 401);
    }

    const { currentPassword, newPassword, confirmPassword } = await c.req.json();
    if (!newPassword || newPassword.length < 8) {
      return c.json({ error: 'Kata sandi baru minimal harus 8 karakter' }, 400);
    }

    if (newPassword !== confirmPassword) {
      return c.json({ error: 'Konfirmasi kata sandi tidak cocok dengan kata sandi baru' }, 400);
    }

    const db = getDb(c);
    const user = await db.select().from(schema.users).where(eq(schema.users.id, authUser.id)).get();
    if (!user) {
      return c.json({ error: 'Pengguna tidak ditemukan' }, 404);
    }

    // Jika kata sandi saat ini disertakan, verifikasi kesesuaiannya
    if (currentPassword) {
      const isMatch = await verifyPassword(currentPassword, user.passwordHash, user.salt);
      if (!isMatch) {
        return c.json({ error: 'Kata sandi saat ini tidak sesuai' }, 400);
      }
    }

    const { hash, salt } = await hashPassword(newPassword);
    const now = new Date().toISOString();

    await db.update(schema.users).set({
      passwordHash: hash,
      salt: salt,
      mustChangePassword: 0,
      updatedAt: now,
    }).where(eq(schema.users.id, user.id));

    // Catat log audit pergantian kata sandi
    await db.insert(schema.auditLogs).values({
      id: 'aud-' + Date.now(),
      userId: user.id,
      action: 'CHANGE_PASSWORD',
      entityType: 'users',
      entityId: user.id,
      details: JSON.stringify({ message: 'Kata sandi akun berhasil diperbarui', username: user.username }),
      ipAddress: c.req.header('x-forwarded-for') || '127.0.0.1',
      createdAt: now,
    });

    return c.json({
      success: true,
      message: 'Kata sandi berhasil diperbarui. Akun Anda kini aktif dengan kredensial baru.',
    });
  } catch (err: any) {
    return c.json({ error: err.message }, 500);
  }
});

app.post('/api/auth/logout', async (c) => {
  const cookieHeader = c.req.header('Cookie');
  const token = getCookie(cookieHeader, 'siakad_session');
  if (token) {
    const db = getDb(c);
    await db.delete(schema.sessions).where(eq(schema.sessions.token, token));
  }
  c.header('Set-Cookie', 'siakad_session=; Path=/; HttpOnly; Max-Age=0');
  return c.json({ success: true });
});

// -------------------------------------------------------------
// MASTER DATA: TAHUN AJARAN, LEMBAGA, ASRAMA, KAMAR
// -------------------------------------------------------------

app.get('/api/tahun-ajaran/active', async (c) => {
  const db = getDb(c);
  const activeYear = await db
    .select()
    .from(schema.tahunAjaran)
    .where(eq(schema.tahunAjaran.isActive, 1))
    .get();

  return c.json({ data: activeYear || null });
});

app.get('/api/master/tahun-ajaran', async (c) => {
  const db = getDb(c);
  const rows = await db
    .select()
    .from(schema.tahunAjaran)
    .orderBy(desc(schema.tahunAjaran.isActive), desc(schema.tahunAjaran.nama))
    .all();

  // Attach student count registered in each academic year
  const formatted = await Promise.all(
    rows.map(async (ta) => {
      let count = 0;
      const countRes = await db
        .select({ count: sql<number>`count(distinct ${schema.riwayatAkademik.santriId})` })
        .from(schema.riwayatAkademik)
        .where(eq(schema.riwayatAkademik.tahunAjaranId, ta.id))
        .get();

      if (countRes?.count && countRes.count > 0) {
        count = countRes.count;
      } else {
        // Fallback to santri table if not in riwayat yet
        const fallbackRes = await db
          .select({ count: sql<number>`count(*)` })
          .from(schema.santri)
          .where(eq(schema.santri.tahunAjaranId, ta.id))
          .get();
        count = fallbackRes?.count || 0;
      }

      return {
        ...ta,
        totalSantri: count,
      };
    })
  );

  return c.json({ data: formatted });
});

app.post('/api/master/tahun-ajaran', async (c) => {
  const user = await getAuthUser(c);
  if (!user || user.role !== 'superadmin') {
    return c.json({ error: 'Hanya Super Admin yang berhak menambah Tahun Ajaran' }, 403);
  }
  const { nama, semester, tanggalMulai, tanggalSelesai, isActive } = await c.req.json();
  if (!nama) {
    return c.json({ error: 'Nama Tahun Ajaran wajib diisi (misal: 2027/2028)' }, 400);
  }

  const db = getDb(c);
  const existing = await db
    .select()
    .from(schema.tahunAjaran)
    .where(eq(schema.tahunAjaran.nama, nama.trim()))
    .get();

  if (existing) {
    return c.json({ error: `Tahun ajaran ${nama} sudah terdaftar` }, 409);
  }

  const id = 'ta-' + Date.now();
  const now = new Date().toISOString();

  // Hanya SATU tahun ajaran yang boleh AKTIF
  if (isActive) {
    await db.update(schema.tahunAjaran).set({ isActive: 0 });
  }

  await db.insert(schema.tahunAjaran).values({
    id,
    nama: nama.trim(),
    semester: semester || 'Ganjil',
    tanggalMulai: tanggalMulai || null,
    tanggalSelesai: tanggalSelesai || null,
    isActive: isActive ? 1 : 0,
    createdAt: now,
  });

  return c.json({ success: true, id }, 201);
});

app.put('/api/master/tahun-ajaran/:id', async (c) => {
  const user = await getAuthUser(c);
  if (!user || user.role !== 'superadmin') {
    return c.json({ error: 'Hanya Super Admin yang berhak mengubah Tahun Ajaran' }, 403);
  }

  const id = c.req.param('id');
  const payload = await c.req.json();
  const db = getDb(c);

  const updates: any = {};
  if (payload.nama) updates.nama = payload.nama.trim();
  if (payload.semester) updates.semester = payload.semester;
  if (payload.tanggalMulai !== undefined) updates.tanggalMulai = payload.tanggalMulai || null;
  if (payload.tanggalSelesai !== undefined) updates.tanggalSelesai = payload.tanggalSelesai || null;

  await db.update(schema.tahunAjaran).set(updates).where(eq(schema.tahunAjaran.id, id));
  return c.json({ success: true });
});

// Set SATU tahun ajaran sebagai AKTIF (Single Active Rule)
app.post('/api/master/tahun-ajaran/:id/activate', async (c) => {
  const user = await getAuthUser(c);
  if (!user || user.role !== 'superadmin') {
    return c.json({ error: 'Hanya Super Admin yang berhak mengaktifkan Tahun Ajaran' }, 403);
  }

  const id = c.req.param('id');
  const db = getDb(c);

  const target = await db.select().from(schema.tahunAjaran).where(eq(schema.tahunAjaran.id, id)).get();
  if (!target) {
    return c.json({ error: 'Tahun Ajaran tidak ditemukan' }, 404);
  }

  // 1. Nonaktifkan semua tahun ajaran lain
  await db.update(schema.tahunAjaran).set({ isActive: 0 });

  // 2. Aktifkan tahun ajaran target
  await db.update(schema.tahunAjaran).set({ isActive: 1 }).where(eq(schema.tahunAjaran.id, id));

  // 3. Sinkronisasi data santri aktif jika ada riwayat untuk tahun ajaran ini
  const riwayatRows = await db
    .select()
    .from(schema.riwayatAkademik)
    .where(eq(schema.riwayatAkademik.tahunAjaranId, id))
    .all();

  for (const rw of riwayatRows) {
    const penempatan = await db
      .select({
        kamarId: schema.penempatanKamar.kamarId,
        asramaId: schema.penempatanKamar.asramaId,
        namaKamar: schema.kamar.namaKamar,
        asramaNama: schema.asrama.nama,
      })
      .from(schema.penempatanKamar)
      .leftJoin(schema.kamar, eq(schema.penempatanKamar.kamarId, schema.kamar.id))
      .leftJoin(schema.asrama, eq(schema.penempatanKamar.asramaId, schema.asrama.id))
      .where(
        and(
          eq(schema.penempatanKamar.santriId, rw.santriId),
          eq(schema.penempatanKamar.tahunAjaranId, id)
        )
      )
      .get();

    const updates: any = {
      tahunAjaranId: id,
      jenjang: rw.jenjang,
      kelas: rw.kelas,
      status: rw.status === 'lulus' ? 'lulus' : (rw.status === 'mutasi' ? 'mutasi' : 'aktif'),
      updatedAt: new Date().toISOString(),
    };

    if (penempatan) {
      if (penempatan.asramaId) updates.asramaId = penempatan.asramaId;
      if (penempatan.kamarId) updates.kamarId = penempatan.kamarId;
      if (penempatan.asramaNama && penempatan.namaKamar) {
        updates.asrama = `${penempatan.asramaNama} - ${penempatan.namaKamar}`;
        updates.kamarLabel = penempatan.namaKamar;
      }
    }

    await db.update(schema.santri).set(updates).where(eq(schema.santri.id, rw.santriId));
  }

  return c.json({
    success: true,
    message: `Tahun ajaran ${target.nama} (${target.semester}) berhasil diaktifkan sebagai tahun ajaran utama.`,
  });
});

app.delete('/api/master/tahun-ajaran/:id', async (c) => {
  const user = await getAuthUser(c);
  if (!user || user.role !== 'superadmin') {
    return c.json({ error: 'Akses ditolak' }, 403);
  }

  const id = c.req.param('id');
  const db = getDb(c);

  const target = await db.select().from(schema.tahunAjaran).where(eq(schema.tahunAjaran.id, id)).get();
  if (!target) return c.json({ error: 'Tahun Ajaran tidak ditemukan' }, 404);
  if (target.isActive === 1) {
    return c.json({ error: 'Tahun ajaran aktif tidak dapat dihapus' }, 400);
  }

  // Cek apakah ada riwayat kenaikan kelas yang merujuk tahun ini
  const checkLog = await db
    .select()
    .from(schema.prosesKenaikanKelas)
    .where(or(eq(schema.prosesKenaikanKelas.fromTahunAjaranId, id), eq(schema.prosesKenaikanKelas.toTahunAjaranId, id)))
    .get();

  if (checkLog && checkLog.status === 'selesai') {
    return c.json({
      error: 'Tahun ajaran ini memiliki riwayat proses kenaikan kelas. Batalkan proses terlebih dahulu sebelum menghapus.',
    }, 400);
  }

  // Hapus riwayat & penempatan untuk tahun ini
  await db.delete(schema.riwayatAkademik).where(eq(schema.riwayatAkademik.tahunAjaranId, id));
  await db.delete(schema.penempatanKamar).where(eq(schema.penempatanKamar.tahunAjaranId, id));
  await db.delete(schema.tahunAjaran).where(eq(schema.tahunAjaran.id, id));

  return c.json({ success: true });
});

app.get('/api/master/lembaga', async (c) => {
  const db = getDb(c);
  const rows = await db.select().from(schema.lembaga).orderBy(asc(schema.lembaga.kode)).all();
  
  // Attach total santri count for each lembaga
  const formatted = await Promise.all(
    rows.map(async (l) => {
      let classes: string[] = [];
      try {
        classes = JSON.parse(l.tingkatKelas);
      } catch (e) {}

      const countRes = await db
        .select({ count: sql<number>`count(*)` })
        .from(schema.santri)
        .where(eq(schema.santri.lembagaId, l.id))
        .get();

      return {
        ...l,
        tingkatKelas: classes,
        totalSantri: countRes?.count || 0,
      };
    })
  );

  return c.json({ data: formatted });
});

app.post('/api/master/lembaga', async (c) => {
  const user = await getAuthUser(c);
  if (!user || user.role !== 'superadmin') {
    return c.json({ error: 'Hanya Super Admin yang berhak menambah Lembaga' }, 403);
  }

  const { kode, nama, tingkatKelas, keterangan } = await c.req.json();
  if (!kode || !nama) {
    return c.json({ error: 'Kode dan Nama Lembaga wajib diisi' }, 400);
  }

  const db = getDb(c);
  const id = 'lmb-' + Date.now();
  const now = new Date().toISOString();

  await db.insert(schema.lembaga).values({
    id,
    kode: kode.trim().toUpperCase(),
    nama: nama.trim(),
    tingkatKelas: Array.isArray(tingkatKelas) ? JSON.stringify(tingkatKelas) : (tingkatKelas || '[]'),
    keterangan: keterangan || null,
    createdAt: now,
  });

  return c.json({ success: true, id }, 201);
});

app.put('/api/master/lembaga/:id', async (c) => {
  const user = await getAuthUser(c);
  if (!user || user.role !== 'superadmin') {
    return c.json({ error: 'Hanya Super Admin yang berhak mengubah Lembaga' }, 403);
  }

  const id = c.req.param('id');
  const payload = await c.req.json();
  const db = getDb(c);

  const updates: any = {};
  if (payload.nama) updates.nama = payload.nama;
  if (payload.kode) updates.kode = payload.kode.toUpperCase();
  if (payload.tingkatKelas) {
    updates.tingkatKelas = Array.isArray(payload.tingkatKelas) ? JSON.stringify(payload.tingkatKelas) : payload.tingkatKelas;
  }
  if (payload.keterangan !== undefined) updates.keterangan = payload.keterangan;

  await db.update(schema.lembaga).set(updates).where(eq(schema.lembaga.id, id));
  return c.json({ success: true });
});

// -------------------------------------------------------------
// MASTER KELAS & JURUSAN (ENTITY KELAS)
// -------------------------------------------------------------
app.get('/api/master/kelas', async (c) => {
  const db = getDb(c);
  const lembagaId = c.req.query('lembagaId');
  const conds: any[] = [isNull(schema.kelas.deletedAt)];
  if (lembagaId && lembagaId !== 'semua') {
    conds.push(eq(schema.kelas.lembagaId, lembagaId));
  }

  const rows = await db
    .select({
      id: schema.kelas.id,
      lembagaId: schema.kelas.lembagaId,
      lembagaNama: schema.lembaga.nama,
      tingkat: schema.kelas.tingkat,
      namaKelas: schema.kelas.namaKelas,
      jurusan: schema.kelas.jurusan,
      kapasitas: schema.kelas.kapasitas,
      waliKelasStafId: schema.kelas.waliKelasStafId,
      waliKelasNama: schema.staf.namaLengkap,
      createdAt: schema.kelas.createdAt,
      updatedAt: schema.kelas.updatedAt,
    })
    .from(schema.kelas)
    .leftJoin(schema.lembaga, eq(schema.kelas.lembagaId, schema.lembaga.id))
    .leftJoin(schema.staf, eq(schema.kelas.waliKelasStafId, schema.staf.id))
    .where(and(...conds))
    .orderBy(asc(schema.kelas.lembagaId), asc(schema.kelas.namaKelas))
    .all();

  // Attach total santri count per kelas
  const formatted = await Promise.all(
    rows.map(async (k) => {
      const countRes = await db
        .select({ count: sql<number>`count(*)` })
        .from(schema.santri)
        .where(and(eq(schema.santri.kelas, k.namaKelas), isNull(schema.santri.deletedAt)))
        .get();

      return {
        ...k,
        totalSantri: countRes?.count || 0,
      };
    })
  );

  return c.json({ data: formatted });
});

app.post('/api/master/kelas', async (c) => {
  const user = await getAuthUser(c);
  if (!user || user.role === 'viewer') return c.json({ error: 'Akses ditolak' }, 403);
  const payload = await c.req.json();
  const db = getDb(c);
  const id = 'kls-' + Date.now();
  const now = new Date().toISOString();

  await db.insert(schema.kelas).values({
    id,
    lembagaId: payload.lembagaId,
    tingkat: payload.tingkat || payload.namaKelas.split(' ')[0],
    namaKelas: payload.namaKelas,
    jurusan: payload.jurusan || null,
    kapasitas: Number(payload.kapasitas) || 35,
    waliKelasStafId: payload.waliKelasStafId || null,
    createdAt: now,
    updatedAt: now,
  });

  return c.json({ success: true, id }, 201);
});

app.put('/api/master/kelas/:id', async (c) => {
  const user = await getAuthUser(c);
  if (!user || user.role === 'viewer') return c.json({ error: 'Akses ditolak' }, 403);
  const id = c.req.param('id');
  const payload = await c.req.json();
  const db = getDb(c);
  const now = new Date().toISOString();

  await db.update(schema.kelas).set({
    ...payload,
    kapasitas: payload.kapasitas ? Number(payload.kapasitas) : undefined,
    updatedAt: now,
  }).where(eq(schema.kelas.id, id));

  return c.json({ success: true });
});

app.delete('/api/master/kelas/:id', async (c) => {
  const user = await getAuthUser(c);
  if (!user || user.role === 'viewer') return c.json({ error: 'Akses ditolak' }, 403);
  const id = c.req.param('id');
  const db = getDb(c);
  const now = new Date().toISOString();

  // Soft delete via deleted_at
  await db.update(schema.kelas).set({ deletedAt: now }).where(eq(schema.kelas.id, id));
  return c.json({ success: true });
});

app.get('/api/master/asrama', async (c) => {
  const user = await getAuthUser(c);
  const db = getDb(c);
  const scopeAsrama = resolveUserScopeAsrama(user);

  const conds: any[] = [];
  if (scopeAsrama === 'putra') {
    conds.push(eq(schema.asrama.kelompokGender, 'Putra'));
  } else if (scopeAsrama === 'putri') {
    conds.push(eq(schema.asrama.kelompokGender, 'Putri'));
  }

  const query = db
    .select({
      id: schema.asrama.id,
      nama: schema.asrama.nama,
      kelompokGender: schema.asrama.kelompokGender,
      kapasitas: schema.asrama.kapasitas,
      musyrifStafId: schema.asrama.musyrifStafId,
      musyrifNama: schema.staf.namaLengkap,
      keterangan: schema.asrama.keterangan,
      createdAt: schema.asrama.createdAt,
    })
    .from(schema.asrama)
    .leftJoin(schema.staf, eq(schema.asrama.musyrifStafId, schema.staf.id));

  if (conds.length > 0) {
    query.where(and(...conds));
  }

  const rows = await query
    .orderBy(asc(schema.asrama.kelompokGender), asc(schema.asrama.nama))
    .all();

  const formatted = await Promise.all(
    rows.map(async (a) => {
      const kamarCount = await db
        .select({ count: sql<number>`count(*)` })
        .from(schema.kamar)
        .where(eq(schema.kamar.asramaId, a.id))
        .get();

      const santriConds: any[] = [eq(schema.santri.asramaId, a.id)];
      if (scopeAsrama === 'putra') santriConds.push(eq(schema.santri.jenisKelamin, 'L'));
      else if (scopeAsrama === 'putri') santriConds.push(eq(schema.santri.jenisKelamin, 'P'));

      const santriCount = await db
        .select({ count: sql<number>`count(*)` })
        .from(schema.santri)
        .where(and(...santriConds))
        .get();

      return {
        ...a,
        kamarCount: kamarCount?.count || 0,
        totalSantri: santriCount?.count || 0,
      };
    })
  );

  return c.json({ data: formatted });
});

app.post('/api/master/asrama', async (c) => {
  const user = await getAuthUser(c);
  if (!user || user.role !== 'superadmin') {
    return c.json({ error: 'Hanya Super Admin yang berhak menambah Asrama' }, 403);
  }

  const { nama, kelompokGender, kapasitas, musyrifStafId, keterangan } = await c.req.json();
  const db = getDb(c);
  const id = 'asr-' + Date.now();
  const now = new Date().toISOString();

  await db.insert(schema.asrama).values({
    id,
    nama,
    kelompokGender: kelompokGender || 'Putra',
    kapasitas: Number(kapasitas) || 100,
    musyrifStafId: musyrifStafId || null,
    keterangan: keterangan || null,
    createdAt: now,
  });

  return c.json({ success: true, id }, 201);
});

app.get('/api/master/kamar', async (c) => {
  const user = await getAuthUser(c);
  const db = getDb(c);
  const asramaId = c.req.query('asramaId');
  const scopeAsrama = resolveUserScopeAsrama(user);

  const conds: any[] = [];
  if (asramaId) {
    conds.push(eq(schema.kamar.asramaId, asramaId));
  }
  if (scopeAsrama === 'putra') {
    conds.push(eq(schema.asrama.kelompokGender, 'Putra'));
  } else if (scopeAsrama === 'putri') {
    conds.push(eq(schema.asrama.kelompokGender, 'Putri'));
  }

  const query = db
    .select({
      id: schema.kamar.id,
      asramaId: schema.kamar.asramaId,
      asramaNama: schema.asrama.nama,
      asramaGender: schema.asrama.kelompokGender,
      namaKamar: schema.kamar.namaKamar,
      kapasitas: schema.kamar.kapasitas,
      isFull: schema.kamar.isFull,
      createdAt: schema.kamar.createdAt,
    })
    .from(schema.kamar)
    .innerJoin(schema.asrama, eq(schema.kamar.asramaId, schema.asrama.id));

  if (conds.length > 0) {
    query.where(and(...conds));
  }

  const rows = await query.orderBy(asc(schema.asrama.nama), asc(schema.kamar.namaKamar)).all();

  const formatted = await Promise.all(
    rows.map(async (k) => {
      const santriConds: any[] = [eq(schema.santri.kamarId, k.id)];
      if (scopeAsrama === 'putra') santriConds.push(eq(schema.santri.jenisKelamin, 'L'));
      else if (scopeAsrama === 'putri') santriConds.push(eq(schema.santri.jenisKelamin, 'P'));

      const terisi = await db
        .select({ count: sql<number>`count(*)` })
        .from(schema.santri)
        .where(and(...santriConds))
        .get();

      return {
        ...k,
        terisiCount: terisi?.count || 0,
      };
    })
  );

  return c.json({ data: formatted });
});

app.post('/api/master/kamar', async (c) => {
  const user = await getAuthUser(c);
  if (!user || user.role !== 'superadmin') {
    return c.json({ error: 'Hanya Super Admin yang berhak menambah Kamar' }, 403);
  }

  const { asramaId, namaKamar, kapasitas } = await c.req.json();
  const db = getDb(c);
  const id = 'kmr-' + Date.now();
  const now = new Date().toISOString();

  await db.insert(schema.kamar).values({
    id,
    asramaId,
    namaKamar,
    kapasitas: Number(kapasitas) || 10,
    isFull: 0,
    createdAt: now,
  });

  return c.json({ success: true, id }, 201);
});

// Daftar Santri Penghuni Kamar
app.get('/api/kamar/:id/penghuni', async (c) => {
  const user = await getAuthUser(c);
  const kamarId = c.req.param('id');
  const db = getDb(c);

  const room = await db
    .select({
      id: schema.kamar.id,
      asramaId: schema.kamar.asramaId,
      kelompokGender: schema.asrama.kelompokGender,
    })
    .from(schema.kamar)
    .innerJoin(schema.asrama, eq(schema.kamar.asramaId, schema.asrama.id))
    .where(eq(schema.kamar.id, kamarId))
    .get();

  if (!room) {
    return c.json({ error: 'Kamar tidak ditemukan' }, 404);
  }

  const scopeAsrama = resolveUserScopeAsrama(user);
  if (scopeAsrama === 'putra' && room.kelompokGender !== 'Putra') {
    return c.json({ error: 'Akses ditolak: Kamar ini berada di luar cakupan wewenang Anda (Asrama Putra)' }, 403);
  }
  if (scopeAsrama === 'putri' && room.kelompokGender !== 'Putri') {
    return c.json({ error: 'Akses ditolak: Kamar ini berada di luar cakupan wewenang Anda (Asrama Putri)' }, 403);
  }

  const conds: any[] = [eq(schema.santri.kamarId, kamarId), isNull(schema.santri.deletedAt)];
  if (scopeAsrama === 'putra') {
    conds.push(eq(schema.santri.jenisKelamin, 'L'));
  } else if (scopeAsrama === 'putri') {
    conds.push(eq(schema.santri.jenisKelamin, 'P'));
  }

  const santriList = await db
    .select({
      id: schema.santri.id,
      nis: schema.santri.nis,
      namaLengkap: schema.santri.namaLengkap,
      jenisKelamin: schema.santri.jenisKelamin,
      jenjang: schema.santri.jenjang,
      kelas: schema.santri.kelas,
      status: schema.santri.status,
      namaAyah: schema.santri.namaAyah,
      namaIbu: schema.santri.namaIbu,
      namaWali: schema.santri.namaWali,
      noHpWali: schema.santri.noHpWali,
      kotaAsal: schema.santri.kotaAsal,
      capaianJuzHafalan: schema.santri.capaianJuzHafalan,
      fotoUrl: schema.santri.fotoUrl,
    })
    .from(schema.santri)
    .where(and(...conds))
    .orderBy(asc(schema.santri.namaLengkap))
    .all();

  return c.json({ data: santriList });
});

// Tandai Kamar Penuh / Buka Kamar (Toggle)
app.post('/api/kamar/:id/toggle-penuh', async (c) => {
  const user = await getAuthUser(c);
  if (!user || user.role === 'viewer') return c.json({ error: 'Akses ditolak: Viewer read-only' }, 403);
  const id = c.req.param('id');
  const db = getDb(c);

  const room = await db
    .select({
      id: schema.kamar.id,
      namaKamar: schema.kamar.namaKamar,
      isFull: schema.kamar.isFull,
      asramaId: schema.kamar.asramaId,
      kelompokGender: schema.asrama.kelompokGender,
    })
    .from(schema.kamar)
    .innerJoin(schema.asrama, eq(schema.kamar.asramaId, schema.asrama.id))
    .where(eq(schema.kamar.id, id))
    .get();

  if (!room) return c.json({ error: 'Kamar tidak ditemukan' }, 404);

  const scopeAsrama = resolveUserScopeAsrama(user);
  if (scopeAsrama === 'putra' && room.kelompokGender !== 'Putra') {
    return c.json({ error: 'Akses ditolak: Kamar ini di luar cakupan wewenang Anda (Asrama Putra)' }, 403);
  }
  if (scopeAsrama === 'putri' && room.kelompokGender !== 'Putri') {
    return c.json({ error: 'Akses ditolak: Kamar ini di luar cakupan wewenang Anda (Asrama Putri)' }, 403);
  }

  const newStatus = (room.isFull === 1) ? 0 : 1;
  const now = new Date().toISOString();

  await db.update(schema.kamar).set({ isFull: newStatus, updatedAt: now }).where(eq(schema.kamar.id, id));

  await db.insert(schema.auditLogs).values({
    id: 'log-' + Date.now(),
    userId: user.id,
    action: 'UPDATE',
    entityType: 'kamar',
    entityId: id,
    details: JSON.stringify({
      aksi: newStatus === 1 ? 'Tandai Kamar Penuh' : 'Buka Kamar Tersedia',
      namaKamar: room.namaKamar,
    }),
    createdAt: now,
  });

  return c.json({ success: true, isFull: newStatus });
});

// Fitur Pindah Kamar Santri
app.post('/api/kamar/pindah', async (c) => {
  const user = await getAuthUser(c);
  if (!user || user.role === 'viewer') return c.json({ error: 'Akses ditolak: Viewer read-only' }, 403);

  const { santriId, targetKamarId, catatan } = await c.req.json();
  if (!santriId || !targetKamarId) {
    return c.json({ error: 'Santri dan Kamar Tujuan wajib dipilih' }, 400);
  }

  const db = getDb(c);
  const santri = await db.select().from(schema.santri).where(eq(schema.santri.id, santriId)).get();
  if (!santri) return c.json({ error: 'Santri tidak ditemukan' }, 404);

  // SERVER-SIDE SCOPE ENFORCEMENT ON SANTRI:
  if (!isSantriInScope(user, santri)) {
    return c.json({ error: 'Akses ditolak: Santri ini di luar cakupan wewenang Anda' }, 403);
  }

  const targetKamar = await db
    .select({
      id: schema.kamar.id,
      namaKamar: schema.kamar.namaKamar,
      kapasitas: schema.kamar.kapasitas,
      isFull: schema.kamar.isFull,
      asramaId: schema.asrama.id,
      asramaNama: schema.asrama.nama,
      kelompokGender: schema.asrama.kelompokGender,
    })
    .from(schema.kamar)
    .innerJoin(schema.asrama, eq(schema.kamar.asramaId, schema.asrama.id))
    .where(eq(schema.kamar.id, targetKamarId))
    .get();

  if (!targetKamar) return c.json({ error: 'Kamar tujuan tidak ditemukan' }, 404);

  const scopeAsrama = resolveUserScopeAsrama(user);
  if (scopeAsrama === 'putra' && targetKamar.kelompokGender !== 'Putra') {
    return c.json({ error: 'Akses ditolak: Kamar tujuan berada di luar wewenang Anda (Asrama Putra)' }, 403);
  }
  if (scopeAsrama === 'putri' && targetKamar.kelompokGender !== 'Putri') {
    return c.json({ error: 'Akses ditolak: Kamar tujuan berada di luar wewenang Anda (Asrama Putri)' }, 403);
  }

  const requiredGender = targetKamar.kelompokGender === 'Putra' ? 'L' : 'P';
  if (santri.jenisKelamin !== requiredGender) {
    return c.json({
      error: `Kamar berada di ${targetKamar.asramaNama} (${targetKamar.kelompokGender}), sedangkan santri adalah ${santri.jenisKelamin === 'L' ? 'Putra' : 'Putri'}`
    }, 400);
  }

  const countOccupants = await db
    .select({ count: sql<number>`count(*)` })
    .from(schema.santri)
    .where(and(eq(schema.santri.kamarId, targetKamarId), isNull(schema.santri.deletedAt)))
    .get();

  const currentOccupants = countOccupants?.count || 0;
  if (currentOccupants >= targetKamar.kapasitas && targetKamar.isFull === 1) {
    return c.json({ error: `Kamar ${targetKamar.namaKamar} sudah ditandai penuh (${currentOccupants}/${targetKamar.kapasitas})` }, 400);
  }

  const oldAsrama = santri.asrama;
  const oldKamar = santri.kamarLabel;
  const newAsrama = `${targetKamar.asramaNama} - ${targetKamar.namaKamar}`;
  const now = new Date().toISOString();

  await db.update(schema.santri).set({
    asramaId: targetKamar.asramaId,
    kamarId: targetKamar.id,
    asrama: newAsrama,
    kamarLabel: targetKamar.namaKamar,
    updatedAt: now,
  }).where(eq(schema.santri.id, santriId));

  await db.insert(schema.penempatanKamar).values({
    id: 'pk-' + Date.now(),
    santriId,
    asramaId: targetKamar.asramaId,
    kamarId: targetKamar.id,
    tahunAjaranId: santri.tahunAjaranId || 'ta-default',
    tanggalMulai: now.split('T')[0],
    status: 'aktif',
    catatan: catatan || `Pindah dari ${oldAsrama || 'Kamar sebelumnya'}`,
    createdAt: now,
  });

  await db.insert(schema.auditLogs).values({
    id: 'log-' + Date.now(),
    userId: user.id,
    action: 'PINDAH_KAMAR',
    entityType: 'santri',
    entityId: santriId,
    details: JSON.stringify({
      namaSantri: santri.namaLengkap,
      nis: santri.nis,
      kamarAsal: `${oldAsrama} (${oldKamar})`,
      kamarTujuan: newAsrama,
      catatan,
    }),
    createdAt: now,
  });

  return c.json({
    success: true,
    message: `Santri ${santri.namaLengkap} berhasil dipindahkan ke ${newAsrama}`,
  });
});

// -------------------------------------------------------------
// USER MANAGEMENT (SUPERADMIN ONLY)
// -------------------------------------------------------------

app.get('/api/users', async (c) => {
  const user = await getAuthUser(c);
  if (!user || user.role !== 'superadmin') {
    return c.json({ error: 'Akses ditolak: Hanya Super Admin yang dapat mengelola pengguna' }, 403);
  }

  const db = getDb(c);
  const rows = await db.select().from(schema.users).orderBy(asc(schema.users.username)).all();

  const formatted = rows.map((u) => {
    let lembagaIds: string[] = [];
    let asramaIds: string[] = [];
    try {
      if (u.assignedLembagaIds) lembagaIds = JSON.parse(u.assignedLembagaIds);
      if (u.assignedAsramaIds) asramaIds = JSON.parse(u.assignedAsramaIds);
    } catch (e) {}

    return {
      id: u.id,
      username: u.username,
      fullName: u.fullName,
      role: u.role,
      assignedLembagaIds: lembagaIds,
      assignedAsramaIds: asramaIds,
      scopeAsrama: u.scopeAsrama || 'semua',
      phone: u.phone,
      isActive: u.isActive,
      createdAt: u.createdAt,
    };
  });

  return c.json({ data: formatted });
});

app.post('/api/users', async (c) => {
  const currentUser = await getAuthUser(c);
  if (!currentUser || currentUser.role !== 'superadmin') {
    return c.json({ error: 'Akses ditolak: Hanya Super Admin yang dapat membuat pengguna baru' }, 403);
  }

  const payload = await c.req.json();
  const { username, password, fullName, role, assignedLembagaIds, assignedAsramaIds, scopeAsrama, phone } = payload;

  if (!username || !password || !fullName || !role) {
    return c.json({ error: 'Username, password, nama lengkap, dan role wajib diisi' }, 400);
  }

  const db = getDb(c);
  const existing = await db.select().from(schema.users).where(eq(schema.users.username, username.trim().toLowerCase())).get();
  if (existing) {
    return c.json({ error: 'Username sudah digunakan' }, 409);
  }

  const { hash, salt } = await hashPassword(password);
  const now = new Date().toISOString();
  const id = 'usr-' + Date.now();

  await db.insert(schema.users).values({
    id,
    username: username.trim().toLowerCase(),
    passwordHash: hash,
    salt,
    fullName: fullName.trim(),
    role,
    assignedLembagaIds: Array.isArray(assignedLembagaIds) ? JSON.stringify(assignedLembagaIds) : null,
    assignedAsramaIds: Array.isArray(assignedAsramaIds) ? JSON.stringify(assignedAsramaIds) : null,
    scopeAsrama: scopeAsrama || 'semua',
    phone: phone || null,
    isActive: 1,
    createdAt: now,
    updatedAt: now,
  });

  return c.json({ success: true, id }, 201);
});

app.put('/api/users/:id', async (c) => {
  const currentUser = await getAuthUser(c);
  if (!currentUser || currentUser.role !== 'superadmin') {
    return c.json({ error: 'Akses ditolak' }, 403);
  }

  const id = c.req.param('id');
  const payload = await c.req.json();
  const db = getDb(c);
  const now = new Date().toISOString();

  const updates: any = {
    fullName: payload.fullName,
    role: payload.role,
    phone: payload.phone || null,
    isActive: payload.isActive !== undefined ? payload.isActive : 1,
    assignedLembagaIds: Array.isArray(payload.assignedLembagaIds) ? JSON.stringify(payload.assignedLembagaIds) : null,
    assignedAsramaIds: Array.isArray(payload.assignedAsramaIds) ? JSON.stringify(payload.assignedAsramaIds) : null,
    updatedAt: now,
  };

  if (payload.scopeAsrama !== undefined) {
    updates.scopeAsrama = payload.scopeAsrama;
  }

  if (payload.password) {
    const { hash, salt } = await hashPassword(payload.password);
    updates.passwordHash = hash;
    updates.salt = salt;
  }

  await db.update(schema.users).set(updates).where(eq(schema.users.id, id));
  return c.json({ success: true });
});

app.delete('/api/users/:id', async (c) => {
  const currentUser = await getAuthUser(c);
  if (!currentUser || currentUser.role !== 'superadmin') {
    return c.json({ error: 'Akses ditolak' }, 403);
  }

  const id = c.req.param('id');
  if (id === currentUser.id) {
    return c.json({ error: 'Tidak dapat menghapus akun Anda sendiri' }, 400);
  }

  const db = getDb(c);
  await db.delete(schema.users).where(eq(schema.users.id, id));
  return c.json({ success: true });
});

// -------------------------------------------------------------
// HELPER: SERVER-SIDE SCOPE ENFORCEMENT ON EVERY SANTRI QUERY
// -------------------------------------------------------------
function buildScopeEnforcementConditions(user: any) {
  const scopeConditions: any[] = [isNull(schema.santri.deletedAt)];
  if (!user || user.role === 'superadmin') {
    return scopeConditions;
  }

  // Enforce Asrama / Gender Scope strictly on server
  const scopeAsrama = resolveUserScopeAsrama(user);
  if (scopeAsrama === 'putra') {
    scopeConditions.push(eq(schema.santri.jenisKelamin, 'L'));
  } else if (scopeAsrama === 'putri') {
    scopeConditions.push(eq(schema.santri.jenisKelamin, 'P'));
  }

  if (user.role === 'admin_lembaga') {
    if (user.assignedLembagaIds && user.assignedLembagaIds.length > 0) {
      scopeConditions.push(inArray(schema.santri.lembagaId, user.assignedLembagaIds));
    } else {
      // User has no assigned lembaga, restrict all
      scopeConditions.push(sql`1 = 0`);
    }
  } else if (user.role === 'pengurus_asrama') {
    if (user.assignedAsramaIds && user.assignedAsramaIds.length > 0) {
      scopeConditions.push(inArray(schema.santri.asramaId, user.assignedAsramaIds));
    }
  } else if (user.role === 'viewer') {
    // If viewer has assigned lembaga or asrama, enforce it
    if (user.assignedLembagaIds && user.assignedLembagaIds.length > 0) {
      scopeConditions.push(inArray(schema.santri.lembagaId, user.assignedLembagaIds));
    }
    if (user.assignedAsramaIds && user.assignedAsramaIds.length > 0) {
      scopeConditions.push(inArray(schema.santri.asramaId, user.assignedAsramaIds));
    }
  }

  return scopeConditions;
}

// -------------------------------------------------------------
// SANTRI ENDPOINTS (SERVER-SIDE SCOPE FORCED)
// -------------------------------------------------------------

app.get('/api/santri', async (c) => {
  try {
    const user = await getAuthUser(c);
    const db = getDb(c);

    const q = c.req.query('search')?.trim() || '';
    const tahunAjaranId = c.req.query('tahunAjaranId');
    const lembagaId = c.req.query('lembagaId');
    const jenjang = c.req.query('jenjang');
    const kelas = c.req.query('kelas');
    const asramaId = c.req.query('asramaId');
    const kamarId = c.req.query('kamarId');
    const jk = c.req.query('jenisKelamin');
    const status = c.req.query('status');
    const statusSpp = c.req.query('statusSpp');
    const minJuz = c.req.query('minJuz') ? parseFloat(c.req.query('minJuz')!) : undefined;
    const maxJuz = c.req.query('maxJuz') ? parseFloat(c.req.query('maxJuz')!) : undefined;
    const minPoin = c.req.query('minPoin') ? parseInt(c.req.query('minPoin')!, 10) : undefined;

    const page = Math.max(1, parseInt(c.req.query('page') || '1', 10));
    const limit = Math.min(200, Math.max(10, parseInt(c.req.query('limit') || '50', 10)));
    const offset = (page - 1) * limit;

    const sortField = c.req.query('sortField') || 'nis';
    const sortDir = c.req.query('sortDir') === 'desc' ? 'desc' : 'asc';

    const conditions: any[] = [];

    // 1. FORCED SERVER-SIDE SCOPE
    const scopeConditions = buildScopeEnforcementConditions(user);
    conditions.push(...scopeConditions);

    // 2. Tahun Ajaran Filter
    if (tahunAjaranId && tahunAjaranId !== 'semua') {
      conditions.push(
        or(
          eq(schema.santri.tahunAjaranId, tahunAjaranId),
          sql`EXISTS (SELECT 1 FROM riwayat_akademik ra WHERE ra.santri_id = ${schema.santri.id} AND ra.tahun_ajaran_id = ${tahunAjaranId})`
        )
      );
    }

    // 3. Client query parameters
    if (q) {
      const pattern = `%${q}%`;
      conditions.push(
        or(
          like(schema.santri.nis, pattern),
          like(schema.santri.namaLengkap, pattern),
          like(schema.santri.nik, pattern),
          like(schema.santri.namaAyah, pattern),
          like(schema.santri.namaIbu, pattern),
          like(schema.santri.kotaAsal, pattern)
        )
      );
    }

    if (lembagaId && lembagaId !== 'semua') {
      conditions.push(eq(schema.santri.lembagaId, lembagaId));
    }
    if (jenjang && jenjang !== 'semua') {
      conditions.push(eq(schema.santri.jenjang, jenjang));
    }
    if (kelas && kelas !== 'semua') {
      conditions.push(eq(schema.santri.kelas, kelas));
    }
    const userScope = resolveUserScopeAsrama(user);
    if (asramaId && asramaId !== 'semua') {
      conditions.push(eq(schema.santri.asramaId, asramaId));
    }
    if (kamarId && kamarId !== 'semua') {
      conditions.push(eq(schema.santri.kamarId, kamarId));
    }
    if (jk && jk !== 'semua') {
      if (userScope === 'putra' && jk !== 'L') {
        conditions.push(sql`1 = 0`);
      } else if (userScope === 'putri' && jk !== 'P') {
        conditions.push(sql`1 = 0`);
      } else {
        conditions.push(eq(schema.santri.jenisKelamin, jk as any));
      }
    }
    if (status && status !== 'semua') {
      conditions.push(eq(schema.santri.status, status as any));
    }
    if (statusSpp && statusSpp !== 'semua') {
      conditions.push(eq(schema.santri.statusSpp, statusSpp as any));
    }
    if (minJuz !== undefined && !isNaN(minJuz)) {
      conditions.push(gte(schema.santri.capaianJuzHafalan, minJuz));
    }
    if (maxJuz !== undefined && !isNaN(maxJuz)) {
      conditions.push(lte(schema.santri.capaianJuzHafalan, maxJuz));
    }
    if (minPoin !== undefined && !isNaN(minPoin)) {
      conditions.push(gte(schema.santri.poinPelanggaran, minPoin));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const countQuery = db.select({ count: sql<number>`count(*)` }).from(schema.santri);
    if (whereClause) countQuery.where(whereClause);
    const countResult = await countQuery.get();
    const total = countResult?.count ?? 0;

    let orderByCol: any = schema.santri.nis;
    if (sortField === 'namaLengkap') orderByCol = schema.santri.namaLengkap;
    else if (sortField === 'kelas') orderByCol = schema.santri.kelas;
    else if (sortField === 'asrama') orderByCol = schema.santri.asrama;
    else if (sortField === 'capaianJuzHafalan') orderByCol = schema.santri.capaianJuzHafalan;
    else if (sortField === 'status') orderByCol = schema.santri.status;
    else if (sortField === 'statusSpp') orderByCol = schema.santri.statusSpp;
    else if (sortField === 'poinPelanggaran') orderByCol = schema.santri.poinPelanggaran;

    const query = db.select().from(schema.santri);
    if (whereClause) query.where(whereClause);

    query
      .orderBy(sortDir === 'desc' ? desc(orderByCol) : asc(orderByCol))
      .limit(limit)
      .offset(offset);

    const rows = await query.all();

    // Jika sedang melihat Tahun Ajaran non-aktif (arsip/riwayat), sinkronkan tampilan dengan riwayat tahun bersangkutan
    let finalRows = rows;
    if (tahunAjaranId && tahunAjaranId !== 'semua') {
      finalRows = await Promise.all(
        rows.map(async (st) => {
          const rw = await db
            .select()
            .from(schema.riwayatAkademik)
            .where(
              and(
                eq(schema.riwayatAkademik.santriId, st.id),
                eq(schema.riwayatAkademik.tahunAjaranId, tahunAjaranId)
              )
            )
            .get();

          const pk = await db
            .select({
              kamarId: schema.penempatanKamar.kamarId,
              asramaId: schema.penempatanKamar.asramaId,
              namaKamar: schema.kamar.namaKamar,
              asramaNama: schema.asrama.nama,
            })
            .from(schema.penempatanKamar)
            .leftJoin(schema.kamar, eq(schema.penempatanKamar.kamarId, schema.kamar.id))
            .leftJoin(schema.asrama, eq(schema.penempatanKamar.asramaId, schema.asrama.id))
            .where(
              and(
                eq(schema.penempatanKamar.santriId, st.id),
                eq(schema.penempatanKamar.tahunAjaranId, tahunAjaranId)
              )
            )
            .get();

          if (!rw && !pk) return st;

          return {
            ...st,
            kelas: rw ? rw.kelas : st.kelas,
            jenjang: rw ? rw.jenjang : st.jenjang,
            status: rw ? (rw.status as any) : st.status,
            asrama: pk?.asramaNama && pk?.namaKamar ? `${pk.asramaNama} - ${pk.namaKamar}` : st.asrama,
            asramaId: pk?.asramaId || st.asramaId,
            kamarId: pk?.kamarId || st.kamarId,
            kamarLabel: pk?.namaKamar || st.kamarLabel,
          };
        })
      );
    }

    return c.json({
      data: finalRows,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
      currentUserScope: user ? {
        role: user.role,
        scopeAsrama: resolveUserScopeAsrama(user),
        assignedLembagaIds: user.assignedLembagaIds,
        assignedAsramaIds: user.assignedAsramaIds,
      } : null,
    });
  } catch (err: any) {
    console.error('Santri list error:', err);
    return c.json({ error: err.message }, 500);
  }
});

app.get('/api/santri/:id', async (c) => {
  try {
    const user = await getAuthUser(c);
    const id = c.req.param('id');
    const db = getDb(c);

    const data = await db.select().from(schema.santri).where(eq(schema.santri.id, id)).get();
    if (!data) {
      return c.json({ error: 'Data santri tidak ditemukan' }, 404);
    }

    // SERVER-SIDE SCOPE CHECK: Strict authority boundary enforcement (403)
    if (user && !isSantriInScope(user, data)) {
      return c.json({ error: 'Akses ditolak: Santri ini di luar cakupan wewenang Anda' }, 403);
    }

    const tahfidz = await db
      .select()
      .from(schema.tahfidzRecords)
      .where(eq(schema.tahfidzRecords.santriId, id))
      .orderBy(desc(schema.tahfidzRecords.tanggal))
      .limit(10)
      .all();

    const izin = await db
      .select()
      .from(schema.perizinan)
      .where(eq(schema.perizinan.santriId, id))
      .orderBy(desc(schema.perizinan.tanggalMulai))
      .limit(10)
      .all();

    const pelanggaranList = await db
      .select()
      .from(schema.pelanggaran)
      .where(eq(schema.pelanggaran.santriId, id))
      .orderBy(desc(schema.pelanggaran.tanggal))
      .limit(10)
      .all();

    const riwayat = await db
      .select({
        id: schema.riwayatAkademik.id,
        santriId: schema.riwayatAkademik.santriId,
        tahunAjaranId: schema.riwayatAkademik.tahunAjaranId,
        tahunAjaranNama: schema.tahunAjaran.nama,
        semester: schema.tahunAjaran.semester,
        lembagaId: schema.riwayatAkademik.lembagaId,
        lembagaNama: schema.lembaga.nama,
        jenjang: schema.riwayatAkademik.jenjang,
        tingkatKelas: schema.riwayatAkademik.tingkatKelas,
        kelas: schema.riwayatAkademik.kelas,
        status: schema.riwayatAkademik.status,
        catatan: schema.riwayatAkademik.catatan,
        createdAt: schema.riwayatAkademik.createdAt,
      })
      .from(schema.riwayatAkademik)
      .leftJoin(schema.tahunAjaran, eq(schema.riwayatAkademik.tahunAjaranId, schema.tahunAjaran.id))
      .leftJoin(schema.lembaga, eq(schema.riwayatAkademik.lembagaId, schema.lembaga.id))
      .where(eq(schema.riwayatAkademik.santriId, id))
      .orderBy(desc(schema.tahunAjaran.nama))
      .all();

    const penempatan = await db
      .select({
        id: schema.penempatanKamar.id,
        tahunAjaranId: schema.penempatanKamar.tahunAjaranId,
        tahunAjaranNama: schema.tahunAjaran.nama,
        semester: schema.tahunAjaran.semester,
        asramaNama: schema.asrama.nama,
        kamarNama: schema.kamar.namaKamar,
        tanggalMulai: schema.penempatanKamar.tanggalMulai,
        status: schema.penempatanKamar.status,
      })
      .from(schema.penempatanKamar)
      .leftJoin(schema.tahunAjaran, eq(schema.penempatanKamar.tahunAjaranId, schema.tahunAjaran.id))
      .leftJoin(schema.kamar, eq(schema.penempatanKamar.kamarId, schema.kamar.id))
      .leftJoin(schema.asrama, eq(schema.penempatanKamar.asramaId, schema.asrama.id))
      .where(eq(schema.penempatanKamar.santriId, id))
      .orderBy(desc(schema.tahunAjaran.nama))
      .all();

    return c.json({
      santri: data,
      tahfidz,
      perizinan: izin,
      pelanggaran: pelanggaranList,
      riwayatAkademik: riwayat,
      penempatanKamarList: penempatan,
    });
  } catch (err: any) {
    return c.json({ error: err.message }, 500);
  }
});

app.post('/api/santri', async (c) => {
  try {
    const user = await getAuthUser(c);
    if (!user) {
      return c.json({ error: 'Silakan login terlebih dahulu' }, 401);
    }
    if (user.role === 'viewer') {
      return c.json({ error: 'Akses ditolak: Akun Viewer hanya memiliki izin baca (read-only)' }, 403);
    }

    const payload = await c.req.json();
    const db = getDb(c);

    if (!payload.nis || !payload.namaLengkap) {
      return c.json({ error: 'NIS dan Nama Lengkap santri wajib diisi' }, 400);
    }

    // SERVER-SIDE SCOPE ENFORCEMENT:
    const scopeAsrama = resolveUserScopeAsrama(user);
    if (scopeAsrama === 'putra') {
      payload.jenisKelamin = 'L'; // Lock gender to Putra
    } else if (scopeAsrama === 'putri') {
      payload.jenisKelamin = 'P'; // Lock gender to Putri
    }

    if (payload.asramaId) {
      const asr = await db.select().from(schema.asrama).where(eq(schema.asrama.id, payload.asramaId)).get();
      if (asr) {
        if (scopeAsrama === 'putra' && asr.kelompokGender !== 'Putra') {
          return c.json({ error: 'Akses ditolak: Pengelola Asrama Putra hanya dapat mendaftarkan santri ke Asrama Putra' }, 403);
        }
        if (scopeAsrama === 'putri' && asr.kelompokGender !== 'Putri') {
          return c.json({ error: 'Akses ditolak: Pengelola Asrama Putri hanya dapat mendaftarkan santri ke Asrama Putri' }, 403);
        }
      }
    }

    if (user.role === 'admin_lembaga') {
      if (!payload.lembagaId || !user.assignedLembagaIds.includes(payload.lembagaId)) {
        return c.json({ error: 'Akses ditolak: Anda hanya dapat mendaftarkan santri pada lembaga wewenang Anda' }, 403);
      }
    } else if (user.role === 'pengurus_asrama') {
      if (user.assignedAsramaIds && user.assignedAsramaIds.length > 0 && (!payload.asramaId || !user.assignedAsramaIds.includes(payload.asramaId))) {
        return c.json({ error: 'Akses ditolak: Anda hanya dapat mendaftarkan santri pada asrama wewenang Anda' }, 403);
      }
    }

    const existing = await db.select().from(schema.santri).where(eq(schema.santri.nis, payload.nis)).get();
    if (existing) {
      return c.json({ error: `Santri dengan NIS ${payload.nis} sudah terdaftar` }, 409);
    }

    const id = 'santri-' + Date.now();
    const now = new Date().toISOString();

    const newSantri = {
      id,
      nis: payload.nis,
      nisn: payload.nisn || null,
      nik: payload.nik || null,
      namaLengkap: payload.namaLengkap,
      namaPanggilan: payload.namaPanggilan || null,
      jenisKelamin: payload.jenisKelamin || (scopeAsrama === 'putri' ? 'P' : 'L'),
      tempatLahir: payload.tempatLahir || null,
      tanggalLahir: payload.tanggalLahir || null,
      lembagaId: payload.lembagaId || null,
      asramaId: payload.asramaId || null,
      kamarId: payload.kamarId || null,
      tahunAjaranId: payload.tahunAjaranId || 'ta-2026',
      jenjang: payload.jenjang || 'SMP',
      kelas: payload.kelas || 'VII-A',
      asrama: payload.asrama || 'Gedung Al-Ghazali',
      kamarLabel: payload.kamarLabel || 'Kamar 101',
      status: payload.status || 'aktif',
      namaAyah: payload.namaAyah || null,
      namaIbu: payload.namaIbu || null,
      noHpWali: payload.noHpWali || null,
      alamatAsal: payload.alamatAsal || null,
      kotaAsal: payload.kotaAsal || null,
      provinsiAsal: payload.provinsiAsal || null,
      targetJuzHafalan: Number(payload.targetJuzHafalan) || 30,
      capaianJuzHafalan: Number(payload.capaianJuzHafalan) || 0,
      statusSpp: payload.statusSpp || 'lunas',
      poinPelanggaran: Number(payload.poinPelanggaran) || 0,
      tahunMasuk: payload.tahunMasuk || '2025',
      catatanKesehatan: payload.catatanKesehatan || null,
      fotoR2Key: payload.fotoR2Key || null,
      fotoUrl: payload.fotoUrl || null,
      createdAt: now,
      updatedAt: now,
    };

    // Cari tahun ajaran aktif jika tidak diberikan
    if (!newSantri.tahunAjaranId) {
      const activeTA = await db.select().from(schema.tahunAjaran).where(eq(schema.tahunAjaran.isActive, 1)).get();
      if (activeTA) newSantri.tahunAjaranId = activeTA.id;
    }

    await db.insert(schema.santri).values(newSantri);

    // Simpan riwayat akademik awal untuk tahun ajaran terkait
    if (newSantri.tahunAjaranId) {
      const rwId = `rw-${newSantri.tahunAjaranId}-${id}`;
      await db.insert(schema.riwayatAkademik).values({
        id: rwId,
        santriId: id,
        tahunAjaranId: newSantri.tahunAjaranId,
        lembagaId: newSantri.lembagaId || '',
        jenjang: newSantri.jenjang,
        tingkatKelas: newSantri.kelas ? newSantri.kelas.split(' ')[0] : newSantri.kelas,
        kelas: newSantri.kelas,
        status: newSantri.status === 'lulus' ? 'lulus' : (newSantri.status === 'mutasi' ? 'mutasi' : 'aktif'),
        catatan: 'Pendaftaran santri baru',
        createdAt: now,
      });

      // Simpan penempatan kamar jika dipilih
      if (newSantri.kamarId) {
        const pkId = `pk-${newSantri.tahunAjaranId}-${id}`;
        await db.insert(schema.penempatanKamar).values({
          id: pkId,
          santriId: id,
          asramaId: newSantri.asramaId,
          kamarId: newSantri.kamarId,
          tahunAjaranId: newSantri.tahunAjaranId,
          tanggalMulai: now.split('T')[0],
          status: 'aktif',
          createdAt: now,
        });
      }
    }

    return c.json({ success: true, santri: newSantri }, 201);
  } catch (err: any) {
    return c.json({ error: err.message }, 500);
  }
});

app.put('/api/santri/:id', async (c) => {
  try {
    const user = await getAuthUser(c);
    if (!user) return c.json({ error: 'Silakan login' }, 401);
    if (user.role === 'viewer') {
      return c.json({ error: 'Akses ditolak: Akun Viewer hanya memiliki izin baca' }, 403);
    }

    const id = c.req.param('id');
    const payload = await c.req.json();
    const db = getDb(c);

    // Retrieve existing santri to verify scope
    const existing = await db.select().from(schema.santri).where(eq(schema.santri.id, id)).get();
    if (!existing) return c.json({ error: 'Santri tidak ditemukan' }, 404);

    // SERVER-SIDE SCOPE ENFORCEMENT:
    if (!isSantriInScope(user, existing)) {
      return c.json({ error: 'Akses ditolak: Santri ini di luar cakupan wewenang Anda' }, 403);
    }

    const scopeAsrama = resolveUserScopeAsrama(user);
    if (scopeAsrama === 'putra' && payload.jenisKelamin && payload.jenisKelamin !== 'L') {
      return c.json({ error: 'Akses ditolak: Pengelola Asrama Putra tidak dapat mengubah santri menjadi Putri' }, 403);
    }
    if (scopeAsrama === 'putri' && payload.jenisKelamin && payload.jenisKelamin !== 'P') {
      return c.json({ error: 'Akses ditolak: Pengelola Asrama Putri tidak dapat mengubah santri menjadi Putra' }, 403);
    }

    if (payload.asramaId) {
      const asr = await db.select().from(schema.asrama).where(eq(schema.asrama.id, payload.asramaId)).get();
      if (asr) {
        if (scopeAsrama === 'putra' && asr.kelompokGender !== 'Putra') {
          return c.json({ error: 'Akses ditolak: Asrama ini di luar cakupan wewenang Pengelola Asrama Putra' }, 403);
        }
        if (scopeAsrama === 'putri' && asr.kelompokGender !== 'Putri') {
          return c.json({ error: 'Akses ditolak: Asrama ini di luar cakupan wewenang Pengelola Asrama Putri' }, 403);
        }
      }
    }

    const now = new Date().toISOString();
    await db
      .update(schema.santri)
      .set({
        ...payload,
        updatedAt: now,
      })
      .where(eq(schema.santri.id, id));

    // Sinkronkan ke riwayat akademik dan penempatan kamar tahun ajaran bersangkutan
    const currentTAId = payload.tahunAjaranId || existing.tahunAjaranId;
    if (currentTAId) {
      const existingRw = await db
        .select()
        .from(schema.riwayatAkademik)
        .where(and(eq(schema.riwayatAkademik.santriId, id), eq(schema.riwayatAkademik.tahunAjaranId, currentTAId)))
        .get();

      const newKelas = payload.kelas || existing.kelas;
      const newJenjang = payload.jenjang || existing.jenjang;
      const newLembagaId = payload.lembagaId !== undefined ? payload.lembagaId : existing.lembagaId;
      const newStatus = payload.status || existing.status;

      if (existingRw) {
        await db.update(schema.riwayatAkademik).set({
          kelas: newKelas,
          jenjang: newJenjang,
          tingkatKelas: newKelas ? newKelas.split(' ')[0] : newKelas,
          lembagaId: newLembagaId || existingRw.lembagaId,
          status: newStatus,
        }).where(eq(schema.riwayatAkademik.id, existingRw.id));
      } else {
        await db.insert(schema.riwayatAkademik).values({
          id: `rw-${currentTAId}-${id}`,
          santriId: id,
          tahunAjaranId: currentTAId,
          lembagaId: newLembagaId || '',
          jenjang: newJenjang,
          tingkatKelas: newKelas ? newKelas.split(' ')[0] : newKelas,
          kelas: newKelas,
          status: newStatus,
          catatan: 'Penyesuaian profil santri',
          createdAt: now,
        });
      }

      // Update / insert penempatan kamar
      const newKamarId = payload.kamarId !== undefined ? payload.kamarId : existing.kamarId;
      const newAsramaId = payload.asramaId !== undefined ? payload.asramaId : existing.asramaId;

      if (newKamarId) {
        const existingPk = await db
          .select()
          .from(schema.penempatanKamar)
          .where(and(eq(schema.penempatanKamar.santriId, id), eq(schema.penempatanKamar.tahunAjaranId, currentTAId)))
          .get();

        if (existingPk) {
          await db.update(schema.penempatanKamar).set({
            kamarId: newKamarId,
            asramaId: newAsramaId,
          }).where(eq(schema.penempatanKamar.id, existingPk.id));
        } else {
          await db.insert(schema.penempatanKamar).values({
            id: `pk-${currentTAId}-${id}`,
            santriId: id,
            asramaId: newAsramaId,
            kamarId: newKamarId,
            tahunAjaranId: currentTAId,
            tanggalMulai: now.split('T')[0],
            status: 'aktif',
            createdAt: now,
          });
        }
      }
    }

    const updated = await db.select().from(schema.santri).where(eq(schema.santri.id, id)).get();
    return c.json({ success: true, santri: updated });
  } catch (err: any) {
    return c.json({ error: err.message }, 500);
  }
});

app.delete('/api/santri/:id', async (c) => {
  try {
    const user = await getAuthUser(c);
    if (!user) return c.json({ error: 'Silakan login' }, 401);
    if (user.role === 'viewer') {
      return c.json({ error: 'Akses ditolak: Akun Viewer tidak dapat menghapus data' }, 403);
    }

    const id = c.req.param('id');
    const db = getDb(c);

    const existing = await db.select().from(schema.santri).where(eq(schema.santri.id, id)).get();
    if (!existing) return c.json({ error: 'Santri tidak ditemukan' }, 404);

    if (!isSantriInScope(user, existing)) {
      return c.json({ error: 'Akses ditolak: Santri ini di luar cakupan wewenang Anda' }, 403);
    }

    await db.delete(schema.santri).where(eq(schema.santri.id, id));
    return c.json({ success: true });
  } catch (err: any) {
    return c.json({ error: err.message }, 500);
  }
});

app.post('/api/santri/batch-status', async (c) => {
  try {
    const user = await getAuthUser(c);
    if (!user) return c.json({ error: 'Silakan login' }, 401);
    if (user.role === 'viewer') {
      return c.json({ error: 'Akses ditolak: Akun Viewer tidak dapat mengubah status' }, 403);
    }

    const { ids, status } = await c.req.json();
    if (!Array.isArray(ids) || ids.length === 0 || !status) {
      return c.json({ error: 'Daftar ID santri dan status tujuan wajib disertakan' }, 400);
    }

    const db = getDb(c);
    const now = new Date().toISOString();
    let updatedCount = 0;

    for (const id of ids) {
      const s = await db.select().from(schema.santri).where(eq(schema.santri.id, id)).get();
      if (!s || !isSantriInScope(user, s)) continue;

      await db.update(schema.santri).set({ status, updatedAt: now }).where(eq(schema.santri.id, id));
      updatedCount++;
    }

    return c.json({ success: true, count: updatedCount });
  } catch (err: any) {
    return c.json({ error: err.message }, 500);
  }
});

// -------------------------------------------------------------
// FITUR WAJIB: PROSES AKHIR TAHUN / NAIK KELAS MASSAL
// -------------------------------------------------------------

function calculatePromotionRecommendation(
  currentKelas: string,
  tingkatKelasList: string[],
  lembagaKode: string
): { targetAction: 'naik_kelas' | 'lulus' | 'tinggal_kelas'; targetKelas: string; isTingkatAkhir: boolean } {
  const cleanKelas = currentKelas.trim();

  // 1. Deteksi tingkat akhir / kelulusan:
  const isFinalGrade =
    cleanKelas.includes('Kelas 6') || cleanKelas.startsWith('VI-') || cleanKelas === 'VI' ||
    cleanKelas.includes('IX-') || cleanKelas.startsWith('IX') || cleanKelas.includes('Kelas 9') ||
    cleanKelas.includes('XII-') || cleanKelas.startsWith('XII') || cleanKelas.includes('Kelas 12') ||
    cleanKelas.toLowerCase().includes('30 juz') || cleanKelas.toLowerCase().includes('khatam') ||
    cleanKelas.toLowerCase().includes('ulya') || cleanKelas.toLowerCase().includes('tingkat 3');

  if (isFinalGrade) {
    return {
      targetAction: 'lulus',
      targetKelas: 'Lulus / Alumni',
      isTingkatAkhir: true,
    };
  }

  // 2. Kenaikan kelas berjenjang rombel
  if (cleanKelas.startsWith('VII-')) {
    const candidate = cleanKelas.replace('VII-', 'VIII-');
    return { targetAction: 'naik_kelas', targetKelas: candidate, isTingkatAkhir: false };
  }
  if (cleanKelas.startsWith('VIII-')) {
    const candidate = cleanKelas.replace('VIII-', 'IX-');
    return { targetAction: 'naik_kelas', targetKelas: candidate, isTingkatAkhir: false };
  }
  if (cleanKelas.startsWith('X-')) {
    const candidate = cleanKelas.replace('X-', 'XI-');
    return { targetAction: 'naik_kelas', targetKelas: candidate, isTingkatAkhir: false };
  }
  if (cleanKelas.startsWith('XI-')) {
    const candidate = cleanKelas.replace('XI-', 'XII-');
    return { targetAction: 'naik_kelas', targetKelas: candidate, isTingkatAkhir: false };
  }

  // Angka arab (SD Kelas 1-5):
  for (let num = 1; num <= 5; num++) {
    if (cleanKelas.includes(`Kelas ${num}`)) {
      const candidate = cleanKelas.replace(`Kelas ${num}`, `Kelas ${num + 1}`);
      return { targetAction: 'naik_kelas', targetKelas: candidate, isTingkatAkhir: false };
    }
  }

  // Ngaji / Tahfidz:
  if (cleanKelas.includes('Jilid 1')) return { targetAction: 'naik_kelas', targetKelas: 'Jilid 2-3', isTingkatAkhir: false };
  if (cleanKelas.includes('Jilid 2-3')) return { targetAction: 'naik_kelas', targetKelas: 'Jilid 4-5', isTingkatAkhir: false };
  if (cleanKelas.includes('Jilid 4-5')) return { targetAction: 'naik_kelas', targetKelas: 'Jilid 6 (Gharib & Tajwid)', isTingkatAkhir: false };
  if (cleanKelas.includes('Jilid 6')) return { targetAction: 'naik_kelas', targetKelas: 'Tahfidz Juz 1-5', isTingkatAkhir: false };
  if (cleanKelas.includes('Juz 1-5')) return { targetAction: 'naik_kelas', targetKelas: 'Tahfidz Juz 6-15', isTingkatAkhir: false };
  if (cleanKelas.includes('Juz 6-15')) return { targetAction: 'naik_kelas', targetKelas: 'Tahfidz 30 Juz', isTingkatAkhir: false };

  // Diniyah:
  if (cleanKelas.toLowerCase().includes('ula')) return { targetAction: 'naik_kelas', targetKelas: 'Tingkat 2 (Wustho)', isTingkatAkhir: false };
  if (cleanKelas.toLowerCase().includes('wustho')) return { targetAction: 'naik_kelas', targetKelas: 'Tingkat 3 (Ulya)', isTingkatAkhir: false };

  // Pencocokan indeks urutan master lembaga:
  const idx = tingkatKelasList.indexOf(cleanKelas);
  if (idx >= 0 && idx < tingkatKelasList.length - 1) {
    return { targetAction: 'naik_kelas', targetKelas: tingkatKelasList[idx + 1], isTingkatAkhir: false };
  }

  return { targetAction: 'naik_kelas', targetKelas: cleanKelas, isTingkatAkhir: false };
}

// 1. Preview Kenaikan Kelas Massal
app.get('/api/naik-kelas/preview', async (c) => {
  try {
    const user = await getAuthUser(c);
    if (!user) return c.json({ error: 'Silakan login terlebih dahulu' }, 401);
    if (user.role === 'viewer') return c.json({ error: 'Akses ditolak: Viewer hanya memiliki izin baca' }, 403);

    const fromTahunAjaranId = c.req.query('fromTahunAjaranId');
    const toTahunAjaranId = c.req.query('toTahunAjaranId');
    const lembagaId = c.req.query('lembagaId');

    if (!fromTahunAjaranId || !toTahunAjaranId) {
      return c.json({ error: 'Tahun ajaran asal dan tujuan wajib dipilih' }, 400);
    }
    if (fromTahunAjaranId === toTahunAjaranId) {
      return c.json({ error: 'Tahun ajaran tujuan tidak boleh sama dengan tahun ajaran asal' }, 400);
    }

    const db = getDb(c);

    // Ambil metadata tahun ajaran asal & tujuan
    const fromTA = await db.select().from(schema.tahunAjaran).where(eq(schema.tahunAjaran.id, fromTahunAjaranId)).get();
    const toTA = await db.select().from(schema.tahunAjaran).where(eq(schema.tahunAjaran.id, toTahunAjaranId)).get();

    if (!fromTA || !toTA) {
      return c.json({ error: 'Data tahun ajaran tidak valid' }, 404);
    }

    // Ambil master lembaga
    const lembagas = await db.select().from(schema.lembaga).all();
    const lembagaMap = new Map<string, { nama: string; kode: string; classes: string[] }>();
    for (const l of lembagas) {
      let cls: string[] = [];
      try { cls = JSON.parse(l.tingkatKelas); } catch (e) {}
      lembagaMap.set(l.id, { nama: l.nama, kode: l.kode, classes: cls });
    }

    // Ambil master kamar untuk pencocokan nama
    const kamars = await db
      .select({
        id: schema.kamar.id,
        namaKamar: schema.kamar.namaKamar,
        asramaId: schema.kamar.asramaId,
        asramaNama: schema.asrama.nama,
      })
      .from(schema.kamar)
      .leftJoin(schema.asrama, eq(schema.kamar.asramaId, schema.asrama.id))
      .all();
    const kamarMap = new Map<string, { nama: string; asramaId: string; asramaNama: string }>();
    for (const k of kamars) {
      kamarMap.set(k.id, { nama: k.namaKamar, asramaId: k.asramaId, asramaNama: k.asramaNama || '' });
    }

    // Query santri dalam tahun ajaran asal
    const conditions: any[] = [];
    const scopeConds = buildScopeEnforcementConditions(user);
    conditions.push(...scopeConds);

    if (lembagaId && lembagaId !== 'semua') {
      conditions.push(eq(schema.santri.lembagaId, lembagaId));
    }

    // Filter santri yang aktif di tahun ajaran asal
    conditions.push(
      or(
        eq(schema.santri.tahunAjaranId, fromTahunAjaranId),
        sql`EXISTS (SELECT 1 FROM riwayat_akademik ra WHERE ra.santri_id = ${schema.santri.id} AND ra.tahun_ajaran_id = ${fromTahunAjaranId})`
      )
    );

    // Ambil santri (kecuali yang sudah lulus/mutasi sebelumnya)
    conditions.push(sql`${schema.santri.status} NOT IN ('lulus', 'mutasi')`);

    const santriList = await db
      .select()
      .from(schema.santri)
      .where(and(...conditions))
      .orderBy(asc(schema.santri.jenjang), asc(schema.santri.kelas), asc(schema.santri.namaLengkap))
      .all();

    let totalNaik = 0;
    let totalTinggal = 0;
    let totalLulus = 0;

    const items = santriList.map((s) => {
      const lmbInfo = s.lembagaId ? lembagaMap.get(s.lembagaId) : null;
      const classes = lmbInfo?.classes || [];
      const kode = lmbInfo?.kode || s.jenjang;

      const rec = calculatePromotionRecommendation(s.kelas, classes, kode);

      if (rec.targetAction === 'naik_kelas') totalNaik++;
      else if (rec.targetAction === 'tinggal_kelas') totalTinggal++;
      else if (rec.targetAction === 'lulus') totalLulus++;

      const kmr = s.kamarId ? kamarMap.get(s.kamarId) : null;

      return {
        santriId: s.id,
        nis: s.nis,
        namaLengkap: s.namaLengkap,
        jenisKelamin: s.jenisKelamin,
        lembagaId: s.lembagaId || '',
        lembagaNama: lmbInfo?.nama || s.jenjang,
        jenjang: s.jenjang,
        currentKelas: s.kelas,
        currentAsramaId: s.asramaId || '',
        currentAsramaNama: kmr?.asramaNama || s.asrama.split(' - ')[0] || '',
        currentKamarId: s.kamarId || '',
        currentKamarNama: kmr?.nama || s.kamarLabel || '',
        targetAction: rec.targetAction,
        targetKelas: rec.targetKelas,
        targetKamarId: s.kamarId || '',
        targetKamarNama: kmr?.nama || s.kamarLabel || '',
        isTingkatAkhir: rec.isTingkatAkhir,
        availableClasses: classes,
      };
    });

    return c.json({
      fromTahunAjaran: fromTA,
      toTahunAjaran: toTA,
      totalSantri: items.length,
      totalNaik,
      totalTinggal,
      totalLulus,
      items,
    });
  } catch (err: any) {
    console.error('Preview error:', err);
    return c.json({ error: err.message }, 500);
  }
});

// 2. Eksekusi Kenaikan Kelas Massal
app.post('/api/naik-kelas/execute', async (c) => {
  try {
    const user = await getAuthUser(c);
    if (!user) return c.json({ error: 'Silakan login' }, 401);
    if (user.role === 'viewer') return c.json({ error: 'Akses ditolak: Viewer hanya memiliki izin baca' }, 403);

    const payload = await c.req.json();
    const { fromTahunAjaranId, toTahunAjaranId, lembagaId, salinKamar, items } = payload;

    if (!fromTahunAjaranId || !toTahunAjaranId || !Array.isArray(items) || items.length === 0) {
      return c.json({ error: 'Parameter proses kenaikan kelas tidak lengkap' }, 400);
    }
    if (fromTahunAjaranId === toTahunAjaranId) {
      return c.json({ error: 'Tahun ajaran tujuan tidak boleh sama dengan tahun ajaran asal' }, 400);
    }

    const db = getDb(c);
    const toTA = await db.select().from(schema.tahunAjaran).where(eq(schema.tahunAjaran.id, toTahunAjaranId)).get();
    if (!toTA) return c.json({ error: 'Tahun ajaran tujuan tidak ditemukan' }, 404);

    const now = new Date().toISOString();
    const processId = 'pkk-' + Date.now();

    // Ambil data snapshot sebelum perubahan untuk garansi 100% reversible rollback
    const studentIds = items.map((it: any) => it.santriId);
    const snapshotRows = await db
      .select({
        id: schema.santri.id,
        status: schema.santri.status,
        kelas: schema.santri.kelas,
        jenjang: schema.santri.jenjang,
        lembagaId: schema.santri.lembagaId,
        asramaId: schema.santri.asramaId,
        kamarId: schema.santri.kamarId,
        asrama: schema.santri.asrama,
        kamarLabel: schema.santri.kamarLabel,
        tahunAjaranId: schema.santri.tahunAjaranId,
      })
      .from(schema.santri)
      .where(inArray(schema.santri.id, studentIds))
      .all();

    let totalNaik = 0;
    let totalTinggal = 0;
    let totalLulus = 0;

    for (const it of items) {
      if (it.targetAction === 'naik_kelas') totalNaik++;
      else if (it.targetAction === 'tinggal_kelas') totalTinggal++;
      else if (it.targetAction === 'lulus') totalLulus++;
    }

    // Catat log proses kenaikan kelas
    await db.insert(schema.prosesKenaikanKelas).values({
      id: processId,
      fromTahunAjaranId,
      toTahunAjaranId,
      lembagaId: lembagaId === 'semua' ? null : (lembagaId || null),
      totalSantri: items.length,
      totalNaik,
      totalTinggal,
      totalLulus,
      salinKamar: salinKamar ? 1 : 0,
      status: 'selesai',
      snapshotData: JSON.stringify(snapshotRows),
      processedByUserId: user.id,
      createdAt: now,
    });

    // Ambil data kamar dan asrama untuk denormalisasi label
    const kamarRows = await db
      .select({
        id: schema.kamar.id,
        namaKamar: schema.kamar.namaKamar,
        asramaId: schema.asrama.id,
        asramaNama: schema.asrama.nama,
      })
      .from(schema.kamar)
      .leftJoin(schema.asrama, eq(schema.kamar.asramaId, schema.asrama.id))
      .all();
    const kamarMap = new Map<string, { namaKamar: string; asramaId: string; asramaNama: string }>();
    for (const k of kamarRows) {
      kamarMap.set(k.id, { namaKamar: k.namaKamar, asramaId: k.asramaId || '', asramaNama: k.asramaNama || '' });
    }

    // Eksekusi tiap santri: simpan ke riwayat_akademik dan penempatan_kamar baru
    for (const item of items) {
      const student = snapshotRows.find((s) => s.id === item.santriId);
      if (!student) continue;

      const rwId = `rw-${toTahunAjaranId}-${item.santriId}`;

      // Hapus jika ada entri riwayat lama untuk tahun tujuan agar bisa diulang
      await db.delete(schema.riwayatAkademik).where(and(eq(schema.riwayatAkademik.santriId, item.santriId), eq(schema.riwayatAkademik.tahunAjaranId, toTahunAjaranId)));

      await db.insert(schema.riwayatAkademik).values({
        id: rwId,
        santriId: item.santriId,
        tahunAjaranId: toTahunAjaranId,
        lembagaId: student.lembagaId || '',
        jenjang: student.jenjang,
        tingkatKelas: item.targetKelas ? item.targetKelas.split(' ')[0] : student.kelas,
        kelas: item.targetKelas || student.kelas,
        status: item.targetAction === 'lulus' ? 'lulus' : (item.targetAction === 'tinggal_kelas' ? 'tinggal_kelas' : 'naik_kelas'),
        catatan: item.targetAction === 'lulus' ? 'Lulus / Khatam di Tingkat Akhir' : `Kenaikan ke ${item.targetKelas}`,
        createdAt: now,
      });

      // Salin penempatan kamar ke tahun ajaran baru jika dipilih
      if (salinKamar && item.targetKamarId) {
        const pkId = `pk-${toTahunAjaranId}-${item.santriId}`;
        const kmr = kamarMap.get(item.targetKamarId);

        await db.delete(schema.penempatanKamar).where(and(eq(schema.penempatanKamar.santriId, item.santriId), eq(schema.penempatanKamar.tahunAjaranId, toTahunAjaranId)));

        await db.insert(schema.penempatanKamar).values({
          id: pkId,
          santriId: item.santriId,
          asramaId: kmr?.asramaId || student.asramaId,
          kamarId: item.targetKamarId,
          tahunAjaranId: toTahunAjaranId,
          tanggalMulai: toTA.tanggalMulai || now.split('T')[0],
          status: 'aktif',
          createdAt: now,
        });
      }

      // Jika santri lulus pada tingkat akhir, update status santri langsung menjadi lulus/alumni
      if (item.targetAction === 'lulus') {
        await db.update(schema.santri).set({
          status: 'lulus',
          updatedAt: now,
        }).where(eq(schema.santri.id, item.santriId));
      } else if (toTA.isActive === 1) {
        // Jika tahun ajaran tujuan adalah tahun yang sedang aktif, sinkronkan data santri utama
        const kmr = item.targetKamarId ? kamarMap.get(item.targetKamarId) : null;
        const updates: any = {
          kelas: item.targetKelas,
          tahunAjaranId: toTahunAjaranId,
          updatedAt: now,
        };
        if (kmr) {
          updates.kamarId = item.targetKamarId;
          updates.asramaId = kmr.asramaId;
          updates.asrama = `${kmr.asramaNama} - ${kmr.namaKamar}`;
          updates.kamarLabel = kmr.namaKamar;
        }
        await db.update(schema.santri).set(updates).where(eq(schema.santri.id, item.santriId));
      }
    }

    return c.json({
      success: true,
      processId,
      totalProcessed: items.length,
      totalNaik,
      totalTinggal,
      totalLulus,
      message: `Proses kenaikan kelas berhasil! ${totalNaik} santri naik kelas, ${totalTinggal} tinggal kelas, dan ${totalLulus} santri lulus/alumni.`,
    });
  } catch (err: any) {
    console.error('Execute naik kelas error:', err);
    return c.json({ error: err.message }, 500);
  }
});

// 3. Riwayat Batch Kenaikan Kelas & Cek Pembatalan
app.get('/api/naik-kelas/history', async (c) => {
  try {
    const user = await getAuthUser(c);
    if (!user) return c.json({ error: 'Silakan login' }, 401);

    const db = getDb(c);
    const rows = await db
      .select({
        id: schema.prosesKenaikanKelas.id,
        fromTahunAjaranId: schema.prosesKenaikanKelas.fromTahunAjaranId,
        toTahunAjaranId: schema.prosesKenaikanKelas.toTahunAjaranId,
        lembagaId: schema.prosesKenaikanKelas.lembagaId,
        totalSantri: schema.prosesKenaikanKelas.totalSantri,
        totalNaik: schema.prosesKenaikanKelas.totalNaik,
        totalTinggal: schema.prosesKenaikanKelas.totalTinggal,
        totalLulus: schema.prosesKenaikanKelas.totalLulus,
        salinKamar: schema.prosesKenaikanKelas.salinKamar,
        status: schema.prosesKenaikanKelas.status,
        createdAt: schema.prosesKenaikanKelas.createdAt,
      })
      .from(schema.prosesKenaikanKelas)
      .orderBy(desc(schema.prosesKenaikanKelas.createdAt))
      .all();

    const allTA = await db.select().from(schema.tahunAjaran).all();
    const allLembaga = await db.select().from(schema.lembaga).all();

    const taMap = new Map(allTA.map((t) => [t.id, t]));
    const lmbMap = new Map(allLembaga.map((l) => [l.id, l.nama]));

    const formatted = rows.map((r) => {
      const fromTA = taMap.get(r.fromTahunAjaranId);
      const toTA = taMap.get(r.toTahunAjaranId);

      // Kriteria Pembatalan Sesuai User Prompt:
      // "Bisa dibatalkan atau diulang selama tahun ajaran tujuan belum aktif"
      const canRollback = r.status === 'selesai' && toTA?.isActive === 0;

      return {
        ...r,
        fromTahunAjaranNama: fromTA ? `${fromTA.nama} (${fromTA.semester})` : r.fromTahunAjaranId,
        toTahunAjaranNama: toTA ? `${toTA.nama} (${toTA.semester})` : r.toTahunAjaranId,
        toIsActive: toTA?.isActive === 1,
        lembagaNama: r.lembagaId ? (lmbMap.get(r.lembagaId) || r.lembagaId) : 'Semua Lembaga',
        canRollback,
      };
    });

    return c.json({ data: formatted });
  } catch (err: any) {
    return c.json({ error: err.message }, 500);
  }
});

// 4. Batalkan / Rollback Kenaikan Kelas
app.post('/api/naik-kelas/rollback/:id', async (c) => {
  try {
    const user = await getAuthUser(c);
    if (!user || (user.role !== 'superadmin' && user.role !== 'admin_lembaga')) {
      return c.json({ error: 'Akses ditolak: Hanya Super Admin / Admin Lembaga yang berwenang membatalkan proses' }, 403);
    }

    const id = c.req.param('id');
    const db = getDb(c);

    const log = await db.select().from(schema.prosesKenaikanKelas).where(eq(schema.prosesKenaikanKelas.id, id)).get();
    if (!log) return c.json({ error: 'Data proses kenaikan kelas tidak ditemukan' }, 404);
    if (log.status === 'dibatalkan') {
      return c.json({ error: 'Proses ini sudah pernah dibatalkan sebelumnya' }, 400);
    }

    // Cek apakah tahun ajaran tujuan aktif
    const toTA = await db.select().from(schema.tahunAjaran).where(eq(schema.tahunAjaran.id, log.toTahunAjaranId)).get();
    if (toTA && toTA.isActive === 1) {
      return c.json({
        error: `Tidak dapat membatalkan: Tahun ajaran tujuan (${toTA.nama}) saat ini sedang AKTIF. Nonaktifkan tahun ajaran terlebih dahulu sebelum membatalkan.`,
      }, 400);
    }

    // 1. Hapus riwayat akademik yang dibuat untuk tahun ajaran tujuan
    await db.delete(schema.riwayatAkademik).where(eq(schema.riwayatAkademik.tahunAjaranId, log.toTahunAjaranId));

    // 2. Hapus penempatan kamar yang dibuat untuk tahun ajaran tujuan
    await db.delete(schema.penempatanKamar).where(eq(schema.penempatanKamar.tahunAjaranId, log.toTahunAjaranId));

    // 3. Kembalikan data santri dari snapshot jika tersimpan (mengembalikan status santri yang lulus kembali aktif)
    if (log.snapshotData) {
      try {
        const snapshots = JSON.parse(log.snapshotData);
        for (const snap of snapshots) {
          await db.update(schema.santri).set({
            status: snap.status,
            kelas: snap.kelas,
            jenjang: snap.jenjang,
            asramaId: snap.asramaId,
            kamarId: snap.kamarId,
            asrama: snap.asrama,
            kamarLabel: snap.kamarLabel,
            tahunAjaranId: snap.tahunAjaranId,
            updatedAt: new Date().toISOString(),
          }).where(eq(schema.santri.id, snap.id));
        }
      } catch (e) {
        console.error('Error parsing snapshot:', e);
      }
    }

    // 4. Update status log menjadi 'dibatalkan'
    await db.update(schema.prosesKenaikanKelas).set({ status: 'dibatalkan' }).where(eq(schema.prosesKenaikanKelas.id, id));

    return c.json({
      success: true,
      message: 'Proses kenaikan kelas berhasil dibatalkan dan seluruh data santri dikembalikan ke kondisi semula.',
    });
  } catch (err: any) {
    return c.json({ error: err.message }, 500);
  }
});

// -------------------------------------------------------------
// DASHBOARD STATS (SERVER-SIDE SCOPE FORCED)
// -------------------------------------------------------------

app.get('/api/stats', async (c) => {
  try {
    const user = await getAuthUser(c);
    const db = getDb(c);
    const tahunAjaranId = c.req.query('tahunAjaranId');

    const conditions = buildScopeEnforcementConditions(user);
    if (tahunAjaranId && tahunAjaranId !== 'semua') {
      conditions.push(
        or(
          eq(schema.santri.tahunAjaranId, tahunAjaranId),
          sql`EXISTS (SELECT 1 FROM riwayat_akademik ra WHERE ra.santri_id = ${schema.santri.id} AND ra.tahun_ajaran_id = ${tahunAjaranId})`
        )
      );
    }
    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const countQuery = (additionalWhere?: any) => {
      const q = db.select({ count: sql<number>`count(*)` }).from(schema.santri);
      const allConds = [...conditions];
      if (additionalWhere) allConds.push(additionalWhere);
      if (allConds.length > 0) q.where(and(...allConds));
      return q.get();
    };

    const totalSantriResult = await countQuery();
    const aktifResult = await countQuery(eq(schema.santri.status, 'aktif'));
    const izinResult = await countQuery(eq(schema.santri.status, 'izin_pulang'));
    const alpaSkorsingResult = await countQuery(or(eq(schema.santri.status, 'alpa'), eq(schema.santri.status, 'skorsing')));
    const hafidzResult = await countQuery(gte(schema.santri.capaianJuzHafalan, 30));
    const sppTunggakResult = await countQuery(sql`status_spp != 'lunas'`);
    const santriLResult = await countQuery(eq(schema.santri.jenisKelamin, 'L'));
    const santriPResult = await countQuery(eq(schema.santri.jenisKelamin, 'P'));

    const scopeAsrama = resolveUserScopeAsrama(user);
    let totalStafCount = 0;
    if (scopeAsrama === 'putra') {
      const stafRes = await db.select({ count: sql<number>`count(*)` }).from(schema.staf).where(eq(schema.staf.jenisKelamin, 'L')).get();
      totalStafCount = stafRes?.count || 0;
    } else if (scopeAsrama === 'putri') {
      const stafRes = await db.select({ count: sql<number>`count(*)` }).from(schema.staf).where(eq(schema.staf.jenisKelamin, 'P')).get();
      totalStafCount = stafRes?.count || 0;
    } else {
      const totalStafResult = await db.select({ count: sql<number>`count(*)` }).from(schema.staf).get();
      totalStafCount = totalStafResult?.count || 0;
    }

    // Jenjang group
    const jenjangQ = db
      .select({ jenjang: schema.santri.jenjang, count: sql<number>`count(*)` })
      .from(schema.santri);
    if (whereClause) jenjangQ.where(whereClause);
    const jenjangGroup = await jenjangQ.groupBy(schema.santri.jenjang).all();

    const jenjangCounts: Record<string, number> = {};
    for (const item of jenjangGroup) {
      if (item.jenjang) jenjangCounts[item.jenjang] = item.count;
    }

    // SPP group
    const sppQ = db
      .select({ statusSpp: schema.santri.statusSpp, count: sql<number>`count(*)` })
      .from(schema.santri);
    if (whereClause) sppQ.where(whereClause);
    const sppGroup = await sppQ.groupBy(schema.santri.statusSpp).all();

    const sppCounts: Record<string, number> = {};
    for (const item of sppGroup) {
      if (item.statusSpp) sppCounts[item.statusSpp] = item.count;
    }

    // Asrama group
    const asrQ = db
      .select({ asrama: schema.santri.asrama, count: sql<number>`count(*)` })
      .from(schema.santri);
    if (whereClause) asrQ.where(whereClause);
    const asrGroup = await asrQ.groupBy(schema.santri.asrama).all();

    const asramaCounts: Record<string, number> = {};
    for (const item of asrGroup) {
      if (item.asrama) asramaCounts[item.asrama] = item.count;
    }

    let scopeLabel = 'Semua Lembaga & Asrama (Akses Penuh)';
    if (scopeAsrama === 'putra') scopeLabel = 'Pengelola Asrama Putra';
    else if (scopeAsrama === 'putri') scopeLabel = 'Pengelola Asrama Putri';
    else if (user?.role === 'admin_lembaga') scopeLabel = `Cakupan Lembaga (${user.assignedLembagaIds.length} lembaga ditugaskan)`;
    else if (user?.role === 'pengurus_asrama') scopeLabel = `Cakupan Asrama (${user.assignedAsramaIds.length} asrama ditugaskan)`;
    else if (user?.role === 'viewer') scopeLabel = 'Viewer (Read-Only Terbatas)';

    return c.json({
      totalSantri: totalSantriResult?.count ?? 0,
      santriAktif: aktifResult?.count ?? 0,
      santriIzinPulang: izinResult?.count ?? 0,
      santriAlpaAtauSkorsing: alpaSkorsingResult?.count ?? 0,
      totalStaf: totalStafCount,
      totalHafidz30Juz: hafidzResult?.count ?? 0,
      tunggakanSppCount: sppTunggakResult?.count ?? 0,
      santriPutra: santriLResult?.count ?? 0,
      santriPutri: santriPResult?.count ?? 0,
      jenjangCounts,
      sppCounts,
      asramaCounts,
      scopeAsrama,
      scopedRole: user?.role || 'superadmin',
      scopeLabel,
    });
  } catch (err: any) {
    return c.json({ error: err.message }, 500);
  }
});

// -------------------------------------------------------------
// EXCEL EXPORT (FORCED SERVER-SIDE SCOPE)
// -------------------------------------------------------------

app.get('/api/export/santri', async (c) => {
  try {
    const user = await getAuthUser(c);
    const db = getDb(c);

    const conditions = buildScopeEnforcementConditions(user);

    const q = c.req.query('search')?.trim() || '';
    const lembagaId = c.req.query('lembagaId');
    const asramaId = c.req.query('asramaId');
    const status = c.req.query('status');
    const tahunAjaranId = c.req.query('tahunAjaranId');

    if (q) conditions.push(or(like(schema.santri.nis, `%${q}%`), like(schema.santri.namaLengkap, `%${q}%`)));
    if (tahunAjaranId && tahunAjaranId !== 'semua') {
      conditions.push(
        or(
          eq(schema.santri.tahunAjaranId, tahunAjaranId),
          sql`EXISTS (SELECT 1 FROM riwayat_akademik ra WHERE ra.santri_id = ${schema.santri.id} AND ra.tahun_ajaran_id = ${tahunAjaranId})`
        )
      );
    }
    if (lembagaId && lembagaId !== 'semua') conditions.push(eq(schema.santri.lembagaId, lembagaId));
    if (asramaId && asramaId !== 'semua') conditions.push(eq(schema.santri.asramaId, asramaId));
    if (status && status !== 'semua') conditions.push(eq(schema.santri.status, status as any));

    const query = db.select().from(schema.santri);
    if (conditions.length > 0) query.where(and(...conditions));
    const list = await query.orderBy(asc(schema.santri.nis)).all();

    const rows = list.map((s, idx) => ({
      'No': idx + 1,
      'NIS': s.nis,
      'NISN': s.nisn || '-',
      'Nama Santri': s.namaLengkap,
      'L/P': s.jenisKelamin,
      'Lembaga / Jenjang': s.jenjang,
      'Kelas / Rombel': s.kelas,
      'Asrama & Kamar': s.asrama,
      'Kamar': s.kamarLabel || '-',
      'Status': s.status.toUpperCase(),
      'Capaian Juz': s.capaianJuzHafalan,
      'Target Juz': s.targetJuzHafalan,
      'SPP': s.statusSpp,
      'Wali Santri': s.namaAyah || s.namaIbu || '-',
      'HP Wali': s.noHpWali || '-',
      'Asal': s.kotaAsal || '-',
    }));

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Data Santri');
    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    return new Response(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="Rekap_Santri_SIAKAD_${new Date().toISOString().split('T')[0]}.xlsx"`,
      },
    });
  } catch (err: any) {
    return c.json({ error: err.message }, 500);
  }
});

// Custom Export Multi-Dataset dengan Pemilihan Kolom Bebas
app.post('/api/export/custom', async (c) => {
  try {
    const user = await getAuthUser(c);
    const db = getDb(c);
    const body = await c.req.json();
    const { type, selectedColumns, filters = {} } = body;

    const workbook = XLSX.utils.book_new();
    let filename = `Export_${new Date().toISOString().split('T')[0]}.xlsx`;

    if (type === 'santri') {
      filename = `Export_Santri_Custom_${new Date().toISOString().split('T')[0]}.xlsx`;
      const conditions = buildScopeEnforcementConditions(user);

      if (filters.search) conditions.push(or(like(schema.santri.nis, `%${filters.search}%`), like(schema.santri.namaLengkap, `%${filters.search}%`)));
      if (filters.tahunAjaranId && filters.tahunAjaranId !== 'semua') {
        conditions.push(
          or(
            eq(schema.santri.tahunAjaranId, filters.tahunAjaranId),
            sql`EXISTS (SELECT 1 FROM riwayat_akademik ra WHERE ra.santri_id = ${schema.santri.id} AND ra.tahun_ajaran_id = ${filters.tahunAjaranId})`
          )
        );
      }
      if (filters.lembagaId && filters.lembagaId !== 'semua') conditions.push(eq(schema.santri.lembagaId, filters.lembagaId));
      if (filters.asramaId && filters.asramaId !== 'semua') conditions.push(eq(schema.santri.asramaId, filters.asramaId));
      if (filters.status && filters.status !== 'semua') conditions.push(eq(schema.santri.status, filters.status));

      const query = db.select().from(schema.santri);
      if (conditions.length > 0) query.where(and(...conditions));
      const list = await query.orderBy(asc(schema.santri.nis)).all();

      const colDefs: Record<string, (s: any) => any> = {
        nis: (s) => s.nis,
        nisn: (s) => s.nisn || '-',
        nik: (s) => s.nik || '-',
        namaLengkap: (s) => s.namaLengkap,
        jenisKelamin: (s) => (s.jenisKelamin === 'L' ? 'Putra' : 'Putri'),
        jenjang: (s) => s.jenjang,
        kelas: (s) => s.kelas,
        asrama: (s) => s.asrama,
        kamarLabel: (s) => s.kamarLabel || '-',
        status: (s) => s.status.toUpperCase(),
        capaianJuzHafalan: (s) => s.capaianJuzHafalan,
        statusSpp: (s) => s.statusSpp,
        namaAyah: (s) => s.namaAyah || '-',
        namaIbu: (s) => s.namaIbu || '-',
        noHpWali: (s) => s.noHpWali || '-',
        alamatAsal: (s) => s.alamatAsal || '-',
        kotaAsal: (s) => s.kotaAsal || '-',
        tahunMasuk: (s) => s.tahunMasuk,
      };

      const labelMap: Record<string, string> = {
        nis: 'NIS',
        nisn: 'NISN',
        nik: 'NIK',
        namaLengkap: 'Nama Lengkap',
        jenisKelamin: 'L/P',
        jenjang: 'Lembaga / Jenjang',
        kelas: 'Kelas / Rombel',
        asrama: 'Asrama',
        kamarLabel: 'Kamar',
        status: 'Status Santri',
        capaianJuzHafalan: 'Capaian Juz',
        statusSpp: 'Status SPP',
        namaAyah: 'Nama Ayah',
        namaIbu: 'Nama Ibu',
        noHpWali: 'No HP Wali',
        alamatAsal: 'Alamat Asal',
        kotaAsal: 'Kota / Kab Asal',
        tahunMasuk: 'Tahun Masuk',
      };

      const cols = Array.isArray(selectedColumns) && selectedColumns.length > 0
        ? selectedColumns
        : Object.keys(colDefs);

      const rows = list.map((s, idx) => {
        const rowObj: Record<string, any> = { No: idx + 1 };
        for (const col of cols) {
          if (colDefs[col]) {
            rowObj[labelMap[col] || col] = colDefs[col](s);
          }
        }
        return rowObj;
      });

      const worksheet = XLSX.utils.json_to_sheet(rows);
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Data Santri');
    } else if (type === 'staf') {
      filename = `Export_Staf_Pengajar_${new Date().toISOString().split('T')[0]}.xlsx`;
      const scopeAsrama = resolveUserScopeAsrama(user);
      const stafConds: any[] = [isNull(schema.staf.deletedAt)];
      if (scopeAsrama === 'putra') stafConds.push(eq(schema.staf.jenisKelamin, 'L'));
      else if (scopeAsrama === 'putri') stafConds.push(eq(schema.staf.jenisKelamin, 'P'));

      const stafList = await db.select().from(schema.staf).where(and(...stafConds)).orderBy(asc(schema.staf.namaLengkap)).all();
      const rows = stafList.map((st, idx) => ({
        'No': idx + 1,
        'NIP': st.nip,
        'Nama Lengkap': st.namaLengkap,
        'L/P': st.jenisKelamin === 'L' ? 'Laki-laki' : 'Perempuan',
        'Bagian': st.bagian,
        'Jabatan': st.jabatan,
        'Mapel / Kitab': st.mataPelajaranKitab || '-',
        'Jenjang Ajar': st.jenjangAjar || '-',
        'No HP': st.noHp || '-',
        'Status Kepegawaian': st.statusKepegawaian,
        'Pendidikan Terakhir': st.pendidikanTerakhir || '-',
        'Tanggal Bergabung': st.tanggalBergabung,
      }));
      const worksheet = XLSX.utils.json_to_sheet(rows);
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Data Staf');
    } else if (type === 'kamar') {
      filename = `Rekap_Penghuni_Kamar_${new Date().toISOString().split('T')[0]}.xlsx`;
      const scopeAsrama = resolveUserScopeAsrama(user);
      const kamarConds: any[] = [];
      if (scopeAsrama === 'putra') kamarConds.push(eq(schema.asrama.kelompokGender, 'Putra'));
      else if (scopeAsrama === 'putri') kamarConds.push(eq(schema.asrama.kelompokGender, 'Putri'));

      const queryKamars = db
        .select({
          kamarId: schema.kamar.id,
          namaKamar: schema.kamar.namaKamar,
          kapasitas: schema.kamar.kapasitas,
          isFull: schema.kamar.isFull,
          asramaNama: schema.asrama.nama,
          asramaGender: schema.asrama.kelompokGender,
          musyrifNama: schema.staf.namaLengkap,
        })
        .from(schema.kamar)
        .innerJoin(schema.asrama, eq(schema.kamar.asramaId, schema.asrama.id))
        .leftJoin(schema.staf, eq(schema.asrama.musyrifStafId, schema.staf.id));

      if (kamarConds.length > 0) queryKamars.where(and(...kamarConds));
      const kamars = await queryKamars.orderBy(asc(schema.asrama.nama), asc(schema.kamar.namaKamar)).all();

      const santriScopeConds = buildScopeEnforcementConditions(user);
      const santriAll = await db
        .select({
          kamarId: schema.santri.kamarId,
          namaLengkap: schema.santri.namaLengkap,
          nis: schema.santri.nis,
          kelas: schema.santri.kelas,
          noHpWali: schema.santri.noHpWali,
        })
        .from(schema.santri)
        .where(and(...santriScopeConds))
        .all();

      const occupantsMap = new Map<string, string[]>();
      for (const s of santriAll) {
        if (!s.kamarId) continue;
        const list = occupantsMap.get(s.kamarId) || [];
        list.push(`${s.namaLengkap} (${s.nis} - ${s.kelas})`);
        occupantsMap.set(s.kamarId, list);
      }

      const rows = kamars.map((k, idx) => {
        const occ = occupantsMap.get(k.kamarId) || [];
        return {
          'No': idx + 1,
          'Asrama': k.asramaNama,
          'Gender': k.asramaGender,
          'Kamar': k.namaKamar,
          'Kapasitas': k.kapasitas,
          'Terisi': occ.length,
          'Sisa Kapasitas': Math.max(0, k.kapasitas - occ.length),
          'Status': (k.isFull === 1 || occ.length >= k.kapasitas) ? 'PENUH' : 'TERSEDIA',
          'Musyrif / Pembina': k.musyrifNama || '-',
          'Daftar Penghuni': occ.join(', ') || '(Kosong)',
        };
      });

      const worksheet = XLSX.utils.json_to_sheet(rows);
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Rekap Kamar');
    } else if (type === 'rekap_lembaga') {
      filename = `Rekap_Lembaga_Kelas_${new Date().toISOString().split('T')[0]}.xlsx`;
      const lembagas = await db.select().from(schema.lembaga).all();
      const santriScopeConds = buildScopeEnforcementConditions(user);
      const allSantri = await db.select().from(schema.santri).where(and(...santriScopeConds)).all();

      const rows: any[] = [];
      let no = 1;

      for (const lmb of lembagas) {
        let classes: string[] = [];
        try { classes = JSON.parse(lmb.tingkatKelas); } catch (e) {}

        const lmbSantri = allSantri.filter((s) => s.lembagaId === lmb.id || s.jenjang === lmb.nama || s.jenjang === lmb.kode);

        for (const cls of classes) {
          const clsSantri = lmbSantri.filter((s) => s.kelas === cls);
          const putra = clsSantri.filter((s) => s.jenisKelamin === 'L').length;
          const putri = clsSantri.filter((s) => s.jenisKelamin === 'P').length;
          const aktif = clsSantri.filter((s) => s.status === 'aktif').length;

          rows.push({
            'No': no++,
            'Lembaga': lmb.nama,
            'Kode': lmb.kode,
            'Kelas / Rombel': cls,
            'Santri Putra': putra,
            'Santri Putri': putri,
            'Total Santri': clsSantri.length,
            'Status Aktif': aktif,
            'Status Non-Aktif/Izin': clsSantri.length - aktif,
          });
        }
      }

      const worksheet = XLSX.utils.json_to_sheet(rows);
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Rekap Lembaga');
    }

    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
    return new Response(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (err: any) {
    return c.json({ error: err.message }, 500);
  }
});

// Template Excel Download Endpoint
app.get('/api/export/template', async (c) => {
  const user = await getAuthUser(c);
  const scopeAsrama = resolveUserScopeAsrama(user);

  const sampleRows = [
    {
      'NIS': '26001',
      'NISN': '0098765432',
      'NIK': '3515082109010001',
      'Nama Lengkap': 'Muhammad Farhan',
      'L/P': 'L',
      'Lembaga': 'SMP Unggulan',
      'Kelas': 'VII-A',
      'Asrama': 'Gedung Al-Ghazali',
      'Kamar': 'Kamar 101',
      'Status': 'aktif',
      'SPP': 'lunas',
      'Target Juz': 30,
      'Capaian Juz': 12,
      'Nama Ayah': 'H. Rahmat',
      'Nama Ibu': 'Siti Maryam',
      'No HP Wali': '081234567890',
      'Kota Asal': 'Surabaya',
    },
    {
      'NIS': '26002',
      'NISN': '0098765433',
      'NIK': '3515082109010002',
      'Nama Lengkap': 'Aisyah Humaira',
      'L/P': 'P',
      'Lembaga': 'SMP Unggulan',
      'Kelas': 'VII-B',
      'Asrama': 'Gedung Khadijah',
      'Kamar': 'Kamar 201',
      'Status': 'aktif',
      'SPP': 'lunas',
      'Target Juz': 30,
      'Capaian Juz': 15,
      'Nama Ayah': 'Ahmad Fauzan',
      'Nama Ibu': 'Nurul Hidayah',
      'No HP Wali': '081234567891',
      'Kota Asal': 'Malang',
    },
  ];

  const filteredSamples = scopeAsrama === 'putra'
    ? sampleRows.filter((r) => r['L/P'] === 'L')
    : scopeAsrama === 'putri'
    ? sampleRows.filter((r) => r['L/P'] === 'P')
    : sampleRows;

  const worksheet = XLSX.utils.json_to_sheet(filteredSamples);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Template Santri');
  const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

  return new Response(buffer, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': 'attachment; filename="Template_Import_Santri_SIAKAD.xlsx"',
    },
  });
});

// Import Excel Santri Endpoint with Strict Scope Enforcement
app.post('/api/import/santri', async (c) => {
  try {
    const user = await getAuthUser(c);
    if (!user) return c.json({ error: 'Silakan login terlebih dahulu' }, 401);
    if (user.role === 'viewer') {
      return c.json({ error: 'Akses ditolak: Akun Viewer tidak memiliki izin import data' }, 403);
    }

    const formData = await c.req.formData();
    const file = formData.get('file') as File;
    if (!file) return c.json({ error: 'File Excel (.xlsx) tidak ditemukan' }, 400);

    const arrayBuffer = await file.arrayBuffer();
    const workbook = XLSX.read(new Uint8Array(arrayBuffer), { type: 'array' });
    const sheetName = workbook.SheetNames[0];
    if (!sheetName) return c.json({ error: 'Lembar kerja (sheet) tidak ditemukan di file Excel' }, 400);

    const sheet = workbook.Sheets[sheetName];
    const rawRows = XLSX.utils.sheet_to_json<any>(sheet);

    if (!rawRows || rawRows.length === 0) {
      return c.json({ error: 'File Excel kosong atau tidak memiliki baris data' }, 400);
    }

    const db = getDb(c);
    const scopeAsrama = resolveUserScopeAsrama(user);
    const scopeLabel = scopeAsrama === 'putra' ? 'Pengelola Asrama Putra' : (scopeAsrama === 'putri' ? 'Pengelola Asrama Putri' : 'Super Admin');

    const activeTA = await db.select().from(schema.tahunAjaran).where(eq(schema.tahunAjaran.isActive, 1)).get();
    const defaultTAId = activeTA ? activeTA.id : 'ta-2026';

    const allAsramas = await db.select().from(schema.asrama).all();
    const asramaMap = new Map(allAsramas.map((a) => [a.nama.toLowerCase().trim(), a]));

    let importedCount = 0;
    let updatedCount = 0;
    let skippedCount = 0;
    const errors: string[] = [];
    const now = new Date().toISOString();

    for (let i = 0; i < rawRows.length; i++) {
      const row = rawRows[i];
      const rowNum = i + 2; // Row 1 is header

      const nis = String(row['NIS'] || row['nis'] || row['No Induk'] || '').trim();
      const nama = String(row['Nama Lengkap'] || row['Nama Santri'] || row['namaLengkap'] || row['Nama'] || '').trim();

      if (!nis || !nama) {
        skippedCount++;
        errors.push(`Baris ${rowNum}: Dilewati karena NIS atau Nama Lengkap kosong`);
        continue;
      }

      // Normalisasi Jenis Kelamin
      const rawJk = String(row['L/P'] || row['Jenis Kelamin'] || row['jenisKelamin'] || row['Gender'] || '').toUpperCase().trim();
      let jk: 'L' | 'P' = 'L';
      if (rawJk.startsWith('P') || rawJk.includes('PUTRI') || rawJk.includes('PEREMPUAN') || rawJk.includes('WANITA')) {
        jk = 'P';
      } else if (rawJk.startsWith('L') || rawJk.includes('PUTRA') || rawJk.includes('LAKI')) {
        jk = 'L';
      } else {
        // Default to scope if available
        jk = scopeAsrama === 'putri' ? 'P' : 'L';
      }

      // ENFORCE SERVER-SIDE SCOPE ON GENDER:
      if (scopeAsrama === 'putra' && jk !== 'L') {
        skippedCount++;
        errors.push(`Baris ${rowNum}: Santri "${nama}" (NIS: ${nis}) berjenis kelamin Perempuan (Putri) ditolak karena di luar wewenang ${scopeLabel}.`);
        continue;
      }
      if (scopeAsrama === 'putri' && jk !== 'P') {
        skippedCount++;
        errors.push(`Baris ${rowNum}: Santri "${nama}" (NIS: ${nis}) berjenis kelamin Laki-laki (Putra) ditolak karena di luar wewenang ${scopeLabel}.`);
        continue;
      }

      // Matching Asrama
      const rawAsramaName = String(row['Asrama'] || row['asrama'] || row['Asrama & Kamar'] || '').trim();
      let asramaId: string | null = null;
      let asramaNama = rawAsramaName || (jk === 'L' ? 'Gedung Al-Ghazali' : 'Gedung Khadijah');
      for (const [key, val] of asramaMap.entries()) {
        if (key.includes(rawAsramaName.toLowerCase()) || rawAsramaName.toLowerCase().includes(key)) {
          asramaId = val.id;
          asramaNama = val.nama;
          break;
        }
      }

      // Check if Asrama matches account scope
      if (asramaId) {
        const asrObj = asramaMap.get(asramaNama.toLowerCase().trim());
        if (asrObj) {
          if (scopeAsrama === 'putra' && asrObj.kelompokGender !== 'Putra') {
            skippedCount++;
            errors.push(`Baris ${rowNum}: Santri "${nama}" dialokasikan ke asrama putri (${asrObj.nama}) yang melanggar wewenang ${scopeLabel}.`);
            continue;
          }
          if (scopeAsrama === 'putri' && asrObj.kelompokGender !== 'Putri') {
            skippedCount++;
            errors.push(`Baris ${rowNum}: Santri "${nama}" dialokasikan ke asrama putra (${asrObj.nama}) yang melanggar wewenang ${scopeLabel}.`);
            continue;
          }
        }
      }

      const existing = await db.select().from(schema.santri).where(eq(schema.santri.nis, nis)).get();

      if (existing) {
        if (!isSantriInScope(user, existing)) {
          skippedCount++;
          errors.push(`Baris ${rowNum}: Santri "${existing.namaLengkap}" (NIS: ${nis}) sudah ada di sistem tetapi berada di luar wewenang Anda.`);
          continue;
        }

        // Update existing santri
        await db.update(schema.santri).set({
          namaLengkap: nama,
          jenisKelamin: jk,
          jenjang: String(row['Lembaga'] || row['Jenjang'] || existing.jenjang).trim(),
          kelas: String(row['Kelas'] || row['Kelas / Rombel'] || existing.kelas).trim(),
          asrama: asramaNama,
          asramaId: asramaId || existing.asramaId,
          kamarLabel: String(row['Kamar'] || existing.kamarLabel || '').trim(),
          status: (String(row['Status'] || existing.status).toLowerCase().trim() as any) || 'aktif',
          statusSpp: (String(row['SPP'] || row['Status SPP'] || existing.statusSpp).toLowerCase().trim() as any) || 'lunas',
          capaianJuzHafalan: Number(row['Capaian Juz'] || row['capaianJuzHafalan'] || existing.capaianJuzHafalan) || 0,
          targetJuzHafalan: Number(row['Target Juz'] || row['targetJuzHafalan'] || existing.targetJuzHafalan) || 30,
          namaAyah: row['Nama Ayah'] ? String(row['Nama Ayah']).trim() : existing.namaAyah,
          namaIbu: row['Nama Ibu'] ? String(row['Nama Ibu']).trim() : existing.namaIbu,
          noHpWali: row['No HP Wali'] || row['HP Wali'] ? String(row['No HP Wali'] || row['HP Wali']).trim() : existing.noHpWali,
          kotaAsal: row['Kota Asal'] || row['Asal'] ? String(row['Kota Asal'] || row['Asal']).trim() : existing.kotaAsal,
          updatedAt: now,
        }).where(eq(schema.santri.id, existing.id));

        updatedCount++;
      } else {
        // Insert new santri
        const newId = 'santri-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6);
        await db.insert(schema.santri).values({
          id: newId,
          nis,
          nisn: row['NISN'] ? String(row['NISN']).trim() : null,
          nik: row['NIK'] ? String(row['NIK']).trim() : null,
          namaLengkap: nama,
          jenisKelamin: jk,
          jenjang: String(row['Lembaga'] || row['Jenjang'] || 'SMP').trim(),
          kelas: String(row['Kelas'] || row['Kelas / Rombel'] || 'VII-A').trim(),
          asrama: asramaNama,
          asramaId,
          kamarLabel: row['Kamar'] ? String(row['Kamar']).trim() : 'Kamar 101',
          status: (String(row['Status'] || 'aktif').toLowerCase().trim() as any) || 'aktif',
          statusSpp: (String(row['SPP'] || row['Status SPP'] || 'lunas').toLowerCase().trim() as any) || 'lunas',
          capaianJuzHafalan: Number(row['Capaian Juz'] || 0) || 0,
          targetJuzHafalan: Number(row['Target Juz'] || 30) || 30,
          namaAyah: row['Nama Ayah'] ? String(row['Nama Ayah']).trim() : null,
          namaIbu: row['Nama Ibu'] ? String(row['Nama Ibu']).trim() : null,
          noHpWali: row['No HP Wali'] || row['HP Wali'] ? String(row['No HP Wali'] || row['HP Wali']).trim() : null,
          kotaAsal: row['Kota Asal'] || row['Asal'] ? String(row['Kota Asal'] || row['Asal']).trim() : null,
          tahunMasuk: '2026',
          tahunAjaranId: defaultTAId,
          createdAt: now,
          updatedAt: now,
        });

        // Riwayat akademik awal
        await db.insert(schema.riwayatAkademik).values({
          id: `rw-${defaultTAId}-${newId}`,
          santriId: newId,
          tahunAjaranId: defaultTAId,
          lembagaId: '',
          jenjang: String(row['Lembaga'] || row['Jenjang'] || 'SMP').trim(),
          tingkatKelas: String(row['Kelas'] || 'VII-A').split(' ')[0],
          kelas: String(row['Kelas'] || 'VII-A').trim(),
          status: 'aktif',
          catatan: 'Import massal Excel',
          createdAt: now,
        });

        importedCount++;
      }
    }

    // Catat log audit aktivitas import
    await db.insert(schema.auditLogs).values({
      id: 'log-' + Date.now(),
      userId: user.id,
      action: 'IMPORT',
      entityType: 'santri',
      details: JSON.stringify({
        totalBaris: rawRows.length,
        imported: importedCount,
        updated: updatedCount,
        skipped: skippedCount,
        scopeEnforced: scopeLabel,
      }),
      createdAt: now,
    });

    return c.json({
      success: true,
      imported: importedCount,
      updated: updatedCount,
      skipped: skippedCount,
      errors,
      message: `Proses import selesai. ${importedCount} santri baru berhasil ditambahkan, ${updatedCount} data santri diperbarui, ${skippedCount} baris dilewati/ditolak.`,
    });
  } catch (err: any) {
    console.error('Import error:', err);
    return c.json({ error: err.message }, 500);
  }
});

// Staf, Tahfidz, Perizinan, Pelanggaran, and Storage Endpoints
app.get('/api/staf', async (c) => {
  const user = await getAuthUser(c);
  const db = getDb(c);
  const scopeAsrama = resolveUserScopeAsrama(user);
  const conds: any[] = [isNull(schema.staf.deletedAt)];
  if (scopeAsrama === 'putra') {
    conds.push(eq(schema.staf.jenisKelamin, 'L'));
  } else if (scopeAsrama === 'putri') {
    conds.push(eq(schema.staf.jenisKelamin, 'P'));
  }
  const rows = await db.select().from(schema.staf).where(and(...conds)).orderBy(asc(schema.staf.namaLengkap)).all();
  return c.json({ data: rows, total: rows.length });
});

app.post('/api/staf', async (c) => {
  const user = await getAuthUser(c);
  if (user && user.role === 'viewer') return c.json({ error: 'Viewer read-only' }, 403);
  const payload = await c.req.json();
  const db = getDb(c);
  const id = 'staf-' + Date.now();
  const now = new Date().toISOString();
  await db.insert(schema.staf).values({
    id,
    nip: payload.nip || `NIP-${Date.now().toString().slice(-6)}`,
    namaLengkap: payload.namaLengkap,
    jenisKelamin: payload.jenisKelamin || 'L',
    jabatan: payload.jabatan,
    mataPelajaranKitab: payload.mataPelajaranKitab || null,
    jenjangAjar: payload.jenjangAjar || null,
    noHp: payload.noHp || null,
    email: payload.email || null,
    statusKepegawaian: payload.statusKepegawaian || 'tetap',
    alamat: payload.alamat || null,
    pendidikanTerakhir: payload.pendidikanTerakhir || null,
    tanggalBergabung: payload.tanggalBergabung || now.split('T')[0],
    isActive: 1,
    createdAt: now,
    updatedAt: now,
  });
  return c.json({ success: true, id }, 201);
});

app.put('/api/staf/:id', async (c) => {
  const user = await getAuthUser(c);
  if (user && user.role === 'viewer') return c.json({ error: 'Viewer read-only' }, 403);
  const id = c.req.param('id');
  const payload = await c.req.json();
  const db = getDb(c);
  await db.update(schema.staf).set({ ...payload, updatedAt: new Date().toISOString() }).where(eq(schema.staf.id, id));
  return c.json({ success: true });
});

app.delete('/api/staf/:id', async (c) => {
  const user = await getAuthUser(c);
  if (user && user.role === 'viewer') return c.json({ error: 'Viewer read-only' }, 403);
  const id = c.req.param('id');
  const db = getDb(c);
  await db.delete(schema.staf).where(eq(schema.staf.id, id));
  return c.json({ success: true });
});

// Storage Endpoints
app.post('/api/storage/upload', async (c) => {
  try {
    const formData = await c.req.formData();
    const file = formData.get('file') as File;
    const category = (formData.get('category') as string) || 'foto_santri';
    if (!file) return c.json({ error: 'File tidak ditemukan' }, 400);

    const ext = file.name.split('.').pop() || 'bin';
    const r2Key = `${category}/${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${ext}`;
    const arrayBuffer = await file.arrayBuffer();

    if (!c.env.BUCKET) return c.json({ error: 'R2 bucket not found' }, 500);

    await c.env.BUCKET.put(r2Key, arrayBuffer, {
      httpMetadata: { contentType: file.type || 'application/octet-stream' },
    });

    const db = getDb(c);
    const now = new Date().toISOString();
    await db.insert(schema.storageFiles).values({
      id: 'file-' + Date.now(),
      r2Key,
      originalFilename: file.name,
      contentType: file.type || 'application/octet-stream',
      sizeBytes: file.size,
      category,
      createdAt: now,
    });

    return c.json({ success: true, key: r2Key, url: `/api/storage/${r2Key}`, filename: file.name });
  } catch (err: any) {
    return c.json({ error: err.message }, 500);
  }
});

app.get('/api/storage/*', async (c) => {
  try {
    const path = c.req.path;
    const r2Key = path.replace(/^\/api\/storage\//, '');
    if (!c.env.BUCKET) return c.text('R2 binding not configured', 500);
    const object = await c.env.BUCKET.get(r2Key);
    if (!object) return c.text('File tidak ditemukan di Cloudflare R2', 404);

    const contentType = object.httpMetadata?.contentType || 'application/octet-stream';
    const arrayBuffer = await object.arrayBuffer();
    return new Response(arrayBuffer, {
      headers: { 'Content-Type': contentType, 'Cache-Control': 'public, max-age=31536000, immutable' },
    });
  } catch (err: any) {
    return c.text(err.message, 500);
  }
});

// Tahfidz, Perizinan & Pelanggaran
// Tahfidz, Perizinan & Pelanggaran
app.post('/api/tahfidz', async (c) => {
  const user = await getAuthUser(c);
  if (user && user.role === 'viewer') return c.json({ error: 'Viewer read-only' }, 403);
  const payload = await c.req.json();
  const db = getDb(c);

  const targetSantri = await db.select().from(schema.santri).where(eq(schema.santri.id, payload.santriId)).get();
  if (!targetSantri || targetSantri.deletedAt) return c.json({ error: 'Santri tidak ditemukan' }, 404);
  if (!isSantriInScope(user, targetSantri)) {
    return c.json({ error: 'Akses ditolak: Santri ini di luar cakupan wewenang Anda' }, 403);
  }

  const now = new Date().toISOString();
  const id = 'thf-' + Date.now();
  await db.insert(schema.tahfidzRecords).values({
    id,
    santriId: payload.santriId,
    tanggal: payload.tanggal || now.split('T')[0],
    juz: Number(payload.juz),
    surat: payload.surat,
    ayatMulai: Number(payload.ayatMulai) || 1,
    ayatSelesai: Number(payload.ayatSelesai) || 50,
    predikat: payload.predikat || 'Mumtaz',
    catatan: payload.catatan || null,
    createdAt: now,
  });

  if (payload.juz && payload.juz > targetSantri.capaianJuzHafalan) {
    await db.update(schema.santri).set({ capaianJuzHafalan: Number(payload.juz), updatedAt: now }).where(eq(schema.santri.id, payload.santriId));
  }
  return c.json({ success: true, id }, 201);
});

app.post('/api/perizinan', async (c) => {
  const user = await getAuthUser(c);
  if (user && user.role === 'viewer') return c.json({ error: 'Viewer read-only' }, 403);
  const payload = await c.req.json();
  const db = getDb(c);

  const targetSantri = await db.select().from(schema.santri).where(eq(schema.santri.id, payload.santriId)).get();
  if (!targetSantri || targetSantri.deletedAt) return c.json({ error: 'Santri tidak ditemukan' }, 404);
  if (!isSantriInScope(user, targetSantri)) {
    return c.json({ error: 'Akses ditolak: Santri ini di luar cakupan wewenang Anda' }, 403);
  }

  const now = new Date().toISOString();
  const id = 'izin-' + Date.now();
  await db.insert(schema.perizinan).values({
    id,
    santriId: payload.santriId,
    jenis: payload.jenis || 'pulang_keluarga',
    tanggalMulai: payload.tanggalMulai,
    tanggalKembali: payload.tanggalKembali,
    status: 'disetujui',
    penjemput: payload.penjemput || null,
    noHpPenjemput: payload.noHpPenjemput || null,
    catatan: payload.catatan || null,
    createdAt: now,
  });
  await db.update(schema.santri).set({ status: 'izin_pulang', updatedAt: now }).where(eq(schema.santri.id, payload.santriId));
  return c.json({ success: true, id }, 201);
});

app.put('/api/perizinan/:id/selesai', async (c) => {
  const user = await getAuthUser(c);
  if (user && user.role === 'viewer') return c.json({ error: 'Viewer read-only' }, 403);
  const id = c.req.param('id');
  const db = getDb(c);
  const now = new Date().toISOString();
  const permit = await db.select().from(schema.perizinan).where(eq(schema.perizinan.id, id)).get();
  if (!permit) return c.json({ error: 'Not found' }, 404);

  const targetSantri = await db.select().from(schema.santri).where(eq(schema.santri.id, permit.santriId)).get();
  if (!targetSantri || !isSantriInScope(user, targetSantri)) {
    return c.json({ error: 'Akses ditolak: Santri ini di luar cakupan wewenang Anda' }, 403);
  }

  await db.update(schema.perizinan).set({ status: 'selesai' }).where(eq(schema.perizinan.id, id));
  await db.update(schema.santri).set({ status: 'aktif', updatedAt: now }).where(eq(schema.santri.id, permit.santriId));
  return c.json({ success: true });
});

app.post('/api/pelanggaran', async (c) => {
  const user = await getAuthUser(c);
  if (user && user.role === 'viewer') return c.json({ error: 'Viewer read-only' }, 403);
  const payload = await c.req.json();
  const db = getDb(c);

  const current = await db.select().from(schema.santri).where(eq(schema.santri.id, payload.santriId)).get();
  if (!current || current.deletedAt) return c.json({ error: 'Santri tidak ditemukan' }, 404);
  if (!isSantriInScope(user, current)) {
    return c.json({ error: 'Akses ditolak: Santri ini di luar cakupan wewenang Anda' }, 403);
  }

  const now = new Date().toISOString();
  const id = 'plg-' + Date.now();
  const poin = Number(payload.poin) || 5;
  await db.insert(schema.pelanggaran).values({
    id,
    santriId: payload.santriId,
    tanggal: payload.tanggal || now.split('T')[0],
    kategori: payload.kategori || 'ringan',
    deskripsi: payload.deskripsi,
    poin,
    sanksi: payload.sanksi || null,
    statusPenyelesaian: 'proses',
    createdAt: now,
  });
  await db.update(schema.santri).set({ poinPelanggaran: (current.poinPelanggaran || 0) + poin, updatedAt: now }).where(eq(schema.santri.id, payload.santriId));
  return c.json({ success: true, id }, 201);
});

// -------------------------------------------------------------
// STAF PENUGASAN (AKADEMIK & WALI KELAS)
// -------------------------------------------------------------
app.get('/api/staf/penugasan', async (c) => {
  const db = getDb(c);
  const tahunAjaranId = c.req.query('tahunAjaranId');
  const stafId = c.req.query('stafId');
  const conds: any[] = [isNull(schema.stafPenugasan.deletedAt)];
  if (tahunAjaranId && tahunAjaranId !== 'semua') conds.push(eq(schema.stafPenugasan.tahunAjaranId, tahunAjaranId));
  if (stafId) conds.push(eq(schema.stafPenugasan.stafId, stafId));

  const rows = await db
    .select({
      id: schema.stafPenugasan.id,
      stafId: schema.stafPenugasan.stafId,
      stafNama: schema.staf.namaLengkap,
      stafNip: schema.staf.nip,
      tahunAjaranId: schema.stafPenugasan.tahunAjaranId,
      tahunAjaranNama: schema.tahunAjaran.nama,
      lembagaId: schema.stafPenugasan.lembagaId,
      lembagaNama: schema.lembaga.nama,
      tugasMapel: schema.stafPenugasan.tugasMapel,
      waliKelasId: schema.stafPenugasan.waliKelasId,
      waliKelasNama: schema.kelas.namaKelas,
      keterangan: schema.stafPenugasan.keterangan,
      createdAt: schema.stafPenugasan.createdAt,
    })
    .from(schema.stafPenugasan)
    .innerJoin(schema.staf, eq(schema.stafPenugasan.stafId, schema.staf.id))
    .innerJoin(schema.tahunAjaran, eq(schema.stafPenugasan.tahunAjaranId, schema.tahunAjaran.id))
    .leftJoin(schema.lembaga, eq(schema.stafPenugasan.lembagaId, schema.lembaga.id))
    .leftJoin(schema.kelas, eq(schema.stafPenugasan.waliKelasId, schema.kelas.id))
    .where(and(...conds))
    .all();

  return c.json({ data: rows });
});

app.post('/api/staf/penugasan', async (c) => {
  const user = await getAuthUser(c);
  if (!user || user.role === 'viewer') return c.json({ error: 'Akses ditolak' }, 403);
  const payload = await c.req.json();
  const db = getDb(c);
  const id = 'tgs-' + Date.now();
  const now = new Date().toISOString();

  await db.insert(schema.stafPenugasan).values({
    id,
    stafId: payload.stafId,
    tahunAjaranId: payload.tahunAjaranId,
    lembagaId: payload.lembagaId || null,
    tugasMapel: payload.tugasMapel,
    waliKelasId: payload.waliKelasId || null,
    keterangan: payload.keterangan || null,
    createdAt: now,
    updatedAt: now,
  });

  return c.json({ success: true, id }, 201);
});

app.delete('/api/staf/penugasan/:id', async (c) => {
  const user = await getAuthUser(c);
  if (!user || user.role === 'viewer') return c.json({ error: 'Akses ditolak' }, 403);
  const id = c.req.param('id');
  const db = getDb(c);
  const now = new Date().toISOString();

  await db.update(schema.stafPenugasan).set({ deletedAt: now }).where(eq(schema.stafPenugasan.id, id));
  return c.json({ success: true });
});

// -------------------------------------------------------------
// DOKUMEN DIGITAL (BERKAS SANTRI & STAF)
// -------------------------------------------------------------
app.get('/api/dokumen', async (c) => {
  const user = await getAuthUser(c);
  const db = getDb(c);
  const pemilikTipe = c.req.query('pemilikTipe');
  const pemilikId = c.req.query('pemilikId');

  if (pemilikTipe === 'santri' && pemilikId) {
    const s = await db.select().from(schema.santri).where(eq(schema.santri.id, pemilikId)).get();
    if (s && !isSantriInScope(user, s)) {
      return c.json({ error: 'Akses ditolak: Dokumen santri di luar cakupan wewenang Anda' }, 403);
    }
  }

  const conds: any[] = [isNull(schema.dokumen.deletedAt)];
  if (pemilikTipe) conds.push(eq(schema.dokumen.pemilikTipe, pemilikTipe));
  if (pemilikId) conds.push(eq(schema.dokumen.pemilikId, pemilikId));

  const rows = await db
    .select()
    .from(schema.dokumen)
    .where(and(...conds))
    .orderBy(desc(schema.dokumen.createdAt))
    .all();

  return c.json({ data: rows });
});

app.post('/api/dokumen', async (c) => {
  const user = await getAuthUser(c);
  if (!user || user.role === 'viewer') return c.json({ error: 'Akses ditolak' }, 403);
  const payload = await c.req.json();
  const db = getDb(c);

  if (payload.pemilikTipe === 'santri' && payload.pemilikId) {
    const s = await db.select().from(schema.santri).where(eq(schema.santri.id, payload.pemilikId)).get();
    if (!s || !isSantriInScope(user, s)) {
      return c.json({ error: 'Akses ditolak: Santri di luar cakupan wewenang Anda' }, 403);
    }
  }

  const id = 'doc-' + Date.now();
  const now = new Date().toISOString();

  await db.insert(schema.dokumen).values({
    id,
    pemilikTipe: payload.pemilikTipe || 'santri',
    pemilikId: payload.pemilikId,
    jenis: payload.jenis || 'Lainnya',
    fileKey: payload.fileKey,
    namaFile: payload.namaFile,
    ukuranBytes: Number(payload.ukuranBytes) || 0,
    mimeType: payload.mimeType || 'application/pdf',
    url: payload.url || `/api/storage/${payload.fileKey}`,
    uploadedBy: user.id,
    catatan: payload.catatan || null,
    createdAt: now,
    updatedAt: now,
  });

  return c.json({ success: true, id }, 201);
});

app.delete('/api/dokumen/:id', async (c) => {
  const user = await getAuthUser(c);
  if (!user || user.role === 'viewer') return c.json({ error: 'Akses ditolak' }, 403);
  const id = c.req.param('id');
  const db = getDb(c);
  const now = new Date().toISOString();

  const doc = await db.select().from(schema.dokumen).where(eq(schema.dokumen.id, id)).get();
  if (doc && doc.pemilikTipe === 'santri' && doc.pemilikId) {
    const s = await db.select().from(schema.santri).where(eq(schema.santri.id, doc.pemilikId)).get();
    if (s && !isSantriInScope(user, s)) {
      return c.json({ error: 'Akses ditolak: Dokumen di luar wewenang Anda' }, 403);
    }
  }

  await db.update(schema.dokumen).set({ deletedAt: now }).where(eq(schema.dokumen.id, id));
  return c.json({ success: true });
});

// -------------------------------------------------------------
// MULTI-LEMBAGA: SANTRI KEANGGOTAAN
// (Satu santri boleh banyak lembaga dalam satu tahun ajaran)
// -------------------------------------------------------------
app.get('/api/santri/:id/keanggotaan', async (c) => {
  const user = await getAuthUser(c);
  const id = c.req.param('id');
  const db = getDb(c);

  const target = await db.select().from(schema.santri).where(eq(schema.santri.id, id)).get();
  if (target && !isSantriInScope(user, target)) {
    return c.json({ error: 'Akses ditolak: Santri di luar cakupan wewenang Anda' }, 403);
  }

  const tahunAjaranId = c.req.query('tahunAjaranId');

  const conds: any[] = [
    eq(schema.santriKeanggotaan.santriId, id),
    isNull(schema.santriKeanggotaan.deletedAt),
  ];
  if (tahunAjaranId && tahunAjaranId !== 'semua') {
    conds.push(eq(schema.santriKeanggotaan.tahunAjaranId, tahunAjaranId));
  }

  const rows = await db
    .select({
      id: schema.santriKeanggotaan.id,
      santriId: schema.santriKeanggotaan.santriId,
      tahunAjaranId: schema.santriKeanggotaan.tahunAjaranId,
      tahunAjaranNama: schema.tahunAjaran.nama,
      semester: schema.tahunAjaran.semester,
      lembagaId: schema.santriKeanggotaan.lembagaId,
      lembagaNama: schema.lembaga.nama,
      lembagaKode: schema.lembaga.kode,
      kelasId: schema.santriKeanggotaan.kelasId,
      kelasNama: schema.santriKeanggotaan.kelasNama,
      status: schema.santriKeanggotaan.status,
      catatan: schema.santriKeanggotaan.catatan,
      createdAt: schema.santriKeanggotaan.createdAt,
    })
    .from(schema.santriKeanggotaan)
    .innerJoin(schema.tahunAjaran, eq(schema.santriKeanggotaan.tahunAjaranId, schema.tahunAjaran.id))
    .innerJoin(schema.lembaga, eq(schema.santriKeanggotaan.lembagaId, schema.lembaga.id))
    .where(and(...conds))
    .orderBy(desc(schema.tahunAjaran.nama), asc(schema.lembaga.nama))
    .all();

  return c.json({ data: rows });
});

app.post('/api/santri/:id/keanggotaan', async (c) => {
  const user = await getAuthUser(c);
  if (!user || user.role === 'viewer') return c.json({ error: 'Akses ditolak' }, 403);
  const santriId = c.req.param('id');
  const payload = await c.req.json();
  const db = getDb(c);

  const target = await db.select().from(schema.santri).where(eq(schema.santri.id, santriId)).get();
  if (!target || !isSantriInScope(user, target)) {
    return c.json({ error: 'Akses ditolak: Santri di luar cakupan wewenang Anda' }, 403);
  }

  const id = 'kg-' + Date.now();
  const now = new Date().toISOString();

  await db.insert(schema.santriKeanggotaan).values({
    id,
    santriId,
    tahunAjaranId: payload.tahunAjaranId,
    lembagaId: payload.lembagaId,
    kelasId: payload.kelasId || null,
    kelasNama: payload.kelasNama,
    status: payload.status || 'aktif',
    catatan: payload.catatan || 'Pendaftaran lembaga tambahan (multi-lembaga)',
    createdAt: now,
    updatedAt: now,
  });

  return c.json({ success: true, id }, 201);
});

// -------------------------------------------------------------
// AUDIT LOGS TRAIL
// -------------------------------------------------------------
app.get('/api/audit-logs', async (c) => {
  const db = getDb(c);
  const limit = Math.min(100, Math.max(10, parseInt(c.req.query('limit') || '50', 10)));
  const rows = await db
    .select({
      id: schema.auditLogs.id,
      userId: schema.auditLogs.userId,
      userFullName: schema.users.fullName,
      action: schema.auditLogs.action,
      entityType: schema.auditLogs.entityType,
      entityId: schema.auditLogs.entityId,
      details: schema.auditLogs.details,
      ipAddress: schema.auditLogs.ipAddress,
      createdAt: schema.auditLogs.createdAt,
    })
    .from(schema.auditLogs)
    .leftJoin(schema.users, eq(schema.auditLogs.userId, schema.users.id))
    .orderBy(desc(schema.auditLogs.createdAt))
    .limit(limit)
    .all();

  return c.json({ data: rows });
});
