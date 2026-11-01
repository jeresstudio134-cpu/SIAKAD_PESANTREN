import React from 'react';
import { X, CheckCircle, AlertTriangle } from 'lucide-react';

interface BatchActionModalProps {
  selectedCount: number;
  onClose: () => void;
  onSubmit: (status: string) => Promise<void>;
}

export const BatchActionModal: React.FC<BatchActionModalProps> = ({
  selectedCount,
  onClose,
  onSubmit,
}) => {
  const [selectedStatus, setSelectedStatus] = React.useState('izin_pulang');
  const [loading, setLoading] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      await onSubmit(selectedStatus);
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400">
            <CheckCircle className="w-5 h-5" />
            <h3 className="font-bold text-base text-slate-900 dark:text-white">
              Ubah Status Massal
            </h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-xs text-slate-600 dark:text-slate-300 mb-4">
          Anda akan mengubah status <strong className="text-slate-900 dark:text-white font-mono">{selectedCount}</strong> santri yang sedang dipilih secara serentak.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Pilih Status Baru:
            </label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-medium"
            >
              <option value="aktif">Aktif di Pondok (Sudah Kembali)</option>
              <option value="izin_pulang">Izin Pulang (Libur Massal / Acara)</option>
              <option value="alpa">Alpa / Belum Kembali</option>
              <option value="skorsing">Dalam Skorsing</option>
              <option value="lulus">Lulus / Alumni</option>
            </select>
          </div>

          <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl text-xs text-amber-800 dark:text-amber-300 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>Perubahan ini langsung memperbarui status seluruh santri terpilih di database Cloudflare D1.</span>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-xs"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold"
            >
              {loading ? 'Memproses...' : 'Terapkan Status'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
