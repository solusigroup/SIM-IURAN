import { useState, useEffect } from 'react';
import { registrasiApi } from '../../api';
import Badge from '../../components/Badge';

export default function VerifikasiWarga() {
    const [pendingList, setPendingList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(null);

    useEffect(() => {
        fetchPending();
    }, []);

    const fetchPending = async () => {
        try {
            setLoading(true);
            const response = await registrasiApi.getPending();
            setPendingList(response.data || []);
        } catch (err) {
            console.error('Gagal memuat data:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleVerify = async (id, action) => {
        if (!confirm(action === 'approve'
            ? 'Setujui pendaftaran warga ini?'
            : 'Tolak pendaftaran warga ini?')) return;

        try {
            setProcessing(id);
            await registrasiApi.verify(id, action);
            fetchPending();
        } catch (err) {
            alert('Gagal memproses: ' + (err.message || err));
        } finally {
            setProcessing(null);
        }
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return '-';
        return new Date(dateStr).toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
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
                <h1 className="text-2xl font-bold text-gray-800">Verifikasi Pendaftaran</h1>
                <p className="text-gray-500">Setujui atau tolak pendaftaran warga baru</p>
            </div>

            {pendingList.length === 0 ? (
                <div className="card text-center py-12">
                    <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-gray-500">Tidak ada pendaftaran yang menunggu verifikasi</p>
                </div>
            ) : (
                <div className="grid gap-4">
                    {pendingList.map((warga) => (
                        <div key={warga.id} className="card border-l-4 border-yellow-400">
                            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                                <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div>
                                        <p className="text-xs text-gray-500 uppercase">Nama Lengkap</p>
                                        <p className="font-semibold text-gray-800">{warga.nama_lengkap}</p>
                                        <p className="text-sm text-gray-500">@{warga.username}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500 uppercase">NIK</p>
                                        <p className="font-medium">{warga.nik}</p>
                                        <p className="text-sm text-gray-500">No. Rumah: {warga.no_rumah}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500 uppercase">No. WhatsApp</p>
                                        <p className="font-medium">{warga.no_whatsapp}</p>
                                        <p className="text-sm text-gray-500">
                                            Daftar: {formatDate(warga.registered_at)}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => handleVerify(warga.id, 'reject')}
                                        disabled={processing === warga.id}
                                        className="px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition font-medium text-sm"
                                    >
                                        Tolak
                                    </button>
                                    <button
                                        onClick={() => handleVerify(warga.id, 'approve')}
                                        disabled={processing === warga.id}
                                        className="btn-primary text-sm"
                                    >
                                        {processing === warga.id ? 'Memproses...' : 'Setujui'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
