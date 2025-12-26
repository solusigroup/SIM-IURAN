import { useState, useEffect } from 'react';
import { pembayaranApi, wargaApi } from '../../api';
import Modal from '../../components/Modal';
import Badge from '../../components/Badge';

export default function PembayaranManagement() {
    const [pembayaranList, setPembayaranList] = useState([]);
    const [pendingList, setPendingList] = useState([]);
    const [wargaList, setWargaList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('semua');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formData, setFormData] = useState({
        warga_id: '',
        jumlah_bayar: '',
        metode_bayar: 'tunai',
        keterangan: ''
    });

    const currentDate = new Date();
    const [bulan, setBulan] = useState(currentDate.getMonth() + 1);
    const [tahun, setTahun] = useState(currentDate.getFullYear());

    useEffect(() => {
        fetchData();
    }, [bulan, tahun]);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [laporan, pending, warga] = await Promise.all([
                pembayaranApi.getLaporan(bulan, tahun),
                pembayaranApi.getPending(),
                wargaApi.getAll()
            ]);
            setPembayaranList(laporan.data?.transaksi || []);
            setPendingList(pending.data || []);
            setWargaList(warga.data || []);
        } catch (err) {
            console.error('Gagal memuat data:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await pembayaranApi.create({
                ...formData,
                jumlah_bayar: parseFloat(formData.jumlah_bayar)
            });
            fetchData();
            setIsModalOpen(false);
            setFormData({
                warga_id: '',
                jumlah_bayar: '',
                metode_bayar: 'tunai',
                keterangan: ''
            });
        } catch (err) {
            alert('Gagal menyimpan pembayaran: ' + (err.message || err));
        }
    };

    const handleVerify = async (id) => {
        if (!confirm('Verifikasi pembayaran ini?')) return;
        try {
            await pembayaranApi.verify(id);
            fetchData();
        } catch (err) {
            alert('Gagal verifikasi: ' + (err.message || err));
        }
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0
        }).format(amount || 0);
    };

    const formatDate = (dateStr) => {
        return new Date(dateStr).toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });
    };

    const months = [
        { value: 1, label: 'Januari' },
        { value: 2, label: 'Februari' },
        { value: 3, label: 'Maret' },
        { value: 4, label: 'April' },
        { value: 5, label: 'Mei' },
        { value: 6, label: 'Juni' },
        { value: 7, label: 'Juli' },
        { value: 8, label: 'Agustus' },
        { value: 9, label: 'September' },
        { value: 10, label: 'Oktober' },
        { value: 11, label: 'November' },
        { value: 12, label: 'Desember' },
    ];

    const displayList = activeTab === 'pending' ? pendingList : pembayaranList;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Kelola Pembayaran</h1>
                    <p className="text-gray-500">Input dan verifikasi pembayaran warga</p>
                </div>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="btn-primary flex items-center gap-2"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Input Pembayaran
                </button>
            </div>

            {/* Tabs & Filter */}
            <div className="card">
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="flex border-b border-gray-200">
                        <button
                            onClick={() => setActiveTab('semua')}
                            className={`px-4 py-2 font-medium text-sm border-b-2 -mb-px ${activeTab === 'semua'
                                    ? 'border-blue-600 text-blue-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            Semua
                        </button>
                        <button
                            onClick={() => setActiveTab('pending')}
                            className={`px-4 py-2 font-medium text-sm border-b-2 -mb-px flex items-center gap-2 ${activeTab === 'pending'
                                    ? 'border-blue-600 text-blue-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            Pending Verifikasi
                            {pendingList.length > 0 && (
                                <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                                    {pendingList.length}
                                </span>
                            )}
                        </button>
                    </div>

                    {activeTab === 'semua' && (
                        <div className="flex items-center gap-2">
                            <select
                                value={bulan}
                                onChange={(e) => setBulan(parseInt(e.target.value))}
                                className="input-field w-auto text-sm"
                            >
                                {months.map(m => (
                                    <option key={m.value} value={m.value}>{m.label}</option>
                                ))}
                            </select>
                            <select
                                value={tahun}
                                onChange={(e) => setTahun(parseInt(e.target.value))}
                                className="input-field w-auto text-sm"
                            >
                                {[2023, 2024, 2025, 2026].map(y => (
                                    <option key={y} value={y}>{y}</option>
                                ))}
                            </select>
                        </div>
                    )}
                </div>
            </div>

            {/* Table */}
            <div className="card overflow-hidden">
                {loading ? (
                    <div className="flex items-center justify-center h-32">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tanggal</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Warga</th>
                                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Jumlah</th>
                                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Metode</th>
                                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Status</th>
                                    {activeTab === 'pending' && (
                                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Aksi</th>
                                    )}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {displayList.length === 0 ? (
                                    <tr>
                                        <td colSpan={activeTab === 'pending' ? 6 : 5} className="px-4 py-8 text-center text-gray-500">
                                            {activeTab === 'pending' ? 'Tidak ada pembayaran pending' : 'Belum ada pembayaran'}
                                        </td>
                                    </tr>
                                ) : (
                                    displayList.map((p) => (
                                        <tr key={p.id} className="hover:bg-gray-50">
                                            <td className="px-4 py-3 text-sm">{formatDate(p.tanggal_bayar)}</td>
                                            <td className="px-4 py-3">
                                                <div className="font-medium">{p.nama_lengkap}</div>
                                                <div className="text-xs text-gray-500">{p.no_rumah}</div>
                                            </td>
                                            <td className="px-4 py-3 text-right font-medium">
                                                {formatCurrency(p.jumlah_bayar)}
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <Badge variant={p.metode_bayar === 'tunai' ? 'success' : 'info'}>
                                                    {p.metode_bayar}
                                                </Badge>
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                {p.verified ? (
                                                    <Badge variant="success">Verified</Badge>
                                                ) : (
                                                    <Badge variant="warning">Pending</Badge>
                                                )}
                                            </td>
                                            {activeTab === 'pending' && (
                                                <td className="px-4 py-3 text-right">
                                                    <button
                                                        onClick={() => handleVerify(p.id)}
                                                        className="btn-primary text-sm py-1 px-3"
                                                    >
                                                        Verifikasi
                                                    </button>
                                                </td>
                                            )}
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Modal Input Pembayaran */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title="Input Pembayaran Baru"
            >
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Pilih Warga *
                        </label>
                        <select
                            value={formData.warga_id}
                            onChange={(e) => setFormData({ ...formData, warga_id: e.target.value })}
                            className="input-field"
                            required
                        >
                            <option value="">-- Pilih Warga --</option>
                            {wargaList.map(w => (
                                <option key={w.id} value={w.id}>
                                    {w.no_rumah} - {w.nama_lengkap}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Jumlah Bayar *
                        </label>
                        <input
                            type="number"
                            value={formData.jumlah_bayar}
                            onChange={(e) => setFormData({ ...formData, jumlah_bayar: e.target.value })}
                            className="input-field"
                            placeholder="0"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Metode Pembayaran
                        </label>
                        <select
                            value={formData.metode_bayar}
                            onChange={(e) => setFormData({ ...formData, metode_bayar: e.target.value })}
                            className="input-field"
                        >
                            <option value="tunai">Tunai</option>
                            <option value="transfer">Transfer</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Keterangan
                        </label>
                        <textarea
                            value={formData.keterangan}
                            onChange={(e) => setFormData({ ...formData, keterangan: e.target.value })}
                            className="input-field"
                            rows={2}
                            placeholder="Opsional..."
                        />
                    </div>
                    <div className="flex justify-end gap-3 pt-4 border-t">
                        <button
                            type="button"
                            onClick={() => setIsModalOpen(false)}
                            className="btn-secondary"
                        >
                            Batal
                        </button>
                        <button type="submit" className="btn-primary">
                            Simpan
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
