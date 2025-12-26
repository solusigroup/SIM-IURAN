# 🚀 Panduan Deployment - SIM-IURAN RT

## Informasi Hosting
- **Hosting**: arenhost.id
- **Username**: simpleak
- **Domain**: rt35.simpleakunting.my.id

---

## 📁 Struktur di Hosting

```
public_html/rt35.simpleakunting.my.id/
├── .htaccess          (dari root folder)
├── index.html         (dari frontend/dist/)
├── assets/            (dari frontend/dist/assets/)
├── api/
│   ├── .htaccess      (dari backend/.htaccess)
│   ├── index.php      (dari backend/)
│   ├── config/
│   ├── controllers/
│   ├── models/
│   ├── storage/
│   └── uploads/
└── database/
    └── database.sql
```

---

## 📝 Langkah Deployment

### 1. Akses cPanel/File Manager
Login ke arenhost.id dengan username `simpleak`

### 2. Buat Subdomain (jika belum)
- Buat subdomain: `rt35.simpleakunting.my.id`
- Document root: `public_html/rt35.simpleakunting.my.id`

### 3. Upload Files

**Frontend (dari `frontend/dist/`):**
- Upload `index.html` ke root subdomain
- Upload folder `assets/` ke root subdomain

**Backend (dari `backend/`):**
- Buat folder `api/` di root subdomain
- Upload semua file backend ke folder `api/`:
  - `index.php`
  - `config/`
  - `controllers/`
  - `models/`
  - `.htaccess` (dari backend/.htaccess)
- Buat folder `api/storage/` dengan permission 755
- Buat folder `api/uploads/foto/` dengan permission 755

**.htaccess Root:**
- Upload `.htaccess` dari root project ke root subdomain

### 4. Setup Database
- Buat database MySQL di cPanel (misal: `simpleak_simiuran`)
- Import `database/database.sql`
- Update `api/config/database.php`:

```php
private $host = 'localhost';
private $db_name = 'simpleak_simiuran';  // sesuaikan
private $username = 'simpleak_dbuser';    // sesuaikan
private $password = 'PASSWORD_DATABASE';  // sesuaikan
```

### 5. Setup SSL
- Aktifkan SSL/HTTPS di cPanel untuk domain
- .htaccess sudah auto-redirect ke HTTPS

### 6. Test
- Buka https://rt35.simpleakunting.my.id
- Login dengan: admin / admin123

---

## 🔄 Update via GitHub

### Di Hosting (via SSH atau Terminal):
```bash
cd public_html/rt35.simpleakunting.my.id
git pull origin main
```

### Di Lokal (sebelum push):
```bash
cd frontend && npm run build
cd ..
git add .
git commit -m "Update: deskripsi"
git push
```

---

## ⚠️ Checklist Keamanan

- [x] HTTPS aktif
- [ ] Ganti password default admin
- [ ] Update kredensial database
- [ ] Set permission folder uploads: 755
- [ ] Backup database secara berkala

---

## 🆘 Troubleshooting

**500 Internal Server Error:**
- Cek .htaccess syntax
- Cek permission file/folder

**API tidak bisa diakses:**
- Pastikan folder `api/` ada
- Cek CORS di `api/.htaccess`

**Upload gagal:**
- Cek permission folder `api/uploads/`
- php.ini: `upload_max_filesize = 10M`

---

**Repository**: https://github.com/solusigroup/SIM-IURAN
