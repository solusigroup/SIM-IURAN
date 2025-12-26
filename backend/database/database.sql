-- ===========================================
-- APLIKASI MANAJEMEN IURAN RT
-- Database Schema - MySQL
-- ===========================================

-- Drop tables if exist (untuk fresh install)
SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS `pembayaran`;
DROP TABLE IF EXISTS `detail_tagihan`;
DROP TABLE IF EXISTS `tagihan`;
DROP TABLE IF EXISTS `users`;
DROP TABLE IF EXISTS `anggota_keluarga`;
DROP TABLE IF EXISTS `warga`;
DROP TABLE IF EXISTS `jenis_iuran`;
SET FOREIGN_KEY_CHECKS = 1;

-- ===========================================
-- TABEL MASTER
-- ===========================================

-- 1. Tabel Warga (Profil Penghuni - Kepala Keluarga)
CREATE TABLE `warga` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `nama_lengkap` VARCHAR(100) NOT NULL,
    `nik` VARCHAR(16) UNIQUE NOT NULL,
    `no_kk` VARCHAR(16) NOT NULL COMMENT 'Nomor Kartu Keluarga',
    `tempat_lahir` VARCHAR(50) NOT NULL,
    `tanggal_lahir` DATE NOT NULL,
    `foto_diri` VARCHAR(255) NULL COMMENT 'Path file foto',
    `no_whatsapp` VARCHAR(20) NOT NULL,
    `no_rumah` VARCHAR(20) NOT NULL,
    `status_huni` ENUM('tetap', 'kontrak') DEFAULT 'tetap',
    `saldo_awal_tunggakan` DECIMAL(15,2) DEFAULT 0.00 COMMENT 'Hutang sebelum sistem berjalan',
    `is_active` BOOLEAN DEFAULT TRUE,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX `idx_no_rumah` (`no_rumah`),
    INDEX `idx_no_kk` (`no_kk`),
    INDEX `idx_status_huni` (`status_huni`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 1b. Tabel Anggota Keluarga (Istri, Anak, Penghuni Lain)
CREATE TABLE `anggota_keluarga` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `warga_id` INT NOT NULL COMMENT 'FK ke kepala keluarga',
    `nama_lengkap` VARCHAR(100) NOT NULL,
    `nik` VARCHAR(16) NULL,
    `hubungan` ENUM('istri', 'suami', 'anak', 'orang_tua', 'mertua', 'saudara', 'lainnya') NOT NULL,
    `tempat_lahir` VARCHAR(50) NULL,
    `tanggal_lahir` DATE NULL,
    `jenis_kelamin` ENUM('L', 'P') NOT NULL,
    `keterangan` VARCHAR(100) NULL COMMENT 'Keterangan tambahan',
    `is_active` BOOLEAN DEFAULT TRUE,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`warga_id`) REFERENCES `warga`(`id`) ON DELETE CASCADE,
    INDEX `idx_warga` (`warga_id`),
    INDEX `idx_hubungan` (`hubungan`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Tabel Users (Login System)
CREATE TABLE `users` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `username` VARCHAR(50) NOT NULL UNIQUE,
    `password` VARCHAR(255) NOT NULL COMMENT 'Hashed dengan password_hash()',
    `role` ENUM('admin', 'warga') DEFAULT 'warga',
    `warga_id` INT NULL COMMENT 'NULL untuk admin tanpa profil warga',
    `last_login` TIMESTAMP NULL,
    `is_active` BOOLEAN DEFAULT TRUE,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`warga_id`) REFERENCES `warga`(`id`) ON DELETE SET NULL,
    INDEX `idx_role` (`role`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Tabel Jenis Iuran (5 Jenis - Dinamis)
CREATE TABLE `jenis_iuran` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `nama_iuran` VARCHAR(50) NOT NULL,
    `nominal_baku` DECIMAL(15,2) DEFAULT 0.00 COMMENT '0 jika sukarela',
    `keterangan` TEXT,
    `is_wajib` BOOLEAN DEFAULT TRUE COMMENT 'False untuk iuran sukarela',
    `is_active` BOOLEAN DEFAULT TRUE,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert 5 Jenis Iuran Default
INSERT INTO `jenis_iuran` (`nama_iuran`, `nominal_baku`, `keterangan`, `is_wajib`) VALUES
('Keamanan', 50000.00, 'Iuran untuk satpam/ronda', TRUE),
('Kebersihan', 30000.00, 'Iuran untuk petugas kebersihan', TRUE),
('Sosial', 25000.00, 'Dana sosial untuk warga yang membutuhkan', TRUE),
('PHBN', 20000.00, 'Peringatan Hari Besar Nasional', TRUE),
('Kas RT', 25000.00, 'Kas operasional RT', TRUE);

-- ===========================================
-- TABEL TRANSAKSI
-- ===========================================

-- 4. Tabel Tagihan (Invoice Bulanan)
CREATE TABLE `tagihan` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `warga_id` INT NOT NULL,
    `bulan` TINYINT NOT NULL COMMENT '1-12',
    `tahun` YEAR NOT NULL,
    `total_tagihan` DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    `status` ENUM('belum_lunas', 'lunas', 'sebagian') DEFAULT 'belum_lunas',
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (`warga_id`) REFERENCES `warga`(`id`) ON DELETE CASCADE,
    UNIQUE KEY `uk_tagihan_periode` (`warga_id`, `bulan`, `tahun`),
    INDEX `idx_periode` (`tahun`, `bulan`),
    INDEX `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Tabel Detail Tagihan (Breakdown per Jenis Iuran)
CREATE TABLE `detail_tagihan` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `tagihan_id` INT NOT NULL,
    `jenis_iuran_id` INT NOT NULL,
    `nominal` DECIMAL(15,2) NOT NULL,
    FOREIGN KEY (`tagihan_id`) REFERENCES `tagihan`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`jenis_iuran_id`) REFERENCES `jenis_iuran`(`id`) ON DELETE CASCADE,
    UNIQUE KEY `uk_detail_iuran` (`tagihan_id`, `jenis_iuran_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. Tabel Pembayaran (Uang Masuk)
CREATE TABLE `pembayaran` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `warga_id` INT NOT NULL,
    `tagihan_id` INT NULL COMMENT 'NULL jika bayar langsung tanpa pilih tagihan spesifik',
    `tanggal_bayar` DATE NOT NULL,
    `jumlah_bayar` DECIMAL(15,2) NOT NULL,
    `metode_bayar` ENUM('tunai', 'transfer') DEFAULT 'tunai',
    `bukti_transfer` VARCHAR(255) NULL COMMENT 'Path file gambar',
    `keterangan` TEXT,
    `verified` BOOLEAN DEFAULT FALSE COMMENT 'Status verifikasi admin',
    `verified_by` INT NULL,
    `verified_at` TIMESTAMP NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`warga_id`) REFERENCES `warga`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`tagihan_id`) REFERENCES `tagihan`(`id`) ON DELETE SET NULL,
    FOREIGN KEY (`verified_by`) REFERENCES `users`(`id`) ON DELETE SET NULL,
    INDEX `idx_tanggal_bayar` (`tanggal_bayar`),
    INDEX `idx_verified` (`verified`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ===========================================
-- VIEW UNTUK LAPORAN
-- ===========================================

-- View: Rekap Tunggakan per Warga
CREATE OR REPLACE VIEW `v_tunggakan_warga` AS
SELECT 
    w.id AS warga_id,
    w.nama_lengkap,
    w.no_rumah,
    w.saldo_awal_tunggakan,
    COALESCE(SUM(t.total_tagihan), 0) AS total_tagihan,
    COALESCE((SELECT SUM(p.jumlah_bayar) FROM pembayaran p WHERE p.warga_id = w.id), 0) AS total_pembayaran,
    (w.saldo_awal_tunggakan + COALESCE(SUM(t.total_tagihan), 0) - 
        COALESCE((SELECT SUM(p.jumlah_bayar) FROM pembayaran p WHERE p.warga_id = w.id), 0)
    ) AS saldo_tunggakan
FROM warga w
LEFT JOIN tagihan t ON w.id = t.warga_id
WHERE w.is_active = TRUE
GROUP BY w.id, w.nama_lengkap, w.no_rumah, w.saldo_awal_tunggakan;

-- View: Rekap Kas Bulanan
CREATE OR REPLACE VIEW `v_kas_bulanan` AS
SELECT 
    YEAR(p.tanggal_bayar) AS tahun,
    MONTH(p.tanggal_bayar) AS bulan,
    COUNT(p.id) AS jumlah_transaksi,
    SUM(p.jumlah_bayar) AS total_penerimaan
FROM pembayaran p
WHERE p.verified = TRUE
GROUP BY YEAR(p.tanggal_bayar), MONTH(p.tanggal_bayar)
ORDER BY tahun DESC, bulan DESC;

-- ===========================================
-- STORED PROCEDURE
-- ===========================================

-- Procedure: Generate Tagihan Bulanan untuk Semua Warga Aktif
DELIMITER //
CREATE PROCEDURE `sp_generate_tagihan_bulanan`(
    IN p_bulan TINYINT,
    IN p_tahun YEAR
)
BEGIN
    DECLARE v_total_iuran DECIMAL(15,2);
    
    -- Hitung total dari semua iuran aktif
    SELECT SUM(nominal_baku) INTO v_total_iuran 
    FROM jenis_iuran WHERE is_active = TRUE;
    
    -- Insert tagihan untuk setiap warga aktif yang belum punya tagihan bulan ini
    INSERT INTO tagihan (warga_id, bulan, tahun, total_tagihan)
    SELECT w.id, p_bulan, p_tahun, v_total_iuran
    FROM warga w
    WHERE w.is_active = TRUE
    AND NOT EXISTS (
        SELECT 1 FROM tagihan t 
        WHERE t.warga_id = w.id 
        AND t.bulan = p_bulan 
        AND t.tahun = p_tahun
    );
    
    -- Insert detail tagihan untuk tagihan yang baru dibuat
    INSERT INTO detail_tagihan (tagihan_id, jenis_iuran_id, nominal)
    SELECT t.id, ji.id, ji.nominal_baku
    FROM tagihan t
    CROSS JOIN jenis_iuran ji
    WHERE t.bulan = p_bulan 
    AND t.tahun = p_tahun
    AND ji.is_active = TRUE
    AND NOT EXISTS (
        SELECT 1 FROM detail_tagihan dt 
        WHERE dt.tagihan_id = t.id 
        AND dt.jenis_iuran_id = ji.id
    );
    
    SELECT CONCAT('Tagihan bulan ', p_bulan, '/', p_tahun, ' berhasil di-generate') AS message;
END //
DELIMITER ;

-- Procedure: Update Status Tagihan setelah Pembayaran
DELIMITER //
CREATE PROCEDURE `sp_update_status_tagihan`(
    IN p_tagihan_id INT
)
BEGIN
    DECLARE v_total_tagihan DECIMAL(15,2);
    DECLARE v_total_bayar DECIMAL(15,2);
    DECLARE v_warga_id INT;
    
    -- Ambil data tagihan
    SELECT total_tagihan, warga_id INTO v_total_tagihan, v_warga_id
    FROM tagihan WHERE id = p_tagihan_id;
    
    -- Hitung total pembayaran untuk tagihan ini
    SELECT COALESCE(SUM(jumlah_bayar), 0) INTO v_total_bayar
    FROM pembayaran WHERE tagihan_id = p_tagihan_id;
    
    -- Update status berdasarkan pembayaran
    UPDATE tagihan 
    SET status = CASE 
        WHEN v_total_bayar >= v_total_tagihan THEN 'lunas'
        WHEN v_total_bayar > 0 THEN 'sebagian'
        ELSE 'belum_lunas'
    END
    WHERE id = p_tagihan_id;
END //
DELIMITER ;

-- ===========================================
-- DATA DUMMY (OPSIONAL - untuk testing)
-- ===========================================

-- Insert Admin Default
INSERT INTO `warga` (`nama_lengkap`, `nik`, `no_kk`, `tempat_lahir`, `tanggal_lahir`, `no_whatsapp`, `no_rumah`, `status_huni`) VALUES
('Pengurus RT', '1234567890123456', '3201010101010001', 'Jakarta', '1980-01-15', '08123456789', 'A1', 'tetap');

INSERT INTO `users` (`username`, `password`, `role`, `warga_id`) VALUES
('admin', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin', 1);
-- Password: 'password' (hashed dengan bcrypt)

-- Insert Beberapa Warga Sample
INSERT INTO `warga` (`nama_lengkap`, `nik`, `no_kk`, `tempat_lahir`, `tanggal_lahir`, `no_whatsapp`, `no_rumah`, `status_huni`, `saldo_awal_tunggakan`) VALUES
('Budi Santoso', '1234567890123457', '3201010101010002', 'Bandung', '1985-05-20', '08111111111', 'A2', 'tetap', 150000.00),
('Siti Aminah', '1234567890123458', '3201010101010003', 'Surabaya', '1988-08-10', '08222222222', 'A3', 'tetap', 0.00),
('Ahmad Wahyu', '1234567890123459', '3201010101010004', 'Semarang', '1990-03-25', '08333333333', 'B1', 'kontrak', 300000.00),
('Dewi Lestari', '1234567890123460', '3201010101010005', 'Yogyakarta', '1992-12-01', '08444444444', 'B2', 'tetap', 0.00);

-- Insert Anggota Keluarga Sample
INSERT INTO `anggota_keluarga` (`warga_id`, `nama_lengkap`, `nik`, `hubungan`, `tempat_lahir`, `tanggal_lahir`, `jenis_kelamin`) VALUES
-- Keluarga Budi Santoso (warga_id = 2)
(2, 'Wati Santoso', '1234567890123461', 'istri', 'Bandung', '1987-07-15', 'P'),
(2, 'Andi Santoso', '1234567890123462', 'anak', 'Bandung', '2010-02-20', 'L'),
(2, 'Ani Santoso', '1234567890123463', 'anak', 'Bandung', '2013-09-05', 'P'),
-- Keluarga Siti Aminah (warga_id = 3)
(3, 'Rudi Aminah', '1234567890123464', 'suami', 'Surabaya', '1986-04-12', 'L'),
(3, 'Dina Aminah', '1234567890123465', 'anak', 'Surabaya', '2015-11-30', 'P'),
-- Keluarga Ahmad Wahyu (warga_id = 4)
(4, 'Lina Wahyu', '1234567890123466', 'istri', 'Semarang', '1992-06-18', 'P');

