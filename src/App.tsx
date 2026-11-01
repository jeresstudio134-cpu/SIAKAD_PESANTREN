import React from 'react';
import { Sidebar } from './components/Sidebar.tsx';
import { Navbar } from './components/Navbar.tsx';
import { MobileBottomNav } from './components/MobileBottomNav.tsx';
import { StatsCards } from './components/StatsCards.tsx';
import { FilterBar } from './components/FilterBar.tsx';
import { SantriTable } from './components/SantriTable.tsx';
import { SantriDetailModal } from './components/SantriDetailModal.tsx';
import { SantriFormModal } from './components/SantriFormModal.tsx';
import { KartuSantriModal } from './components/KartuSantriModal.tsx';
import { BatchActionModal } from './components/BatchActionModal.tsx';
import { ImportExcelModal } from './components/ImportExcelModal.tsx';
import { MasterDataModal } from './components/MasterDataModal.tsx';
import { UserManagementModal } from './components/UserManagementModal.tsx';
import { StafView } from './components/StafView.tsx';
import { StatsView } from './components/StatsView.tsx';
import { DeployModal } from './components/DeployModal.tsx';
import { LoginModal } from './components/LoginModal.tsx';
import { NaikKelasModal } from './components/NaikKelasModal.tsx';
import { KamarView } from './components/KamarView.tsx';
import { AuditLogView } from './components/AuditLogView.tsx';
import { ExportModal } from './components/ExportModal.tsx';
import { ChangePasswordModal } from './components/ChangePasswordModal.tsx';
import { LoginPage } from './components/LoginPage.tsx';
import { ProfileModal } from './components/ProfileModal.tsx';
import { UserManagementView } from './components/UserManagementView.tsx';
import { authFetch, removeSessionToken } from './utils/api.ts';

import type { Santri, DashboardStats, FilterParams, UserSession, Lembaga, Asrama, TahunAjaran } from './types/index.ts';

