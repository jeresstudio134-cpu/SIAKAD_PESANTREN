import React from 'react';
import { 
  GraduationCap, 
  Users, 
  UserCheck, 
  BarChart3, 
  Cloud, 
  Download, 
  Upload, 
  LogOut, 
  User, 
  ChevronDown,
  Plus,
  Shield,
  Layers,
  Building2,
  Home,
  Calendar,
  ShieldAlert
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
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  currentUser,
  onLogout,
  onOpenQuickLogin,
  onOpenImport,
  onOpenAddSantri,
  onOpenAddStaf,
  onOpenMasterData,
  onOpenUserManagement,
  onExportExcel,
  isExporting,
  tahunAjaranList,
  selectedTahunAjaranId,
  onSelectTahunAjaran,
  onOpenNaikKelas,
}) => {
  const [userMenuOpen, setUserMenuOpen] = React.useState(false);

  const isSuperAdmin = currentUser?.role === 'superadmin';
  const isViewer = currentUser?.role === 'viewer';

  const selectedYear = tahunAjaranList.find((t) => t.id === selectedTahunAjaranId);
  const isSelectedYearActive = selectedYear ? selectedYear.isActive === 1 : true;

  const getRoleBadge = () => {
    if (!currentUser) return null;
    if (currentUser.role === 'superadmin') {
      return (
        <span className="hidden lg:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300">
          <Shield className="w-3 h-3" />
          <span>Super Admin</span>
        </span>
      );
    }
    if (currentUser.role === 'admin_lembaga') {
      return (
        <span className="hidden lg:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300">
          <Building2 className="w-3 h-3" />
          <span>Admin Lembaga</span>
        </span>
      );
    }
    if (currentUser.role === 'pengurus_asrama') {
      return (
        <span className="hidden lg:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
          <Home className="w-3 h-3" />
          <span>Pengurus Asrama</span>
        </span>
      );
    }
    return (
      <span className="hidden lg:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-200 text-slate-800 dark:bg-slate-800 dark:text-slate-300">
        Viewer (Read-Only)
      </span>
    );
  };

  return (
    <header className="sticky top-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between gap-4 md:gap-6 h-16">
        
        {/* Zone 1: Single Element Brand Wordmark + Scoped Role Badge */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-9 h-9 rounded-xl bg-emerald-600 flex items-center justify-center text-white shadow-sm shadow-emerald-600/20">
            <GraduationCap className="w-5 h-5" />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-900 dark:text-white tracking-tight text-base sm:text-lg whitespace-nowrap">
                SIAKAD Pesantren
              </span>
              {getRoleBadge()}
            </div>
            <span className="text-[11px] text-emerald-700 dark:text-emerald-400 font-medium -mt-0.5 hidden sm:inline">
              Cloudflare D1 & R2 Serverless Edge
            </span>
          </div>
        </div>

        {/* Zone 2: Navigation Links */}
        <nav className="hidden md:flex items-center gap-1">
          <button
            onClick={() => setActiveTab('santri')}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
              activeTab === 'santri'
                ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Data Santri</span>
          </button>

          <button
            onClick={() => setActiveTab('staf')}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
              activeTab === 'staf'
                ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5" />
            <span>Staf & Asatidz</span>
          </button>

          <button
            onClick={() => setActiveTab('asrama')}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
              activeTab === 'asrama'
                ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            <Home className="w-3.5 h-3.5" />
            <span>Asrama & Kamar</span>
          </button>

          <button
            onClick={() => setActiveTab('stats')}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
              activeTab === 'stats'
                ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Statistik</span>
          </button>

          {/* Super Admin Log Audit */}
          {isSuperAdmin && (
            <button
              onClick={() => setActiveTab('audit')}
              className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
                activeTab === 'audit'
                  ? 'bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
              }`}
            >
              <ShieldAlert className="w-3.5 h-3.5 text-purple-600" />
              <span>Log Audit</span>
            </button>
          )}

          {/* Super Admin Special Master Data Buttons */}
          {isSuperAdmin && (
            <>
              <button
                onClick={onOpenMasterData}
                title="Kelola Lembaga, Asrama & Kamar"
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg transition-colors text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
              >
                <Layers className="w-3.5 h-3.5 text-blue-600" />
                <span>Master Data</span>
              </button>

              <button
                onClick={onOpenUserManagement}
                title="Kelola Pengguna & Hak Akses Scoped"
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg transition-colors text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
              >
                <Shield className="w-3.5 h-3.5 text-purple-600" />
                <span>Kelola Pengguna</span>
              </button>
            </>
          )}

          <button
            onClick={() => setActiveTab('deploy')}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
              activeTab === 'deploy'
                ? 'bg-amber-50 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            <Cloud className="w-3.5 h-3.5" />
            <span>Panduan Deploy</span>
          </button>
        </nav>

        {/* Zone 3: Actions & User Session */}
        <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
          
          {/* Selector Tahun Ajaran (Semua Tampilan Default Memakai TA Aktif, Dropdown untuk melihat tahun lain) */}
          <div className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200/80 dark:bg-slate-800 dark:hover:bg-slate-700/80 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 transition-colors">
            <Calendar className={`w-3.5 h-3.5 shrink-0 ${isSelectedYearActive ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`} />
            <select
              value={selectedTahunAjaranId}
              onChange={(e) => onSelectTahunAjaran(e.target.value)}
              className="bg-transparent text-xs font-bold text-slate-800 dark:text-slate-100 focus:outline-none cursor-pointer pr-1"
              title="Pilih Tahun Ajaran yang ingin ditampilkan di sistem"
            >
              {tahunAjaranList.map((ta) => (
                <option key={ta.id} value={ta.id} className="text-slate-900 bg-white dark:bg-slate-800 dark:text-white">
                  T.A. {ta.nama} ({ta.semester}) {ta.isActive ? '• [AKTIF]' : '• [Arsip]'}
                </option>
              ))}
            </select>
          </div>

          {/* Action: Naik Kelas Massal (Superadmin & Admin Lembaga) */}
          {!isViewer && (
            <button
              onClick={onOpenNaikKelas}
              title="Proses Akhir Tahun / Naik Kelas Massal (Fitur Wajib)"
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs transition-colors whitespace-nowrap"
            >
              <GraduationCap className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Naik Kelas</span>
            </button>
          )}

          {/* Action: Tambah Santri (if not viewer) */}
          {!isViewer && activeTab === 'santri' && (
            <button
              onClick={onOpenAddSantri}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm transition-colors whitespace-nowrap"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Santri Baru</span>
            </button>
          )}

          {/* Action: Export Excel */}
          <button
            onClick={onExportExcel}
            disabled={isExporting}
            title="Download Rekap Excel (.xlsx) Sesuai Cakupan Wewenang"
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-lg transition-colors whitespace-nowrap"
          >
            <Download className="w-3.5 h-3.5 text-emerald-600" />
            <span className="hidden sm:inline">{isExporting ? 'Proses...' : 'Export Excel'}</span>
          </button>

          {/* Action: Import Excel (non viewer) */}
          {!isViewer && activeTab === 'santri' && (
            <button
              onClick={onOpenImport}
              title="Import Data Santri dari Excel"
              className="hidden xl:flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 rounded-lg transition-colors whitespace-nowrap"
            >
              <Upload className="w-3.5 h-3.5 text-blue-600" />
              <span>Import</span>
            </button>
          )}

          {/* User Account Dropdown */}
          <div className="relative">
            {currentUser ? (
              <div>
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                >
                  <div className="w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 flex items-center justify-center text-xs font-bold uppercase">
                    {currentUser.fullName.charAt(0)}
                  </div>
                  <div className="text-left hidden md:block max-w-[130px] truncate">
                    <p className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate">
                      {currentUser.fullName}
                    </p>
                    <p className="text-[10px] text-slate-500 uppercase tracking-wider">
                      {currentUser.role.replace(/_/g, ' ')}
                    </p>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                </button>

                {userMenuOpen && (
                  <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-slate-900 rounded-xl shadow-lg border border-slate-200 dark:border-slate-800 py-1.5 z-50 animate-in fade-in zoom-in-95">
                    <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-800">
                      <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                        {currentUser.fullName}
                      </p>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Username: @{currentUser.username}
                      </p>
                      <p className="text-[10px] text-emerald-600 font-medium capitalize mt-0.5">
                        Role: {currentUser.role.replace(/_/g, ' ')}
                      </p>
                      {currentUser.role !== 'superadmin' && (
                        <p className="text-[10px] text-amber-600 dark:text-amber-400 mt-1 italic">
                          Cakupan data dipaksa di sisi server Cloudflare
                        </p>
                      )}
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
                            <span>Master Lembaga & Asrama</span>
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

                      <button
                        onClick={() => {
                          setUserMenuOpen(false);
                          onOpenQuickLogin();
                        }}
                        className="w-full text-left px-4 py-2 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2"
                      >
                        <User className="w-3.5 h-3.5 text-slate-400" />
                        <span>Ganti Akun & Simulasi Role</span>
                      </button>

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
        <div className="bg-amber-500/10 border-t border-amber-500/20 px-4 sm:px-6 py-2 text-xs text-amber-900 dark:text-amber-200">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse shrink-0"></span>
              <span>
                <strong>Mode Arsip / Riwayat:</strong> Anda sedang memantau data <strong>Tahun Ajaran {selectedYear.nama} ({selectedYear.semester})</strong>. Seluruh kelas, jenjang, dan asrama disesuaikan dengan rekaman arsip tahun tersebut.
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
