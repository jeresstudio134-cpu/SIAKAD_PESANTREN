import React from 'react';
import { 
  X, 
  UserPlus, 
  Shield, 
  Building2, 
  Home, 
  Eye, 
  Check, 
  Edit3, 
  Trash2, 
  AlertCircle,
  Key
} from 'lucide-react';
import type { UserItem, Lembaga, Asrama, Role } from '../types/index.ts';

interface UserManagementModalProps {
  onClose: () => void;
  onRefreshParent: () => void;
}

export const UserManagementModal: React.FC<UserManagementModalProps> = ({
  onClose,
  onRefreshParent,
}) => {
  const [users, setUsers] = React.useState<UserItem[]>([]);
  const [lembagas, setLembagas] = React.useState<Lembaga[]>([]);
  const [asramas, setAsramas] = React.useState<Asrama[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);

  const [showForm, setShowForm] = React.useState(false);
  const [editingUserId, setEditingUserId] = React.useState<string | null>(null);

  const [form, setForm] = React.useState({
    username: '',
    password: '',
    fullName: '',
    role: 'admin_lembaga' as Role,
    assignedLembagaIds: [] as string[],
    assignedAsramaIds: [] as string[],
    scopeAsrama: 'semua' as 'putra' | 'putri' | 'semua',
    phone: '',
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [uRes, lRes, aRes] = await Promise.all([
        fetch('/api/users'),
        fetch('/api/master/lembaga'),
        fetch('/api/master/asrama'),
      ]);

      const [uData, lData, aData] = await Promise.all([
        uRes.json(),
        lRes.json(),
        aRes.json(),
      ]);

      setUsers(uData.data || []);
      setLembagas(lData.data || []);
      setAsramas(aData.data || []);
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchData();
  }, []);

  const handleOpenAdd = () => {
    setEditingUserId(null);
    setForm({
      username: '',
      password: '',
      fullName: '',
      role: 'admin_lembaga',
      assignedLembagaIds: lembagas.length > 0 ? [lembagas[0].id] : [],
      assignedAsramaIds: [],
      scopeAsrama: 'semua',
      phone: '',
    });
    setShowForm(true);
  };

  const handleOpenEdit = (user: UserItem) => {
    setEditingUserId(user.id);
    setForm({
      username: user.username,
      password: '',
      fullName: user.fullName,
      role: user.role,
      assignedLembagaIds: user.assignedLembagaIds || [],
      assignedAsramaIds: user.assignedAsramaIds || [],
      scopeAsrama: user.scopeAsrama || 'semua',
      phone: user.phone || '',
    });
    setShowForm(true);
  };

  const toggleLembaga = (id: string) => {
    setForm((prev) => ({
      ...prev,
      assignedLembagaIds: prev.assignedLembagaIds.includes(id)
        ? prev.assignedLembagaIds.filter((item) => item !== id)
        : [...prev.assignedLembagaIds, id],
    }));
  };

  const toggleAsrama = (id: string) => {
    setForm((prev) => ({
      ...prev,
      assignedAsramaIds: prev.assignedAsramaIds.includes(id)
        ? prev.assignedAsramaIds.filter((item) => item !== id)
        : [...prev.assignedAsramaIds, id],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    try {
      const url = editingUserId ? `/api/users/${editingUserId}` : '/api/users';
      const method = editingUserId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Gagal menyimpan pengguna');

      setShowForm(false);
      fetchData();
      onRefreshParent();
    } catch (err: any) {
      setErrorMsg(err.message);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Hapus pengguna @${name}?`)) return;
    try {
      await fetch(`/api/users/${id}`, { method: 'DELETE' });
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 w-full max-w-4xl rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center">
              <Shield className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Kelola Pengguna & Hak Akses Scoped RBAC
              </h2>
              <p className="text-[11px] text-slate-500">
                Cakupan lembaga dan asrama disimpan per pengguna dan dipaksa di sisi server Cloudflare Workers.
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 text-xs">
          
          <div className="flex items-center justify-between">
            <div className="text-slate-500">
              Total Pengguna Terdaftar: <strong className="font-mono text-slate-900 dark:text-white tabular-nums">{users.length}</strong> akun
            </div>
            <button
              onClick={handleOpenAdd}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold shadow-xs"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Tambah Operator Baru</span>
            </button>
          </div>

          {errorMsg && (
            <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-xl text-rose-700 dark:text-rose-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Form Create / Edit */}
          {showForm && (
            <form onSubmit={handleSubmit} className="p-4 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl space-y-3 animate-in fade-in">
              <h3 className="font-bold text-slate-900 dark:text-white text-xs">
                {editingUserId ? 'Ubah Hak Akses Pengguna' : 'Tambah Pengguna & Tentukan Cakupan'}
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-medium mb-1">Username*:</label>
                  <input
                    type="text"
                    required
                    disabled={!!editingUserId}
                    placeholder="Contoh: admin_smp"
                    value={form.username}
                    onChange={(e) => setForm({ ...form, username: e.target.value })}
                    className="w-full px-2.5 py-1.5 border rounded-lg bg-white dark:bg-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium mb-1">Nama Lengkap & Gelar*:</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Ust. Zulfikar, S.Pd.I"
                    value={form.fullName}
                    onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                    className="w-full px-2.5 py-1.5 border rounded-lg bg-white dark:bg-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium mb-1">
                    {editingUserId ? 'Ganti Password (Opsional):' : 'Password Awal*: '}
                  </label>
                  <input
                    type="password"
                    required={!editingUserId}
                    placeholder="Minimal 6 karakter"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    className="w-full px-2.5 py-1.5 border rounded-lg bg-white dark:bg-slate-800"
                  />
                </div>
              </div>

              {/* Peran / Role Selection */}
              <div>
                <label className="block text-[11px] font-medium mb-1">Pilih Peran (Role)*:</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { id: 'superadmin', label: 'Super Admin', desc: 'Akses penuh seluruh sistem' },
                    { id: 'admin_lembaga', label: 'Admin Lembaga', desc: 'Terbatas lembaga tertentu' },
                    { id: 'pengurus_asrama', label: 'Pengurus Asrama', desc: 'Terbatas asrama tertentu' },
                    { id: 'viewer', label: 'Viewer', desc: 'Hanya baca & export' },
                  ].map((r) => (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => setForm({ ...form, role: r.id as Role })}
                      className={`p-2.5 text-left rounded-xl border transition-all ${
                        form.role === r.id
                          ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 font-semibold'
                          : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      <span className="block text-slate-900 dark:text-white text-xs">{r.label}</span>
                      <span className="text-[10px] text-slate-500 block mt-0.5">{r.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Scoped Assignment: Lembaga */}
              {(form.role === 'admin_lembaga' || form.role === 'viewer') && (
                <div className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-emerald-600" />
                    <span className="font-bold text-slate-800 dark:text-slate-200 text-xs">
                      Tugaskan Lembaga (Dipaksa oleh Server):
                    </span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {lembagas.map((l) => {
                      const isChecked = form.assignedLembagaIds.includes(l.id);
                      return (
                        <label
                          key={l.id}
                          className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer text-xs ${
                            isChecked
                              ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-400 font-semibold text-emerald-900 dark:text-emerald-200'
                              : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => toggleLembaga(l.id)}
                            className="rounded text-emerald-600"
                          />
                          <span>{l.nama} ({l.kode})</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Scoped Assignment: Asrama */}
              {(form.role === 'pengurus_asrama' || form.role === 'viewer') && (
                <div className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
                  <div className="flex items-center gap-2">
                    <Home className="w-4 h-4 text-emerald-600" />
                    <span className="font-bold text-slate-800 dark:text-slate-200 text-xs">
                      Tugaskan Asrama (Dipaksa oleh Server):
                    </span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {asramas.map((a) => {
                      const isChecked = form.assignedAsramaIds.includes(a.id);
                      return (
                        <label
                          key={a.id}
                          className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer text-xs ${
                            isChecked
                              ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-400 font-semibold text-emerald-900 dark:text-emerald-200'
                              : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => toggleAsrama(a.id)}
                            className="rounded text-emerald-600"
                          />
                          <span>{a.nama} ({a.kelompokGender})</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Scoped Assignment: Cakupan Gender / Asrama */}
              <div>
                <label className="block text-[11px] font-medium mb-1">Cakupan Pengelolaan Asrama (Server-Enforced):</label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {[
                    { id: 'semua', label: 'Semua Santri & Asrama', desc: 'Putra & Putri' },
                    { id: 'putra', label: 'Pengelola Asrama Putra', desc: 'Hanya Santri Putra (Banin)' },
                    { id: 'putri', label: 'Pengelola Asrama Putri', desc: 'Hanya Santri Putri (Banat)' },
                  ].map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setForm({ ...form, scopeAsrama: s.id as any })}
                      className={`p-2 rounded-lg border text-left text-xs transition-colors ${
                        form.scopeAsrama === s.id
                          ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 font-semibold text-emerald-900 dark:text-emerald-200'
                          : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <span className="block">{s.label}</span>
                      <span className="text-[10px] text-slate-500 block mt-0.5">{s.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-3 py-1.5 text-slate-600"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold"
                >
                  Simpan Pengguna
                </button>
              </div>
            </form>
          )}

          {/* List Users Table */}
          <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 font-semibold text-slate-600 dark:text-slate-300">
                <tr>
                  <th className="py-2.5 px-3">Username & Operator</th>
                  <th className="py-2.5 px-3">Peran (Role)</th>
                  <th className="py-2.5 px-3">Cakupan Terikat (Server Enforced)</th>
                  <th className="py-2.5 px-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {users.map((u) => {
                  const roleBadge = () => {
                    if (u.role === 'superadmin') return <span className="text-purple-600 font-bold">Super Admin</span>;
                    if (u.role === 'admin_lembaga') return <span className="text-blue-600 font-bold">Admin Lembaga</span>;
                    if (u.role === 'pengurus_asrama') return <span className="text-amber-600 font-bold">Pengurus Asrama</span>;
                    return <span className="text-slate-500 font-bold">Viewer</span>;
                  };

                  return (
                    <tr key={u.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <td className="py-3 px-3">
                        <div className="font-bold text-slate-900 dark:text-white">{u.fullName}</div>
                        <div className="font-mono text-[11px] text-slate-400">@{u.username}</div>
                      </td>
                      <td className="py-3 px-3">
                        {roleBadge()}
                      </td>
                      <td className="py-3 px-3">
                        {u.role === 'superadmin' ? (
                          <span className="text-emerald-600 font-medium">Akses Penuh (Semua Lembaga & Asrama)</span>
                        ) : (
                          <div className="space-y-1 text-[11px]">
                            {u.assignedLembagaIds && u.assignedLembagaIds.length > 0 && (
                              <div className="flex items-center gap-1.5 text-blue-700 dark:text-blue-300">
                                <Building2 className="w-3 h-3 shrink-0" />
                                <span>{u.assignedLembagaIds.length} Lembaga ditugaskan</span>
                              </div>
                            )}
                            {u.assignedAsramaIds && u.assignedAsramaIds.length > 0 && (
                              <div className="flex items-center gap-1.5 text-amber-700 dark:text-amber-300">
                                <Home className="w-3 h-3 shrink-0" />
                                <span>{u.assignedAsramaIds.length} Asrama ditugaskan</span>
                              </div>
                            )}
                            {(!u.assignedLembagaIds || u.assignedLembagaIds.length === 0) &&
                              (!u.assignedAsramaIds || u.assignedAsramaIds.length === 0) && (
                                <span className="text-slate-400 italic">Belum ada cakupan (data kosong)</span>
                              )}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleOpenEdit(u)}
                            className="p-1.5 text-slate-500 hover:text-slate-900 dark:hover:text-white rounded-md hover:bg-slate-100 dark:hover:bg-slate-800"
                            title="Ubah Cakupan / Password"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          {u.username !== 'admin' && (
                            <button
                              onClick={() => handleDelete(u.id, u.username)}
                              className="p-1.5 text-rose-500 hover:text-rose-700 rounded-md hover:bg-rose-50 dark:hover:bg-rose-950/40"
                              title="Hapus Akun"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-lg text-xs font-semibold"
          >
            Tutup
          </button>
        </div>

      </div>
    </div>
  );
};
