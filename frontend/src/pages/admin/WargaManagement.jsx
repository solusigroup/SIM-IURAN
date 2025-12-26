import { useState, useEffect } from 'react';
import { wargaApi } from '../../api';
import Modal from '../../components/Modal';
import { StatusHuniBadge } from '../../components/Badge';

export default function WargaManagement() {
    const [wargaList, setWargaList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingWarga, setEditingWarga] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [formData, setFormData] = useState({
        nama_lengkap: '',
        nik: '',
        no_kk: '',
        no_rumah: '',
        no_whatsapp: '',
        status_huni: 'tetap',
        is_active: true
    });

    useEffect(() => {
        fetchWarga();
    }, []);

    const fetchWarga = async () => {
        try {
            setLoading(true);
            const response = await wargaApi.getAll();
            setWargaList(response.data || []);
        } catch (err) {
            setError('Gagal memuat data warga');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingWarga) {
                await wargaApi.update(editingWarga.id, formData);
            } else {
                await wargaApi.create(formData);
            }
            fetchWarga();
            closeModal();
        } catch (err) {
            alert('Gagal menyimpan data: ' + (err.message || err));
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Yakin ingin menghapus warga ini?')) return;
        try {
            await wargaApi.delete(id);
            fetchWarga();
        } catch (err) {
            alert('Gagal menghapus: ' + (err.message || err));
        }
    };

    const openModal = (warga = null) => {
        if (warga) {
            setEditingWarga(warga);
            setFormData({
                nama_lengkap: warga.nama_lengkap || '',
                nik: warga.nik || '',
                no_kk: warga.no_kk || '',
                no_rumah: warga.no_rumah || '',
                no_whatsapp: warga.no_whatsapp || '',
                status_huni: warga.status_huni || 'tetap',
                is_active: warga.is_active !== false
            });
        } else {
            setEditingWarga(null);
            setFormData({
                nama_lengkap: '',
                nik: '',
                no_kk: '',
                no_rumah: '',
                no_whatsapp: '',
                status_huni: 'tetap',
                is_active: true
            });
        }
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingWarga(null);
    };

    const filteredWarga = wargaList.filter(w =>
        w.nama_lengkap?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        w.no_rumah?.toLowerCase().includes(searchTerm.toLowerCase())
    );

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

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Data Warga</h1>
                    <p className="text-gray-500">Kelola data warga RT</p>
                </div>
                <button
                    onClick={() => openModal()}
                    className="btn-primary flex items-center gap-2"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Tambah Warga
                </button>
            </div>

            {/* Search */}
            <div className="card">
                <div className="relative">
                    <input
                        type="text"
                        placeholder="Cari nama atau nomor rumah..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="input-field pl-10"
                    />
                    <svg className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                </div>
            </div>

            {/* Table */}
            <div className="card overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">No. Rumah</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nama</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">No. WA</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tunggakan</th>
                                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {filteredWarga.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="px-4 py-8 text-center text-gray-500">
                                        {searchTerm ? 'Tidak ada hasil pencarian' : 'Belum ada data warga'}
                                    </td>
                                </tr>
                            ) : (
                                filteredWarga.map((warga) => (
                                    <tr key={warga.id} className="hover:bg-gray-50">
                                        <td className="px-4 py-3 font-medium">{warga.no_rumah}</td>
                                        <td className="px-4 py-3">{warga.nama_lengkap}</td>
                                        <td className="px-4 py-3 text-gray-500">{warga.no_whatsapp || '-'}</td>
                                        <td className="px-4 py-3">
                                            <StatusHuniBadge status={warga.status_huni} />
                                        </td>
                                        <td className="px-4 py-3">
                                            {warga.total_tunggakan > 0 ? (
                                                <span className="text-red-600 font-medium">
                                                    {formatCurrency(warga.total_tunggakan)}
                                                </span>
                                            ) : (
                                                <span className="text-green-600">Lunas</span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => openModal(warga)}
                                                    className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"
                                                    title="Edit"
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                    </svg>
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(warga.id)}
                                                    className="p-1.5 text-red-600 hover:bg-red-50 rounded"
                                                    title="Hapus"
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                    </svg>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal Form */}
            <Modal
                isOpen={isModalOpen}
                onClose={closeModal}
                title={editingWarga ? 'Edit Warga' : 'Tambah Warga Baru'}
                size="lg"
            >
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Nama Lengkap *
                            </label>
                            <input
                                type="text"
                                value={formData.nama_lengkap}
                                onChange={(e) => setFormData({ ...formData, nama_lengkap: e.target.value })}
                                className="input-field"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                No. Rumah *
                            </label>
                            <input
                                type="text"
                                value={formData.no_rumah}
                                onChange={(e) => setFormData({ ...formData, no_rumah: e.target.value })}
                                className="input-field"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                NIK
                            </label>
                            <input
                                type="text"
                                value={formData.nik}
                                onChange={(e) => setFormData({ ...formData, nik: e.target.value })}
                                className="input-field"
                                maxLength={16}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                No. KK
                            </label>
                            <input
                                type="text"
                                value={formData.no_kk}
                                onChange={(e) => setFormData({ ...formData, no_kk: e.target.value })}
                                className="input-field"
                                maxLength={16}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                No. WhatsApp
                            </label>
                            <input
                                type="text"
                                value={formData.no_whatsapp}
                                onChange={(e) => setFormData({ ...formData, no_whatsapp: e.target.value })}
                                className="input-field"
                                placeholder="08xxxxxxxxxx"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Status Huni
                            </label>
                            <select
                                value={formData.status_huni}
                                onChange={(e) => setFormData({ ...formData, status_huni: e.target.value })}
                                className="input-field"
                            >
                                <option value="tetap">Tetap</option>
                                <option value="kontrak">Kontrak</option>
                            </select>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            id="is_active"
                            checked={formData.is_active}
                            onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                            className="rounded text-blue-600"
                        />
                        <label htmlFor="is_active" className="text-sm text-gray-700">
                            Warga Aktif
                        </label>
                    </div>
                    <div className="flex justify-end gap-3 pt-4 border-t">
                        <button
                            type="button"
                            onClick={closeModal}
                            className="btn-secondary"
                        >
                            Batal
                        </button>
                        <button type="submit" className="btn-primary">
                            {editingWarga ? 'Update' : 'Simpan'}
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
