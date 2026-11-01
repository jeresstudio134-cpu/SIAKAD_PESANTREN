import React from 'react';
import { Cloud, Copy, Check, Terminal, Database, HardDrive, ShieldCheck, Rocket } from 'lucide-react';

export const DeployModal: React.FC = () => {
  const [copiedIndex, setCopiedIndex] = React.useState<number | null>(null);

  const copyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const steps = [
    {
      step: 1,
      title: 'Buat Database Cloudflare D1',
      description: 'Membuat database SQLite serverless di edge network Cloudflare.',
      command: 'wrangler d1 create siakad_db',
      note: 'Salin database_id yang muncul di terminal ke dalam file wrangler.jsonc.',
      icon: Database,
    },
    {
      step: 2,
      title: 'Buat Bucket Cloudflare R2',
      description: 'Membuat object storage untuk menyimpan foto santri, staf, dan berkas ekspor excel.',
      command: 'wrangler r2 bucket create siakad-storage',
      note: 'Bucket otomatis terikat melalui binding c.env.BUCKET tanpa perlu akses S3 key eksternal.',
      icon: HardDrive,
    },
    {
      step: 3,
      title: 'Jalankan File Migrasi Database D1',
      description: 'Menerapkan struktur tabel (santri, staf, tahfidz, perizinan, sesi) dan indeks performa.',
      command: 'wrangler d1 execute siakad_db --remote --file=./migrations/0000_init.sql',
      note: 'Gunakan --local saat menguji coba lokal dengan wrangler dev.',
      icon: Terminal,
    },
    {
      step: 4,
      title: 'Atur Kunci Rahasia Sesi (JWT_SECRET)',
      description: 'Menyimpan kunci enkripsi token sesi secara aman di Cloudflare Secrets.',
      command: 'wrangler secret put JWT_SECRET',
      note: 'Masukkan teks rahasia acak yang aman saat diminta di terminal.',
      icon: ShieldCheck,
    },
    {
      step: 5,
      title: 'Build Frontend & Deploy ke Cloudflare Workers',
      description: 'Mengompilasi React SPA dan mendeploy backend Hono + static assets ke Cloudflare Workers.',
      command: 'npm run build && wrangler deploy',
      note: 'Aplikasi siap diakses di URL https://siakad-pesantren.<subdomain>.workers.dev.',
      icon: Rocket,
    },
  ];

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs max-w-4xl mx-auto space-y-6">
      
      {/* Header */}
      <div className="flex items-start justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-5">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0">
            <Cloud className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              Panduan Deployment Cloudflare Workers, D1 & R2
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Arsitektur 100% Serverless Edge tanpa koneksi eksternal. Semua data lewat binding <code className="font-mono text-emerald-600">c.env.DB</code> dan <code className="font-mono text-emerald-600">c.env.BUCKET</code>.
            </p>
          </div>
        </div>

        <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2.5 py-1 rounded-full whitespace-nowrap">
          Production Ready
        </span>
      </div>

      {/* Architecture Highlights */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
        <div className="p-3.5 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-800">
          <strong className="block text-slate-900 dark:text-white font-semibold mb-1">
            ⚡ Backend: Hono Worker
          </strong>
          <span className="text-slate-500 text-[11px] leading-relaxed">
            Waktu respon &lt;10ms di seluruh dunia via V8 isolates Cloudflare.
          </span>
        </div>

        <div className="p-3.5 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-800">
          <strong className="block text-slate-900 dark:text-white font-semibold mb-1">
            🗄️ Database: Cloudflare D1
          </strong>
          <span className="text-slate-500 text-[11px] leading-relaxed">
            SQLite serverless + Drizzle ORM. Dilengkapi 11 indeks untuk query super cepat 2.000+ santri.
          </span>
        </div>

        <div className="p-3.5 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-800">
          <strong className="block text-slate-900 dark:text-white font-semibold mb-1">
            📦 Storage: Cloudflare R2
          </strong>
          <span className="text-slate-500 text-[11px] leading-relaxed">
            Zero egress fee object storage untuk foto santri, berkas perizinan, dan export Excel.
          </span>
        </div>
      </div>

      {/* Step by Step Commands */}
      <div className="space-y-4">
        <h3 className="font-bold text-xs uppercase tracking-wider text-slate-400">
          Langkah Eksekusi di Terminal (CLI)
        </h3>

        <div className="space-y-3.5">
          {steps.map((item, idx) => {
            const Icon = item.icon;
            const isCopied = copiedIndex === idx;

            return (
              <div
                key={item.step}
                className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700/80 transition-colors"
              >
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-6 h-6 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
                      {item.step}
                    </div>
                    <div>
                      <h4 className="font-bold text-xs text-slate-900 dark:text-white">
                        {item.title}
                      </h4>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        {item.description}
                      </p>
                    </div>
                  </div>
                  <Icon className="w-4 h-4 text-slate-400 shrink-0" />
                </div>

                {/* Command Bar */}
                <div className="mt-3 flex items-center justify-between gap-2 bg-slate-900 text-slate-100 px-3.5 py-2 rounded-lg font-mono text-xs overflow-x-auto">
                  <span className="text-emerald-400 select-none mr-1">$</span>
                  <span className="flex-1 whitespace-nowrap">{item.command}</span>
                  <button
                    onClick={() => copyToClipboard(item.command, idx)}
                    className="p-1 text-slate-400 hover:text-white transition-colors shrink-0"
                    title="Salin Perintah"
                  >
                    {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>

                <div className="mt-2 text-[11px] text-slate-500 italic">
                  💡 {item.note}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Default Login Notice */}
      <div className="p-4 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs space-y-1">
        <strong className="text-emerald-900 dark:text-emerald-300 font-semibold block">
          Akun Administrator Bawaan Setelah Migrasi:
        </strong>
        <p className="text-emerald-800 dark:text-emerald-400">
          Username: <code className="font-mono font-bold bg-white/60 dark:bg-slate-900/60 px-1 py-0.5 rounded">admin</code> · Password: <code className="font-mono font-bold bg-white/60 dark:bg-slate-900/60 px-1 py-0.5 rounded">adminpesantren123</code>
        </p>
      </div>

    </div>
  );
};