export default function App() {
  const [activeTab, setActiveTab] = React.useState<'santri' | 'staf' | 'asrama' | 'users' | 'stats' | 'audit' | 'deploy'>('santri');
  const [currentUser, setCurrentUser] = React.useState<UserSession | null>(null);
  const [sessionChecking, setSessionChecking] = React.useState(true);
  const [stats, setStats] = React.useState<DashboardStats | null>(null);
  const [loadingStats, setLoadingStats] = React.useState(true);
  const [showExportModal, setShowExportModal] = React.useState(false);
  const [showProfileModal, setShowProfileModal] = React.useState(false);

  // Master Data & Academic Year State
  const [lembagas, setLembagas] = React.useState<Lembaga[]>([]);
  const [asramas, setAsramas] = React.useState<Asrama[]>([]);
  const [tahunAjarans, setTahunAjarans] = React.useState<TahunAjaran[]>([]);
  const [selectedTahunAjaranId, setSelectedTahunAjaranId] = React.useState<string>('');
  const [showNaikKelasModal, setShowNaikKelasModal] = React.useState(false);

  // Santri Table Data
  const [santriList, setSantriList] = React.useState<Santri[]>([]);
  const [totalSantri, setTotalSantri] = React.useState(0);
  const [totalPages, setTotalPages] = React.useState(1);
  const [loadingSantri, setLoadingSantri] = React.useState(true);
  const [selectedIds, setSelectedIds] = React.useState<string[]>([]);
  const [isExporting, setIsExporting] = React.useState(false);

  // Filters State
  const [filters, setFilters] = React.useState<FilterParams>({
    search: '',
    lembagaId: 'semua',
    jenjang: 'semua',
    kelas: 'semua',
    asramaId: 'semua',
    jenisKelamin: 'semua',
    status: 'semua',
    statusSpp: 'semua',
    minJuz: 0,
    sortField: 'nis',
    sortDir: 'asc',
    page: 1,
    limit: 50,
  });

  // Modal Dialogs
  const [detailSantri, setDetailSantri] = React.useState<Santri | null>(null);
  const [editingSantri, setEditingSantri] = React.useState<Santri | null>(null);
  const [isAddingSantri, setIsAddingSantri] = React.useState(false);
  const [cardSantri, setCardSantri] = React.useState<Santri | null>(null);
  const [showBatchModal, setShowBatchModal] = React.useState(false);
  const [showImportModal, setShowImportModal] = React.useState(false);
  const [showLoginModal, setShowLoginModal] = React.useState(false);
  const [showMasterModal, setShowMasterModal] = React.useState(false);
  const [showUserModal, setShowUserModal] = React.useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = React.useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = React.useState(false);
  const [showManualChangePassword, setShowManualChangePassword] = React.useState(false);

  // Logout handler
  const handleLogout = async () => {
    try {
      await authFetch('/api/auth/logout', { method: 'POST' });
    } catch (e) {}
    removeSessionToken();
    setCurrentUser(null);
    setShowProfileModal(false);
    setShowManualChangePassword(false);
  };

  // Fetch Current Session (Strict: No auto-login)
  const fetchSession = async () => {
    try {
      setSessionChecking(true);
      const res = await authFetch('/api/auth/me');
      if (res.status === 401) {
        setCurrentUser(null);
        return;
      }
      const data = await res.json();
      if (data.user) {
        setCurrentUser(data.user);
      } else {
        setCurrentUser(null);
      }
    } catch (err) {
      console.error(err);
      setCurrentUser(null);
    } finally {
      setSessionChecking(false);
    }
  };

  // Fetch Master Data (Lembaga, Asrama, Tahun Ajaran)
  const fetchMasterData = async () => {
    try {
      const [lRes, aRes, taRes] = await Promise.all([
        authFetch('/api/master/lembaga'),
        authFetch('/api/master/asrama'),
        authFetch('/api/master/tahun-ajaran'),
      ]);

      const [lData, aData, taData] = await Promise.all([
        lRes.json(),
        aRes.json(),
        taRes.json(),
      ]);

      setLembagas(lData.data || []);
      setAsramas(aData.data || []);
      const taList: TahunAjaran[] = taData.data || [];
      setTahunAjarans(taList);

      // Default ke tahun ajaran aktif jika belum ada pilihan
      const activeTA = taList.find((t) => t.isActive === 1);
      if (activeTA) {
        setSelectedTahunAjaranId((prev) => prev || activeTA.id);
      } else if (taList.length > 0) {
        setSelectedTahunAjaranId((prev) => prev || taList[0].id);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Fetch Stats (Server-side scoped & filtered by academic year)
  const fetchStats = async () => {
    try {
      setLoadingStats(true);
      const params = new URLSearchParams();
      if (selectedTahunAjaranId) params.set('tahunAjaranId', selectedTahunAjaranId);

      const res = await authFetch(`/api/stats?${params.toString()}`);
      if (res.status === 401) {
        setCurrentUser(null);
        return;
      }
      const data = await res.json();
      setStats(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingStats(false);
    }
  };

  // Fetch Santri List (Server-side scoped & filtered by academic year)
  const fetchSantri = async () => {
    try {
      setLoadingSantri(true);
      const params = new URLSearchParams();

      if (selectedTahunAjaranId) params.set('tahunAjaranId', selectedTahunAjaranId);
      if (filters.search) params.set('search', filters.search);
      if (filters.lembagaId && filters.lembagaId !== 'semua') params.set('lembagaId', filters.lembagaId);
      if (filters.jenjang && filters.jenjang !== 'semua') params.set('jenjang', filters.jenjang);
      if (filters.kelas && filters.kelas !== 'semua') params.set('kelas', filters.kelas);
      if (filters.asramaId && filters.asramaId !== 'semua') params.set('asramaId', filters.asramaId);
      if (filters.jenisKelamin && filters.jenisKelamin !== 'semua') params.set('jenisKelamin', filters.jenisKelamin);
      if (filters.status && filters.status !== 'semua') params.set('status', filters.status);
      if (filters.statusSpp && filters.statusSpp !== 'semua') params.set('statusSpp', filters.statusSpp);
      if (filters.minJuz && filters.minJuz > 0) params.set('minJuz', String(filters.minJuz));
      if (filters.sortField) params.set('sortField', filters.sortField);
      if (filters.sortDir) params.set('sortDir', filters.sortDir);
      if (filters.page) params.set('page', String(filters.page));
      if (filters.limit) params.set('limit', String(filters.limit));

      const res = await authFetch(`/api/santri?${params.toString()}`);
      if (res.status === 401) {
        setCurrentUser(null);
        return;
      }
      const data = await res.json();

      setSantriList(data.data || []);
      setTotalSantri(data.total || 0);
      setTotalPages(data.totalPages || 1);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingSantri(false);
    }
  };

  // Initial Load
  React.useEffect(() => {
    fetchSession();
    fetchMasterData();
  }, []);

  // Sync filters and master data on user change
  React.useEffect(() => {
    if (currentUser) {
      fetchMasterData();
      if (currentUser.scopeAsrama === 'putra') {
        setFilters((prev) => ({ ...prev, jenisKelamin: 'L', asramaId: 'semua', page: 1 }));
      } else if (currentUser.scopeAsrama === 'putri') {
        setFilters((prev) => ({ ...prev, jenisKelamin: 'P', asramaId: 'semua', page: 1 }));
      }
    }
  }, [currentUser?.id, currentUser?.scopeAsrama]);

  // Debounced search / filter / academic year update
  React.useEffect(() => {
    if (!currentUser || currentUser.mustChangePassword) return;
    const timer = setTimeout(() => {
      fetchSantri();
      fetchStats();
    }, 180);
    return () => clearTimeout(timer);
  }, [filters, currentUser, selectedTahunAjaranId]);

  const handleResetFilters = () => {
    setFilters({
      search: '',
      lembagaId: 'semua',
      jenjang: 'semua',
      kelas: 'semua',
      asramaId: 'semua',
      jenisKelamin: currentUser?.scopeAsrama === 'putra' ? 'L' : currentUser?.scopeAsrama === 'putri' ? 'P' : 'semua',
      status: 'semua',
      statusSpp: 'semua',
      minJuz: 0,
      sortField: 'nis',
      sortDir: 'asc',
      page: 1,
      limit: 50,
    });
  };


  // Delete Santri
  const handleDeleteSantri = async (id: string, nama: string) => {
    if (!confirm(`Hapus data santri "${nama}" secara permanen?`)) return;
    try {
      const res = await authFetch(`/api/santri/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const err = await res.json();
        alert(err.error || 'Gagal menghapus');
        return;
      }
      fetchSantri();
      fetchStats();
    } catch (err) {
      console.error(err);
    }
  };

  // Export Excel
  const handleExportExcel = () => {
    setIsExporting(true);
    const params = new URLSearchParams();
    if (selectedTahunAjaranId) params.set('tahunAjaranId', selectedTahunAjaranId);
    if (filters.search) params.set('search', filters.search);
    if (filters.lembagaId && filters.lembagaId !== 'semua') params.set('lembagaId', filters.lembagaId);
    if (filters.asramaId && filters.asramaId !== 'semua') params.set('asramaId', filters.asramaId);
    if (filters.status && filters.status !== 'semua') params.set('status', filters.status);

    window.location.href = `/api/export/santri?${params.toString()}`;
    setTimeout(() => setIsExporting(false), 2000);
  };

  // Batch Status Update
  const handleBatchStatusSubmit = async (status: string) => {
    if (selectedIds.length === 0) return;
    await authFetch('/api/santri/batch-status', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids: selectedIds, status }),
    });
    setSelectedIds([]);
    fetchSantri();
    fetchStats();
  };

  const isViewer = currentUser?.role === 'viewer';

  // 1. Loading State while checking session
  if (sessionChecking) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-white p-4">
        <div className="w-9 h-9 border-3 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin mb-3" />
        <p className="text-xs font-semibold text-slate-300">Memeriksa status sesi SIAKAD...</p>
        <p className="text-[11px] text-slate-500 mt-1">Harap tunggu sejenak</p>
      </div>
    );
  }

  // 2. Mandatory Full-screen Login Page (Strict: No unauthenticated access)
  if (!currentUser) {
    return (
      <LoginPage
        onLoginSuccess={(user) => {
          setCurrentUser(user);
          if (!user.mustChangePassword) {
            fetchMasterData();
            fetchStats();
            fetchSantri();
          }
        }}
      />
    );
  }

  // 3. Mandatory Initial Password Change (Cannot proceed until changed)
  if (currentUser.mustChangePassword) {
    return (
      <ChangePasswordModal
        user={currentUser}
        onSuccess={(updatedUser) => {
          setCurrentUser(updatedUser);
          fetchMasterData();
          fetchStats();
          fetchSantri();
        }}
        onLogout={handleLogout}
      />
    );
  }

  return (
    <div className="min-h-screen flex bg-slate-50 dark:bg-slate-950 selection:bg-emerald-100 selection:text-emerald-900">
      
      {/* 1. Dashboard Sidebar Menu */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        currentUser={currentUser}
        onLogout={handleLogout}
        onOpenQuickLogin={() => setShowLoginModal(true)}
        onOpenImport={() => setShowImportModal(true)}
        onOpenAddSantri={() => setIsAddingSantri(true)}
        onOpenMasterData={() => setShowMasterModal(true)}
        onOpenUserManagement={() => setActiveTab('users')}
        onOpenProfile={() => setShowProfileModal(true)}
        onExportExcel={() => setShowExportModal(true)}
        onOpenNaikKelas={() => setShowNaikKelasModal(true)}
        isExporting={isExporting}
        totalSantri={stats?.totalSantri || totalSantri}
        isOpenMobile={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed((prev) => !prev)}
        tahunAjaranList={tahunAjarans}
        selectedTahunAjaranId={selectedTahunAjaranId}
      />

      {/* 2. Main Page Container (Header + Content) */}
      <div className="flex-1 flex flex-col min-w-0 pb-20 md:pb-8">
        <Navbar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          currentUser={currentUser}
          onLogout={handleLogout}
          onOpenQuickLogin={() => setShowLoginModal(true)}
          onOpenImport={() => setShowImportModal(true)}
          onOpenAddSantri={() => setIsAddingSantri(true)}
          onOpenAddStaf={() => setActiveTab('staf')}
          onOpenMasterData={() => setShowMasterModal(true)}
          onOpenUserManagement={() => setActiveTab('users')}
          onOpenProfile={() => setShowProfileModal(true)}
          onExportExcel={() => setShowExportModal(true)}
          isExporting={isExporting}
          tahunAjaranList={tahunAjarans}
          selectedTahunAjaranId={selectedTahunAjaranId}
          onSelectTahunAjaran={(id) => setSelectedTahunAjaranId(id)}
          onOpenNaikKelas={() => setShowNaikKelasModal(true)}
          onOpenMobileSidebar={() => setIsMobileSidebarOpen(true)}
          onOpenChangePassword={() => setShowManualChangePassword(true)}
        />

        {/* Main Content Viewport */}
        <main className="flex-1 w-full px-4 md:px-6 py-5">
        
        {/* TAB 1: DATA SANTRI */}
        {activeTab === 'santri' && (
          <div>
            {/* Top Stat Cards with Clickable Filter Triggers */}
            <StatsCards
              stats={stats}
              loading={loadingStats}
              onFilterByStatus={(st) => setFilters((prev) => ({ ...prev, status: st, page: 1 }))}
              onFilterBySpp={(spp) => setFilters((prev) => ({ ...prev, statusSpp: spp, page: 1 }))}
            />

            {/* Filter Bar with Scoped RBAC banner & Lembaga / Asrama selectors */}
            <FilterBar
              filters={filters}
              setFilters={setFilters}
              onReset={handleResetFilters}
              totalFiltered={totalSantri}
              totalAll={stats?.totalSantri || 2000}
              lembagas={lembagas}
              asramas={asramas}
              currentUser={currentUser}
            />

            {/* Santri Data Table */}
            <SantriTable
              data={santriList}
              loading={loadingSantri}
              total={totalSantri}
              page={filters.page || 1}
              totalPages={totalPages}
              limit={filters.limit || 50}
              filters={filters}
              setFilters={setFilters}
              selectedIds={selectedIds}
              setSelectedIds={setSelectedIds}
              onViewDetail={(s) => setDetailSantri(s)}
              onEditSantri={(s) => setEditingSantri(s)}
              onDeleteSantri={handleDeleteSantri}
              onPrintCard={(s) => setCardSantri(s)}
              onOpenBatchStatus={() => setShowBatchModal(true)}
              currentUser={currentUser}
            />
          </div>
        )}

        {/* TAB 2: DATA STAF & ASATIDZ */}
        {activeTab === 'staf' && (
          <StafView onOpenAddModal={() => {}} />
        )}

        {/* TAB 3: MANAJEMEN ASRAMA & KAMAR */}
        {activeTab === 'asrama' && (
          <KamarView
            asramas={asramas}
            currentUser={currentUser}
            onRefreshMaster={fetchMasterData}
          />
        )}

        {/* TAB 4: MANAJEMEN AKUN & HAK AKSES (SUPER ADMIN ONLY) */}
        {activeTab === 'users' && currentUser.role === 'superadmin' && (
          <UserManagementView
            currentUser={currentUser}
            lembagas={lembagas}
            asramas={asramas}
          />
        )}

        {/* TAB 5: STATISTIK & ANALISIS */}
        {activeTab === 'stats' && (
          <StatsView
            stats={stats}
            onFilterJenjang={(jenjang) => {
              setFilters((prev) => ({ ...prev, jenjang, page: 1 }));
              setActiveTab('santri');
            }}
            onFilterSpp={(spp) => {
              setFilters((prev) => ({ ...prev, statusSpp: spp, page: 1 }));
              setActiveTab('santri');
            }}
          />
        )}

        {/* TAB 6: LOG AUDIT (SUPER ADMIN) */}
        {activeTab === 'audit' && (
          <AuditLogView currentUser={currentUser} />
        )}

        {/* TAB 7: PANDUAN DEPLOY CLOUDFLARE */}
        {activeTab === 'deploy' && (
          <DeployModal />
        )}

      </main>
      </div>

      {/* 3. Mobile Fixed Bottom Navigation */}
      <MobileBottomNav
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenAddModal={() => {
          if (!isViewer) {
            setIsAddingSantri(true);
          }
        }}
      />

      {/* 4. MODALS */}
      {/* Detail Modal */}
      {detailSantri && (
        <SantriDetailModal
          santri={detailSantri}
          currentUser={currentUser}
          onClose={() => setDetailSantri(null)}
          onRefresh={() => {
            fetchSantri();
            fetchStats();
          }}
        />
      )}

      {/* Add / Edit Santri Modal */}
      {(isAddingSantri || editingSantri) && !isViewer && (
        <SantriFormModal
          initialData={editingSantri}
          lembagas={lembagas}
          asramas={asramas}
          tahunAjarans={tahunAjarans}
          selectedTahunAjaranId={selectedTahunAjaranId}
          currentUser={currentUser}
          onClose={() => {
            setIsAddingSantri(false);
            setEditingSantri(null);
          }}
          onSuccess={() => {
            setIsAddingSantri(false);
            setEditingSantri(null);
            fetchSantri();
            fetchStats();
            fetchMasterData();
          }}
        />
      )}

      {/* Print KTS Card Modal */}
      {cardSantri && (
        <KartuSantriModal
          santri={cardSantri}
          onClose={() => setCardSantri(null)}
        />
      )}

      {/* Batch Status Update Modal */}
      {showBatchModal && !isViewer && (
        <BatchActionModal
          selectedCount={selectedIds.length}
          onClose={() => setShowBatchModal(false)}
          onSubmit={handleBatchStatusSubmit}
        />
      )}

      {/* Import Excel Modal */}
      {showImportModal && !isViewer && (
        <ImportExcelModal
          currentUser={currentUser}
          onClose={() => setShowImportModal(false)}
          onSuccess={() => {
            setShowImportModal(false);
            fetchSantri();
            fetchStats();
          }}
        />
      )}

      {/* Master Data Modal (Superadmin) */}
      {showMasterModal && (
        <MasterDataModal
          onClose={() => setShowMasterModal(false)}
          onRefreshParent={() => {
            fetchMasterData();
            fetchSantri();
            fetchStats();
          }}
          onOpenNaikKelas={() => setShowNaikKelasModal(true)}
        />
      )}

      {/* Profil Saya Modal */}
      {showProfileModal && currentUser && (
        <ProfileModal
          user={currentUser}
          lembagas={lembagas}
          asramas={asramas}
          onClose={() => setShowProfileModal(false)}
          onLogout={handleLogout}
          onPasswordChanged={() => {
            fetchSession();
          }}
        />
      )}

      {/* Proses Akhir Tahun / Naik Kelas Massal Modal */}
      <NaikKelasModal
        isOpen={showNaikKelasModal}
        onClose={() => setShowNaikKelasModal(false)}
        tahunAjarans={tahunAjarans}
        lembagas={lembagas}
        onSuccess={() => {
          fetchMasterData();
          fetchSantri();
          fetchStats();
        }}
      />

      {/* Export Excel Modal */}
      <ExportModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        activeFilters={filters}
        selectedTahunAjaran={tahunAjarans.find((t) => t.id === selectedTahunAjaranId)}
      />

      {/* Password Change Modal (Manual trigger from profile) */}
      {currentUser && showManualChangePassword && (
        <ChangePasswordModal
          user={currentUser}
          onSuccess={(updatedUser) => {
            setCurrentUser(updatedUser);
            setShowManualChangePassword(false);
          }}
          onLogout={handleLogout}
        />
      )}

    </div>
  );
}
