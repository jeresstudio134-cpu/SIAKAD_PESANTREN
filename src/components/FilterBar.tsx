import React from 'react';
import {
  Search,
  X,
  RotateCcw,
  SlidersHorizontal,
  Building2,
  Home,
  ShieldCheck,
  Lock,
  Bookmark,
  BookmarkPlus,
  Trash2,
  Tag
} from 'lucide-react';
import type { FilterParams, Lembaga, Asrama, UserSession, SavedView } from '../types/index.ts';

interface FilterBarProps {
  filters: FilterParams;
  setFilters: React.Dispatch<React.SetStateAction<FilterParams>>;
  onReset: () => void;
  totalFiltered: number;
  totalAll: number;
  lembagas: Lembaga[];
  asramas: Asrama[];
  currentUser: UserSession | null;
}

const DEFAULT_PRESETS: SavedView[] = [
  {
    id: 'preset-putra',
    nama: 'Santri Putra (Banin)',
    filters: { jenisKelamin: 'L', status: 'aktif' },
    createdAt: '2026-01-01',
  },
  {
    id: 'preset-putri',
    nama: 'Santri Putri (Banat)',
    filters: { jenisKelamin: 'P', status: 'aktif' },
    createdAt: '2026-01-01',
  },
  {
    id: 'preset-tunggak-spp',
    nama: 'Tunggakan SPP (Perlu Tindak)',
    filters: { statusSpp: 'tunggakan_1_bulan' },
    createdAt: '2026-01-01',
  },
  {
    id: 'preset-hafidz-30',
    nama: 'Santri Khatam 30 Juz',
    filters: { minJuz: 30, status: 'aktif' },
    createdAt: '2026-01-01',
  },
];

