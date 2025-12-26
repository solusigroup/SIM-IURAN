<?php
/**
 * AuthController
 * Mengelola autentikasi dengan simple token (file-based storage)
 */

require_once __DIR__ . '/../config/database.php';

class AuthController {
    private $conn;
    private $tokenFile;
    
    public function __construct() {
        $database = new Database();
        $this->conn = $database->getConnection();
        $this->tokenFile = __DIR__ . '/../storage/tokens.json';
        
        // Ensure storage directory exists
        $storageDir = dirname($this->tokenFile);
        if (!is_dir($storageDir)) {
            mkdir($storageDir, 0755, true);
        }
    }
    
    /**
     * Load tokens from file
     */
    private function loadTokens() {
        if (file_exists($this->tokenFile)) {
            $content = file_get_contents($this->tokenFile);
            return json_decode($content, true) ?: [];
        }
        return [];
    }
    
    /**
     * Save tokens to file
     */
    private function saveTokens($tokens) {
        file_put_contents($this->tokenFile, json_encode($tokens, JSON_PRETTY_PRINT));
    }
    
    /**
     * Login user
     * @param string $username
     * @param string $password
     * @return array
     */
    public function login($username, $password) {
        $sql = "SELECT u.*, w.nama_lengkap, w.no_rumah 
                FROM users u 
                LEFT JOIN warga w ON u.warga_id = w.id
                WHERE u.username = :username AND u.is_active = TRUE";
        
        $stmt = $this->conn->prepare($sql);
        $stmt->execute(['username' => $username]);
        $user = $stmt->fetch();
        
        if ($user && password_verify($password, $user['password'])) {
            // Generate simple token
            $token = bin2hex(random_bytes(32));
            $expiry = time() + (24 * 60 * 60); // 24 jam
            
            // Update last login
            $sqlUpdate = "UPDATE users SET last_login = NOW() WHERE id = :id";
            $stmtUpdate = $this->conn->prepare($sqlUpdate);
            $stmtUpdate->execute(['id' => $user['id']]);
            
            // Save token to file
            $tokens = $this->loadTokens();
            $tokens[$token] = [
                'user_id' => $user['id'],
                'expiry' => $expiry
            ];
            $this->saveTokens($tokens);
            
            return [
                'success' => true,
                'message' => 'Login berhasil',
                'data' => [
                    'token' => $token,
                    'user' => [
                        'id' => $user['id'],
                        'username' => $user['username'],
                        'role' => $user['role'],
                        'warga_id' => $user['warga_id'],
                        'nama_lengkap' => $user['nama_lengkap'],
                        'no_rumah' => $user['no_rumah']
                    ],
                    'expires_at' => date('Y-m-d H:i:s', $expiry)
                ]
            ];
        }
        
        return [
            'success' => false,
            'message' => 'Username atau password salah'
        ];
    }
    
    /**
     * Validate token dari header
     * @param string $token
     * @return array|null User data jika valid
     */
    public function validateToken($token) {
        $tokens = $this->loadTokens();
        
        if (isset($tokens[$token])) {
            $tokenData = $tokens[$token];
            
            if ($tokenData['expiry'] > time()) {
                $sql = "SELECT u.*, w.nama_lengkap, w.no_rumah 
                        FROM users u 
                        LEFT JOIN warga w ON u.warga_id = w.id
                        WHERE u.id = :id";
                
                $stmt = $this->conn->prepare($sql);
                $stmt->execute(['id' => $tokenData['user_id']]);
                return $stmt->fetch();
            } else {
                // Token expired, remove it
                unset($tokens[$token]);
                $this->saveTokens($tokens);
            }
        }
        
        return null;
    }
    
    /**
     * Logout - remove token
     */
    public function logout() {
        $headers = getallheaders();
        $token = $headers['Authorization'] ?? '';
        $token = str_replace('Bearer ', '', $token);
        
        if ($token) {
            $tokens = $this->loadTokens();
            if (isset($tokens[$token])) {
                unset($tokens[$token]);
                $this->saveTokens($tokens);
            }
        }
        
        return [
            'success' => true,
            'message' => 'Logout berhasil'
        ];
    }
    
    /**
     * Register user baru (untuk warga)
     * @param array $data
     * @return array
     */
    public function register($data) {
        // Cek username sudah dipakai
        $sqlCheck = "SELECT id FROM users WHERE username = :username";
        $stmtCheck = $this->conn->prepare($sqlCheck);
        $stmtCheck->execute(['username' => $data['username']]);
        
        if ($stmtCheck->fetch()) {
            return [
                'success' => false,
                'message' => 'Username sudah digunakan'
            ];
        }
        
        $sql = "INSERT INTO users (username, password, role, warga_id) 
                VALUES (:username, :password, :role, :warga_id)";
        
        $stmt = $this->conn->prepare($sql);
        $result = $stmt->execute([
            'username' => $data['username'],
            'password' => password_hash($data['password'], PASSWORD_BCRYPT),
            'role' => $data['role'] ?? 'warga',
            'warga_id' => $data['warga_id'] ?? null
        ]);
        
        if ($result) {
            return [
                'success' => true,
                'message' => 'Registrasi berhasil',
                'user_id' => $this->conn->lastInsertId()
            ];
        }
        
        return [
            'success' => false,
            'message' => 'Gagal registrasi'
        ];
    }
    
