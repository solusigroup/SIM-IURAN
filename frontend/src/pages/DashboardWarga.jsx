import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { wargaApi, pengumumanApi } from '../api';

export default function DashboardWarga() {
    const { user } = useAuth();
    const [data, setData] = useState(null);
    const [pengumumanList, setPengumumanList] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, [user?.warga_id]);

    const loadData = async () => {
        if (!user?.warga_id) {
            setLoading(false);
            return;
        }

        try {
            const [dashboardResult, pengumumanResult] = await Promise.all([
                wargaApi.getDashboard(user.warga_id),
                pengumumanApi.getAll()
            ]);

            if (dashboardResult.success) {
                setData(dashboardResult.data);
            }
            setPengumumanList(pengumumanResult.data || []);
        } catch (err) {
            console.error('Error loading dashboard:', err);
        }
        setLoading(false);
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

    if (!data) {
        return (
            <div className="text-center py-12">
                <p className="text-gray-500">Data tidak ditemukan</p>
            </div>
        );
    }

    const { ringkasan, tagihan_per_bulan, histori_pembayaran } = data;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
                    <p className="text-gray-500">Selamat datang, {user?.nama_lengkap || user?.username}</p>
                </div>
                <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                    Rumah {ringkasan.no_rumah}
                </span>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Card: Total Tunggakan */}
                <div className={`card ${ringkasan.total_tunggakan > 0 ? 'border-l-4 border-red-500' : 'border-l-4 border-green-500'}`}>
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500">Total Tunggakan</p>
                            <p className={`text-2xl font-bold ${ringkasan.total_tunggakan > 0 ? 'text-red-600' : 'text-green-600'}`}>
                                {formatRupiah(ringkasan.total_tunggakan)}
                            </p>
                        </div>
                        <div className={`p-3 rounded-full ${ringkasan.total_tunggakan > 0 ? 'bg-red-100' : 'bg-green-100'}`}>
                            <svg className={`w-6 h-6 ${ringkasan.total_tunggakan > 0 ? 'text-red-600' : 'text-green-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                    d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                    </div>
                    <div className="mt-3">
                        <span className={`badge ${ringkasan.total_tunggakan > 0 ? 'badge-danger' : 'badge-success'}`}>
                            {ringkasan.status_tunggakan}
                        </span>
                    </div>
                </div>

                {/* Card: Total Tagihan */}
                <div className="card">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500">Total Tagihan</p>
                            <p className="text-2xl font-bold text-gray-900">{formatRupiah(ringkasan.total_tagihan)}</p>
                        </div>
                        <div className="p-3 rounded-full bg-blue-100">
                            <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                            </svg>
                        </div>
                    </div>
                </div>

                {/* Card: Total Pembayaran */}
                <div className="card">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500">Total Dibayar</p>
                            <p className="text-2xl font-bold text-green-600">{formatRupiah(ringkasan.total_pembayaran)}</p>
                        </div>
                        <div className="p-3 rounded-full bg-green-100">
                            <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                    d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                    </div>
                </div>
            </div>

            {/* Tagihan per Bulan */}
            <div className="card">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Riwayat Tagihan</h2>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b">
                                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Periode</th>
                                <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">Total Tagihan</th>
                                <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">Sudah Dibayar</th>
                                <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">Sisa</th>
                                <th className="text-center py-3 px-4 text-sm font-medium text-gray-500">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {tagihan_per_bulan.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="py-8 text-center text-gray-500">
                                        Belum ada tagihan
                                    </td>
                                </tr>
                            ) : (
                                tagihan_per_bulan.map((tagihan) => (
                                    <tr key={tagihan.tagihan_id} className="hover:bg-gray-50">
                                        <td className="py-3 px-4 font-medium">
                                            {String(tagihan.bulan).padStart(2, '0')}/{tagihan.tahun}
                                        </td>
                                        <td className="py-3 px-4 text-right">{formatRupiah(tagihan.total_tagihan)}</td>
                                        <td className="py-3 px-4 text-right text-green-600">{formatRupiah(tagihan.sudah_dibayar)}</td>
                                        <td className="py-3 px-4 text-right text-red-600">{formatRupiah(tagihan.sisa_tagihan)}</td>
                                        <td className="py-3 px-4 text-center">
                                            <span className={`badge ${tagihan.status === 'lunas' ? 'badge-success' :
                                                tagihan.status === 'sebagian' ? 'badge-warning' : 'badge-danger'
                                                }`}>
                                                {tagihan.status === 'lunas' ? 'Lunas' :
                                                    tagihan.status === 'sebagian' ? 'Sebagian' : 'Belum Bayar'}
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Histori Pembayaran */}
            <div className="card">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Pembayaran Terakhir</h2>
                <div className="space-y-3">
                    {histori_pembayaran.length === 0 ? (
                        <p className="text-gray-500 text-center py-4">Belum ada pembayaran</p>
                    ) : (
                        histori_pembayaran.map((bayar) => (
                            <div key={bayar.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                <div>
                                    <p className="font-medium">{bayar.periode || 'Pembayaran Langsung'}</p>
                                    <p className="text-sm text-gray-500">{bayar.tanggal_bayar}</p>
                                </div>
                                <div className="text-right">
                                    <p className="font-semibold text-green-600">{formatRupiah(bayar.jumlah_bayar)}</p>
                                    <span className={`badge ${bayar.verified ? 'badge-success' : 'badge-warning'}`}>
                                        {bayar.verified ? 'Terverifikasi' : 'Menunggu'}
                                    </span>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Pengumuman dari Admin */}
            {pengumumanList.length > 0 && (
                <div className="card">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
                        </svg>
                        Pengumuman RT
                    </h2>
                    <div className="space-y-4">
                        {pengumumanList.slice(0, 5).map((p) => (
                            <div key={p.id} className="border-l-4 border-blue-500 bg-blue-50 p-4 rounded-r-lg">
                                <h3 className="font-medium text-gray-800">{p.judul}</h3>
                                <p className="text-gray-600 mt-1 text-sm whitespace-pre-wrap">{p.isi}</p>
                                <p className="text-xs text-gray-400 mt-2">
                                    {new Date(p.created_at).toLocaleDateString('id-ID', {
                                        day: 'numeric',
                                        month: 'long',
                                        year: 'numeric'
                                    })}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
