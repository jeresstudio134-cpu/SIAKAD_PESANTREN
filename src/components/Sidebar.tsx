import React from 'react';
import {
  GraduationCap,
  Users,
  UserCheck,
  BarChart3,
  Cloud,
  Home,
  ShieldAlert,
  Layers,
  Shield,
  Upload,
  Download,
  LogOut,
  ChevronLeft,
  ChevronRight,
  X,
  UserCheck2,
  Calendar,
  Sparkles,
  ArrowUpRight
} from 'lucide-react';
import type { UserSession, TahunAjaran } from '../types/index.ts';

interface SidebarProps {
  activeTab: 'santri' | 'staf' | 'asrama' | 'users' | 'stats' | 'audit' | 'deploy';
  setActiveTab: (tab: 'santri' | 'staf' | 'asrama' | 'users' | 'stats' | 'audit' | 'deploy') => void;
  currentUser: UserSession | null;
  onLogout: () => void;
  onOpenQuickLogin: () => void;
  onOpenImport: () => void;
  onOpenAddSantri: () => void;
  onOpenMasterData: () => void;
  onOpenUserManagement: () => void;
  onExportExcel: () => void;
  onOpenNaikKelas: () => void;
  onOpenProfile?: () => void;
  isExporting: boolean;
  totalSantri?: number;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  tahunAjaranList: TahunAjaran[];
  selectedTahunAjaranId: string;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  currentUser,
  onLogout,
  onOpenQuickLogin,
  onOpenImport,
  onOpenAddSantri,
  onOpenMasterData,
  onOpenUserManagement,
  onExportExcel,
  onOpenNaikKelas,
  onOpenProfile,
  isExporting,
  totalSantri = 2000,
  isOpenMobile,
  onCloseMobile,
  isCollapsed,
  onToggleCollapse,
  tahunAjaranList,
  selectedTahunAjaranId,
}) => {
  const isSuperAdmin = currentUser?.role === 'superadmin';
  const isViewer = currentUser?.role === 'viewer';

  const selectedYear = tahunAjaranList.find((t) => t.id === selectedTahunAjaranId);

  const getRoleBadge = () => {
    if (!currentUser) return null;
    if (currentUser.scopeAsrama === 'putra') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300">
          <Home className="w-3 h-3 shrink-0" />
          <span>Pengelola Asrama Putra</span>
        </span>
      );
    }
    if (currentUser.scopeAsrama === 'putri') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-pink-100 text-pink-800 dark:bg-pink-950/70 dark:text-pink-300">
          <Home className="w-3 h-3 shrink-0" />
          <span>Pengelola Asrama Putri</span>
        </span>
      );
    }
    if (currentUser.role === 'superadmin') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800 dark:bg-purple-950/70 dark:text-purple-300">
          <Shield className="w-3 h-3 shrink-0" />
          <span>Super Admin</span>
        </span>
      );
    }
    if (currentUser.role === 'admin_lembaga') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 dark:bg-blue-950/70 dark:text-blue-300">
          <Layers className="w-3 h-3 shrink-0" />
          <span>Admin Lembaga</span>
        </span>
      );
    }
    if (currentUser.role === 'pengurus_asrama') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300">
          <Home className="w-3 h-3 shrink-0" />
          <span>Pengurus Asrama</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-200 text-slate-800 dark:bg-slate-800 dark:text-slate-300">
        Viewer (Read-Only)
      </span>
    );
  };

  const handleTabClick = (tab: 'santri' | 'staf' | 'asrama' | 'users' | 'stats' | 'audit' | 'deploy') => {
    setActiveTab(tab);
    onCloseMobile();
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpenMobile && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-xs transition-opacity md:hidden"
          aria-hidden="true"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex flex-col bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 transition-all duration-300 ease-in-out md:static md:translate-x-0 ${
          isOpenMobile ? 'translate-x-0 shadow-2xl' : '-translate-x-full'
        } ${isCollapsed ? 'md:w-[76px]' : 'w-72 md:w-64'}`}
      >
        {/* Brand & App Title */}
        <div className="h-16 px-4 flex items-center justify-between border-b border-slate-100 dark:border-slate-800 shrink-0">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-700 to-emerald-500 flex items-center justify-center text-white shadow-sm shadow-emerald-600/30 shrink-0">
              <GraduationCap className="w-5 h-5" />
            </div>
            {!isCollapsed && (
              <div className="flex flex-col min-w-0">
                <span className="font-bold text-slate-900 dark:text-white tracking-tight text-base whitespace-nowrap truncate">
                  SIAKAD Pesantren
                </span>
                <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-semibold uppercase tracking-wider truncate">
                  Cloudflare D1 & R2
                </span>
              </div>
            )}
          </div>

          {/* Mobile Close Button */}
          <button
            onClick={onCloseMobile}
            className="md:hidden p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            aria-label="Tutup Menu"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Desktop Collapse Toggle */}
          <button
            onClick={onToggleCollapse}
            className="hidden md:flex p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title={isCollapsed ? 'Perluas Sidebar' : 'Ciutkan Sidebar'}
            aria-label="Toggle Sidebar"
          >
            {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* User Card (Expanded Mode) */}
        {!isCollapsed && currentUser && (
          <div className="p-3 mx-3 mt-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center text-xs shrink-0 shadow-xs">
                {currentUser.fullName.charAt(0)}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                  {currentUser.fullName}
                </p>
                <div className="mt-0.5">{getRoleBadge()}</div>
              </div>
            </div>
            {selectedYear && (
              <div className="mt-2 pt-2 border-t border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                <span className="flex items-center gap-1 truncate">
                  <Calendar className="w-3 h-3 text-emerald-600 shrink-0" />
                  <span>T.A. {selectedYear.nama}</span>
                </span>
                <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${selectedYear.isActive ? 'text-emerald-700 bg-emerald-100 dark:bg-emerald-950/60' : 'text-amber-700 bg-amber-100 dark:bg-amber-950/60'}`}>
                  {selectedYear.isActive ? 'Aktif' : 'Arsip'}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Navigation Sections */}
        <div className="flex-1 overflow-y-auto px-3 py-3 space-y-5 scrollbar-thin">
          
          {/* Group 1: Menu Utama */}
          <div>
            {!isCollapsed && (
              <p className="px-3 text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1.5">
                Menu Utama
              </p>
            )}
            <nav className="space-y-1">
              {/* Santri */}
              <button
                onClick={() => handleTabClick('santri')}
                title="Data Santri"
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  activeTab === 'santri'
                    ? 'bg-emerald-600 text-white shadow-xs shadow-emerald-600/30'
                    : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-800/80'
                } ${isCollapsed ? 'justify-center px-0' : ''}`}
              >
                <Users className={`w-4 h-4 shrink-0 ${activeTab === 'santri' ? 'text-white' : 'text-slate-500 dark:text-slate-400'}`} />
                {!isCollapsed && (
                  <span className="flex-1 text-left truncate">Data Santri</span>
                )}
                {!isCollapsed && totalSantri > 0 && (
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${
                    activeTab === 'santri' ? 'bg-emerald-700 text-emerald-100' : 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                  }`}>
                    {totalSantri.toLocaleString('id-ID')}
                  </span>
                )}
              </button>

              {/* Staf */}
              <button
                onClick={() => handleTabClick('staf')}
                title="Staf & Asatidz"
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  activeTab === 'staf'
                    ? 'bg-emerald-600 text-white shadow-xs shadow-emerald-600/30'
                    : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-800/80'
                } ${isCollapsed ? 'justify-center px-0' : ''}`}
              >
                <UserCheck className={`w-4 h-4 shrink-0 ${activeTab === 'staf' ? 'text-white' : 'text-slate-500 dark:text-slate-400'}`} />
                {!isCollapsed && (
                  <span className="flex-1 text-left truncate">Staf & Asatidz</span>
                )}
              </button>

              {/* Asrama */}
              <button
                onClick={() => handleTabClick('asrama')}
                title="Asrama & Kamar"
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  activeTab === 'asrama'
                    ? 'bg-emerald-600 text-white shadow-xs shadow-emerald-600/30'
                    : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-800/80'
                } ${isCollapsed ? 'justify-center px-0' : ''}`}
              >
                <Home className={`w-4 h-4 shrink-0 ${activeTab === 'asrama' ? 'text-white' : 'text-slate-500 dark:text-slate-400'}`} />
                {!isCollapsed && (
                  <span className="flex-1 text-left truncate">Asrama & Kamar</span>
                )}
              </button>

              {/* Stats */}
              <button
                onClick={() => handleTabClick('stats')}
                title="Statistik & Analisis"
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  activeTab === 'stats'
                    ? 'bg-emerald-600 text-white shadow-xs shadow-emerald-600/30'
                    : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-800/80'
                } ${isCollapsed ? 'justify-center px-0' : ''}`}
              >
                <BarChart3 className={`w-4 h-4 shrink-0 ${activeTab === 'stats' ? 'text-white' : 'text-slate-500 dark:text-slate-400'}`} />
                {!isCollapsed && (
                  <span className="flex-1 text-left truncate">Statistik</span>
                )}
              </button>
            </nav>
          </div>

          {/* Group 2: Operasional & Akademik */}
          <div>
            {!isCollapsed && (
              <p className="px-3 text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1.5">
                Akademik & Aksi
              </p>
            )}
            <nav className="space-y-1">
              {!isViewer && (
                <button
                  onClick={() => {
                    onCloseMobile();
                    onOpenNaikKelas();
                  }}
                  title="Kenaikan Kelas Massal"
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold text-indigo-700 bg-indigo-50/70 hover:bg-indigo-100/80 dark:bg-indigo-950/40 dark:text-indigo-300 dark:hover:bg-indigo-950/70 transition-colors ${
                    isCollapsed ? 'justify-center px-0' : ''
                  }`}
                >
                  <GraduationCap className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                  {!isCollapsed && <span className="flex-1 text-left truncate">Kenaikan Kelas</span>}
                </button>
              )}

              {!isViewer && (
                <button
                  onClick={() => {
                    onCloseMobile();
                    onOpenImport();
                  }}
                  title="Import Data Excel"
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-800/80 transition-colors ${
                    isCollapsed ? 'justify-center px-0' : ''
                  }`}
                >
                  <Upload className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                  {!isCollapsed && <span className="flex-1 text-left truncate">Import Excel</span>}
                </button>
              )}

              <button
                onClick={() => {
                  onCloseMobile();
                  onExportExcel();
                }}
                disabled={isExporting}
                title="Download Rekap Santri (.xlsx)"
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-800/80 transition-colors ${
                  isCollapsed ? 'justify-center px-0' : ''
                }`}
              >
                <Download className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                {!isCollapsed && (
                  <span className="flex-1 text-left truncate">
                    {isExporting ? 'Memproses...' : 'Export Excel'}
                  </span>
                )}
              </button>
            </nav>
          </div>

          {/* Group 3: Pengaturan & Sistem (Super Admin / Management) */}
          {(isSuperAdmin || activeTab === 'deploy' || activeTab === 'audit') && (
            <div>
              {!isCollapsed && (
                <p className="px-3 text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1.5">
                  Sistem & Konfigurasi
                </p>
              )}
              <nav className="space-y-1">
                {isSuperAdmin && (
                  <>
                    <button
                      onClick={() => handleTabClick('users')}
                      title="Manajemen Akun & Hak Akses"
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                        activeTab === 'users'
                          ? 'bg-purple-600 text-white shadow-xs shadow-purple-600/30'
                          : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-800/80'
                      } ${isCollapsed ? 'justify-center px-0' : ''}`}
                    >
                      <Shield className={`w-4 h-4 shrink-0 ${activeTab === 'users' ? 'text-white' : 'text-purple-600'}`} />
                      {!isCollapsed && <span className="flex-1 text-left truncate">Manajemen Akun</span>}
                    </button>

                    <button
                      onClick={() => {
                        onCloseMobile();
                        onOpenMasterData();
                      }}
                      title="Master Data Lembaga, Asrama & Kamar"
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-800/80 transition-colors ${
                        isCollapsed ? 'justify-center px-0' : ''
                      }`}
                    >
                      <Layers className="w-4 h-4 text-blue-600 shrink-0" />
                      {!isCollapsed && <span className="flex-1 text-left truncate">Master Data</span>}
                    </button>

                    <button
                      onClick={() => handleTabClick('audit')}
                      title="Log Audit Keamanan"
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                        activeTab === 'audit'
                          ? 'bg-purple-600 text-white shadow-xs shadow-purple-600/30'
                          : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-800/80'
                      } ${isCollapsed ? 'justify-center px-0' : ''}`}
                    >
                      <ShieldAlert className={`w-4 h-4 shrink-0 ${activeTab === 'audit' ? 'text-white' : 'text-purple-600'}`} />
                      {!isCollapsed && <span className="flex-1 text-left truncate">Log Audit</span>}
                    </button>
                  </>
                )}

                <button
                  onClick={() => handleTabClick('deploy')}
                  title="Panduan Deployment Cloudflare"
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                    activeTab === 'deploy'
                      ? 'bg-amber-600 text-white shadow-xs shadow-amber-600/30'
                      : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-800/80'
                  } ${isCollapsed ? 'justify-center px-0' : ''}`}
                >
                  <Cloud className={`w-4 h-4 shrink-0 ${activeTab === 'deploy' ? 'text-white' : 'text-amber-600'}`} />
                  {!isCollapsed && <span className="flex-1 text-left truncate">Panduan Deploy</span>}
                </button>
              </nav>
            </div>
          )}

        </div>

        {/* Bottom Actions Area */}
        <div className="p-3 border-t border-slate-200/80 dark:border-slate-800 space-y-1.5 shrink-0 bg-slate-50/50 dark:bg-slate-900/50">
          {onOpenProfile && (
            <button
              onClick={() => {
                onCloseMobile();
                onOpenProfile();
              }}
              title="Profil Pengguna & Keamanan"
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-slate-700 hover:text-slate-900 hover:bg-white dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-800 transition-colors border border-transparent hover:border-slate-200 dark:hover:border-slate-700 ${
                isCollapsed ? 'justify-center px-0' : ''
              }`}
            >
              <Users className="w-4 h-4 text-emerald-600 shrink-0" />
              {!isCollapsed && <span className="flex-1 text-left truncate">Profil Saya</span>}
            </button>
          )}

          {/* Dev Mode Role Switcher */}
          {import.meta.env.DEV && (import.meta.env as any).VITE_DEV_MODE === 'true' && (
            <button
              onClick={() => {
                onCloseMobile();
                onOpenQuickLogin();
              }}
              title="[Dev Only] Ganti Akun & Simulasi Role"
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/40 transition-colors border border-dashed border-amber-300 dark:border-amber-800 ${
                isCollapsed ? 'justify-center px-0' : ''
              }`}
            >
              <UserCheck2 className="w-4 h-4 text-amber-500 shrink-0" />
              {!isCollapsed && <span className="flex-1 text-left truncate">[Dev] Ganti Akun / Role</span>}
            </button>
          )}

          <button
            onClick={() => {
              onCloseMobile();
              onLogout();
            }}
            title="Keluar dari Sistem"
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors ${
              isCollapsed ? 'justify-center px-0' : ''
            }`}
          >
            <LogOut className="w-4 h-4 shrink-0" />
            {!isCollapsed && <span className="flex-1 text-left truncate">Keluar (Logout)</span>}
          </button>
        </div>
      </aside>
    </>
  );
};
