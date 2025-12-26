import { useState, useEffect } from 'react';
import { laporanApi, tagihanApi, pembayaranApi } from '../api';

export default function DashboardAdmin() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const result = await laporanApi.getDashboard();
            if (result.success) {
                setData(result.data);
            }
        } catch (err) {
            console.error('Error loading dashboard:', err);
        }
        setLoading(false);
    };

    const handleGenerateTagihan = async () => {
        if (!confirm('Generate tagihan untuk bulan ini?')) return;

        setGenerating(true);
        try {
            const bulan = new Date().getMonth() + 1;
            const tahun = new Date().getFullYear();
            const result = await tagihanApi.generate(bulan, tahun);
            alert(result.message);
            loadData(); // Refresh
        } catch (err) {
            alert(err.message || 'Gagal generate tagihan');
        }
        setGenerating(false);
    };

    // Format currency
    const formatRupiah = (num) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
        }).format(num || 0);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Dashboard Admin</h1>
                    <p className="text-gray-500">Ringkasan data iuran RT</p>
                </div>
                <button
                    onClick={handleGenerateTagihan}
                    disabled={generating}
                    className="btn btn-primary flex items-center gap-2"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    {generating ? 'Memproses...' : 'Generate Tagihan Bulanan'}
                </button>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="card bg-gradient-to-br from-blue-500 to-blue-600 text-white">
                    <p className="text-blue-100 text-sm">Total Warga</p>
                    <p className="text-3xl font-bold mt-1">{data?.total_warga || 0}</p>
                </div>

                <div className="card bg-gradient-to-br from-red-500 to-red-600 text-white">
                    <p className="text-red-100 text-sm">Total Tunggakan</p>
                    <p className="text-2xl font-bold mt-1">{formatRupiah(data?.total_tunggakan)}</p>
                    <p className="text-red-100 text-xs mt-1">{data?.jumlah_penunggak || 0} warga menunggak</p>
                </div>

                <div className="card bg-gradient-to-br from-green-500 to-green-600 text-white">
                    <p className="text-green-100 text-sm">Penerimaan Bulan Ini</p>
                    <p className="text-2xl font-bold mt-1">{formatRupiah(data?.penerimaan_bulan_ini)}</p>
                    <p className="text-green-100 text-xs mt-1">{data?.transaksi_bulan_ini || 0} transaksi</p>
                </div>

                <div className="card bg-gradient-to-br from-amber-500 to-amber-600 text-white">
                    <p className="text-amber-100 text-sm">Perlu Verifikasi</p>
                    <p className="text-3xl font-bold mt-1">{data?.pending_verifikasi || 0}</p>
                </div>
            </div>

            {/* Top Penunggak */}
            <div className="card">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-gray-900">Penunggak Terbesar</h2>
                    <a href="/admin/tunggakan" className="text-blue-600 text-sm hover:underline">
                        Lihat Semua →
                    </a>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b">
                                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">No</th>
                                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Nama</th>
                                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Rumah</th>
                                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">No. HP</th>
                                <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">Tunggakan</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {!data?.top_penunggak || data.top_penunggak.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="py-8 text-center text-gray-500">
                                        🎉 Tidak ada warga yang menunggak!
                                    </td>
                                </tr>
                            ) : (
                                data.top_penunggak.map((warga, idx) => (
                                    <tr key={warga.id} className="hover:bg-gray-50">
                                        <td className="py-3 px-4">{idx + 1}</td>
                                        <td className="py-3 px-4 font-medium">{warga.nama_lengkap}</td>
                                        <td className="py-3 px-4">{warga.no_rumah}</td>
                                        <td className="py-3 px-4">{warga.no_hp || '-'}</td>
                                        <td className="py-3 px-4 text-right text-red-600 font-semibold">
                                            {formatRupiah(warga.total_tunggakan)}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <a href="/admin/warga" className="card hover:shadow-lg transition-shadow group">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition">
                            <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                        </div>
                        <div>
                            <p className="font-semibold text-gray-900">Kelola Warga</p>
                            <p className="text-sm text-gray-500">Tambah, edit, hapus data warga</p>
                        </div>
                    </div>
                </a>

                <a href="/admin/pembayaran" className="card hover:shadow-lg transition-shadow group">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-green-100 rounded-lg group-hover:bg-green-200 transition">
                            <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                    d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2z" />
                            </svg>
                        </div>
                        <div>
                            <p className="font-semibold text-gray-900">Input Pembayaran</p>
                            <p className="text-sm text-gray-500">Catat pembayaran warga</p>
                        </div>
                    </div>
                </a>

                <a href="/admin/laporan" className="card hover:shadow-lg transition-shadow group">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-purple-100 rounded-lg group-hover:bg-purple-200 transition">
                            <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                    d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                        </div>
                        <div>
                            <p className="font-semibold text-gray-900">Laporan</p>
                            <p className="text-sm text-gray-500">Lihat rekap kas & tunggakan</p>
                        </div>
                    </div>
                </a>
            </div>
        </div>
    );
}
