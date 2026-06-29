import { useState, useEffect, useCallback } from 'react';
import { format, parseISO, isValid } from 'date-fns';
import {
  LogOut, CheckCircle2, XCircle, Clock, Search,
  Calendar, FileText, Briefcase, ChevronLeft, ChevronRight,
  RotateCcw, AlertCircle, RefreshCw
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Cuti {
  no_pengajuan: string | null;
  tanggal: string | null;
  tanggal_awal: string | null;
  tanggal_akhir: string | null;
  nik: string | null;
  nama_pegawai: string | null;
  departemen: string | null;
  urgensi: string | null;
  alamat: string | null;
  jumlah: number | null;
  kepentingan: string | null;
  nik_pj: string | null;
  status: string | null;
}

interface DashboardProps {
  token: string;
  onLogout: () => void;
}

interface Toast {
  id: number;
  type: 'success' | 'error';
  message: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Status dari DB: 'Proses Pengajuan', 'Disetujui', 'Ditolak'
 * isPending menangkap semua variasi penulisan status pending
 */
const isPending = (status: string | null | undefined): boolean => {
  if (status == null || status.trim() === '') return true;
  const s = status.toLowerCase().trim();
  return s === 'proses pengajuan'
    || s === 'menunggu'
    || s === 'pending'
    || s === 'diajukan'
    || s === 'proses';
};

const safeDate = (val: string | null | undefined): Date | null => {
  if (!val) return null;
  const d = parseISO(val);
  return isValid(d) ? d : null;
};

const fmtDate = (val: string | null | undefined, fmt = 'dd MMM yyyy') => {
  const d = safeDate(val);
  return d ? format(d, fmt) : '—';
};

// ─── Toast Component ──────────────────────────────────────────────────────────

function ToastContainer({ toasts, onDismiss }: { toasts: Toast[]; onDismiss: (id: number) => void }) {
  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
      <AnimatePresence>
        {toasts.map((t) => (
          <motion.div
            key={t.id}
            initial={{ opacity: 0, x: 80 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 80 }}
            transition={{ duration: 0.25 }}
            className={`pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg border text-sm font-medium min-w-[260px] max-w-xs ${t.type === 'success'
                ? 'bg-green-50 border-green-200 text-green-800'
                : 'bg-red-50 border-red-200 text-red-800'
              }`}
          >
            {t.type === 'success'
              ? <CheckCircle2 className="w-4 h-4 shrink-0 text-green-600" />
              : <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />}
            <span className="flex-1">{t.message}</span>
            <button onClick={() => onDismiss(t.id)} className="ml-2 opacity-50 hover:opacity-100">✕</button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

// ─── Status Badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string | null }) {
  if (status === 'Disetujui')
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-green-50 text-green-700 border border-green-200 whitespace-nowrap">
        <CheckCircle2 className="w-3.5 h-3.5" /> Disetujui
      </span>
    );
  if (status === 'Ditolak')
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-red-50 text-red-700 border border-red-200 whitespace-nowrap">
        <XCircle className="w-3.5 h-3.5" /> Ditolak
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200 whitespace-nowrap">
      <Clock className="w-3.5 h-3.5" /> Proses Pengajuan
    </span>
  );
}

// ─── Cuti Card ────────────────────────────────────────────────────────────────

interface CutiCardProps {
  item: Cuti;
  actionLoading: string | null;
  onUpdate: (no: string, status: 'Disetujui' | 'Ditolak' | 'Proses Pengajuan') => Promise<void>;
}

function CutiCard({ item, actionLoading, onUpdate }: CutiCardProps) {
  const pending = isPending(item.status);
  // Pastikan no_pengajuan ada sebelum dipakai — jika null/undefined, semua aksi dinonaktifkan
  const noPengajuan = item.no_pengajuan ?? '';
  const isLoading = noPengajuan !== '' && actionLoading === noPengajuan;
  const noId = noPengajuan === '';

  const handleUpdate = (status: 'Disetujui' | 'Ditolak' | 'Proses Pengajuan') => {
    if (noId) return;
    onUpdate(noPengajuan, status);
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow flex flex-col h-full"
    >
      {/* Card body */}
      <div className="p-6 flex-grow">
        {/* Header row */}
        <div className="flex justify-between items-start gap-3 mb-5">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-11 h-11 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-base shrink-0 uppercase">
              {item.nama_pegawai?.charAt(0) ?? '?'}
            </div>
            <div className="min-w-0">
              <h3 className="font-semibold text-base text-gray-900 leading-tight truncate">
                {item.nama_pegawai ?? <span className="italic text-gray-400">Nama tidak ditemukan</span>}
              </h3>
              <div className="flex items-center text-xs text-gray-500 gap-1 mt-0.5">
                <Briefcase className="w-3 h-3 shrink-0" />
                <span className="truncate">{item.departemen ?? '—'}</span>
                <span className="text-gray-300">·</span>
                <span>{item.nik ?? '—'}</span>
              </div>
            </div>
          </div>
          <StatusBadge status={item.status} />
        </div>

        <div className="space-y-3 text-sm">
          {/* Periode */}
          <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
            <div className="flex items-center gap-1.5 text-gray-600 font-medium mb-1 text-xs uppercase tracking-wider">
              <Calendar className="w-3.5 h-3.5" />
              Periode Cuti
            </div>
            <p className="text-gray-900 font-medium">
              {fmtDate(item.tanggal_awal)} – {fmtDate(item.tanggal_akhir)}
              {item.jumlah != null && (
                <span className="ml-2 px-2 py-0.5 bg-white border border-gray-200 rounded text-xs font-semibold text-gray-600">
                  {item.jumlah} Hari
                </span>
              )}
            </p>
          </div>

          {/* Tipe & Kepentingan */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-gray-400 text-xs uppercase tracking-wider font-medium mb-0.5">Tipe</p>
              <p className="text-gray-800 font-medium">{item.urgensi ?? '—'}</p>
            </div>
            <div>
              <p className="text-gray-400 text-xs uppercase tracking-wider font-medium mb-0.5">Kepentingan</p>
              <p className="text-gray-800 line-clamp-2" title={item.kepentingan ?? ''}>{item.kepentingan ?? '—'}</p>
            </div>
          </div>

          {/* ID & Tanggal Pengajuan */}
          <div className="flex items-center gap-2 text-xs text-gray-400 pt-1">
            <FileText className="w-3.5 h-3.5 shrink-0" />
            <span className="font-mono">{noPengajuan || <span className="italic">ID tidak tersedia</span>}</span>
            <span>·</span>
            <span>Dibuat: {fmtDate(item.tanggal, 'dd/MM/yyyy')}</span>
          </div>
        </div>
      </div>

      {/* Action footer */}
      <div className="px-4 py-3 bg-gray-50 border-t border-gray-100">
        {noId ? (
          <p className="text-xs text-center text-gray-400 italic">ID pengajuan tidak valid</p>
        ) : pending ? (
          /* Status: Proses Pengajuan — tampilkan Setujui & Tolak */
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => handleUpdate('Disetujui')}
              disabled={isLoading}
              className="flex items-center justify-center gap-1.5 bg-white border border-green-200 text-green-700 hover:bg-green-50 font-medium py-2 px-3 rounded-lg transition-colors disabled:opacity-50 text-sm"
            >
              {isLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
              Setujui
            </button>
            <button
              onClick={() => handleUpdate('Ditolak')}
              disabled={isLoading}
              className="flex items-center justify-center gap-1.5 bg-white border border-red-200 text-red-700 hover:bg-red-50 font-medium py-2 px-3 rounded-lg transition-colors disabled:opacity-50 text-sm"
            >
              {isLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
              Tolak
            </button>
          </div>
        ) : (
          /* Status: Disetujui / Ditolak — tampilkan kedua tombol + reset */
          <div className="space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => handleUpdate('Disetujui')}
                disabled={isLoading || item.status === 'Disetujui'}
                className={`flex items-center justify-center gap-1.5 font-medium py-2 px-3 rounded-lg transition-colors text-sm border ${item.status === 'Disetujui'
                    ? 'bg-green-50 border-green-300 text-green-700 cursor-default opacity-70'
                    : 'bg-white border-green-200 text-green-700 hover:bg-green-50 disabled:opacity-50'
                  }`}
              >
                {isLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                {item.status === 'Disetujui' ? 'Disetujui ✓' : 'Setujui'}
              </button>
              <button
                onClick={() => handleUpdate('Ditolak')}
                disabled={isLoading || item.status === 'Ditolak'}
                className={`flex items-center justify-center gap-1.5 font-medium py-2 px-3 rounded-lg transition-colors text-sm border ${item.status === 'Ditolak'
                    ? 'bg-red-50 border-red-300 text-red-700 cursor-default opacity-70'
                    : 'bg-white border-red-200 text-red-700 hover:bg-red-50 disabled:opacity-50'
                  }`}
              >
                {isLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
                {item.status === 'Ditolak' ? 'Ditolak ✓' : 'Tolak'}
              </button>
            </div>
            <button
              onClick={() => handleUpdate('Proses Pengajuan')}
              disabled={isLoading}
              className="flex items-center justify-center gap-1 text-xs text-gray-400 hover:text-gray-700 hover:bg-gray-100 w-full py-1.5 rounded-lg transition-colors disabled:opacity-50 border border-transparent hover:border-gray-200"
            >
              {isLoading ? <RefreshCw className="w-3 h-3 animate-spin" /> : <RotateCcw className="w-3 h-3" />}
              Reset ke Proses Pengajuan
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? '';

export default function Dashboard({ token, onLogout }: DashboardProps) {
  const [data, setData] = useState<Cuti[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('Semua');
  const [currentPage, setCurrentPage] = useState(1);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const itemsPerPage = 6;

  const addToast = (type: Toast['type'], message: string) => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4000);
  };

  const fetchCuti = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_BASE}/api/cuti`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const result = await res.json();
      if (res.ok && result.success) {
        setData(result.data ?? []);
      } else {
        if (res.status === 401 || res.status === 403) onLogout();
        setError(result.message || 'Gagal mengambil data.');
      }
    } catch {
      setError('Terjadi kesalahan jaringan.');
    } finally {
      setLoading(false);
    }
  }, [token, onLogout]);

  useEffect(() => { fetchCuti(); }, [fetchCuti]);

  const handleStatusUpdate = async (
    no_pengajuan: string,
    status: 'Disetujui' | 'Ditolak' | 'Proses Pengajuan'
  ) => {
    if (!no_pengajuan) return;
    setActionLoading(no_pengajuan);
    try {
      const res = await fetch(`${API_BASE}/api/cuti/${encodeURIComponent(no_pengajuan)}/status`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
      });
      const result = await res.json();
      if (res.ok && result.success) {
        setData((prev) =>
          prev.map((item) =>
            item.no_pengajuan === no_pengajuan ? { ...item, status } : item
          )
        );
        addToast('success', result.message || `Status berhasil diubah menjadi ${status}.`);
      } else {
        addToast('error', result.message || 'Gagal memperbarui status.');
      }
    } catch {
      addToast('error', 'Terjadi kesalahan saat memproses permintaan.');
    } finally {
      setActionLoading(null);
    }
  };

  // ── Filter & Pagination ────────────────────────────────────────────────────

  const filteredData = data.filter((item, index) => {
    const matchStatus =
      statusFilter === 'Semua' ||
      (statusFilter === 'Menunggu' && isPending(item.status)) ||
      (statusFilter === 'Disetujui' && item.status === 'Disetujui') ||
      (statusFilter === 'Ditolak' && item.status === 'Ditolak');

    const q = searchTerm.toLowerCase();
    const matchSearch =
      !q ||
      (item.nama_pegawai ?? '').toLowerCase().includes(q) ||
      (item.no_pengajuan ?? '').toLowerCase().includes(q) ||
      (item.departemen ?? '').toLowerCase().includes(q) ||
      (item.nik ?? '').includes(q);

    return matchStatus && matchSearch;
  });

  const totalPages = Math.ceil(filteredData.length / itemsPerPage) || 1;
  const paginatedData = filteredData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  useEffect(() => { setCurrentPage(1); }, [searchTerm, statusFilter]);

  // ── Summary counts ─────────────────────────────────────────────────────────
  const counts = {
    menunggu: data.filter((d) => isPending(d.status)).length,
    disetujui: data.filter((d) => d.status === 'Disetujui').length,
    ditolak: data.filter((d) => d.status === 'Ditolak').length,
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans">
      <ToastContainer toasts={toasts} onDismiss={(id) => setToasts((p) => p.filter((t) => t.id !== id))} />

      {/* Navigation */}
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 bg-blue-600 rounded-lg flex items-center justify-center shadow-sm">
                <FileText className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-lg font-bold text-blue-700">Approval Cuti</h1>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={fetchCuti}
                className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                title="Refresh data"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
              <button
                onClick={onLogout}
                className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Keluar</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Summary cards */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { label: 'Menunggu', count: counts.menunggu, color: 'amber', icon: Clock },
            { label: 'Disetujui', count: counts.disetujui, color: 'green', icon: CheckCircle2 },
            { label: 'Ditolak', count: counts.ditolak, color: 'red', icon: XCircle },
          ].map(({ label, count, color, icon: Icon }) => (
            <button
              key={label}
              onClick={() => setStatusFilter(statusFilter === label ? 'Semua' : label)}
              className={`p-4 rounded-2xl border text-left transition-all ${statusFilter === label
                  ? `bg-${color}-50 border-${color}-200 shadow-sm`
                  : 'bg-white border-gray-100 hover:border-gray-200 hover:shadow-sm'
                }`}
            >
              <Icon className={`w-5 h-5 mb-2 text-${color}-500`} />
              <p className="text-2xl font-bold text-gray-900">{count}</p>
              <p className="text-xs text-gray-500 mt-0.5">{label}</p>
            </button>
          ))}
        </div>

        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <div className="flex bg-gray-100 p-1 rounded-lg self-start overflow-x-auto">
            {['Semua', 'Menunggu', 'Disetujui', 'Ditolak'].map((tab) => (
              <button
                key={tab}
                onClick={() => setStatusFilter(tab)}
                className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors whitespace-nowrap ${statusFilter === tab
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                  }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Cari nama, NIK, departemen..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full sm:w-72 pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
            />
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="flex items-center gap-3 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-6 text-sm">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {error}
            <button onClick={fetchCuti} className="ml-auto underline font-medium">Coba lagi</button>
          </div>
        )}

        {/* Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm animate-pulse h-64">
                <div className="flex gap-4 items-start">
                  <div className="w-11 h-11 bg-gray-200 rounded-full shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-3/4" />
                    <div className="h-3 bg-gray-100 rounded w-1/2" />
                  </div>
                </div>
                <div className="mt-6 space-y-3">
                  <div className="h-3 bg-gray-100 rounded w-full" />
                  <div className="h-3 bg-gray-100 rounded w-5/6" />
                  <div className="h-3 bg-gray-100 rounded w-4/6" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              <AnimatePresence>
                {paginatedData.length > 0 ? (
                  paginatedData.map((item, idx) => (
                    <CutiCard
                      key={item.no_pengajuan ? item.no_pengajuan : `row-${idx}`}
                      item={item}
                      actionLoading={actionLoading}
                      onUpdate={handleStatusUpdate}
                    />
                  ))
                ) : (
                  <div className="col-span-full py-16 text-center">
                    <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-gray-100 mb-4">
                      <Search className="w-7 h-7 text-gray-400" />
                    </div>
                    <h3 className="text-base font-medium text-gray-900">Tidak ada data ditemukan</h3>
                    <p className="text-sm text-gray-500 mt-1">Coba sesuaikan kata kunci atau filter status.</p>
                  </div>
                )}
              </AnimatePresence>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-gray-200 pt-6">
                <p className="text-sm text-gray-500">
                  Menampilkan{' '}
                  <span className="font-medium">{(currentPage - 1) * itemsPerPage + 1}</span>–
                  <span className="font-medium">{Math.min(currentPage * itemsPerPage, filteredData.length)}</span>{' '}
                  dari <span className="font-medium">{filteredData.length}</span> data
                </p>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4 text-gray-600" />
                  </button>
                  {(() => {
                    const pages: (number | 'ellipsis-start' | 'ellipsis-end')[] = [];
                    if (totalPages <= 7) {
                      for (let i = 1; i <= totalPages; i++) pages.push(i);
                    } else {
                      pages.push(1);
                      if (currentPage > 4) pages.push('ellipsis-start');
                      const start = Math.max(2, currentPage - 1);
                      const end = Math.min(totalPages - 1, currentPage + 1);
                      for (let i = start; i <= end; i++) pages.push(i);
                      if (currentPage < totalPages - 3) pages.push('ellipsis-end');
                      pages.push(totalPages);
                    }
                    return pages.map((page, idx) =>
                      page === 'ellipsis-start' || page === 'ellipsis-end' ? (
                        <span key={`ellipsis-${idx}`} className="w-9 h-9 flex items-center justify-center text-gray-400 text-sm select-none">…</span>
                      ) : (
                        <button
                          key={`page-${page}`}
                          onClick={() => setCurrentPage(page)}
                          className={`w-9 h-9 rounded-lg text-sm font-medium transition-colors ${currentPage === page
                              ? 'bg-blue-600 text-white'
                              : 'text-gray-600 hover:bg-gray-100'
                            }`}
                        >
                          {page}
                        </button>
                      )
                    );
                  })()}
                  <button
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronRight className="w-4 h-4 text-gray-600" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}