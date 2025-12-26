import { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { registrasiApi } from '../api';

export default function Register() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');
    const [formData, setFormData] = useState({
        nama_lengkap: '',
        nik: '',
        no_kk: '',
        no_rumah: '',
        no_whatsapp: '',
        status_huni: 'tetap',
        username: '',
        password: '',
        confirmPassword: ''
    });

    // Foto handling
    const [fotoPreview, setFotoPreview] = useState(null);
    const [fotoFile, setFotoFile] = useState(null);
    const fileInputRef = useRef(null);
    const cameraInputRef = useRef(null);

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (!file.type.startsWith('image/')) {
                setError('File harus berupa gambar');
                return;
            }
            if (file.size > 5 * 1024 * 1024) {
                setError('Ukuran foto maksimal 5MB');
                return;
            }
            setFotoFile(file);
            setFotoPreview(URL.createObjectURL(file));
            setError('');
        }
    };

    const removeFoto = () => {
        setFotoFile(null);
        setFotoPreview(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
        if (cameraInputRef.current) cameraInputRef.current.value = '';
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        // Validasi password
        if (formData.password !== formData.confirmPassword) {
            setError('Password tidak cocok');
            return;
        }

        if (formData.password.length < 6) {
            setError('Password minimal 6 karakter');
            return;
        }

        // Validasi NIK
        if (formData.nik.length !== 16) {
            setError('NIK harus 16 digit');
            return;
        }

        // Validasi No. WA
        if (!formData.no_whatsapp.startsWith('08')) {
            setError('Nomor WhatsApp harus dimulai dengan 08');
            return;
        }

        try {
            setLoading(true);

            // Gunakan FormData jika ada foto
            if (fotoFile) {
                const submitData = new FormData();
                Object.keys(formData).forEach(key => {
                    if (key !== 'confirmPassword') {
                        submitData.append(key, formData[key]);
                    }
                });
                submitData.append('foto_diri', fotoFile);
                await registrasiApi.selfRegisterWithFile(submitData);
            } else {
                await registrasiApi.selfRegister(formData);
            }

            setSuccess(true);
        } catch (err) {
            setError(err.message || 'Gagal mendaftar');
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-900 via-purple-900 to-indigo-800 p-4">
                <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
                    <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                    <h2 className="text-2xl font-bold text-gray-800 mb-2">Pendaftaran Berhasil!</h2>
                    <p className="text-gray-600 mb-6">
                        Akun Anda sedang menunggu verifikasi dari Pengurus RT.
                        Anda akan dapat login setelah akun diverifikasi.
                    </p>
                    <Link to="/login" className="btn-primary inline-block">
                        Kembali ke Login
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-900 via-purple-900 to-indigo-800 p-4">
            <div className="bg-white rounded-2xl shadow-xl p-8 max-w-lg w-full max-h-[95vh] overflow-y-auto">
                <div className="text-center mb-6">
                    <h1 className="text-2xl font-bold text-gray-800">Daftar Akun Warga</h1>
                    <p className="text-gray-500 text-sm mt-1">Isi data dengan lengkap untuk mendaftar</p>
                </div>

                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-4">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Foto Diri Section */}
                    <div className="flex flex-col items-center mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Foto Diri
                        </label>
                        <div className="relative">
                            {fotoPreview ? (
                                <div className="relative">
                                    <img
                                        src={fotoPreview}
                                        alt="Preview"
                                        className="w-32 h-32 rounded-full object-cover border-4 border-blue-200"
                                    />
                                    <button
                                        type="button"
                                        onClick={removeFoto}
                                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                </div>
                            ) : (
                                <div className="w-32 h-32 rounded-full bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center">
                                    <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                    </svg>
                                </div>
                            )}
                        </div>

                        {/* Upload & Camera Buttons */}
                        <div className="flex gap-2 mt-3">
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleFileChange}
                                accept="image/*"
                                className="hidden"
                            />
                            <input
                                type="file"
                                ref={cameraInputRef}
                                onChange={handleFileChange}
                                accept="image/*"
                                capture="user"
                                className="hidden"
                            />
                            <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                className="flex items-center gap-1 px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                Upload
                            </button>
                            <button
                                type="button"
                                onClick={() => cameraInputRef.current?.click()}
                                className="flex items-center gap-1 px-3 py-1.5 text-sm bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg transition"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                                Kamera
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="md:col-span-2">
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
                                NIK (16 digit) *
                            </label>
                            <input
                                type="text"
                                value={formData.nik}
                                onChange={(e) => setFormData({ ...formData, nik: e.target.value.replace(/\D/g, '').slice(0, 16) })}
                                className="input-field"
                                maxLength={16}
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                No. KK
                            </label>
                            <input
                                type="text"
                                value={formData.no_kk}
                                onChange={(e) => setFormData({ ...formData, no_kk: e.target.value.replace(/\D/g, '').slice(0, 16) })}
                                className="input-field"
                                maxLength={16}
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
                                placeholder="cth: A1, B2"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                No. WhatsApp *
                            </label>
                            <input
                                type="text"
                                value={formData.no_whatsapp}
                                onChange={(e) => setFormData({ ...formData, no_whatsapp: e.target.value.replace(/\D/g, '') })}
                                className="input-field"
                                placeholder="08xxxxxxxxxx"
                                required
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
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Username *
                            </label>
                            <input
                                type="text"
                                value={formData.username}
                                onChange={(e) => setFormData({ ...formData, username: e.target.value.toLowerCase().replace(/\s/g, '') })}
                                className="input-field"
                                required
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Password *
                            </label>
                            <input
                                type="password"
                                value={formData.password}
                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                className="input-field"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Konfirmasi Password *
                            </label>
                            <input
                                type="password"
                                value={formData.confirmPassword}
                                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                                className="input-field"
                                required
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full btn-primary py-3 mt-4"
                    >
                        {loading ? 'Mendaftar...' : 'Daftar Sekarang'}
                    </button>
                </form>

                <p className="text-center text-gray-500 text-sm mt-6">
                    Sudah punya akun?{' '}
                    <Link to="/login" className="text-blue-600 hover:underline">
                        Masuk di sini
                    </Link>
                </p>
            </div>
        </div>
    );
}
