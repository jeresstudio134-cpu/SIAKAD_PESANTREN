import React from 'react';
import { Users, UserCheck, BarChart3, Cloud, Plus, Home } from 'lucide-react';

interface MobileBottomNavProps {
  activeTab: 'santri' | 'staf' | 'asrama' | 'users' | 'stats' | 'audit' | 'deploy';
  setActiveTab: (tab: 'santri' | 'staf' | 'asrama' | 'users' | 'stats' | 'audit' | 'deploy') => void;
  onOpenAddModal: () => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  activeTab,
  setActiveTab,
  onOpenAddModal,
}) => {
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 pb-safe">
      <div className="grid grid-cols-5 items-center h-16 px-1">
        
        {/* Tab 1: Santri */}
        <button
          onClick={() => setActiveTab('santri')}
          className={`flex flex-col items-center justify-center min-h-[48px] rounded-lg transition-colors ${
            activeTab === 'santri'
              ? 'text-emerald-600 dark:text-emerald-400 font-semibold'
              : 'text-slate-500 hover:text-slate-900 dark:text-slate-400'
          }`}
        >
          <Users className="w-5 h-5" />
          <span className="text-[10px] mt-1 tracking-tight">Santri</span>
        </button>

        {/* Tab 2: Staf */}
        <button
          onClick={() => setActiveTab('staf')}
          className={`flex flex-col items-center justify-center min-h-[48px] rounded-lg transition-colors ${
            activeTab === 'staf'
              ? 'text-emerald-600 dark:text-emerald-400 font-semibold'
              : 'text-slate-500 hover:text-slate-900 dark:text-slate-400'
          }`}
        >
          <UserCheck className="w-5 h-5" />
          <span className="text-[10px] mt-1 tracking-tight">Staf</span>
        </button>

        {/* Center CTA Button: Tambah Baru */}
        <div className="flex items-center justify-center">
          <button
            onClick={onOpenAddModal}
            aria-label="Tambah Data Baru"
            className="w-11 h-11 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-lg shadow-emerald-600/30 active:scale-95 transition-transform"
          >
            <Plus className="w-6 h-6 stroke-[2.5]" />
          </button>
        </div>

        {/* Tab 3: Statistik */}
        <button
          onClick={() => setActiveTab('stats')}
          className={`flex flex-col items-center justify-center min-h-[48px] rounded-lg transition-colors ${
            activeTab === 'stats'
              ? 'text-emerald-600 dark:text-emerald-400 font-semibold'
              : 'text-slate-500 hover:text-slate-900 dark:text-slate-400'
          }`}
        >
          <BarChart3 className="w-5 h-5" />
          <span className="text-[10px] mt-1 tracking-tight">Statistik</span>
        </button>

        {/* Tab 4: Asrama & Kamar */}
        <button
          onClick={() => setActiveTab('asrama')}
          className={`flex flex-col items-center justify-center min-h-[48px] rounded-lg transition-colors ${
            activeTab === 'asrama'
              ? 'text-emerald-600 dark:text-emerald-400 font-semibold'
              : 'text-slate-500 hover:text-slate-900 dark:text-slate-400'
          }`}
        >
          <Home className="w-5 h-5" />
          <span className="text-[10px] mt-1 tracking-tight">Asrama</span>
        </button>

      </div>
    </nav>
  );
};
