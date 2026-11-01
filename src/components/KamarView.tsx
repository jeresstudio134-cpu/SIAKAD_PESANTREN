import React from 'react';
import {
  Home,
  Users,
  Search,
  CheckCircle2,
  AlertCircle,
  ArrowRightLeft,
  Eye,
  RefreshCw,
  Building,
  UserCheck,
  Phone,
  Shield,
  X,
  Lock,
  Unlock
} from 'lucide-react';
import type { Asrama, Kamar, Santri, UserSession } from '../types/index.ts';

interface KamarViewProps {
  asramas: Asrama[];
  currentUser: UserSession | null;
  onRefreshMaster: () => void;
}

export const KamarView: React.FC<KamarViewProps> = ({
  asramas,
  currentUser,
  onRefreshMaster,
}) => {
  const isViewer = currentUser?.role === 'viewer';
  const [kamars, setKamars] = React.useState<Kamar[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState('');
  const [selectedAsramaId, setSelectedAsramaId] = React.useState('semua');
  const [statusFilter, setStatusFilter] = React.useState<'semua' | 'tersedia' | 'penuh'>('semua');

  // Modal: Detail Penghuni Kamar
  const [activeKamarDetail, setActiveKamarDetail] = React.useState<Kamar | null>(null);
  const [penghuniList, setPenghuniList] = React.useState<Santri[]>([]);
  const [loadingPenghuni, setLoadingPenghuni] = React.useState(false);

  // Modal: Pindah Kamar
  const [showPindahModal, setShowPindahModal] = React.useState(false);
  const [pindahForm, setPindahForm] = React.useState({
    santriId: '',
    targetKamarId: '',
    catatan: '',
  });
  const [candidateSantriList, setCandidateSantriList] = React.useState<Santri[]>([]);
  const [loadingCandidates, setLoadingCandidates] = React.useState(false);
  const [submittingPindah, setSubmittingPindah] = React.useState(false);

  // Fetch all rooms with occupants count
  const fetchKamars = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/master/kamar');
      const json = await res.json();
      setKamars(json.data || []);
    } catch (err) {
      console.error('Error fetching kamar:', err);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchKamars();
  }, []);

  // Fetch occupants when active room selected
  const handleViewPenghuni = async (kamar: Kamar) => {
    setActiveKamarDetail(kamar);
    setLoadingPenghuni(true);
    try {
      const res = await fetch(`/api/kamar/${kamar.id}/penghuni`);
      const json = await res.json();
      setPenghuniList(json.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingPenghuni(false);
    }
  };

  // Toggle kamar penuh
  const handleTogglePenuh = async (kamar: Kamar) => {
    if (isViewer) return;
    try {
      const res = await fetch(`/api/kamar/${kamar.id}/toggle-penuh`, {
        method: 'POST',
      });
      if (res.ok) {
        fetchKamars();
        onRefreshMaster();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Open pindah kamar modal
  const handleOpenPindah = async (preselectedKamar?: Kamar, preselectedSantri?: Santri) => {
    setShowPindahModal(true);
    setPindahForm({
      santriId: preselectedSantri?.id || '',
      targetKamarId: preselectedKamar?.id || '',
      catatan: '',
    });

    // Fetch active students for selector
    setLoadingCandidates(true);
    try {
      const res = await fetch('/api/santri?limit=1000&status=aktif');
      const json = await res.json();
      setCandidateSantriList(json.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingCandidates(false);
    }
  };

  // Submit Pindah Kamar
  const handlePindahSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pindahForm.santriId || !pindahForm.targetKamarId) {
      alert('Pilih santri dan kamar tujuan terlebih dahulu');
      return;
    }

    try {
      setSubmittingPindah(true);
      const res = await fetch('/api/kamar/pindah', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(pindahForm),
      });

      const json = await res.json();
      if (!res.ok) {
        alert(json.error || 'Gagal memindahkan santri');
        return;
      }

      alert(json.message || 'Santri berhasil dipindahkan kamar');
      setShowPindahModal(false);
      fetchKamars();
      onRefreshMaster();

      // Refresh penghuni if current room was open
      if (activeKamarDetail) {
        handleViewPenghuni(activeKamarDetail);
      }
    } catch (err: any) {
      alert(err.message || 'Terjadi kesalahan');
    } finally {
      setSubmittingPindah(false);
    }
  };

  // Filtered rooms
  const filteredKamars = kamars.filter((k) => {
    if (selectedAsramaId !== 'semua' && k.asramaId !== selectedAsramaId) return false;
    if (search && !k.namaKamar.toLowerCase().includes(search.toLowerCase()) && !k.asramaNama?.toLowerCase().includes(search.toLowerCase())) return false;

    const terisi = k.terisiCount || 0;
    const isFull = k.isFull === 1 || terisi >= k.kapasitas;
    if (statusFilter === 'tersedia' && isFull) return false;
    if (statusFilter === 'penuh' && !isFull) return false;

    return true;
  });

  // Calculate overall metrics
  const totalKapasitas = kamars.reduce((acc, k) => acc + k.kapasitas, 0);
  const totalTerisi = kamars.reduce((acc, k) => acc + (k.terisiCount || 0), 0);
  const totalSisa = Math.max(0, totalKapasitas - totalTerisi);
  const totalKamarPenuh = kamars.filter((k) => k.isFull === 1 || (k.terisiCount || 0) >= k.kapasitas).length;

  return (
    <div className="space-y-6">
      
      {/* Top Header & Metrics Banner */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs">
          <div className="flex items-center gap-2 text-slate-500 text-xs font-semibold">
            <Building className="w-4 h-4 text-emerald-600" />
            <span>Total Asrama</span>
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white mt-1 font-mono">
            {asramas.length}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">
            {asramas.filter((a) => a.kelompokGender === 'Putra').length} Putra · {asramas.filter((a) => a.kelompokGender === 'Putri').length} Putri
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs">
          <div className="flex items-center gap-2 text-slate-500 text-xs font-semibold">
            <Home className="w-4 h-4 text-blue-600" />
            <span>Total Kamar</span>
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white mt-1 font-mono">
            {kamars.length}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">
            {totalKamarPenuh} kamar penuh ({Math.round((totalKamarPenuh / (kamars.length || 1)) * 100)}%)
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs">
          <div className="flex items-center gap-2 text-slate-500 text-xs font-semibold">
            <Users className="w-4 h-4 text-purple-600" />
            <span>Santri Berasrama</span>
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white mt-1 font-mono">
            {totalTerisi.toLocaleString('id-ID')}
          </div>
          <div className="text-[11px] text-emerald-600 font-medium mt-0.5">
            Kapasitas: {totalKapasitas.toLocaleString('id-ID')} santri
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs">
          <div className="flex items-center gap-2 text-slate-500 text-xs font-semibold">
            <CheckCircle2 className="w-4 h-4 text-amber-600" />
            <span>Sisa Kapasitas</span>
          </div>
          <div className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1 font-mono">
            {totalSisa.toLocaleString('id-ID')}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">
            Tempat tidur siap huni
          </div>
        </div>
      </div>

      {/* Filter and Action Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="flex flex-1 items-center gap-2.5">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari nama kamar atau asrama..."
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Asrama Filter */}
          <select
            value={selectedAsramaId}
            onChange={(e) => setSelectedAsramaId(e.target.value)}
            className="px-3 py-2 text-xs font-semibold bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200"
          >
            <option value="semua">
              {currentUser?.scopeAsrama === 'putra' ? 'Semua Asrama Putra' : currentUser?.scopeAsrama === 'putri' ? 'Semua Asrama Putri' : 'Semua Asrama'}
            </option>
            {(currentUser?.scopeAsrama !== 'putri') && (
              <optgroup label="Asrama Putra (Banin)">
                {asramas.filter((a) => a.kelompokGender === 'Putra').map((a) => (
                  <option key={a.id} value={a.id}>{a.nama}</option>
                ))}
              </optgroup>
            )}
            {(currentUser?.scopeAsrama !== 'putra') && (
              <optgroup label="Asrama Putri (Banat)">
                {asramas.filter((a) => a.kelompokGender === 'Putri').map((a) => (
                  <option key={a.id} value={a.id}>{a.nama}</option>
                ))}
              </optgroup>
            )}
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-3 py-2 text-xs font-semibold bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200"
          >
            <option value="semua">Semua Status</option>
            <option value="tersedia">Tersedia (Ada Sisa)</option>
            <option value="penuh">Penuh</option>
          </select>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={fetchKamars}
            className="p-2 text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50"
            title="Refresh Data Kamar"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          {!isViewer && (
            <button
              onClick={() => handleOpenPindah()}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs transition-colors"
            >
              <ArrowRightLeft className="w-3.5 h-3.5" />
              <span>Pindah Kamar Santri</span>
            </button>
          )}
        </div>
      </div>

      {/* Kamar Cards Grid */}
      {loading ? (
        <div className="text-center py-16 text-slate-500 text-xs">
          Memuat data asrama & kamar...
        </div>
      ) : filteredKamars.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-500 text-xs">
          Tidak ada kamar yang sesuai dengan filter pencarian.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 w-full">
          {filteredKamars.map((kamar) => {
            const terisi = kamar.terisiCount || 0;
            const kapasitas = kamar.kapasitas || 10;
            const sisa = Math.max(0, kapasitas - terisi);
            const isFull = kamar.isFull === 1 || terisi >= kapasitas;
            const percent = Math.min(100, Math.round((terisi / kapasitas) * 100));

            return (
              <div
                key={kamar.id}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs flex flex-col justify-between hover:border-slate-300 dark:hover:border-slate-700 transition-colors"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        {kamar.asramaNama || 'Asrama'}
                      </span>
                      <h4 className="font-bold text-slate-900 dark:text-white text-base">
                        {kamar.namaKamar}
                      </h4>
                    </div>

                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        isFull
                          ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300'
                          : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                      }`}
                    >
                      {isFull ? 'Penuh' : 'Tersedia'}
                    </span>
                  </div>

                  {/* Gender badge */}
                  <div className="mt-1 flex items-center gap-1.5 text-xs text-slate-500">
                    <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                      Kelompok: {kamar.asramaGender || 'Putra'}
                    </span>
                  </div>

                  {/* Occupancy Progress */}
                  <div className="mt-3.5 space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500 font-medium">Kapasitas:</span>
                      <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">
                        {terisi} / {kapasitas} santri
                      </span>
                    </div>

                    <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          percent >= 100
                            ? 'bg-rose-500'
                            : percent >= 80
                            ? 'bg-amber-500'
                            : 'bg-emerald-500'
                        }`}
                        style={{ width: `${percent}%` }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-400 pt-0.5">
                      <span>Sisa: <strong className="text-slate-700 dark:text-slate-300 font-mono">{sisa}</strong> ranjang</span>
                      <span>{percent}% terisi</span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                  <button
                    onClick={() => handleViewPenghuni(kamar)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-semibold transition-colors"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Lihat Penghuni ({terisi})</span>
                  </button>

                  {!isViewer && (
                    <button
                      onClick={() => handleTogglePenuh(kamar)}
                      className={`p-1.5 rounded-lg border text-xs transition-colors ${
                        kamar.isFull === 1
                          ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:border-amber-800'
                          : 'bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-800 dark:border-slate-700'
                      }`}
                      title={kamar.isFull === 1 ? 'Buka Kamar (Tandai Tersedia)' : 'Tandai Kamar Penuh'}
                    >
                      {kamar.isFull === 1 ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL 1: LIHAT PENGHUNI KAMAR */}
      {activeKamarDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold uppercase text-emerald-600 dark:text-emerald-400">
                  {activeKamarDetail.asramaNama}
                </span>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  Daftar Penghuni {activeKamarDetail.namaKamar}
                </h3>
              </div>
              <button
                onClick={() => setActiveKamarDetail(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 sm:p-5 overflow-y-auto flex-1 space-y-3">
              {loadingPenghuni ? (
                <div className="text-center py-12 text-slate-500 text-xs">
                  Memuat data santri penghuni...
                </div>
              ) : penghuniList.length === 0 ? (
                <div className="text-center py-12 text-slate-500 text-xs bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-dashed border-slate-200 dark:border-slate-700">
                  Belum ada santri yang ditempatkan di kamar ini.
                </div>
              ) : (
                penghuniList.map((santri, idx) => (
                  <div
                    key={santri.id}
                    className="p-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 font-bold flex items-center justify-center shrink-0 uppercase text-xs">
                        {santri.namaLengkap.charAt(0)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 dark:text-white text-xs">
                            {santri.namaLengkap}
                          </span>
                          <span className="font-mono text-[11px] text-slate-500 font-semibold">
                            ({santri.nis})
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          {santri.jenjang} · {santri.kelas} · Asal: {santri.kotaAsal || '-'}
                        </div>
                        {santri.noHpWali && (
                          <div className="flex items-center gap-1 text-[11px] text-emerald-600 mt-0.5">
                            <Phone className="w-3 h-3" />
                            <span>Wali: {santri.namaAyah || santri.namaWali || '-'} ({santri.noHpWali})</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {!isViewer && (
                      <button
                        onClick={() => {
                          setActiveKamarDetail(null);
                          handleOpenPindah(undefined, santri);
                        }}
                        className="px-2.5 py-1.5 text-xs font-semibold text-indigo-700 dark:text-indigo-300 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/60 rounded-lg flex items-center gap-1 transition-colors"
                      >
                        <ArrowRightLeft className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Pindah Kamar</span>
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>

            <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex items-center justify-between text-xs text-slate-500">
              <span>Total Penghuni: <strong className="font-mono text-slate-900 dark:text-white">{penghuniList.length}</strong> / {activeKamarDetail.kapasitas}</span>
              <button
                onClick={() => setActiveKamarDetail(null)}
                className="px-4 py-1.5 text-xs font-semibold bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-lg"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: PINDAH KAMAR SANTRI */}
      {showPindahModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ArrowRightLeft className="w-5 h-5 text-indigo-600" />
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Formulir Pindah Kamar Santri
                </h3>
              </div>
              <button
                onClick={() => setShowPindahModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handlePindahSubmit} className="p-4 sm:p-5 space-y-4">
              
              {/* Santri Selector */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Pilih Santri yang akan dipindahkan: *
                </label>
                {loadingCandidates ? (
                  <div className="text-xs text-slate-500 py-1">Memuat daftar santri...</div>
                ) : (
                  <select
                    value={pindahForm.santriId}
                    onChange={(e) => setPindahForm((prev) => ({ ...prev, santriId: e.target.value }))}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-medium"
                    required
                  >
                    <option value="">-- Pilih Santri --</option>
                    {candidateSantriList.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.namaLengkap} ({s.nis}) - {s.asrama || 'Belum ada kamar'} [{s.jenisKelamin === 'L' ? 'Putra' : 'Putri'}]
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Target Kamar Selector */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Pilih Kamar Tujuan: *
                </label>
                <select
                  value={pindahForm.targetKamarId}
                  onChange={(e) => setPindahForm((prev) => ({ ...prev, targetKamarId: e.target.value }))}
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-medium"
                  required
                >
                  <option value="">-- Pilih Kamar Tujuan --</option>
                  {(currentUser?.scopeAsrama !== 'putri') && (
                    <optgroup label="Asrama Putra (Banin)">
                      {kamars.filter((k) => k.asramaGender === 'Putra').map((k) => {
                        const sisa = Math.max(0, k.kapasitas - (k.terisiCount || 0));
                        return (
                          <option key={k.id} value={k.id} disabled={sisa <= 0 && k.isFull === 1}>
                            {k.asramaNama} - {k.namaKamar} (Sisa {sisa}/{k.kapasitas} ranjang) {k.isFull === 1 ? '[PENUH]' : ''}
                          </option>
                        );
                      })}
                    </optgroup>
                  )}
                  {(currentUser?.scopeAsrama !== 'putra') && (
                    <optgroup label="Asrama Putri (Banat)">
                      {kamars.filter((k) => k.asramaGender === 'Putri').map((k) => {
                        const sisa = Math.max(0, k.kapasitas - (k.terisiCount || 0));
                        return (
                          <option key={k.id} value={k.id} disabled={sisa <= 0 && k.isFull === 1}>
                            {k.asramaNama} - {k.namaKamar} (Sisa {sisa}/{k.kapasitas} ranjang) {k.isFull === 1 ? '[PENUH]' : ''}
                          </option>
                        );
                      })}
                    </optgroup>
                  )}
                </select>
              </div>

              {/* Catatan / Alasan Pindah */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Alasan / Catatan Pemindahan:
                </label>
                <input
                  type="text"
                  value={pindahForm.catatan}
                  onChange={(e) => setPindahForm((prev) => ({ ...prev, catatan: e.target.value }))}
                  placeholder="Misal: Penyesuaian kelas tahfidz / permintaan wali"
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowPindahModal(false)}
                  className="px-4 py-2 text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submittingPindah}
                  className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm disabled:opacity-50"
                >
                  {submittingPindah ? 'Memindahkan...' : 'Konfirmasi Pindah Kamar'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
};
