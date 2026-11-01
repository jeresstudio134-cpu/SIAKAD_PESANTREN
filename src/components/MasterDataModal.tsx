import React from 'react';
import { 
  X, 
  Building2, 
  Home, 
  Calendar, 
  Plus, 
  Check, 
  Edit3, 
  Trash2, 
  Users, 
  DoorClosed,
  Layers,
  CheckCircle2,
  GraduationCap
} from 'lucide-react';
import type { Lembaga, Asrama, Kamar, TahunAjaran, Staf, Kelas } from '../types/index.ts';
import { authFetch } from '../utils/api.ts';

interface MasterDataModalProps {
  onClose: () => void;
  onRefreshParent: () => void;
  onOpenNaikKelas?: () => void;
}

export const MasterDataModal: React.FC<MasterDataModalProps> = ({
  onClose,
  onRefreshParent,
  onOpenNaikKelas,
}) => {
  const [activeTab, setActiveTab] = React.useState<'lembaga' | 'kelas' | 'asrama' | 'tahun_ajaran'>('lembaga');
  const [loading, setLoading] = React.useState(true);

  const [lembagas, setLembagas] = React.useState<Lembaga[]>([]);
  const [kelasList, setKelasList] = React.useState<Kelas[]>([]);
  const [asramas, setAsramas] = React.useState<Asrama[]>([]);
  const [kamars, setKamars] = React.useState<Kamar[]>([]);
  const [tahunAjarans, setTahunAjarans] = React.useState<TahunAjaran[]>([]);
  const [stafList, setStafList] = React.useState<Staf[]>([]);

  // Selected asrama for viewing its rooms
  const [selectedAsramaId, setSelectedAsramaId] = React.useState<string | null>(null);

  // Selected lembaga filter for Kelas tab
  const [selectedLembagaFilterForKelas, setSelectedLembagaFilterForKelas] = React.useState('semua');

  // Form modals state
  const [showAddLembaga, setShowAddLembaga] = React.useState(false);
  const [lembagaForm, setLembagaForm] = React.useState({
    kode: '',
    nama: '',
    tingkatKelasStr: '',
    keterangan: '',
  });

  const [showAddKelas, setShowAddKelas] = React.useState(false);
  const [kelasForm, setKelasForm] = React.useState({
    lembagaId: '',
    tingkat: 7,
    namaKelas: '',
    jurusan: '',
    kapasitas: 32,
    waliKelasStafId: '',
  });

  const [showAddAsrama, setShowAddAsrama] = React.useState(false);
  const [asramaForm, setAsramaForm] = React.useState({
    nama: '',
    kelompokGender: 'Putra' as 'Putra' | 'Putri',
    kapasitas: 100,
    musyrifStafId: '',
    keterangan: '',
  });

  const [showAddKamar, setShowAddKamar] = React.useState(false);
  const [kamarForm, setKamarForm] = React.useState({
    asramaId: '',
    namaKamar: '',
    kapasitas: 10,
  });

  const [showAddTA, setShowAddTA] = React.useState(false);
  const [taForm, setTaForm] = React.useState({
    nama: '2027/2028',
    semester: 'Ganjil' as 'Ganjil' | 'Genap',
    tanggalMulai: '',
    tanggalSelesai: '',
    isActive: false,
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [lRes, cRes, aRes, kRes, taRes, sRes] = await Promise.all([
        authFetch('/api/master/lembaga'),
        authFetch('/api/master/kelas'),
        authFetch('/api/master/asrama'),
        authFetch('/api/master/kamar'),
        authFetch('/api/master/tahun-ajaran'),
        authFetch('/api/staf'),
      ]);

      const [lData, cData, aData, kData, taData, sData] = await Promise.all([
        lRes.json(),
        cRes.json(),
        aRes.json(),
        kRes.json(),
        taRes.json(),
        sRes.json(),
      ]);

      setLembagas(lData.data || []);
      setKelasList(cData.data || []);
      setAsramas(aData.data || []);
      setKamars(kData.data || []);
      setTahunAjarans(taData.data || []);
      setStafList(sData.data || []);

      if (aData.data && aData.data.length > 0 && !selectedAsramaId) {
        setSelectedAsramaId(aData.data[0].id);
      }
      if (lData.data && lData.data.length > 0 && !kelasForm.lembagaId) {
        setKelasForm((prev) => ({ ...prev, lembagaId: lData.data[0].id }));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchData();
  }, []);

  // Handlers
  const handleSaveLembaga = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lembagaForm.kode || !lembagaForm.nama) return;

    const classes = lembagaForm.tingkatKelasStr
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    await authFetch('/api/master/lembaga', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        kode: lembagaForm.kode,
        nama: lembagaForm.nama,
        tingkatKelas: classes,
        keterangan: lembagaForm.keterangan,
      }),
    });

    setShowAddLembaga(false);
    setLembagaForm({ kode: '', nama: '', tingkatKelasStr: '', keterangan: '' });
    fetchData();
    onRefreshParent();
  };

  const handleSaveKelas = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!kelasForm.lembagaId || !kelasForm.namaKelas) {
      alert('Pilih Lembaga dan isi Nama Kelas.');
      return;
    }

    try {
      await authFetch('/api/master/kelas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(kelasForm),
      });

      setShowAddKelas(false);
      setKelasForm({
        lembagaId: lembagas[0]?.id || '',
        tingkat: 7,
        namaKelas: '',
        jurusan: '',
        kapasitas: 32,
        waliKelasStafId: '',
      });
      fetchData();
      onRefreshParent();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteKelas = async (id: string, namaKelas: string) => {
    if (!confirm(`Hapus rombel/kelas "${namaKelas}"?`)) return;
    try {
      await authFetch(`/api/master/kelas/${id}`, { method: 'DELETE' });
      fetchData();
      onRefreshParent();
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveAsrama = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!asramaForm.nama) return;

    await authFetch('/api/master/asrama', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(asramaForm),
    });

    setShowAddAsrama(false);
    setAsramaForm({ nama: '', kelompokGender: 'Putra', kapasitas: 100, musyrifStafId: '', keterangan: '' });
    fetchData();
    onRefreshParent();
  };

  const handleSaveKamar = async (e: React.FormEvent) => {
    e.preventDefault();
    const asrId = kamarForm.asramaId || selectedAsramaId;
    if (!asrId || !kamarForm.namaKamar) return;

    await authFetch('/api/master/kamar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        asramaId: asrId,
        namaKamar: kamarForm.namaKamar,
        kapasitas: kamarForm.kapasitas,
      }),
    });

    setShowAddKamar(false);
    setKamarForm({ asramaId: '', namaKamar: '', kapasitas: 10 });
    fetchData();
    onRefreshParent();
  };

  const handleSaveTA = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taForm.nama) return;

    await authFetch('/api/master/tahun-ajaran', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(taForm),
    });

    setShowAddTA(false);
    setTaForm({
      nama: '',
      semester: 'Ganjil',
      tanggalMulai: '',
      tanggalSelesai: '',
      isActive: false,
    });
    fetchData();
    onRefreshParent();
  };

  const handleActivateTA = async (id: string, name: string) => {
    if (!window.confirm(`Jadikan ${name} sebagai Tahun Ajaran AKTIF saat ini? Sistem hanya mengizinkan 1 tahun ajaran aktif.`)) return;

    try {
      const res = await authFetch(`/api/master/tahun-ajaran/${id}/activate`, {
        method: 'POST',
      });
      const json = await res.json();
      if (!res.ok) {
        alert(json.error || 'Gagal mengaktifkan tahun ajaran');
        return;
      }
      alert(json.message || 'Tahun ajaran berhasil diaktifkan');
      fetchData();
      onRefreshParent();
    } catch (e: any) {
      alert(e.message || 'Error');
    }
  };

  const filteredKamars = selectedAsramaId
    ? kamars.filter((k) => k.asramaId === selectedAsramaId)
    : kamars;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 w-full max-w-4xl rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Master Data Lembaga, Asrama & Tahun Ajaran
              </h2>
              <p className="text-[11px] text-slate-500">
                Konfigurasi entitas dan struktur organisasi pesantren (Super Admin).
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 px-5 bg-white dark:bg-slate-900 gap-5 text-xs font-semibold overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveTab('lembaga')}
            className={`py-3 border-b-2 whitespace-nowrap transition-colors flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'lembaga'
                ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>Master Lembaga ({lembagas.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('kelas')}
            className={`py-3 border-b-2 whitespace-nowrap transition-colors flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'kelas'
                ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <GraduationCap className="w-4 h-4" />
            <span>Master Kelas ({kelasList.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('asrama')}
            className={`py-3 border-b-2 whitespace-nowrap transition-colors flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'asrama'
                ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Home className="w-4 h-4" />
            <span>Asrama & Kamar ({asramas.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('tahun_ajaran')}
            className={`py-3 border-b-2 whitespace-nowrap transition-colors flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'tahun_ajaran'
                ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>Tahun Ajaran</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-5 text-xs text-slate-700 dark:text-slate-300">
          
          {/* TAB 1: LEMBAGA */}
          {activeTab === 'lembaga' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-sm">Daftar Lembaga Pendidikan</h3>
                  <p className="text-slate-500 text-[11px]">Tiap lembaga memiliki jenjang dan tingkat kelas mandiri.</p>
                </div>
                <button
                  onClick={() => setShowAddLembaga(!showAddLembaga)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Tambah Lembaga</span>
                </button>
              </div>

              {/* Form Tambah Lembaga */}
              {showAddLembaga && (
                <form onSubmit={handleSaveLembaga} className="p-4 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-xl space-y-3 animate-in fade-in">
                  <h4 className="font-bold text-emerald-900 dark:text-emerald-300">Tambah Unit Lembaga Baru</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[11px] font-medium mb-1">Kode Singkat (SD/SMP/SMA/SMK/dll)*:</label>
                      <input
                        type="text"
                        required
                        placeholder="Contoh: MA"
                        value={lembagaForm.kode}
                        onChange={(e) => setLembagaForm({ ...lembagaForm, kode: e.target.value })}
                        className="w-full px-2.5 py-1.5 border rounded-lg bg-white dark:bg-slate-800 uppercase"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-[11px] font-medium mb-1">Nama Lengkap Lembaga*:</label>
                      <input
                        type="text"
                        required
                        placeholder="Contoh: Madrasah Aliyah Al-Barokah"
                        value={lembagaForm.nama}
                        onChange={(e) => setLembagaForm({ ...lembagaForm, nama: e.target.value })}
                        className="w-full px-2.5 py-1.5 border rounded-lg bg-white dark:bg-slate-800"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium mb-1">
                      Tingkat Kelas / Rombel / Jurusan (Pisahkan dengan tanda koma)*:
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Contoh: X-IPA 1, X-IPA 2, X-IPS 1, XI-IPA 1, XII-IPA 1"
                      value={lembagaForm.tingkatKelasStr}
                      onChange={(e) => setLembagaForm({ ...lembagaForm, tingkatKelasStr: e.target.value })}
                      className="w-full px-2.5 py-1.5 border rounded-lg bg-white dark:bg-slate-800"
                    />
                    <span className="text-[10px] text-slate-500 mt-0.5 block">
                      Untuk Diniyah bisa diisi kitab/tingkat; untuk Ngaji diisi jilid/kelompok.
                    </span>
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium mb-1">Keterangan / Deskripsi:</label>
                    <input
                      type="text"
                      placeholder="Deskripsi singkat kurikulum atau sistem pembelajaran"
                      value={lembagaForm.keterangan}
                      onChange={(e) => setLembagaForm({ ...lembagaForm, keterangan: e.target.value })}
                      className="w-full px-2.5 py-1.5 border rounded-lg bg-white dark:bg-slate-800"
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setShowAddLembaga(false)}
                      className="px-3 py-1.5 text-slate-600"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      className="px-3 py-1.5 bg-emerald-600 text-white font-semibold rounded-lg"
                    >
                      Simpan Lembaga
                    </button>
                  </div>
                </form>
              )}

              {/* List Lembaga Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {lembagas.map((l) => (
                  <div key={l.id} className="p-4 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-xl space-y-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-bold text-[10px]">
                          {l.kode}
                        </span>
                        <h4 className="font-bold text-slate-900 dark:text-white text-xs mt-1">
                          {l.nama}
                        </h4>
                      </div>
                      <span className="font-mono font-bold text-emerald-600 text-xs tabular-nums">
                        {l.totalSantri || 0} Santri
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-500 italic">
                      {l.keterangan || 'Tidak ada keterangan'}
                    </p>

                    <div className="pt-2 border-t border-slate-200 dark:border-slate-700/60">
                      <span className="text-[10px] font-semibold text-slate-400 block mb-1">
                        Tingkat / Rombel ({l.tingkatKelas.length}):
                      </span>
                      <div className="flex flex-wrap gap-1">
                        {l.tingkatKelas.map((cls, idx) => (
                          <span
                            key={idx}
                            className="px-1.5 py-0.5 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded text-[10px] text-slate-700 dark:text-slate-300"
                          >
                            {cls}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB: MASTER KELAS & JURUSAN */}
          {activeTab === 'kelas' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-sm">Master Rombongan Belajar (Kelas) & Jurusan</h3>
                  <p className="text-slate-500 text-[11px]">
                    Struktur kelas resmi untuk penempatan santri, riwayat kenaikan kelas, dan penugasan wali kelas.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <select
                    value={selectedLembagaFilterForKelas}
                    onChange={(e) => setSelectedLembagaFilterForKelas(e.target.value)}
                    className="px-2.5 py-1.5 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-xs text-slate-700 dark:text-slate-200"
                  >
                    <option value="semua">Semua Lembaga ({kelasList.length})</option>
                    {lembagas.map((l) => (
                      <option key={l.id} value={l.id}>{l.nama} ({l.kode})</option>
                    ))}
                  </select>
                  <button
                    onClick={() => setShowAddKelas(!showAddKelas)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold text-xs cursor-pointer shadow-xs shrink-0"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Tambah Kelas</span>
                  </button>
                </div>
              </div>

              {/* Form Tambah Kelas */}
              {showAddKelas && (
                <form onSubmit={handleSaveKelas} className="p-4 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-xl space-y-3 animate-in fade-in">
                  <h4 className="font-bold text-emerald-900 dark:text-emerald-300">Tambah Rombel / Kelas Baru</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[11px] font-medium mb-1">Lembaga Pendidkan*:</label>
                      <select
                        required
                        value={kelasForm.lembagaId}
                        onChange={(e) => setKelasForm({ ...kelasForm, lembagaId: e.target.value })}
                        className="w-full px-2.5 py-1.5 border rounded-lg bg-white dark:bg-slate-800 text-xs"
                      >
                        {lembagas.map((l) => (
                          <option key={l.id} value={l.id}>{l.nama} ({l.kode})</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-medium mb-1">Tingkat Kelas (Angka 1-12)*:</label>
                      <input
                        type="number"
                        required
                        min="1"
                        max="12"
                        value={kelasForm.tingkat}
                        onChange={(e) => setKelasForm({ ...kelasForm, tingkat: Number(e.target.value) })}
                        className="w-full px-2.5 py-1.5 border rounded-lg bg-white dark:bg-slate-800 text-xs"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-medium mb-1">Nama / Rombel Kelas*:</label>
                      <input
                        type="text"
                        required
                        placeholder="Contoh: 7-A, 10-IPA-1, Jilid 3"
                        value={kelasForm.namaKelas}
                        onChange={(e) => setKelasForm({ ...kelasForm, namaKelas: e.target.value })}
                        className="w-full px-2.5 py-1.5 border rounded-lg bg-white dark:bg-slate-800 text-xs"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[11px] font-medium mb-1">Jurusan / Peminatan (Opsional):</label>
                      <input
                        type="text"
                        placeholder="Contoh: MIPA, IPS, Keagamaan, Tahfidz"
                        value={kelasForm.jurusan}
                        onChange={(e) => setKelasForm({ ...kelasForm, jurusan: e.target.value })}
                        className="w-full px-2.5 py-1.5 border rounded-lg bg-white dark:bg-slate-800 text-xs"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-medium mb-1">Kapasitas Maksimum (Santri):</label>
                      <input
                        type="number"
                        min="1"
                        value={kelasForm.kapasitas}
                        onChange={(e) => setKelasForm({ ...kelasForm, kapasitas: Number(e.target.value) })}
                        className="w-full px-2.5 py-1.5 border rounded-lg bg-white dark:bg-slate-800 text-xs"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-medium mb-1">Wali Kelas (Staf / Guru):</label>
                      <select
                        value={kelasForm.waliKelasStafId}
                        onChange={(e) => setKelasForm({ ...kelasForm, waliKelasStafId: e.target.value })}
                        className="w-full px-2.5 py-1.5 border rounded-lg bg-white dark:bg-slate-800 text-xs"
                      >
                        <option value="">-- Belum Ditentukan --</option>
                        {stafList.map((st) => (
                          <option key={st.id} value={st.id}>{st.namaLengkap} ({st.jabatan})</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setShowAddKelas(false)}
                      className="px-3 py-1.5 text-slate-600 dark:text-slate-300 text-xs cursor-pointer"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-xs cursor-pointer"
                    >
                      Simpan Kelas
                    </button>
                  </div>
                </form>
              )}

              {/* Grid Kelas */}
              {(() => {
                const filtered = kelasList.filter((k) =>
                  selectedLembagaFilterForKelas === 'semua'
                    ? true
                    : k.lembagaId === selectedLembagaFilterForKelas
                );

                if (filtered.length === 0) {
                  return (
                    <div className="p-8 text-center text-slate-400 bg-slate-50 dark:bg-slate-800/30 rounded-xl border border-dashed border-slate-200 dark:border-slate-800">
                      <GraduationCap className="w-8 h-8 mx-auto mb-2 text-slate-300 dark:text-slate-600" />
                      Belum ada rombel kelas yang terdaftar untuk lembaga ini.
                    </div>
                  );
                }

                return (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {filtered.map((k) => (
                      <div
                        key={k.id}
                        className="p-3.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xs space-y-2 hover:border-emerald-500/50 transition-colors"
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-bold text-[10px]">
                                Tingkat {k.tingkat}
                              </span>
                              {k.jurusan && (
                                <span className="px-1.5 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-medium text-[10px]">
                                  {k.jurusan}
                                </span>
                              )}
                            </div>
                            <h4 className="font-bold text-slate-900 dark:text-white text-sm mt-1">
                              Kelas {k.namaKelas}
                            </h4>
                          </div>

                          <button
                            onClick={() => handleDeleteKelas(k.id, k.namaKelas)}
                            className="p-1 text-slate-400 hover:text-rose-600 rounded cursor-pointer"
                            title="Hapus Kelas"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <div className="text-[11px] text-slate-500 flex items-center justify-between pt-1 border-t border-slate-100 dark:border-slate-700/60">
                          <span>{k.lembagaNama || 'Lembaga'}</span>
                          <span className="font-mono font-medium">{k.kapasitas || 32} Kursi</span>
                        </div>

                        <div className="text-[11px] text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                          <Users className="w-3 h-3 text-slate-400" />
                          <span className="truncate">
                            Wali: <strong>{k.waliKelasNama || 'Belum ada wali kelas'}</strong>
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>
          )}

          {/* TAB 2: ASRAMA & KAMAR */}
          {activeTab === 'asrama' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-sm">Struktur Asrama & Kamar Santri</h3>
                  <p className="text-slate-500 text-[11px]">Dikelompokkan menjadi Asrama Putra & Putri. 1 santri menempati 1 kamar per tahun ajaran.</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowAddKamar(!showAddKamar)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg font-semibold"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Tambah Kamar</span>
                  </button>
                  <button
                    onClick={() => setShowAddAsrama(!showAddAsrama)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Tambah Asrama</span>
                  </button>
                </div>
              </div>

              {/* Form Tambah Asrama */}
              {showAddAsrama && (
                <form onSubmit={handleSaveAsrama} className="p-4 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-xl space-y-3 animate-in fade-in">
                  <h4 className="font-bold text-emerald-900 dark:text-emerald-300">Tambah Gedung Asrama</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[11px] font-medium mb-1">Nama Gedung Asrama*:</label>
                      <input
                        type="text"
                        required
                        placeholder="Contoh: Gedung Al-Farabi"
                        value={asramaForm.nama}
                        onChange={(e) => setAsramaForm({ ...asramaForm, nama: e.target.value })}
                        className="w-full px-2.5 py-1.5 border rounded-lg bg-white dark:bg-slate-800"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium mb-1">Kelompok Gender*:</label>
                      <select
                        value={asramaForm.kelompokGender}
                        onChange={(e) => setAsramaForm({ ...asramaForm, kelompokGender: e.target.value as any })}
                        className="w-full px-2.5 py-1.5 border rounded-lg bg-white dark:bg-slate-800 font-semibold"
                      >
                        <option value="Putra">Putra (Banin)</option>
                        <option value="Putri">Putri (Banat)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium mb-1">Kapasitas Maksimal (Santri):</label>
                      <input
                        type="number"
                        value={asramaForm.kapasitas}
                        onChange={(e) => setAsramaForm({ ...asramaForm, kapasitas: Number(e.target.value) })}
                        className="w-full px-2.5 py-1.5 border rounded-lg bg-white dark:bg-slate-800"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium mb-1">Pengasuh / Musyrif Asrama (Relasi Staf):</label>
                    <select
                      value={asramaForm.musyrifStafId}
                      onChange={(e) => setAsramaForm({ ...asramaForm, musyrifStafId: e.target.value })}
                      className="w-full px-2.5 py-1.5 border rounded-lg bg-white dark:bg-slate-800"
                    >
                      <option value="">Pilih Musyrif / Pembina</option>
                      {stafList.map((st) => (
                        <option key={st.id} value={st.id}>{st.namaLengkap} ({st.jabatan})</option>
                      ))}
                    </select>
                  </div>

                  <div className="flex justify-end gap-2 pt-1">
                    <button type="button" onClick={() => setShowAddAsrama(false)} className="px-3 py-1.5 text-slate-600">Batal</button>
                    <button type="submit" className="px-3 py-1.5 bg-emerald-600 text-white font-semibold rounded-lg">Simpan Asrama</button>
                  </div>
                </form>
              )}

              {/* Form Tambah Kamar */}
              {showAddKamar && (
                <form onSubmit={handleSaveKamar} className="p-4 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-xl space-y-3 animate-in fade-in">
                  <h4 className="font-bold text-blue-900 dark:text-blue-300">Tambah Kamar Asrama</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[11px] font-medium mb-1">Pilih Asrama Induk*:</label>
                      <select
                        value={kamarForm.asramaId || selectedAsramaId || ''}
                        onChange={(e) => setKamarForm({ ...kamarForm, asramaId: e.target.value })}
                        className="w-full px-2.5 py-1.5 border rounded-lg bg-white dark:bg-slate-800"
                      >
                        {asramas.map((a) => (
                          <option key={a.id} value={a.id}>{a.nama} ({a.kelompokGender})</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium mb-1">Nomor / Nama Kamar*:</label>
                      <input
                        type="text"
                        required
                        placeholder="Contoh: Kamar 105"
                        value={kamarForm.namaKamar}
                        onChange={(e) => setKamarForm({ ...kamarForm, namaKamar: e.target.value })}
                        className="w-full px-2.5 py-1.5 border rounded-lg bg-white dark:bg-slate-800"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium mb-1">Daya Tampung / Kapasitas:</label>
                      <input
                        type="number"
                        value={kamarForm.kapasitas}
                        onChange={(e) => setKamarForm({ ...kamarForm, kapasitas: Number(e.target.value) })}
                        className="w-full px-2.5 py-1.5 border rounded-lg bg-white dark:bg-slate-800"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 pt-1">
                    <button type="button" onClick={() => setShowAddKamar(false)} className="px-3 py-1.5 text-slate-600">Batal</button>
                    <button type="submit" className="px-3 py-1.5 bg-blue-600 text-white font-semibold rounded-lg">Simpan Kamar</button>
                  </div>
                </form>
              )}

              {/* Master-Detail Split: Left Asrama List, Right Kamar List */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                
                {/* Left: Asrama List */}
                <div className="space-y-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                    Pilih Gedung Asrama:
                  </span>
                  {asramas.map((a) => {
                    const isSelected = selectedAsramaId === a.id;
                    const isPutra = a.kelompokGender === 'Putra';
                    return (
                      <button
                        key={a.id}
                        onClick={() => setSelectedAsramaId(a.id)}
                        className={`w-full text-left p-3 rounded-xl border transition-all ${
                          isSelected
                            ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 shadow-xs'
                            : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            isPutra ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300' : 'bg-pink-100 text-pink-800 dark:bg-pink-950 dark:text-pink-300'
                          }`}>
                            {a.kelompokGender}
                          </span>
                          <span className="font-mono text-[11px] text-slate-500">
                            {a.totalSantri || 0} / {a.kapasitas} Santri
                          </span>
                        </div>
                        <h4 className="font-bold text-slate-900 dark:text-white text-xs mt-1">
                          {a.nama}
                        </h4>
                        <div className="text-[11px] text-slate-500 mt-1">
                          Musyrif: {a.musyrifNama || 'Belum ditugaskan'}
                        </div>
                        <div className="text-[10px] text-emerald-600 font-semibold mt-1">
                          {a.kamarCount || 0} Kamar Tersedia
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Right: Kamar in Selected Asrama */}
                <div className="md:col-span-2 p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-800">
                  <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-200 dark:border-slate-700/80">
                    <div>
                      <h4 className="font-bold text-slate-900 dark:text-white text-xs">
                        Daftar Kamar ({filteredKamars.length} Kamar)
                      </h4>
                      <p className="text-[11px] text-slate-500">
                        Penghuni aktif dihitung per tahun ajaran berjalan.
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                    {filteredKamars.map((kmr) => {
                      const pct = Math.round(((kmr.terisiCount || 0) / kmr.kapasitas) * 100);
                      const isFull = (kmr.terisiCount || 0) >= kmr.kapasitas;
                      return (
                        <div key={kmr.id} className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl">
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-bold text-slate-900 dark:text-white text-xs">
                              {kmr.namaKamar}
                            </span>
                            <DoorClosed className="w-3.5 h-3.5 text-slate-400" />
                          </div>

                          <div className="flex items-center justify-between text-[11px] text-slate-500 mt-2">
                            <span>Terisi:</span>
                            <span className="font-mono font-bold text-slate-800 dark:text-slate-200 tabular-nums">
                              {kmr.terisiCount || 0} / {kmr.kapasitas}
                            </span>
                          </div>

                          <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden mt-1.5">
                            <div
                              className={`h-full rounded-full ${isFull ? 'bg-rose-500' : 'bg-emerald-600'}`}
                              style={{ width: `${Math.min(100, pct)}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* TAB 3: TAHUN AJARAN */}
          {activeTab === 'tahun_ajaran' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-sm">Tahun Ajaran Akademik</h3>
                  <p className="text-slate-500 text-[11px]">Penempatan santri di kelas dan kamar dicatat per tahun ajaran.</p>
                </div>
                <button
                  onClick={() => setShowAddTA(!showAddTA)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Tambah Tahun Ajaran</span>
                </button>
              </div>

              {/* Shortcut Banner to Naik Kelas Massal */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800 rounded-xl">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center shrink-0">
                    <GraduationCap className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 dark:text-white text-xs">Fitur Kenaikan Kelas & Kelulusan Massal</h4>
                    <p className="text-[11px] text-slate-500">Otomatisasi kenaikan tingkat santri ke tahun ajaran baru tanpa menimpa data lama.</p>
                  </div>
                </div>
                {onOpenNaikKelas && (
                  <button
                    onClick={() => {
                      onClose();
                      onOpenNaikKelas();
                    }}
                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold shadow-xs whitespace-nowrap inline-flex items-center gap-1.5 self-start sm:self-auto"
                  >
                    <GraduationCap className="w-3.5 h-3.5" />
                    <span>Buka Kenaikan Kelas</span>
                  </button>
                )}
              </div>

              {showAddTA && (
                <form onSubmit={handleSaveTA} className="p-4 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-xl space-y-3 animate-in fade-in">
                  <h4 className="font-bold text-emerald-900 dark:text-emerald-300">Buat Periode Tahun Ajaran Baru</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-medium mb-1">Format Tahun Ajaran*:</label>
                      <input
                        type="text"
                        required
                        placeholder="Contoh: 2027/2028"
                        value={taForm.nama}
                        onChange={(e) => setTaForm({ ...taForm, nama: e.target.value })}
                        className="w-full px-2.5 py-1.5 border rounded-lg bg-white dark:bg-slate-800"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium mb-1">Semester:</label>
                      <select
                        value={taForm.semester}
                        onChange={(e) => setTaForm({ ...taForm, semester: e.target.value as any })}
                        className="w-full px-2.5 py-1.5 border rounded-lg bg-white dark:bg-slate-800 font-semibold"
                      >
                        <option value="Ganjil">Semester Ganjil</option>
                        <option value="Genap">Semester Genap</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-medium mb-1">Tanggal Mulai:</label>
                      <input
                        type="date"
                        value={taForm.tanggalMulai}
                        onChange={(e) => setTaForm({ ...taForm, tanggalMulai: e.target.value })}
                        className="w-full px-2.5 py-1.5 border rounded-lg bg-white dark:bg-slate-800"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium mb-1">Tanggal Selesai:</label>
                      <input
                        type="date"
                        value={taForm.tanggalSelesai}
                        onChange={(e) => setTaForm({ ...taForm, tanggalSelesai: e.target.value })}
                        className="w-full px-2.5 py-1.5 border rounded-lg bg-white dark:bg-slate-800"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="ta-active-cb"
                      checked={taForm.isActive}
                      onChange={(e) => setTaForm({ ...taForm, isActive: e.target.checked })}
                      className="rounded text-emerald-600"
                    />
                    <label htmlFor="ta-active-cb" className="text-xs font-medium cursor-pointer">
                      Jadikan sebagai Tahun Ajaran Aktif saat ini (Hanya 1 tahun ajaran yang aktif)
                    </label>
                  </div>
                  <div className="flex justify-end gap-2 pt-1">
                    <button type="button" onClick={() => setShowAddTA(false)} className="px-3 py-1.5 text-slate-600">Batal</button>
                    <button type="submit" className="px-3 py-1.5 bg-emerald-600 text-white font-semibold rounded-lg">Simpan</button>
                  </div>
                </form>
              )}

              <div className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
                {tahunAjarans.map((ta) => (
                  <div key={ta.id} className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <div className="flex items-start sm:items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                        ta.isActive ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' : 'bg-slate-100 text-slate-500'
                      }`}>
                        {ta.isActive ? <Check className="w-4 h-4" /> : <Calendar className="w-4 h-4" />}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-slate-900 dark:text-white text-xs">
                            Tahun Ajaran {ta.nama} ({ta.semester})
                          </h4>
                          {ta.isActive ? (
                            <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-[10px] font-bold">
                              Aktif Sekarang
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full text-[10px] font-medium">
                              Arsip / Rencana
                            </span>
                          )}
                        </div>

                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-500 mt-0.5">
                          <span>
                            Periode: {ta.tanggalMulai ? new Date(ta.tanggalMulai).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : '-'} s/d {ta.tanggalSelesai ? new Date(ta.tanggalSelesai).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : '-'}
                          </span>
                          <span>•</span>
                          <span className="font-mono font-semibold text-slate-700 dark:text-slate-300">
                            {ta.totalSantri || 0} Santri Terdaftar
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-auto">
                      {!ta.isActive && (
                        <button
                          onClick={() => handleActivateTA(ta.id, `${ta.nama} (${ta.semester})`)}
                          className="px-2.5 py-1 text-[11px] font-semibold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950 dark:text-emerald-300 rounded-lg border border-emerald-200 dark:border-emerald-800 transition-colors"
                        >
                          Jadikan Tahun Aktif
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-lg text-xs font-semibold"
          >
            Tutup
          </button>
        </div>

      </div>
    </div>
  );
};
