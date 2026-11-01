import React from 'react';
import { Search, X, RotateCcw, SlidersHorizontal, Building2, Home, ShieldCheck, Lock } from 'lucide-react';
import type { FilterParams, Lembaga, Asrama, UserSession } from '../types/index.ts';

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
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 grid grid-cols-2 sm:grid-cols-4 gap-2.5 animate-in fade-in duration-150">
          
          {/* Kelas / Rombel */}
          <div>
            <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1">
              Rombongan Belajar / Kelas:
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
              Capaian Hafalan (Min. Juz):
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

    </div>
  );
};
