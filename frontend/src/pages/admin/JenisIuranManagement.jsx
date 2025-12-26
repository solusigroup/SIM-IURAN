import { useState, useEffect } from 'react';
import { jenisIuranApi } from '../../api';
import Modal from '../../components/Modal';
import Badge from '../../components/Badge';

export default function JenisIuranManagement() {
    const [jenisIuranList, setJenisIuranList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [formData, setFormData] = useState({
        nama_iuran: '',
        nominal_baku: '',
        deskripsi: '',
        is_active: true
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const response = await jenisIuranApi.getAll();
            setJenisIuranList(response.data || []);
        } catch (err) {
            console.error('Gagal memuat data:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const payload = {
                ...formData,
                nominal_baku: parseFloat(formData.nominal_baku)
            };

            if (editingItem) {
                await jenisIuranApi.update(editingItem.id, payload);
            } else {
                await jenisIuranApi.create(payload);
            }
            fetchData();
            closeModal();
        } catch (err) {
            alert('Gagal menyimpan: ' + (err.message || err));
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Hapus jenis iuran ini?')) return;
        try {
            await jenisIuranApi.delete(id);
            fetchData();
        } catch (err) {
            alert('Gagal menghapus: ' + (err.message || err));
        }
    };

    const openModal = (item = null) => {
        if (item) {
            setEditingItem(item);
            setFormData({
                nama_iuran: item.nama_iuran || '',
                nominal_baku: item.nominal_baku || '',
                deskripsi: item.deskripsi || '',
                is_active: item.is_active !== false
            });
        } else {
            setEditingItem(null);
            setFormData({
                nama_iuran: '',
                nominal_baku: '',
                deskripsi: '',
                is_active: true
            });
        }
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingItem(null);
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0
        }).format(amount || 0);
    };

    // Calculate total iuran bulanan
    const totalIuran = jenisIuranList
        .filter(j => j.is_active)
        .reduce((sum, j) => sum + parseFloat(j.nominal_baku || 0), 0);

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
                    <h1 className="text-2xl font-bold text-gray-800">Jenis Iuran</h1>
                    <p className="text-gray-500">Kelola komponen iuran bulanan warga</p>
                </div>
                <button
                    onClick={() => openModal()}
                    className="btn-primary flex items-center gap-2"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Tambah Jenis Iuran
                </button>
            </div>

            {/* Summary Card */}
            <div className="card bg-gradient-to-r from-blue-500 to-blue-600 text-white">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-blue-100">Total Iuran Bulanan per Warga</p>
                        <p className="text-3xl font-bold mt-1">{formatCurrency(totalIuran)}</p>
                    </div>
                    <div className="text-blue-200">
                        <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                        </svg>
                    </div>
                </div>
                <p className="text-blue-200 text-sm mt-2">
                    {jenisIuranList.filter(j => j.is_active).length} jenis iuran aktif
                </p>
            </div>

            {/* Table */}
            <div className="card overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nama Iuran</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Deskripsi</th>
                                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Nominal</th>
                                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Status</th>
                                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {jenisIuranList.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="px-4 py-8 text-center text-gray-500">
                                        Belum ada jenis iuran. Klik "Tambah Jenis Iuran" untuk membuat.
                                    </td>
                                </tr>
                            ) : (
                                jenisIuranList.map((item) => (
                                    <tr key={item.id} className="hover:bg-gray-50">
                                        <td className="px-4 py-3 font-medium">{item.nama_iuran}</td>
                                        <td className="px-4 py-3 text-gray-500 text-sm">{item.deskripsi || '-'}</td>
                                        <td className="px-4 py-3 text-right font-medium">
                                            {formatCurrency(item.nominal_baku)}
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <Badge variant={item.is_active ? 'success' : 'gray'}>
                                                {item.is_active ? 'Aktif' : 'Nonaktif'}
                                            </Badge>
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => openModal(item)}
                                                    className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"
                                                    title="Edit"
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                    </svg>
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(item.id)}
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
                title={editingItem ? 'Edit Jenis Iuran' : 'Tambah Jenis Iuran Baru'}
            >
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Nama Iuran *
                        </label>
                        <input
                            type="text"
                            value={formData.nama_iuran}
                            onChange={(e) => setFormData({ ...formData, nama_iuran: e.target.value })}
                            className="input-field"
                            placeholder="cth: Iuran Keamanan"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Nominal per Bulan (Rp) *
                        </label>
                        <input
                            type="number"
                            value={formData.nominal_baku}
                            onChange={(e) => setFormData({ ...formData, nominal_baku: e.target.value })}
                            className="input-field"
                            placeholder="50000"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Deskripsi
                        </label>
                        <textarea
                            value={formData.deskripsi}
                            onChange={(e) => setFormData({ ...formData, deskripsi: e.target.value })}
                            className="input-field"
                            rows={2}
                            placeholder="Opsional..."
                        />
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
                            Aktif (akan ditagihkan ke warga)
                        </label>
                    </div>
                    <div className="flex justify-end gap-3 pt-4 border-t">
                        <button type="button" onClick={closeModal} className="btn-secondary">
                            Batal
                        </button>
                        <button type="submit" className="btn-primary">
                            {editingItem ? 'Update' : 'Simpan'}
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
