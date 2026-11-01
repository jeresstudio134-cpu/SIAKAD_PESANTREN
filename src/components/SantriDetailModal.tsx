import React from 'react';
import { 
  X, 
  Phone, 
  MapPin, 
  Calendar, 
  User, 
  BookOpen, 
  Clock, 
  AlertTriangle, 
  Upload, 
  Plus, 
  CheckCircle2,
  ExternalLink,
  Heart,
  FileText,
  File,
  Trash2,
  Download,
  Building2,
  GraduationCap,
  Layers
} from 'lucide-react';
import type { 
  Santri, 
  TahfidzRecord, 
  Perizinan, 
  Pelanggaran, 
  UserSession, 
  RiwayatAkademik, 
  SantriKeanggotaan, 
  Dokumen,
  Lembaga,
  Kelas,
  TahunAjaran
} from '../types/index.ts';
import { compressImage, validateUpload } from '../utils/imageCompressor.ts';

interface SantriDetailModalProps {
  santri: Santri;
  onClose: () => void;
  onRefresh: () => void;
  currentUser: UserSession | null;
}

export const SantriDetailModal: React.FC<SantriDetailModalProps> = ({
  santri,
  onClose,
  onRefresh,
  currentUser,
}) => {
  const isViewer = currentUser?.role === 'viewer';

  const [activeTab, setActiveTab] = React.useState<
    'profil' | 'keanggotaan' | 'riwayat' | 'dokumen' | 'tahfidz' | 'perizinan' | 'pelanggaran'
  >('profil');

  const [loading, setLoading] = React.useState(true);
  const [detailData, setDetailData] = React.useState<{
    santri: Santri;
    tahfidz: TahfidzRecord[];
    perizinan: Perizinan[];
    pelanggaran: Pelanggaran[];
    riwayatAkademik?: RiwayatAkademik[];
    penempatanKamarList?: any[];
  } | null>(null);

  // Multi-Lembaga & Dokumen states
  const [keanggotaanList, setKeanggotaanList] = React.useState<SantriKeanggotaan[]>([]);
  const [dokumenList, setDokumenList] = React.useState<Dokumen[]>([]);
  const [lembagas, setLembagas] = React.useState<Lembaga[]>([]);
  const [kelasList, setKelasList] = React.useState<Kelas[]>([]);
  const [tahunAjarans, setTahunAjarans] = React.useState<TahunAjaran[]>([]);
  
  // Keanggotaan form state
  const [showAddKeanggotaan, setShowAddKeanggotaan] = React.useState(false);
  const [keanggotaanForm, setKeanggotaanForm] = React.useState({
    tahunAjaranId: '',
    lembagaId: '',
    kelasId: '',
    status: 'aktif' as 'aktif' | 'naik' | 'tinggal' | 'lulus' | 'keluar',
  });

  // Dokumen upload state
  const [showAddDokumen, setShowAddDokumen] = React.useState(false);
  const [uploadingDokumen, setUploadingDokumen] = React.useState(false);
  const [dokumenForm, setDokumenForm] = React.useState({
    jenis: 'Kartu Keluarga (KK)',
    namaFile: '',
  });
  const docFileInputRef = React.useRef<HTMLInputElement | null>(null);
  const [selectedDocFile, setSelectedDocFile] = React.useState<File | null>(null);

  const [uploadingPhoto, setUploadingPhoto] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  // Sub-forms state
  const [showAddTahfidz, setShowAddTahfidz] = React.useState(false);
  const [tahfidzForm, setTahfidzForm] = React.useState({
    juz: 1,
    surat: 'Al-Baqarah',
    ayatMulai: 1,
    ayatSelesai: 50,
    predikat: 'Mumtaz',
    catatan: '',
  });

  const [showAddIzin, setShowAddIzin] = React.useState(false);
  const [izinForm, setIzinForm] = React.useState({
    jenis: 'pulang_keluarga',
    tanggalMulai: new Date().toISOString().split('T')[0],
    tanggalKembali: new Date(Date.now() + 4 * 86400000).toISOString().split('T')[0],
    penjemput: santri.namaAyah || 'Orang Tua',
    noHpPenjemput: santri.noHpWali || '',
    catatan: '',
  });

  const [showAddPelanggaran, setShowAddPelanggaran] = React.useState(false);
  const [pelanggaranForm, setPelanggaranForm] = React.useState({
    kategori: 'ringan',
    deskripsi: '',
    poin: 5,
    sanksi: 'Membersihkan musholla & membaca wirid',
  });

  const [errorForbidden, setErrorForbidden] = React.useState<string | null>(null);

  const fetchDetail = async () => {
    try {
      setLoading(true);
      setErrorForbidden(null);
      const res = await fetch(`/api/santri/${santri.id}`);
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || 'Akses ditolak: Santri di luar cakupan wewenang');
      }
      if (json.santri) {
        setDetailData(json);
      }
    } catch (err: any) {
      console.error('Fetch santri detail error:', err);
      setErrorForbidden(err.message || 'Akses ditolak: Santri ini di luar cakupan wewenang Anda.');
    } finally {
      setLoading(false);
    }
  };

  const fetchKeanggotaanAndDokumen = async () => {
    try {
      const [kRes, dRes, lRes, cRes, taRes] = await Promise.all([
        fetch(`/api/santri/${santri.id}/keanggotaan`),
        fetch(`/api/dokumen?pemilikId=${santri.id}&pemilikTipe=santri`),
        fetch('/api/master/lembaga'),
        fetch('/api/master/kelas'),
        fetch('/api/master/tahun-ajaran'),
      ]);

      const [kData, dData, lData, cData, taData] = await Promise.all([
        kRes.json(),
        dRes.json(),
        lRes.json(),
        cRes.json(),
        taRes.json(),
      ]);

      setKeanggotaanList(kData.data || []);
      setDokumenList(dData.data || []);
      setLembagas(lData.data || []);
      setKelasList(cData.data || []);
      
      const tas: TahunAjaran[] = taData.data || [];
      setTahunAjarans(tas);
      const activeTa = tas.find((t) => t.isActive);
      if (activeTa) {
        setKeanggotaanForm((prev) => ({
          ...prev,
          tahunAjaranId: activeTa.id,
          lembagaId: lData.data?.[0]?.id || '',
        }));
      }
    } catch (err) {
      console.error('Error fetching keanggotaan/dokumen:', err);
    }
  };

  React.useEffect(() => {
    fetchDetail();
    fetchKeanggotaanAndDokumen();
  }, [santri.id]);

  // Upload Photo to Cloudflare R2 dengan kompresi client-side
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validasi tipe file & ukuran (maks 2MB)
    const val = validateUpload(file, ['image/jpeg', 'image/png', 'image/webp'], 2 * 1024 * 1024);
    if (!val.valid) {
      alert(val.error);
      return;
    }

    try {
      setUploadingPhoto(true);

      // Kompresi foto sisi klien (canvas) agar hemat bandwidth & penyimpanan R2
      const compressedFile = await compressImage(file, {
        maxWidth: 800,
        maxHeight: 800,
        quality: 0.85,
        outputType: 'image/jpeg',
      });

      const formData = new FormData();
      formData.append('file', compressedFile);
      formData.append('category', 'foto_santri');

      const res = await fetch('/api/storage/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();

      if (data.success && data.key) {
        await fetch(`/api/santri/${santri.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fotoR2Key: data.key,
            fotoUrl: data.url,
          }),
        });
        await fetchDetail();
        onRefresh();
      } else {
        alert(data.error || 'Gagal mengunggah foto');
      }
    } catch (err: any) {
      console.error('Upload photo error:', err);
      alert('Terjadi kesalahan saat mengunggah foto: ' + err.message);
    } finally {
      setUploadingPhoto(false);
    }
  };

  // Add Multi-Lembaga Keanggotaan
  const handleAddKeanggotaan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!keanggotaanForm.lembagaId || !keanggotaanForm.kelasId || !keanggotaanForm.tahunAjaranId) {
      alert('Pilih Lembaga, Kelas, dan Tahun Ajaran terlebih dahulu.');
      return;
    }

    try {
      const res = await fetch(`/api/santri/${santri.id}/keanggotaan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(keanggotaanForm),
      });

      if (res.ok) {
        setShowAddKeanggotaan(false);
        await fetchKeanggotaanAndDokumen();
        await fetchDetail();
        onRefresh();
      } else {
        const errJson = await res.json();
        alert(errJson.error || 'Gagal menambahkan keanggotaan');
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Upload Digital Document
  const handleUploadDokumen = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDocFile) {
      alert('Pilih file dokumen terlebih dahulu');
      return;
    }

    // Validasi tipe file & ukuran dokumen (maks 5MB)
    const val = validateUpload(selectedDocFile, ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'], 5 * 1024 * 1024);
    if (!val.valid) {
      alert(val.error);
      return;
    }

    try {
      setUploadingDokumen(true);
      const formData = new FormData();
      formData.append('file', selectedDocFile);
      formData.append('category', 'dokumen_santri');

      const uploadRes = await fetch('/api/storage/upload', {
        method: 'POST',
        body: formData,
      });
      const uploadData = await uploadRes.json();

      if (uploadData.success && uploadData.key) {
        await fetch('/api/dokumen', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            pemilikId: santri.id,
            pemilikTipe: 'santri',
            jenis: dokumenForm.jenis,
            fileKey: uploadData.key,
            namaFile: dokumenForm.namaFile || selectedDocFile.name,
            fileUrl: uploadData.url,
            ukuran: selectedDocFile.size,
          }),
        });

        setSelectedDocFile(null);
        setDokumenForm({ jenis: 'Kartu Keluarga (KK)', namaFile: '' });
        setShowAddDokumen(false);
        await fetchKeanggotaanAndDokumen();
      }
    } catch (err) {
      console.error('Upload dokumen error:', err);
    } finally {
      setUploadingDokumen(false);
    }
  };

  // Delete Digital Document
  const handleDeleteDokumen = async (docId: string, docName: string) => {
    if (!confirm(`Hapus dokumen "${docName}"?`)) return;
    try {
      await fetch(`/api/dokumen/${docId}`, { method: 'DELETE' });
      await fetchKeanggotaanAndDokumen();
    } catch (err) {
      console.error('Delete dokumen error:', err);
    }
  };

  // Add Tahfidz record
  const handleAddTahfidz = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await fetch('/api/tahfidz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          santriId: santri.id,
          ...tahfidzForm,
        }),
      });
      setShowAddTahfidz(false);
      await fetchDetail();
      onRefresh();
    } catch (err) {
      console.error(err);
    }
  };

  // Add Izin Pulang
  const handleAddIzin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await fetch('/api/perizinan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          santriId: santri.id,
          ...izinForm,
        }),
      });
      setShowAddIzin(false);
      await fetchDetail();
      onRefresh();
    } catch (err) {
      console.error(err);
    }
  };

  // Selesaikan Izin (Kembali ke Asrama)
  const handleSelesaiIzin = async (izinId: string) => {
    try {
      await fetch(`/api/perizinan/${izinId}/selesai`, {
        method: 'PUT',
      });
      await fetchDetail();
      onRefresh();
    } catch (err) {
      console.error(err);
    }
  };

  // Add Pelanggaran
  const handleAddPelanggaran = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pelanggaranForm.deskripsi.trim()) return;
    try {
      await fetch('/api/pelanggaran', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          santriId: santri.id,
          ...pelanggaranForm,
        }),
      });
      setShowAddPelanggaran(false);
      setPelanggaranForm({ kategori: 'ringan', deskripsi: '', poin: 5, sanksi: '' });
      await fetchDetail();
      onRefresh();
    } catch (err) {
      console.error(err);
    }
  };

  const currentSantri = detailData?.santri || santri;

  // Format WhatsApp Link
  const getWaLink = (phone?: string | null) => {
    if (!phone) return null;
    const clean = phone.replace(/\D/g, '');
    const intl = clean.startsWith('0') ? '62' + clean.slice(1) : clean;
    return `https://wa.me/${intl}?text=Assalamu%27alaikum%20Bapak%2FIbu%20Wali%20dari%20ananda%20${encodeURIComponent(currentSantri.namaLengkap)}`;
  };

  // Filtered classes for keanggotaan form
  const availableClassesForSelectedLembaga = kelasList.filter(
    (c) => !keanggotaanForm.lembagaId || c.lembagaId === keanggotaanForm.lembagaId
  );

  if (errorForbidden) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
        <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl shadow-2xl border border-rose-200 dark:border-rose-900/60 p-6 text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-600 flex items-center justify-center mx-auto">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Akses Dibatasi Server</h3>
            <p className="text-xs text-rose-600 dark:text-rose-400 mt-1 font-semibold">{errorForbidden}</p>
            <p className="text-[11px] text-slate-500 mt-2">
              Akun Anda ({currentUser?.scopeAsrama === 'putra' ? 'Pengelola Asrama Putra' : currentUser?.scopeAsrama === 'putri' ? 'Pengelola Asrama Putri' : currentUser?.role}) tidak memiliki otoritas untuk melihat data santri ini.
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-full py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-semibold cursor-pointer"
          >
            Tutup & Kembali ke Daftar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 w-full max-w-4xl rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
          <div className="flex items-center gap-3">
            <div className="relative">
              {currentSantri.fotoUrl ? (
                <img
                  src={currentSantri.fotoUrl}
                  alt={currentSantri.namaLengkap}
                  referrerPolicy="no-referrer"
                  className="w-12 h-12 rounded-full object-cover border-2 border-emerald-500"
                />
              ) : (
                <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 font-bold flex items-center justify-center text-lg uppercase border border-emerald-200 dark:border-emerald-700">
                  {currentSantri.namaLengkap.charAt(0)}
                </div>
              )}
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingPhoto}
                title="Upload Foto ke Cloudflare R2"
                className="absolute -bottom-1 -right-1 p-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full text-slate-600 hover:text-emerald-600 shadow-xs cursor-pointer"
              >
                <Upload className="w-3 h-3" />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handlePhotoUpload}
                className="hidden"
              />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold text-slate-500 dark:text-slate-400">
                  NIS: {currentSantri.nis}
                </span>
                <span className="text-slate-300 dark:text-slate-700">·</span>
                <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 capitalize">
                  {currentSantri.status.replace('_', ' ')}
                </span>
              </div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white leading-tight">
                {currentSantri.namaLengkap}
              </h2>
              <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2">
                <span>{currentSantri.jenjang} {currentSantri.kelas} · {currentSantri.asrama}</span>
                {keanggotaanList.length > 1 && (
                  <span className="px-1.5 py-0.2 bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 rounded font-semibold text-[10px]">
                    {keanggotaanList.length} Lembaga
                  </span>
                )}
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 px-5 bg-white dark:bg-slate-900 gap-5 text-xs font-semibold overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveTab('profil')}
            className={`py-3 border-b-2 whitespace-nowrap transition-colors flex items-center gap-1.5 ${
              activeTab === 'profil'
                ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>Biodata & Wali</span>
          </button>

          <button
            onClick={() => setActiveTab('keanggotaan')}
            className={`py-3 border-b-2 whitespace-nowrap transition-colors flex items-center gap-1.5 ${
              activeTab === 'keanggotaan'
                ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>Multi-Lembaga ({keanggotaanList.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('riwayat')}
            className={`py-3 border-b-2 whitespace-nowrap transition-colors flex items-center gap-1.5 ${
              activeTab === 'riwayat'
                ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Riwayat Akademik</span>
          </button>

          <button
            onClick={() => setActiveTab('dokumen')}
            className={`py-3 border-b-2 whitespace-nowrap transition-colors flex items-center gap-1.5 ${
              activeTab === 'dokumen'
                ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Dokumen Digital ({dokumenList.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('tahfidz')}
            className={`py-3 border-b-2 whitespace-nowrap transition-colors flex items-center gap-1.5 ${
              activeTab === 'tahfidz'
                ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Tahfidz ({currentSantri.capaianJuzHafalan} Juz)</span>
          </button>

          <button
            onClick={() => setActiveTab('perizinan')}
            className={`py-3 border-b-2 whitespace-nowrap transition-colors flex items-center gap-1.5 ${
              activeTab === 'perizinan'
                ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Perizinan</span>
          </button>

          <button
            onClick={() => setActiveTab('pelanggaran')}
            className={`py-3 border-b-2 whitespace-nowrap transition-colors flex items-center gap-1.5 ${
              activeTab === 'pelanggaran'
                ? 'border-rose-600 text-rose-600 dark:text-rose-400 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Kedisiplinan ({currentSantri.poinPelanggaran})</span>
          </button>
        </div>

        {/* Tab Content Body */}
        <div className="flex-1 overflow-y-auto p-5 text-xs text-slate-700 dark:text-slate-300">
          
          {/* TAB 1: Biodata & Data Orang Tua / Wali */}
          {activeTab === 'profil' && (
            <div className="space-y-5">
              {/* Identitas Diri */}
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                  Identitas Santri
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-slate-50 dark:bg-slate-800/40 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
                  <div>
                    <span className="text-slate-400 block text-[11px]">Nama Lengkap:</span>
                    <strong className="text-slate-900 dark:text-white font-medium">{currentSantri.namaLengkap}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Nama Panggilan:</span>
                    <span className="text-slate-900 dark:text-white">{currentSantri.namaPanggilan || '-'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Jenis Kelamin:</span>
                    <span className="text-slate-900 dark:text-white">{currentSantri.jenisKelamin === 'L' ? 'Laki-laki (Putra)' : 'Perempuan (Putri)'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">NISN / NIK:</span>
                    <span className="font-mono text-slate-900 dark:text-white">{currentSantri.nisn || '-'} / {currentSantri.nik || '-'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Tempat, Tanggal Lahir:</span>
                    <span className="text-slate-900 dark:text-white">{currentSantri.tempatLahir || '-'}, {currentSantri.tanggalLahir || '-'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Tahun / Tgl Masuk:</span>
                    <span className="font-mono text-slate-900 dark:text-white">{currentSantri.tahunMasuk} {currentSantri.tanggalMasuk ? `(${currentSantri.tanggalMasuk})` : ''}</span>
                  </div>
                </div>
              </div>

              {/* Data Orang Tua & Kontak Wali */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Data Orang Tua / Wali
                  </h3>
                  {currentSantri.noHpWali && (
                    <a
                      href={getWaLink(currentSantri.noHpWali) || '#'}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-xs"
                    >
                      <Phone className="w-3.5 h-3.5" />
                      <span>WhatsApp Wali</span>
                    </a>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 dark:bg-slate-800/40 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
                  <div>
                    <span className="text-slate-400 block text-[11px]">Nama Ayah:</span>
                    <span className="text-slate-900 dark:text-white font-medium">{currentSantri.namaAyah || '-'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Nama Ibu:</span>
                    <span className="text-slate-900 dark:text-white font-medium">{currentSantri.namaIbu || '-'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Nama Wali (Lainnya):</span>
                    <span className="text-slate-900 dark:text-white font-medium">{currentSantri.namaWali || '-'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">No. Telepon / HP Wali:</span>
                    <span className="font-mono text-slate-900 dark:text-white">{currentSantri.noHpWali || '-'}</span>
                  </div>
                  <div className="sm:col-span-2">
                    <span className="text-slate-400 block text-[11px]">Alamat Asal:</span>
                    <span className="text-slate-900 dark:text-white">{currentSantri.alamatAsal || '-'}, {currentSantri.kotaAsal}, {currentSantri.provinsiAsal}</span>
                  </div>
                </div>
              </div>

              {/* Catatan Tambahan & SPP */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3.5 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-800">
                  <span className="text-slate-400 block text-[11px] mb-1">Catatan Medis & Kesehatan:</span>
                  <div className="flex items-start gap-2 text-slate-800 dark:text-slate-200">
                    <Heart className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                    <p>{currentSantri.catatanKesehatan || 'Tidak ada riwayat alergi atau penyakit kronis.'}</p>
                  </div>
                </div>

                <div className="p-3.5 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-800">
                  <span className="text-slate-400 block text-[11px] mb-1">Catatan Khusus Santri:</span>
                  <div className="text-slate-800 dark:text-slate-200">
                    <p>{currentSantri.catatan || 'Belum ada catatan khusus kesiswaan.'}</p>
                  </div>
                </div>

                <div className="p-3.5 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-800">
                  <span className="text-slate-400 block text-[11px] mb-1">Status Pembayaran SPP:</span>
                  <div className="flex items-center justify-between">
                    <span className="font-semibold capitalize text-sm text-slate-900 dark:text-white">
                      {currentSantri.statusSpp.replace(/_/g, ' ')}
                    </span>
                    <span className="text-[11px] text-slate-400">Kas Pesantren D1</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB: Multi-Lembaga & Keanggotaan */}
          {activeTab === 'keanggotaan' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white">Keanggotaan Multi-Lembaga</h3>
                  <p className="text-slate-500 text-[11px]">
                    Satu santri dapat terdaftar di beberapa lembaga sekaligus dalam satu tahun ajaran (misal: SMP + Madrasah Tahfidz + Diniyah).
                  </p>
                </div>
                {!isViewer && (
                  <button
                    onClick={() => setShowAddKeanggotaan(!showAddKeanggotaan)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold text-xs cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Daftarkan Lembaga Baru</span>
                  </button>
                )}
              </div>

              {/* Form Tambah Keanggotaan */}
              {showAddKeanggotaan && (
                <form onSubmit={handleAddKeanggotaan} className="p-4 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-xl space-y-3 animate-in fade-in">
                  <h4 className="font-bold text-emerald-900 dark:text-emerald-300">Daftarkan Santri ke Lembaga / Program Lain</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-300 mb-1">Tahun Ajaran:</label>
                      <select
                        value={keanggotaanForm.tahunAjaranId}
                        onChange={(e) => setKeanggotaanForm({ ...keanggotaanForm, tahunAjaranId: e.target.value })}
                        className="w-full px-2.5 py-1.5 border rounded-lg bg-white dark:bg-slate-800 text-xs"
                      >
                        {tahunAjarans.map((ta) => (
                          <option key={ta.id} value={ta.id}>
                            {ta.nama} ({ta.semester}) {ta.isActive ? '★ Aktif' : ''}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-300 mb-1">Lembaga:</label>
                      <select
                        value={keanggotaanForm.lembagaId}
                        onChange={(e) => {
                          const lId = e.target.value;
                          const firstClass = kelasList.find((c) => c.lembagaId === lId);
                          setKeanggotaanForm({ 
                            ...keanggotaanForm, 
                            lembagaId: lId,
                            kelasId: firstClass?.id || ''
                          });
                        }}
                        className="w-full px-2.5 py-1.5 border rounded-lg bg-white dark:bg-slate-800 text-xs"
                      >
                        <option value="">-- Pilih Lembaga --</option>
                        {lembagas.map((l) => (
                          <option key={l.id} value={l.id}>{l.nama} ({l.kode})</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-300 mb-1">Kelas:</label>
                      <select
                        value={keanggotaanForm.kelasId}
                        onChange={(e) => setKeanggotaanForm({ ...keanggotaanForm, kelasId: e.target.value })}
                        className="w-full px-2.5 py-1.5 border rounded-lg bg-white dark:bg-slate-800 text-xs"
                      >
                        <option value="">-- Pilih Kelas --</option>
                        {availableClassesForSelectedLembaga.map((c) => (
                          <option key={c.id} value={c.id}>
                            Kelas {c.namaKelas} (Tingkat {c.tingkat}) {c.jurusan ? `- ${c.jurusan}` : ''}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setShowAddKeanggotaan(false)}
                      className="px-3 py-1.5 text-slate-600 dark:text-slate-300 text-xs cursor-pointer"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-xs cursor-pointer"
                    >
                      Simpan Pendaftaran
                    </button>
                  </div>
                </form>
              )}

              {/* List Keanggotaan Multi-Lembaga */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {keanggotaanList.length > 0 ? (
                  keanggotaanList.map((kg) => (
                    <div 
                      key={kg.id}
                      className="p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xs space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 flex items-center justify-center font-bold">
                            <Building2 className="w-3.5 h-3.5" />
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 dark:text-white text-xs">
                              {kg.lembagaNama || 'Lembaga Terdaftar'}
                            </div>
                            <div className="text-[10px] text-slate-400">
                              TA: {kg.tahunAjaranNama || '2026/2027'} ({kg.semester || 'Ganjil'})
                            </div>
                          </div>
                        </div>

                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                          {kg.status}
                        </span>
                      </div>

                      <div className="pt-2 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between text-xs">
                        <span className="text-slate-500">Kelas & Tingkat:</span>
                        <strong className="text-slate-900 dark:text-white font-mono">
                          {kg.kelasNama || `Kelas ${kg.tingkat || '-'}`}
                        </strong>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="sm:col-span-2 p-6 text-center text-slate-400 bg-slate-50 dark:bg-slate-800/30 rounded-xl border border-dashed border-slate-200 dark:border-slate-800">
                    Belum ada data pendaftaran multi-lembaga terstruktur.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB: Riwayat Tahun Ajaran & Kamar */}
          {activeTab === 'riwayat' && (
            <div className="space-y-4">
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white">Riwayat Akademik & Penempatan Kamar</h3>
                <p className="text-slate-500 text-[11px]">
                  Catatan perjalanan kelas, lembaga, dan kamar per tahun ajaran. Data riwayat masa lalu tersimpan aman dan tidak ditimpa.
                </p>
              </div>

              {(!detailData?.riwayatAkademik || detailData.riwayatAkademik.length === 0) ? (
                <div className="p-4 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-xl">
                  <div className="flex items-center gap-2 font-semibold text-slate-800 dark:text-slate-200">
                    <Calendar className="w-4 h-4 text-emerald-600" />
                    <span>Tahun Ajaran Aktif: 2026/2027</span>
                  </div>
                  <div className="mt-2 text-xs text-slate-600 dark:text-slate-400">
                    Santri saat ini berada di jenjang <strong>{currentSantri.jenjang}</strong>, kelas <strong>{currentSantri.kelas}</strong>, menghuni <strong>{currentSantri.asrama}</strong>.
                  </div>
                </div>
              ) : (
                <div className="relative border-l-2 border-emerald-500/30 dark:border-emerald-500/20 ml-4 space-y-6 py-2">
                  {detailData.riwayatAkademik.map((rw, index) => {
                    const pk = detailData.penempatanKamarList?.find((p: any) => p.tahunAjaranId === rw.tahunAjaranId);

                    return (
                      <div key={rw.id || index} className="relative pl-6">
                        <div className="absolute -left-[9px] top-1.5 w-4 h-4 rounded-full bg-emerald-600 border-2 border-white dark:border-slate-900 shadow-xs" />

                        <div className="p-4 bg-white dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700/80 rounded-xl shadow-xs space-y-2">
                          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-700 pb-2">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-slate-900 dark:text-white text-xs">
                                Tahun Ajaran {rw.tahunAjaranNama || '2026/2027'} ({rw.semester || 'Ganjil'})
                              </span>
                              {index === 0 && (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                                  Tahun Aktif
                                </span>
                              )}
                            </div>

                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                              rw.status === 'lulus'
                                ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300'
                                : rw.status === 'naik_kelas'
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                : rw.status === 'tinggal_kelas'
                                ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                                : 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300'
                            }`}>
                              {rw.status === 'naik_kelas' ? 'Naik Kelas' : (rw.status === 'lulus' ? 'Lulus / Khatam' : rw.status)}
                            </span>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                            <div>
                              <span className="text-slate-400 block text-[11px]">Lembaga & Kelas:</span>
                              <div className="font-semibold text-slate-900 dark:text-white">
                                {rw.lembagaNama || rw.jenjang} • {rw.kelas}
                              </div>
                            </div>

                            <div>
                              <span className="text-slate-400 block text-[11px]">Penempatan Asrama & Kamar:</span>
                              <div className="font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                                <span className="truncate">
                                  {pk ? `${pk.asramaNama} - ${pk.kamarNama}` : currentSantri.asrama}
                                </span>
                              </div>
                            </div>
                          </div>

                          {rw.catatan && (
                            <div className="text-[11px] text-slate-500 bg-slate-50 dark:bg-slate-900/50 p-2 rounded-lg border border-slate-100 dark:border-slate-800">
                              Catatan: {rw.catatan}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB: Dokumen Digital (R2) */}
          {activeTab === 'dokumen' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white">Arsip Dokumen Santri (Cloudflare R2)</h3>
                  <p className="text-slate-500 text-[11px]">
                    Unggah dan kelola berkas digital santri seperti KK, Akta Kelahiran, Ijazah, KTP Orang Tua, dll.
                  </p>
                </div>
                {!isViewer && (
                  <button
                    onClick={() => setShowAddDokumen(!showAddDokumen)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold text-xs cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Upload Dokumen Baru</span>
                  </button>
                )}
              </div>

              {/* Form Upload Dokumen */}
              {showAddDokumen && (
                <form onSubmit={handleUploadDokumen} className="p-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl space-y-3 animate-in fade-in">
                  <h4 className="font-bold text-slate-900 dark:text-white">Unggah Berkas Baru ke Cloudflare R2</h4>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-300 mb-1">Jenis Dokumen:</label>
                      <select
                        value={dokumenForm.jenis}
                        onChange={(e) => setDokumenForm({ ...dokumenForm, jenis: e.target.value })}
                        className="w-full px-2.5 py-1.5 border rounded-lg bg-white dark:bg-slate-900 text-xs"
                      >
                        <option value="Kartu Keluarga (KK)">Kartu Keluarga (KK)</option>
                        <option value="Akta Kelahiran">Akta Kelahiran</option>
                        <option value="Ijazah Terakhir">Ijazah Terakhir</option>
                        <option value="KTP Orang Tua / Wali">KTP Orang Tua / Wali</option>
                        <option value="Surat Keterangan Sehat">Surat Keterangan Sehat</option>
                        <option value="Piagam Penghargaan / Sertifikat">Piagam Penghargaan / Sertifikat</option>
                        <option value="Lainnya">Lainnya</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-300 mb-1">Nama / Label Dokumen:</label>
                      <input
                        type="text"
                        placeholder="Contoh: KK Keluarga Santri 2026.pdf"
                        value={dokumenForm.namaFile}
                        onChange={(e) => setDokumenForm({ ...dokumenForm, namaFile: e.target.value })}
                        className="w-full px-2.5 py-1.5 border rounded-lg bg-white dark:bg-slate-900 text-xs"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-300 mb-1">Pilih File (PDF / Gambar / Dokumen):</label>
                    <input
                      ref={docFileInputRef}
                      type="file"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setSelectedDocFile(file);
                          if (!dokumenForm.namaFile) {
                            setDokumenForm((prev) => ({ ...prev, namaFile: file.name }));
                          }
                        }
                      }}
                      className="w-full px-2.5 py-1.5 border rounded-lg bg-white dark:bg-slate-900 text-xs file:mr-3 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100"
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setShowAddDokumen(false)}
                      className="px-3 py-1.5 text-slate-600 dark:text-slate-300 text-xs cursor-pointer"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      disabled={uploadingDokumen || !selectedDocFile}
                      className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-lg text-xs font-semibold shadow-xs flex items-center gap-1.5 cursor-pointer"
                    >
                      {uploadingDokumen ? 'Mengunggah ke R2...' : 'Upload Dokumen'}
                    </button>
                  </div>
                </form>
              )}

              {/* Dokumen Cards List */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {dokumenList.length > 0 ? (
                  dokumenList.map((doc) => (
                    <div 
                      key={doc.id}
                      className="p-3.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xs flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3 overflow-hidden">
                        <div className="w-9 h-9 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                          <FileText className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <span className="font-semibold text-slate-900 dark:text-white block truncate text-xs">
                            {doc.namaFile}
                          </span>
                          <div className="flex items-center gap-2 text-[10px] text-slate-400">
                            <span className="font-medium text-emerald-600">{doc.jenis}</span>
                            <span>•</span>
                            <span>{doc.ukuran ? `${Math.round(doc.ukuran / 1024)} KB` : 'Berkas'}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0 ml-2">
                        {doc.fileUrl && (
                          <a
                            href={doc.fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 text-slate-500 hover:text-emerald-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700"
                            title="Unduh / Lihat Dokumen"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </a>
                        )}
                        {!isViewer && (
                          <button
                            onClick={() => handleDeleteDokumen(doc.id, doc.namaFile)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer"
                            title="Hapus Dokumen"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="sm:col-span-2 p-8 text-center text-slate-400 bg-slate-50 dark:bg-slate-800/30 rounded-xl border border-dashed border-slate-200 dark:border-slate-800">
                    <File className="w-8 h-8 mx-auto mb-2 text-slate-300 dark:text-slate-600" />
                    Belum ada dokumen yang diunggah untuk santri ini.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: Riwayat Tahfidz */}
          {activeTab === 'tahfidz' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white">Rekap Setoran Hafalan Qur'an</h3>
                  <p className="text-slate-500">Target: {currentSantri.targetJuzHafalan} Juz · Capaian Sekarang: {currentSantri.capaianJuzHafalan} Juz</p>
                </div>
                {!isViewer && (
                  <button
                    onClick={() => setShowAddTahfidz(!showAddTahfidz)}
                    className="flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold text-xs cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Setoran Baru</span>
                  </button>
                )}
              </div>

              {/* Form Tambah Setoran */}
              {showAddTahfidz && (
                <form onSubmit={handleAddTahfidz} className="p-4 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-xl space-y-3 animate-in fade-in">
                  <h4 className="font-bold text-emerald-900 dark:text-emerald-300">Catat Setoran Hafalan Santri</h4>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <div>
                      <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-300">Juz:</label>
                      <input
                        type="number"
                        min="1"
                        max="30"
                        value={tahfidzForm.juz}
                        onChange={(e) => setTahfidzForm({ ...tahfidzForm, juz: Number(e.target.value) })}
                        className="w-full px-2 py-1.5 border rounded-lg bg-white dark:bg-slate-800 text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-300">Surat:</label>
                      <input
                        type="text"
                        value={tahfidzForm.surat}
                        onChange={(e) => setTahfidzForm({ ...tahfidzForm, surat: e.target.value })}
                        className="w-full px-2 py-1.5 border rounded-lg bg-white dark:bg-slate-800 text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-300">Ayat:</label>
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          placeholder="Mulai"
                          value={tahfidzForm.ayatMulai}
                          onChange={(e) => setTahfidzForm({ ...tahfidzForm, ayatMulai: Number(e.target.value) })}
                          className="w-1/2 px-2 py-1.5 border rounded-lg bg-white dark:bg-slate-800 text-xs"
                        />
                        <input
                          type="number"
                          placeholder="Sampai"
                          value={tahfidzForm.ayatSelesai}
                          onChange={(e) => setTahfidzForm({ ...tahfidzForm, ayatSelesai: Number(e.target.value) })}
                          className="w-1/2 px-2 py-1.5 border rounded-lg bg-white dark:bg-slate-800 text-xs"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-300">Predikat:</label>
                      <select
                        value={tahfidzForm.predikat}
                        onChange={(e) => setTahfidzForm({ ...tahfidzForm, predikat: e.target.value })}
                        className="w-full px-2 py-1.5 border rounded-lg bg-white dark:bg-slate-800 text-xs"
                      >
                        <option value="Mumtaz">Mumtaz (Sangat Baik)</option>
                        <option value="Jayyid Jiddan">Jayyid Jiddan (Baik Sekali)</option>
                        <option value="Jayyid">Jayyid (Baik)</option>
                        <option value="Maqbul">Maqbul (Cukup)</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-300">Catatan Tajwid / Makhraj:</label>
                    <input
                      type="text"
                      placeholder="Contoh: Makharijul huruf fasih, panjang pendek mad tepat."
                      value={tahfidzForm.catatan}
                      onChange={(e) => setTahfidzForm({ ...tahfidzForm, catatan: e.target.value })}
                      className="w-full px-2.5 py-1.5 border rounded-lg bg-white dark:bg-slate-800 text-xs"
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setShowAddTahfidz(false)}
                      className="px-3 py-1 text-slate-600 text-xs cursor-pointer"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      className="px-3 py-1 bg-emerald-600 text-white rounded-lg text-xs font-semibold cursor-pointer"
                    >
                      Simpan Setoran
                    </button>
                  </div>
                </form>
              )}

              {/* List Riwayat */}
              <div className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
                {detailData?.tahfidz && detailData.tahfidz.length > 0 ? (
                  detailData.tahfidz.map((t) => (
                    <div key={t.id} className="p-3 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-emerald-600">Juz {t.juz}</span>
                          <span className="text-slate-400">·</span>
                          <span className="font-semibold text-slate-900 dark:text-white">
                            Surat {t.surat} (Ayat {t.ayatMulai}-{t.ayatSelesai})
                          </span>
                        </div>
                        <p className="text-slate-500 text-[11px] mt-0.5">{t.catatan || 'Tidak ada catatan'}</p>
                      </div>
                      <div className="text-right">
                        <span className="font-semibold text-emerald-700 dark:text-emerald-400 block">{t.predikat}</span>
                        <span className="text-[10px] text-slate-400">{t.tanggal}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-6 text-center text-slate-400">Belum ada riwayat setoran tahfidz untuk santri ini.</div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: Perizinan & Pulang */}
          {activeTab === 'perizinan' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white">Riwayat Izin Pulang Santri</h3>
                  <p className="text-slate-500">Status saat ini: <strong className="capitalize">{currentSantri.status.replace('_', ' ')}</strong></p>
                </div>
                <button
                  onClick={() => setShowAddIzin(!showAddIzin)}
                  className="flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold text-xs cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Buat Surat Izin</span>
                </button>
              </div>

              {/* Form Buat Izin */}
              {showAddIzin && (
                <form onSubmit={handleAddIzin} className="p-4 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl space-y-3 animate-in fade-in">
                  <h4 className="font-bold text-amber-900 dark:text-amber-300">Surat Izin Pulang / Keluar Pondok</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <div>
                      <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-300">Keperluan / Jenis:</label>
                      <select
                        value={izinForm.jenis}
                        onChange={(e) => setIzinForm({ ...izinForm, jenis: e.target.value })}
                        className="w-full px-2 py-1.5 border rounded-lg bg-white dark:bg-slate-800 text-xs"
                      >
                        <option value="pulang_keluarga">Keperluan Keluarga / Acara</option>
                        <option value="berobat">Berobat / Sakit</option>
                        <option value="lomba">Mewakili Lomba / Event</option>
                        <option value="keperluan_mendesak">Keperluan Mendesak</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-300">Mulai Izin:</label>
                      <input
                        type="date"
                        value={izinForm.tanggalMulai}
                        onChange={(e) => setIzinForm({ ...izinForm, tanggalMulai: e.target.value })}
                        className="w-full px-2 py-1.5 border rounded-lg bg-white dark:bg-slate-800 text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-300">Wajib Kembali:</label>
                      <input
                        type="date"
                        value={izinForm.tanggalKembali}
                        onChange={(e) => setIzinForm({ ...izinForm, tanggalKembali: e.target.value })}
                        className="w-full px-2 py-1.5 border rounded-lg bg-white dark:bg-slate-800 text-xs"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-300">Penjemput / Wali:</label>
                      <input
                        type="text"
                        value={izinForm.penjemput}
                        onChange={(e) => setIzinForm({ ...izinForm, penjemput: e.target.value })}
                        className="w-full px-2 py-1.5 border rounded-lg bg-white dark:bg-slate-800 text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-300">No. HP Penjemput:</label>
                      <input
                        type="text"
                        value={izinForm.noHpPenjemput}
                        onChange={(e) => setIzinForm({ ...izinForm, noHpPenjemput: e.target.value })}
                        className="w-full px-2 py-1.5 border rounded-lg bg-white dark:bg-slate-800 text-xs"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-300">Alasan & Catatan:</label>
                    <input
                      type="text"
                      placeholder="Contoh: Menghadiri pernikahan kakak kandung di Sidoarjo."
                      value={izinForm.catatan}
                      onChange={(e) => setIzinForm({ ...izinForm, catatan: e.target.value })}
                      className="w-full px-2.5 py-1.5 border rounded-lg bg-white dark:bg-slate-800 text-xs"
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setShowAddIzin(false)}
                      className="px-3 py-1 text-slate-600 text-xs cursor-pointer"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      className="px-3 py-1 bg-amber-600 text-white rounded-lg text-xs font-semibold cursor-pointer"
                    >
                      Terbitkan Surat Izin
                    </button>
                  </div>
                </form>
              )}

              {/* List Izin */}
              <div className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
                {detailData?.perizinan && detailData.perizinan.length > 0 ? (
                  detailData.perizinan.map((iz) => (
                    <div key={iz.id} className="p-3 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-slate-900 dark:text-white capitalize">
                            {iz.jenis.replace(/_/g, ' ')}
                          </span>
                          <span className="text-slate-400">·</span>
                          <span className="text-slate-500 font-mono text-[11px]">
                            {iz.tanggalMulai} s/d {iz.tanggalKembali}
                          </span>
                        </div>
                        <p className="text-slate-500 text-[11px] mt-0.5">Penjemput: {iz.penjemput || '-'} ({iz.noHpPenjemput || '-'}) · {iz.catatan}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {iz.status === 'disetujui' && (
                          <button
                            onClick={() => handleSelesaiIzin(iz.id)}
                            className="px-2.5 py-1 bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-semibold rounded-md hover:bg-emerald-200 text-[11px] cursor-pointer"
                          >
                            Konfirmasi Kembali ke Pondok
                          </button>
                        )}
                        <span className={`text-[11px] font-semibold ${iz.status === 'selesai' ? 'text-slate-400' : 'text-amber-600'}`}>
                          {iz.status === 'selesai' ? 'Sudah Kembali' : 'Sedang Izin'}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-6 text-center text-slate-400">Belum ada catatan perizinan untuk santri ini.</div>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: Kedisiplinan & Pelanggaran */}
          {activeTab === 'pelanggaran' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white">Poin Kedisiplinan Santri</h3>
                  <p className="text-slate-500">Total Akumulasi Poin: <strong className="text-rose-600 font-mono">{currentSantri.poinPelanggaran} Poin</strong></p>
                </div>
                <button
                  onClick={() => setShowAddPelanggaran(!showAddPelanggaran)}
                  className="flex items-center gap-1 px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-semibold text-xs cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Catat Pelanggaran</span>
                </button>
              </div>

              {/* Form Pelanggaran */}
              {showAddPelanggaran && (
                <form onSubmit={handleAddPelanggaran} className="p-4 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 rounded-xl space-y-3 animate-in fade-in">
                  <h4 className="font-bold text-rose-900 dark:text-rose-300">Catat Pelanggaran Tata Tertib</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-300">Tingkat / Kategori:</label>
                      <select
                        value={pelanggaranForm.kategori}
                        onChange={(e) => setPelanggaranForm({ ...pelanggaranForm, kategori: e.target.value, poin: e.target.value === 'berat' ? 25 : e.target.value === 'sedang' ? 15 : 5 })}
                        className="w-full px-2 py-1.5 border rounded-lg bg-white dark:bg-slate-800 text-xs"
                      >
                        <option value="ringan">Ringan (5 Poin - contoh: terlambat sholat berjamaah)</option>
                        <option value="sedang">Sedang (15 Poin - contoh: keluar tanpa izin musyrif)</option>
                        <option value="berat">Berat (25 Poin - contoh: membawa gadget tanpa izin)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-300">Poin Pelanggaran:</label>
                      <input
                        type="number"
                        value={pelanggaranForm.poin}
                        onChange={(e) => setPelanggaranForm({ ...pelanggaranForm, poin: Number(e.target.value) })}
                        className="w-full px-2 py-1.5 border rounded-lg bg-white dark:bg-slate-800 text-xs"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-300">Deskripsi Pelanggaran:</label>
                    <input
                      type="text"
                      placeholder="Contoh: Terlambat bangun tahajud dan sholat Shubuh 3 kali berturut-turut."
                      value={pelanggaranForm.deskripsi}
                      onChange={(e) => setPelanggaranForm({ ...pelanggaranForm, deskripsi: e.target.value })}
                      className="w-full px-2.5 py-1.5 border rounded-lg bg-white dark:bg-slate-800 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-300">Tindakan / Sanksi Edukatif:</label>
                    <input
                      type="text"
                      placeholder="Contoh: Menghafal 1 surat pilihan atau takzir kebersihan asrama."
                      value={pelanggaranForm.sanksi}
                      onChange={(e) => setPelanggaranForm({ ...pelanggaranForm, sanksi: e.target.value })}
                      className="w-full px-2.5 py-1.5 border rounded-lg bg-white dark:bg-slate-800 text-xs"
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setShowAddPelanggaran(false)}
                      className="px-3 py-1 text-slate-600 text-xs cursor-pointer"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      className="px-3 py-1 bg-rose-600 text-white rounded-lg text-xs font-semibold cursor-pointer"
                    >
                      Simpan Catatan
                    </button>
                  </div>
                </form>
              )}

              {/* List Pelanggaran */}
              <div className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
                {detailData?.pelanggaran && detailData.pelanggaran.length > 0 ? (
                  detailData.pelanggaran.map((pl) => (
                    <div key={pl.id} className="p-3 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-rose-700 dark:text-rose-400 capitalize">
                            {pl.kategori} (+{pl.poin} Poin)
                          </span>
                          <span className="text-slate-400">·</span>
                          <span className="text-slate-900 dark:text-white font-medium">{pl.deskripsi}</span>
                        </div>
                        <p className="text-slate-500 text-[11px] mt-0.5">Sanksi: {pl.sanksi || '-'}</p>
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono">{pl.tanggal}</span>
                    </div>
                  ))
                ) : (
                  <div className="p-6 text-center text-slate-400">Tidak ada riwayat pelanggaran tata tertib (Disiplin).</div>
                )}
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex items-center justify-between">
          <div className="text-[11px] text-slate-400">
            Disinkronkan dengan Cloudflare D1 & R2
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 font-semibold text-xs rounded-lg transition-colors cursor-pointer"
          >
            Tutup
          </button>
        </div>

      </div>
    </div>
  );
};
