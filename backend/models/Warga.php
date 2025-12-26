<?php
/**
 * Model Warga
 * Mengelola data warga dan perhitungan tunggakan
 */

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/AnggotaKeluarga.php';

class Warga {
    private $conn;
    private $table = 'warga';
    
    public function __construct() {
        $database = new Database();
        $this->conn = $database->getConnection();
    }
    
    /**
     * ============================================
     * LOGIC PERHITUNGAN TUNGGAKAN
     * ============================================
     * 
     * Formula:
     * Total Tunggakan = Saldo Awal + Total Tagihan - Total Pembayaran
     * 
     * - Saldo Awal: Hutang sebelum sistem berjalan (manual input)
     * - Total Tagihan: Sum dari semua tagihan yang ter-generate
     * - Total Pembayaran: Sum dari semua pembayaran yang sudah diverifikasi
     */
    
    /**
     * Hitung total tunggakan untuk satu warga
     * @param int $warga_id
     * @return array
     */
    public function hitungTunggakan($warga_id) {
        $sql = "
            SELECT 
                w.id,
                w.nama_lengkap,
                w.no_rumah,
                w.saldo_awal_tunggakan,
                COALESCE(
                    (SELECT SUM(t.total_tagihan) 
                     FROM tagihan t 
                     WHERE t.warga_id = w.id), 0
                ) AS total_tagihan,
                COALESCE(
                    (SELECT SUM(p.jumlah_bayar) 
                     FROM pembayaran p 
                     WHERE p.warga_id = w.id 
                     AND p.verified = TRUE), 0
                ) AS total_pembayaran
            FROM warga w
            WHERE w.id = :warga_id
        ";
        
        $stmt = $this->conn->prepare($sql);
        $stmt->execute(['warga_id' => $warga_id]);
        $data = $stmt->fetch();
        
        if ($data) {
            // Kalkulasi tunggakan
            $data['total_tunggakan'] = 
                floatval($data['saldo_awal_tunggakan']) + 
                floatval($data['total_tagihan']) - 
                floatval($data['total_pembayaran']);
                
            // Tambahkan status
            $data['status_tunggakan'] = $data['total_tunggakan'] > 0 ? 'Memiliki Tunggakan' : 'Lunas';
        }
        
        return $data;
    }
    
    /**
     * Get daftar warga dengan tunggakan (untuk admin)
     * Diurutkan dari tunggakan terbesar
     * @return array
     */
    public function getDaftarTunggakan() {
        $sql = "
            SELECT 
                w.id,
                w.nama_lengkap,
                w.no_rumah,
                w.no_whatsapp,
                w.saldo_awal_tunggakan,
                COALESCE(tagihan_sum.total, 0) AS total_tagihan,
                COALESCE(bayar_sum.total, 0) AS total_pembayaran,
                (
                    w.saldo_awal_tunggakan + 
                    COALESCE(tagihan_sum.total, 0) - 
                    COALESCE(bayar_sum.total, 0)
                ) AS total_tunggakan
            FROM warga w
            LEFT JOIN (
                SELECT warga_id, SUM(total_tagihan) AS total
                FROM tagihan
                GROUP BY warga_id
            ) tagihan_sum ON w.id = tagihan_sum.warga_id
            LEFT JOIN (
                SELECT warga_id, SUM(jumlah_bayar) AS total
                FROM pembayaran
                WHERE verified = TRUE
                GROUP BY warga_id
            ) bayar_sum ON w.id = bayar_sum.warga_id
            WHERE w.is_active = TRUE
            HAVING total_tunggakan > 0
            ORDER BY total_tunggakan DESC
        ";
        
        $stmt = $this->conn->prepare($sql);
        $stmt->execute();
        
        return $stmt->fetchAll();
    }
    
    /**
     * Get detail tunggakan per bulan untuk seorang warga
     * @param int $warga_id
     * @return array
     */
    public function getDetailTunggakanPerBulan($warga_id) {
        $sql = "
            SELECT 
                t.id AS tagihan_id,
                t.bulan,
                t.tahun,
                t.total_tagihan,
                t.status,
                COALESCE(
                    (SELECT SUM(p.jumlah_bayar) 
                     FROM pembayaran p 
                     WHERE p.tagihan_id = t.id 
                     AND p.verified = TRUE), 0
                ) AS sudah_dibayar,
                (t.total_tagihan - COALESCE(
                    (SELECT SUM(p.jumlah_bayar) 
                     FROM pembayaran p 
                     WHERE p.tagihan_id = t.id 
                     AND p.verified = TRUE), 0)
                ) AS sisa_tagihan
            FROM tagihan t
            WHERE t.warga_id = :warga_id
            ORDER BY t.tahun DESC, t.bulan DESC
        ";
        
        $stmt = $this->conn->prepare($sql);
        $stmt->execute(['warga_id' => $warga_id]);
        
        return $stmt->fetchAll();
    }
    
