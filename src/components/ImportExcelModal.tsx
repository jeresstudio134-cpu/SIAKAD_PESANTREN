import React from 'react';
import { X, Upload, Download, CheckCircle2, AlertCircle, FileSpreadsheet } from 'lucide-react';

interface ImportExcelModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export const ImportExcelModal: React.FC<ImportExcelModalProps> = ({
  onClose,
  onSuccess,
}) => {
  const [file, setFile] = React.useState<File | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [resultMsg, setResultMsg] = React.useState<string | null>(null);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setErrorMsg(null);
      setResultMsg(null);
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

      setResultMsg(json.message);
      setTimeout(() => {
        onSuccess();
      }, 1500);
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 p-5">
        
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400">
            <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
            <h3 className="font-bold text-base text-slate-900 dark:text-white">
              Import Data Santri dari Excel
            </h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-xs text-slate-600 dark:text-slate-300 mb-4 leading-relaxed">
          Unggah file Excel (format SheetJS / .xlsx). Sistem akan mencocokkan nomor NIS; jika santri sudah terdaftar maka biodata akan diperbarui secara otomatis.
        </p>

        {/* Download Template Banner */}
        <div className="mb-4 p-3.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl flex items-center justify-between">
          <div>
            <span className="font-semibold text-xs text-slate-800 dark:text-slate-200 block">
              Format Kolom Template Standar
            </span>
            <span className="text-[11px] text-slate-500">
              Download format template resmi sebelum mengisi data.
            </span>
          </div>
          <a
            href="/api/export/template"
            download
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-600 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-200 shadow-xs"
          >
            <Download className="w-3.5 h-3.5 text-emerald-600" />
            <span>Download Template</span>
          </a>
        </div>

        {/* Form Upload */}
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

          {resultMsg && (
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{resultMsg}</span>
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-xs"
            >
              Tutup
            </button>
            <button
              type="submit"
              disabled={loading || !file}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-lg text-xs font-semibold"
            >
              {loading ? 'Mengimpor Data...' : 'Mulai Import'}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
