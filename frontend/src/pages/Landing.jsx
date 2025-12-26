import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Landing() {
    const navigate = useNavigate();
    const { isLoggedIn, isAdmin } = useAuth();

    // If already logged in, redirect to appropriate dashboard
    if (isLoggedIn) {
        return <Navigate to={isAdmin ? '/admin' : '/dashboard'} replace />;
    }

    const handleRoleSelect = (role) => {
        sessionStorage.setItem('selectedRole', role);
        navigate('/login');
    };

    return (
        <div className="min-h-screen flex">
            {/* Left Panel - Branding & Value Props */}
            <div className="hidden lg:flex lg:w-2/5 bg-gradient-to-br from-indigo-900 via-purple-900 to-indigo-800 relative overflow-hidden">
                {/* Geometric Pattern Overlay */}
                <div className="absolute inset-0 opacity-10">
                    <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                        <pattern id="hexagons" x="0" y="0" width="20" height="23.1" patternUnits="userSpaceOnUse">
                            <polygon
                                points="10,0 20,5.77 20,17.32 10,23.1 0,17.32 0,5.77"
                                fill="none"
                                stroke="white"
                                strokeWidth="0.5"
                            />
                        </pattern>
                        <rect width="100%" height="100%" fill="url(#hexagons)" />
                    </svg>
                </div>

                {/* Content */}
                <div className="relative z-10 flex flex-col justify-center px-12 py-8">
                    {/* Logo */}
                    <div className="mb-8">
                        <div className="inline-flex items-center justify-center w-16 h-16 bg-white/10 backdrop-blur-sm rounded-2xl mb-6">
                            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                                    d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                            </svg>
                        </div>
                        <h1 className="text-3xl font-bold text-white mb-3">SIM-RT Digital</h1>
                        <p className="text-lg text-purple-200 leading-relaxed">
                            Sistem Informasi Manajemen Keuangan & Data Warga Terpadu
                        </p>
                    </div>

                    {/* Features */}
                    <div className="space-y-4 mt-8">
                        <div className="flex items-center space-x-4">
                            <div className="flex-shrink-0 w-10 h-10 bg-green-500/20 rounded-full flex items-center justify-center">
                                <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                            <span className="text-white text-lg">Transparansi Iuran</span>
                        </div>
                        <div className="flex items-center space-x-4">
                            <div className="flex-shrink-0 w-10 h-10 bg-green-500/20 rounded-full flex items-center justify-center">
                                <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                            <span className="text-white text-lg">Monitoring Tunggakan</span>
                        </div>
                        <div className="flex items-center space-x-4">
                            <div className="flex-shrink-0 w-10 h-10 bg-green-500/20 rounded-full flex items-center justify-center">
                                <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                            <span className="text-white text-lg">Laporan Realtime</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Panel - Welcome & Login Options */}
            <div className="w-full lg:w-3/5 bg-gray-50 flex items-center justify-center p-6">
                <div className="w-full max-w-md">
                    {/* Mobile Logo (shown only on small screens) */}
                    <div className="lg:hidden text-center mb-8">
                        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl mb-4 shadow-lg">
                            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                    d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                            </svg>
                        </div>
                        <h1 className="text-xl font-bold text-gray-800">SIM-RT Digital</h1>
                    </div>

                    {/* Main Card */}
                    <div className="bg-white rounded-2xl shadow-xl p-8">
                        {/* Header */}
                        <div className="text-center mb-8">
                            <h2 className="text-2xl font-bold text-gray-800">Selamat Datang</h2>
                            <p className="text-gray-500 mt-2">Silakan pilih akses masuk Anda</p>
                        </div>

                        {/* Role Selection */}
                        <div className="space-y-4">
                            {/* Pengurus RT Option */}
                            <button
                                onClick={() => handleRoleSelect('admin')}
                                className="w-full flex items-center p-4 rounded-xl border-2 border-blue-200 bg-blue-50 hover:bg-blue-100 hover:border-blue-400 transition-all duration-200 group"
                            >
                                <div className="w-14 h-14 rounded-full bg-blue-100 flex items-center justify-center mr-4 group-hover:bg-blue-200 transition-colors">
                                    <svg className="w-7 h-7 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                            d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                    </svg>
                                </div>
                                <div className="flex-1 text-left">
                                    <h3 className="text-lg font-semibold text-gray-800">Pengurus RT</h3>
                                    <p className="text-sm text-gray-500">Akses dashboard, input data, laporan</p>
                                </div>
                                <svg className="w-5 h-5 text-gray-400 group-hover:text-blue-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                            </button>

                            {/* Warga Option */}
                            <button
                                onClick={() => handleRoleSelect('warga')}
                                className="w-full flex items-center p-4 rounded-xl border-2 border-gray-200 bg-white hover:bg-green-50 hover:border-green-400 transition-all duration-200 group"
                            >
                                <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center mr-4 group-hover:bg-green-200 transition-colors">
                                    <svg className="w-7 h-7 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                    </svg>
                                </div>
                                <div className="flex-1 text-left">
                                    <h3 className="text-lg font-semibold text-gray-800">Warga</h3>
                                    <p className="text-sm text-gray-500">Cek status iuran & data diri</p>
                                </div>
                                <svg className="w-5 h-5 text-gray-400 group-hover:text-green-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                            </button>
                        </div>

                        {/* Register Link */}
                        <div className="mt-6 text-center">
                            <p className="text-gray-500 text-sm">
                                Belum terdaftar?{' '}
                                <button
                                    onClick={() => navigate('/register')}
                                    className="text-blue-600 hover:underline font-medium"
                                >
                                    Daftar sebagai Warga
                                </button>
                            </p>
                        </div>

                        {/* Footer */}
                        <div className="mt-4 text-center">
                            <p className="text-xs text-gray-400">
                                Versi 1.0.0 • © 2025 SIM-RT
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
