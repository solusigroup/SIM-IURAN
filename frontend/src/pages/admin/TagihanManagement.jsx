import { useState, useEffect } from 'react';
import { tagihanApi } from '../../api';
import { StatusBadge } from '../../components/Badge';

export default function TagihanManagement() {
    const [tagihanList, setTagihanList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState(false);
    const currentDate = new Date();
    const [bulan, setBulan] = useState(currentDate.getMonth() + 1);
    const [tahun, setTahun] = useState(currentDate.getFullYear());

    useEffect(() => {
        fetchTagihan();
    }, [bulan, tahun]);

    const fetchTagihan = async () => {
        try {
            setLoading(true);
            const response = await tagihanApi.getAll(bulan, tahun);
            setTagihanList(response.data || []);
        } catch (err) {
            console.error('Gagal memuat tagihan:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleGenerate = async () => {
        if (!confirm(`Generate tagihan untuk bulan ${bulan}/${tahun}?`)) return;

        try {
            setGenerating(true);
            const response = await tagihanApi.generate(bulan, tahun);
            alert(response.message);
            fetchTagihan();
        } catch (err) {
            alert('Gagal generate tagihan: ' + (err.message || err));
        } finally {
            setGenerating(false);
        }
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0
        }).format(amount || 0);
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

    const years = Array.from({ length: 5 }, (_, i) => currentDate.getFullYear() - 2 + i);

    // Stats
    const totalTagihan = tagihanList.reduce((sum, t) => sum + parseFloat(t.total_tagihan || 0), 0);
    const totalDibayar = tagihanList.reduce((sum, t) => sum + parseFloat(t.sudah_dibayar || 0), 0);
    const lunas = tagihanList.filter(t => t.status === 'lunas').length;
    const belumLunas = tagihanList.filter(t => t.status === 'belum_lunas').length;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Kelola Tagihan</h1>
                    <p className="text-gray-500">Generate dan monitor tagihan bulanan</p>
                </div>
                <button
                    onClick={handleGenerate}
                    disabled={generating}
                    className="btn-primary flex items-center gap-2"
                >
                    {generating ? (
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    ) : (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                    )}
                    Generate Tagihan
                </button>
            </div>

            {/* Filter Periode */}
            <div className="card">
                <div className="flex flex-wrap items-center gap-4">
                    <div className="flex items-center gap-2">
                        <label className="text-sm font-medium text-gray-700">Periode:</label>
                        <select
                            value={bulan}
                            onChange={(e) => setBulan(parseInt(e.target.value))}
                            className="input-field w-auto"
                        >
                            {months.map(m => (
                                <option key={m.value} value={m.value}>{m.label}</option>
                            ))}
                        </select>
                        <select
                            value={tahun}
                            onChange={(e) => setTahun(parseInt(e.target.value))}
                            className="input-field w-auto"
                        >
                            {years.map(y => (
                                <option key={y} value={y}>{y}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="card bg-blue-50 border border-blue-200">
                    <p className="text-sm text-blue-600">Total Tagihan</p>
                    <p className="text-xl font-bold text-blue-800">{formatCurrency(totalTagihan)}</p>
                </div>
                <div className="card bg-green-50 border border-green-200">
                    <p className="text-sm text-green-600">Sudah Dibayar</p>
                    <p className="text-xl font-bold text-green-800">{formatCurrency(totalDibayar)}</p>
                </div>
                <div className="card bg-emerald-50 border border-emerald-200">
                    <p className="text-sm text-emerald-600">Lunas</p>
                    <p className="text-xl font-bold text-emerald-800">{lunas} warga</p>
                </div>
                <div className="card bg-red-50 border border-red-200">
                    <p className="text-sm text-red-600">Belum Lunas</p>
                    <p className="text-xl font-bold text-red-800">{belumLunas} warga</p>
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
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">No. Rumah</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nama Warga</th>
                                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total Tagihan</th>
                                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Sudah Dibayar</th>
                                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Sisa</th>
                                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {tagihanList.length === 0 ? (
                                    <tr>
                                        <td colSpan="6" className="px-4 py-8 text-center text-gray-500">
                                            Belum ada tagihan untuk periode ini. Klik "Generate Tagihan" untuk membuat.
                                        </td>
                                    </tr>
                                ) : (
                                    tagihanList.map((tagihan) => (
                                        <tr key={tagihan.id} className="hover:bg-gray-50">
                                            <td className="px-4 py-3 font-medium">{tagihan.no_rumah}</td>
                                            <td className="px-4 py-3">{tagihan.nama_lengkap}</td>
                                            <td className="px-4 py-3 text-right">{formatCurrency(tagihan.total_tagihan)}</td>
                                            <td className="px-4 py-3 text-right text-green-600">
                                                {formatCurrency(tagihan.sudah_dibayar)}
                                            </td>
                                            <td className="px-4 py-3 text-right text-red-600">
                                                {formatCurrency(tagihan.total_tagihan - tagihan.sudah_dibayar)}
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <StatusBadge status={tagihan.status} />
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