    /**
     * Get detail tagihan dengan breakdown per jenis iuran
     * @param int $tagihan_id
     * @return array
     */
    public function getDetailTagihanPerJenis($tagihan_id) {
        $sql = "
            SELECT 
                dt.id,
                ji.nama_iuran,
                dt.nominal,
                COALESCE(
                    (SELECT SUM(p.jumlah_bayar) 
                     FROM pembayaran p 
                     WHERE p.tagihan_id = dt.tagihan_id), 0
                ) AS total_bayar_tagihan
            FROM detail_tagihan dt
            JOIN jenis_iuran ji ON dt.jenis_iuran_id = ji.id
            WHERE dt.tagihan_id = :tagihan_id
        ";
        
        $stmt = $this->conn->prepare($sql);
        $stmt->execute(['tagihan_id' => $tagihan_id]);
        
        return $stmt->fetchAll();
    }
    
    /**
     * Get dashboard data untuk warga (dipakai di frontend)
     * @param int $warga_id
     * @return array
     */
    public function getDashboardData($warga_id) {
        // Data tunggakan
        $tunggakan = $this->hitungTunggakan($warga_id);
        
        // Detail per bulan
        $detailBulan = $this->getDetailTunggakanPerBulan($warga_id);
        
        // Histori pembayaran terakhir (5 terakhir)
        $sql = "
            SELECT 
                p.id,
                p.tanggal_bayar,
                p.jumlah_bayar,
                p.metode_bayar,
                p.verified,
                CONCAT(t.bulan, '/', t.tahun) AS periode
            FROM pembayaran p
            LEFT JOIN tagihan t ON p.tagihan_id = t.id
            WHERE p.warga_id = :warga_id
            ORDER BY p.tanggal_bayar DESC
            LIMIT 5
        ";
        $stmt = $this->conn->prepare($sql);
        $stmt->execute(['warga_id' => $warga_id]);
        $historiPembayaran = $stmt->fetchAll();
        
        return [
            'ringkasan' => $tunggakan,
            'tagihan_per_bulan' => $detailBulan,
            'histori_pembayaran' => $historiPembayaran
        ];
    }
    
    // ============================================
    // CRUD OPERATIONS
    // ============================================
    
    /**
     * Get all active warga
     * @return array
     */
    public function getAll() {
        $sql = "SELECT * FROM {$this->table} WHERE is_active = TRUE ORDER BY no_rumah";
        $stmt = $this->conn->prepare($sql);
        $stmt->execute();
        return $stmt->fetchAll();
    }
    
    /**
     * Get single warga by ID
     * @param int $id
     * @return array|null
     */
    public function getById($id) {
        $sql = "SELECT * FROM {$this->table} WHERE id = :id";
        $stmt = $this->conn->prepare($sql);
        $stmt->execute(['id' => $id]);
        return $stmt->fetch();
    }
    
    /**
     * Create new warga
     * @param array $data
     * @return int|false
     */
    public function create($data) {
        $sql = "INSERT INTO {$this->table} 
                (nama_lengkap, nik, no_kk, tempat_lahir, tanggal_lahir, foto_diri, no_whatsapp, no_rumah, status_huni, saldo_awal_tunggakan) 
                VALUES (:nama_lengkap, :nik, :no_kk, :tempat_lahir, :tanggal_lahir, :foto_diri, :no_whatsapp, :no_rumah, :status_huni, :saldo_awal_tunggakan)";
        
        $stmt = $this->conn->prepare($sql);
        $result = $stmt->execute([
            'nama_lengkap' => $data['nama_lengkap'],
            'nik' => $data['nik'],
            'no_kk' => $data['no_kk'],
            'tempat_lahir' => $data['tempat_lahir'],
            'tanggal_lahir' => $data['tanggal_lahir'],
            'foto_diri' => $data['foto_diri'] ?? null,
            'no_whatsapp' => $data['no_whatsapp'],
            'no_rumah' => $data['no_rumah'],
            'status_huni' => $data['status_huni'] ?? 'tetap',
            'saldo_awal_tunggakan' => $data['saldo_awal_tunggakan'] ?? 0
        ]);
        
        $wargaId = $result ? $this->conn->lastInsertId() : false;
        
        // Jika ada anggota keluarga, simpan juga
        if ($wargaId && isset($data['anggota_keluarga']) && is_array($data['anggota_keluarga'])) {
            $anggotaModel = new AnggotaKeluarga();
            $anggotaModel->batchCreate($wargaId, $data['anggota_keluarga']);
        }
        
        return $wargaId;
    }
    
