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
  Download 
} from 'lucide-react';
import type { Staf } from '../types/index.ts';

interface StafViewProps {
  onOpenAddModal: () => void;
}

export const StafView: React.FC<StafViewProps> = () => {
  const [stafList, setStafList] = React.useState<Staf[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState('');
  const [jabatanFilter, setJabatanFilter] = React.useState('semua');
  const [statusFilter, setStatusFilter] = React.useState('semua');

  // Modal edit/tambah state
  const [showModal, setShowModal] = React.useState(false);
  const [editingStaf, setEditingStaf] = React.useState<Staf | null>(null);
  const [formData, setFormData] = React.useState({
    nip: '',
    namaLengkap: '',
    jenisKelamin: 'L',
    jabatan: 'Guru Mapel / Asatidz',
    mataPelajaranKitab: '',
    jenjangAjar: 'MTs & MA',
    noHp: '',
    email: '',
    statusKepegawaian: 'tetap',
    pendidikanTerakhir: 'S1',
    alamat: '',
  });

  const fetchStaf = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (jabatanFilter !== 'semua') params.set('jabatan', jabatanFilter);
      if (statusFilter !== 'semua') params.set('statusKepegawaian', statusFilter);

      const res = await fetch(`/api/staf?${params.toString()}`);
      const data = await res.json();
      setStafList(data.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchStaf();
  }, [search, jabatanFilter, statusFilter]);

  const handleOpenAdd = () => {
    setEditingStaf(null);
    setFormData({
      nip: `NIP-${Date.now().toString().slice(-6)}`,
      namaLengkap: '',
      jenisKelamin: 'L',
      jabatan: 'Guru Mapel / Asatidz',
      mataPelajaranKitab: '',
      jenjangAjar: 'MTs & MA',
      noHp: '',
      email: '',
      statusKepegawaian: 'tetap',
      pendidikanTerakhir: 'S1',
      alamat: '',
    });
    setShowModal(true);
  };

  const handleOpenEdit = (staf: Staf) => {
    setEditingStaf(staf);
    setFormData({
      nip: staf.nip,
      namaLengkap: staf.namaLengkap,
      jenisKelamin: staf.jenisKelamin,
      jabatan: staf.jabatan,
      mataPelajaranKitab: staf.mataPelajaranKitab || '',
      jenjangAjar: staf.jenjangAjar || '',
      noHp: staf.noHp || '',
      email: staf.email || '',
      statusKepegawaian: staf.statusKepegawaian,
      pendidikanTerakhir: staf.pendidikanTerakhir || '',
      alamat: staf.alamat || '',
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
            </select>

            <button
              onClick={handleExportStaf}
              className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-medium"
            >
              <Download className="w-3.5 h-3.5 text-emerald-600" />
              <span>Export Excel</span>
            </button>

            <button
              onClick={handleOpenAdd}
              className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-xs"
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
                      <span className="font-mono text-[10px] text-slate-400 block mt-0.5">
                        {s.nip}
                      </span>
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
                      className="p-1.5 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 rounded-md"
                      title="Kirim WhatsApp"
                    >
                      <Phone className="w-3.5 h-3.5" />
                    </a>
                  )}
                  {s.email && (
                    <a
                      href={`mailto:${s.email}`}
                      className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40 rounded-md"
                      title="Kirim Email"
                    >
                      <Mail className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleOpenEdit(s)}
                    className="p-1.5 text-slate-500 hover:text-slate-900 dark:hover:text-white rounded-md hover:bg-slate-100 dark:hover:bg-slate-800"
                    title="Ubah Data"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(s.id, s.namaLengkap)}
                    className="p-1.5 text-rose-500 hover:text-rose-700 rounded-md hover:bg-rose-50 dark:hover:bg-rose-950/40"
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
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">
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
                    onChange={(e) => setFormData({ ...formData, jenisKelamin: e.target.value })}
                    className="w-full px-3 py-1.5 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800"
                  >
                    <option value="L">Laki-laki (Ustadz)</option>
                    <option value="P">Perempuan (Ustadzah)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 dark:text-slate-300 font-medium mb-1">Tugas / Jabatan:</label>
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
                <div>
                  <label className="block text-slate-600 dark:text-slate-300 font-medium mb-1">Status Kepegawaian:</label>
                  <select
                    value={formData.statusKepegawaian}
                    onChange={(e) => setFormData({ ...formData, statusKepegawaian: e.target.value })}
                    className="w-full px-3 py-1.5 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800"
                  >
                    <option value="tetap">Pegawai Tetap</option>
                    <option value="kontrak">Kontrak</option>
                    <option value="khidmah">Khidmah Pesantren</option>
                    <option value="honorer">Honorer</option>
                  </select>
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

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border rounded-lg text-slate-600"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold"
                >
                  Simpan Data Staf
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
