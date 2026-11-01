/**
 * SIAKAD Pesantren - Data Seeder
 * Seeds Multi-Lembaga, Asrama & Kamar (Putra/Putri), Tahun Ajaran, 2.000 Santri, 45 Staf, and Scoped RBAC Users
 */
import { hashPassword } from './auth.ts';

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
  // Check if already seeded
  const check = rawDb.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='lembaga'").get();
  if (!check) return;

  const countLembaga = rawDb.prepare('SELECT COUNT(*) as c FROM lembaga').get() as { c: number };
  if (countLembaga && countLembaga.c > 0) {
    console.log('Database already has master data. Skipping seed.');
    return;
  }

  console.log('🌱 Menyiapkan Struktur Multi-Lembaga, Asrama & Kamar, serta 2.000 Santri...');
  const now = new Date().toISOString();

  // 1. Seed Tahun Ajaran (Hanya 1 aktif)
  const insertTA = rawDb.prepare(`
    INSERT INTO tahun_ajaran (id, nama, semester, tanggal_mulai, tanggal_selesai, is_active, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  insertTA.run('ta-2026', '2026/2027', 'Ganjil', '2026-07-15', '2026-12-23', 1, now);
  insertTA.run('ta-2025', '2025/2026', 'Genap', '2026-01-05', '2026-06-20', 0, now);
  insertTA.run('ta-2027', '2027/2028', 'Ganjil', '2027-07-15', '2027-12-23', 0, now);

  // 2. Seed Master Lembaga (SD, SMP, SMA, SMK, Ngaji Alquran, Madrasah Diniyah)
  const insertLembaga = rawDb.prepare(`
    INSERT INTO lembaga (id, kode, nama, tingkat_kelas, keterangan, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
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
    insertLembaga.run(l.id, l.kode, l.nama, l.tingkatKelas, l.keterangan, now);
  }

  // 3. Seed 45 Staf & Asatidz
  const insertStaf = rawDb.prepare(`
    INSERT INTO staf (id, nip, nama_lengkap, jenis_kelamin, jabatan, mata_pelajaran_kitab, jenjang_ajar, no_hp, email, status_kepegawaian, alamat, pendidikan_terakhir, tanggal_bergabung, is_active, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)
  `);

  const stafList: any[] = [];
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
    const id = `staf-${i}`;

    insertStaf.run(
      id,
      nip,
      nama,
      jk,
      jabatan,
      i % 2 === 0 ? 'Fiqih & Fathul Qorib' : 'Nahwu & Shorof',
      'Semua Jenjang',
      `0812${String(10000000 + i * 23456).slice(0, 8)}`,
      `ustadz.${depan.toLowerCase()}${i}@pesantren.id`,
      'tetap',
      'Kompleks Pondok Pesantren',
      'S1 Universitas Al-Azhar Kairo',
      '2018-07-01',
      now,
      now
    );
    stafList.push({ id, nama, jk });
  }

  // 4. Seed Asrama (Putra & Putri) & Kamar
  const insertAsrama = rawDb.prepare(`
    INSERT INTO asrama (id, nama, kelompok_gender, kapasitas, musyrif_staf_id, keterangan, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  const insertKamar = rawDb.prepare(`
    INSERT INTO kamar (id, asrama_id, nama_kamar, kapasitas, created_at)
    VALUES (?, ?, ?, ?, ?)
  `);

  const asramaConfigs = [
    // Putra (4 Asrama)
    { id: 'asr-ptr-1', nama: 'Gedung Al-Ghazali (Putra)', gender: 'Putra', kap: 350, musyrif: 'staf-5', ket: 'Asrama Utama Santri Tingkat SMP & SMA' },
    { id: 'asr-ptr-2', nama: 'Gedung Ibnu Sina (Putra)', gender: 'Putra', kap: 300, musyrif: 'staf-6', ket: 'Asrama Santri Tingkat SMK' },
    { id: 'asr-ptr-3', nama: 'Gedung Imam Bukhari (Putra)', gender: 'Putra', kap: 250, musyrif: 'staf-7', ket: 'Asrama Khusus Diniyah Takmiliyah' },
    { id: 'asr-ptr-4', nama: 'Gedung Al-Farabi Tahfidz (Putra)', gender: 'Putra', kap: 150, musyrif: 'staf-8', ket: 'Kompleks Takhassus Tahfidz 30 Juz' },
    
    // Putri (3 Asrama)
    { id: 'asr-pti-1', nama: 'Gedung Maryam (Putri)', gender: 'Putri', kap: 400, musyrif: 'staf-3', ket: 'Asrama Utama Santriwati SMP & SMA' },
    { id: 'asr-pti-2', nama: 'Gedung Khadijah (Putri)', gender: 'Putri', kap: 350, musyrif: 'staf-9', ket: 'Asrama Santriwati SMK & Diniyah' },
    { id: 'asr-pti-3', nama: 'Gedung Aisyah Tahfidz (Putri)', gender: 'Putri', kap: 250, musyrif: 'staf-12', ket: 'Kompleks Takhassus Tahfidz Banat' },
  ];

  const allKamars: { id: string; asramaId: string; asramaNama: string; namaKamar: string; gender: string }[] = [];

  for (const a of asramaConfigs) {
    insertAsrama.run(a.id, a.nama, a.gender, a.kap, a.musyrif, a.ket, now);

    // Buat 10 kamar per asrama (Kamar 101 s/d 110)
    for (let k = 1; k <= 10; k++) {
      const kamarId = `${a.id}-kmr-${k}`;
      const namaKamar = `Kamar ${100 + k}`;
      insertKamar.run(kamarId, a.id, namaKamar, 35, now);
      allKamars.push({
        id: kamarId,
        asramaId: a.id,
        asramaNama: a.nama,
        namaKamar,
        gender: a.gender,
      });
    }
  }

  // 5. Seed Scoped Users
  const defaultPassword = 'adminpesantren123';
  const { hash, salt } = await hashPassword(defaultPassword);

  const insertUser = rawDb.prepare(`
    INSERT INTO users (id, username, password_hash, salt, full_name, role, assigned_lembaga_ids, assigned_asrama_ids, phone, is_active, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)
  `);

  const scopedUsers = [
    {
      id: 'usr-1',
      username: 'admin',
      fullName: 'Ust. H. Ahmad Fauzi (Super Admin)',
      role: 'superadmin',
      assignedLembagaIds: null,
      assignedAsramaIds: null,
      phone: '081234567890',
    },
    {
      id: 'usr-2',
      username: 'admin_smp',
      fullName: 'Ust. Zulfikar, S.Pd.I (Admin Lembaga SMP)',
      role: 'admin_lembaga',
      assignedLembagaIds: JSON.stringify(['lmb-smp']),
      assignedAsramaIds: null,
      phone: '081234567891',
    },
    {
      id: 'usr-3',
      username: 'admin_sma_smk',
      fullName: 'Ust. Hendra Prasetya, M.Pd (Admin Lembaga SMA & SMK)',
      role: 'admin_lembaga',
      assignedLembagaIds: JSON.stringify(['lmb-sma', 'lmb-smk']),
      assignedAsramaIds: null,
      phone: '081234567892',
    },
    {
      id: 'usr-4',
      username: 'admin_ngaji',
      fullName: 'Ust. M. Ridwan, S.H.I (Admin Ngaji & Diniyah)',
      role: 'admin_lembaga',
      assignedLembagaIds: JSON.stringify(['lmb-ngaji', 'lmb-diniyah']),
      assignedAsramaIds: null,
      phone: '081234567893',
    },
    {
      id: 'usr-5',
      username: 'musyrif_putra',
      fullName: 'Ust. Dani Hidayat (Pengurus Seluruh Asrama Putra)',
      role: 'pengurus_asrama',
      assignedLembagaIds: null,
      assignedAsramaIds: JSON.stringify(['asr-ptr-1', 'asr-ptr-2', 'asr-ptr-3', 'asr-ptr-4']),
      phone: '081234567894',
    },
    {
      id: 'usr-6',
      username: 'musyrifah_putri',
      fullName: 'Ustzh. Fatimah Azzahra (Pengurus Seluruh Asrama Putri)',
      role: 'pengurus_asrama',
      assignedLembagaIds: null,
      assignedAsramaIds: JSON.stringify(['asr-pti-1', 'asr-pti-2', 'asr-pti-3']),
      phone: '081234567895',
    },
    {
      id: 'usr-7',
      username: 'viewer_smp',
      fullName: 'Hj. Siti Romlah, S.E. (Viewer Data SMP)',
      role: 'viewer',
      assignedLembagaIds: JSON.stringify(['lmb-smp']),
      assignedAsramaIds: null,
      phone: '081234567896',
    },
  ];

  for (const u of scopedUsers) {
    insertUser.run(
      u.id,
      u.username,
      hash,
      salt,
      u.fullName,
      u.role,
      u.assignedLembagaIds,
      u.assignedAsramaIds,
      u.phone,
      now,
      now
    );
  }

  // 6. Seed 2.000 Santri with proper Lembaga, Asrama & Kamar
  const insertSantri = rawDb.prepare(`
    INSERT INTO santri (
      id, nis, nisn, nik, nama_lengkap, nama_panggilan, jenis_kelamin,
      tempat_lahir, tanggal_lahir,
      lembaga_id, asrama_id, kamar_id, tahun_ajaran_id,
      jenjang, kelas, asrama, kamar_label,
      status, nama_ayah, nama_ibu, no_hp_wali,
      alamat_asal, kota_asal, provinsi_asal,
      target_juz_hafalan, capaian_juz_hafalan, status_spp, poin_pelanggaran,
      tahun_masuk, catatan_kesehatan, created_at, updated_at
    ) VALUES (
      ?, ?, ?, ?, ?, ?, ?,
      ?, ?,
      ?, ?, ?, ?,
      ?, ?, ?, ?,
      ?, ?, ?, ?,
      ?, ?, ?,
      ?, ?, ?, ?,
      ?, ?, ?, ?
    )
  `);

  const insertPenempatan = rawDb.prepare(`
    INSERT INTO penempatan_kamar (id, santri_id, asrama_id, kamar_id, tahun_ajaran_id, tanggal_mulai, status, created_at)
    VALUES (?, ?, ?, ?, ?, ?, 'aktif', ?)
  `);

  const insertRiwayat = rawDb.prepare(`
    INSERT INTO riwayat_akademik (id, santri_id, tahun_ajaran_id, lembaga_id, jenjang, tingkat_kelas, kelas, status, catatan, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const kamarsPutra = allKamars.filter((k) => k.gender === 'Putra');
  const kamarsPutri = allKamars.filter((k) => k.gender === 'Putri');

  // Distribution among lembaga:
  // SMP: 500 santri, SMA: 450 santri, SMK: 350 santri, Ngaji: 350 santri, Diniyah: 250 santri, SD: 100 santri = 2.000
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
        const isL = i % 2 === 1; // 50% Putra, 50% Putri
        const jk = isL ? 'L' : 'P';
        const depan = isL
          ? NAMA_DEPAN_L[(i + Math.floor(i / 13)) % NAMA_DEPAN_L.length]
          : NAMA_DEPAN_P[(i + Math.floor(i / 11)) % NAMA_DEPAN_P.length];
        const belakang1 = NAMA_BELAKANG[(i * 2) % NAMA_BELAKANG.length];
        const belakang2 = NAMA_BELAKANG[(i * 5 + 3) % NAMA_BELAKANG.length];
        const namaLengkap = `${depan} ${belakang1} ${belakang2}`;
        const namaPanggilan = depan;

        // Choose class from this Lembaga
        const kelas = dist.classes[j % dist.classes.length];

        // Choose Kamar matching gender
        const kamarPool = isL ? kamarsPutra : kamarsPutri;
        const assignedKamar = kamarPool[i % kamarPool.length];

        const asal = KOTA_ASAL[i % KOTA_ASAL.length];
        const nis = `24${String(i).padStart(5, '0')}`;
        const nisn = `00${String(10000000 + i)}`;
        const nik = `35${String(10000000000000 + i * 29).substring(0, 14)}`;

        const status = i <= 1860 ? 'aktif' : (i <= 1940 ? 'izin_pulang' : (i <= 1970 ? 'alpa' : (i <= 1985 ? 'skorsing' : 'lulus')));
        const statusSpp = i % 14 === 0 ? 'tunggakan_3_bulan_plus' : (i % 8 === 0 ? 'tunggakan_2_bulan' : (i % 4 === 0 ? 'tunggakan_1_bulan' : 'lunas'));

        const targetHafalan = dist.kode.includes('Ngaji') ? 30 : 15;
        const capaianHafalan = Number((Math.min(targetHafalan, ((i % 40) * 0.75 + (dist.kode.includes('Ngaji') ? 8 : 1))).toFixed(1)));
        const poinPelanggaran = i % 17 === 0 ? 35 : (i % 9 === 0 ? 15 : (i % 5 === 0 ? 5 : 0));

        const tahunMasuk = ['2022', '2023', '2024', '2025'][i % 4];
        const namaAyah = `H. ${NAMA_DEPAN_L[(i * 3) % NAMA_DEPAN_L.length]} ${NAMA_BELAKANG[(i + 4) % NAMA_BELAKANG.length]}`;
        const namaIbu = `Hj. ${NAMA_DEPAN_P[(i * 4) % NAMA_DEPAN_P.length]} ${NAMA_BELAKANG[(i + 6) % NAMA_BELAKANG.length]}`;
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
          noHpWali,
          `Jl. Pesantren No. ${i % 150 + 1}`,
          asal.kota,
          asal.prov,
          targetHafalan,
          capaianHafalan,
          statusSpp,
          poinPelanggaran,
          tahunMasuk,
          i % 25 === 0 ? 'Alergi dingin ringan' : null,
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
          now
        );

        // Riwayat Akademik Tahun Aktif 2026/2027
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
          now
        );

        // Untuk santri yang masuk sebelum 2026, berikan riwayat di Tahun Ajaran Sebelumnya 2025/2026
        if (tahunMasuk <= '2024') {
          insertPenempatan.run(
            `penempatan-2025-${i}`,
            santriId,
            assignedKamar.asramaId,
            assignedKamar.id,
            'ta-2025',
            '2025-07-15',
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
            now
          );
        }
      }
    }
  });
  santriTx();

  console.log('✅ Seeding Selesai:');
  console.log('- 6 Master Lembaga (SD, SMP, SMA, SMK, Ngaji Alquran, Diniyah)');
  console.log('- 7 Asrama (4 Putra, 3 Putri) & 70 Kamar');
  console.log('- 7 User Scoped RBAC (Superadmin, Admin Lembaga, Pengurus Asrama, Viewer)');
  console.log('- 2.000 Santri terdistribusi dengan aman');
}
