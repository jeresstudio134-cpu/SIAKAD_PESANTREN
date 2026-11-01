import React from 'react';
import {
  Download,
  X,
  FileSpreadsheet,
  CheckSquare,
  Square,
  Users,
  UserCheck,
  Home,
  Building2,
  Calendar,
  Filter
} from 'lucide-react';
import type { FilterParams, TahunAjaran } from '../types/index.ts';
import { authFetch } from '../utils/api.ts';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeFilters: FilterParams;
  selectedTahunAjaran?: TahunAjaran;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  activeFilters,
  selectedTahunAjaran,
}) => {
  if (!isOpen) return null;

  const [exportType, setExportType] = React.useState<'santri' | 'staf' | 'kamar' | 'rekap_lembaga'>('santri');
  const [isExporting, setIsExporting] = React.useState(false);

  // Santri Column Selection
  const allSantriCols = [
    { key: 'nis', label: 'NIS (Nomor Induk Santri)' },
    { key: 'nisn', label: 'NISN Kemdikbud/Kemenag' },
    { key: 'nik', label: 'NIK Santri (Kependudukan)' },
    { key: 'namaLengkap', label: 'Nama Lengkap Santri' },
    { key: 'jenisKelamin', label: 'Jenis Kelamin (L/P)' },
    { key: 'jenjang', label: 'Lembaga / Jenjang' },
    { key: 'kelas', label: 'Rombongan Belajar / Kelas' },
    { key: 'asrama', label: 'Gedung Asrama' },
    { key: 'kamarLabel', label: 'Nama / Nomor Kamar' },
    { key: 'status', label: 'Status Keaktifan' },
    { key: 'capaianJuzHafalan', label: 'Capaian Juz Hafalan' },
    { key: 'statusSpp', label: 'Status Pembayaran SPP' },
    { key: 'namaAyah', label: 'Nama Ayah Kandung' },
    { key: 'namaIbu', label: 'Nama Ibu Kandung' },
    { key: 'noHpWali', label: 'Nomor WhatsApp / HP Wali' },
    { key: 'alamatAsal', label: 'Alamat Lengkap Domisili' },
    { key: 'kotaAsal', label: 'Kabupaten / Kota Asal' },
    { key: 'tahunMasuk', label: 'Tahun Masuk Angkatan' },
  ];

  const [selectedSantriCols, setSelectedSantriCols] = React.useState<string[]>([
    'nis',
    'namaLengkap',
    'jenisKelamin',
    'jenjang',
    'kelas',
    'asrama',
    'kamarLabel',
    'status',
    'capaianJuzHafalan',
    'statusSpp',
    'noHpWali',
    'kotaAsal',
  ]);

  const toggleSantriCol = (key: string) => {
    setSelectedSantriCols((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  const selectAllSantriCols = () => setSelectedSantriCols(allSantriCols.map((c) => c.key));
  const deselectAllSantriCols = () => setSelectedSantriCols([]);

  const handleExecuteExport = async () => {
    setIsExporting(true);
    try {
      const res = await authFetch('/api/export/custom', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: exportType,
          selectedColumns: exportType === 'santri' ? selectedSantriCols : undefined,
          filters: activeFilters,
        }),
      });

      if (!res.ok) {
        const errJson = await res.json();
        alert(errJson.error || 'Gagal mengekspor data');
        setIsExporting(false);
        return;
      }

      // Download the Excel blob
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const contentDisp = res.headers.get('Content-Disposition');
      let filename = `Export_${exportType}_${new Date().toISOString().split('T')[0]}.xlsx`;
      if (contentDisp && contentDisp.includes('filename=')) {
        filename = contentDisp.split('filename=')[1].replace(/"/g, '');
      }
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);

      onClose();
    } catch (err: any) {
      alert(err.message || 'Terjadi kesalahan saat mengunduh berkas');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl animate-in zoom-in-95 duration-150">
        
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 flex items-center justify-center">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Export Data ke Excel (.xlsx)
              </h3>
              <p className="text-xs text-slate-500">
                Pilih jenis data, kustomisasi kolom, dan unduh berkas spreadsheet terstandarisasi.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-4 sm:p-5 overflow-y-auto flex-1 space-y-5">
          
          {/* Active Filter Scope Notice */}
          <div className="p-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl flex items-center justify-between text-xs text-slate-600 dark:text-slate-300">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>
                Export mengikuti <strong>Tahun Ajaran {selectedTahunAjaran?.nama || 'Aktif'}</strong> dan filter aktif saat ini.
              </span>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200">
              Sinkron Filter
            </span>
          </div>

          {/* Export Dataset Type Selection */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
              Pilih Jenis Berkas Rekapitulasi:
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <button
                type="button"
                onClick={() => setExportType('santri')}
                className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between ${
                  exportType === 'santri'
                    ? 'border-emerald-600 bg-emerald-50/60 dark:bg-emerald-950/40 text-emerald-950 dark:text-emerald-200 ring-2 ring-emerald-500/20'
                    : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                }`}
              >
                <Users className="w-5 h-5 text-emerald-600 mb-2" />
                <div>
                  <div className="font-bold text-xs">Data Santri</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">Bisa pilih kolom</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setExportType('staf')}
                className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between ${
                  exportType === 'staf'
                    ? 'border-emerald-600 bg-emerald-50/60 dark:bg-emerald-950/40 text-emerald-950 dark:text-emerald-200 ring-2 ring-emerald-500/20'
                    : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                }`}
              >
                <UserCheck className="w-5 h-5 text-blue-600 mb-2" />
                <div>
                  <div className="font-bold text-xs">Staf & Pengajar</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">Rekap kepegawaian</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setExportType('kamar')}
                className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between ${
                  exportType === 'kamar'
                    ? 'border-emerald-600 bg-emerald-50/60 dark:bg-emerald-950/40 text-emerald-950 dark:text-emerald-200 ring-2 ring-emerald-500/20'
                    : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                }`}
              >
                <Home className="w-5 h-5 text-purple-600 mb-2" />
                <div>
                  <div className="font-bold text-xs">Penghuni Kamar</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">Per kamar & asrama</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setExportType('rekap_lembaga')}
                className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between ${
                  exportType === 'rekap_lembaga'
                    ? 'border-emerald-600 bg-emerald-50/60 dark:bg-emerald-950/40 text-emerald-950 dark:text-emerald-200 ring-2 ring-emerald-500/20'
                    : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                }`}
              >
                <Building2 className="w-5 h-5 text-amber-600 mb-2" />
                <div>
                  <div className="font-bold text-xs">Rekap Rombel</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">Lembaga & kelas</div>
                </div>
              </button>
            </div>
          </div>

          {/* Column Customization (Khusus Santri) */}
          {exportType === 'santri' && (
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Pilih Kolom Data yang Ingin Diekspor ({selectedSantriCols.length} kolom dipilih):
                </label>
                <div className="flex items-center gap-2 text-[11px]">
                  <button
                    type="button"
                    onClick={selectAllSantriCols}
                    className="text-emerald-700 dark:text-emerald-400 font-semibold hover:underline"
                  >
                    Pilih Semua
                  </button>
                  <span className="text-slate-300">·</span>
                  <button
                    type="button"
                    onClick={deselectAllSantriCols}
                    className="text-slate-500 hover:underline"
                  >
                    Hapus Pilihan
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 p-3 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 rounded-xl max-h-56 overflow-y-auto">
                {allSantriCols.map((col) => {
                  const isChecked = selectedSantriCols.includes(col.key);
                  return (
                    <label
                      key={col.key}
                      onClick={() => toggleSantriCol(col.key)}
                      className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 cursor-pointer p-1.5 rounded-lg hover:bg-white dark:hover:bg-slate-700 transition-colors select-none"
                    >
                      {isChecked ? (
                        <CheckSquare className="w-4 h-4 text-emerald-600 shrink-0" />
                      ) : (
                        <Square className="w-4 h-4 text-slate-400 shrink-0" />
                      )}
                      <span className="truncate">{col.label}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          )}

          {/* Explanation if non-santri */}
          {exportType === 'staf' && (
            <div className="p-3 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 rounded-xl text-xs text-blue-900 dark:text-blue-200 space-y-1">
              <strong>Format Rekap Staf:</strong> Berkas Excel mencakup NIP, Nama Lengkap, Gender, Bagian (Guru/Ustadz/TU/Musyrif), Jabatan, Mapel/Kitab, Status Kepegawaian, No HP, dan Pendidikan Terakhir.
            </div>
          )}

          {exportType === 'kamar' && (
            <div className="p-3 bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 rounded-xl text-xs text-purple-900 dark:text-purple-200 space-y-1">
              <strong>Format Rekap Penghuni Kamar:</strong> Berkas Excel mencakup Asrama, Kelompok Gender, Nama Kamar, Kapasitas, Jumlah Terisi, Sisa Ranjang, Status Kamar, Pembina/Musyrif, dan Daftar Nama Santri Penghuni.
            </div>
          )}

          {exportType === 'rekap_lembaga' && (
            <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-xl text-xs text-amber-900 dark:text-amber-200 space-y-1">
              <strong>Format Rekapitulasi Rombel:</strong> Berkas Excel mencakup Lembaga, Rombel/Kelas, Jumlah Santri Putra, Jumlah Santri Putri, Total Santri, dan Status Keaktifan.
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={handleExecuteExport}
            disabled={isExporting || (exportType === 'santri' && selectedSantriCols.length === 0)}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm disabled:opacity-50 transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>{isExporting ? 'Memproses Berkas...' : 'Unduh Berkas Excel (.xlsx)'}</span>
          </button>
        </div>

      </div>
    </div>
  );
};
