import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import Landing from './pages/Landing';
import Login from './pages/Login';
import DashboardWarga from './pages/DashboardWarga';
import DashboardAdmin from './pages/DashboardAdmin';
import WargaManagement from './pages/admin/WargaManagement';
import TagihanManagement from './pages/admin/TagihanManagement';
import PembayaranManagement from './pages/admin/PembayaranManagement';
import LaporanPage from './pages/admin/LaporanPage';
import JenisIuranManagement from './pages/admin/JenisIuranManagement';
import VerifikasiWarga from './pages/admin/VerifikasiWarga';
import Register from './pages/Register';
import BayarIuran from './pages/warga/BayarIuran';
import './index.css';

// Protected Route wrapper
function ProtectedRoute({ children, adminOnly = false }) {
    const { isLoggedIn, isAdmin, loading } = useAuth();

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (!isLoggedIn) {
        return <Navigate to="/login" replace />;
    }

    if (adminOnly && !isAdmin) {
        return <Navigate to="/dashboard" replace />;
    }

    return <Layout>{children}</Layout>;
}

function AppRoutes() {
    const { isLoggedIn, isAdmin } = useAuth();

    return (
        <Routes>
            {/* Public */}
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* Warga Routes */}
            <Route
                path="/dashboard"
                element={
                    <ProtectedRoute>
                        <DashboardWarga />
                    </ProtectedRoute>
                }
            />
            <Route
                path="/bayar"
                element={
                    <ProtectedRoute>
                        <BayarIuran />
                    </ProtectedRoute>
                }
            />

            {/* Admin Routes */}
            <Route
                path="/admin"
                element={
                    <ProtectedRoute adminOnly>
                        <DashboardAdmin />
                    </ProtectedRoute>
                }
            />
            <Route
                path="/admin/warga"
                element={
                    <ProtectedRoute adminOnly>
                        <WargaManagement />
                    </ProtectedRoute>
                }
            />
            <Route
                path="/admin/tagihan"
                element={
                    <ProtectedRoute adminOnly>
                        <TagihanManagement />
                    </ProtectedRoute>
                }
            />
            <Route
                path="/admin/pembayaran"
                element={
                    <ProtectedRoute adminOnly>
                        <PembayaranManagement />
                    </ProtectedRoute>
                }
            />
            <Route
                path="/admin/jenis-iuran"
                element={
                    <ProtectedRoute adminOnly>
                        <JenisIuranManagement />
                    </ProtectedRoute>
                }
            />
            <Route
                path="/admin/laporan"
                element={
                    <ProtectedRoute adminOnly>
                        <LaporanPage />
                    </ProtectedRoute>
                }
            />
            <Route
                path="/admin/verifikasi"
                element={
                    <ProtectedRoute adminOnly>
                        <VerifikasiWarga />
                    </ProtectedRoute>
                }
            />


            {/* Default redirect */}
            <Route
                path="*"
                element={
                    isLoggedIn
                        ? <Navigate to={isAdmin ? "/admin" : "/dashboard"} replace />
                        : <Navigate to="/" replace />
                }
            />
        </Routes>
    );
}

export default function App() {
    return (
        <BrowserRouter>
            <AuthProvider>
                <AppRoutes />
            </AuthProvider>
        </BrowserRouter>
    );
}
