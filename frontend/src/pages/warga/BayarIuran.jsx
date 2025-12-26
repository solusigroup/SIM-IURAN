import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { wargaApi, pembayaranApi } from '../../api';

export default function BayarIuran() {
    const { user } = useAuth();
    const [tunggakan, setTunggakan] = useState(null);
    const [tagihanList, setTagihanList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [success, setSuccess] = useState(false);
    const fileInputRef = useRef(null);

    const [formData, setFormData] = useState({
        jumlah_bayar: '',
        metode_bayar: 'transfer',
        bukti_transfer: null,
        keterangan: ''
    });
    const [previewUrl, setPreviewUrl] = useState(null);

    useEffect(() => {
        if (user?.warga_id) {
            fetchData();
        }
    }, [user?.warga_id]);

    const fetchData = async () => {
        try {
            setLoading(true);
            const response = await wargaApi.getDashboard(user.warga_id);
            if (response.success) {
                setTunggakan(response.data.ringkasan);
                setTagihanList(response.data.tagihan_per_bulan || []);
            }
        } catch (err) {
            console.error('Gagal memuat data:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            // Validasi tipe file
            if (!file.type.startsWith('image/')) {
                alert('File harus berupa gambar');
                return;
            }
            // Validasi ukuran (max 5MB)
            if (file.size > 5 * 1024 * 1024) {
                alert('Ukuran file maksimal 5MB');
                return;
            }
            setFormData({ ...formData, bukti_transfer: file });
            setPreviewUrl(URL.createObjectURL(file));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.jumlah_bayar || parseFloat(formData.jumlah_bayar) <= 0) {
            alert('Masukkan jumlah pembayaran yang valid');
            return;
        }

        if (formData.metode_bayar === 'transfer' && !formData.bukti_transfer) {
            alert('Upload bukti transfer terlebih dahulu');
            return;
        }

        try {
            setSubmitting(true);

            // Create form data for file upload
            const submitData = new FormData();
            submitData.append('warga_id', user.warga_id);
            submitData.append('jumlah_bayar', formData.jumlah_bayar);
            submitData.append('metode_bayar', formData.metode_bayar);
            submitData.append('keterangan', formData.keterangan);
            if (formData.bukti_transfer) {
                submitData.append('bukti_transfer', formData.bukti_transfer);
            }

            await pembayaranApi.create(submitData);
            setSuccess(true);

        } catch (err) {
            alert('Gagal mengirim pembayaran: ' + (err.message || err));
        } finally {
            setSubmitting(false);
        }
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0
        }).format(amount || 0);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (success) {
        return (
            <div className="card max-w-md mx-auto text-center py-12">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                </div>
                <h2 className="text-xl font-bold text-gray-800 mb-2">Pembayaran Terkirim!</h2>
                <p className="text-gray-600 mb-6">
                    Pembayaran Anda sedang menunggu verifikasi dari Pengurus RT.
                </p>
                <button
                    onClick={() => {
                        setSuccess(false);
                        setFormData({
                            jumlah_bayar: '',
                            metode_bayar: 'transfer',
                            bukti_transfer: null,
                            keterangan: ''
                        });
                        setPreviewUrl(null);
                        fetchData();
                    }}
                    className="btn-primary"
                >
                    Bayar Lagi
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-gray-800">Bayar Iuran</h1>
                <p className="text-gray-500">Upload bukti transfer untuk pembayaran iuran</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Ringkasan Tunggakan */}
                <div className="card">
                    <h2 className="text-lg font-semibold text-gray-800 mb-4">Ringkasan Tagihan</h2>

                    {tunggakan && (
                        <div className={`p-4 rounded-lg mb-4 ${tunggakan.total_tunggakan > 0
                                ? 'bg-red-50 border border-red-200'
                                : 'bg-green-50 border border-green-200'
                            }`}>
                            <p className="text-sm text-gray-600">Total Tunggakan</p>
                            <p className={`text-3xl font-bold ${tunggakan.total_tunggakan > 0 ? 'text-red-600' : 'text-green-600'
                                }`}>
                                {formatCurrency(tunggakan.total_tunggakan)}
                            </p>
                        </div>
                    )}

                    <div className="space-y-2 max-h-60 overflow-y-auto">
                        {tagihanList.filter(t => t.sisa_tagihan > 0).map((t) => (
                            <div key={t.tagihan_id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                                <div>
                                    <p className="font-medium">{String(t.bulan).padStart(2, '0')}/{t.tahun}</p>
                                    <p className="text-xs text-gray-500">Sisa: {formatCurrency(t.sisa_tagihan)}</p>
                                </div>
                                <span className="text-red-600 font-medium text-sm">Belum Lunas</span>
                            </div>
                        ))}
                        {tagihanList.filter(t => t.sisa_tagihan > 0).length === 0 && (
                            <p className="text-center text-green-600 py-4">Semua tagihan sudah lunas! 🎉</p>
                        )}
                    </div>
                </div>

                {/* Form Pembayaran */}
                <div className="card">
                    <h2 className="text-lg font-semibold text-gray-800 mb-4">Form Pembayaran</h2>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Jumlah Bayar (Rp) *
                            </label>
                            <input
                                type="number"
                                value={formData.jumlah_bayar}
                                onChange={(e) => setFormData({ ...formData, jumlah_bayar: e.target.value })}
                                className="input-field"
                                placeholder="0"
                                required
                            />
                            {tunggakan?.total_tunggakan > 0 && (
                                <button
                                    type="button"
                                    onClick={() => setFormData({ ...formData, jumlah_bayar: tunggakan.total_tunggakan })}
                                    className="text-xs text-blue-600 hover:underline mt-1"
                                >
                                    Bayar lunas ({formatCurrency(tunggakan.total_tunggakan)})
                                </button>
                            )}
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
                                <option value="transfer">Transfer Bank</option>
                                <option value="tunai">Tunai (Setor ke Pengurus)</option>
                            </select>
                        </div>

                        {formData.metode_bayar === 'transfer' && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Bukti Transfer *
                                </label>
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    onChange={handleFileChange}
                                    accept="image/*"
                                    className="hidden"
                                />
                                <button
                                    type="button"
                                    onClick={() => fileInputRef.current?.click()}
                                    className="w-full border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-blue-500 transition"
                                >
                                    {previewUrl ? (
                                        <img
                                            src={previewUrl}
                                            alt="Preview"
                                            className="max-h-40 mx-auto rounded"
                                        />
                                    ) : (
                                        <div className="text-gray-500">
                                            <svg className="w-8 h-8 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                            </svg>
                                            Klik untuk upload bukti transfer
                                        </div>
                                    )}
                                </button>
                            </div>
                        )}

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

                        <button
                            type="submit"
                            disabled={submitting}
                            className="w-full btn-primary py-3"
                        >
                            {submitting ? 'Mengirim...' : 'Kirim Pembayaran'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
