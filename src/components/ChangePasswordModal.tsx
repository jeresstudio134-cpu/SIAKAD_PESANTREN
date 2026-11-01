import React, { useState } from 'react';
import { Lock, ShieldAlert, CheckCircle, AlertCircle, Eye, EyeOff, LogOut } from 'lucide-react';
import type { UserSession } from '../types/index.ts';
import { authFetch } from '../utils/api.ts';

interface ChangePasswordModalProps {
  user: UserSession;
  onSuccess: (updatedUser: UserSession) => void;
  onLogout: () => void;
}

export const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({
  user,
  onSuccess,
  onLogout,
}) => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Validation rules
  const hasMinLength = newPassword.length >= 8;
  const hasMixedChars = /[a-zA-Z]/.test(newPassword) && /[0-9]/.test(newPassword);
  const passwordsMatch = newPassword.length > 0 && newPassword === confirmPassword;
  const isDifferentFromOld = currentPassword.length > 0 && newPassword.length > 0 && newPassword !== currentPassword;
  const isFormValid = hasMinLength && hasMixedChars && passwordsMatch && isDifferentFromOld;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid) {
      if (!isDifferentFromOld && currentPassword && newPassword) {
        setErrorMsg('Kata sandi baru tidak boleh sama dengan kata sandi lama');
      }
      return;
    }

    try {
      setLoading(true);
      setErrorMsg(null);

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
      setTimeout(() => {
        onSuccess({
          ...user,
          mustChangePassword: false,
        });
      }, 1200);
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-2xl shadow-2xl border border-amber-300 dark:border-amber-700/60 overflow-hidden flex flex-col">
        {/* Header Alert */}
        <div className="bg-gradient-to-r from-amber-500 to-amber-600 px-6 py-4 text-white flex items-center gap-3">
          <div className="p-2 bg-amber-700/40 rounded-xl">
            <ShieldAlert className="w-6 h-6 text-amber-100" />
          </div>
          <div>
            <h3 className="font-bold text-lg leading-tight">Wajib Ganti Kata Sandi Awal</h3>
            <p className="text-xs text-amber-100 mt-0.5">
              Sebagai kebijakan keamanan, akun pengguna baru wajib mengganti password sebelum melanjutkan.
            </p>
          </div>
        </div>

        {/* Content & Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 text-sm">
          {errorMsg && (
            <div className="flex items-start gap-2.5 p-3.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-xl text-rose-700 dark:text-rose-300 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="flex items-start gap-2.5 p-3.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl text-emerald-700 dark:text-emerald-300 text-xs">
              <CheckCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{successMsg}</span>
            </div>
          )}

          <div className="bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700/80 text-xs text-slate-600 dark:text-slate-300 space-y-1">
            <div className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
              <span>Akun:</span>
              <span className="font-mono text-emerald-600 dark:text-emerald-400">{user.username}</span>
              <span className="text-[11px] px-2 py-0.5 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 rounded-full font-sans">
                {user.fullName}
              </span>
            </div>
            <p className="text-[11px] text-slate-500">
              Gunakan kata sandi awal dari administrator. Demi keamanan akun, mohon segera ganti dengan kata sandi pribadi Anda.
            </p>
          </div>

          {/* Current Password Field */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Kata Sandi Saat Ini / Awal
            </label>
            <div className="relative">
              <input
                type={showCurrent ? 'text' : 'password'}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 pr-10 text-sm border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                placeholder="Masukkan kata sandi awal"
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

          {/* New Password Field */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Kata Sandi Baru (Min. 8 Karakter & Kombinasi Huruf dan Angka)
            </label>
            <div className="relative">
              <input
                type={showNew ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 pr-10 text-sm border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                placeholder="Buat kata sandi baru yang kuat"
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

          {/* Confirm Password Field */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Konfirmasi Kata Sandi Baru
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className="w-full px-3.5 py-2.5 text-sm border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
              placeholder="Ulangi kata sandi baru"
            />
          </div>

          {/* Checklist Rules */}
          <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl space-y-1.5 text-xs text-slate-600 dark:text-slate-400">
            <div className="flex items-center gap-2">
              <CheckCircle className={`w-3.5 h-3.5 ${hasMinLength ? 'text-emerald-600' : 'text-slate-300 dark:text-slate-600'}`} />
              <span className={hasMinLength ? 'text-emerald-700 dark:text-emerald-400 font-medium' : ''}>
                Minimal 8 karakter
              </span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className={`w-3.5 h-3.5 ${hasMixedChars ? 'text-emerald-600' : 'text-slate-300 dark:text-slate-600'}`} />
              <span className={hasMixedChars ? 'text-emerald-700 dark:text-emerald-400 font-medium' : ''}>
                Mengandung huruf dan angka
              </span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className={`w-3.5 h-3.5 ${passwordsMatch ? 'text-emerald-600' : 'text-slate-300 dark:text-slate-600'}`} />
              <span className={passwordsMatch ? 'text-emerald-700 dark:text-emerald-400 font-medium' : ''}>
                Konfirmasi kata sandi cocok
              </span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className={`w-3.5 h-3.5 ${isDifferentFromOld ? 'text-emerald-600' : 'text-slate-300 dark:text-slate-600'}`} />
              <span className={isDifferentFromOld ? 'text-emerald-700 dark:text-emerald-400 font-medium' : ''}>
                Tidak boleh sama dengan kata sandi lama
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              onClick={onLogout}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Keluar Saja</span>
            </button>

            <button
              type="submit"
              disabled={!isFormValid || loading}
              className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl shadow-md shadow-emerald-600/20 transition-colors"
            >
              <Lock className="w-4 h-4" />
              <span>{loading ? 'Menyimpan...' : 'Simpan Kata Sandi Baru'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