    /**
     * Update warga
     * @param int $id
     * @param array $data
     * @return bool
     */
    public function update($id, $data) {
        $sql = "UPDATE {$this->table} SET 
                nama_lengkap = :nama_lengkap,
                nik = :nik,
                no_kk = :no_kk,
                tempat_lahir = :tempat_lahir,
                tanggal_lahir = :tanggal_lahir,
                foto_diri = :foto_diri,
                no_whatsapp = :no_whatsapp,
                no_rumah = :no_rumah,
                status_huni = :status_huni,
                saldo_awal_tunggakan = :saldo_awal_tunggakan
                WHERE id = :id";
        
        $stmt = $this->conn->prepare($sql);
        return $stmt->execute([
            'id' => $id,
            'nama_lengkap' => $data['nama_lengkap'],
            'nik' => $data['nik'],
            'no_kk' => $data['no_kk'],
            'tempat_lahir' => $data['tempat_lahir'],
            'tanggal_lahir' => $data['tanggal_lahir'],
            'foto_diri' => $data['foto_diri'] ?? null,
            'no_whatsapp' => $data['no_whatsapp'],
            'no_rumah' => $data['no_rumah'],
            'status_huni' => $data['status_huni'] ?? 'tetap',
            'saldo_awal_tunggakan' => $data['saldo_awal_tunggakan'] ?? 0
        ]);
    }
    
    /**
     * Get warga dengan anggota keluarga
     * @param int $id
     * @return array|null
     */
    public function getWithFamily($id) {
        $warga = $this->getById($id);
        
        if ($warga) {
            $anggotaModel = new AnggotaKeluarga();
            $warga['anggota_keluarga'] = $anggotaModel->getByWarga($id);
            $warga['jumlah_anggota'] = count($warga['anggota_keluarga']);
        }
        
        return $warga;
    }
    
    /**
     * Upload foto warga
     * @param array $file $_FILES['foto_diri']
     * @param int $warga_id
     * @return string|false Filename on success
     */
    public function uploadFoto($file, $warga_id) {
        $uploadDir = __DIR__ . '/../uploads/foto/';
        
        // Create directory if not exists
        if (!is_dir($uploadDir)) {
            mkdir($uploadDir, 0755, true);
        }
        
        // Validate file
        $allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        if (!in_array($file['type'], $allowedTypes)) {
            return false;
        }
        
        $maxSize = 5 * 1024 * 1024; // 5MB
        if ($file['size'] > $maxSize) {
            return false;
        }
        
        // Generate unique filename
        $ext = pathinfo($file['name'], PATHINFO_EXTENSION);
        $filename = sprintf('foto_%d_%s.%s', $warga_id, date('YmdHis'), $ext);
        $filepath = $uploadDir . $filename;
        
        if (move_uploaded_file($file['tmp_name'], $filepath)) {
            // Update database
            $sql = "UPDATE {$this->table} SET foto_diri = :foto WHERE id = :id";
            $stmt = $this->conn->prepare($sql);
            $stmt->execute(['foto' => 'foto/' . $filename, 'id' => $warga_id]);
            
            return 'foto/' . $filename;
        }
        
        return false;
    }
    
    /**
     * Soft delete warga
     * @param int $id
     * @return bool
     */
    public function delete($id) {
        $sql = "UPDATE {$this->table} SET is_active = FALSE WHERE id = :id";
        $stmt = $this->conn->prepare($sql);
        return $stmt->execute(['id' => $id]);
    }
    
    /**
     * Get warga dengan status pending (untuk verifikasi admin)
     * @return array
     */
    public function getPending() {
        $sql = "
            SELECT w.*, u.username, u.created_at AS user_created_at
            FROM {$this->table} w
            JOIN users u ON u.warga_id = w.id
            WHERE w.status_verifikasi = 'pending'
            ORDER BY w.registered_at DESC
        ";
        $stmt = $this->conn->prepare($sql);
        $stmt->execute();
        return $stmt->fetchAll();
    }
    
    /**
     * Verifikasi warga (approve/reject)
     * @param int $id
     * @param string $action approve|reject
     * @return array
     */
    public function verifyWarga($id, $action) {
        try {
            $this->conn->beginTransaction();
            
            // Update status warga
            $newStatus = $action === 'approve' ? 'verified' : 'rejected';
            $sql = "UPDATE {$this->table} SET status_verifikasi = :status WHERE id = :id";
            $stmt = $this->conn->prepare($sql);
            $stmt->execute(['status' => $newStatus, 'id' => $id]);
            
            // Update user is_verified
            $isVerified = $action === 'approve' ? 1 : 0;
            $sql = "UPDATE users SET is_verified = :verified WHERE warga_id = :warga_id";
            $stmt = $this->conn->prepare($sql);
            $stmt->execute(['verified' => $isVerified, 'warga_id' => $id]);
            
            // Jika reject, nonaktifkan warga
            if ($action === 'reject') {
                $sql = "UPDATE {$this->table} SET is_active = FALSE WHERE id = :id";
                $stmt = $this->conn->prepare($sql);
                $stmt->execute(['id' => $id]);
            }
            
            $this->conn->commit();
            
            return [
                'success' => true,
                'message' => $action === 'approve' 
                    ? 'Warga berhasil diverifikasi' 
                    : 'Pendaftaran warga ditolak'
            ];
            
        } catch (Exception $e) {
            $this->conn->rollBack();
            return [
                'success' => false,
                'message' => 'Gagal memproses: ' . $e->getMessage()
            ];
        }
    }
}