export const FilterBar: React.FC<FilterBarProps> = ({
  filters,
  setFilters,
  onReset,
  totalFiltered,
  totalAll,
  lembagas,
  asramas,
  currentUser,
}) => {
  const [showAdvanced, setShowAdvanced] = React.useState(false);
  const [savedViews, setSavedViews] = React.useState<SavedView[]>([]);
  const [showSaveViewModal, setShowSaveViewModal] = React.useState(false);
  const [newViewName, setNewViewName] = React.useState('');

  // Load saved views from localStorage
  React.useEffect(() => {
    try {
      const stored = localStorage.getItem('siakad_saved_views');
      if (stored) {
        setSavedViews(JSON.parse(stored));
      } else {
        setSavedViews(DEFAULT_PRESETS);
        localStorage.setItem('siakad_saved_views', JSON.stringify(DEFAULT_PRESETS));
      }
    } catch (e) {
      setSavedViews(DEFAULT_PRESETS);
    }
  }, []);

  // Save current view
  const handleSaveCurrentView = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newViewName.trim()) return;

    const newView: SavedView = {
      id: 'view-' + Date.now(),
      nama: newViewName.trim(),
      filters: { ...filters, page: 1 },
      createdAt: new Date().toISOString(),
    };

    const updated = [newView, ...savedViews];
    setSavedViews(updated);
    localStorage.setItem('siakad_saved_views', JSON.stringify(updated));
    setNewViewName('');
    setShowSaveViewModal(false);
  };

  // Delete saved view
  const handleDeleteView = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = savedViews.filter((v) => v.id !== id);
    setSavedViews(updated);
    localStorage.setItem('siakad_saved_views', JSON.stringify(updated));
  };

  // Apply saved view
  const handleApplyView = (view: SavedView) => {
    setFilters((prev) => ({
      ...prev,
      ...view.filters,
      page: 1,
    }));
  };

  // Find classes available for currently selected lembaga
  const selectedLembaga = lembagas.find((l) => l.id === filters.lembagaId);
  const availableClasses = selectedLembaga ? selectedLembaga.tingkatKelas : [];

  const activeCount = [
    filters.search,
    filters.lembagaId && filters.lembagaId !== 'semua',
    filters.kelas && filters.kelas !== 'semua',
    filters.asramaId && filters.asramaId !== 'semua',
    filters.jenisKelamin && filters.jenisKelamin !== 'semua',
    filters.status && filters.status !== 'semua',
    filters.statusSpp && filters.statusSpp !== 'semua',
    filters.minJuz !== undefined && filters.minJuz > 0,
    filters.minPoin !== undefined && filters.minPoin > 0,
    filters.tahunMasuk && filters.tahunMasuk !== 'semua',
    filters.kotaAsal,
  ].filter(Boolean).length;

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3.5 mb-5 shadow-xs space-y-3">
      
      {/* Scoped Enforcement Info Banner */}
      {currentUser && currentUser.role !== 'superadmin' && (
        <div className="p-2.5 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/60 rounded-lg flex items-center justify-between text-xs text-blue-900 dark:text-blue-200">
          <div className="flex items-center gap-2">
            <Lock className="w-3.5 h-3.5 text-blue-600 shrink-0" />
            <span>
              <strong>Server-Side Scoped RBAC Aktif:</strong>{' '}
              {currentUser.role === 'admin_lembaga' && 'Query dibatasi khusus pada Lembaga yang ditugaskan kepada Anda.'}
              {currentUser.role === 'pengurus_asrama' && 'Query dibatasi khusus pada Asrama binaan yang ditugaskan kepada Anda.'}
              {currentUser.role === 'viewer' && 'Akun Viewer (Hanya Lihat) dengan cakupan terbatas.'}
            </span>
          </div>
          <span className="font-mono text-[10px] bg-blue-100 dark:bg-blue-900/60 text-blue-800 dark:text-blue-300 px-2 py-0.5 rounded font-bold uppercase">
            Enforced
          </span>
        </div>
      )}

      {/* Top Search & Primary Filter Row */}
      <div className="flex flex-col md:flex-row gap-2.5 items-stretch md:items-center justify-between">
        
        {/* Search Input Box */}
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={filters.search || ''}
            onChange={(e) => setFilters((prev) => ({ ...prev, search: e.target.value, page: 1 }))}
            placeholder="Cari NIS, Nama Santri, Wali, atau Kota Asal..."
            className="w-full pl-9 pr-9 py-2 text-xs bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
          />
          {filters.search && (
            <button
              onClick={() => setFilters((prev) => ({ ...prev, search: '', page: 1 }))}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              title="Bersihkan Pencarian"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Quick Dropdowns */}
        <div className="flex flex-wrap items-center gap-2">
          
          {/* Lembaga Filter */}
          <select
            value={filters.lembagaId || 'semua'}
            onChange={(e) => setFilters((prev) => ({ ...prev, lembagaId: e.target.value, kelas: 'semua', page: 1 }))}
            className="px-3 py-2 text-xs font-semibold bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200"
          >
            <option value="semua">Semua Lembaga</option>
            {lembagas.map((l) => (
              <option key={l.id} value={l.id}>{l.nama} ({l.kode})</option>
            ))}
          </select>

          {/* Asrama Filter */}
          <select
            value={filters.asramaId || 'semua'}
            onChange={(e) => setFilters((prev) => ({ ...prev, asramaId: e.target.value, page: 1 }))}
            className="px-3 py-2 text-xs font-semibold bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200"
          >
            <option value="semua">Semua Asrama</option>
            <optgroup label="Asrama Putra (Banin)">
              {asramas.filter((a) => a.kelompokGender === 'Putra').map((a) => (
                <option key={a.id} value={a.id}>{a.nama}</option>
              ))}
            </optgroup>
            <optgroup label="Asrama Putri (Banat)">
              {asramas.filter((a) => a.kelompokGender === 'Putri').map((a) => (
                <option key={a.id} value={a.id}>{a.nama}</option>
              ))}
            </optgroup>
          </select>

          {/* Status Santri */}
          <select
            value={filters.status || 'semua'}
            onChange={(e) => setFilters((prev) => ({ ...prev, status: e.target.value, page: 1 }))}
            className="px-3 py-2 text-xs font-medium bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-300"
          >
            <option value="semua">Semua Status</option>
            <option value="aktif">Aktif di Pondok</option>
            <option value="izin_pulang">Sedang Izin Pulang</option>
            <option value="alpa">Alpa / Belum Kembali</option>
            <option value="skorsing">Dalam Skorsing</option>
            <option value="lulus">Alumni / Lulus</option>
          </select>

          {/* Tampilan Tersimpan (Saved Views Dropdown) */}
          <div className="relative group">
            <select
              onChange={(e) => {
                const targetView = savedViews.find((v) => v.id === e.target.value);
                if (targetView) handleApplyView(targetView);
              }}
              defaultValue=""
              className="px-3 py-2 text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 rounded-lg text-emerald-800 dark:text-emerald-300 cursor-pointer"
            >
              <option value="" disabled>📌 Tampilan Tersimpan</option>
              {savedViews.map((sv) => (
                <option key={sv.id} value={sv.id}>
                  {sv.nama}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={() => setShowSaveViewModal(true)}
            className="flex items-center gap-1 px-2.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 rounded-lg transition-colors"
            title="Simpan Kombinasi Filter Ini Sebagai Tampilan Baru"
          >
            <BookmarkPlus className="w-3.5 h-3.5 text-emerald-600" />
            <span className="hidden xl:inline">Simpan Filter</span>
          </button>

          {/* Toggle Advanced */}
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg border transition-colors ${
              showAdvanced || activeCount > 2
                ? 'bg-emerald-50 text-emerald-800 border-emerald-300 dark:bg-emerald-950/40 dark:border-emerald-700 dark:text-emerald-300'
                : 'bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300'
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Filter Detail</span>
            {activeCount > 0 && (
              <span className="ml-1 w-4 h-4 rounded-full bg-emerald-600 text-white text-[10px] flex items-center justify-center font-bold">
                {activeCount}
              </span>
            )}
          </button>

          {/* Reset Filters */}
          {activeCount > 0 && (
            <button
              onClick={onReset}
              className="flex items-center gap-1 px-2.5 py-2 text-xs font-medium text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-lg"
              title="Reset Semua Filter"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Reset</span>
            </button>
          )}

        </div>

      </div>

      {/* Advanced Filter Row (Collapsible) */}
      {showAdvanced && (
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 animate-in fade-in duration-150">
          
          {/* Kelas / Rombel */}
          <div>
            <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1">
              Rombel / Kelas:
            </label>
            <select
              value={filters.kelas || 'semua'}
              onChange={(e) => setFilters((prev) => ({ ...prev, kelas: e.target.value, page: 1 }))}
              className="w-full px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-300"
            >
              <option value="semua">Semua Kelas</option>
              {availableClasses.length > 0 ? (
                availableClasses.map((cls) => (
                  <option key={cls} value={cls}>{cls}</option>
                ))
              ) : (
                <option value="semua" disabled>Pilih Lembaga terlebih dahulu</option>
              )}
            </select>
          </div>

          {/* Jenis Kelamin */}
          <div>
            <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1">
              Jenis Kelamin:
            </label>
            <select
              value={filters.jenisKelamin || 'semua'}
              onChange={(e) => setFilters((prev) => ({ ...prev, jenisKelamin: e.target.value, page: 1 }))}
              className="w-full px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-300"
            >
              <option value="semua">Semua Gender</option>
              <option value="L">Putra (Banin)</option>
              <option value="P">Putri (Banat)</option>
            </select>
          </div>

          {/* Status SPP */}
          <div>
            <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1">
              Status SPP:
            </label>
            <select
              value={filters.statusSpp || 'semua'}
              onChange={(e) => setFilters((prev) => ({ ...prev, statusSpp: e.target.value, page: 1 }))}
              className="w-full px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-300"
            >
              <option value="semua">Semua SPP</option>
              <option value="lunas">Lunas</option>
              <option value="tunggakan_1_bulan">Tunggakan 1 Bulan</option>
              <option value="tunggakan_2_bulan">Tunggakan 2 Bulan</option>
              <option value="tunggakan_3_bulan_plus">Tunggakan 3+ Bulan</option>
            </select>
          </div>

          {/* Min Juz Hafalan */}
          <div>
            <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1">
              Capaian Hafalan (Min.):
            </label>
            <select
              value={filters.minJuz !== undefined ? String(filters.minJuz) : '0'}
              onChange={(e) => setFilters((prev) => ({ ...prev, minJuz: parseFloat(e.target.value) || undefined, page: 1 }))}
              className="w-full px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-300"
            >
              <option value="0">Semua Capaian</option>
              <option value="5">Minimal 5 Juz</option>
              <option value="10">Minimal 10 Juz</option>
              <option value="15">Minimal 15 Juz</option>
              <option value="30">Khatam 30 Juz</option>
            </select>
          </div>

          {/* Tahun Masuk Filter */}
          <div>
            <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1">
              Tahun Masuk / Angkatan:
            </label>
            <select
              value={filters.tahunMasuk || 'semua'}
              onChange={(e) => setFilters((prev) => ({ ...prev, tahunMasuk: e.target.value, page: 1 }))}
              className="w-full px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-300"
            >
              <option value="semua">Semua Angkatan</option>
              <option value="2026">2026</option>
              <option value="2025">2025</option>
              <option value="2024">2024</option>
              <option value="2023">2023</option>
            </select>
          </div>

          {/* Kota Asal Filter */}
          <div>
            <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1">
              Kota / Kab. Asal:
            </label>
            <input
              type="text"
              value={filters.kotaAsal || ''}
              onChange={(e) => setFilters((prev) => ({ ...prev, kotaAsal: e.target.value, page: 1 }))}
              placeholder="Contoh: Surabaya, Jombang"
              className="w-full px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-300"
            />
          </div>

        </div>
      )}

      {/* FILTER CHIPS ROW: Multi-Kriteria Aktif Yang Bisa Direset Satuan */}
      {activeCount > 0 && (
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center gap-1.5">
          <span className="text-[11px] text-slate-400 font-medium mr-1 flex items-center gap-1">
            <Tag className="w-3 h-3" />
            Filter Aktif:
          </span>

          {filters.search && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
              Kata Kunci: "{filters.search}"
              <button onClick={() => setFilters((p) => ({ ...p, search: '', page: 1 }))} className="hover:text-rose-600">
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          {filters.lembagaId && filters.lembagaId !== 'semua' && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
              Lembaga: {selectedLembaga?.nama || filters.lembagaId}
              <button onClick={() => setFilters((p) => ({ ...p, lembagaId: 'semua', kelas: 'semua', page: 1 }))} className="hover:text-rose-600">
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          {filters.kelas && filters.kelas !== 'semua' && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
              Kelas: {filters.kelas}
              <button onClick={() => setFilters((p) => ({ ...p, kelas: 'semua', page: 1 }))} className="hover:text-rose-600">
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          {filters.asramaId && filters.asramaId !== 'semua' && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] bg-blue-50 dark:bg-blue-950/40 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
              Asrama: {asramas.find((a) => a.id === filters.asramaId)?.nama || filters.asramaId}
              <button onClick={() => setFilters((p) => ({ ...p, asramaId: 'semua', page: 1 }))} className="hover:text-rose-600">
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          {filters.jenisKelamin && filters.jenisKelamin !== 'semua' && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] bg-purple-50 dark:bg-purple-950/40 text-purple-800 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
              Gender: {filters.jenisKelamin === 'L' ? 'Putra' : 'Putri'}
              <button onClick={() => setFilters((p) => ({ ...p, jenisKelamin: 'semua', page: 1 }))} className="hover:text-rose-600">
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          {filters.status && filters.status !== 'semua' && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
              Status: {filters.status}
              <button onClick={() => setFilters((p) => ({ ...p, status: 'semua', page: 1 }))} className="hover:text-rose-600">
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          {filters.statusSpp && filters.statusSpp !== 'semua' && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
              SPP: {filters.statusSpp}
              <button onClick={() => setFilters((p) => ({ ...p, statusSpp: 'semua', page: 1 }))} className="hover:text-rose-600">
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          {filters.minJuz !== undefined && filters.minJuz > 0 && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
              Min. {filters.minJuz} Juz
              <button onClick={() => setFilters((p) => ({ ...p, minJuz: 0, page: 1 }))} className="hover:text-rose-600">
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          {filters.tahunMasuk && filters.tahunMasuk !== 'semua' && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
              Angkatan: {filters.tahunMasuk}
              <button onClick={() => setFilters((p) => ({ ...p, tahunMasuk: 'semua', page: 1 }))} className="hover:text-rose-600">
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          {filters.kotaAsal && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
              Kota: {filters.kotaAsal}
              <button onClick={() => setFilters((p) => ({ ...p, kotaAsal: '', page: 1 }))} className="hover:text-rose-600">
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          <button
            onClick={onReset}
            className="text-[11px] text-rose-600 hover:text-rose-700 font-semibold underline ml-1 cursor-pointer"
          >
            Bersihkan Semua
          </button>
        </div>
      )}

      {/* Result Counter & Active Filter Badge Summary */}
      <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
        <div className="flex items-center gap-1.5">
          <span>Menampilkan</span>
          <strong className="text-slate-900 dark:text-white font-mono tabular-nums">
            {totalFiltered.toLocaleString('id-ID')}
          </strong>
          <span>santri dalam cakupan wewenang</span>
        </div>

        {activeCount > 0 && (
          <div className="text-[11px] text-emerald-700 dark:text-emerald-400 font-medium">
            {activeCount} kriteria filter aktif
          </div>
        )}
      </div>

      {/* MODAL SIMPAN TAMPILAN FILTER */}
      {showSaveViewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-md p-5 shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Bookmark className="w-4 h-4 text-emerald-600" />
                <h4 className="font-bold text-slate-900 dark:text-white text-sm">
                  Simpan Tampilan Filter Ini
                </h4>
              </div>
              <button onClick={() => setShowSaveViewModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveCurrentView} className="pt-4 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Beri Nama Preset Tampilan:
                </label>
                <input
                  type="text"
                  value={newViewName}
                  onChange={(e) => setNewViewName(e.target.value)}
                  placeholder="Misal: Santri Baru MTs Kelas 7A"
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                  autoFocus
                  required
                />
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-lg text-[11px] text-slate-500 space-y-1">
                <div>Kriteria yang akan disimpan:</div>
                <div className="font-semibold text-slate-700 dark:text-slate-300">
                  {activeCount > 0 ? `${activeCount} filter aktif akan dimuat setiap kali Anda memilih preset ini.` : 'Semua data santri tanpa filter.'}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowSaveViewModal(false)}
                  className="px-3 py-1.5 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm"
                >
                  Simpan Preset
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
