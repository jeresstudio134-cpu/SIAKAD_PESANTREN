import React from 'react';
import { X, Lock, User, Shield, Building2, Home, Eye } from 'lucide-react';
import type { UserSession } from '../types/index.ts';

interface LoginModalProps {
  onClose: () => void;
  onLoginSuccess: (user: UserSession) => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({
  onClose,
  onLoginSuccess,
}) => {
  const [username, setUsername] = React.useState('admin');
  const [password, setPassword] = React.useState('adminpesantren123');
  const [loading, setLoading] = React.useState(false);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);

  const handleStandardLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      setErrorMsg(null);

      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Login gagal');
      }

      onLoginSuccess(data.user);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = async (targetUsername: string) => {
    try {
      setLoading(true);
      setErrorMsg(null);

      const res = await fetch('/api/auth/quick-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: targetUsername }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Quick login gagal');
      }

      onLoginSuccess(data.user);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-emerald-600" />
            <h3 className="font-bold text-base text-slate-900 dark:text-white">
              Ganti Akun & Uji Coba Hak Akses (RBAC)
            </h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4 text-xs overflow-y-auto max-h-[80vh]">
          
          {/* Quick Demo Switcher Buttons */}
          <div>
            <label className="block text-slate-400 font-bold uppercase tracking-wider text-[10px] mb-2">
              Pilih Role Pengguna (Cakupan Otomatis Dipaksa oleh Server):
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              
              {/* 1. Super Admin */}
              <button
                type="button"
                onClick={() => handleQuickLogin('admin')}
                className="p-2.5 text-left border border-slate-200 dark:border-slate-700 rounded-xl hover:border-emerald-500 hover:bg-emerald-50/50 dark:hover:bg-emerald-950/20 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <strong className="block text-slate-900 dark:text-white font-semibold">Super Admin</strong>
                  <span className="text-[9px] bg-purple-100 text-purple-800 font-bold px-1.5 py-0.5 rounded">All Access</span>
                </div>
                <span className="text-[10px] text-slate-500 block mt-0.5">Kelola Pengguna, Master Data & Semua Santri</span>
              </button>

              {/* 2. Admin Lembaga SMP */}
              <button
                type="button"
                onClick={() => handleQuickLogin('admin_smp')}
                className="p-2.5 text-left border border-slate-200 dark:border-slate-700 rounded-xl hover:border-blue-500 hover:bg-blue-50/50 dark:hover:bg-blue-950/20 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <strong className="block text-slate-900 dark:text-white font-semibold">Admin Lembaga SMP</strong>
                  <span className="text-[9px] bg-blue-100 text-blue-800 font-bold px-1.5 py-0.5 rounded">SMP Only</span>
                </div>
                <span className="text-[10px] text-slate-500 block mt-0.5">Hanya melihat & mengelola santri SMP (500 santri)</span>
              </button>

              {/* 3. Admin Lembaga SMA & SMK */}
              <button
                type="button"
                onClick={() => handleQuickLogin('admin_sma_smk')}
                className="p-2.5 text-left border border-slate-200 dark:border-slate-700 rounded-xl hover:border-blue-500 hover:bg-blue-50/50 dark:hover:bg-blue-950/20 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <strong className="block text-slate-900 dark:text-white font-semibold">Admin SMA & SMK</strong>
                  <span className="text-[9px] bg-blue-100 text-blue-800 font-bold px-1.5 py-0.5 rounded">SMA + SMK</span>
                </div>
                <span className="text-[10px] text-slate-500 block mt-0.5">Hanya melihat & mengelola santri SMA/SMK</span>
              </button>

              {/* 4. Pengurus Asrama Putra */}
              <button
                type="button"
                onClick={() => handleQuickLogin('musyrif_putra')}
                className="p-2.5 text-left border border-slate-200 dark:border-slate-700 rounded-xl hover:border-amber-500 hover:bg-amber-50/50 dark:hover:bg-amber-950/20 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <strong className="block text-slate-900 dark:text-white font-semibold">Pengurus Asrama Putra</strong>
                  <span className="text-[9px] bg-amber-100 text-amber-800 font-bold px-1.5 py-0.5 rounded">Putra Only</span>
                </div>
                <span className="text-[10px] text-slate-500 block mt-0.5">Hanya akses santri di 4 Asrama Putra (1.000 santri)</span>
              </button>

              {/* 5. Pengurus Asrama Putri */}
              <button
                type="button"
                onClick={() => handleQuickLogin('musyrifah_putri')}
                className="p-2.5 text-left border border-slate-200 dark:border-slate-700 rounded-xl hover:border-amber-500 hover:bg-amber-50/50 dark:hover:bg-amber-950/20 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <strong className="block text-slate-900 dark:text-white font-semibold">Pengurus Asrama Putri</strong>
                  <span className="text-[9px] bg-pink-100 text-pink-800 font-bold px-1.5 py-0.5 rounded">Putri Only</span>
                </div>
                <span className="text-[10px] text-slate-500 block mt-0.5">Hanya akses santri di 3 Asrama Putri (1.000 santri)</span>
              </button>

              {/* 6. Viewer Read-Only */}
              <button
                type="button"
                onClick={() => handleQuickLogin('viewer_smp')}
                className="p-2.5 text-left border border-slate-200 dark:border-slate-700 rounded-xl hover:border-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <strong className="block text-slate-900 dark:text-white font-semibold">Viewer (Hanya Baca)</strong>
                  <span className="text-[9px] bg-slate-200 text-slate-800 font-bold px-1.5 py-0.5 rounded">Read Only</span>
                </div>
                <span className="text-[10px] text-slate-500 block mt-0.5">Hanya melihat & ekspor data (tidak dapat mengedit)</span>
              </button>

            </div>
          </div>

          <div className="relative flex py-1 items-center">
            <div className="flex-grow border-t border-slate-200 dark:border-slate-800"></div>
            <span className="flex-shrink mx-3 text-slate-400 text-[10px] uppercase font-semibold">atau login manual</span>
            <div className="flex-grow border-t border-slate-200 dark:border-slate-800"></div>
          </div>

          {/* Standard Login Form */}
          <form onSubmit={handleStandardLogin} className="space-y-3">
            {errorMsg && (
              <div className="p-2.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-lg text-rose-700 dark:text-rose-300">
                {errorMsg}
              </div>
            )}

            <div>
              <label className="block text-slate-600 dark:text-slate-300 font-medium mb-1">
                Username:
              </label>
              <div className="relative">
                <User className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-600 dark:text-slate-300 font-medium mb-1">
                Kata Sandi:
              </label>
              <div className="relative">
                <Lock className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold transition-colors mt-2"
            >
              {loading ? 'Memverifikasi...' : 'Masuk ke SIAKAD'}
            </button>
          </form>

        </div>

      </div>
    </div>
  );
};
