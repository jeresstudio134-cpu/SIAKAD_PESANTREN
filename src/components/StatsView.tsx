import React from 'react';
import { Users, Award, AlertCircle, BookOpen, Layers, CheckCircle } from 'lucide-react';
import type { DashboardStats } from '../types/index.ts';

interface StatsViewProps {
  stats: DashboardStats | null;
  onFilterJenjang: (jenjang: string) => void;
  onFilterSpp: (spp: string) => void;
}

export const StatsView: React.FC<StatsViewProps> = ({
  stats,
  onFilterJenjang,
  onFilterSpp,
}) => {
  if (!stats) return null;

  const isPutraScoped = stats.scopeAsrama === 'putra';
  const isPutriScoped = stats.scopeAsrama === 'putri';
  const total = stats.totalSantri || 1;
  const pctPutra = isPutriScoped ? 0 : isPutraScoped ? 100 : Math.round((stats.santriPutra / total) * 100);
  const pctPutri = isPutraScoped ? 0 : isPutriScoped ? 100 : 100 - pctPutra;

  return (
    <div className="space-y-6">
      
      {/* 1. Header Overview Banner */}
      <div className="bg-gradient-to-r from-emerald-800 to-teal-900 rounded-2xl p-6 text-white shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-emerald-300 block">
            Monitoring & Analisis Akademik
          </span>
          <h2 className="text-xl sm:text-2xl font-bold mt-1">
            Pesantren Salaf Modern Al-Barokah
          </h2>
          <p className="text-xs text-emerald-100/90 mt-1 max-w-xl">
            Sistem Informasi Akademik Berbasis Cloudflare Edge (Workers + D1 + R2). Memantau ±2.000 santri, perizinan, setoran tahfidz, kedisiplinan dan administrasi pesantren secara real-time.
          </p>
        </div>

        <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md px-4 py-3 rounded-xl border border-white/10 shrink-0">
          <div className="text-center">
            <span className="text-[10px] text-emerald-200 block">
              {isPutraScoped ? 'Santri Putra' : isPutriScoped ? 'Santri Putri' : 'Total Santri'}
            </span>
            <span className="font-mono text-xl font-bold tabular-nums">
              {stats.totalSantri.toLocaleString('id-ID')}
            </span>
          </div>
          <div className="h-8 w-px bg-white/20" />
          <div className="text-center">
            <span className="text-[10px] text-emerald-200 block">Tingkat Keaktifan</span>
            <span className="font-mono text-xl font-bold tabular-nums">
              {Math.round((stats.santriAktif / total) * 100)}%
            </span>
          </div>
        </div>
      </div>

      {/* 2. Gender Ratio & Active Status Distribution */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        {/* Rasio Santri Putra vs Putri */}
        <div className="p-5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
              <Users className="w-4 h-4 text-emerald-600" />
              <span>
                {isPutraScoped
                  ? 'Cakupan Wewenang (Asrama Putra)'
                  : isPutriScoped
                  ? 'Cakupan Wewenang (Asrama Putri)'
                  : 'Komposisi Santri (Putra & Putri)'}
              </span>
            </h3>
            <span className="text-xs text-slate-400 font-mono">100% Asrama</span>
          </div>

          <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden flex mb-3">
            {!isPutriScoped && (
              <div
                style={{ width: `${pctPutra}%` }}
                className="bg-emerald-600 h-full transition-all"
                title={`Putra: ${stats.santriPutra} (${pctPutra}%)`}
              />
            )}
            {!isPutraScoped && (
              <div
                style={{ width: `${pctPutri}%` }}
                className="bg-teal-400 h-full transition-all"
                title={`Putri: ${stats.santriPutri} (${pctPutri}%)`}
              />
            )}
          </div>

          <div className={`grid ${isPutraScoped || isPutriScoped ? 'grid-cols-1' : 'grid-cols-2'} gap-3 text-xs`}>
            {!isPutriScoped && (
              <div className="p-2.5 rounded-lg bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-600" />
                  <span className="font-semibold text-slate-800 dark:text-slate-200">Santri Putra (Banin)</span>
                </div>
                <p className="font-mono font-bold text-base text-emerald-700 dark:text-emerald-400 mt-1 tabular-nums">
                  {stats.santriPutra.toLocaleString('id-ID')} <span className="text-xs font-normal text-slate-500">({pctPutra}%)</span>
                </p>
              </div>
            )}

            {!isPutraScoped && (
              <div className="p-2.5 rounded-lg bg-teal-50/50 dark:bg-teal-950/20 border border-teal-100 dark:border-teal-900/30">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-teal-400" />
                  <span className="font-semibold text-slate-800 dark:text-slate-200">Santri Putri (Banat)</span>
                </div>
                <p className="font-mono font-bold text-base text-teal-700 dark:text-teal-400 mt-1 tabular-nums">
                  {stats.santriPutri.toLocaleString('id-ID')} <span className="text-xs font-normal text-slate-500">({pctPutri}%)</span>
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Status Keberadaan Santri */}
        <div className="p-5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <h3 className="font-bold text-sm text-slate-900 dark:text-white mb-3 flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-600" />
            <span>Status Keberadaan di Asrama</span>
          </h3>

          <div className="space-y-2.5 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-slate-600 dark:text-slate-300">Aktif Berada di Pondok</span>
              <strong className="font-mono tabular-nums text-emerald-600">
                {stats.santriAktif} santri
              </strong>
            </div>
            <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
              <div className="bg-emerald-600 h-full" style={{ width: `${(stats.santriAktif / total) * 100}%` }} />
            </div>

            <div className="flex items-center justify-between pt-1">
              <span className="text-slate-600 dark:text-slate-300">Sedang Izin Pulang (Resmi)</span>
              <strong className="font-mono tabular-nums text-amber-600">
                {stats.santriIzinPulang} santri
              </strong>
            </div>
            <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
              <div className="bg-amber-500 h-full" style={{ width: `${(stats.santriIzinPulang / total) * 100}%` }} />
            </div>

            <div className="flex items-center justify-between pt-1">
              <span className="text-slate-600 dark:text-slate-300">Alpa / Belum Kembali / Skorsing</span>
              <strong className="font-mono tabular-nums text-rose-600">
                {stats.santriAlpaAtauSkorsing} santri
              </strong>
            </div>
            <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
              <div className="bg-rose-500 h-full" style={{ width: `${(stats.santriAlpaAtauSkorsing / total) * 100}%` }} />
            </div>
          </div>
        </div>

      </div>

      {/* 3. Breakdown per Jenjang & SPP */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        {/* Jenjang Breakdown */}
        <div className="p-5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <h3 className="font-bold text-sm text-slate-900 dark:text-white mb-3 flex items-center gap-2">
            <Layers className="w-4 h-4 text-emerald-600" />
            <span>Distribusi Berdasarkan Jenjang Pendidikan</span>
          </h3>

          <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
            {Object.entries(stats.jenjangCounts || {}).map(([jenjang, count]) => (
              <button
                key={jenjang}
                onClick={() => onFilterJenjang(jenjang)}
                className="w-full py-2.5 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/50 px-2 rounded-lg transition-colors text-left"
              >
                <div>
                  <span className="font-semibold text-slate-800 dark:text-slate-200 block">{jenjang}</span>
                  <span className="text-[11px] text-slate-400">Klik untuk memfilter daftar santri</span>
                </div>
                <div className="text-right">
                  <span className="font-mono font-bold text-slate-900 dark:text-white tabular-nums block">
                    {count.toLocaleString('id-ID')}
                  </span>
                  <span className="text-[10px] text-slate-400">
                    {Math.round((count / total) * 100)}%
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Keuangan SPP Breakdown */}
        <div className="p-5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <h3 className="font-bold text-sm text-slate-900 dark:text-white mb-3 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-emerald-600" />
            <span>Kepatuhan Pembayaran SPP Pesantren</span>
          </h3>

          <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
            {Object.entries(stats.sppCounts || {}).map(([spp, count]) => {
              const label = spp === 'lunas' ? 'Lunas Tepat Waktu' : spp.replace(/_/g, ' ');
              const isLunas = spp === 'lunas';
              return (
                <button
                  key={spp}
                  onClick={() => onFilterSpp(spp)}
                  className="w-full py-2.5 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/50 px-2 rounded-lg transition-colors text-left"
                >
                  <div className="flex items-center gap-2">
                    <span className={`w-2.5 h-2.5 rounded-full ${isLunas ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                    <div>
                      <span className="font-semibold text-slate-800 dark:text-slate-200 capitalize block">
                        {label}
                      </span>
                      <span className="text-[11px] text-slate-400">Klik untuk melihat rincian</span>
                    </div>
                  </div>
                  <span className="font-mono font-bold text-slate-900 dark:text-white tabular-nums">
                    {count.toLocaleString('id-ID')} santri
                  </span>
                </button>
              );
            })}
          </div>
        </div>

      </div>

    </div>
  );
};
