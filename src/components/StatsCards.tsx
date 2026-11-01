import React from 'react';
import { Users, UserCheck, BookOpen, AlertCircle, Clock, Award } from 'lucide-react';
import type { DashboardStats } from '../types/index.ts';

interface StatsCardsProps {
  stats: DashboardStats | null;
  loading: boolean;
  onFilterByStatus?: (status: string) => void;
  onFilterBySpp?: (sppStatus: string) => void;
}

export const StatsCards: React.FC<StatsCardsProps> = ({
  stats,
  loading,
  onFilterByStatus,
  onFilterBySpp,
}) => {
  if (loading || !stats) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3 md:gap-4 mb-6 w-full">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-24 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3 animate-pulse">
            <div className="w-12 h-3 bg-slate-200 dark:bg-slate-800 rounded mb-3"></div>
            <div className="w-16 h-6 bg-slate-200 dark:bg-slate-800 rounded"></div>
          </div>
        ))}
      </div>
    );
  }

  const isPutra = stats.scopeAsrama === 'putra';
  const isPutri = stats.scopeAsrama === 'putri';

  const totalSantriSubtitle = isPutra
    ? `${stats.totalSantri.toLocaleString('id-ID')} Putra`
    : isPutri
    ? `${stats.totalSantri.toLocaleString('id-ID')} Putri`
    : `${stats.santriPutra.toLocaleString('id-ID')} Putra · ${stats.santriPutri.toLocaleString('id-ID')} Putri`;

  const stafSubtitle = isPutra
    ? 'Musyrif & Asatidz Putra'
    : isPutri
    ? 'Musyrifah & Ustadzah Putri'
    : 'Pengajar & Pengasuh';

  const cards = [
    {
      title: 'Total Santri',
      value: stats.totalSantri.toLocaleString('id-ID'),
      subtitle: totalSantriSubtitle,
      icon: Users,
      color: 'text-emerald-700 dark:text-emerald-400',
      bgColor: 'bg-emerald-50 dark:bg-emerald-950/40',
      borderColor: 'border-slate-200 dark:border-slate-800',
      onClick: () => onFilterByStatus?.('semua'),
    },
    {
      title: 'Santri Aktif',
      value: stats.santriAktif.toLocaleString('id-ID'),
      subtitle: 'Berada di Asrama',
      icon: UserCheck,
      color: 'text-blue-700 dark:text-blue-400',
      bgColor: 'bg-blue-50 dark:bg-blue-950/40',
      borderColor: 'border-slate-200 dark:border-slate-800',
      onClick: () => onFilterByStatus?.('aktif'),
    },
    {
      title: 'Izin Pulang',
      value: stats.santriIzinPulang.toLocaleString('id-ID'),
      subtitle: 'Surat Izin Resmi',
      icon: Clock,
      color: 'text-amber-700 dark:text-amber-400',
      bgColor: 'bg-amber-50 dark:bg-amber-950/40',
      borderColor: 'border-slate-200 dark:border-slate-800',
      onClick: () => onFilterByStatus?.('izin_pulang'),
    },
    {
      title: 'Hafidz 30 Juz',
      value: stats.totalHafidz30Juz.toLocaleString('id-ID'),
      subtitle: 'Khatam Bil-Ghaib',
      icon: Award,
      color: 'text-teal-700 dark:text-teal-400',
      bgColor: 'bg-teal-50 dark:bg-teal-950/40',
      borderColor: 'border-slate-200 dark:border-slate-800',
      onClick: () => onFilterByStatus?.('semua'),
    },
    {
      title: 'Tunggakan SPP',
      value: stats.tunggakanSppCount.toLocaleString('id-ID'),
      subtitle: 'Perlu Konfirmasi Wali',
      icon: AlertCircle,
      color: 'text-rose-700 dark:text-rose-400',
      bgColor: 'bg-rose-50 dark:bg-rose-950/40',
      borderColor: 'border-slate-200 dark:border-slate-800',
      onClick: () => onFilterBySpp?.('tunggakan_1_bulan'),
    },
    {
      title: 'Staf & Asatidz',
      value: stats.totalStaf.toLocaleString('id-ID'),
      subtitle: stafSubtitle,
      icon: BookOpen,
      color: 'text-indigo-700 dark:text-indigo-400',
      bgColor: 'bg-indigo-50 dark:bg-indigo-950/40',
      borderColor: 'border-slate-200 dark:border-slate-800',
      onClick: undefined,
    },
  ];

  return (
    <section aria-label="Ringkasan Statistik Pesantren" className="mb-6 w-full">
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3 md:gap-4 w-full">
        {cards.map((c, i) => {
          const Icon = c.icon;
          return (
            <button
              key={i}
              type="button"
              onClick={c.onClick}
              disabled={!c.onClick}
              className={`text-left p-3.5 bg-white dark:bg-slate-900 border ${c.borderColor} rounded-xl shadow-xs transition-all ${
                c.onClick
                  ? 'hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-sm cursor-pointer active:scale-[0.99]'
                  : 'cursor-default'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                  {c.title}
                </span>
                <div className={`p-1.5 rounded-lg ${c.bgColor} ${c.color}`}>
                  <Icon className="w-4 h-4" />
                </div>
              </div>

              <div className="font-mono text-2xl font-bold tracking-tight text-slate-900 dark:text-white tabular-nums">
                {c.value}
              </div>

              <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 truncate">
                {c.subtitle}
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
};