    /**
     * Check apakah user adalah admin
     * @param int $user_id
     * @return bool
     */
    public function isAdmin($user_id) {
        $sql = "SELECT role FROM users WHERE id = :id";
        $stmt = $this->conn->prepare($sql);
        $stmt->execute(['id' => $user_id]);
        $user = $stmt->fetch();
        
        return $user && $user['role'] === 'admin';
    }
    
    /**
     * Registrasi mandiri warga (public)
     * @param array $data
     * @return array
     */
    public function selfRegister($data) {
        // Validasi field wajib
        $required = ['nama_lengkap', 'nik', 'no_rumah', 'no_whatsapp', 'username', 'password'];
        foreach ($required as $field) {
            if (empty($data[$field])) {
                return [
                    'success' => false,
                    'message' => "Field $field wajib diisi"
                ];
            }
        }
        
        // Cek username sudah ada
        $checkSql = "SELECT id FROM users WHERE username = :username";
        $checkStmt = $this->conn->prepare($checkSql);
        $checkStmt->execute(['username' => $data['username']]);
        if ($checkStmt->fetch()) {
            return [
                'success' => false,
                'message' => 'Username sudah terdaftar'
            ];
        }
        
        // Cek NIK sudah ada
        $checkNik = "SELECT id FROM warga WHERE nik = :nik";
        $checkStmt = $this->conn->prepare($checkNik);
        $checkStmt->execute(['nik' => $data['nik']]);
        if ($checkStmt->fetch()) {
            return [
                'success' => false,
                'message' => 'NIK sudah terdaftar'
            ];
        }
        
        try {
            $this->conn->beginTransaction();
            
            // Handle foto upload jika ada
            $foto_diri = null;
            if (isset($_FILES['foto_diri']) && $_FILES['foto_diri']['error'] === UPLOAD_ERR_OK) {
                $uploadDir = __DIR__ . '/../uploads/foto/';
                if (!is_dir($uploadDir)) {
                    mkdir($uploadDir, 0755, true);
                }
                
                $allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
                if (in_array($_FILES['foto_diri']['type'], $allowedTypes) && $_FILES['foto_diri']['size'] <= 5 * 1024 * 1024) {
                    $ext = pathinfo($_FILES['foto_diri']['name'], PATHINFO_EXTENSION);
                    $filename = sprintf('foto_reg_%s.%s', date('YmdHis') . rand(100,999), $ext);
                    
                    if (move_uploaded_file($_FILES['foto_diri']['tmp_name'], $uploadDir . $filename)) {
                        $foto_diri = 'foto/' . $filename;
                    }
                }
            }
            
            // Insert warga dengan status pending
            $wargaSql = "INSERT INTO warga (nama_lengkap, nik, no_kk, no_rumah, no_whatsapp, 
                         tempat_lahir, tanggal_lahir, foto_diri, status_huni, status_verifikasi, registered_at) 
                         VALUES (:nama_lengkap, :nik, :no_kk, :no_rumah, :no_whatsapp,
                         :tempat_lahir, :tanggal_lahir, :foto_diri, :status_huni, 'pending', NOW())";
            
            $wargaStmt = $this->conn->prepare($wargaSql);
            $wargaStmt->execute([
                'nama_lengkap' => $data['nama_lengkap'],
                'nik' => $data['nik'],
                'no_kk' => $data['no_kk'] ?? '',
                'no_rumah' => $data['no_rumah'],
                'no_whatsapp' => $data['no_whatsapp'],
                'tempat_lahir' => $data['tempat_lahir'] ?? '',
                'tanggal_lahir' => $data['tanggal_lahir'] ?? null,
                'foto_diri' => $foto_diri,
                'status_huni' => $data['status_huni'] ?? 'tetap'
            ]);
            
            $wargaId = $this->conn->lastInsertId();
            
            // Insert user dengan is_verified = false
            $userSql = "INSERT INTO users (username, password, role, warga_id, is_verified) 
                        VALUES (:username, :password, 'warga', :warga_id, FALSE)";
            
            $userStmt = $this->conn->prepare($userSql);
            $userStmt->execute([
                'username' => $data['username'],
                'password' => password_hash($data['password'], PASSWORD_DEFAULT),
                'warga_id' => $wargaId
            ]);
            
            $this->conn->commit();
            
            return [
                'success' => true,
                'message' => 'Registrasi berhasil! Menunggu verifikasi admin.',
                'warga_id' => $wargaId
            ];
            
        } catch (Exception $e) {
            $this->conn->rollBack();
            return [
                'success' => false,
                'message' => 'Gagal registrasi: ' . $e->getMessage()
            ];
        }
    }
}
