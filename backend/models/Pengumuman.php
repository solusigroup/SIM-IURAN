<?php
/**
 * Model Pengumuman
 * Mengelola laporan/pengumuman global dari admin
 */

require_once __DIR__ . '/../config/database.php';

class Pengumuman {
    private $conn;
    private $table = 'pengumuman';
    
    public function __construct() {
        $database = new Database();
        $this->conn = $database->getConnection();
    }
    
    /**
     * Get all pengumuman (untuk semua user)
     * @return array
     */
    public function getAll() {
        $sql = "SELECT p.*, u.username AS created_by_name
                FROM {$this->table} p
                JOIN users u ON p.created_by = u.id
                ORDER BY p.created_at DESC";
        
        $stmt = $this->conn->prepare($sql);
        $stmt->execute();
        return $stmt->fetchAll();
    }
    
    /**
     * Get pengumuman by ID
     * @param int $id
     * @return array|null
     */
    public function getById($id) {
        $sql = "SELECT p.*, u.username AS created_by_name
                FROM {$this->table} p
                JOIN users u ON p.created_by = u.id
                WHERE p.id = :id";
        
        $stmt = $this->conn->prepare($sql);
        $stmt->execute(['id' => $id]);
        return $stmt->fetch();
    }
    
    /**
     * Create pengumuman baru (admin only)
     * @param array $data
     * @return int|false
     */
    public function create($data) {
        $sql = "INSERT INTO {$this->table} (judul, isi, created_by) 
                VALUES (:judul, :isi, :created_by)";
        
        $stmt = $this->conn->prepare($sql);
        $result = $stmt->execute([
            'judul' => $data['judul'],
            'isi' => $data['isi'],
            'created_by' => $data['created_by']
        ]);
        
        return $result ? $this->conn->lastInsertId() : false;
    }
    
    /**
     * Update pengumuman (admin only)
     * @param int $id
     * @param array $data
     * @return bool
     */
    public function update($id, $data) {
        $sql = "UPDATE {$this->table} 
                SET judul = :judul, isi = :isi
                WHERE id = :id";
        
        $stmt = $this->conn->prepare($sql);
        return $stmt->execute([
            'id' => $id,
            'judul' => $data['judul'],
            'isi' => $data['isi']
        ]);
    }
    
    /**
     * Delete pengumuman (admin only)
     * @param int $id
     * @return bool
     */
    public function delete($id) {
        $sql = "DELETE FROM {$this->table} WHERE id = :id";
        $stmt = $this->conn->prepare($sql);
        return $stmt->execute(['id' => $id]);
    }
    
    /**
     * Get pengumuman terbaru (untuk dashboard warga)
     * @param int $limit
     * @return array
     */
    public function getLatest($limit = 5) {
        $sql = "SELECT p.*, u.username AS created_by_name
                FROM {$this->table} p
                JOIN users u ON p.created_by = u.id
                ORDER BY p.created_at DESC
                LIMIT :limit";
        
        $stmt = $this->conn->prepare($sql);
        $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
        $stmt->execute();
        return $stmt->fetchAll();
    }
}
