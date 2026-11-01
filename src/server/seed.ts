/**
 * SIAKAD Pesantren - Data Seeder
 * Seeds Multi-Lembaga, Kelas & Jurusan, Asrama & Kamar, Tahun Ajaran, 2.000 Santri (Multi-Lembaga),
 * 45 Staf & Penugasan, Dokumen R2, Scoped RBAC Users & Audit Logs.
 */
import { hashPassword, verifyPassword } from './auth.ts';

const NAMA_DEPAN_L = [
  'Muhammad', 'Ahmad', 'Ali', 'Umar', 'Usman', 'Hasan', 'Husain', 'Faris', 'Zaid', 'Bilal',
  'Fathir', 'Rizky', 'Fauzan', 'Fikri', 'Ibrahim', 'Yusuf', 'Hamzah', 'Taufiq', 'Salman', 'Luqman',
  'Syamil', 'Zaky', 'Ilham', 'Arif', 'Hafizh', 'Fadhil', 'Rayhan', 'Dani', 'Irfan', 'Anas'
];

const NAMA_DEPAN_P = [
  'Siti', 'Fatimah', 'Aisyah', 'Khadijah', 'Zahra', 'Maryam', 'Nabila', 'Salma', 'Nurul', 'Hafidzah',
  'Zulfa', 'Safira', 'Yasmin', 'Rania', 'Amirah', 'Syifa', 'Hilya', 'Najwa', 'Afifah', 'Lathifah',
  'Mutia', 'Dewi', 'Inayah', 'Kayla', 'Alya', 'Azizah', 'Mawaddah', 'Nida', 'Khoirunnisa', 'Raudhah'
];

const NAMA_BELAKANG = [
  'Hidayat', 'Ramadhan', 'Pratama', 'Saputra', 'Hakim', 'Maulana', 'Firmansyah', 'Santoso', 'Kurniawan', 'Nugroho',
  'Wahyudi', 'Hidayatullah', 'Al-Ghifari', 'As-Syauqi', 'Al-Fatih', 'Siregar', 'Lubis', 'Kusuma', 'Gunawan', 'Supriadi',
  'Anwar', 'Nashiruddin', 'Mukhtar', 'Jauhari', 'Zulqarnain', 'Mahfudz', 'Mansyur', 'Hasanah', 'Rahman', 'Salsabila'
];

const KOTA_ASAL = [
  { kota: 'Jombang', prov: 'Jawa Timur' },
  { kota: 'Kediri', prov: 'Jawa Timur' },
  { kota: 'Surabaya', prov: 'Jawa Timur' },
  { kota: 'Malang', prov: 'Jawa Timur' },
  { kota: 'Semarang', prov: 'Jawa Tengah' },
  { kota: 'Solo', prov: 'Jawa Tengah' },
  { kota: 'Demak', prov: 'Jawa Tengah' },
  { kota: 'Kudus', prov: 'Jawa Tengah' },
  { kota: 'Cirebon', prov: 'Jawa Barat' },
  { kota: 'Tasikmalaya', prov: 'Jawa Barat' },
  { kota: 'Bandung', prov: 'Jawa Barat' },
  { kota: 'Bogor', prov: 'Jawa Barat' },
  { kota: 'Jakarta Selatan', prov: 'DKI Jakarta' },
  { kota: 'Jakarta Timur', prov: 'DKI Jakarta' },
  { kota: 'Tangerang', prov: 'Banten' },
  { kota: 'Serang', prov: 'Banten' },
  { kota: 'Lampung', prov: 'Lampung' },
  { kota: 'Palembang', prov: 'Sumatera Selatan' },
  { kota: 'Medan', prov: 'Sumatera Utara' },
  { kota: 'Banjarmasin', prov: 'Kalimantan Selatan' }
];

