<?php
/**
 * Model Tagihan
 * Mengelola invoice bulanan
 */

require_once __DIR__ . '/../config/database.php';

class Tagihan {
    private $conn;
    private $table = 'tagihan';
    
    public function __construct() {
        $database = new Database();
        $this->conn = $database->getConnection();
    }
    
    /**
     * Generate tagihan bulanan untuk semua warga aktif
     * Dipanggil setiap awal bulan (via cron job atau manual trigger)
     * 
     * @param int $bulan
     * @param int $tahun
     * @return array Result message
     */
    public function generateTagihanBulanan($bulan, $tahun) {
        try {
            $this->conn->beginTransaction();
            
            // 1. Ambil semua jenis iuran aktif
            $sqlIuran = "SELECT id, nominal_baku FROM jenis_iuran WHERE is_active = TRUE";
            $stmtIuran = $this->conn->prepare($sqlIuran);
            $stmtIuran->execute();
            $jenisIuran = $stmtIuran->fetchAll();
            
            // Hitung total iuran
            $totalIuran = array_sum(array_column($jenisIuran, 'nominal_baku'));
            
            // 2. Ambil semua warga aktif yang belum punya tagihan bulan ini
            $sqlWarga = "
                SELECT w.id FROM warga w
                WHERE w.is_active = TRUE
                AND NOT EXISTS (
                    SELECT 1 FROM tagihan t 
                    WHERE t.warga_id = w.id 
                    AND t.bulan = :bulan 
                    AND t.tahun = :tahun
                )
            ";
            $stmtWarga = $this->conn->prepare($sqlWarga);
            $stmtWarga->execute(['bulan' => $bulan, 'tahun' => $tahun]);
            $wargaList = $stmtWarga->fetchAll();
            
            $tagihanCount = 0;
            
            // 3. Create tagihan untuk setiap warga
            foreach ($wargaList as $warga) {
                // Insert tagihan
                $sqlTagihan = "INSERT INTO {$this->table} (warga_id, bulan, tahun, total_tagihan) 
                              VALUES (:warga_id, :bulan, :tahun, :total_tagihan)";
                $stmtTagihan = $this->conn->prepare($sqlTagihan);
                $stmtTagihan->execute([
                    'warga_id' => $warga['id'],
                    'bulan' => $bulan,
                    'tahun' => $tahun,
                    'total_tagihan' => $totalIuran
                ]);
                
                $tagihanId = $this->conn->lastInsertId();
                
                // Insert detail per jenis iuran
                foreach ($jenisIuran as $iuran) {
                    $sqlDetail = "INSERT INTO detail_tagihan (tagihan_id, jenis_iuran_id, nominal) 
                                 VALUES (:tagihan_id, :jenis_iuran_id, :nominal)";
                    $stmtDetail = $this->conn->prepare($sqlDetail);
                    $stmtDetail->execute([
                        'tagihan_id' => $tagihanId,
                        'jenis_iuran_id' => $iuran['id'],
                        'nominal' => $iuran['nominal_baku']
                    ]);
                }
                
                $tagihanCount++;
            }
            
            $this->conn->commit();
            
            return [
                'success' => true,
                'message' => "Berhasil generate {$tagihanCount} tagihan untuk bulan {$bulan}/{$tahun}",
                'jumlah_tagihan' => $tagihanCount,
                'total_per_warga' => $totalIuran
            ];
            
        } catch (Exception $e) {
            $this->conn->rollBack();
            return [
                'success' => false,
                'message' => 'Gagal generate tagihan: ' . $e->getMessage()
            ];
        }
    }
    
    /**
     * Get tagihan by warga
     * @param int $warga_id
     * @param string|null $status (belum_lunas, lunas, sebagian)
     * @return array
     */
    public function getByWarga($warga_id, $status = null) {
        $sql = "SELECT t.*, 
                COALESCE((SELECT SUM(p.jumlah_bayar) FROM pembayaran p WHERE p.tagihan_id = t.id), 0) AS sudah_dibayar
                FROM {$this->table} t
                WHERE t.warga_id = :warga_id";
        
        $params = ['warga_id' => $warga_id];
        
        if ($status) {
            $sql .= " AND t.status = :status";
            $params['status'] = $status;
        }
        
        $sql .= " ORDER BY t.tahun DESC, t.bulan DESC";
        
        $stmt = $this->conn->prepare($sql);
        $stmt->execute($params);
        
        return $stmt->fetchAll();
    }
    
