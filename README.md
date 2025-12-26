# Aplikasi Manajemen Iuran RT

Aplikasi fullstack untuk mengelola iuran warga RT dengan fitur:
- Manajemen data warga
- Generate tagihan bulanan otomatis
- Pencatatan pembayaran dengan upload bukti
- Laporan kas dan tunggakan
- Dashboard terpisah untuk warga dan admin

## Tech Stack

- **Backend**: PHP Native dengan PDO
- **Frontend**: React + Vite + TailwindCSS
- **Database**: MySQL

## Struktur Direktori

```
/aplikasi-rt-fullstack
├── /backend
│   ├── /config          # Database connection
│   ├── /controllers     # AuthController, LaporanController
│   ├── /database        # SQL schema
│   ├── /models          # Warga, Tagihan, Pembayaran, JenisIuran
│   ├── /uploads         # Bukti transfer
│   └── index.php        # REST API router
│
└── /frontend
    ├── /src
    │   ├── /api         # Axios config
    │   ├── /components  # Layout, UI components
    │   ├── /context     # AuthContext
    │   └── /pages       # Login, Dashboard, etc.
    └── package.json
```

## Setup & Instalasi

### 1. Database

```bash
# Login ke MySQL dan buat database
mysql -u root -p
CREATE DATABASE db_iuran_rt;
USE db_iuran_rt;

# Import schema
source /path/to/backend/database/database.sql
```

### 2. Backend

```bash
# Edit config database
nano backend/config/database.php

# Jalankan dengan PHP built-in server
cd backend
php -S localhost:8000
```

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
```

## Default Login

- **Username**: `admin`
- **Password**: `password`

## API Endpoints

| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| POST | `/login` | Login user |
| GET | `/warga` | List warga |
| GET | `/warga/{id}/dashboard` | Dashboard warga |
| POST | `/tagihan/generate` | Generate tagihan bulanan |
| POST | `/bayar` | Input pembayaran |
| GET | `/laporan/dashboard` | Dashboard admin |
| GET | `/tunggakan` | List penunggak |

## Logic Perhitungan Tunggakan

```
Total Tunggakan = Saldo Awal + Total Tagihan - Total Pembayaran
```

- **Saldo Awal**: Hutang sebelum sistem berjalan (manual input)
- **Total Tagihan**: Sum dari semua invoice yang di-generate
- **Total Pembayaran**: Sum dari semua pembayaran terverifikasi
