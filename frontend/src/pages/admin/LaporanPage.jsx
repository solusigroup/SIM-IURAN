import { useState, useEffect } from 'react';
import { laporanApi, pengumumanApi } from '../../api';
import Modal from '../../components/Modal';

export default function LaporanPage() {
    const [dashboard, setDashboard] = useState(null);
    const [pengumumanList, setPengumumanList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formData, setFormData] = useState({ judul: '', isi: '' });

    const currentDate = new Date();
    const [bulan, setBulan] = useState(currentDate.getMonth() + 1);
    const [tahun, setTahun] = useState(currentDate.getFullYear());

    useEffect(() => {
        fetchData();
    }, [bulan, tahun]);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [dashboardRes, pengumumanRes] = await Promise.all([
                laporanApi.getDashboard(),
                pengumumanApi.getAll()
            ]);
            setDashboard(dashboardRes.data);
            setPengumumanList(pengumumanRes.data || []);
        } catch (err) {
            console.error('Gagal memuat data:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmitPengumuman = async (e) => {
        e.preventDefault();
        try {
            await pengumumanApi.create(formData);
            fetchData();
            setIsModalOpen(false);
            setFormData({ judul: '', isi: '' });
        } catch (err) {
            alert('Gagal membuat pengumuman: ' + (err.message || err));
        }
    };

    const handleDeletePengumuman = async (id) => {
        if (!confirm('Hapus pengumuman ini?')) return;
        try {
            await pengumumanApi.delete(id);
            fetchData();
        } catch (err) {
            alert('Gagal menghapus: ' + (err.message || err));
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
            month: 'long',
            year: 'numeric'
        });
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-gray-800">Laporan & Pengumuman</h1>
                <p className="text-gray-500">Ringkasan keuangan dan kelola pengumuman</p>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="card bg-gradient-to-br from-blue-500 to-blue-600 text-white">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-blue-100 text-sm">Total Warga</p>
                            <p className="text-3xl font-bold">{dashboard?.total_warga || 0}</p>
                        </div>
                        <svg className="w-12 h-12 text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                    </div>
                </div>

                <div className="card bg-gradient-to-br from-red-500 to-red-600 text-white">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-red-100 text-sm">Total Tunggakan</p>
                            <p className="text-2xl font-bold">{formatCurrency(dashboard?.total_tunggakan)}</p>
                        </div>
                        <svg className="w-12 h-12 text-red-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <p className="text-red-200 text-sm mt-2">dari {dashboard?.jumlah_penunggak || 0} warga</p>
                </div>

                <div className="card bg-gradient-to-br from-green-500 to-green-600 text-white">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-green-100 text-sm">Penerimaan Bulan Ini</p>
                            <p className="text-2xl font-bold">{formatCurrency(dashboard?.penerimaan_bulan_ini)}</p>
                        </div>
                        <svg className="w-12 h-12 text-green-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <p className="text-green-200 text-sm mt-2">{dashboard?.transaksi_bulan_ini || 0} transaksi</p>
                </div>

                <div className="card bg-gradient-to-br from-yellow-500 to-yellow-600 text-white">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-yellow-100 text-sm">Pending Verifikasi</p>
                            <p className="text-3xl font-bold">{dashboard?.pending_verifikasi || 0}</p>
                        </div>
                        <svg className="w-12 h-12 text-yellow-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                </div>
            </div>

            {/* Top Penunggak */}
            {dashboard?.top_penunggak?.length > 0 && (
                <div className="card">
                    <h2 className="text-lg font-semibold text-gray-800 mb-4">Penunggak Terbesar</h2>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Warga</th>
                                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">Tunggakan</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {dashboard.top_penunggak.map((w, i) => (
                                    <tr key={i}>
                                        <td className="px-4 py-2">
                                            <div className="font-medium">{w.nama_lengkap}</div>
                                            <div className="text-xs text-gray-500">{w.no_rumah}</div>
                                        </td>
                                        <td className="px-4 py-2 text-right text-red-600 font-medium">
                                            {formatCurrency(w.total_tunggakan)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Pengumuman Section */}
            <div className="card">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-gray-800">Pengumuman</h2>
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="btn-primary text-sm py-1.5"
                    >
                        + Buat Pengumuman
                    </button>
                </div>

                {pengumumanList.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">Belum ada pengumuman</p>
                ) : (
                    <div className="space-y-4">
                        {pengumumanList.map((p) => (
                            <div key={p.id} className="border border-gray-200 rounded-lg p-4">
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <h3 className="font-semibold text-gray-800">{p.judul}</h3>
                                        <p className="text-gray-600 mt-1 whitespace-pre-wrap">{p.isi}</p>
                                        <p className="text-xs text-gray-400 mt-2">
                                            Dibuat oleh {p.created_by_name} • {formatDate(p.created_at)}
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => handleDeletePengumuman(p.id)}
                                        className="p-1.5 text-red-600 hover:bg-red-50 rounded ml-4"
                                        title="Hapus"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Modal Pengumuman */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title="Buat Pengumuman Baru"
            >
                <form onSubmit={handleSubmitPengumuman} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Judul *
                        </label>
                        <input
                            type="text"
                            value={formData.judul}
                            onChange={(e) => setFormData({ ...formData, judul: e.target.value })}
                            className="input-field"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Isi Pengumuman *
                        </label>
                        <textarea
                            value={formData.isi}
                            onChange={(e) => setFormData({ ...formData, isi: e.target.value })}
                            className="input-field"
                            rows={5}
                            required
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
                            Publikasikan
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