export async function seedDatabase(rawDb: any) {
  const check = rawDb.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='lembaga'").get();
  if (!check) return;

  rawDb.pragma('foreign_keys = OFF');
  const now = new Date().toISOString();

  // Check if initial seeding has already been performed
  const countLembaga = rawDb.prepare('SELECT COUNT(*) as c FROM lembaga').get() as { c: number };
  const countSantri = rawDb.prepare('SELECT COUNT(*) as c FROM santri').get() as { c: number };
  if (countLembaga && countLembaga.c > 0 && countSantri && countSantri.c > 0) {
    // If master already exists, populate any newly added tables if they are empty
    await seedNewTablesIfNeeded(rawDb, now);
    return;
  }

  console.log('🌱 Menyiapkan Struktur Multi-Lembaga, Kelas, Asrama, serta 2.000 Santri...');

  // 1. Seed Tahun Ajaran (Hanya 1 aktif)
  const insertTA = rawDb.prepare(`
    INSERT OR IGNORE INTO tahun_ajaran (id, nama, semester, tanggal_mulai, tanggal_selesai, is_active, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  insertTA.run('ta-2026', '2026/2027', 'Ganjil', '2026-07-15', '2026-12-23', 1, now, now);
  insertTA.run('ta-2025', '2025/2026', 'Genap', '2026-01-05', '2026-06-20', 0, now, now);
  insertTA.run('ta-2027', '2027/2028', 'Ganjil', '2027-07-15', '2027-12-23', 0, now, now);

  // 2. Seed Master Lembaga
  const insertLembaga = rawDb.prepare(`
    INSERT OR IGNORE INTO lembaga (id, kode, nama, tingkat_kelas, keterangan, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  const lembagas = [
    {
      id: 'lmb-sd',
      kode: 'SD',
      nama: 'SD Islam Al-Barokah',
      tingkatKelas: JSON.stringify(['Kelas 1', 'Kelas 2', 'Kelas 3', 'Kelas 4', 'Kelas 5', 'Kelas 6']),
      keterangan: 'Pendidikan dasar berasrama integrasi kurikulum nasional & kepesantrenan',
    },
    {
      id: 'lmb-smp',
      kode: 'SMP',
      nama: 'SMP Plus Al-Barokah',
      tingkatKelas: JSON.stringify([
        'VII-A Putra', 'VII-B Putra', 'VII-C Putri', 'VII-D Putri',
        'VIII-A Putra', 'VIII-B Putra', 'VIII-C Putri', 'VIII-D Putri',
        'IX-A Putra', 'IX-B Putra', 'IX-C Putri', 'IX-D Putri'
      ]),
      keterangan: 'Pendidikan menengah pertama dengan akselerasi bahasa Arab & Inggris',
    },
    {
      id: 'lmb-sma',
      kode: 'SMA',
      nama: 'SMA Unggulan Al-Barokah',
      tingkatKelas: JSON.stringify([
        'X-IPA Putra', 'X-IPA Putri', 'X-IPS Putra', 'X-IPS Putri',
        'XI-IPA Putra', 'XI-IPA Putri', 'XI-IPS Putra', 'XI-IPS Putri',
        'XII-IPA Putra', 'XII-IPA Putri', 'XII-IPS Putra', 'XII-IPS Putri'
      ]),
      keterangan: 'Pendidikan menengah atas peminatan MIPA dan IPS',
    },
    {
      id: 'lmb-smk',
      kode: 'SMK',
      nama: 'SMK Pesantren Al-Barokah',
      tingkatKelas: JSON.stringify([
        'X-TKJ (Teknik Komputer)', 'X-RPL (Rekayasa Perangkat Lunak)',
        'XI-TKJ (Teknik Komputer)', 'XI-RPL (Rekayasa Perangkat Lunak)',
        'XII-TKJ (Teknik Komputer)', 'XII-RPL (Rekayasa Perangkat Lunak)'
      ]),
      keterangan: 'Pendidikan vokasi kejuruan IT & digital berbasis pesantren',
    },
    {
      id: 'lmb-ngaji',
      kode: 'NGAJI',
      nama: 'Madrasah Al-Qur\'an & Tahfidz',
      tingkatKelas: JSON.stringify([
        'Jilid 1 (Iqro/Ummi)', 'Jilid 2-3', 'Jilid 4-5', 'Jilid 6 (Gharib & Tajwid)',
        'Tahfidz Juz 1-5', 'Tahfidz Juz 6-15', 'Tahfidz 30 Juz'
      ]),
      keterangan: 'Pembelajaran tartil Al-Qur\'an dan tahfidz bersanad',
    },
    {
      id: 'lmb-diniyah',
      kode: 'DINIYAH',
      nama: 'Madrasah Diniyah Takmiliyah',
      tingkatKelas: JSON.stringify([
        'Awaliyah 1 (Kitab Safinah & Jurumiyyah)', 'Awaliyah 2 (Taqrib & Imrithi)',
        'Wustha 1 (Fathul Qorib & Mutammimah)', 'Wustha 2 (Kifayatul Akhyar)',
        'Ulya 1 (Fathul Mu\'in)', 'Ulya 2 (Ihya Ulumiddin)'
      ]),
      keterangan: 'Kajian kitab kuning salaf perjenjangan turots',
    },
  ];

  for (const l of lembagas) {
    insertLembaga.run(l.id, l.kode, l.nama, l.tingkatKelas, l.keterangan, now, now);
  }

  // 3. Seed Master Kelas Terstruktur (Entity Kelas)
  const insertKelas = rawDb.prepare(`
    INSERT OR IGNORE INTO kelas (id, lembaga_id, tingkat, nama_kelas, jurusan, kapasitas, wali_kelas_staf_id, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  for (const l of lembagas) {
    const list: string[] = JSON.parse(l.tingkatKelas);
    list.forEach((clsName, idx) => {
      const id = `kls-${l.kode.toLowerCase()}-${idx + 1}`;
      let jurusan = null;
      if (clsName.includes('IPA')) jurusan = 'IPA';
      else if (clsName.includes('IPS')) jurusan = 'IPS';
      else if (clsName.includes('TKJ')) jurusan = 'TKJ';
      else if (clsName.includes('RPL')) jurusan = 'RPL';
      else if (clsName.includes('Tahfidz')) jurusan = 'Tahfidz';

      const tingkat = clsName.split(' ')[0] || clsName;
      insertKelas.run(id, l.id, tingkat, clsName, jurusan, 35, `staf-${(idx % 20) + 1}`, now, now);
    });
  }

  // 4. Seed 45 Staf & Asatidz
  const insertStaf = rawDb.prepare(`
    INSERT OR IGNORE INTO staf (
      id, nip, nama_lengkap, jenis_kelamin, tempat_lahir, tanggal_lahir,
      jabatan, bagian, mata_pelajaran_kitab, jenjang_ajar,
      no_hp, email, status_kepegawaian, alamat, pendidikan_terakhir,
      tanggal_bergabung, tanggal_mulai_tugas, is_active, created_at, updated_at
    ) VALUES (
      ?, ?, ?, ?, ?, ?,
      ?, ?, ?, ?,
      ?, ?, ?, ?, ?,
      ?, ?, 1, ?, ?
    )
  `);

  const stafList: any[] = [];
  const bagianOptions = ['Guru', 'Ustadz/Ustadzah', 'Musyrif/Musyrifah', 'Pengurus', 'Tata Usaha'];

  for (let i = 1; i <= 45; i++) {
    const isL = i % 3 !== 0;
    const jk = isL ? 'L' : 'P';
    const depan = isL ? NAMA_DEPAN_L[i % NAMA_DEPAN_L.length] : NAMA_DEPAN_P[i % NAMA_DEPAN_P.length];
    const belakang = NAMA_BELAKANG[(i * 3) % NAMA_BELAKANG.length];
    const gelar = isL ? (i <= 5 ? 'K.H.' : 'Ust.') : 'Ustzh.';
    const gelarAkademik = i % 4 === 0 ? 'Lc., M.A.' : 'S.Pd.I';
    const nama = `${gelar} ${depan} ${belakang}, ${gelarAkademik}`;
    const nip = `NIP-${1980 + (i % 20)}${String(i).padStart(3, '0')}`;
    const jabatan = i <= 2 ? 'Pengasuh' : (i <= 4 ? 'Kepala Madrasah' : (i <= 10 ? 'Musyrif / Pembina Asrama' : 'Guru Mapel / Asatidz'));
    const bagian = i <= 2 ? 'Pengurus' : (i <= 10 ? 'Musyrif/Musyrifah' : (i % 5 === 0 ? 'Tata Usaha' : 'Ustadz/Ustadzah'));
    const id = `staf-${i}`;

    insertStaf.run(
      id,
      nip,
      nama,
      jk,
      KOTA_ASAL[i % KOTA_ASAL.length].kota,
      `198${(i % 9) + 1}-0${(i % 8) + 1}-10`,
      jabatan,
      bagian,
      i % 2 === 0 ? 'Fiqih & Fathul Qorib' : 'Nahwu & Shorof',
      'Semua Jenjang',
      `0812${String(10000000 + i * 23456).slice(0, 8)}`,
      `ustadz.${depan.toLowerCase()}${i}@pesantren.id`,
      'tetap',
      'Kompleks Pondok Pesantren',
      'S1 Universitas Al-Azhar Kairo',
      '2018-07-01',
      '2018-07-15',
      now,
      now
    );
    stafList.push({ id, nama, jk });
  }

  // 5. Seed Staf Penugasan (Tahun Ajaran 2026/2027)
  const insertPenugasan = rawDb.prepare(`
    INSERT OR IGNORE INTO staf_penugasan (id, staf_id, tahun_ajaran_id, lembaga_id, tugas_mapel, wali_kelas_id, keterangan, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  for (let i = 1; i <= 30; i++) {
    const lmbId = lembagas[i % lembagas.length].id;
    const tugas = i % 3 === 0 ? 'Guru Fiqih & Tafsir Jalalain' : (i % 3 === 1 ? 'Musyrif Pendamping Asrama' : 'Guru Bahasa Arab & Nahwu');
    insertPenugasan.run(
      `tgs-2026-${i}`,
      `staf-${i}`,
      'ta-2026',
      lmbId,
      tugas,
      i <= 12 ? `kls-smp-${i}` : null,
      'Penugasan SK Tahun Ajaran 2026/2027',
      now,
      now
    );
  }

  // 6. Seed Asrama (Putra & Putri) & Kamar
  const insertAsrama = rawDb.prepare(`
    INSERT OR IGNORE INTO asrama (id, nama, kelompok_gender, kapasitas, musyrif_staf_id, keterangan, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertKamar = rawDb.prepare(`
    INSERT OR IGNORE INTO kamar (id, asrama_id, nama_kamar, kapasitas, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  const asramaConfigs = [
    { id: 'asr-ptr-1', nama: 'Gedung Al-Ghazali (Putra)', gender: 'Putra', kap: 350, musyrif: 'staf-5', ket: 'Asrama Utama Santri Tingkat SMP & SMA' },
    { id: 'asr-ptr-2', nama: 'Gedung Ibnu Sina (Putra)', gender: 'Putra', kap: 300, musyrif: 'staf-6', ket: 'Asrama Santri Tingkat SMK' },
    { id: 'asr-ptr-3', nama: 'Gedung Imam Bukhari (Putra)', gender: 'Putra', kap: 250, musyrif: 'staf-7', ket: 'Asrama Khusus Diniyah Takmiliyah' },
    { id: 'asr-ptr-4', nama: 'Gedung Al-Farabi Tahfidz (Putra)', gender: 'Putra', kap: 150, musyrif: 'staf-8', ket: 'Kompleks Takhassus Tahfidz 30 Juz' },
    { id: 'asr-pti-1', nama: 'Gedung Maryam (Putri)', gender: 'Putri', kap: 400, musyrif: 'staf-3', ket: 'Asrama Utama Santriwati SMP & SMA' },
    { id: 'asr-pti-2', nama: 'Gedung Khadijah (Putri)', gender: 'Putri', kap: 350, musyrif: 'staf-9', ket: 'Asrama Santriwati SMK & Diniyah' },
    { id: 'asr-pti-3', nama: 'Gedung Aisyah Tahfidz (Putri)', gender: 'Putri', kap: 250, musyrif: 'staf-12', ket: 'Kompleks Takhassus Tahfidz Banat' },
  ];

  const allKamars: { id: string; asramaId: string; asramaNama: string; namaKamar: string; gender: string }[] = [];

  for (const a of asramaConfigs) {
    insertAsrama.run(a.id, a.nama, a.gender, a.kap, a.musyrif, a.ket, now, now);

    for (let k = 1; k <= 10; k++) {
      const kamarId = `${a.id}-kmr-${k}`;
      const namaKamar = `Kamar ${100 + k}`;
      insertKamar.run(kamarId, a.id, namaKamar, 35, now, now);
      allKamars.push({
        id: kamarId,
        asramaId: a.id,
        asramaNama: a.nama,
        namaKamar,
        gender: a.gender,
      });
    }
  }

  // 7. Seed Scoped Users & User Scopes Table
  const defaultPassword = process.env.SUPERADMIN_INITIAL_PASSWORD || 'PesantrenAdmin2026!';
  const { hash, salt } = await hashPassword(defaultPassword);

  const insertUser = rawDb.prepare(`
    INSERT OR IGNORE INTO users (id, username, password_hash, salt, full_name, role, assigned_lembaga_ids, assigned_asrama_ids, scope_asrama, phone, is_active, must_change_password, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?, ?)
  `);

  const insertScope = rawDb.prepare(`
    INSERT OR IGNORE INTO user_scopes (id, user_id, scope_type, lembaga_id, asrama_id, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  const scopedUsers = [
    {
      id: 'usr-1',
      username: 'admin',
      fullName: 'Ust. H. Ahmad Fauzi (Super Admin)',
      role: 'superadmin',
      assignedLembagaIds: null,
      assignedAsramaIds: null,
      scopeAsrama: 'semua',
      phone: '081234567890',
      scopes: [],
    },
    {
      id: 'usr-2',
      username: 'admin_smp',
      fullName: 'Ust. Zulfikar, S.Pd.I (Admin Lembaga SMP)',
      role: 'admin_lembaga',
      assignedLembagaIds: JSON.stringify(['lmb-smp']),
      assignedAsramaIds: null,
      scopeAsrama: 'semua',
      phone: '081234567891',
      scopes: [{ type: 'lembaga', id: 'lmb-smp' }],
    },
    {
      id: 'usr-3',
      username: 'admin_sma_smk',
      fullName: 'Ust. Hendra Prasetya, M.Pd (Admin Lembaga SMA & SMK)',
      role: 'admin_lembaga',
      assignedLembagaIds: JSON.stringify(['lmb-sma', 'lmb-smk']),
      assignedAsramaIds: null,
      scopeAsrama: 'semua',
      phone: '081234567892',
      scopes: [{ type: 'lembaga', id: 'lmb-sma' }, { type: 'lembaga', id: 'lmb-smk' }],
    },
    {
      id: 'usr-4',
      username: 'admin_ngaji',
      fullName: 'Ust. M. Ridwan, S.H.I (Admin Ngaji & Diniyah)',
      role: 'admin_lembaga',
      assignedLembagaIds: JSON.stringify(['lmb-ngaji', 'lmb-diniyah']),
      assignedAsramaIds: null,
      scopeAsrama: 'semua',
      phone: '081234567893',
      scopes: [{ type: 'lembaga', id: 'lmb-ngaji' }, { type: 'lembaga', id: 'lmb-diniyah' }],
    },
    {
      id: 'usr-5',
      username: 'musyrif_putra',
      fullName: 'Ust. Dani Hidayat (Pengelola Asrama Putra)',
      role: 'pengurus_asrama',
      assignedLembagaIds: null,
      assignedAsramaIds: JSON.stringify(['asr-ptr-1', 'asr-ptr-2', 'asr-ptr-3', 'asr-ptr-4']),
      scopeAsrama: 'putra',
      phone: '081234567894',
      scopes: [
        { type: 'asrama', id: 'asr-ptr-1' },
        { type: 'asrama', id: 'asr-ptr-2' },
        { type: 'asrama', id: 'asr-ptr-3' },
        { type: 'asrama', id: 'asr-ptr-4' }
      ],
    },
    {
      id: 'usr-6',
      username: 'musyrifah_putri',
      fullName: 'Ustzh. Fatimah Azzahra (Pengelola Asrama Putri)',
      role: 'pengurus_asrama',
      assignedLembagaIds: null,
      assignedAsramaIds: JSON.stringify(['asr-pti-1', 'asr-pti-2', 'asr-pti-3']),
      scopeAsrama: 'putri',
      phone: '081234567895',
      scopes: [
        { type: 'asrama', id: 'asr-pti-1' },
        { type: 'asrama', id: 'asr-pti-2' },
        { type: 'asrama', id: 'asr-pti-3' }
      ],
    },
    {
      id: 'usr-7',
      username: 'viewer_smp',
      fullName: 'Hj. Siti Romlah, S.E. (Viewer Data SMP)',
      role: 'viewer',
      assignedLembagaIds: JSON.stringify(['lmb-smp']),
      assignedAsramaIds: null,
      scopeAsrama: 'semua',
      phone: '081234567896',
      scopes: [{ type: 'lembaga', id: 'lmb-smp' }],
    },
  ];

  for (const u of scopedUsers) {
    const mustChange = u.username === 'admin' ? 1 : 0;
    insertUser.run(
      u.id,
      u.username,
      hash,
      salt,
      u.fullName,
      u.role,
      u.assignedLembagaIds,
      u.assignedAsramaIds,
      u.scopeAsrama,
      u.phone,
      mustChange,
      now,
      now
    );

    u.scopes.forEach((sc, idx) => {
      insertScope.run(
        `scope-${u.id}-${idx + 1}`,
        u.id,
        sc.type,
        sc.type === 'lembaga' ? sc.id : null,
        sc.type === 'asrama' ? sc.id : null,
        now,
        now
      );
    });
  }

  // 8. Seed 2.000 Santri, santri_keanggotaan (Multi-Lembaga), & santri_kamar
  const insertSantri = rawDb.prepare(`
    INSERT OR IGNORE INTO santri (
      id, nis, nisn, nik, nama_lengkap, nama_panggilan, jenis_kelamin,
      tempat_lahir, tanggal_lahir,
      lembaga_id, asrama_id, kamar_id, tahun_ajaran_id,
      jenjang, kelas, asrama, kamar_label,
      status, nama_ayah, nama_ibu, nama_wali, no_hp_wali,
      alamat_asal, kota_asal, provinsi_asal,
      target_juz_hafalan, capaian_juz_hafalan, status_spp, poin_pelanggaran,
      tanggal_masuk, tahun_masuk, catatan_kesehatan, catatan, created_at, updated_at
    ) VALUES (
      ?, ?, ?, ?, ?, ?, ?,
      ?, ?,
      ?, ?, ?, ?,
      ?, ?, ?, ?,
      ?, ?, ?, ?, ?,
      ?, ?, ?,
      ?, ?, ?, ?,
      ?, ?, ?, ?, ?, ?
    )
  `);

  const insertKeanggotaan = rawDb.prepare(`
    INSERT OR IGNORE INTO santri_keanggotaan (id, santri_id, tahun_ajaran_id, lembaga_id, kelas_id, kelas_nama, status, catatan, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertRiwayat = rawDb.prepare(`
    INSERT OR IGNORE INTO riwayat_akademik (id, santri_id, tahun_ajaran_id, lembaga_id, jenjang, tingkat_kelas, kelas, status, catatan, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertSantriKmr = rawDb.prepare(`
    INSERT OR IGNORE INTO santri_kamar (id, santri_id, tahun_ajaran_id, kamar_id, asrama_id, tanggal_mulai, status, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, 'aktif', ?, ?)
  `);

  const insertPenempatan = rawDb.prepare(`
    INSERT OR IGNORE INTO penempatan_kamar (id, santri_id, asrama_id, kamar_id, tahun_ajaran_id, tanggal_mulai, status, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, 'aktif', ?, ?)
  `);

  const kamarsPutra = allKamars.filter((k) => k.gender === 'Putra');
  const kamarsPutri = allKamars.filter((k) => k.gender === 'Putri');

  const lembagaDistribution = [
    { id: 'lmb-smp', kode: 'SMP', count: 500, classes: JSON.parse(lembagas[1].tingkatKelas) },
    { id: 'lmb-sma', kode: 'SMA', count: 450, classes: JSON.parse(lembagas[2].tingkatKelas) },
    { id: 'lmb-smk', kode: 'SMK', count: 350, classes: JSON.parse(lembagas[3].tingkatKelas) },
    { id: 'lmb-ngaji', kode: 'Ngaji Alquran', count: 350, classes: JSON.parse(lembagas[4].tingkatKelas) },
    { id: 'lmb-diniyah', kode: 'Madrasah Diniyah', count: 250, classes: JSON.parse(lembagas[5].tingkatKelas) },
    { id: 'lmb-sd', kode: 'SD', count: 100, classes: JSON.parse(lembagas[0].tingkatKelas) },
  ];

  let santriGlobalIndex = 1;

  const santriTx = rawDb.transaction(() => {
    for (const dist of lembagaDistribution) {
      for (let j = 0; j < dist.count; j++) {
        const i = santriGlobalIndex++;
        const isL = i % 2 === 1;
        const jk = isL ? 'L' : 'P';
        const depan = isL
          ? NAMA_DEPAN_L[(i + Math.floor(i / 13)) % NAMA_DEPAN_L.length]
          : NAMA_DEPAN_P[(i + Math.floor(i / 11)) % NAMA_DEPAN_P.length];
        const belakang1 = NAMA_BELAKANG[(i * 2) % NAMA_BELAKANG.length];
        const belakang2 = NAMA_BELAKANG[(i * 5 + 3) % NAMA_BELAKANG.length];
        const namaLengkap = `${depan} ${belakang1} ${belakang2}`;
        const namaPanggilan = depan;

        const kelas = dist.classes[j % dist.classes.length];
        const kamarPool = isL ? kamarsPutra : kamarsPutri;
        const assignedKamar = kamarPool[i % kamarPool.length];
        const asal = KOTA_ASAL[i % KOTA_ASAL.length];
        const nis = `24${String(i).padStart(5, '0')}`;
        const nisn = `00${String(10000000 + i * 7).slice(0, 8)}`;
        const nik = `350${String(1000000000000 + i * 314159).slice(0, 13)}`;

        let status = 'aktif';
        if (i % 60 === 0) status = 'izin_pulang';
        else if (i % 120 === 0) status = 'alpa';
        else if (i % 250 === 0) status = 'skorsing';

        let statusSpp = 'lunas';
        if (i % 7 === 0) statusSpp = 'tunggakan_1_bulan';
        else if (i % 19 === 0) statusSpp = 'tunggakan_2_bulan';
        else if (i % 43 === 0) statusSpp = 'tunggakan_3_bulan_plus';

        const targetHafalan = dist.kode.includes('Ngaji') ? 30 : (dist.kode === 'SD' ? 5 : (dist.kode === 'SMP' ? 10 : 15));
        const capaianHafalan = Math.min(targetHafalan, parseFloat(((i % (targetHafalan + 1)) + ((i % 10) / 10)).toFixed(1)));
        const poinPelanggaran = (i % 11 === 0) ? (i % 30) : 0;

        const tahunMasuk = ['2022', '2023', '2024', '2025'][i % 4];
        const namaAyah = `H. ${NAMA_DEPAN_L[(i * 3) % NAMA_DEPAN_L.length]} ${NAMA_BELAKANG[(i + 4) % NAMA_BELAKANG.length]}`;
        const namaIbu = `Hj. ${NAMA_DEPAN_P[(i * 4) % NAMA_DEPAN_P.length]} ${NAMA_BELAKANG[(i + 6) % NAMA_BELAKANG.length]}`;
        const namaWali = namaAyah;
        const noHpWali = `0813${String(10000000 + i * 179).slice(0, 8)}`;
        const santriId = `santri-${i}`;

        insertSantri.run(
          santriId,
          nis,
          nisn,
          nik,
          namaLengkap,
          namaPanggilan,
          jk,
          asal.kota,
          `2010-0${(i % 9) + 1}-15`,
          dist.id,
          assignedKamar.asramaId,
          assignedKamar.id,
          'ta-2026',
          dist.kode,
          kelas,
          `${assignedKamar.asramaNama} - ${assignedKamar.namaKamar}`,
          assignedKamar.namaKamar,
          status,
          namaAyah,
          namaIbu,
          namaWali,
          noHpWali,
          `Jl. Pesantren No. ${i % 150 + 1}`,
          asal.kota,
          asal.prov,
          targetHafalan,
          capaianHafalan,
          statusSpp,
          poinPelanggaran,
          `${tahunMasuk}-07-15`,
          tahunMasuk,
          i % 25 === 0 ? 'Alergi dingin ringan' : null,
          'Santri aktif terdaftar',
          now,
          now
        );

        // Penempatan Kamar di santri_kamar & penempatan_kamar
        insertSantriKmr.run(
          `sk-2026-${i}`,
          santriId,
          'ta-2026',
          assignedKamar.id,
          assignedKamar.asramaId,
          '2026-07-15',
          now,
          now
        );

        insertPenempatan.run(
          `penempatan-2026-${i}`,
          santriId,
          assignedKamar.asramaId,
          assignedKamar.id,
          'ta-2026',
          '2026-07-15',
          now,
          now
        );

        // 1. Keanggotaan Utama (Lembaga Reguler: SD, SMP, SMA, SMK, Ngaji, Diniyah)
        insertKeanggotaan.run(
          `kg-main-2026-${i}`,
          santriId,
          'ta-2026',
          dist.id,
          null,
          kelas,
          'aktif',
          'Keanggotaan utama tahun ajaran 2026/2027',
          now,
          now
        );

        insertRiwayat.run(
          `rw-2026-${i}`,
          santriId,
          'ta-2026',
          dist.id,
          dist.kode,
          kelas.split(' ')[0] || kelas,
          kelas,
          status,
          'Tahun ajaran aktif',
          now,
          now
        );

        // 2. Multi-Lembaga Support: Santri SMP/SMA/SMK juga terdaftar di Ngaji & Diniyah
        if (dist.kode === 'SMP' || dist.kode === 'SMA' || dist.kode === 'SMK') {
          // Terdaftar di Madrasah Al-Qur'an (Tahfidz/Ngaji)
          const ngajiClass = ['Jilid 4-5', 'Jilid 6 (Gharib & Tajwid)', 'Tahfidz Juz 1-5', 'Tahfidz Juz 6-15'][i % 4];
          insertKeanggotaan.run(
            `kg-ngaji-2026-${i}`,
            santriId,
            'ta-2026',
            'lmb-ngaji',
            null,
            ngajiClass,
            'aktif',
            'Program Pembelajaran Tartil & Tahfidz Al-Qur\'an Berasrama',
            now,
            now
          );

          // Santri ganjil juga terdaftar di Madrasah Diniyah Takmiliyah
          if (i % 2 === 1) {
            const diniyahClass = ['Awaliyah 1 (Kitab Safinah & Jurumiyyah)', 'Awaliyah 2 (Taqrib & Imrithi)', 'Wustha 1 (Fathul Qorib & Mutammimah)'][i % 3];
            insertKeanggotaan.run(
              `kg-diniyah-2026-${i}`,
              santriId,
              'ta-2026',
              'lmb-diniyah',
              null,
              diniyahClass,
              'aktif',
              'Program Kajian Kitab Kuning Salaf Sore',
              now,
              now
            );
          }
        }

        // Riwayat Tahun Sebelumnya (2025/2026) untuk santri lama
        if (tahunMasuk <= '2024') {
          insertPenempatan.run(
            `penempatan-2025-${i}`,
            santriId,
            assignedKamar.asramaId,
            assignedKamar.id,
            'ta-2025',
            '2025-07-15',
            now,
            now
          );

          insertRiwayat.run(
            `rw-2025-${i}`,
            santriId,
            'ta-2025',
            dist.id,
            dist.kode,
            kelas.split(' ')[0] || kelas,
            kelas,
            'aktif',
            'Riwayat tahun ajaran 2025/2026 (Genap)',
            now,
            now
          );
        }
      }
    }
  });
  santriTx();

  // 9. Seed Dokumen Santri & Staf (Digital R2 storage metadata)
  const insertDokumen = rawDb.prepare(`
    INSERT OR IGNORE INTO dokumen (id, pemilik_tipe, pemilik_id, jenis, file_key, nama_file, ukuran_bytes, mime_type, uploaded_by, catatan, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const docTypes = ['Kartu Keluarga (KK)', 'Akta Kelahiran', 'Ijazah Terakhir', 'KTP Orang Tua / Wali', 'Surat Keterangan Sehat'];
  for (let i = 1; i <= 60; i++) {
    const sId = `santri-${i}`;
    const docT = docTypes[i % docTypes.length];
    insertDokumen.run(
      `doc-st-${i}`,
      'santri',
      sId,
      docT,
      `docs/santri/${sId}/${docT.toLowerCase().replace(/[^a-z0-9]/g, '_')}.pdf`,
      `${docT} - Santri ${i}.pdf`,
      180000 + (i * 1234),
      'application/pdf',
      'usr-1',
      'Berkas administrasi pendaftaran santri baru terverifikasi',
      now,
      now
    );
  }

  // 10. Seed Audit Logs
  const insertAudit = rawDb.prepare(`
    INSERT OR IGNORE INTO audit_logs (id, user_id, action, entity_type, entity_id, details, ip_address, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertAudit.run('aud-1', 'usr-1', 'SYSTEM_BOOT', 'system', 'root', JSON.stringify({ message: 'Inisialisasi SIAKAD Pesantren Engine' }), '127.0.0.1', now);
  insertAudit.run('aud-2', 'usr-1', 'SETUP_TAHUN_AJARAN', 'tahun_ajaran', 'ta-2026', JSON.stringify({ nama: '2026/2027', status: 'AKTIF' }), '127.0.0.1', now);
  insertAudit.run('aud-3', 'usr-1', 'SEED_MASTER_DATA', 'lembaga', 'all', JSON.stringify({ lembagaCount: 6, asramaCount: 7, kamarCount: 70 }), '127.0.0.1', now);

  console.log('✅ Seeding Selesai:');
  console.log('- 6 Master Lembaga & Kelas Terstruktur (Entity Kelas)');
  console.log('- 7 Asrama & 70 Kamar (santri_kamar & penempatan_kamar)');
  console.log('- 45 Staf & Staf Penugasan Akademik');
  console.log('- 7 Scoped RBAC Users & user_scopes table');
  console.log('- 2.000 Santri dengan Multi-Lembaga Support (santri_keanggotaan)');
  console.log('- Berkas Dokumen Santri (dokumen)');
  console.log('- Audit Trail Log (audit_logs)');
  rawDb.pragma('foreign_keys = ON');
}

async function seedNewTablesIfNeeded(rawDb: any, now: string) {
  try {
    const countKelas = rawDb.prepare('SELECT COUNT(*) as c FROM kelas').get() as { c: number };
    if (!countKelas || countKelas.c === 0) {
      console.log('📦 Mengisi Master Kelas & Jurusan baru...');
      const lembagas = rawDb.prepare('SELECT id, kode, tingkat_kelas FROM lembaga').all() as any[];
      const insertKelas = rawDb.prepare(`
        INSERT OR IGNORE INTO kelas (id, lembaga_id, tingkat, nama_kelas, jurusan, kapasitas, wali_kelas_staf_id, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      for (const l of lembagas) {
        let list: string[] = [];
        try { list = JSON.parse(l.tingkat_kelas); } catch (e) {}
        list.forEach((clsName, idx) => {
          const id = `kls-${l.kode.toLowerCase()}-${idx + 1}`;
          let jurusan = null;
          if (clsName.includes('IPA')) jurusan = 'IPA';
          else if (clsName.includes('IPS')) jurusan = 'IPS';
          else if (clsName.includes('TKJ')) jurusan = 'TKJ';
          else if (clsName.includes('RPL')) jurusan = 'RPL';
          else if (clsName.includes('Tahfidz')) jurusan = 'Tahfidz';

          const tingkat = clsName.split(' ')[0] || clsName;
          const candidateStaf = `staf-${(idx % 20) + 1}`;
          const stafExists = rawDb.prepare('SELECT id FROM staf WHERE id = ?').get(candidateStaf);
          insertKelas.run(id, l.id, tingkat, clsName, jurusan, 35, stafExists ? candidateStaf : null, now, now);
        });
      }
    }

    const countKeanggotaan = rawDb.prepare('SELECT COUNT(*) as c FROM santri_keanggotaan').get() as { c: number };
    if (!countKeanggotaan || countKeanggotaan.c === 0) {
      console.log('📦 Mengisi santri_keanggotaan (Multi-Lembaga)...');
      rawDb.exec(`
        INSERT OR IGNORE INTO santri_keanggotaan (id, santri_id, tahun_ajaran_id, lembaga_id, kelas_id, kelas_nama, status, catatan, created_at, updated_at)
        SELECT 'kg-' || id, id, tahun_ajaran_id, lembaga_id, NULL, kelas, 'aktif', 'Keanggotaan lembaga reguler', created_at, updated_at
        FROM santri;
      `);

      // Multi-Lembaga: santri SMP & SMA juga ikut Ngaji Al-Qur'an
      rawDb.exec(`
        INSERT OR IGNORE INTO santri_keanggotaan (id, santri_id, tahun_ajaran_id, lembaga_id, kelas_id, kelas_nama, status, catatan, created_at, updated_at)
        SELECT 'kg-ngaji-' || id, id, tahun_ajaran_id, 'lmb-ngaji', NULL, 'Tahfidz Juz 1-5', 'aktif', 'Program Al-Qur''an & Tahfidz', created_at, updated_at
        FROM santri WHERE jenjang IN ('SMP', 'SMA') LIMIT 800;
      `);
    }

    const countSantriKamar = rawDb.prepare('SELECT COUNT(*) as c FROM santri_kamar').get() as { c: number };
    if (!countSantriKamar || countSantriKamar.c === 0) {
      rawDb.exec(`
        INSERT OR IGNORE INTO santri_kamar (id, santri_id, tahun_ajaran_id, kamar_id, asrama_id, tanggal_mulai, status, created_at, updated_at)
        SELECT id, santri_id, tahun_ajaran_id, kamar_id, asrama_id, tanggal_mulai, status, created_at, created_at
        FROM penempatan_kamar;
      `);
    }

    const countPenugasan = rawDb.prepare('SELECT COUNT(*) as c FROM staf_penugasan').get() as { c: number };
    if (!countPenugasan || countPenugasan.c === 0) {
      const insertPenugasan = rawDb.prepare(`
        INSERT OR IGNORE INTO staf_penugasan (id, staf_id, tahun_ajaran_id, lembaga_id, tugas_mapel, keterangan, created_at, updated_at)
        VALUES (?, ?, 'ta-2026', 'lmb-smp', ?, 'SK Penugasan 2026/2027', ?, ?)
      `);
      for (let i = 1; i <= 25; i++) {
        insertPenugasan.run(`tgs-${i}`, `staf-${i}`, i % 2 === 0 ? 'Guru Fiqih & Hadits' : 'Guru Bahasa Arab & Nahwu', now, now);
      }
    }

    const countDokumen = rawDb.prepare('SELECT COUNT(*) as c FROM dokumen').get() as { c: number };
    if (!countDokumen || countDokumen.c === 0) {
      const insertDokumen = rawDb.prepare(`
        INSERT OR IGNORE INTO dokumen (id, pemilik_tipe, pemilik_id, jenis, file_key, nama_file, ukuran_bytes, mime_type, uploaded_by, catatan, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      const docTypes = ['Kartu Keluarga (KK)', 'Akta Kelahiran', 'Ijazah Terakhir', 'KTP Orang Tua / Wali'];
      for (let i = 1; i <= 40; i++) {
        const sId = `santri-${i}`;
        const docT = docTypes[i % docTypes.length];
        insertDokumen.run(
          `doc-st-${i}`,
          'santri',
          sId,
          docT,
          `docs/santri/${sId}/${docT.toLowerCase().replace(/[^a-z0-9]/g, '_')}.pdf`,
          `${docT} - Santri ${i}.pdf`,
          180000 + (i * 1234),
          'application/pdf',
          'usr-1',
          'Berkas administrasi pendaftaran santri',
          now,
          now
        );
      }
    }

    const countScopes = rawDb.prepare('SELECT COUNT(*) as c FROM user_scopes').get() as { c: number };
    if (!countScopes || countScopes.c === 0) {
      rawDb.exec(`
        INSERT OR IGNORE INTO user_scopes (id, user_id, scope_type, lembaga_id, asrama_id, created_at, updated_at)
        VALUES
          ('sc-1', 'usr-2', 'lembaga', 'lmb-smp', NULL, '${now}', '${now}'),
          ('sc-2', 'usr-3', 'lembaga', 'lmb-sma', NULL, '${now}', '${now}'),
          ('sc-3', 'usr-3', 'lembaga', 'lmb-smk', NULL, '${now}', '${now}'),
          ('sc-4', 'usr-4', 'lembaga', 'lmb-ngaji', NULL, '${now}', '${now}'),
          ('sc-5', 'usr-4', 'lembaga', 'lmb-diniyah', NULL, '${now}', '${now}'),
          ('sc-6', 'usr-5', 'asrama', NULL, 'asr-ptr-1', '${now}', '${now}'),
          ('sc-7', 'usr-6', 'asrama', NULL, 'asr-pti-1', '${now}', '${now}');
      `);
    }

    try {
      const adminUser = rawDb.prepare("SELECT id, password_hash, salt, must_change_password FROM users WHERE username = 'admin'").get() as any;
      if (adminUser) {
        const isOldDefault = await verifyPassword('adminpesantren123', adminUser.password_hash, adminUser.salt);
        if (isOldDefault) {
          const initPass = process.env.SUPERADMIN_INITIAL_PASSWORD || 'PesantrenAdmin2026!';
          const { hash: newHash, salt: newSalt } = await hashPassword(initPass);
          rawDb.prepare("UPDATE users SET password_hash = ?, salt = ?, must_change_password = 1, failed_login_count = 0, locked_until = NULL WHERE username = 'admin'").run(newHash, newSalt);
          console.log('🔄 Super Admin initial password updated to environment initial password.');
        }
      }
    } catch (e) {}
  } catch (err) {
    console.warn('Notice in seedNewTablesIfNeeded:', err);
  }
}
