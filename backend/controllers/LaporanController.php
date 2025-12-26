<?php
/**
 * LaporanController
 * Mengelola laporan keuangan RT
 */

require_once __DIR__ . '/../models/Warga.php';
require_once __DIR__ . '/../models/Tagihan.php';
require_once __DIR__ . '/../models/Pembayaran.php';
require_once __DIR__ . '/../models/JenisIuran.php';

class LaporanController {
    private $wargaModel;
    private $tagihanModel;
    private $pembayaranModel;
    private $jenisIuranModel;
    
    public function __construct() {
        $this->wargaModel = new Warga();
        $this->tagihanModel = new Tagihan();
        $this->pembayaranModel = new Pembayaran();
        $this->jenisIuranModel = new JenisIuran();
    }
    
    /**
     * Dashboard admin - Ringkasan keseluruhan
     * @return array
     */
    public function getDashboardAdmin() {
        // Total warga aktif
        $wargaList = $this->wargaModel->getAll();
        $totalWarga = count($wargaList);
        
        // Total tunggakan
        $tunggakanList = $this->wargaModel->getDaftarTunggakan();
        $totalTunggakan = array_sum(array_column($tunggakanList, 'total_tunggakan'));
        $jumlahPenunggak = count($tunggakanList);
        
        // Penerimaan bulan ini
        $bulanIni = date('n');
        $tahunIni = date('Y');
        $laporanBulanan = $this->pembayaranModel->getLaporanBulanan($bulanIni, $tahunIni);
        
        // Pembayaran pending verifikasi
        $pendingVerifikasi = $this->pembayaranModel->getPendingVerification();
        
        return [
            'success' => true,
            'data' => [
                'total_warga' => $totalWarga,
                'total_tunggakan' => $totalTunggakan,
                'jumlah_penunggak' => $jumlahPenunggak,
                'penerimaan_bulan_ini' => $laporanBulanan['total_penerimaan'],
                'transaksi_bulan_ini' => $laporanBulanan['jumlah_transaksi'],
                'pending_verifikasi' => count($pendingVerifikasi),
                'top_penunggak' => array_slice($tunggakanList, 0, 5) // 5 terbesar
            ]
        ];
    }
    
    /**
     * Laporan kas bulanan
     * @param int $bulan
     * @param int $tahun
     * @return array
     */
    public function getLaporanKasBulanan($bulan, $tahun) {
        // Penerimaan
        $penerimaan = $this->pembayaranModel->getLaporanBulanan($bulan, $tahun);
        
        // Rekap per metode
        $rekapMetode = $this->pembayaranModel->getRekapPerMetode($bulan, $tahun);
        
        // Tagihan yang di-generate bulan ini
        $tagihan = $this->tagihanModel->getByPeriode($bulan, $tahun);
        $totalTagihan = array_sum(array_column($tagihan, 'total_tagihan'));
        
        // Hitung persentase collection rate
        $collectionRate = $totalTagihan > 0 
            ? round(($penerimaan['total_penerimaan'] / $totalTagihan) * 100, 2) 
            : 0;
        
        return [
            'success' => true,
            'data' => [
                'periode' => sprintf('%02d/%d', $bulan, $tahun),
                'total_tagihan' => $totalTagihan,
                'total_penerimaan' => $penerimaan['total_penerimaan'],
                'collection_rate' => $collectionRate . '%',
                'rekap_per_metode' => $rekapMetode,
                'detail_transaksi' => $penerimaan['transaksi']
            ]
        ];
    }
    
    /**
     * Laporan tunggakan per warga
     * @return array
     */
    public function getLaporanTunggakan() {
        $tunggakanList = $this->wargaModel->getDaftarTunggakan();
        $totalTunggakan = array_sum(array_column($tunggakanList, 'total_tunggakan'));
        
        return [
            'success' => true,
            'data' => [
                'jumlah_penunggak' => count($tunggakanList),
                'total_tunggakan' => $totalTunggakan,
                'detail' => $tunggakanList
            ]
        ];
    }
    
    /**
     * Laporan per jenis iuran (berapa yang sudah dibayar per jenis)
     * @param int $bulan
     * @param int $tahun
     * @return array
     */
    public function getLaporanPerJenisIuran($bulan, $tahun) {
        $database = new Database();
        $conn = $database->getConnection();
        
        $sql = "
            SELECT 
                ji.nama_iuran,
                ji.nominal_baku,
                COUNT(DISTINCT dt.tagihan_id) AS jumlah_tagihan,
                (ji.nominal_baku * COUNT(DISTINCT dt.tagihan_id)) AS total_harus_diterima,
                COALESCE(SUM(
                    CASE 
                        WHEN t.status = 'lunas' THEN dt.nominal
                        ELSE 0
                    END
                ), 0) AS total_diterima_lunas
            FROM jenis_iuran ji
            LEFT JOIN detail_tagihan dt ON ji.id = dt.jenis_iuran_id
            LEFT JOIN tagihan t ON dt.tagihan_id = t.id AND t.bulan = :bulan AND t.tahun = :tahun
            WHERE ji.is_active = TRUE
            GROUP BY ji.id, ji.nama_iuran, ji.nominal_baku
        ";
        
        $stmt = $conn->prepare($sql);
        $stmt->execute(['bulan' => $bulan, 'tahun' => $tahun]);
        $data = $stmt->fetchAll();
        
        return [
            'success' => true,
            'data' => [
                'periode' => sprintf('%02d/%d', $bulan, $tahun),
                'rekap_per_jenis' => $data
            ]
        ];
    }
    
    /**
     * Export laporan (format sederhana - bisa dikembangkan ke Excel/PDF)
     * @param string $jenis (kas_bulanan, tunggakan)
     * @param int $bulan
     * @param int $tahun
     * @return array
     */
    public function exportLaporan($jenis, $bulan, $tahun) {
        switch ($jenis) {
            case 'kas_bulanan':
                return $this->getLaporanKasBulanan($bulan, $tahun);
            case 'tunggakan':
                return $this->getLaporanTunggakan();
            default:
                return ['success' => false, 'message' => 'Jenis laporan tidak valid'];
        }
    }
}
