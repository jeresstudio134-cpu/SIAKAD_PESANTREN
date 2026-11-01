import React, { useState, useEffect } from 'react';
import { 
  X, 
  GraduationCap, 
  ArrowRight, 
  Users, 
  CheckCircle2, 
  AlertTriangle, 
  RotateCcw, 
  Calendar, 
  Building2, 
  Home, 
  Search, 
  Check, 
  Sparkles,
  Info,
  Clock,
  ArrowUpDown,
  SlidersHorizontal,
  ChevronRight
} from 'lucide-react';
import type { TahunAjaran, Lembaga, KenaikanKelasPreviewItem, ProsesKenaikanKelasLog } from '../types/index.ts';
import { authFetch } from '../utils/api.ts';

interface NaikKelasModalProps {
  isOpen: boolean;
  onClose: () => void;
  tahunAjarans: TahunAjaran[];
  lembagas: Lembaga[];
  onSuccess: () => void;
}

export const NaikKelasModal: React.FC<NaikKelasModalProps> = ({
  isOpen,
  onClose,
  tahunAjarans,
  lembagas,
  onSuccess,
}) => {
  const [activeTab, setActiveTab] = useState<'proses' | 'riwayat'>('proses');

  // Form Parameters
  const activeTA = tahunAjarans.find((t) => t.isActive === 1);
  const inactiveTAs = tahunAjarans.filter((t) => t.isActive === 0);

  const [fromTahunAjaranId, setFromTahunAjaranId] = useState<string>(activeTA ? activeTA.id : (tahunAjarans[0]?.id || ''));
  const [toTahunAjaranId, setToTahunAjaranId] = useState<string>(inactiveTAs[0]?.id || (tahunAjarans[1]?.id || ''));
  const [selectedLembagaId, setSelectedLembagaId] = useState<string>('semua');
  const [salinKamar, setSalinKamar] = useState<boolean>(true);

  // Preview State
  const [loadingPreview, setLoadingPreview] = useState<boolean>(false);
  const [hasPreviewed, setHasPreviewed] = useState<boolean>(false);
  const [items, setItems] = useState<KenaikanKelasPreviewItem[]>([]);
  const [availableClassesMap, setAvailableClassesMap] = useState<Record<string, string[]>>({});
  
  // Table Filtering & Search
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [actionFilter, setActionFilter] = useState<string>('semua');

  // Execution State
  const [executing, setExecuting] = useState<boolean>(false);
  const [confirmModalOpen, setConfirmModalOpen] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // History State
  const [historyList, setHistoryList] = useState<ProsesKenaikanKelasLog[]>([]);
  const [loadingHistory, setLoadingHistory] = useState<boolean>(false);
  const [rollingBackId, setRollingBackId] = useState<string | null>(null);

  // Master Kamar List for Room Editing
  const [allKamars, setAllKamars] = useState<Array<{
    id: string;
    namaKamar: string;
    asramaId: string;
    asramaNama: string;
    asramaGender: string;
  }>>([]);

  // Sync initial select values when list loads
  useEffect(() => {
    if (activeTA && !fromTahunAjaranId) {
      setFromTahunAjaranId(activeTA.id);
    }
    if (inactiveTAs.length > 0 && (!toTahunAjaranId || toTahunAjaranId === fromTahunAjaranId)) {
      setToTahunAjaranId(inactiveTAs[0].id);
    }
  }, [tahunAjarans]);

  useEffect(() => {
    if (isOpen) {
      fetchHistory();
      fetchKamars();
      setSuccessMessage(null);
      setErrorMessage(null);
    }
  }, [isOpen]);

  const fetchKamars = async () => {
    try {
      const res = await authFetch('/api/master/kamar');
      const json = await res.json();
      if (json.data) {
        setAllKamars(json.data);
      }
    } catch (e) {
      console.error('Error fetching kamars:', e);
    }
  };

  const fetchHistory = async () => {
    try {
      setLoadingHistory(true);
      const res = await authFetch('/api/naik-kelas/history');
      const json = await res.json();
      if (json.data) {
        setHistoryList(json.data);
      }
    } catch (e) {
      console.error('Error fetching history:', e);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleToggleSalinKamar = (copy: boolean) => {
    setSalinKamar(copy);
    setItems((prev) =>
      prev.map((it) => ({
        ...it,
        targetKamarId: copy ? (it.currentKamarId || '') : '',
        targetKamarNama: copy ? (it.currentKamarNama || '') : '',
      }))
    );
  };

  const handleFetchPreview = async () => {
    if (!fromTahunAjaranId || !toTahunAjaranId) {
      setErrorMessage('Pilih Tahun Ajaran Asal dan Tujuan terlebih dahulu.');
      return;
    }
    if (fromTahunAjaranId === toTahunAjaranId) {
      setErrorMessage('Tahun ajaran tujuan tidak boleh sama dengan tahun ajaran asal.');
      return;
    }

    try {
      setLoadingPreview(true);
      setErrorMessage(null);
      setSuccessMessage(null);

      const params = new URLSearchParams({
        fromTahunAjaranId,
        toTahunAjaranId,
        lembagaId: selectedLembagaId,
      });

      const res = await authFetch(`/api/naik-kelas/preview?${params.toString()}`);
      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.error || 'Gagal memuat preview kenaikan kelas');
      }

      setItems(json.items || []);
      setHasPreviewed(true);

      // Build map of available classes per lembaga
      const clsMap: Record<string, string[]> = {};
      lembagas.forEach((l) => {
        clsMap[l.id] = l.tingkatKelas;
      });
      setAvailableClassesMap(clsMap);
    } catch (err: any) {
      setErrorMessage(err.message || 'Terjadi kesalahan sistem saat memuat preview');
    } finally {
      setLoadingPreview(false);
    }
  };

  // Modify individual student in preview
  const handleItemChange = (index: number, updates: Partial<KenaikanKelasPreviewItem>) => {
    setItems((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], ...updates };
      return next;
    });
  };

  // Bulk Presets
  const handleBulkSetAllPromote = () => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.isTingkatAkhir) {
          return { ...item, targetAction: 'lulus', targetKelas: 'Lulus / Alumni' };
        }
        return { ...item, targetAction: 'naik_kelas' };
      })
    );
  };

  const handleBulkSetAllRepeat = () => {
    setItems((prev) =>
      prev.map((item) => ({
        ...item,
        targetAction: 'tinggal_kelas',
        targetKelas: item.currentKelas,
      }))
    );
  };

  // Execute Confirmation
  const handleExecute = async () => {
    setConfirmModalOpen(false);
    setExecuting(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const payload = {
        fromTahunAjaranId,
        toTahunAjaranId,
        lembagaId: selectedLembagaId,
        salinKamar,
        items: items.map((it) => ({
          santriId: it.santriId,
          targetAction: it.targetAction,
          targetKelas: it.targetKelas,
          targetKamarId: it.targetKamarId,
        })),
      };

      const res = await authFetch('/api/naik-kelas/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || 'Gagal memproses kenaikan kelas');
      }

      setSuccessMessage(json.message || 'Proses kenaikan kelas berhasil disimpan!');
      setHasPreviewed(false);
      setItems([]);
      fetchHistory();
      onSuccess();
    } catch (err: any) {
      setErrorMessage(err.message || 'Gagal memproses');
    } finally {
      setExecuting(false);
    }
  };

  // Rollback Execution
  const handleRollback = async (processId: string) => {
    if (!window.confirm('Apakah Anda yakin ingin membatalkan proses kenaikan kelas ini? Semua data riwayat dan penempatan kamar untuk tahun ajaran tujuan pada batch ini akan dihapus.')) {
      return;
    }

    try {
      setRollingBackId(processId);
      setErrorMessage(null);

      const res = await authFetch(`/api/naik-kelas/rollback/${processId}`, {
        method: 'POST',
      });
      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.error || 'Gagal membatalkan proses');
      }

      setSuccessMessage(json.message || 'Proses berhasil dibatalkan');
      fetchHistory();
      onSuccess();
    } catch (err: any) {
      setErrorMessage(err.message || 'Gagal membatalkan proses');
    } finally {
      setRollingBackId(null);
    }
  };

  if (!isOpen) return null;

  // Filtered preview items
  const filteredItems = items.filter((item) => {
    const matchSearch =
      searchQuery.trim() === '' ||
      item.namaLengkap.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.nis.includes(searchQuery);

    const matchAction =
      actionFilter === 'semua' || item.targetAction === actionFilter;

    return matchSearch && matchAction;
  });

  const totalPreviewNaik = items.filter((i) => i.targetAction === 'naik_kelas').length;
  const totalPreviewTinggal = items.filter((i) => i.targetAction === 'tinggal_kelas').length;
  const totalPreviewLulus = items.filter((i) => i.targetAction === 'lulus').length;

  const fromTAName = tahunAjarans.find((t) => t.id === fromTahunAjaranId)?.nama || fromTahunAjaranId;
  const toTAName = tahunAjarans.find((t) => t.id === toTahunAjaranId)?.nama || toTahunAjaranId;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 w-full max-w-5xl rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[92vh] overflow-hidden">
        
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-600/20">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  Proses Akhir Tahun & Kenaikan Kelas Massal
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                  Otomasi Riwayat
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Otomatisasi kenaikan kelas, kelulusan tingkat akhir, dan salin kamar tanpa menimpa data lama
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Nav Tabs */}
            <div className="flex items-center p-1 bg-slate-200/70 dark:bg-slate-800 rounded-lg text-xs font-semibold">
              <button
                onClick={() => setActiveTab('proses')}
                className={`px-3 py-1.5 rounded-md transition-colors ${
                  activeTab === 'proses'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                Proses Kenaikan
              </button>
              <button
                onClick={() => setActiveTab('riwayat')}
                className={`px-3 py-1.5 rounded-md transition-colors ${
                  activeTab === 'riwayat'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                Riwayat & Batalkan
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors ml-2"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Notifications */}
        {errorMessage && (
          <div className="px-6 py-2.5 bg-rose-50 dark:bg-rose-950/40 border-b border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
            <button onClick={() => setErrorMessage(null)} className="font-bold underline text-[11px]">Tutup</button>
          </div>
        )}

        {successMessage && (
          <div className="px-6 py-2.5 bg-emerald-50 dark:bg-emerald-950/40 border-b border-emerald-200 dark:border-emerald-900 text-emerald-700 dark:text-emerald-300 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{successMessage}</span>
            </div>
            <button onClick={() => setSuccessMessage(null)} className="font-bold underline text-[11px]">Tutup</button>
          </div>
        )}

        {/* Main Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">

          {/* TAB 1: PROSES KENAIKAN KELAS */}
          {activeTab === 'proses' && (
            <div className="space-y-6">
              
              {/* Form Parameter Pemilihan */}
              <div className="p-4 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-xl space-y-4">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300">
                  <SlidersHorizontal className="w-4 h-4 text-indigo-600" />
                  <span>1. Pilih Parameter Tahun Ajaran & Lembaga</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                  {/* From TA */}
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      Tahun Ajaran Asal*:
                    </label>
                    <select
                      value={fromTahunAjaranId}
                      onChange={(e) => setFromTahunAjaranId(e.target.value)}
                      className="w-full text-xs font-medium px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                    >
                      {tahunAjarans.map((ta) => (
                        <option key={ta.id} value={ta.id}>
                          {ta.nama} ({ta.semester}) {ta.isActive ? '• [AKTIF]' : ''}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* To TA */}
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      Tahun Ajaran Tujuan*:
                    </label>
                    <select
                      value={toTahunAjaranId}
                      onChange={(e) => setToTahunAjaranId(e.target.value)}
                      className="w-full text-xs font-semibold px-3 py-2 rounded-lg border border-indigo-300 dark:border-indigo-700 bg-white dark:bg-slate-800 text-indigo-900 dark:text-indigo-200 focus:ring-2 focus:ring-indigo-500"
                    >
                      {tahunAjarans.map((ta) => (
                        <option key={ta.id} value={ta.id}>
                          {ta.nama} ({ta.semester}) {ta.isActive ? '• [AKTIF]' : '• [Mendatang/Rencana]'}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Lembaga */}
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      Filter Lembaga:
                    </label>
                    <select
                      value={selectedLembagaId}
                      onChange={(e) => setSelectedLembagaId(e.target.value)}
                      className="w-full text-xs font-medium px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="semua">Semua Lembaga (SD, SMP, SMA, SMK, Ngaji, Diniyah)</option>
                      {lembagas.map((l) => (
                        <option key={l.id} value={l.id}>
                          {l.nama} ({l.kode})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Option: Salin Kamar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-slate-200 dark:border-slate-700/60">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={salinKamar}
                      onChange={(e) => handleToggleSalinKamar(e.target.checked)}
                      className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                    />
                    <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                      Salin penempatan kamar dari tahun sebelumnya (santri tetap di asrama & kamar yang sama, bisa disesuaikan di tabel)
                    </span>
                  </label>

                  <button
                    onClick={handleFetchPreview}
                    disabled={loadingPreview}
                    className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors disabled:opacity-50 shrink-0"
                  >
                    {loadingPreview ? (
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <Sparkles className="w-3.5 h-3.5" />
                    )}
                    <span>Tampilkan Preview Kenaikan Kelas</span>
                  </button>
                </div>
              </div>

              {/* Preview Section */}
              {hasPreviewed && (
                <div className="space-y-4 animate-in fade-in">
                  
                  {/* Summary Metric Cards */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="p-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-xl">
                      <span className="text-[11px] font-medium text-slate-500 block">Total Santri Diproses</span>
                      <span className="text-xl font-bold font-mono text-slate-900 dark:text-white tabular-nums">
                        {items.length}
                      </span>
                    </div>

                    <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-xl">
                      <span className="text-[11px] font-medium text-emerald-700 dark:text-emerald-400 block">Naik Kelas</span>
                      <span className="text-xl font-bold font-mono text-emerald-800 dark:text-emerald-300 tabular-nums">
                        {totalPreviewNaik}
                      </span>
                    </div>

                    <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl">
                      <span className="text-[11px] font-medium text-amber-700 dark:text-amber-400 block">Tinggal Kelas</span>
                      <span className="text-xl font-bold font-mono text-amber-800 dark:text-amber-300 tabular-nums">
                        {totalPreviewTinggal}
                      </span>
                    </div>

                    <div className="p-3 bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800 rounded-xl">
                      <span className="text-[11px] font-medium text-indigo-700 dark:text-indigo-400 block">Lulus / Alumni</span>
                      <span className="text-xl font-bold font-mono text-indigo-800 dark:text-indigo-300 tabular-nums">
                        {totalPreviewLulus}
                      </span>
                    </div>
                  </div>

                  {/* Toolbar & Filter Table */}
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 pt-2">
                    <div className="flex items-center gap-2 flex-1">
                      <div className="relative flex-1 max-w-xs">
                        <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                          type="text"
                          placeholder="Cari santri dalam preview..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                        />
                      </div>

                      <select
                        value={actionFilter}
                        onChange={(e) => setActionFilter(e.target.value)}
                        className="text-xs px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                      >
                        <option value="semua">Semua Aksi</option>
                        <option value="naik_kelas">Naik Kelas ({totalPreviewNaik})</option>
                        <option value="tinggal_kelas">Tinggal Kelas ({totalPreviewTinggal})</option>
                        <option value="lulus">Lulus / Alumni ({totalPreviewLulus})</option>
                      </select>
                    </div>

                    {/* Bulk Presets */}
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={handleBulkSetAllPromote}
                        className="px-2.5 py-1.5 text-[11px] font-semibold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:text-emerald-300 rounded-lg border border-emerald-200 dark:border-emerald-800 transition-colors"
                      >
                        Set Semua Naik Kelas
                      </button>
                      <button
                        type="button"
                        onClick={handleBulkSetAllRepeat}
                        className="px-2.5 py-1.5 text-[11px] font-semibold bg-amber-50 text-amber-700 hover:bg-amber-100 dark:bg-amber-950/60 dark:text-amber-300 rounded-lg border border-amber-200 dark:border-amber-800 transition-colors"
                      >
                        Set Semua Tinggal Kelas
                      </button>
                    </div>
                  </div>

                  {/* Editable Preview Table */}
                  <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-xs">
                    <div className="max-h-[380px] overflow-y-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="sticky top-0 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold border-b border-slate-200 dark:border-slate-700 z-10">
                          <tr>
                            <th className="px-3 py-2.5 w-12 text-center">No</th>
                            <th className="px-3 py-2.5">Santri</th>
                            <th className="px-3 py-2.5">Kelas Asal ({fromTAName})</th>
                            <th className="px-3 py-2.5">Rekomendasi Aksi</th>
                            <th className="px-3 py-2.5">Kelas Tujuan ({toTAName})</th>
                            <th className="px-3 py-2.5">Kamar Tujuan</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                          {filteredItems.length === 0 ? (
                            <tr>
                              <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                                Tidak ada santri yang sesuai filter.
                              </td>
                            </tr>
                          ) : (
                            filteredItems.map((item, idx) => {
                              // Find actual index in main items array
                              const realIdx = items.findIndex((i) => i.santriId === item.santriId);
                              const availableCls = item.availableClasses || availableClassesMap[item.lembagaId] || [];

                              return (
                                <tr
                                  key={item.santriId}
                                  className={`hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors ${
                                    item.targetAction === 'lulus' ? 'bg-indigo-50/30 dark:bg-indigo-950/10' : ''
                                  }`}
                                >
                                  <td className="px-3 py-2 text-center text-slate-400 font-mono text-[11px]">
                                    {idx + 1}
                                  </td>

                                  <td className="px-3 py-2">
                                    <div className="font-semibold text-slate-900 dark:text-white">
                                      {item.namaLengkap}
                                    </div>
                                    <div className="text-[11px] text-slate-500 font-mono">
                                      NIS: {item.nis} • {item.jenisKelamin === 'L' ? 'Putra' : 'Putri'}
                                    </div>
                                  </td>

                                  <td className="px-3 py-2">
                                    <div className="font-medium text-slate-800 dark:text-slate-200">
                                      {item.currentKelas}
                                    </div>
                                    <div className="text-[10px] text-slate-500">
                                      {item.lembagaNama}
                                    </div>
                                  </td>

                                  {/* Action Selector */}
                                  <td className="px-3 py-2">
                                    <select
                                      value={item.targetAction}
                                      onChange={(e) => {
                                        const action = e.target.value as any;
                                        let targetKelas = item.targetKelas;
                                        if (action === 'lulus') targetKelas = 'Lulus / Alumni';
                                        else if (action === 'tinggal_kelas') targetKelas = item.currentKelas;
                                        handleItemChange(realIdx, { targetAction: action, targetKelas });
                                      }}
                                      className={`text-xs font-semibold px-2 py-1 rounded-md border ${
                                        item.targetAction === 'naik_kelas'
                                          ? 'border-emerald-300 bg-emerald-50 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                          : item.targetAction === 'tinggal_kelas'
                                          ? 'border-amber-300 bg-amber-50 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                                          : item.targetAction === 'lulus'
                                          ? 'border-indigo-300 bg-indigo-50 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300'
                                          : 'border-slate-300 bg-slate-50 text-slate-800'
                                      }`}
                                    >
                                      <option value="naik_kelas">Naik Kelas</option>
                                      <option value="tinggal_kelas">Tinggal Kelas</option>
                                      <option value="lulus">Lulus / Alumni</option>
                                      <option value="mutasi">Mutasi / Keluar</option>
                                    </select>
                                  </td>

                                  {/* Target Class Selection */}
                                  <td className="px-3 py-2">
                                    {item.targetAction === 'lulus' ? (
                                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300">
                                        <GraduationCap className="w-3 h-3" />
                                        <span>Lulus / Alumni</span>
                                      </span>
                                    ) : item.targetAction === 'mutasi' ? (
                                      <span className="text-slate-400 italic text-[11px]">Non-aktif (Mutasi)</span>
                                    ) : (
                                      <select
                                        value={item.targetKelas}
                                        onChange={(e) => handleItemChange(realIdx, { targetKelas: e.target.value })}
                                        className="text-xs px-2 py-1 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-medium"
                                      >
                                        {/* Include current class if not in availableCls list */}
                                        {!availableCls.includes(item.targetKelas) && (
                                          <option value={item.targetKelas}>{item.targetKelas}</option>
                                        )}
                                        {availableCls.map((cName: string) => (
                                          <option key={cName} value={cName}>
                                            {cName}
                                          </option>
                                        ))}
                                      </select>
                                    )}
                                  </td>

                                  {/* Target Room (Salin kamar opsional, bisa diedit) */}
                                  <td className="px-3 py-2 text-slate-600 dark:text-slate-400 text-[11px]">
                                    {item.targetAction === 'lulus' ? (
                                      <span className="text-slate-400 italic text-[11px]">- (Lulus/Alumni)</span>
                                    ) : item.targetAction === 'mutasi' ? (
                                      <span className="text-slate-400 italic text-[11px]">- (Mutasi)</span>
                                    ) : (
                                      <div className="flex items-center gap-1.5">
                                        <Home className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                        <select
                                          value={item.targetKamarId || ''}
                                          onChange={(e) => {
                                            const selKamarId = e.target.value;
                                            const chosenKamar = allKamars.find((k) => k.id === selKamarId);
                                            handleItemChange(realIdx, {
                                              targetKamarId: selKamarId,
                                              targetKamarNama: chosenKamar ? `${chosenKamar.asramaNama} - ${chosenKamar.namaKamar}` : '',
                                            });
                                          }}
                                          className="text-xs px-2 py-1 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-medium max-w-[210px] truncate"
                                          title="Pilih atau sesuaikan kamar santri untuk tahun ajaran baru"
                                        >
                                          <option value="">-- Dikosongkan --</option>
                                          {item.currentKamarId && !allKamars.some((k) => k.id === item.currentKamarId) && (
                                            <option value={item.currentKamarId}>
                                              {item.currentKamarNama || 'Kamar Sebelumnya'}
                                            </option>
                                          )}
                                          {allKamars
                                            .filter((k) => k.asramaGender === (item.jenisKelamin === 'L' ? 'Putra' : 'Putri'))
                                            .map((k) => (
                                              <option key={k.id} value={k.id}>
                                                {k.asramaNama} - {k.namaKamar}
                                              </option>
                                            ))}
                                        </select>
                                      </div>
                                    )}
                                  </td>
                                </tr>
                              );
                            })
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Execution Action Footer */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800 rounded-xl">
                    <div className="flex items-start gap-2 text-xs text-indigo-900 dark:text-indigo-300">
                      <Info className="w-4 h-4 shrink-0 text-indigo-600 mt-0.5" />
                      <div>
                        <span className="font-bold">Keamanan & Kebijakan Data:</span>
                        <p className="text-[11px] text-indigo-700 dark:text-indigo-400">
                          Data disimpan ke tabel <code>riwayat_akademik</code> tahun {toTAName}. Data tahun {fromTAName} tetap utuh sebagai riwayat.
                          Proses ini dapat dibatalkan sewaktu-waktu selama tahun ajaran {toTAName} belum aktif.
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => setConfirmModalOpen(true)}
                      disabled={executing || items.length === 0}
                      className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-600/20 transition-all disabled:opacity-50 shrink-0"
                    >
                      {executing ? (
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <Check className="w-4 h-4" />
                      )}
                      <span>Konfirmasi & Buat Data Tahun Baru ({items.length} Santri)</span>
                    </button>
                  </div>

                </div>
              )}

            </div>
          )}

          {/* TAB 2: RIWAYAT & PEMBATALAN */}
          {activeTab === 'riwayat' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Riwayat Kenaikan Kelas & Rollback
                  </h3>
                  <p className="text-xs text-slate-500">
                    Daftar proses kenaikan kelas yang pernah dijalankan. Anda dapat membatalkan proses selama tahun ajaran tujuan belum dijadikan tahun aktif.
                  </p>
                </div>

                <button
                  onClick={fetchHistory}
                  disabled={loadingHistory}
                  className="p-1.5 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-xs"
                >
                  <RotateCcw className={`w-4 h-4 ${loadingHistory ? 'animate-spin' : ''}`} />
                </button>
              </div>

              {loadingHistory ? (
                <div className="py-12 text-center text-slate-400 text-xs">
                  Memuat data riwayat...
                </div>
              ) : historyList.length === 0 ? (
                <div className="py-12 text-center text-slate-400 text-xs border border-dashed rounded-xl">
                  Belum ada riwayat proses kenaikan kelas massal.
                </div>
              ) : (
                <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold border-b">
                      <tr>
                        <th className="px-3.5 py-2.5">Waktu Eksekusi</th>
                        <th className="px-3.5 py-2.5">Dari $\to$ Ke Tahun Ajaran</th>
                        <th className="px-3.5 py-2.5">Lembaga</th>
                        <th className="px-3.5 py-2.5">Statistik Santri</th>
                        <th className="px-3.5 py-2.5">Status</th>
                        <th className="px-3.5 py-2.5 text-right">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {historyList.map((log) => (
                        <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                          <td className="px-3.5 py-3 text-slate-500 font-mono text-[11px]">
                            {new Date(log.createdAt).toLocaleDateString('id-ID', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </td>

                          <td className="px-3.5 py-3">
                            <div className="flex items-center gap-1.5 font-semibold text-slate-900 dark:text-white">
                              <span>{log.fromTahunAjaranNama}</span>
                              <ArrowRight className="w-3 h-3 text-slate-400" />
                              <span className="text-indigo-600 dark:text-indigo-400">{log.toTahunAjaranNama}</span>
                            </div>
                          </td>

                          <td className="px-3.5 py-3 text-slate-600 dark:text-slate-400">
                            {log.lembagaNama}
                          </td>

                          <td className="px-3.5 py-3">
                            <div className="flex items-center gap-2 font-mono text-[11px]">
                              <span className="text-slate-800 dark:text-slate-200 font-bold">{log.totalSantri} Santri</span>
                              <span>(</span>
                              <span className="text-emerald-600 font-medium">+{log.totalNaik} naik</span>
                              <span>•</span>
                              <span className="text-amber-600 font-medium">{log.totalTinggal} tetap</span>
                              <span>•</span>
                              <span className="text-indigo-600 font-medium">{log.totalLulus} lulus</span>
                              <span>)</span>
                            </div>
                          </td>

                          <td className="px-3.5 py-3">
                            {log.status === 'selesai' ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                                <CheckCircle2 className="w-3 h-3" />
                                <span>Selesai</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                                <span>Dibatalkan</span>
                              </span>
                            )}
                          </td>

                          <td className="px-3.5 py-3 text-right">
                            {log.status === 'selesai' && (
                              log.canRollback ? (
                                <button
                                  onClick={() => handleRollback(log.id)}
                                  disabled={rollingBackId === log.id}
                                  className="px-2.5 py-1 text-[11px] font-semibold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/60 dark:text-rose-300 rounded-md border border-rose-200 dark:border-rose-800 transition-colors inline-flex items-center gap-1"
                                >
                                  {rollingBackId === log.id ? (
                                    <div className="w-3 h-3 border-2 border-rose-400 border-t-rose-600 rounded-full animate-spin" />
                                  ) : (
                                    <RotateCcw className="w-3 h-3" />
                                  )}
                                  <span>Batalkan Proses</span>
                                </button>
                              ) : (
                                <span className="text-[10px] text-slate-400 italic" title="Tahun ajaran tujuan sudah aktif">
                                  Terkunci (Tahun Aktif)
                                </span>
                              )
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex items-center justify-between">
          <div className="text-xs text-slate-500">
            {activeTab === 'proses' && items.length > 0 && (
              <span>Menampilkan {filteredItems.length} dari {items.length} santri</span>
            )}
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 text-slate-800 dark:text-slate-200 rounded-lg text-xs font-semibold transition-colors"
          >
            Tutup
          </button>
        </div>

      </div>

      {/* Confirmation Dialog */}
      {confirmModalOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-xl p-5 max-w-md w-full border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0">
                <GraduationCap className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-slate-900 dark:text-white text-sm">
                  Konfirmasi Proses Kenaikan Kelas
                </h4>
                <p className="text-xs text-slate-500">
                  Periksa kembali ringkasan sebelum membuat data riwayat baru:
                </p>
              </div>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-lg text-xs space-y-1.5 font-medium">
              <div className="flex justify-between">
                <span className="text-slate-500">Tahun Ajaran Asal:</span>
                <span className="font-bold">{fromTAName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Tahun Ajaran Tujuan:</span>
                <span className="font-bold text-indigo-600">{toTAName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Total Santri:</span>
                <span className="font-bold">{items.length} santri</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Naik Kelas:</span>
                <span className="font-bold text-emerald-600">{totalPreviewNaik} santri</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Tinggal Kelas:</span>
                <span className="font-bold text-amber-600">{totalPreviewTinggal} santri</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Lulus / Alumni:</span>
                <span className="font-bold text-indigo-600">{totalPreviewLulus} santri</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Salin Kamar:</span>
                <span className="font-bold">{salinKamar ? 'Ya (Disalin Otomatis)' : 'Tidak'}</span>
              </div>
            </div>

            <p className="text-[11px] text-slate-500">
              *Catatan: Selama tahun ajaran {toTAName} belum aktif, seluruh proses ini dapat dibatalkan atau diulang sewaktu-waktu melalui tab Riwayat & Batalkan.
            </p>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setConfirmModalOpen(false)}
                className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-900 rounded-lg font-semibold"
              >
                Batal
              </button>
              <button
                onClick={handleExecute}
                className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm"
              >
                Ya, Konfirmasi & Proses Sekarang
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
