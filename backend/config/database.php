<?php
/**
 * Database Configuration
 * Koneksi ke MySQL menggunakan PDO
 */

class Database {
    private $host = 'localhost';
    private $db_name = 'db_iuran_rt';
    private $username = 'kurniawan';
    private $password = 'Kurniawan@123';
    private $charset = 'utf8mb4';
    private $conn;
    
    /**
     * Get database connection
     * @return PDO|null
     */
    public function getConnection() {
        $this->conn = null;
        
        try {
            $dsn = "mysql:host={$this->host};dbname={$this->db_name};charset={$this->charset}";
            $options = [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES => false,
            ];
            
            $this->conn = new PDO($dsn, $this->username, $this->password, $options);
            
        } catch(PDOException $e) {
            error_log("Connection Error: " . $e->getMessage());
            throw new Exception("Koneksi database gagal");
        }
        
        return $this->conn;
    }
}
