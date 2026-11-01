import React from 'react';
import { X, Save, AlertCircle } from 'lucide-react';
import type { Santri, Lembaga, Asrama, Kamar } from '../types/index.ts';

interface SantriFormModalProps {
  initialData?: Santri | null;
  onClose: () => void;
  onSuccess: () => void;
  lembagas: Lembaga[];
  asramas: Asrama[];
}

export const SantriFormModal: React.FC<SantriFormModalProps> = ({
  initialData,
  onClose,
  onSuccess,
  lembagas,
  asramas,
}) => {
  const isEdit = !!initialData;
  const [submitting, setSubmitting] = React.useState(false);
  const [errorMsg, setErrorMsg] = React.useState('');

  const [kamars, setKamars] = React.useState<Kamar[]>([]);

  const defaultLembaga = lembagas[0]?.id || '';
  const defaultAsrama = asramas[0]?.id || '';

  const [formData, setFormData] = React.useState({
    nis: initialData?.nis || '',
    nisn: initialData?.nisn || '',
    nik: initialData?.nik || '',
    namaLengkap: initialData?.namaLengkap || '',
    namaPanggilan: initialData?.namaPanggilan || '',
    jenisKelamin: initialData?.jenisKelamin || 'L',
    tempatLahir: initialData?.tempatLahir || '',
    tanggalLahir: initialData?.tanggalLahir || '2010-01-01',
    
    lembagaId: initialData?.lembagaId || defaultLembaga,
    asramaId: initialData?.asramaId || defaultAsrama,
    kamarId: initialData?.kamarId || '',
    
    jenjang: initialData?.jenjang || 'SMP',
    kelas: initialData?.kelas || '',
    asrama: initialData?.asrama || '',
    kamarLabel: initialData?.kamarLabel || '',

    status: initialData?.status || 'aktif',
    namaAyah: initialData?.namaAyah || '',
    namaIbu: initialData?.namaIbu || '',
    noHpWali: initialData?.noHpWali || '',
    alamatAsal: initialData?.alamatAsal || '',
    kotaAsal: initialData?.kotaAsal || '',
    provinsiAsal: initialData?.provinsiAsal || '',
    targetJuzHafalan: initialData?.targetJuzHafalan || 30,
    capaianJuzHafalan: initialData?.capaianJuzHafalan || 0,
    statusSpp: initialData?.statusSpp || 'lunas',
    catatanKesehatan: initialData?.catatanKesehatan || '',
  });

  // Fetch Kamars when asramaId changes
  React.useEffect(() => {
    if (formData.asramaId) {
      fetch(`/api/master/kamar?asramaId=${formData.asramaId}`)
        .then((res) => res.json())
        .then((data) => {
          setKamars(data.data || []);
          if (!formData.kamarId && data.data && data.data.length > 0) {
            setFormData((prev) => ({
              ...prev,
              kamarId: data.data[0].id,
              kamarLabel: data.data[0].namaKamar,
            }));
          }
        });
    }
  }, [formData.asramaId]);

  // Selected lembaga classes
  const currentLembaga = lembagas.find((l) => l.id === formData.lembagaId);
  const classOptions = currentLembaga ? currentLembaga.tingkatKelas : [];

  // Filter Asrama by Gender (Putra to Putra, Putri to Putri)
  const availableAsramas = asramas.filter(
    (a) => a.kelompokGender === (formData.jenisKelamin === 'L' ? 'Putra' : 'Putri')
  );

  const handleGenderChange = (jk: 'L' | 'P') => {
    const validAsramas = asramas.filter((a) => a.kelompokGender === (jk === 'L' ? 'Putra' : 'Putri'));
    const newAsrama = validAsramas[0]?.id || '';
    setFormData((prev) => ({
      ...prev,
      jenisKelamin: jk,
      asramaId: newAsrama,
      kamarId: '',
    }));
  };

  const handleLembagaChange = (lmbId: string) => {
    const lmb = lembagas.find((l) => l.id === lmbId);
    setFormData((prev) => ({
      ...prev,
      lembagaId: lmbId,
      jenjang: lmb ? lmb.kode : prev.jenjang,
      kelas: lmb?.tingkatKelas[0] || prev.kelas,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!formData.nis.trim() || !formData.namaLengkap.trim()) {
      setErrorMsg('NIS dan Nama Lengkap santri wajib diisi.');
      return;
    }

    // Prepare human-readable strings
    const selAsrama = asramas.find((a) => a.id === formData.asramaId);
    const selKamar = kamars.find((k) => k.id === formData.kamarId);
    const asramaDisplay = selAsrama ? `${selAsrama.nama} - ${selKamar?.namaKamar || ''}` : formData.asrama;

    try {
      setSubmitting(true);
      const url = isEdit ? `/api/santri/${initialData.id}` : '/api/santri';
      const method = isEdit ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          asrama: asramaDisplay,
          kamarLabel: selKamar?.namaKamar || formData.kamarLabel,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || 'Gagal menyimpan data');
      }

      onSuccess();
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            {isEdit ? 'Ubah Data Santri' : 'Pendaftaran Santri Baru'}
          </h2>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-4 text-xs">
          {errorMsg && (
            <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-xl text-rose-700 dark:text-rose-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Section 1: Identitas */}
          <div>
            <h3 className="font-bold text-slate-900 dark:text-white uppercase tracking-wider text-[11px] mb-2 text-emerald-700 dark:text-emerald-400">
              1. Identitas Pokok Santri
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-slate-600 dark:text-slate-300 font-medium mb-1">
                  NIS (Nomor Induk Santri)*:
                </label>
                <input
                  type="text"
                  required
                  value={formData.nis}
                  onChange={(e) => setFormData({ ...formData, nis: e.target.value })}
                  placeholder="Contoh: 2402001"
                  className="w-full px-3 py-1.5 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 font-mono"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-slate-600 dark:text-slate-300 font-medium mb-1">
                  Nama Lengkap Santri*:
                </label>
                <input
                  type="text"
                  required
                  value={formData.namaLengkap}
                  onChange={(e) => setFormData({ ...formData, namaLengkap: e.target.value })}
                  className="w-full px-3 py-1.5 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-3">
              <div>
                <label className="block text-slate-600 dark:text-slate-300 font-medium mb-1">
                  Nama Panggilan:
                </label>
                <input
                  type="text"
                  value={formData.namaPanggilan}
                  onChange={(e) => setFormData({ ...formData, namaPanggilan: e.target.value })}
                  className="w-full px-3 py-1.5 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800"
                />
              </div>
              <div>
                <label className="block text-slate-600 dark:text-slate-300 font-medium mb-1">
                  Jenis Kelamin*:
                </label>
                <select
                  value={formData.jenisKelamin}
                  onChange={(e) => handleGenderChange(e.target.value as 'L' | 'P')}
                  className="w-full px-3 py-1.5 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 font-semibold"
                >
                  <option value="L">Putra (Laki-laki)</option>
                  <option value="P">Putri (Perempuan)</option>
                </select>
              </div>
              <div>
                <label className="block text-slate-600 dark:text-slate-300 font-medium mb-1">
                  Tempat Lahir:
                </label>
                <input
                  type="text"
                  value={formData.tempatLahir}
                  onChange={(e) => setFormData({ ...formData, tempatLahir: e.target.value })}
                  className="w-full px-3 py-1.5 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800"
                />
              </div>
              <div>
                <label className="block text-slate-600 dark:text-slate-300 font-medium mb-1">
                  Tanggal Lahir:
                </label>
                <input
                  type="date"
                  value={formData.tanggalLahir}
                  onChange={(e) => setFormData({ ...formData, tanggalLahir: e.target.value })}
                  className="w-full px-3 py-1.5 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Lembaga & Penempatan Kamar Asrama */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
            <h3 className="font-bold text-slate-900 dark:text-white uppercase tracking-wider text-[11px] mb-2 text-emerald-700 dark:text-emerald-400">
              2. Lembaga Pendidikan, Asrama & Kamar
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-600 dark:text-slate-300 font-medium mb-1">
                  Lembaga Pendidikan*:
                </label>
                <select
                  value={formData.lembagaId}
                  onChange={(e) => handleLembagaChange(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 font-medium"
                >
                  {lembagas.map((l) => (
                    <option key={l.id} value={l.id}>{l.nama} ({l.kode})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-300 font-medium mb-1">
                  Tingkat Kelas / Rombel*:
                </label>
                {classOptions.length > 0 ? (
                  <select
                    value={formData.kelas}
                    onChange={(e) => setFormData({ ...formData, kelas: e.target.value })}
                    className="w-full px-3 py-1.5 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800"
                  >
                    {classOptions.map((cls) => (
                      <option key={cls} value={cls}>{cls}</option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    value={formData.kelas}
                    onChange={(e) => setFormData({ ...formData, kelas: e.target.value })}
                    className="w-full px-3 py-1.5 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800"
                  />
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
              <div>
                <label className="block text-slate-600 dark:text-slate-300 font-medium mb-1">
                  Gedung Asrama (Sesuai Gender {formData.jenisKelamin === 'L' ? 'Putra' : 'Putri'})*:
                </label>
                <select
                  value={formData.asramaId}
                  onChange={(e) => setFormData({ ...formData, asramaId: e.target.value, kamarId: '' })}
                  className="w-full px-3 py-1.5 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 font-medium"
                >
                  {availableAsramas.map((a) => (
                    <option key={a.id} value={a.id}>{a.nama}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-300 font-medium mb-1">
                  Penempatan Kamar (1 Kamar per Santri)*:
                </label>
                <select
                  value={formData.kamarId}
                  onChange={(e) => setFormData({ ...formData, kamarId: e.target.value })}
                  className="w-full px-3 py-1.5 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 font-medium"
                >
                  <option value="">Pilih Kamar</option>
                  {kamars.map((k) => (
                    <option key={k.id} value={k.id}>
                      {k.namaKamar} (Kapasitas: {k.kapasitas} santri)
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Section 3: Wali & Alamat */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
            <h3 className="font-bold text-slate-900 dark:text-white uppercase tracking-wider text-[11px] mb-2 text-emerald-700 dark:text-emerald-400">
              3. Orang Tua, Wali & Status
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-slate-600 dark:text-slate-300 font-medium mb-1">Nama Ayah:</label>
                <input
                  type="text"
                  value={formData.namaAyah}
                  onChange={(e) => setFormData({ ...formData, namaAyah: e.target.value })}
                  className="w-full px-3 py-1.5 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800"
                />
              </div>
              <div>
                <label className="block text-slate-600 dark:text-slate-300 font-medium mb-1">Nama Ibu:</label>
                <input
                  type="text"
                  value={formData.namaIbu}
                  onChange={(e) => setFormData({ ...formData, namaIbu: e.target.value })}
                  className="w-full px-3 py-1.5 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800"
                />
              </div>
              <div>
                <label className="block text-slate-600 dark:text-slate-300 font-medium mb-1">No. WhatsApp Wali:</label>
                <input
                  type="text"
                  placeholder="08xxxxxxxxxx"
                  value={formData.noHpWali}
                  onChange={(e) => setFormData({ ...formData, noHpWali: e.target.value })}
                  className="w-full px-3 py-1.5 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-3">
              <div>
                <label className="block text-slate-600 dark:text-slate-300 font-medium mb-1">Kota Asal:</label>
                <input
                  type="text"
                  value={formData.kotaAsal}
                  onChange={(e) => setFormData({ ...formData, kotaAsal: e.target.value })}
                  className="w-full px-3 py-1.5 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800"
                />
              </div>
              <div>
                <label className="block text-slate-600 dark:text-slate-300 font-medium mb-1">Status Santri:</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                  className="w-full px-3 py-1.5 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 font-semibold"
                >
                  <option value="aktif">Aktif di Pondok</option>
                  <option value="izin_pulang">Izin Pulang</option>
                  <option value="alpa">Alpa</option>
                  <option value="skorsing">Skorsing</option>
                  <option value="lulus">Lulus / Alumni</option>
                </select>
              </div>
              <div>
                <label className="block text-slate-600 dark:text-slate-300 font-medium mb-1">Status SPP:</label>
                <select
                  value={formData.statusSpp}
                  onChange={(e) => setFormData({ ...formData, statusSpp: e.target.value as any })}
                  className="w-full px-3 py-1.5 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800"
                >
                  <option value="lunas">Lunas</option>
                  <option value="tunggakan_1_bulan">Tunggakan 1 Bulan</option>
                  <option value="tunggakan_2_bulan">Tunggakan 2 Bulan</option>
                  <option value="tunggakan_3_bulan_plus">Tunggakan 3+ Bulan</option>
                </select>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border rounded-lg text-slate-600"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{submitting ? 'Menyimpan...' : 'Simpan Data'}</span>
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
