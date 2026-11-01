import React from 'react';
import { 
  Menu,
  GraduationCap, 
  Download, 
  LogOut, 
  User, 
  ChevronDown,
  Plus,
  Shield,
  Layers,
  Building2,
  Home,
  Calendar,
  Sparkles,
  KeyRound,
  Users,
  UserCheck,
  BarChart3,
  ShieldAlert,
  Cloud
} from 'lucide-react';
import type { UserSession, TahunAjaran } from '../types/index.ts';

interface NavbarProps {
  activeTab: 'santri' | 'staf' | 'asrama' | 'stats' | 'audit' | 'deploy';
  setActiveTab: (tab: 'santri' | 'staf' | 'asrama' | 'stats' | 'audit' | 'deploy') => void;
  currentUser: UserSession | null;
  onLogout: () => void;
  onOpenQuickLogin: () => void;
  onOpenImport: () => void;
  onOpenAddSantri: () => void;
  onOpenAddStaf: () => void;
  onOpenMasterData: () => void;
  onOpenUserManagement: () => void;
  onExportExcel: () => void;
  isExporting: boolean;
  tahunAjaranList: TahunAjaran[];
  selectedTahunAjaranId: string;
  onSelectTahunAjaran: (id: string) => void;
  onOpenNaikKelas: () => void;
  onOpenMobileSidebar?: () => void;
  onOpenChangePassword?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  currentUser,
  onLogout,
  onOpenQuickLogin,
  onOpenAddSantri,
  onOpenMasterData,
  onOpenUserManagement,
  onExportExcel,
  isExporting,
  tahunAjaranList,
  selectedTahunAjaranId,
  onSelectTahunAjaran,
  onOpenNaikKelas,
  onOpenMobileSidebar,
  onOpenChangePassword,
}) => {
  const [userMenuOpen, setUserMenuOpen] = React.useState(false);
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  const isSuperAdmin = currentUser?.role === 'superadmin';
  const isViewer = currentUser?.role === 'viewer';

  const selectedYear = tahunAjaranList.find((t) => t.id === selectedTahunAjaranId);
  const isSelectedYearActive = selectedYear ? selectedYear.isActive === 1 : true;

  // Close dropdown on click outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getTabInfo = () => {
    switch (activeTab) {
      case 'santri':
        return {
          title: 'Data Santri',
          desc: 'Manajemen & pemantauan data santri multi-lembaga',
          icon: Users,
        };
      case 'staf':
        return {
          title: 'Staf & Asatidz',
          desc: 'Pengajar, asatidz, pembina & penugasan akademik',
          icon: UserCheck,
        };
      case 'asrama':
        return {
          title: 'Asrama & Kamar',
          desc: 'Alokasi gedung asrama, kapasitas & penghuni kamar',
          icon: Home,
        };
      case 'stats':
        return {
          title: 'Statistik & Analisis',
          desc: 'Grafik sebaran santri, kepatuhan SPP & hafalan Al-Qur\'an',
          icon: BarChart3,
        };
      case 'audit':
        return {
          title: 'Log Audit Keamanan',
          desc: 'Jejak mutasi data & riwayat aktivitas administrator',
          icon: ShieldAlert,
        };
      case 'deploy':
        return {
          title: 'Panduan Deploy Edge',
          desc: 'Arsitektur Cloudflare Workers, D1 Database & R2 Storage',
          icon: Cloud,
        };
    }
  };

  const currentTabInfo = getTabInfo();
  const TabIcon = currentTabInfo.icon;

  const getRoleBadge = () => {
    if (!currentUser) return null;
    if (currentUser.scopeAsrama === 'putra') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300 whitespace-nowrap">
          <Home className="w-3 h-3" />
          <span>Pengelola Asrama Putra</span>
        </span>
      );
    }
    if (currentUser.scopeAsrama === 'putri') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-pink-100 text-pink-800 dark:bg-pink-950/70 dark:text-pink-300 whitespace-nowrap">
          <Home className="w-3 h-3" />
          <span>Pengelola Asrama Putri</span>
        </span>
      );
    }
    if (currentUser.role === 'superadmin') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800 dark:bg-purple-950/70 dark:text-purple-300 whitespace-nowrap">
          <Shield className="w-3 h-3" />
          <span>Super Admin</span>
        </span>
      );
    }
    if (currentUser.role === 'admin_lembaga') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 dark:bg-blue-950/70 dark:text-blue-300 whitespace-nowrap">
          <Building2 className="w-3 h-3" />
          <span>Admin Lembaga</span>
        </span>
      );
    }
    if (currentUser.role === 'pengurus_asrama') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300 whitespace-nowrap">
          <Home className="w-3 h-3" />
          <span>Pengurus Asrama</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-200 text-slate-800 dark:bg-slate-800 dark:text-slate-300 whitespace-nowrap">
        Viewer (Read-Only)
      </span>
    );
  };

  return (
    <header className="sticky top-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 shadow-xs">
      <div className="px-4 md:px-6 w-full flex items-center justify-between gap-3 h-16">
        
        {/* Left: Mobile Sidebar Trigger + Page Title & Icon */}
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={onOpenMobileSidebar}
            className="md:hidden p-2 -ml-1 text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-800 rounded-lg transition-colors"
            aria-label="Buka Menu Sidebar"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2.5 min-w-0">
            <div className="hidden sm:flex w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 items-center justify-center shrink-0">
              <TabIcon className="w-4 h-4" />
            </div>
            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white tracking-tight truncate leading-tight">
                  {currentTabInfo.title}
                </h1>
                <div className="hidden sm:block">
                  {getRoleBadge()}
                </div>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate hidden md:block">
                {currentTabInfo.desc}
              </p>
            </div>
          </div>
        </div>

        {/* Right: Academic Year Selector + Quick Actions + User Dropdown */}
        <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
          
          {/* Selector Tahun Ajaran */}
          <div className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200/80 dark:bg-slate-800 dark:hover:bg-slate-700/80 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 transition-colors">
            <Calendar className={`w-3.5 h-3.5 shrink-0 ${isSelectedYearActive ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`} />
            <select
              value={selectedTahunAjaranId}
              onChange={(e) => onSelectTahunAjaran(e.target.value)}
              className="bg-transparent text-xs font-bold text-slate-800 dark:text-slate-100 focus:outline-none cursor-pointer pr-1"
              title="Pilih Tahun Ajaran yang aktif atau rekaman arsip"
            >
              {tahunAjaranList.map((ta) => (
                <option key={ta.id} value={ta.id} className="text-slate-900 bg-white dark:bg-slate-800 dark:text-white">
                  T.A. {ta.nama} ({ta.semester}) {ta.isActive ? '• [AKTIF]' : '• [Arsip]'}
                </option>
              ))}
            </select>
          </div>

          {/* Action: Tambah Santri Baru (when on santri tab and not viewer) */}
          {!isViewer && activeTab === 'santri' && (
            <button
              onClick={onOpenAddSantri}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs shadow-emerald-600/30 transition-colors whitespace-nowrap"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              <span className="hidden sm:inline">Santri Baru</span>
            </button>
          )}

          {/* Action: Export Excel */}
          <button
            onClick={onExportExcel}
            disabled={isExporting}
            title="Download Rekap Excel (.xlsx)"
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-lg transition-colors whitespace-nowrap"
          >
            <Download className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span className="hidden lg:inline">{isExporting ? 'Memproses...' : 'Export Excel'}</span>
          </button>

          {/* User Account Dropdown */}
          <div className="relative" ref={dropdownRef}>
            {currentUser ? (
              <div>
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 p-1.5 sm:px-2.5 sm:py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                  aria-label="Menu Pengguna"
                >
                  <div className="w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 flex items-center justify-center text-xs font-bold uppercase shrink-0">
                    {currentUser.fullName.charAt(0)}
                  </div>
                  <div className="text-left hidden lg:block max-w-[120px] truncate">
                    <p className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate">
                      {currentUser.fullName}
                    </p>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                </button>

                {userMenuOpen && (
                  <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-800 py-1.5 z-50 animate-in fade-in zoom-in-95">
                    <div className="px-4 py-2.5 border-b border-slate-100 dark:border-slate-800">
                      <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                        {currentUser.fullName}
                      </p>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        @{currentUser.username}
                      </p>
                      <div className="mt-1.5">
                        {getRoleBadge()}
                      </div>
                    </div>

                    <div className="py-1">
                      {isSuperAdmin && (
                        <>
                          <button
                            onClick={() => {
                              setUserMenuOpen(false);
                              onOpenMasterData();
                            }}
                            className="w-full text-left px-4 py-2 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2"
                          >
                            <Layers className="w-3.5 h-3.5 text-blue-500" />
                            <span>Master Data Lembaga & Asrama</span>
                          </button>

                          <button
                            onClick={() => {
                              setUserMenuOpen(false);
                              onOpenUserManagement();
                            }}
                            className="w-full text-left px-4 py-2 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2"
                          >
                            <Shield className="w-3.5 h-3.5 text-purple-500" />
                            <span>Kelola Hak Akses Pengguna</span>
                          </button>
                        </>
                      )}

                      {!isViewer && (
                        <button
                          onClick={() => {
                            setUserMenuOpen(false);
                            onOpenNaikKelas();
                          }}
                          className="w-full text-left px-4 py-2 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2"
                        >
                          <GraduationCap className="w-3.5 h-3.5 text-indigo-500" />
                          <span>Kenaikan Kelas Massal</span>
                        </button>
                      )}

                      {onOpenChangePassword && (
                        <button
                          onClick={() => {
                            setUserMenuOpen(false);
                            onOpenChangePassword();
                          }}
                          className="w-full text-left px-4 py-2 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2"
                        >
                          <KeyRound className="w-3.5 h-3.5 text-slate-400" />
                          <span>Ubah Kata Sandi</span>
                        </button>
                      )}

                      <button
                        onClick={() => {
                          setUserMenuOpen(false);
                          onOpenQuickLogin();
                        }}
                        className="w-full text-left px-4 py-2 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2"
                      >
                        <User className="w-3.5 h-3.5 text-emerald-500" />
                        <span>Ganti Akun & Simulasi Role</span>
                      </button>

                      <div className="my-1 border-t border-slate-100 dark:border-slate-800" />

                      <button
                        onClick={() => {
                          setUserMenuOpen(false);
                          onLogout();
                        }}
                        className="w-full text-left px-4 py-2 text-xs text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 flex items-center gap-2"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>Keluar (Logout)</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={onOpenQuickLogin}
                className="px-3.5 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors whitespace-nowrap"
              >
                Login
              </button>
            )}
          </div>
        </div>

      </div>

      {/* Banner Riwayat/Arsip jika melihat Tahun Ajaran non-aktif */}
      {selectedYear && !selectedYear.isActive && (
        <div className="bg-amber-500/10 border-t border-amber-500/20 px-4 md:px-6 py-2 text-xs text-amber-900 dark:text-amber-200 w-full">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse shrink-0"></span>
              <span>
                <strong>Mode Arsip / Riwayat:</strong> Anda sedang memantau data <strong>Tahun Ajaran {selectedYear.nama} ({selectedYear.semester})</strong>.
              </span>
            </div>
            <button
              onClick={() => {
                const active = tahunAjaranList.find((t) => t.isActive === 1);
                if (active) onSelectTahunAjaran(active.id);
              }}
              className="self-start sm:self-auto px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-md text-[11px] font-bold transition-colors shrink-0 shadow-xs"
            >
              Kembali ke Tahun Aktif
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
