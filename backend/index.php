<?php
/**
 * REST API Router - Entry Point
 * Menangani semua request API
 */

// Enable CORS untuk frontend React
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json; charset=UTF-8");

// Handle preflight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Autoload
require_once __DIR__ . '/config/database.php';
require_once __DIR__ . '/models/Warga.php';
require_once __DIR__ . '/models/Tagihan.php';
require_once __DIR__ . '/models/Pembayaran.php';
require_once __DIR__ . '/models/JenisIuran.php';
require_once __DIR__ . '/models/AnggotaKeluarga.php';
require_once __DIR__ . '/controllers/AuthController.php';
require_once __DIR__ . '/controllers/LaporanController.php';
require_once __DIR__ . '/models/Pengumuman.php';

// Get request info
$method = $_SERVER['REQUEST_METHOD'];
$uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$uri = str_replace('/backend', '', $uri); // Remove base path
$uri = trim($uri, '/');
$segments = explode('/', $uri);

// Response helper
function jsonResponse($data, $code = 200) {
    http_response_code($code);
    echo json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
    exit();
}

// Auth middleware helper
function requireAuth() {
    $headers = getallheaders();
    $token = $headers['Authorization'] ?? '';
    $token = str_replace('Bearer ', '', $token);
    
    if (empty($token)) {
        jsonResponse(['success' => false, 'message' => 'Token tidak ditemukan'], 401);
    }
    
    $auth = new AuthController();
    $user = $auth->validateToken($token);
    
    if (!$user) {
        jsonResponse(['success' => false, 'message' => 'Token tidak valid atau expired'], 401);
    }
    
    return $user;
}

// Get JSON body
function getJsonBody() {
    return json_decode(file_get_contents('php://input'), true) ?? [];
}

// ==================================================
// ROUTING
// ==================================================