    /**
     * Get all tagihan belum lunas (untuk monitoring admin)
     * @return array
     */
    public function getTagihanBelumLunas() {
        $sql = "
            SELECT 
                t.*,
                w.nama_lengkap,
                w.no_rumah,
                w.no_whatsapp,
                COALESCE((SELECT SUM(p.jumlah_bayar) FROM pembayaran p WHERE p.tagihan_id = t.id), 0) AS sudah_dibayar
            FROM {$this->table} t
            JOIN warga w ON t.warga_id = w.id
            WHERE t.status != 'lunas'
            ORDER BY t.tahun DESC, t.bulan DESC, w.no_rumah
        ";
        
        $stmt = $this->conn->prepare($sql);
        $stmt->execute();
        
        return $stmt->fetchAll();
    }
    
    /**
     * Get tagihan by periode
     * @param int $bulan
     * @param int $tahun
     * @return array
     */
    public function getByPeriode($bulan, $tahun) {
        $sql = "
            SELECT 
                t.*,
                w.nama_lengkap,
                w.no_rumah,
                COALESCE((SELECT SUM(p.jumlah_bayar) FROM pembayaran p WHERE p.tagihan_id = t.id), 0) AS sudah_dibayar
            FROM {$this->table} t
            JOIN warga w ON t.warga_id = w.id
            WHERE t.bulan = :bulan AND t.tahun = :tahun
            ORDER BY w.no_rumah
        ";
        
        $stmt = $this->conn->prepare($sql);
        $stmt->execute(['bulan' => $bulan, 'tahun' => $tahun]);
        
        return $stmt->fetchAll();
    }
    
    /**
     * Get single tagihan with detail
     * @param int $id
     * @return array|null
     */
    public function getById($id) {
        $sql = "
            SELECT t.*, w.nama_lengkap, w.no_rumah
            FROM {$this->table} t
            JOIN warga w ON t.warga_id = w.id
            WHERE t.id = :id
        ";
        
        $stmt = $this->conn->prepare($sql);
        $stmt->execute(['id' => $id]);
        $tagihan = $stmt->fetch();
        
        if ($tagihan) {
            // Get detail
            $sqlDetail = "
                SELECT dt.*, ji.nama_iuran
                FROM detail_tagihan dt
                JOIN jenis_iuran ji ON dt.jenis_iuran_id = ji.id
                WHERE dt.tagihan_id = :tagihan_id
            ";
            $stmtDetail = $this->conn->prepare($sqlDetail);
            $stmtDetail->execute(['tagihan_id' => $id]);
            $tagihan['detail'] = $stmtDetail->fetchAll();
        }
        
        return $tagihan;
    }
    
    /**
     * Update status tagihan setelah pembayaran
     * @param int $tagihan_id
     * @return bool
     */
    public function updateStatus($tagihan_id) {
        // Hitung total tagihan dan pembayaran
        $sql = "
            SELECT 
                t.total_tagihan,
                COALESCE((SELECT SUM(p.jumlah_bayar) FROM pembayaran p WHERE p.tagihan_id = t.id AND p.verified = TRUE), 0) AS total_bayar
            FROM {$this->table} t
            WHERE t.id = :id
        ";
        
        $stmt = $this->conn->prepare($sql);
        $stmt->execute(['id' => $tagihan_id]);
        $data = $stmt->fetch();
        
        if ($data) {
            $status = 'belum_lunas';
            if ($data['total_bayar'] >= $data['total_tagihan']) {
                $status = 'lunas';
            } elseif ($data['total_bayar'] > 0) {
                $status = 'sebagian';
            }
            
            $sqlUpdate = "UPDATE {$this->table} SET status = :status WHERE id = :id";
            $stmtUpdate = $this->conn->prepare($sqlUpdate);
            return $stmtUpdate->execute(['status' => $status, 'id' => $tagihan_id]);
        }
        
        return false;
    }
}
