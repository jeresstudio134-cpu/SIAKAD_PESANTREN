import React from 'react';
import { X, Printer, GraduationCap, QrCode } from 'lucide-react';
import type { Santri } from '../types/index.ts';

interface KartuSantriModalProps {
  santri: Santri;
  onClose: () => void;
}

export const KartuSantriModal: React.FC<KartuSantriModalProps> = ({
  santri,
  onClose,
}) => {
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
          <div className="flex items-center gap-2">
            <Printer className="w-4 h-4 text-emerald-600" />
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">
              Cetak Kartu Tanda Santri (KTS)
            </h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Card Body to Print */}
        <div className="p-6 flex flex-col items-center">
          
          {/* Printable ID Card Container */}
          <div 
            id="printable-kts-card"
            className="w-[340px] h-[215px] bg-gradient-to-br from-emerald-800 via-emerald-900 to-teal-950 text-white rounded-2xl p-4 shadow-xl relative overflow-hidden flex flex-col justify-between border border-emerald-700/50"
          >
            {/* Subtle Islamic Motif Background Decoration */}
            <div className="absolute -right-8 -top-8 w-32 h-32 rounded-full bg-emerald-500/10 pointer-events-none" />
            <div className="absolute -left-8 -bottom-8 w-32 h-32 rounded-full bg-teal-500/10 pointer-events-none" />

            {/* Top Card Header */}
            <div className="flex items-center justify-between border-b border-emerald-700/60 pb-2 relative z-10">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-emerald-600 flex items-center justify-center text-white shadow-xs">
                  <GraduationCap className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-[11px] uppercase tracking-wider text-emerald-200 leading-none">
                    PONDOK PESANTREN SALAF MODERN
                  </h4>
                  <p className="text-[9px] text-emerald-300 font-medium mt-0.5">
                    KARTU TANDA SANTRI (KTS)
                  </p>
                </div>
              </div>
              <span className="text-[10px] font-mono font-bold text-emerald-300">
                {santri.tahunMasuk}
              </span>
            </div>

            {/* Middle Content */}
            <div className="flex items-center gap-3.5 my-auto relative z-10">
              <div className="w-20 h-24 rounded-xl overflow-hidden border-2 border-emerald-400/60 bg-emerald-950 flex items-center justify-center shrink-0 shadow-sm">
                {santri.fotoUrl ? (
                  <img
                    src={santri.fotoUrl}
                    alt={santri.namaLengkap}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="text-xl font-bold uppercase text-emerald-300">
                    {santri.namaLengkap.charAt(0)}
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-0 text-[11px]">
                <div className="font-bold text-white text-xs truncate">
                  {santri.namaLengkap}
                </div>
                <div className="font-mono text-emerald-300 text-[10px] mt-0.5 font-bold">
                  NIS: {santri.nis}
                </div>
                <div className="text-emerald-100/90 text-[10px] mt-1">
                  {santri.jenjang} · {santri.kelas}
                </div>
                <div className="text-emerald-200/80 text-[9px] truncate">
                  {santri.asrama}
                </div>
                <div className="text-emerald-200/80 text-[9px] truncate">
                  Asal: {santri.kotaAsal || 'Indonesia'}
                </div>
              </div>
            </div>

            {/* Bottom Card Footer with Barcode simulation */}
            <div className="flex items-center justify-between pt-1.5 border-t border-emerald-700/60 text-[9px] text-emerald-300 relative z-10">
              <div>
                Berlaku selama menjadi santri aktif
              </div>
              <div className="flex items-center gap-1 font-mono tracking-widest text-[8px] bg-emerald-950/80 px-1.5 py-0.5 rounded">
                |||| | ||||| || |||
              </div>
            </div>

          </div>

          <p className="text-[11px] text-slate-400 mt-4 text-center">
            Gunakan tombol cetak di bawah untuk mencetak kartu tanda santri (ukuran standar ID Card / dompet).
          </p>

        </div>

        {/* Action Footer */}
        <div className="px-5 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-300 text-xs font-medium"
          >
            Tutup
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-xs"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Cetak Kartu (Print)</span>
          </button>
        </div>

      </div>
    </div>
  );
};
