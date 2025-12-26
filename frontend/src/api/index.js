import axios from 'axios';

// Base URL API
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// Create axios instance
const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor - add auth token
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Response interceptor - handle errors
api.interceptors.response.use(
    (response) => response.data,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem('auth_token');
            localStorage.removeItem('user');
            window.location.href = '/login';
        }
        return Promise.reject(error.response?.data || error.message);
    }
);

// ========================================
// AUTH API
// ========================================
export const authApi = {
    login: (username, password) =>
        api.post('/login', { username, password }),

    logout: () => api.post('/logout'),
};

// ========================================
// WARGA API
// ========================================
export const wargaApi = {
    getAll: () => api.get('/warga'),

    getById: (id) => api.get(`/warga/${id}`),

    getDashboard: (id) => api.get(`/warga/${id}/dashboard`),

    getTunggakan: (id) => api.get(`/warga/${id}/tunggakan`),

    create: (data) => api.post('/warga', data),

    update: (id, data) => api.put(`/warga/${id}`, data),

    delete: (id) => api.delete(`/warga/${id}`),
};

// ========================================
// TAGIHAN API
// ========================================
export const tagihanApi = {
    getAll: (bulan, tahun) =>
        api.get('/tagihan', { params: { bulan, tahun } }),

    getBelumLunas: () =>
        api.get('/tagihan', { params: { status: 'belum_lunas' } }),

    getById: (id) => api.get(`/tagihan/${id}`),

    generate: (bulan, tahun) =>
        api.post('/tagihan/generate', { bulan, tahun }),
};

// ========================================
// PEMBAYARAN API
// ========================================
export const pembayaranApi = {
    create: (data) => api.post('/bayar', data),

    getByWarga: (wargaId) =>
        api.get('/pembayaran', { params: { warga_id: wargaId } }),

    getPending: () =>
        api.get('/pembayaran', { params: { pending: 1 } }),

    verify: (id) => api.put(`/pembayaran/${id}/verify`),

    getLaporan: (bulan, tahun) =>
        api.get('/pembayaran', { params: { bulan, tahun } }),
};

// ========================================
// JENIS IURAN API
// ========================================
export const jenisIuranApi = {
    getAll: () => api.get('/jenis-iuran'),

    create: (data) => api.post('/jenis-iuran', data),

    update: (id, data) => api.put(`/jenis-iuran/${id}`, data),

    delete: (id) => api.delete(`/jenis-iuran/${id}`),
};

// ========================================
// LAPORAN API
// ========================================
export const laporanApi = {
    getDashboard: () => api.get('/laporan/dashboard'),

    getKasBulanan: (bulan, tahun) =>
        api.get('/laporan/kas-bulanan', { params: { bulan, tahun } }),

    getTunggakan: () => api.get('/laporan/tunggakan'),

    getPerJenis: (bulan, tahun) =>
        api.get('/laporan/per-jenis', { params: { bulan, tahun } }),
};

// ========================================
// TUNGGAKAN API (Shortcut)
// ========================================
export const tunggakanApi = {
    getAll: () => api.get('/tunggakan'),
};

// ========================================
// ANGGOTA KELUARGA API
// ========================================
export const anggotaKeluargaApi = {
    getByWarga: (wargaId) =>
        api.get('/anggota-keluarga', { params: { warga_id: wargaId } }),

    getById: (id) => api.get(`/anggota-keluarga/${id}`),

    create: (data) => api.post('/anggota-keluarga', data),

    update: (id, data) => api.put(`/anggota-keluarga/${id}`, data),

    delete: (id) => api.delete(`/anggota-keluarga/${id}`),
};

// ========================================
// PENGUMUMAN API
// ========================================
export const pengumumanApi = {
    getAll: () => api.get('/pengumuman'),

    getById: (id) => api.get(`/pengumuman/${id}`),

    create: (data) => api.post('/pengumuman', data),

    update: (id, data) => api.put(`/pengumuman/${id}`, data),

    delete: (id) => api.delete(`/pengumuman/${id}`),
};

// ========================================
// REGISTRASI & VERIFIKASI API
// ========================================
export const registrasiApi = {
    selfRegister: (data) => api.post('/register', data),

    selfRegisterWithFile: (formData) => api.post('/register', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    }),

    getPending: () => api.get('/pending-warga'),

    verify: (id, action) => api.put(`/verify-warga/${id}`, { action }),
};

export default api;
