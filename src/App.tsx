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

import type { Santri, DashboardStats, FilterParams, UserSession, Lembaga, Asrama, TahunAjaran } from './types/index.ts';

export default function App() {
  const [activeTab, setActiveTab] = React.useState<'santri' | 'staf' | 'asrama' | 'stats' | 'audit' | 'deploy'>('santri');
  const [currentUser, setCurrentUser] = React.useState<UserSession | null>(null);
  const [stats, setStats] = React.useState<DashboardStats | null>(null);
  const [loadingStats, setLoadingStats] = React.useState(true);
  const [showExportModal, setShowExportModal] = React.useState(false);

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

  // Fetch Current Session
  const fetchSession = async () => {
    try {
      const res = await fetch('/api/auth/me');
      const data = await res.json();
      if (data.user) {
        setCurrentUser(data.user);
      } else {
        // Auto default to Superadmin for initial preview
        const qRes = await fetch('/api/auth/quick-login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ role: 'superadmin' }),
        });
        const qData = await qRes.json();
        if (qData.user) setCurrentUser(qData.user);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Fetch Master Data (Lembaga, Asrama, Tahun Ajaran)
  const fetchMasterData = async () => {
    try {
      const [lRes, aRes, taRes] = await Promise.all([
        fetch('/api/master/lembaga'),
        fetch('/api/master/asrama'),
        fetch('/api/master/tahun-ajaran'),
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

      const res = await fetch(`/api/stats?${params.toString()}`);
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

      const res = await fetch(`/api/santri?${params.toString()}`);
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

  // Debounced search / filter / academic year update
  React.useEffect(() => {
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
      jenisKelamin: 'semua',
      status: 'semua',
      statusSpp: 'semua',
      minJuz: 0,
      sortField: 'nis',
      sortDir: 'asc',
      page: 1,
      limit: 50,
    });
  };

  // Logout
  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    setCurrentUser(null);
    setShowLoginModal(true);
  };

  // Delete Santri
  const handleDeleteSantri = async (id: string, nama: string) => {
    if (!confirm(`Hapus data santri "${nama}" secara permanen?`)) return;
    try {
      const res = await fetch(`/api/santri/${id}`, { method: 'DELETE' });
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
    await fetch('/api/santri/batch-status', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids: selectedIds, status }),
    });
    setSelectedIds([]);
    fetchSantri();
    fetchStats();
  };

  const isViewer = currentUser?.role === 'viewer';

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
        onOpenUserManagement={() => setShowUserModal(true)}
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
          onOpenUserManagement={() => setShowUserModal(true)}
          onExportExcel={() => setShowExportModal(true)}
          isExporting={isExporting}
          tahunAjaranList={tahunAjarans}
          selectedTahunAjaranId={selectedTahunAjaranId}
          onSelectTahunAjaran={(id) => setSelectedTahunAjaranId(id)}
          onOpenNaikKelas={() => setShowNaikKelasModal(true)}
          onOpenMobileSidebar={() => setIsMobileSidebarOpen(true)}
          onOpenChangePassword={() => setShowManualChangePassword(true)}
        />

        {/* Main Content Viewport (Fluid Full-Width) */}
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

        {/* TAB 4: STATISTIK & ANALISIS */}
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

        {/* TAB 5: LOG AUDIT (SUPER ADMIN) */}
        {activeTab === 'audit' && (
          <AuditLogView currentUser={currentUser} />
        )}

        {/* TAB 6: PANDUAN DEPLOY CLOUDFLARE */}
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

      {/* User Management Modal (Superadmin) */}
      {showUserModal && (
        <UserManagementModal
          onClose={() => setShowUserModal(false)}
          onRefreshParent={() => {
            fetchSession();
          }}
        />
      )}

      {/* Login Modal */}
      {showLoginModal && (
        <LoginModal
          onClose={() => setShowLoginModal(false)}
          onLoginSuccess={(user) => {
            setCurrentUser(user);
            fetchStats();
            fetchSantri();
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

      {/* Password Change Modal */}
      {currentUser && (currentUser.mustChangePassword || showManualChangePassword) && (
        <ChangePasswordModal
          user={currentUser}
          onSuccess={(updatedUser) => {
            setCurrentUser(updatedUser);
            setShowManualChangePassword(false);
          }}
          onLogout={async () => {
            await fetch('/api/auth/logout', { method: 'POST' });
            setCurrentUser(null);
            setShowManualChangePassword(false);
            setShowLoginModal(true);
          }}
        />
      )}

    </div>
  );
}
