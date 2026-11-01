import React from 'react';
import { X, Upload, Download, CheckCircle2, AlertCircle, AlertTriangle, FileSpreadsheet, ShieldCheck, RefreshCw } from 'lucide-react';
import type { UserSession } from '../types/index.ts';

interface ImportExcelModalProps {
  onClose: () => void;
  onSuccess: () => void;
  currentUser?: UserSession | null;
}

interface ImportReport {
  imported: number;
  updated: number;
  skipped: number;
  errors: string[];
  message: string;
}

export const ImportExcelModal: React.FC<ImportExcelModalProps> = ({
  onClose,
  onSuccess,
  currentUser,
}) => {
  const [file, setFile] = React.useState<File | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [report, setReport] = React.useState<ImportReport | null>(null);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);

  const scopeAsrama = currentUser?.scopeAsrama || 'semua';
  const isPutraScope = scopeAsrama === 'putra';
  const isPutriScope = scopeAsrama === 'putri';

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setErrorMsg(null);
      setReport(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setErrorMsg('Pilih file Excel (.xlsx) terlebih dahulu');
      return;
    }

    try {
      setLoading(true);
      setErrorMsg(null);
      setReport(null);

      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/import/santri', {
        method: 'POST',
        body: formData,
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || 'Gagal memproses file Excel');
      }

      setReport({
        imported: json.imported ?? 0,
        updated: json.updated ?? 0,
        skipped: json.skipped ?? 0,
        errors: Array.isArray(json.errors) ? json.errors : [],
        message: json.message || 'Proses import selesai.',
      });

      // If perfectly clean (no errors/skipped), auto-finish after short delay
      if ((!json.errors || json.errors.length === 0) && (!json.skipped || json.skipped === 0)) {
        setTimeout(() => {
          onSuccess();
        }, 1500);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Terjadi kesalahan saat mengimpor data');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 p-5 max-h-[90vh] flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-3 shrink-0">
          <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400">
            <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
            <h3 className="font-bold text-base text-slate-900 dark:text-white">
              Import Data Santri dari Excel
            </h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scope Banner if Scoped Account */}
        {(isPutraScope || isPutriScope) && (
          <div className="mb-3 p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl flex items-start gap-2.5 shrink-0">
            <ShieldCheck className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div className="text-xs text-amber-800 dark:text-amber-200 leading-relaxed">
              <span className="font-semibold block">
                Cakupan Wewenang: {isPutraScope ? 'Pengelola Asrama Putra' : 'Pengelola Asrama Putri'}
              </span>
              Sistem akan memvalidasi baris Excel. Baris dengan jenis kelamin {isPutraScope ? 'Perempuan (Putri)' : 'Laki-laki (Putra)'} atau asrama berlawanan akan otomatis ditolak dan dirincikan pada laporan error.
            </div>
          </div>
        )}

        {/* Scrollable Body */}
        <div className="overflow-y-auto flex-1 pr-1 space-y-4">
          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
            Unggah file Excel (format .xlsx). Sistem akan mencocokkan nomor NIS; jika santri sudah terdaftar maka biodata akan diperbarui, jika baru akan ditambahkan.
          </p>

          {/* Download Template Banner */}
          <div className="p-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl flex items-center justify-between gap-3">
            <div>
              <span className="font-semibold text-xs text-slate-800 dark:text-slate-200 block">
                Format Template Resmi
              </span>
              <span className="text-[11px] text-slate-500">
                Template otomatis disesuaikan dengan wewenang akun Anda.
              </span>
            </div>
            <a
              href="/api/export/template"
              download
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-600 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-200 shadow-xs shrink-0"
            >
              <Download className="w-3.5 h-3.5 text-emerald-600" />
              <span>Download Template</span>
            </a>
          </div>

          {/* Form Upload */}
          {!report && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl p-6 text-center hover:border-emerald-500 transition-colors">
                <input
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleFileChange}
                  className="hidden"
                  id="excel-file-input"
                />
                <label htmlFor="excel-file-input" className="cursor-pointer block">
                  <Upload className="w-8 h-8 mx-auto mb-2 text-slate-400" />
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
                    {file ? file.name : 'Pilih file .xlsx dari perangkat Anda'}
                  </span>
                  <span className="text-[11px] text-slate-400 block mt-1">
                    {file ? `${(file.size / 1024).toFixed(1)} KB` : 'Mendukung ribuan baris data santri sekaligus'}
                  </span>
                </label>
              </div>

              {errorMsg && (
                <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-xl text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-xs hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={loading || !file}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-lg text-xs font-semibold shadow-xs flex items-center gap-1.5"
                >
                  {loading && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  <span>{loading ? 'Mengimpor Data...' : 'Mulai Import'}</span>
                </button>
              </div>
            </form>
          )}

          {/* Import Result / Error Report View */}
          {report && (
            <div className="space-y-4 animate-in fade-in">
              <div className="p-3 bg-slate-50 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-2 mb-2 font-semibold text-xs text-slate-800 dark:text-slate-200">
                  {report.skipped > 0 ? (
                    <AlertTriangle className="w-4 h-4 text-amber-500" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  )}
                  <span>{report.message}</span>
                </div>

                {/* Metric Summary Cards */}
                <div className="grid grid-cols-3 gap-2 mt-3">
                  <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/50 rounded-lg text-center">
                    <span className="text-[11px] text-emerald-700 dark:text-emerald-300 font-medium block">Ditambahkan</span>
                    <span className="text-base font-bold text-emerald-800 dark:text-emerald-200">{report.imported}</span>
                  </div>
                  <div className="p-2.5 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/50 rounded-lg text-center">
                    <span className="text-[11px] text-blue-700 dark:text-blue-300 font-medium block">Diperbarui</span>
                    <span className="text-base font-bold text-blue-800 dark:text-blue-200">{report.updated}</span>
                  </div>
                  <div className="p-2.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/50 rounded-lg text-center">
                    <span className="text-[11px] text-rose-700 dark:text-rose-300 font-medium block">Ditolak / Lewat</span>
                    <span className="text-base font-bold text-rose-800 dark:text-rose-200">{report.skipped}</span>
                  </div>
                </div>
              </div>

              {/* Itemized Errors List */}
              {report.errors.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
                    <span className="flex items-center gap-1.5 text-rose-600 dark:text-rose-400">
                      <AlertCircle className="w-4 h-4" />
                      Laporan Baris Ditolak ({report.errors.length}):
                    </span>
                    <span className="text-[11px] font-normal text-slate-400">Pembatasan Wewenang Akun</span>
                  </div>
                  <div className="max-h-48 overflow-y-auto space-y-1.5 p-2.5 bg-rose-50/70 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 rounded-xl text-[11px] text-rose-800 dark:text-rose-200 font-mono">
                    {report.errors.map((err, idx) => (
                      <div key={idx} className="flex items-start gap-1.5 pb-1 border-b border-rose-100 dark:border-rose-900/30 last:border-0 last:pb-0">
                        <span className="text-rose-400 select-none">•</span>
                        <span className="break-words leading-relaxed">{err}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setReport(null);
                    setFile(null);
                  }}
                  className="px-3.5 py-2 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-xs hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  Import File Lain
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onSuccess();
                  }}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-xs flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Selesai & Muat Ulang Data</span>
                </button>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
