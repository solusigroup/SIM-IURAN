<?php
/**
 * Model AnggotaKeluarga
 * Mengelola data anggota keluarga warga
 */

require_once __DIR__ . '/../config/database.php';

class AnggotaKeluarga {
    private $conn;
    private $table = 'anggota_keluarga';
    
    public function __construct() {
        $database = new Database();
        $this->conn = $database->getConnection();
    }
    
    /**
     * Get all anggota keluarga untuk satu warga
     * @param int $warga_id
     * @return array
     */
    public function getByWarga($warga_id) {
        $sql = "SELECT * FROM {$this->table} 
                WHERE warga_id = :warga_id AND is_active = TRUE 
                ORDER BY 
                    CASE hubungan 
                        WHEN 'istri' THEN 1 
                        WHEN 'suami' THEN 1 
                        WHEN 'anak' THEN 2 
                        WHEN 'orang_tua' THEN 3 
                        WHEN 'mertua' THEN 4 
                        WHEN 'saudara' THEN 5 
                        ELSE 6 
                    END,
                    tanggal_lahir ASC";
        
        $stmt = $this->conn->prepare($sql);
        $stmt->execute(['warga_id' => $warga_id]);
        return $stmt->fetchAll();
    }
    
    /**
     * Get single anggota keluarga
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
     * Hitung jumlah anggota keluarga
     * @param int $warga_id
     * @return int
     */
    public function countByWarga($warga_id) {
        $sql = "SELECT COUNT(*) as total FROM {$this->table} 
                WHERE warga_id = :warga_id AND is_active = TRUE";
        $stmt = $this->conn->prepare($sql);
        $stmt->execute(['warga_id' => $warga_id]);
        $result = $stmt->fetch();
        return intval($result['total']);
    }
    
    /**
     * Create new anggota keluarga
     * @param array $data
     * @return int|false
     */
    public function create($data) {
        $sql = "INSERT INTO {$this->table} 
                (warga_id, nama_lengkap, nik, hubungan, tempat_lahir, tanggal_lahir, jenis_kelamin, keterangan) 
                VALUES (:warga_id, :nama_lengkap, :nik, :hubungan, :tempat_lahir, :tanggal_lahir, :jenis_kelamin, :keterangan)";
        
        $stmt = $this->conn->prepare($sql);
        $result = $stmt->execute([
            'warga_id' => $data['warga_id'],
            'nama_lengkap' => $data['nama_lengkap'],
            'nik' => $data['nik'] ?? null,
            'hubungan' => $data['hubungan'],
            'tempat_lahir' => $data['tempat_lahir'] ?? null,
            'tanggal_lahir' => $data['tanggal_lahir'] ?? null,
            'jenis_kelamin' => $data['jenis_kelamin'],
            'keterangan' => $data['keterangan'] ?? null
        ]);
        
        return $result ? $this->conn->lastInsertId() : false;
    }
    
    /**
     * Batch create anggota keluarga
     * @param int $warga_id
     * @param array $members Array of member data
     * @return array
     */
    public function batchCreate($warga_id, $members) {
        $created = [];
        $failed = [];
        
        foreach ($members as $member) {
            $member['warga_id'] = $warga_id;
            $id = $this->create($member);
            
            if ($id) {
                $created[] = $id;
            } else {
                $failed[] = $member['nama_lengkap'];
            }
        }
        
        return [
            'success' => count($failed) === 0,
            'created' => $created,
            'failed' => $failed
        ];
    }
    
    /**
     * Update anggota keluarga
     * @param int $id
     * @param array $data
     * @return bool
     */
    public function update($id, $data) {
        $sql = "UPDATE {$this->table} SET 
                nama_lengkap = :nama_lengkap,
                nik = :nik,
                hubungan = :hubungan,
                tempat_lahir = :tempat_lahir,
                tanggal_lahir = :tanggal_lahir,
                jenis_kelamin = :jenis_kelamin,
                keterangan = :keterangan
                WHERE id = :id";
        
        $stmt = $this->conn->prepare($sql);
        return $stmt->execute([
            'id' => $id,
            'nama_lengkap' => $data['nama_lengkap'],
            'nik' => $data['nik'] ?? null,
            'hubungan' => $data['hubungan'],
            'tempat_lahir' => $data['tempat_lahir'] ?? null,
            'tanggal_lahir' => $data['tanggal_lahir'] ?? null,
            'jenis_kelamin' => $data['jenis_kelamin'],
            'keterangan' => $data['keterangan'] ?? null
        ]);
    }
    
    /**
     * Soft delete anggota keluarga
     * @param int $id
     * @return bool
     */
    public function delete($id) {
        $sql = "UPDATE {$this->table} SET is_active = FALSE WHERE id = :id";
        $stmt = $this->conn->prepare($sql);
        return $stmt->execute(['id' => $id]);
    }
    
    /**
     * Hard delete semua anggota keluarga untuk warga tertentu
     * @param int $warga_id
     * @return bool
     */
    public function deleteByWarga($warga_id) {
        $sql = "DELETE FROM {$this->table} WHERE warga_id = :warga_id";
        $stmt = $this->conn->prepare($sql);
        return $stmt->execute(['warga_id' => $warga_id]);
    }
    
    /**
     * Get daftar hubungan yang tersedia
     * @return array
     */
    public static function getHubunganList() {
        return [
            'istri' => 'Istri',
            'suami' => 'Suami',
            'anak' => 'Anak',
            'orang_tua' => 'Orang Tua',
            'mertua' => 'Mertua',
            'saudara' => 'Saudara',
            'lainnya' => 'Lainnya'
        ];
    }
}
