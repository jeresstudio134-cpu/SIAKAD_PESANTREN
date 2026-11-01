import React, { useState, useEffect } from 'react';
import { 
  Users, 
  UserPlus, 
  Shield, 
  Building2, 
  Home, 
  Search, 
  Filter, 
  Edit3, 
  Trash2, 
  Key, 
  RotateCcw, 
  Check, 
  X, 
  AlertCircle, 
  Clock, 
  Copy, 
  CheckCircle2, 
  Eye, 
  ShieldAlert, 
  Layers, 
  Lock, 
  Smartphone,
  ChevronLeft,
  ChevronRight,
  History,
  UserCheck
} from 'lucide-react';
import type { UserItem, Lembaga, Asrama, Staf, Role, UserSession } from '../types/index.ts';
import { authFetch } from '../utils/api.ts';

interface UserManagementViewProps {
  currentUser: UserSession;
  lembagas: Lembaga[];
  asramas: Asrama[];
}

export const UserManagementView: React.FC<UserManagementViewProps> = ({
  currentUser,
  lembagas,
  asramas,
}) => {
  const [users, setUsers] = useState<UserItem[]>([]);
  const [stafList, setStafList] = useState<Staf[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Filters & Pagination
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('semua');
  const [statusFilter, setStatusFilter] = useState<string>('semua');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalUsers, setTotalUsers] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Dialog States
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingUser, setEditingUser] = useState<UserItem | null>(null);
  const [historyUser, setHistoryUser] = useState<UserItem | null>(null);
  const [loginLogs, setLoginLogs] = useState<any[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);

  // One-time Password Reveal Modal
  const [revealedPassword, setRevealedPassword] = useState<{ username: string; password: string; title: string } | null>(null);
  const [copied, setCopied] = useState(false);

  // Delete Confirmation
  const [userToDelete, setUserToDelete] = useState<UserItem | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Add / Edit Form State
  const [formData, setFormData] = useState({
    fullName: '',
    username: '',
    role: 'admin_lembaga' as Role,
    assignedLembagaIds: [] as string[],
    scopeAsrama: 'semua' as 'putra' | 'putri' | 'semua',
    phone: '',
    stafId: '',
  });

  // Fetch Users
  const fetchUsers = async () => {
    try {
      setLoading(true);
      setErrorMsg(null);
      const params = new URLSearchParams();
      if (search.trim()) params.set('search', search.trim());
      if (roleFilter !== 'semua') params.set('role', roleFilter);
      if (statusFilter !== 'semua') params.set('status', statusFilter);
      params.set('page', String(page));
      params.set('limit', String(limit));

      const res = await authFetch(`/api/users?${params.toString()}`);
      if (res.status === 401) {
        window.location.reload();
        return;
      }
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal memuat data pengguna');

      setUsers(data.data || []);
      setTotalUsers(data.total || 0);
      setTotalPages(data.totalPages || 1);
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Fetch Staf list for optional linking
  const fetchStaf = async () => {
    try {
      const res = await authFetch('/api/staf?limit=100');
      const data = await res.json();
      if (data.data) setStafList(data.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [search, roleFilter, statusFilter, page, limit]);

  useEffect(() => {
    fetchStaf();
  }, []);

  // Open Add Modal
  const handleOpenAdd = () => {
    setFormData({
      fullName: '',
      username: '',
      role: 'admin_lembaga',
      assignedLembagaIds: lembagas.length > 0 ? [lembagas[0].id] : [],
      scopeAsrama: 'semua',
      phone: '',
      stafId: '',
    });
    setShowAddModal(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (user: UserItem) => {
    setEditingUser(user);
    setFormData({
      fullName: user.fullName,
      username: user.username,
      role: user.role,
      assignedLembagaIds: user.assignedLembagaIds || [],
      scopeAsrama: user.scopeAsrama || 'semua',
      phone: user.phone || '',
      stafId: user.stafId || '',
    });
  };

  // Submit Add User
  const handleSaveAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      setErrorMsg(null);

      const res = await authFetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal membuat akun pengguna');

      setShowAddModal(false);
      fetchUsers();

      // Show One-Time Generated Password
      setRevealedPassword({
        username: data.username,
        password: data.generatedPassword,
        title: 'Kata Sandi Awal Akun Baru',
      });
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Submit Edit User
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    try {
      setLoading(true);
      setErrorMsg(null);

      const res = await authFetch(`/api/users/${editingUser.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal memperbarui akun');

      setEditingUser(null);
      setSuccessMsg('Data akun berhasil diperbarui');
      fetchUsers();
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Toggle Active/Inactive
  const handleToggleStatus = async (user: UserItem) => {
    try {
      setErrorMsg(null);
      const res = await authFetch(`/api/users/${user.id}/toggle-status`, {
        method: 'POST',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal mengubah status akun');

      setSuccessMsg(data.message);
      fetchUsers();
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      setErrorMsg(err.message);
    }
  };

  // Reset Password
  const handleResetPassword = async (user: UserItem) => {
    if (!window.confirm(`Yakin ingin mereset kata sandi untuk pengguna @${user.username}? Semua sesi aktif lama akan langsung dicabut.`)) {
      return;
    }

    try {
      setErrorMsg(null);
      const res = await authFetch(`/api/users/${user.id}/reset-password`, {
        method: 'POST',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal mereset kata sandi');

      setRevealedPassword({
        username: user.username,
        password: data.generatedPassword,
        title: 'Kata Sandi Baru Sementara (Reset)',
      });
      fetchUsers();
    } catch (err: any) {
      setErrorMsg(err.message);
    }
  };

  // Delete User
  const handleConfirmDelete = async () => {
    if (!userToDelete) return;
    try {
      setDeleting(true);
      setErrorMsg(null);

      const res = await authFetch(`/api/users/${userToDelete.id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal menghapus akun');

      setUserToDelete(null);
      setSuccessMsg(data.message || 'Akun berhasil dihapus');
      fetchUsers();
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setDeleting(false);
    }
  };

  // View Login History
  const handleOpenHistory = async (user: UserItem) => {
    setHistoryUser(user);
    setLoadingLogs(true);
    try {
      const res = await authFetch(`/api/users/${user.id}/login-history`);
      const data = await res.json();
      setLoginLogs(data.data || []);
    } catch (err) {
      console.error(err);
      setLoginLogs([]);
    } finally {
      setLoadingLogs(false);
    }
  };

  // Copy to clipboard
  const handleCopyPassword = () => {
    if (!revealedPassword) return;
    navigator.clipboard.writeText(revealedPassword.password);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatRoleBadge = (user: UserItem) => {
    if (user.role === 'superadmin') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-purple-100 text-purple-800 dark:bg-purple-950/70 dark:text-purple-300">
          <Shield className="w-3 h-3 text-purple-600" />
          <span>Super Admin</span>
        </span>
      );
    }
    if (user.role === 'admin_lembaga') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-100 text-blue-800 dark:bg-blue-950/70 dark:text-blue-300">
          <Layers className="w-3 h-3 text-blue-600" />
          <span>Admin Lembaga</span>
        </span>
      );
    }
    if (user.role === 'pengurus_asrama') {
      if (user.scopeAsrama === 'putra') {
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300">
            <Home className="w-3 h-3 text-amber-600" />
            <span>Pengelola Asrama Putra</span>
          </span>
        );
      }
      if (user.scopeAsrama === 'putri') {
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-pink-100 text-pink-800 dark:bg-pink-950/70 dark:text-pink-300">
            <Home className="w-3 h-3 text-pink-600" />
            <span>Pengelola Asrama Putri</span>
          </span>
        );
      }
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300">
          <Home className="w-3 h-3 text-amber-600" />
          <span>Pengurus Asrama</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-200 text-slate-800 dark:bg-slate-800 dark:text-slate-300">
        <Eye className="w-3 h-3 text-slate-500" />
        <span>Viewer (Hanya Baca)</span>
      </span>
    );
  };

  const formatScopeBadge = (user: UserItem) => {
    if (user.role === 'superadmin') {
      return <span className="text-slate-500 italic text-[11px]">Semua Lembaga & Asrama</span>;
    }
    if (user.role === 'admin_lembaga') {
      if (!user.assignedLembagaIds || user.assignedLembagaIds.length === 0) {
        return <span className="text-slate-400 text-[11px]">Belum diatur</span>;
      }
      return (
        <div className="flex flex-wrap gap-1 max-w-xs">
          {user.assignedLembagaIds.map((lId) => {
            const l = lembagas.find((item) => item.id === lId);
            return (
              <span key={lId} className="px-2 py-0.5 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60 text-blue-700 dark:text-blue-300 rounded text-[10px] font-medium">
                {l ? l.kode : lId}
              </span>
            );
          })}
        </div>
      );
    }
    if (user.role === 'pengurus_asrama') {
      return (
        <span className="px-2 py-0.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 text-amber-800 dark:text-amber-300 rounded text-[10px] font-medium">
          {user.scopeAsrama === 'putra' ? 'Asrama Putra' : user.scopeAsrama === 'putri' ? 'Asrama Putri' : 'Semua Asrama'}
        </span>
      );
    }
    return <span className="text-slate-400 text-[11px]">Umum / Non-mutasi</span>;
  };

  return (
    <div className="space-y-6">
      {/* Header View */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-purple-100 dark:bg-purple-950/60 rounded-xl text-purple-600 dark:text-purple-400">
              <Shield className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              Manajemen Akun & Hak Akses
            </h2>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Kelola pengguna, penetapan peran RBAC, cakupan lembaga/asrama, dan kontrol keamanan sesi.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors self-start sm:self-auto"
        >
          <UserPlus className="w-4 h-4" />
          <span>Tambah Akun Baru</span>
        </button>
      </div>

      {/* Global Alerts */}
      {errorMsg && (
        <div className="p-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-xl text-rose-700 dark:text-rose-300 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
          <button onClick={() => setErrorMsg(null)} className="text-rose-400 hover:text-rose-600">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {successMsg && (
        <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl text-emerald-700 dark:text-emerald-300 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg(null)} className="text-emerald-400 hover:text-emerald-600">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Cari berdasarkan nama, username, atau no. telepon..."
            className="w-full pl-9 pr-4 py-2 text-xs border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Role Filter */}
          <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400">
            <Filter className="w-3.5 h-3.5" />
            <select
              value={roleFilter}
              onChange={(e) => {
                setRoleFilter(e.target.value);
                setPage(1);
              }}
              className="px-3 py-2 text-xs border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none"
            >
              <option value="semua">Semua Role</option>
              <option value="superadmin">Super Admin</option>
              <option value="admin_lembaga">Admin Lembaga</option>
              <option value="pengurus_asrama">Pengurus Asrama</option>
              <option value="viewer">Viewer</option>
            </select>
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 text-xs border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none"
          >
            <option value="semua">Semua Status</option>
            <option value="aktif">Aktif</option>
            <option value="nonaktif">Nonaktif</option>
          </select>

          <span className="text-xs text-slate-400 border-l border-slate-200 dark:border-slate-700 pl-2.5 py-1">
            Total: <strong>{totalUsers}</strong> akun
          </span>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 font-semibold uppercase text-[10px] tracking-wider">
                <th className="py-3.5 px-4">Nama Lengkap</th>
                <th className="py-3.5 px-4">Username</th>
                <th className="py-3.5 px-4">Role</th>
                <th className="py-3.5 px-4">Cakupan Akses</th>
                <th className="py-3.5 px-4 text-center">Status</th>
                <th className="py-3.5 px-4">Login Terakhir</th>
                <th className="py-3.5 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 text-slate-700 dark:text-slate-300">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <div className="inline-block w-6 h-6 border-2 border-slate-300 border-t-emerald-600 rounded-full animate-spin mb-2" />
                    <p>Memuat data pengguna...</p>
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <Users className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-600 mb-2" />
                    <p className="font-medium text-slate-600 dark:text-slate-400">Tidak ada pengguna ditemukan</p>
                    <p className="text-[11px] text-slate-400">Coba ubah kata kunci pencarian atau filter role.</p>
                  </td>
                </tr>
              ) : (
                users.map((u) => {
                  const isCurrent = u.id === currentUser.id;
                  const isLocked = u.lockedUntil && new Date(u.lockedUntil) > new Date();

                  return (
                    <tr 
                      key={u.id}
                      className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      {/* Name & Contact */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold flex items-center justify-center text-xs shrink-0">
                            {u.fullName.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                              <span>{u.fullName}</span>
                              {isCurrent && (
                                <span className="text-[9px] font-bold px-1.5 py-0.2 bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 rounded">
                                  Anda
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
                              {u.phone && <span>{u.phone}</span>}
                              {u.stafNama && (
                                <span className="text-emerald-600 dark:text-emerald-400 font-medium truncate max-w-[140px]" title={`Terhubung ke staf: ${u.stafNama}`}>
                                  • Staf: {u.stafNama}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Username */}
                      <td className="py-3.5 px-4 font-mono font-medium text-emerald-700 dark:text-emerald-400">
                        @{u.username}
                      </td>

                      {/* Role Badge */}
                      <td className="py-3.5 px-4">
                        {formatRoleBadge(u)}
                      </td>

                      {/* Scope */}
                      <td className="py-3.5 px-4">
                        {formatScopeBadge(u)}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4 text-center">
                        {isLocked ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300">
                            <Clock className="w-3 h-3" />
                            <span>Terkunci</span>
                          </span>
                        ) : u.isActive === 1 ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                            <span>Aktif</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                            <span>Nonaktif</span>
                          </span>
                        )}
                      </td>

                      {/* Last Login */}
                      <td className="py-3.5 px-4 text-slate-500 text-[11px]">
                        {u.lastLoginAt ? (
                          <span>{new Date(u.lastLoginAt).toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' })}</span>
                        ) : (
                          <span className="italic text-slate-400">Belum pernah</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {/* Login History */}
                          <button
                            onClick={() => handleOpenHistory(u)}
                            title="Lihat Riwayat Aktivitas Login"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                          >
                            <History className="w-4 h-4" />
                          </button>

                          {/* Reset Password */}
                          <button
                            onClick={() => handleResetPassword(u)}
                            title="Reset Kata Sandi"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/40 transition-colors"
                          >
                            <RotateCcw className="w-4 h-4" />
                          </button>

                          {/* Edit */}
                          <button
                            onClick={() => handleOpenEdit(u)}
                            title="Edit Data Pengguna"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40 transition-colors"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>

                          {/* Toggle Status (cannot deactivate self) */}
                          {!isCurrent && (
                            <button
                              onClick={() => handleToggleStatus(u)}
                              title={u.isActive === 1 ? 'Nonaktifkan Akun' : 'Aktifkan Akun'}
                              className={`p-1.5 rounded-lg transition-colors ${
                                u.isActive === 1 
                                  ? 'text-slate-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/40' 
                                  : 'text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40'
                              }`}
                            >
                              <Lock className="w-4 h-4" />
                            </button>
                          )}

                          {/* Delete (cannot delete self) */}
                          {!isCurrent && (
                            <button
                              onClick={() => setUserToDelete(u)}
                              title="Hapus Akun Pengguna"
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
            <div>
              Halaman <strong>{page}</strong> dari <strong>{totalPages}</strong>
            </div>
            <div className="flex items-center gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-1"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>Sebelumnya</span>
              </button>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-1"
              >
                <span>Berikutnya</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* MODAL: Tambah Pengguna Baru */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
              <div className="flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-emerald-600" />
                <h3 className="font-bold text-base text-slate-900 dark:text-white">
                  Tambah Akun Pengguna Baru
                </h3>
              </div>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveAdd} className="p-5 overflow-y-auto space-y-4 text-xs">
              {/* Nama Lengkap */}
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Nama Lengkap *
                </label>
                <input
                  type="text"
                  required
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  placeholder="Misal: Ust. Ahmad Fulan, M.Pd"
                  className="w-full px-3.5 py-2.5 border border-slate-300 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Username */}
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Username * (Huruf kecil, angka, garis bawah)
                </label>
                <input
                  type="text"
                  required
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '') })}
                  placeholder="Misal: admin_smp, musyrif_asrama"
                  className="w-full px-3.5 py-2.5 font-mono border border-slate-300 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Role Selection */}
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Role (Peran Sistem) *
                </label>
                <select
                  value={
                    formData.role === 'pengurus_asrama'
                      ? formData.scopeAsrama === 'putra'
                        ? 'pengurus_asrama_putra'
                        : 'pengurus_asrama_putri'
                      : formData.role
                  }
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === 'pengurus_asrama_putra') {
                      setFormData({ ...formData, role: 'pengurus_asrama', scopeAsrama: 'putra', assignedLembagaIds: [] });
                    } else if (val === 'pengurus_asrama_putri') {
                      setFormData({ ...formData, role: 'pengurus_asrama', scopeAsrama: 'putri', assignedLembagaIds: [] });
                    } else {
                      setFormData({ 
                        ...formData, 
                        role: val as Role, 
                        scopeAsrama: 'semua',
                        assignedLembagaIds: val === 'admin_lembaga' && lembagas.length > 0 ? [lembagas[0].id] : []
                      });
                    }
                  }}
                  className="w-full px-3.5 py-2.5 border border-slate-300 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="superadmin">Super Admin (Akses Penuh Seluruh Sistem)</option>
                  <option value="admin_lembaga">Admin Lembaga (SD, SMP, SMA, SMK, Ngaji, Diniyah)</option>
                  <option value="pengurus_asrama_putra">Pengelola Asrama Putra (Santri Putra Only)</option>
                  <option value="pengurus_asrama_putri">Pengelola Asrama Putri (Santri Putri Only)</option>
                  <option value="viewer">Viewer (Hanya Baca / Read-Only)</option>
                </select>
              </div>

              {/* Scope Selection: Lembaga (if Admin Lembaga) */}
              {formData.role === 'admin_lembaga' && (
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Cakupan Lembaga yang Dikelola (Bisa pilih lebih dari satu):
                  </label>
                  <div className="grid grid-cols-2 gap-2 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
                    {lembagas.map((l) => {
                      const checked = formData.assignedLembagaIds.includes(l.id);
                      return (
                        <label key={l.id} className="flex items-center gap-2 cursor-pointer text-xs">
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setFormData({
                                  ...formData,
                                  assignedLembagaIds: [...formData.assignedLembagaIds, l.id],
                                });
                              } else {
                                setFormData({
                                  ...formData,
                                  assignedLembagaIds: formData.assignedLembagaIds.filter((id) => id !== l.id),
                                });
                              }
                            }}
                            className="rounded text-emerald-600 focus:ring-emerald-500"
                          />
                          <span className="font-medium">{l.nama} ({l.kode})</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Link to Staf (Optional) */}
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Hubungkan ke Profil Staf / Asatidz (Opsional)
                </label>
                <select
                  value={formData.stafId}
                  onChange={(e) => setFormData({ ...formData, stafId: e.target.value })}
                  className="w-full px-3.5 py-2.5 border border-slate-300 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none"
                >
                  <option value="">-- Tidak Terhubung ke Data Staf --</option>
                  {stafList.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.namaLengkap} - {s.jabatan} ({s.nip})
                    </option>
                  ))}
                </select>
              </div>

              {/* Phone */}
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Nomor HP / WhatsApp
                </label>
                <input
                  type="text"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="Misal: 081234567890"
                  className="w-full px-3.5 py-2.5 border border-slate-300 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none"
                />
              </div>

              <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 rounded-xl text-[11px] text-amber-800 dark:text-amber-300 flex items-start gap-2">
                <Key className="w-4 h-4 shrink-0 mt-0.5" />
                <span>
                  Kata sandi awal akan dibuat secara otomatis (acak & aman) dan ditampilkan sekali setelah akun dibuat. Pengguna diwajibkan menggantinya saat login pertama.
                </span>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-xl font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-semibold rounded-xl shadow-xs"
                >
                  {loading ? 'Menyimpan...' : 'Buat Akun'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Edit Pengguna */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
              <div className="flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-base text-slate-900 dark:text-white">
                  Edit Pengguna (@{editingUser.username})
                </h3>
              </div>
              <button onClick={() => setEditingUser(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="p-5 overflow-y-auto space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Nama Lengkap *
                </label>
                <input
                  type="text"
                  required
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  className="w-full px-3.5 py-2.5 border border-slate-300 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Role (Peran Sistem) *
                </label>
                <select
                  value={
                    formData.role === 'pengurus_asrama'
                      ? formData.scopeAsrama === 'putra'
                        ? 'pengurus_asrama_putra'
                        : 'pengurus_asrama_putri'
                      : formData.role
                  }
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === 'pengurus_asrama_putra') {
                      setFormData({ ...formData, role: 'pengurus_asrama', scopeAsrama: 'putra', assignedLembagaIds: [] });
                    } else if (val === 'pengurus_asrama_putri') {
                      setFormData({ ...formData, role: 'pengurus_asrama', scopeAsrama: 'putri', assignedLembagaIds: [] });
                    } else {
                      setFormData({ 
                        ...formData, 
                        role: val as Role, 
                        scopeAsrama: 'semua',
                        assignedLembagaIds: val === 'admin_lembaga' ? formData.assignedLembagaIds : []
                      });
                    }
                  }}
                  className="w-full px-3.5 py-2.5 border border-slate-300 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none"
                >
                  <option value="superadmin">Super Admin</option>
                  <option value="admin_lembaga">Admin Lembaga</option>
                  <option value="pengurus_asrama_putra">Pengelola Asrama Putra</option>
                  <option value="pengurus_asrama_putri">Pengelola Asrama Putri</option>
                  <option value="viewer">Viewer (Read-Only)</option>
                </select>
              </div>

              {formData.role === 'admin_lembaga' && (
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Cakupan Lembaga yang Dikelola:
                  </label>
                  <div className="grid grid-cols-2 gap-2 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
                    {lembagas.map((l) => {
                      const checked = formData.assignedLembagaIds.includes(l.id);
                      return (
                        <label key={l.id} className="flex items-center gap-2 cursor-pointer text-xs">
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setFormData({
                                  ...formData,
                                  assignedLembagaIds: [...formData.assignedLembagaIds, l.id],
                                });
                              } else {
                                setFormData({
                                  ...formData,
                                  assignedLembagaIds: formData.assignedLembagaIds.filter((id) => id !== l.id),
                                });
                              }
                            }}
                            className="rounded text-emerald-600 focus:ring-emerald-500"
                          />
                          <span className="font-medium">{l.nama} ({l.kode})</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Hubungkan ke Profil Staf
                </label>
                <select
                  value={formData.stafId}
                  onChange={(e) => setFormData({ ...formData, stafId: e.target.value })}
                  className="w-full px-3.5 py-2.5 border border-slate-300 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none"
                >
                  <option value="">-- Tidak Terhubung ke Data Staf --</option>
                  {stafList.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.namaLengkap} - {s.jabatan} ({s.nip})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Nomor HP
                </label>
                <input
                  type="text"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-3.5 py-2.5 border border-slate-300 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-xl font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold rounded-xl shadow-xs"
                >
                  {loading ? 'Menyimpan...' : 'Simpan Perubahan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Password Reveal Dialog (Shown ONCE with Copy Button) */}
      {revealedPassword && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl shadow-2xl border border-emerald-300 dark:border-emerald-800 overflow-hidden">
            <div className="p-6 text-center space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center">
                <Key className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-base text-slate-900 dark:text-white">
                  {revealedPassword.title}
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Akun: <strong className="text-slate-800 dark:text-slate-200 font-mono">@{revealedPassword.username}</strong>
                </p>
              </div>

              {/* Password Box */}
              <div className="p-4 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-3">
                <span className="font-mono text-base font-bold text-emerald-700 dark:text-emerald-400 select-all tracking-wider">
                  {revealedPassword.password}
                </span>
                <button
                  onClick={handleCopyPassword}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors shrink-0"
                >
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Tersalin!' : 'Salin'}</span>
                </button>
              </div>

              <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 rounded-xl text-left text-[11px] text-amber-800 dark:text-amber-300 space-y-1">
                <p className="font-semibold flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                  <span>Peringatan Keamanan Penting:</span>
                </p>
                <p>
                  Kata sandi ini hanya ditampilkan satu kali demi keamanan. Harap segera salin dan kirimkan secara aman ke pemilik akun. Pengguna wajib menggantinya saat login pertama.
                </p>
              </div>

              <button
                onClick={() => setRevealedPassword(null)}
                className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-xl text-xs transition-colors"
              >
                Saya Sudah Menyalin Kata Sandi
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Riwayat Login Per Akun */}
      {historyUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[85vh]">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
              <div className="flex items-center gap-2">
                <History className="w-5 h-5 text-purple-600" />
                <h3 className="font-bold text-base text-slate-900 dark:text-white">
                  Riwayat Aktivitas Akun: @{historyUser.username}
                </h3>
              </div>
              <button onClick={() => setHistoryUser(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-3 text-xs">
              {loadingLogs ? (
                <div className="py-8 text-center text-slate-400">
                  <div className="inline-block w-5 h-5 border-2 border-slate-300 border-t-purple-600 rounded-full animate-spin mb-2" />
                  <p>Memuat log aktivitas...</p>
                </div>
              ) : loginLogs.length === 0 ? (
                <p className="py-8 text-center text-slate-400">
                  Belum ada catatan aktivitas login untuk pengguna ini.
                </p>
              ) : (
                <div className="space-y-2">
                  {loginLogs.map((log) => {
                    let detailsObj: any = {};
                    try { detailsObj = JSON.parse(log.details || '{}'); } catch (e) {}

                    const isSuccess = log.action === 'LOGIN_SUCCESS';
                    const isFailed = log.action === 'LOGIN_FAILED';
                    const isLocked = log.action === 'LOGIN_LOCKED';
                    const isPassChange = log.action === 'CHANGE_PASSWORD';
                    const isPassReset = log.action === 'RESET_PASSWORD';

                    return (
                      <div 
                        key={log.id}
                        className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 flex items-start justify-between gap-3"
                      >
                        <div className="flex items-start gap-2.5">
                          <div className={`p-1.5 rounded-lg mt-0.5 ${
                            isSuccess ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300' :
                            isFailed ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300' :
                            isLocked ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300' :
                            'bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300'
                          }`}>
                            {isSuccess ? <CheckCircle2 className="w-4 h-4" /> :
                             isFailed ? <AlertCircle className="w-4 h-4" /> :
                             isLocked ? <Lock className="w-4 h-4" /> :
                             <Key className="w-4 h-4" />}
                          </div>
                          <div>
                            <p className="font-semibold text-slate-900 dark:text-white">
                              {log.action}
                            </p>
                            <p className="text-[11px] text-slate-500 mt-0.5">
                              {detailsObj.reason || detailsObj.message || (isSuccess ? 'Login berhasil' : isFailed ? 'Percobaan gagal' : 'Aktivitas akun')}
                            </p>
                            {log.ipAddress && (
                              <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                                IP: {log.ipAddress}
                              </p>
                            )}
                          </div>
                        </div>
                        <span className="text-[11px] text-slate-400 shrink-0">
                          {new Date(log.createdAt).toLocaleString('id-ID')}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Konfirmasi Hapus Akun */}
      {userToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 mx-auto flex items-center justify-center">
              <Trash2 className="w-6 h-6" />
            </div>
            <div className="text-center">
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                Hapus Akun Pengguna?
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Apakah Anda yakin ingin menghapus akun <strong>{userToDelete.fullName}</strong> (@{userToDelete.username})?
              </p>
            </div>
            <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 rounded-xl text-xs text-rose-700 dark:text-rose-300">
              Semua sesi aktif akun ini akan langsung dicabut dan pengguna tidak akan bisa masuk kembali. Tindakan ini dicatat ke log audit.
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setUserToDelete(null)}
                className="px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={deleting}
                onClick={handleConfirmDelete}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors"
              >
                {deleting ? 'Menghapus...' : 'Ya, Hapus Akun'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
