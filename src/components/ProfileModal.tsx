import React, { useState } from 'react';
import { 
  X, 
  User, 
  Shield, 
  Building2, 
  Home, 
  Lock, 
  KeyRound, 
  CheckCircle, 
  AlertCircle, 
  Eye, 
  EyeOff, 
  LogOut,
  Phone,
  Briefcase,
  Clock
} from 'lucide-react';
import type { UserSession, Lembaga, Asrama } from '../types/index.ts';
import { authFetch } from '../utils/api.ts';

interface ProfileModalProps {
  user: UserSession;
  lembagas: Lembaga[];
  asramas: Asrama[];
  onClose: () => void;
  onLogout: () => void;
  onPasswordChanged?: () => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({
  user,
  lembagas,
  asramas,
  onClose,
  onLogout,
  onPasswordChanged,
}) => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Requirements checks
  const hasMinLength = newPassword.length >= 8;
  const hasMixedChars = /[a-zA-Z]/.test(newPassword) && /[0-9]/.test(newPassword);
  const isDifferentFromOld = currentPassword.length > 0 && newPassword.length > 0 && newPassword !== currentPassword;
  const passwordsMatch = newPassword.length > 0 && newPassword === confirmPassword;
  const isFormValid = hasMinLength && hasMixedChars && isDifferentFromOld && passwordsMatch;

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid) {
      if (!isDifferentFromOld && currentPassword && newPassword) {
        setErrorMsg('Kata sandi baru tidak boleh sama dengan kata sandi saat ini');
      }
      return;
    }

    try {
      setLoading(true);
      setErrorMsg(null);
      setSuccessMsg(null);

      const res = await authFetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword,
          newPassword,
          confirmPassword,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Gagal mengubah kata sandi');
      }

      setSuccessMsg(data.message || 'Kata sandi berhasil diperbarui!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      if (onPasswordChanged) onPasswordChanged();
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getRoleLabel = () => {
    switch (user.role) {
      case 'superadmin':
        return { label: 'Super Admin', color: 'bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300' };
      case 'admin_lembaga':
        return { label: 'Admin Lembaga', color: 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300' };
      case 'pengurus_asrama':
        return {
          label: user.scopeAsrama === 'putra' ? 'Pengelola Asrama Putra' : user.scopeAsrama === 'putri' ? 'Pengelola Asrama Putri' : 'Pengurus Asrama',
          color: 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
        };
      case 'viewer':
      default:
        return { label: 'Viewer (Read-Only)', color: 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300' };
    }
  };

  const getScopeDetails = () => {
    if (user.role === 'superadmin') {
      return 'Seluruh data pesantren (Semua Lembaga & Asrama)';
    }
    if (user.role === 'admin_lembaga') {
      if (user.assignedLembagaIds && user.assignedLembagaIds.length > 0) {
        const names = user.assignedLembagaIds.map((id) => {
          const found = lembagas.find((l) => l.id === id);
          return found ? found.nama : id;
        });
        return names.join(', ');
      }
      return 'Lembaga Pendidikan Tertentu';
    }
    if (user.role === 'pengurus_asrama') {
      if (user.scopeAsrama === 'putra') return 'Gedung Asrama Putra (Santri Laki-laki)';
      if (user.scopeAsrama === 'putri') return 'Gedung Asrama Putri (Santri Perempuan)';
      return 'Seluruh Gedung Asrama';
    }
    return 'Akses Baca Terbatas';
  };

  const roleInfo = getRoleLabel();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 w-full max-w-xl rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <User className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white leading-tight">
                Profil Saya
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Informasi akun terdaftar & pengaturan kata sandi
              </p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs">
          {/* User Profile Card */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-emerald-600 text-white font-bold flex items-center justify-center text-xl shadow-md shrink-0">
              {user.fullName.charAt(0)}
            </div>
            <div className="flex-1 min-w-0 space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h4 className="font-bold text-sm text-slate-900 dark:text-white truncate">
                  {user.fullName}
                </h4>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${roleInfo.color}`}>
                  {roleInfo.label}
                </span>
              </div>
              <p className="text-slate-500 font-mono text-xs">
                @{user.username}
              </p>
              <div className="pt-1 text-[11px] text-slate-600 dark:text-slate-400 flex flex-wrap gap-x-4 gap-y-1">
                {user.phone && (
                  <span className="flex items-center gap-1">
                    <Phone className="w-3 h-3 text-slate-400" />
                    <span>{user.phone}</span>
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <Shield className="w-3 h-3 text-emerald-500" />
                  <span>Cakupan: {getScopeDetails()}</span>
                </span>
              </div>
            </div>
          </div>

          {/* Change Password Form */}
          <div className="border border-slate-200 dark:border-slate-800 rounded-xl p-4 sm:p-5 space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
              <KeyRound className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <h4 className="font-bold text-xs uppercase tracking-wider text-slate-800 dark:text-slate-200">
                Ganti Kata Sandi
              </h4>
            </div>

            {errorMsg && (
              <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-xl text-rose-700 dark:text-rose-300 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            {successMsg && (
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl text-emerald-700 dark:text-emerald-300 text-xs flex items-start gap-2">
                <CheckCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{successMsg}</span>
              </div>
            )}

            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              {/* Current Password */}
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Kata Sandi Saat Ini
                </label>
                <div className="relative">
                  <input
                    type={showCurrent ? 'text' : 'password'}
                    required
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Masukkan kata sandi saat ini"
                    className="w-full px-3.5 py-2.5 pr-10 text-xs border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrent(!showCurrent)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                  >
                    {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* New Password */}
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Kata Sandi Baru
                </label>
                <div className="relative">
                  <input
                    type={showNew ? 'text' : 'password'}
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Minimal 8 karakter kombinasi huruf & angka"
                    className="w-full px-3.5 py-2.5 pr-10 text-xs border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNew(!showNew)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                  >
                    {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Confirm New Password */}
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Konfirmasi Kata Sandi Baru
                </label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Ulangi kata sandi baru"
                  className="w-full px-3.5 py-2.5 text-xs border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                />
              </div>

              {/* Live Validation Indicators */}
              <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl space-y-1.5 text-[11px] text-slate-600 dark:text-slate-400">
                <div className="flex items-center gap-2">
                  <CheckCircle className={`w-3.5 h-3.5 ${hasMinLength ? 'text-emerald-600' : 'text-slate-300 dark:text-slate-600'}`} />
                  <span className={hasMinLength ? 'text-emerald-700 dark:text-emerald-400 font-medium' : ''}>
                    Minimal 8 karakter
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className={`w-3.5 h-3.5 ${hasMixedChars ? 'text-emerald-600' : 'text-slate-300 dark:text-slate-600'}`} />
                  <span className={hasMixedChars ? 'text-emerald-700 dark:text-emerald-400 font-medium' : ''}>
                    Kombinasi huruf dan angka
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className={`w-3.5 h-3.5 ${isDifferentFromOld ? 'text-emerald-600' : 'text-slate-300 dark:text-slate-600'}`} />
                  <span className={isDifferentFromOld ? 'text-emerald-700 dark:text-emerald-400 font-medium' : ''}>
                    Berbeda dari kata sandi saat ini
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className={`w-3.5 h-3.5 ${passwordsMatch ? 'text-emerald-600' : 'text-slate-300 dark:text-slate-600'}`} />
                  <span className={passwordsMatch ? 'text-emerald-700 dark:text-emerald-400 font-medium' : ''}>
                    Konfirmasi kata sandi cocok
                  </span>
                </div>
              </div>

              <div className="flex justify-end pt-1">
                <button
                  type="submit"
                  disabled={!isFormValid || loading}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-xl shadow-xs transition-colors"
                >
                  {loading ? 'Menyimpan...' : 'Perbarui Kata Sandi'}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Footer with Logout */}
        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <span className="text-[11px] text-slate-500">
            Sesi aktif diperpanjang otomatis saat digunakan
          </span>
          <button
            onClick={() => {
              onClose();
              onLogout();
            }}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Keluar (Logout)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
