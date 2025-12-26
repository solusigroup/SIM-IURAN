<?php
/**
 * Model JenisIuran
 * Master data jenis iuran
 */

require_once __DIR__ . '/../config/database.php';

class JenisIuran {
    private $conn;
    private $table = 'jenis_iuran';
    
    public function __construct() {
        $database = new Database();
        $this->conn = $database->getConnection();
    }
    
    /**
     * Get all jenis iuran aktif
     * @return array
     */
    public function getAll() {
        $sql = "SELECT * FROM {$this->table} WHERE is_active = TRUE ORDER BY id";
        $stmt = $this->conn->prepare($sql);
        $stmt->execute();
        return $stmt->fetchAll();
    }
    
    /**
     * Get single jenis iuran
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
     * Get total nominal semua iuran aktif
     * @return float
     */
    public function getTotalNominal() {
        $sql = "SELECT SUM(nominal_baku) AS total FROM {$this->table} WHERE is_active = TRUE";
        $stmt = $this->conn->prepare($sql);
        $stmt->execute();
        $result = $stmt->fetch();
        return floatval($result['total'] ?? 0);
    }
    
    /**
     * Create new jenis iuran
     * @param array $data
     * @return int|false
     */
    public function create($data) {
        $sql = "INSERT INTO {$this->table} (nama_iuran, nominal_baku, keterangan, is_wajib) 
                VALUES (:nama_iuran, :nominal_baku, :keterangan, :is_wajib)";
        
        $stmt = $this->conn->prepare($sql);
        $result = $stmt->execute([
            'nama_iuran' => $data['nama_iuran'],
            'nominal_baku' => $data['nominal_baku'] ?? 0,
            'keterangan' => $data['keterangan'] ?? null,
            'is_wajib' => $data['is_wajib'] ?? true
        ]);
        
        return $result ? $this->conn->lastInsertId() : false;
    }
    
    /**
     * Update jenis iuran
     * @param int $id
     * @param array $data
     * @return bool
     */
    public function update($id, $data) {
        $sql = "UPDATE {$this->table} SET 
                nama_iuran = :nama_iuran,
                nominal_baku = :nominal_baku,
                keterangan = :keterangan,
                is_wajib = :is_wajib
                WHERE id = :id";
        
        $stmt = $this->conn->prepare($sql);
        return $stmt->execute([
            'id' => $id,
            'nama_iuran' => $data['nama_iuran'],
            'nominal_baku' => $data['nominal_baku'] ?? 0,
            'keterangan' => $data['keterangan'] ?? null,
            'is_wajib' => $data['is_wajib'] ?? true
        ]);
    }
    
    /**
     * Soft delete jenis iuran
     * @param int $id
     * @return bool
     */
    public function delete($id) {
        $sql = "UPDATE {$this->table} SET is_active = FALSE WHERE id = :id";
        $stmt = $this->conn->prepare($sql);
        return $stmt->execute(['id' => $id]);
    }
}
