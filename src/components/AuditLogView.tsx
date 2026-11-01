import React from 'react';
import {
  ShieldAlert,
  Search,
  RefreshCw,
  Clock,
  User,
  Filter,
  FileCode,
  X,
  Eye,
  CheckCircle2,
  Calendar
} from 'lucide-react';
import type { AuditLog, UserSession } from '../types/index.ts';

interface AuditLogViewProps {
  currentUser: UserSession | null;
}

export const AuditLogView: React.FC<AuditLogViewProps> = ({ currentUser }) => {
  const [logs, setLogs] = React.useState<AuditLog[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState('');
  const [actionFilter, setActionFilter] = React.useState('semua');
  const [entityFilter, setEntityFilter] = React.useState('semua');
  const [activeJsonDetail, setActiveJsonDetail] = React.useState<AuditLog | null>(null);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/audit-logs?limit=100');
      const json = await res.json();
      setLogs(json.data || []);
    } catch (err) {
      console.error('Error fetching audit logs:', err);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchLogs();
  }, []);

  const filteredLogs = logs.filter((log) => {
    if (actionFilter !== 'semua' && log.action !== actionFilter) return false;
    if (entityFilter !== 'semua' && log.entityType !== entityFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      const matchUser = log.userFullName?.toLowerCase().includes(q) || false;
      const matchAction = log.action.toLowerCase().includes(q);
      const matchEntity = log.entityType.toLowerCase().includes(q);
      const matchDetails = log.details?.toLowerCase().includes(q) || false;
      if (!matchUser && !matchAction && !matchEntity && !matchDetails) return false;
    }
    return true;
  });

  const renderActionBadge = (action: string) => {
    switch (action.toUpperCase()) {
      case 'CREATE':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
            CREATE
          </span>
        );
      case 'UPDATE':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
            UPDATE
          </span>
        );
      case 'DELETE':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300">
            DELETE
          </span>
        );
      case 'NAIK_KELAS':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300">
            NAIK KELAS
          </span>
        );
      case 'PINDAH_KAMAR':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300">
            PINDAH KAMAR
          </span>
        );
      case 'IMPORT':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-100 text-cyan-800 dark:bg-cyan-950/60 dark:text-cyan-300">
            IMPORT EXCEL
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300">
            {action}
          </span>
        );
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleString('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });
    } catch (e) {
      return dateStr;
    }
  };

  return (
    <div className="space-y-5">
      
      {/* Header Banner */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 flex items-center justify-center shrink-0">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                Log Audit & Jejak Aktivitas Sistem
              </h2>
              <span className="px-2 py-0.5 text-[10px] font-bold bg-purple-100 text-purple-800 dark:bg-purple-900/60 dark:text-purple-200 rounded-full">
                Super Admin
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Pencatatan real-time siapa, kapan, dan perubahan data sebelum vs sesudah demi keamanan & transparansi pondok pesantren.
            </p>
          </div>
        </div>

        <button
          onClick={fetchLogs}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-lg transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Segarkan Log</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3.5 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari nama pengguna, entitas, ID atau rincian..."
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>

        <div className="flex items-center gap-2">
          {/* Action Filter */}
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="px-3 py-2 text-xs font-semibold bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200"
          >
            <option value="semua">Semua Aksi</option>
            <option value="CREATE">CREATE</option>
            <option value="UPDATE">UPDATE</option>
            <option value="DELETE">DELETE</option>
            <option value="NAIK_KELAS">NAIK_KELAS</option>
            <option value="PINDAH_KAMAR">PINDAH_KAMAR</option>
            <option value="IMPORT">IMPORT</option>
          </select>

          {/* Entity Filter */}
          <select
            value={entityFilter}
            onChange={(e) => setEntityFilter(e.target.value)}
            className="px-3 py-2 text-xs font-semibold bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200"
          >
            <option value="semua">Semua Entitas</option>
            <option value="santri">Santri</option>
            <option value="staf">Staf</option>
            <option value="kamar">Kamar</option>
            <option value="tahun_ajaran">Tahun Ajaran</option>
            <option value="lembaga">Lembaga</option>
            <option value="users">Pengguna</option>
          </select>
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 uppercase font-semibold text-[11px]">
              <tr>
                <th className="py-3 px-4 w-44">Waktu & Tanggal</th>
                <th className="py-3 px-4 w-48">Pengguna (Aktor)</th>
                <th className="py-3 px-4 w-32">Aksi</th>
                <th className="py-3 px-4 w-32">Entitas / Tabel</th>
                <th className="py-3 px-4">Ringkasan Perubahan</th>
                <th className="py-3 px-4 text-right w-24">Data JSON</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center text-slate-500 text-xs">
                    Memuat riwayat audit log...
                  </td>
                </tr>
              ) : filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center text-slate-500 text-xs">
                    Tidak ada catatan log aktivitas yang cocok.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => {
                  let parsedSummary = '';
                  if (log.details) {
                    try {
                      const d = JSON.parse(log.details);
                      if (d.aksi) parsedSummary = d.aksi;
                      else if (d.namaSantri) parsedSummary = `Santri: ${d.namaSantri} (NIS: ${d.nis || '-'})`;
                      else if (d.nama) parsedSummary = `Nama: ${d.nama}`;
                      else if (d.message) parsedSummary = d.message;
                      else parsedSummary = Object.keys(d).map((k) => `${k}: ${d[k]}`).slice(0, 3).join(', ');
                    } catch (e) {
                      parsedSummary = log.details;
                    }
                  }

                  return (
                    <tr key={log.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-4 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{formatDate(log.createdAt)}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center font-bold text-[10px] text-slate-700 dark:text-slate-300 uppercase">
                            {log.userFullName?.charAt(0) || 'S'}
                          </div>
                          <div>
                            <div className="font-semibold text-slate-900 dark:text-white truncate max-w-[150px]">
                              {log.userFullName || 'Sistem / Admin'}
                            </div>
                            <div className="font-mono text-[10px] text-slate-400">
                              {log.ipAddress || 'Internal Edge'}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        {renderActionBadge(log.action)}
                      </td>
                      <td className="py-3 px-4 font-mono text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase">
                        {log.entityType}
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-slate-600 dark:text-slate-300 text-xs truncate block max-w-xl xl:max-w-3xl">
                          {parsedSummary || '-'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => setActiveJsonDetail(log)}
                          className="px-2.5 py-1 text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-md inline-flex items-center gap-1 transition-colors"
                          title="Lihat Payload Lengkap"
                        >
                          <Eye className="w-3 h-3" />
                          <span>JSON</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: DETAIL JSON DIFF */}
      {activeJsonDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-xl max-h-[85vh] flex flex-col shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileCode className="w-5 h-5 text-purple-600" />
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Detail Payload Log #{activeJsonDetail.id}
                  </h3>
                  <div className="text-[11px] text-slate-500 font-mono">
                    {activeJsonDetail.action} on {activeJsonDetail.entityType} ({activeJsonDetail.createdAt})
                  </div>
                </div>
              </div>
              <button
                onClick={() => setActiveJsonDetail(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 sm:p-5 overflow-y-auto flex-1">
              <pre className="p-3 bg-slate-950 text-emerald-400 font-mono text-xs rounded-xl overflow-x-auto leading-relaxed">
                {(() => {
                  try {
                    return JSON.stringify(JSON.parse(activeJsonDetail.details || '{}'), null, 2);
                  } catch (e) {
                    return activeJsonDetail.details || '(Tidak ada data rincian)';
                  }
                })()}
              </pre>
            </div>

            <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex justify-end">
              <button
                onClick={() => setActiveJsonDetail(null)}
                className="px-4 py-2 text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-lg"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