try {
    // Base route
    if (empty($segments[0]) || $segments[0] === 'api') {
        array_shift($segments); // Remove 'api' prefix
    }
    
    $resource = $segments[0] ?? '';
    $id = $segments[1] ?? null;
    $action = $segments[2] ?? null;
    
    switch ($resource) {
        
        // ==================================================
        // AUTH ROUTES
        // ==================================================
        case 'login':
            if ($method === 'POST') {
                $data = getJsonBody();
                $auth = new AuthController();
                $result = $auth->login($data['username'] ?? '', $data['password'] ?? '');
                jsonResponse($result, $result['success'] ? 200 : 401);
            }
            break;
            
        case 'logout':
            if ($method === 'POST') {
                $auth = new AuthController();
                jsonResponse($auth->logout());
            }
            break;
            
        case 'register':
            if ($method === 'POST') {
                // Registrasi mandiri (public) - status pending
                // Detect content type - bisa JSON atau multipart (untuk foto)
                $contentType = $_SERVER['CONTENT_TYPE'] ?? '';
                if (strpos($contentType, 'multipart/form-data') !== false) {
                    // Handle multipart form data (dengan foto)
                    $data = $_POST;
                } else {
                    // Handle JSON
                    $data = getJsonBody();
                }
                $auth = new AuthController();
                $result = $auth->selfRegister($data);
                jsonResponse($result, $result['success'] ? 201 : 400);
            }
            break;
            
        case 'pending-warga':
            $currentUser = requireAuth();
            $auth = new AuthController();
            if (!$auth->isAdmin($currentUser['id'])) {
                jsonResponse(['success' => false, 'message' => 'Akses ditolak'], 403);
            }
            
            $wargaModel = new Warga();
            
            if ($method === 'GET') {
                // Get all pending warga
                $data = $wargaModel->getPending();
                jsonResponse(['success' => true, 'data' => $data]);
            }
            break;
            
        case 'verify-warga':
            $currentUser = requireAuth();
            $auth = new AuthController();
            if (!$auth->isAdmin($currentUser['id'])) {
                jsonResponse(['success' => false, 'message' => 'Akses ditolak'], 403);
            }
            
            if ($method === 'PUT' && $id) {
                $data = getJsonBody();
                $action = $data['action'] ?? 'approve'; // approve or reject
                $wargaModel = new Warga();
                $result = $wargaModel->verifyWarga($id, $action);
                jsonResponse($result);
            }
            break;
            
        // ==================================================
        // WARGA ROUTES
        // ==================================================
        case 'warga':
            $wargaModel = new Warga();
            
            if ($method === 'GET') {
                if ($id) {
                    if ($action === 'tunggakan') {
                        // GET /warga/{id}/tunggakan
                        $data = $wargaModel->hitungTunggakan($id);
                        jsonResponse(['success' => true, 'data' => $data]);
                    } elseif ($action === 'dashboard') {
                        // GET /warga/{id}/dashboard
                        $data = $wargaModel->getDashboardData($id);
                        jsonResponse(['success' => true, 'data' => $data]);
                    } elseif ($action === 'keluarga') {
                        // GET /warga/{id}/keluarga - Get warga with family
                        $data = $wargaModel->getWithFamily($id);
                        jsonResponse(['success' => true, 'data' => $data]);
                    } else {
                        // GET /warga/{id}
                        $data = $wargaModel->getWithFamily($id); // Include family by default
                        jsonResponse(['success' => true, 'data' => $data]);
                    }
                } else {
                    // GET /warga
                    $data = $wargaModel->getAll();
                    jsonResponse(['success' => true, 'data' => $data]);
                }
            }
            
            if ($method === 'POST') {
                requireAuth();
                $data = getJsonBody();
                $result = $wargaModel->create($data);
                jsonResponse([
                    'success' => (bool)$result,
                    'message' => $result ? 'Warga berhasil ditambahkan' : 'Gagal menambahkan warga',
                    'id' => $result
                ], $result ? 201 : 400);
            }
            
            if ($method === 'PUT' && $id) {
                requireAuth();
                $data = getJsonBody();
                $result = $wargaModel->update($id, $data);
                jsonResponse([
                    'success' => $result,
                    'message' => $result ? 'Warga berhasil diupdate' : 'Gagal update warga'
                ]);
            }
            
            if ($method === 'DELETE' && $id) {
                requireAuth();
                $result = $wargaModel->delete($id);
                jsonResponse([
                    'success' => $result,
                    'message' => $result ? 'Warga berhasil dihapus' : 'Gagal hapus warga'
                ]);
            }
            break;
            
        // ==================================================
        // ANGGOTA KELUARGA ROUTES
        // ==================================================
        case 'anggota-keluarga':
            $anggotaModel = new AnggotaKeluarga();
            
            if ($method === 'GET') {
                if ($id) {
                    // GET /anggota-keluarga/{id}
                    $data = $anggotaModel->getById($id);
                    jsonResponse(['success' => true, 'data' => $data]);
                } elseif (isset($_GET['warga_id'])) {
                    // GET /anggota-keluarga?warga_id=X
                    $data = $anggotaModel->getByWarga($_GET['warga_id']);
                    jsonResponse(['success' => true, 'data' => $data]);
                } else {
                    jsonResponse(['success' => false, 'message' => 'Parameter warga_id diperlukan'], 400);
                }
            }
            
            if ($method === 'POST') {
                requireAuth();
                $data = getJsonBody();
                $result = $anggotaModel->create($data);
                jsonResponse([
                    'success' => (bool)$result,
                    'message' => $result ? 'Anggota keluarga berhasil ditambahkan' : 'Gagal',
                    'id' => $result
                ], $result ? 201 : 400);
            }
            
            if ($method === 'PUT' && $id) {
                requireAuth();
                $data = getJsonBody();
                $result = $anggotaModel->update($id, $data);
                jsonResponse([
                    'success' => $result,
                    'message' => $result ? 'Berhasil diupdate' : 'Gagal update'
                ]);
            }
            
            if ($method === 'DELETE' && $id) {
                requireAuth();
                $result = $anggotaModel->delete($id);
                jsonResponse([
                    'success' => $result,
                    'message' => $result ? 'Berhasil dihapus' : 'Gagal hapus'
                ]);
            }
            break;
            
        // ==================================================
        // TAGIHAN ROUTES
        // ==================================================
        case 'tagihan':
            $tagihanModel = new Tagihan();
            
            if ($method === 'GET') {
                if ($id) {
                    // GET /tagihan/{id}
                    $data = $tagihanModel->getById($id);
                    jsonResponse(['success' => true, 'data' => $data]);
                } else {
                    // GET /tagihan?status=belum_lunas
                    $status = $_GET['status'] ?? null;
                    if ($status === 'belum_lunas') {
                        $data = $tagihanModel->getTagihanBelumLunas();
                    } else {
                        // Filter by periode
                        $bulan = $_GET['bulan'] ?? date('n');
                        $tahun = $_GET['tahun'] ?? date('Y');
                        $data = $tagihanModel->getByPeriode($bulan, $tahun);
                    }
                    jsonResponse(['success' => true, 'data' => $data]);
                }
            }
            
            if ($method === 'POST') {
                requireAuth();
                $data = getJsonBody();
                
                // POST /tagihan/generate - Generate tagihan bulanan
                if ($id === 'generate') {
                    $bulan = $data['bulan'] ?? date('n');
                    $tahun = $data['tahun'] ?? date('Y');
                    $result = $tagihanModel->generateTagihanBulanan($bulan, $tahun);
                    jsonResponse($result, $result['success'] ? 200 : 400);
                }
            }
            break;
            
        // ==================================================
        // PEMBAYARAN ROUTES
        // ==================================================
        case 'pembayaran':
        case 'bayar':
            $pembayaranModel = new Pembayaran();
            
            if ($method === 'GET') {
                if ($id) {
                    // GET /pembayaran/{id}
                    $data = $pembayaranModel->getById($id);
                    jsonResponse(['success' => true, 'data' => $data]);
                } else {
                    // GET /pembayaran?pending=1
                    if (isset($_GET['pending'])) {
                        $data = $pembayaranModel->getPendingVerification();
                    } elseif (isset($_GET['warga_id'])) {
                        $data = $pembayaranModel->getByWarga($_GET['warga_id']);
                    } else {
                        $bulan = $_GET['bulan'] ?? date('n');
                        $tahun = $_GET['tahun'] ?? date('Y');
                        $data = $pembayaranModel->getLaporanBulanan($bulan, $tahun);
                    }
                    jsonResponse(['success' => true, 'data' => $data]);
                }
            }
            
            if ($method === 'POST') {
                $currentUser = requireAuth();
                $data = getJsonBody();
                
                // Handle file upload
                if (isset($_FILES['bukti_transfer'])) {
                    $filename = $pembayaranModel->uploadBukti($_FILES['bukti_transfer'], $data['warga_id']);
                    if ($filename) {
                        $data['bukti_transfer'] = $filename;
                    }
                }
                
                $data['verified_by'] = $currentUser['id'];
                $result = $pembayaranModel->create($data);
                jsonResponse($result, $result['success'] ? 201 : 400);
            }
            
            // PUT /pembayaran/{id}/verify
            if ($method === 'PUT' && $id && $action === 'verify') {
                $currentUser = requireAuth();
                $auth = new AuthController();
                if (!$auth->isAdmin($currentUser['id'])) {
                    jsonResponse(['success' => false, 'message' => 'Hanya admin yang bisa verifikasi'], 403);
                }
                
                $result = $pembayaranModel->verify($id, $currentUser['id']);
                jsonResponse([
                    'success' => $result,
                    'message' => $result ? 'Pembayaran berhasil diverifikasi' : 'Gagal verifikasi'
                ]);
            }
            break;
            
        // ==================================================
        // JENIS IURAN ROUTES
        // ==================================================
        case 'jenis-iuran':
            $jenisModel = new JenisIuran();
            
            if ($method === 'GET') {
                if ($id) {
                    $data = $jenisModel->getById($id);
                } else {
                    $data = $jenisModel->getAll();
                }
                jsonResponse(['success' => true, 'data' => $data]);
            }
            
            if ($method === 'POST') {
                requireAuth();
                $data = getJsonBody();
                $result = $jenisModel->create($data);
                jsonResponse([
                    'success' => (bool)$result,
                    'message' => $result ? 'Jenis iuran berhasil ditambahkan' : 'Gagal',
                    'id' => $result
                ], $result ? 201 : 400);
            }
            
            if ($method === 'PUT' && $id) {
                requireAuth();
                $data = getJsonBody();
                $result = $jenisModel->update($id, $data);
                jsonResponse([
                    'success' => $result,
                    'message' => $result ? 'Berhasil diupdate' : 'Gagal update'
                ]);
            }
            
            if ($method === 'DELETE' && $id) {
                requireAuth();
                $result = $jenisModel->delete($id);
                jsonResponse([
                    'success' => $result,
                    'message' => $result ? 'Berhasil dihapus' : 'Gagal hapus'
                ]);
            }
            break;
            
        // ==================================================
        // LAPORAN ROUTES
        // ==================================================
        case 'laporan':
            requireAuth();
            $laporanController = new LaporanController();
            
            if ($method === 'GET') {
                $bulan = $_GET['bulan'] ?? date('n');
                $tahun = $_GET['tahun'] ?? date('Y');
                
                switch ($id) {
                    case 'dashboard':
                        $result = $laporanController->getDashboardAdmin();
                        break;
                    case 'kas-bulanan':
                        $result = $laporanController->getLaporanKasBulanan($bulan, $tahun);
                        break;
                    case 'tunggakan':
                        $result = $laporanController->getLaporanTunggakan();
                        break;
                    case 'per-jenis':
                        $result = $laporanController->getLaporanPerJenisIuran($bulan, $tahun);
                        break;
                    default:
                        $result = ['success' => false, 'message' => 'Jenis laporan tidak valid'];
                }
                
                jsonResponse($result);
            }
            break;
            
        // ==================================================
        // PENGUMUMAN ROUTES
        // ==================================================
        case 'pengumuman':
            $pengumumanModel = new Pengumuman();
            
            if ($method === 'GET') {
                if ($id) {
                    // GET /pengumuman/{id}
                    $data = $pengumumanModel->getById($id);
                    jsonResponse(['success' => true, 'data' => $data]);
                } else {
                    // GET /pengumuman - semua user bisa akses
                    $data = $pengumumanModel->getAll();
                    jsonResponse(['success' => true, 'data' => $data]);
                }
            }
            
            if ($method === 'POST') {
                $currentUser = requireAuth();
                $auth = new AuthController();
                // Hanya admin yang bisa post pengumuman
                if (!$auth->isAdmin($currentUser['id'])) {
                    jsonResponse(['success' => false, 'message' => 'Hanya admin yang bisa membuat pengumuman'], 403);
                }
                
                $data = getJsonBody();
                $data['created_by'] = $currentUser['id'];
                $result = $pengumumanModel->create($data);
                jsonResponse([
                    'success' => (bool)$result,
                    'message' => $result ? 'Pengumuman berhasil dibuat' : 'Gagal membuat pengumuman',
                    'id' => $result
                ], $result ? 201 : 400);
            }
            
            if ($method === 'PUT' && $id) {
                $currentUser = requireAuth();
                $auth = new AuthController();
                if (!$auth->isAdmin($currentUser['id'])) {
                    jsonResponse(['success' => false, 'message' => 'Hanya admin yang bisa edit pengumuman'], 403);
                }
                
                $data = getJsonBody();
                $result = $pengumumanModel->update($id, $data);
                jsonResponse([
                    'success' => $result,
                    'message' => $result ? 'Pengumuman berhasil diupdate' : 'Gagal update pengumuman'
                ]);
            }
            
            if ($method === 'DELETE' && $id) {
                $currentUser = requireAuth();
                $auth = new AuthController();
                if (!$auth->isAdmin($currentUser['id'])) {
                    jsonResponse(['success' => false, 'message' => 'Hanya admin yang bisa hapus pengumuman'], 403);
                }
                
                $result = $pengumumanModel->delete($id);
                jsonResponse([
                    'success' => $result,
                    'message' => $result ? 'Pengumuman berhasil dihapus' : 'Gagal hapus pengumuman'
                ]);
            }
            break;
            
        // ==================================================
        // TUNGGAKAN ROUTES (Shortcut)
        // ==================================================
        case 'tunggakan':
            $wargaModel = new Warga();
            
            if ($method === 'GET') {
                $data = $wargaModel->getDaftarTunggakan();
                jsonResponse(['success' => true, 'data' => $data]);
            }
            break;
            
        // ==================================================
        // DEFAULT
        // ==================================================
        default:
            jsonResponse([
                'success' => true, 
                'message' => 'API Iuran RT v1.0',
                'endpoints' => [
                    'POST /api/login' => 'Login user',
                    'GET /api/warga' => 'List warga',
                    'GET /api/warga/{id}' => 'Detail warga + anggota keluarga',
                    'POST /api/warga' => 'Tambah warga (dengan anggota_keluarga array)',
                    'GET /api/anggota-keluarga?warga_id=X' => 'List anggota keluarga',
                    'POST /api/anggota-keluarga' => 'Tambah anggota keluarga',
                    'GET /api/tagihan' => 'List tagihan',
                    'POST /api/tagihan/generate' => 'Generate tagihan bulanan',
                    'POST /api/bayar' => 'Input pembayaran',
                    'GET /api/laporan/dashboard' => 'Dashboard admin',
                    'GET /api/tunggakan' => 'List tunggakan'
                ]
            ]);
    }
    
    // If we get here, method not allowed
    jsonResponse(['success' => false, 'message' => 'Method not allowed'], 405);
    
} catch (Exception $e) {
    error_log('API Error: ' . $e->getMessage());
    jsonResponse([
        'success' => false, 
        'message' => 'Server error: ' . $e->getMessage()
    ], 500);
}
