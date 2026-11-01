import React from 'react';
import { 
  Eye, 
  Edit3, 
  Trash2, 
  Phone, 
  MapPin, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  XCircle, 
  Printer,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown
} from 'lucide-react';
import type { Santri, FilterParams, UserSession } from '../types/index.ts';

interface SantriTableProps {
  data: Santri[];
  loading: boolean;
  total: number;
  page: number;
  totalPages: number;
  limit: number;
  filters: FilterParams;
  setFilters: React.Dispatch<React.SetStateAction<FilterParams>>;
  selectedIds: string[];
  setSelectedIds: React.Dispatch<React.SetStateAction<string[]>>;
  onViewDetail: (santri: Santri) => void;
  onEditSantri: (santri: Santri) => void;
  onDeleteSantri: (id: string, nama: string) => void;
  onPrintCard: (santri: Santri) => void;
  onOpenBatchStatus: () => void;
  currentUser?: UserSession | null;
}

export const SantriTable: React.FC<SantriTableProps> = ({
  data,
  loading,
  total,
  page,
  totalPages,
  limit,
  filters,
  setFilters,
  selectedIds,
  setSelectedIds,
  onViewDetail,
  onEditSantri,
  onDeleteSantri,
  onPrintCard,
  onOpenBatchStatus,
  currentUser,
}) => {
  const isViewer = currentUser?.role === 'viewer';
  const isAllSelected = data.length > 0 && data.every((s) => selectedIds.includes(s.id));

  const toggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedIds([]);
    } else {
      setSelectedIds(data.map((s) => s.id));
    }
  };

  const toggleSelectOne = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSort = (field: string) => {
    setFilters((prev) => ({
      ...prev,
      sortField: field,
      sortDir: prev.sortField === field && prev.sortDir === 'asc' ? 'desc' : 'asc',
      page: 1,
    }));
  };

  // Status visual mapping (Anti-pill clean text & icons)
  const renderStatus = (status: string) => {
    switch (status) {
      case 'aktif':
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Aktif</span>
          </span>
        );
      case 'izin_pulang':
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-700 dark:text-amber-400">
            <Clock className="w-3.5 h-3.5" />
            <span>Izin Pulang</span>
          </span>
        );
      case 'alpa':
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-rose-700 dark:text-rose-400">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Alpa</span>
          </span>
        );
      case 'skorsing':
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-purple-700 dark:text-purple-400">
            <XCircle className="w-3.5 h-3.5" />
            <span>Skorsing</span>
          </span>
        );
      default:
        return <span className="text-xs text-slate-600 dark:text-slate-400 capitalize">{status}</span>;
    }
  };

  const renderSpp = (spp: string) => {
    if (spp === 'lunas') {
      return <span className="text-xs text-emerald-600 font-medium">Lunas</span>;
    }
    if (spp === 'tunggakan_1_bulan') {
      return <span className="text-xs text-amber-600 font-medium">Nunggak 1 Bln</span>;
    }
    if (spp === 'tunggakan_2_bulan') {
      return <span className="text-xs text-orange-600 font-medium">Nunggak 2 Bln</span>;
    }
    return <span className="text-xs text-rose-600 font-bold">Nunggak 3+ Bln</span>;
  };

  return (
    <div className="space-y-3">
      
      {/* Batch Action Floating Toolbar when items are selected */}
      {selectedIds.length > 0 && (
        <div className="bg-emerald-900 text-white px-4 py-2.5 rounded-xl shadow-md flex items-center justify-between gap-3 animate-in slide-in-from-top duration-150">
          <div className="flex items-center gap-2 text-xs sm:text-sm font-medium">
            <span className="w-6 h-6 rounded-full bg-emerald-700 flex items-center justify-center font-bold">
              {selectedIds.length}
            </span>
            <span>Santri Dipilih</span>
          </div>

          <div className="flex items-center gap-2">
            {!isViewer && (
              <button
                onClick={onOpenBatchStatus}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold transition-colors"
              >
                Ubah Status Massal
              </button>
            )}
            <button
              onClick={() => setSelectedIds([])}
              className="px-2.5 py-1.5 text-xs text-emerald-200 hover:text-white"
            >
              Batal
            </button>
          </div>
        </div>
      )}

      {/* 1. Mobile Cards View (< 768px) */}
      <div className="block md:hidden space-y-3">
        {loading ? (
          [...Array(4)].map((_, i) => (
            <div key={i} className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 animate-pulse h-36" />
          ))
        ) : data.length === 0 ? (
          <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
            <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Tidak ada santri yang sesuai kriteria pencarian.</p>
          </div>
        ) : (
          data.map((s) => (
            <div
              key={s.id}
              className="p-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(s.id)}
                    onChange={() => toggleSelectOne(s.id)}
                    className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
                  />
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono text-xs font-semibold text-slate-500 dark:text-slate-400">
                        {s.nis}
                      </span>
                      <span className="text-[10px] text-slate-400">·</span>
                      <span className="text-xs font-medium text-slate-600 dark:text-slate-300">
                        {s.jenisKelamin === 'L' ? 'Putra' : 'Putri'}
                      </span>
                    </div>
                    <h4 className="font-bold text-slate-900 dark:text-white text-sm mt-0.5">
                      {s.namaLengkap}
                    </h4>
                  </div>
                </div>

                <div>{renderStatus(s.status)}</div>
              </div>

              {/* Sub-details */}
              <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-800/80 text-xs text-slate-600 dark:text-slate-300 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Jenjang & Kelas:</span>
                  <span className="font-medium">{s.jenjang} · {s.kelas}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Asrama / Kamar:</span>
                  <span className="font-medium truncate max-w-[200px]">{s.asrama}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Hafalan Al-Qur'an:</span>
                  <span className="font-mono font-semibold text-emerald-600">
                    {s.capaianJuzHafalan} / {s.targetJuzHafalan} Juz
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Status SPP:</span>
                  <span>{renderSpp(s.statusSpp)}</span>
                </div>
              </div>

              {/* Action buttons */}
              <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2">
                <button
                  onClick={() => onViewDetail(s)}
                  className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 rounded-lg hover:bg-slate-200"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Detail</span>
                </button>
                {!isViewer && (
                  <button
                    onClick={() => onEditSantri(s)}
                    className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 rounded-lg"
                    title="Edit Biodata"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                )}
                <button
                  onClick={() => onPrintCard(s)}
                  className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 rounded-lg"
                  title="Cetak KTS"
                >
                  <Printer className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* 2. Desktop High-Density Table View (>= 768px) */}
      <div className="hidden md:block bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-xs w-full">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 font-semibold select-none">
                <th className="py-3 px-3.5 w-10 text-center">
                  <input
                    type="checkbox"
                    checked={isAllSelected}
                    onChange={toggleSelectAll}
                    className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500 cursor-pointer"
                  />
                </th>
                <th 
                  onClick={() => handleSort('nis')}
                  className="py-3 px-3 cursor-pointer hover:text-slate-900 dark:hover:text-white"
                >
                  <div className="flex items-center gap-1.5">
                    <span>NIS & Santri</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th 
                  onClick={() => handleSort('kelas')}
                  className="py-3 px-3 cursor-pointer hover:text-slate-900 dark:hover:text-white"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Jenjang / Kelas</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th 
                  onClick={() => handleSort('asrama')}
                  className="py-3 px-3 cursor-pointer hover:text-slate-900 dark:hover:text-white"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Asrama & Kamar</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th 
                  onClick={() => handleSort('capaianJuzHafalan')}
                  className="py-3 px-3 cursor-pointer hover:text-slate-900 dark:hover:text-white"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Hafalan Qur'an</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th 
                  onClick={() => handleSort('status')}
                  className="py-3 px-3 cursor-pointer hover:text-slate-900 dark:hover:text-white"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Status</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th 
                  onClick={() => handleSort('statusSpp')}
                  className="py-3 px-3 cursor-pointer hover:text-slate-900 dark:hover:text-white"
                >
                  <div className="flex items-center gap-1.5">
                    <span>SPP</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th className="py-3 px-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
              {loading ? (
                [...Array(8)].map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={8} className="py-3.5 px-4">
                      <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded w-full" />
                    </td>
                  </tr>
                ))
              ) : data.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500 dark:text-slate-400">
                    Tidak ada data santri yang cocok dengan filter yang dipilih.
                  </td>
                </tr>
              ) : (
                data.map((s) => (
                  <tr 
                    key={s.id}
                    className={`hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors ${
                      selectedIds.includes(s.id) ? 'bg-emerald-50/40 dark:bg-emerald-950/20' : ''
                    }`}
                  >
                    <td className="py-3 px-3.5 text-center">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(s.id)}
                        onChange={() => toggleSelectOne(s.id)}
                        className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500 cursor-pointer"
                      />
                    </td>
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold flex items-center justify-center shrink-0 uppercase text-xs">
                          {s.namaLengkap.charAt(0)}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                              {s.nis}
                            </span>
                            <span className="text-[10px] text-slate-300 dark:text-slate-600">·</span>
                            <span className="text-[10px] text-slate-500">
                              {s.jenisKelamin === 'L' ? 'Putra' : 'Putri'}
                            </span>
                          </div>
                          <div className="font-semibold text-slate-900 dark:text-white text-xs truncate max-w-xs xl:max-w-md">
                            {s.namaLengkap}
                          </div>
                          {s.kotaAsal && (
                            <div className="flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400 truncate max-w-xs xl:max-w-sm">
                              <MapPin className="w-2.5 h-2.5" />
                              <span>{s.kotaAsal}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <div className="font-medium text-slate-800 dark:text-slate-200">
                        {s.jenjang}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {s.kelas}
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <div className="text-slate-800 dark:text-slate-200 truncate max-w-xs xl:max-w-sm" title={s.asrama}>
                        {s.asrama}
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2">
                        <div className="w-16 bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
                          <div
                            className="bg-emerald-600 h-full rounded-full"
                            style={{ width: `${Math.min(100, (s.capaianJuzHafalan / s.targetJuzHafalan) * 100)}%` }}
                          />
                        </div>
                        <span className="font-mono text-xs font-semibold tabular-nums text-slate-700 dark:text-slate-300">
                          {s.capaianJuzHafalan} <span className="text-[10px] text-slate-400">/{s.targetJuzHafalan}</span>
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      {renderStatus(s.status)}
                    </td>
                    <td className="py-3 px-3">
                      {renderSpp(s.statusSpp)}
                    </td>
                    <td className="py-3 px-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => onViewDetail(s)}
                          className="p-1.5 text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white rounded-md hover:bg-slate-100 dark:hover:bg-slate-800"
                          title="Lihat Detail Profil & Riwayat"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {!isViewer && (
                          <button
                            onClick={() => onEditSantri(s)}
                            className="p-1.5 text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white rounded-md hover:bg-slate-100 dark:hover:bg-slate-800"
                            title="Edit Biodata"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => onPrintCard(s)}
                          className="p-1.5 text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white rounded-md hover:bg-slate-100 dark:hover:bg-slate-800"
                          title="Cetak KTS (Kartu Santri)"
                        >
                          <Printer className="w-4 h-4" />
                        </button>
                        {!isViewer && (
                          <button
                            onClick={() => onDeleteSantri(s.id, s.namaLengkap)}
                            className="p-1.5 text-rose-500 hover:text-rose-700 rounded-md hover:bg-rose-50 dark:hover:bg-rose-950/40"
                            title="Hapus Data"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-2 py-3 text-xs text-slate-500 dark:text-slate-400">
        <div className="flex items-center gap-2">
          <span>Tampilkan</span>
          <select
            value={limit}
            onChange={(e) => setFilters((prev) => ({ ...prev, limit: Number(e.target.value), page: 1 }))}
            className="px-2 py-1 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-md text-slate-700 dark:text-slate-300 font-mono"
          >
            <option value={25}>25</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
            <option value={200}>200</option>
          </select>
          <span>per halaman</span>
        </div>

        <div className="flex items-center gap-2">
          <span>
            Halaman <strong className="font-mono tabular-nums text-slate-900 dark:text-white">{page}</strong> dari{' '}
            <strong className="font-mono tabular-nums text-slate-900 dark:text-white">{totalPages}</strong>
          </span>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setFilters((prev) => ({ ...prev, page: Math.max(1, (prev.page || 1) - 1) }))}
              disabled={page <= 1}
              className="p-1.5 border border-slate-200 dark:border-slate-800 rounded-md disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-slate-800"
              title="Halaman Sebelumnya"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setFilters((prev) => ({ ...prev, page: Math.min(totalPages, (prev.page || 1) + 1) }))}
              disabled={page >= totalPages}
              className="p-1.5 border border-slate-200 dark:border-slate-800 rounded-md disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-slate-800"
              title="Halaman Selanjutnya"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

    </div>
  );
};
