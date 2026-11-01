import React from 'react';
import { 
  Search, 
  Plus, 
  Phone, 
  Mail, 
  BookOpen, 
  Edit3, 
  Trash2, 
  CheckCircle2, 
  Upload, 
  X, 
  Save, 
  Download,
  Calendar,
  Building2,
  GraduationCap,
  Briefcase
} from 'lucide-react';
import type { Staf, StafPenugasan, Lembaga, Kelas, TahunAjaran } from '../types/index.ts';

interface StafViewProps {
  onOpenAddModal?: () => void;
}

export const StafView: React.FC<StafViewProps> = () => {
  const [stafList, setStafList] = React.useState<Staf[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState('');
  const [bagianFilter, setBagianFilter] = React.useState('semua');
  const [jabatanFilter, setJabatanFilter] = React.useState('semua');
  const [statusFilter, setStatusFilter] = React.useState('semua');

  // Master references
  const [lembagas, setLembagas] = React.useState<Lembaga[]>([]);
  const [kelasList, setKelasList] = React.useState<Kelas[]>([]);
  const [tahunAjarans, setTahunAjarans] = React.useState<TahunAjaran[]>([]);

  // Modal edit/tambah state
  const [showModal, setShowModal] = React.useState(false);
  const [editingStaf, setEditingStaf] = React.useState<Staf | null>(null);
  const [formData, setFormData] = React.useState({
    nip: '',
    namaLengkap: '',
    jenisKelamin: 'L' as 'L' | 'P',
    bagian: 'Ustadz/Ustadzah',
    jabatan: 'Guru Mapel / Asatidz',
    mataPelajaranKitab: '',
    jenjangAjar: 'MTs & MA',
    noHp: '',
    email: '',
    statusKepegawaian: 'tetap' as 'tetap' | 'kontrak' | 'khidmah' | 'honorer' | 'pengabdian',
    pendidikanTerakhir: 'S1',
    alamat: '',
    tempatLahir: '',
    tanggalLahir: '',
    tanggalMulaiTugas: '',
  });

  // Penugasan modal state
  const [selectedStafForPenugasan, setSelectedStafForPenugasan] = React.useState<Staf | null>(null);
  const [penugasanList, setPenugasanList] = React.useState<StafPenugasan[]>([]);
  const [loadingPenugasan, setLoadingPenugasan] = React.useState(false);
  const [showAddPenugasan, setShowAddPenugasan] = React.useState(false);
  const [penugasanForm, setPenugasanForm] = React.useState({
    tahunAjaranId: '',
    lembagaId: '',
    tugasMapel: '',
    waliKelasId: '',
  });

  const fetchMasterRefs = async () => {
    try {
      const [lRes, cRes, taRes] = await Promise.all([
        fetch('/api/master/lembaga'),
        fetch('/api/master/kelas'),
        fetch('/api/master/tahun-ajaran'),
      ]);
      const [lData, cData, taData] = await Promise.all([
        lRes.json(),
        cRes.json(),
        taRes.json(),
      ]);
      setLembagas(lData.data || []);
      setKelasList(cData.data || []);
      setTahunAjarans(taData.data || []);
      const activeTa = taData.data?.find((t: TahunAjaran) => t.isActive);
      if (activeTa) {
        setPenugasanForm((prev) => ({ ...prev, tahunAjaranId: activeTa.id }));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchStaf = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (jabatanFilter !== 'semua') params.set('jabatan', jabatanFilter);
      if (statusFilter !== 'semua') params.set('statusKepegawaian', statusFilter);

      const res = await fetch(`/api/staf?${params.toString()}`);
      const data = await res.json();
      let list: Staf[] = data.data || [];
      if (bagianFilter !== 'semua') {
        list = list.filter((s) => s.bagian === bagianFilter);
      }
      setStafList(list);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchMasterRefs();
  }, []);

  React.useEffect(() => {
    fetchStaf();
  }, [search, bagianFilter, jabatanFilter, statusFilter]);

  const handleOpenAdd = () => {
    setEditingStaf(null);
    setFormData({
      nip: `NIP-${Date.now().toString().slice(-6)}`,
      namaLengkap: '',
      jenisKelamin: 'L',
      bagian: 'Ustadz/Ustadzah',
      jabatan: 'Guru Mapel / Asatidz',
      mataPelajaranKitab: '',
      jenjangAjar: 'MTs & MA',
      noHp: '',
      email: '',
      statusKepegawaian: 'tetap',
      pendidikanTerakhir: 'S1',
      alamat: '',
      tempatLahir: '',
      tanggalLahir: '',
      tanggalMulaiTugas: new Date().toISOString().split('T')[0],
    });
    setShowModal(true);
  };

  const handleOpenEdit = (staf: Staf) => {
    setEditingStaf(staf);
    setFormData({
      nip: staf.nip,
      namaLengkap: staf.namaLengkap,
      jenisKelamin: staf.jenisKelamin,
      bagian: staf.bagian || 'Ustadz/Ustadzah',
      jabatan: staf.jabatan,
      mataPelajaranKitab: staf.mataPelajaranKitab || '',
      jenjangAjar: staf.jenjangAjar || '',
      noHp: staf.noHp || '',
      email: staf.email || '',
      statusKepegawaian: staf.statusKepegawaian,
      pendidikanTerakhir: staf.pendidikanTerakhir || '',
      alamat: staf.alamat || '',
      tempatLahir: staf.tempatLahir || '',
      tanggalLahir: staf.tanggalLahir || '',
      tanggalMulaiTugas: staf.tanggalMulaiTugas || '',
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingStaf ? `/api/staf/${editingStaf.id}` : '/api/staf';
      const method = editingStaf ? 'PUT' : 'POST';

      await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      setShowModal(false);
      fetchStaf();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: string, nama: string) => {
    if (!confirm(`Hapus data ${nama}?`)) return;
    try {
      await fetch(`/api/staf/${id}`, { method: 'DELETE' });
      fetchStaf();
    } catch (err) {
      console.error(err);
    }
  };

  const handleExportStaf = () => {
    window.location.href = '/api/export/staf';
  };

  // Penugasan logic
  const handleOpenPenugasanModal = async (staf: Staf) => {
    setSelectedStafForPenugasan(staf);
    setLoadingPenugasan(true);
    try {
      const res = await fetch(`/api/staf/penugasan?stafId=${staf.id}`);
      const json = await res.json();
      setPenugasanList(json.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingPenugasan(false);
    }
  };

  const handleSavePenugasan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStafForPenugasan || !penugasanForm.tahunAjaranId) return;

    try {
      await fetch('/api/staf/penugasan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stafId: selectedStafForPenugasan.id,
          tahunAjaranId: penugasanForm.tahunAjaranId,
          lembagaId: penugasanForm.lembagaId || null,
          tugasMapel: penugasanForm.tugasMapel || null,
          waliKelasId: penugasanForm.waliKelasId || null,
        }),
      });

      setShowAddPenugasan(false);
      setPenugasanForm((prev) => ({ ...prev, tugasMapel: '', waliKelasId: '' }));
      // Refresh list
      const res = await fetch(`/api/staf/penugasan?stafId=${selectedStafForPenugasan.id}`);
      const json = await res.json();
      setPenugasanList(json.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeletePenugasan = async (id: string) => {
    if (!confirm('Hapus penugasan ini?')) return;
    try {
      await fetch(`/api/staf/penugasan/${id}`, { method: 'DELETE' });
      if (selectedStafForPenugasan) {
        const res = await fetch(`/api/staf/penugasan?stafId=${selectedStafForPenugasan.id}`);
        const json = await res.json();
        setPenugasanList(json.data || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-4">
      
      {/* Top Filter and Actions */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari Nama Asatidz, NIP, atau Kitab yang diajar..."
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={bagianFilter}
              onChange={(e) => setBagianFilter(e.target.value)}
              className="px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-300"
            >
              <option value="semua">Semua Bagian</option>
              <option value="Guru">Guru Formal</option>
              <option value="Ustadz/Ustadzah">Ustadz / Ustadzah</option>
              <option value="Musyrif/Musyrifah">Musyrif / Musyrifah</option>
              <option value="Pengurus">Pengurus Pondok</option>
              <option value="Tata Usaha">Tata Usaha & Admin</option>
              <option value="Kesehatan & Logistik">Kesehatan & Logistik</option>
            </select>

            <select
              value={jabatanFilter}
              onChange={(e) => setJabatanFilter(e.target.value)}
              className="px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-300"
            >
              <option value="semua">Semua Jabatan</option>
              <option value="Pengasuh">Pengasuh</option>
              <option value="Kepala Madrasah">Kepala Madrasah</option>
              <option value="Lurah Pondok">Lurah Pondok</option>
              <option value="Guru Mapel / Asatidz">Asatidz / Guru Mapel</option>
              <option value="Musyrif / Pembina Asrama">Musyrif / Pembina Asrama</option>
              <option value="Staf TU">Staf TU & Admin</option>
              <option value="Staf Keuangan">Staf Keuangan</option>
              <option value="Kesehatan">Kesehatan</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-300"
            >
              <option value="semua">Semua Kepegawaian</option>
              <option value="tetap">Pegawai Tetap</option>
              <option value="kontrak">Kontrak</option>
              <option value="khidmah">Khidmah Pesantren</option>
              <option value="honorer">Honorer</option>
              <option value="pengabdian">Pengabdian</option>
            </select>

            <button
              onClick={handleExportStaf}
              className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-medium cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-emerald-600" />
              <span>Export Excel</span>
            </button>

            <button
              onClick={handleOpenAdd}
              className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-xs cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Tambah Staf</span>
            </button>
          </div>

        </div>

        <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500">
          Total: <strong className="font-mono text-slate-900 dark:text-white tabular-nums">{stafList.length}</strong> Asatidz & Staf tercatat
        </div>
      </div>

      {/* Grid of Staff Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {loading ? (
          [...Array(6)].map((_, i) => (
            <div key={i} className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 animate-pulse h-40" />
          ))
        ) : stafList.length === 0 ? (
          <div className="col-span-full p-8 text-center bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-500 text-xs">
            Tidak ada staf yang sesuai dengan filter.
          </div>
        ) : (
          stafList.map((s) => (
            <div
              key={s.id}
              className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition-colors flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 font-bold flex items-center justify-center text-sm uppercase shrink-0">
                      {s.namaLengkap.replace(/^(K\.H\.|Ust\.|Ustzh\.)\s*/, '').charAt(0)}
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 dark:text-white text-xs leading-tight">
                        {s.namaLengkap}
                      </h4>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="font-mono text-[10px] text-slate-400">
                          {s.nip}
                        </span>
                        {s.bagian && (
                          <span className="px-1.5 py-0.2 rounded bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-semibold text-[9px]">
                            {s.bagian}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 capitalize">
                    {s.statusKepegawaian}
                  </span>
                </div>

                <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300 mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Tugas / Jabatan:</span>
                    <strong className="text-slate-800 dark:text-slate-200">{s.jabatan}</strong>
                  </div>
                  {s.mataPelajaranKitab && (
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-slate-400 shrink-0">Mapel / Kitab:</span>
                      <span className="text-right truncate font-medium text-emerald-700 dark:text-emerald-400">{s.mataPelajaranKitab}</span>
                    </div>
                  )}
                  {s.pendidikanTerakhir && (
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Pendidikan:</span>
                      <span>{s.pendidikanTerakhir}</span>
                    </div>
                  )}
                  {s.tanggalMulaiTugas && (
                    <div className="flex items-center justify-between text-[11px] text-slate-400">
                      <span>Mulai Tugas:</span>
                      <span>{s.tanggalMulaiTugas}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Action buttons */}
              <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  {s.noHp && (
                    <a
                      href={`https://wa.me/${s.noHp.replace(/\D/g, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 rounded-md cursor-pointer"
                      title="Kirim WhatsApp"
                    >
                      <Phone className="w-3.5 h-3.5" />
                    </a>
                  )}
                  {s.email && (
                    <a
                      href={`mailto:${s.email}`}
                      className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40 rounded-md cursor-pointer"
                      title="Kirim Email"
                    >
                      <Mail className="w-3.5 h-3.5" />
                    </a>
                  )}
                  <button
                    onClick={() => handleOpenPenugasanModal(s)}
                    className="inline-flex items-center gap-1 px-2 py-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded text-[11px] font-semibold cursor-pointer"
                    title="Kelola Penugasan TA & Wali Kelas"
                  >
                    <Briefcase className="w-3 h-3 text-emerald-600" />
                    <span>Penugasan</span>
                  </button>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleOpenEdit(s)}
                    className="p-1.5 text-slate-500 hover:text-slate-900 dark:hover:text-white rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                    title="Ubah Data"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(s.id, s.namaLengkap)}
                    className="p-1.5 text-rose-500 hover:text-rose-700 rounded-md hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer"
                    title="Hapus"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add / Edit Staf Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                {editingStaf ? 'Ubah Data Staf / Asatidz' : 'Tambah Staf & Asatidz Baru'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-3 text-xs overflow-y-auto max-h-[80vh]">
              <div>
                <label className="block text-slate-600 dark:text-slate-300 font-medium mb-1">Nama Lengkap & Gelar*:</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Ust. H. Ahmad Dahlan, Lc., M.A."
                  value={formData.namaLengkap}
                  onChange={(e) => setFormData({ ...formData, namaLengkap: e.target.value })}
                  className="w-full px-3 py-1.5 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 dark:text-slate-300 font-medium mb-1">NIP (Nomor Pegawai):</label>
                  <input
                    type="text"
                    value={formData.nip}
                    onChange={(e) => setFormData({ ...formData, nip: e.target.value })}
                    className="w-full px-3 py-1.5 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 dark:text-slate-300 font-medium mb-1">Jenis Kelamin:</label>
                  <select
                    value={formData.jenisKelamin}
                    onChange={(e) => setFormData({ ...formData, jenisKelamin: e.target.value as 'L' | 'P' })}
                    className="w-full px-3 py-1.5 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800"
                  >
                    <option value="L">Laki-laki (Ustadz / Bapak)</option>
                    <option value="P">Perempuan (Ustadzah / Ibu)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 dark:text-slate-300 font-medium mb-1">Bagian / Divisi*:</label>
                  <select
                    value={formData.bagian}
                    onChange={(e) => setFormData({ ...formData, bagian: e.target.value })}
                    className="w-full px-3 py-1.5 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 font-semibold text-emerald-700 dark:text-emerald-400"
                  >
                    <option value="Guru">Guru Formal</option>
                    <option value="Ustadz/Ustadzah">Ustadz / Ustadzah</option>
                    <option value="Musyrif/Musyrifah">Musyrif / Musyrifah (Asrama)</option>
                    <option value="Pengurus">Pengurus Pondok</option>
                    <option value="Tata Usaha">Tata Usaha & Admin</option>
                    <option value="Kesehatan & Logistik">Kesehatan & Logistik</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-600 dark:text-slate-300 font-medium mb-1">Tugas / Jabatan Struktural:</label>
                  <select
                    value={formData.jabatan}
                    onChange={(e) => setFormData({ ...formData, jabatan: e.target.value })}
                    className="w-full px-3 py-1.5 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800"
                  >
                    <option value="Pengasuh">Pengasuh Pondok</option>
                    <option value="Kepala Madrasah">Kepala Madrasah</option>
                    <option value="Lurah Pondok">Lurah Pondok</option>
                    <option value="Guru Mapel / Asatidz">Asatidz / Guru Mapel</option>
                    <option value="Musyrif / Pembina Asrama">Musyrif Pembina Asrama</option>
                    <option value="Staf TU">Staf TU & Admin</option>
                    <option value="Staf Keuangan">Staf Keuangan</option>
                    <option value="Kesehatan">Kesehatan</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 dark:text-slate-300 font-medium mb-1">Status Kepegawaian:</label>
                  <select
                    value={formData.statusKepegawaian}
                    onChange={(e) => setFormData({ ...formData, statusKepegawaian: e.target.value as any })}
                    className="w-full px-3 py-1.5 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800"
                  >
                    <option value="tetap">Pegawai Tetap</option>
                    <option value="kontrak">Kontrak</option>
                    <option value="khidmah">Khidmah Pesantren</option>
                    <option value="honorer">Honorer</option>
                    <option value="pengabdian">Pengabdian</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-600 dark:text-slate-300 font-medium mb-1">Tanggal Mulai Tugas:</label>
                  <input
                    type="date"
                    value={formData.tanggalMulaiTugas}
                    onChange={(e) => setFormData({ ...formData, tanggalMulaiTugas: e.target.value })}
                    className="w-full px-3 py-1.5 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 dark:text-slate-300 font-medium mb-1">Tempat Lahir:</label>
                  <input
                    type="text"
                    placeholder="Contoh: Jombang"
                    value={formData.tempatLahir}
                    onChange={(e) => setFormData({ ...formData, tempatLahir: e.target.value })}
                    className="w-full px-3 py-1.5 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 dark:text-slate-300 font-medium mb-1">Tanggal Lahir:</label>
                  <input
                    type="date"
                    value={formData.tanggalLahir}
                    onChange={(e) => setFormData({ ...formData, tanggalLahir: e.target.value })}
                    className="w-full px-3 py-1.5 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-300 font-medium mb-1">Mata Pelajaran / Kitab Kuning:</label>
                <input
                  type="text"
                  placeholder="Contoh: Nahwu Jurumiyyah, Fiqih Fathul Qorib"
                  value={formData.mataPelajaranKitab}
                  onChange={(e) => setFormData({ ...formData, mataPelajaranKitab: e.target.value })}
                  className="w-full px-3 py-1.5 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 dark:text-slate-300 font-medium mb-1">No. WhatsApp / HP:</label>
                  <input
                    type="text"
                    placeholder="081234567890"
                    value={formData.noHp}
                    onChange={(e) => setFormData({ ...formData, noHp: e.target.value })}
                    className="w-full px-3 py-1.5 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 dark:text-slate-300 font-medium mb-1">Pendidikan Terakhir:</label>
                  <input
                    type="text"
                    placeholder="Contoh: S1 Al-Azhar Mesir"
                    value={formData.pendidikanTerakhir}
                    onChange={(e) => setFormData({ ...formData, pendidikanTerakhir: e.target.value })}
                    className="w-full px-3 py-1.5 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-300 font-medium mb-1">Alamat Asal / Tinggal:</label>
                <input
                  type="text"
                  placeholder="Contoh: Komplek Asrama Asatidz Blok B-03"
                  value={formData.alamat}
                  onChange={(e) => setFormData({ ...formData, alamat: e.target.value })}
                  className="w-full px-3 py-1.5 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border rounded-lg text-slate-600 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold cursor-pointer shadow-xs"
                >
                  Simpan Data Staf
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Penugasan TA & Wali Kelas Modal */}
      {selectedStafForPenugasan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[85vh]">
            
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
              <div className="flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-emerald-600" />
                <div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                    Penugasan Akademik: {selectedStafForPenugasan.namaLengkap}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Riwayat dan penugasan mengajar serta perwalian kelas per Tahun Ajaran.
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedStafForPenugasan(null)} 
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto flex-1 space-y-4 text-xs">
              
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-700 dark:text-slate-300">
                  Daftar Tugas & Perwalian ({penugasanList.length})
                </span>
                <button
                  onClick={() => setShowAddPenugasan(!showAddPenugasan)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold text-xs cursor-pointer shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Tambah Penugasan</span>
                </button>
              </div>

              {/* Form Tambah Penugasan */}
              {showAddPenugasan && (
                <form onSubmit={handleSavePenugasan} className="p-4 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-xl space-y-3 animate-in fade-in">
                  <h4 className="font-bold text-emerald-900 dark:text-emerald-300">Tugaskan Guru / Asatidz</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-medium mb-1">Tahun Ajaran*:</label>
                      <select
                        required
                        value={penugasanForm.tahunAjaranId}
                        onChange={(e) => setPenugasanForm({ ...penugasanForm, tahunAjaranId: e.target.value })}
                        className="w-full px-2.5 py-1.5 border rounded-lg bg-white dark:bg-slate-800 text-xs"
                      >
                        {tahunAjarans.map((ta) => (
                          <option key={ta.id} value={ta.id}>{ta.nama} ({ta.semester}) {ta.isActive ? '★ Aktif' : ''}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-medium mb-1">Lembaga Terkait:</label>
                      <select
                        value={penugasanForm.lembagaId}
                        onChange={(e) => setPenugasanForm({ ...penugasanForm, lembagaId: e.target.value })}
                        className="w-full px-2.5 py-1.5 border rounded-lg bg-white dark:bg-slate-800 text-xs"
                      >
                        <option value="">-- Semua / Pesantren Umum --</option>
                        {lembagas.map((l) => (
                          <option key={l.id} value={l.id}>{l.nama} ({l.kode})</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-medium mb-1">Tugas / Mata Pelajaran / Kitab:</label>
                      <input
                        type="text"
                        placeholder="Contoh: Guru Matematika Wajib & Fiqih"
                        value={penugasanForm.tugasMapel}
                        onChange={(e) => setPenugasanForm({ ...penugasanForm, tugasMapel: e.target.value })}
                        className="w-full px-2.5 py-1.5 border rounded-lg bg-white dark:bg-slate-800 text-xs"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-medium mb-1">Wali Kelas (Opsional):</label>
                      <select
                        value={penugasanForm.waliKelasId}
                        onChange={(e) => setPenugasanForm({ ...penugasanForm, waliKelasId: e.target.value })}
                        className="w-full px-2.5 py-1.5 border rounded-lg bg-white dark:bg-slate-800 text-xs"
                      >
                        <option value="">-- Bukan Wali Kelas --</option>
                        {kelasList.map((c) => (
                          <option key={c.id} value={c.id}>Kelas {c.namaKelas} ({c.lembagaNama})</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setShowAddPenugasan(false)}
                      className="px-3 py-1.5 text-slate-600 dark:text-slate-300 text-xs cursor-pointer"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-xs cursor-pointer"
                    >
                      Simpan Penugasan
                    </button>
                  </div>
                </form>
              )}

              {/* List Penugasan */}
              {loadingPenugasan ? (
                <div className="p-8 text-center text-slate-400">Memuat penugasan...</div>
              ) : penugasanList.length === 0 ? (
                <div className="p-8 text-center text-slate-400 bg-slate-50 dark:bg-slate-800/30 rounded-xl border border-dashed border-slate-200 dark:border-slate-800">
                  Belum ada catatan penugasan untuk staf ini.
                </div>
              ) : (
                <div className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
                  {penugasanList.map((pn) => (
                    <div key={pn.id} className="p-3.5 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 dark:text-white">
                            {pn.tugasMapel || 'Penugasan Pengajaran'}
                          </span>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300">
                            {pn.tahunAjaranNama || '2026/2027'} ({pn.semester || 'Ganjil'})
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-3">
                          <span>Lembaga: <strong>{pn.lembagaNama || 'Umum'}</strong></span>
                          {pn.waliKelasNama && (
                            <>
                              <span>•</span>
                              <span className="text-emerald-600 font-semibold">
                                Wali Kelas: {pn.waliKelasNama}
                              </span>
                            </>
                          )}
                        </div>
                      </div>

                      <button
                        onClick={() => handleDeletePenugasan(pn.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded cursor-pointer"
                        title="Hapus Penugasan"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="px-5 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex justify-end">
              <button
                onClick={() => setSelectedStafForPenugasan(null)}
                className="px-4 py-1.5 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 text-slate-800 dark:text-slate-200 rounded-lg text-xs font-semibold cursor-pointer"
              >
                Tutup
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
