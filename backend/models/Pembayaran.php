<?php
/**
 * Model Pembayaran
 * Mengelola record pembayaran iuran
 */

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/Tagihan.php';

class Pembayaran {
    private $conn;
    private $table = 'pembayaran';
    
    public function __construct() {
        $database = new Database();
        $this->conn = $database->getConnection();
    }
    
    /**
     * Record pembayaran baru
     * @param array $data
     * @return array
     */
    public function create($data) {
        try {
            $this->conn->beginTransaction();
            
            $sql = "INSERT INTO {$this->table} 
                    (warga_id, tagihan_id, tanggal_bayar, jumlah_bayar, metode_bayar, bukti_transfer, keterangan) 
                    VALUES (:warga_id, :tagihan_id, :tanggal_bayar, :jumlah_bayar, :metode_bayar, :bukti_transfer, :keterangan)";
            
            $stmt = $this->conn->prepare($sql);
            $result = $stmt->execute([
                'warga_id' => $data['warga_id'],
                'tagihan_id' => $data['tagihan_id'] ?? null,
                'tanggal_bayar' => $data['tanggal_bayar'] ?? date('Y-m-d'),
                'jumlah_bayar' => $data['jumlah_bayar'],
                'metode_bayar' => $data['metode_bayar'] ?? 'tunai',
                'bukti_transfer' => $data['bukti_transfer'] ?? null,
                'keterangan' => $data['keterangan'] ?? null
            ]);
            
            $pembayaranId = $this->conn->lastInsertId();
            
            // Jika pembayaran tunai, langsung verified
            if (($data['metode_bayar'] ?? 'tunai') === 'tunai') {
                $this->verify($pembayaranId, $data['verified_by'] ?? null);
            }
            
            $this->conn->commit();
            
            return [
                'success' => true,
                'message' => 'Pembayaran berhasil dicatat',
                'pembayaran_id' => $pembayaranId
            ];
            
        } catch (Exception $e) {
            $this->conn->rollBack();
            return [
                'success' => false,
                'message' => 'Gagal mencatat pembayaran: ' . $e->getMessage()
            ];
        }
    }
    
    /**
     * Verifikasi pembayaran (untuk transfer)
     * @param int $id
     * @param int|null $verified_by User ID admin
     * @return bool
     */
    public function verify($id, $verified_by = null) {
        $sql = "UPDATE {$this->table} 
                SET verified = TRUE, verified_by = :verified_by, verified_at = NOW()
                WHERE id = :id";
        
        $stmt = $this->conn->prepare($sql);
        $result = $stmt->execute([
            'id' => $id,
            'verified_by' => $verified_by
        ]);
        
        // Update status tagihan jika ada
        if ($result) {
            $pembayaran = $this->getById($id);
            if ($pembayaran && $pembayaran['tagihan_id']) {
                $tagihanModel = new Tagihan();
                $tagihanModel->updateStatus($pembayaran['tagihan_id']);
            }
        }
        
        return $result;
    }
    
    /**
     * Get pembayaran by ID
     * @param int $id
     * @return array|null
     */
    public function getById($id) {
        $sql = "SELECT p.*, w.nama_lengkap, w.no_rumah
                FROM {$this->table} p
                JOIN warga w ON p.warga_id = w.id
                WHERE p.id = :id";
        
        $stmt = $this->conn->prepare($sql);
        $stmt->execute(['id' => $id]);
        return $stmt->fetch();
    }
    
    /**
     * Get pembayaran by warga
     * @param int $warga_id
     * @return array
     */
    public function getByWarga($warga_id) {
        $sql = "SELECT p.*, 
                CONCAT(t.bulan, '/', t.tahun) AS periode
                FROM {$this->table} p
                LEFT JOIN tagihan t ON p.tagihan_id = t.id
                WHERE p.warga_id = :warga_id
                ORDER BY p.tanggal_bayar DESC";
        
        $stmt = $this->conn->prepare($sql);
        $stmt->execute(['warga_id' => $warga_id]);
        return $stmt->fetchAll();
    }
    
    /**
     * Get pembayaran pending verification
     * @return array
     */
    public function getPendingVerification() {
        $sql = "SELECT p.*, w.nama_lengkap, w.no_rumah, w.no_whatsapp
                FROM {$this->table} p
                JOIN warga w ON p.warga_id = w.id
                WHERE p.verified = FALSE
                ORDER BY p.created_at DESC";
        
        $stmt = $this->conn->prepare($sql);
        $stmt->execute();
        return $stmt->fetchAll();
    }
    
    /**
     * Get laporan penerimaan bulanan
     * @param int $bulan
     * @param int $tahun
     * @return array
     */
    public function getLaporanBulanan($bulan, $tahun) {
        $sql = "
            SELECT 
                p.*,
                w.nama_lengkap,
                w.no_rumah,
                CONCAT(t.bulan, '/', t.tahun) AS periode_tagihan
            FROM {$this->table} p
            JOIN warga w ON p.warga_id = w.id
            LEFT JOIN tagihan t ON p.tagihan_id = t.id
            WHERE MONTH(p.tanggal_bayar) = :bulan 
            AND YEAR(p.tanggal_bayar) = :tahun
            AND p.verified = TRUE
            ORDER BY p.tanggal_bayar DESC
        ";
        
        $stmt = $this->conn->prepare($sql);
        $stmt->execute(['bulan' => $bulan, 'tahun' => $tahun]);
        $data = $stmt->fetchAll();
        
        // Hitung total
        $total = array_sum(array_column($data, 'jumlah_bayar'));
        
        return [
            'periode' => sprintf('%02d/%d', $bulan, $tahun),
            'transaksi' => $data,
            'jumlah_transaksi' => count($data),
            'total_penerimaan' => $total
        ];
    }
    
    /**
     * Get rekap per jenis pembayaran (tunai vs transfer)
     * @param int $bulan
     * @param int $tahun
     * @return array
     */
    public function getRekapPerMetode($bulan, $tahun) {
        $sql = "
            SELECT 
                metode_bayar,
                COUNT(*) AS jumlah_transaksi,
                SUM(jumlah_bayar) AS total
            FROM {$this->table}
            WHERE MONTH(tanggal_bayar) = :bulan 
            AND YEAR(tanggal_bayar) = :tahun
            AND verified = TRUE
            GROUP BY metode_bayar
        ";
        
        $stmt = $this->conn->prepare($sql);
        $stmt->execute(['bulan' => $bulan, 'tahun' => $tahun]);
        return $stmt->fetchAll();
    }
    
    /**
     * Handle upload bukti transfer
     * @param array $file $_FILES['bukti_transfer']
     * @param int $warga_id
     * @return string|false Filename on success
     */
    public function uploadBukti($file, $warga_id) {
        $uploadDir = __DIR__ . '/../uploads/bukti/';
        
        // Create directory if not exists
        if (!is_dir($uploadDir)) {
            mkdir($uploadDir, 0755, true);
        }
        
        // Validate file
        $allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        if (!in_array($file['type'], $allowedTypes)) {
            return false;
        }
        
        $maxSize = 2 * 1024 * 1024; // 2MB
        if ($file['size'] > $maxSize) {
            return false;
        }
        
        // Generate unique filename
        $ext = pathinfo($file['name'], PATHINFO_EXTENSION);
        $filename = sprintf('bukti_%d_%s.%s', $warga_id, date('YmdHis'), $ext);
        $filepath = $uploadDir . $filename;
        
        if (move_uploaded_file($file['tmp_name'], $filepath)) {
            return 'bukti/' . $filename;
        }
        
        return false;
    }
}
