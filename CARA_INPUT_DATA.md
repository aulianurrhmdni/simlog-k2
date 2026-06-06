# Cara Memasukkan Data Raw ke SIMLOG (PT CAHAYA INDOMIE)

Database: **SQLite** → file `prisma/dev.db`.
Semua ID sekarang dibuat mudah dibaca: `produk1`, `supplier1`, `pelanggan1`,
`stok1`, `user1`, `barangmasuk1`, `barangkeluar1`, `permintaan1`, `retur1`,
`alert1`, `monitoring1`, `parameter1`, dst.

> **Aturan penting:** sebuah baris harus punya **`id` unik** dan **`produkId`/
> `supplierId`/`pelangganId` yang menunjuk ke ID yang sudah ada**. Kalau ID
> relasi salah, data tidak akan tampil / error.

Ada 3 cara. Pilih yang paling nyaman.

---

## Cara 1 — Prisma Studio (GUI, paling mudah, TANPA koding)

```bash
npm run db:studio
```

Browser terbuka di `http://localhost:5555`. Klik tabel (mis. `Produk`) →
tombol **Add record** → isi kolom → **Save**. Data langsung tampil di sistem
setelah halaman di-refresh.

Tips: isi `id` dengan nama mudah (mis. `produk11`), kolom relasi (`produkId`)
pilih dari daftar yang sudah ada.

---

## Cara 2 — Raw SQL (langsung ke database)

Jalankan lewat Node (sudah ada `better-sqlite3`):

```bash
node -e "const db=require('better-sqlite3')('prisma/dev.db'); db.prepare(`INSERT INTO Produk (id, namaProduk, kategori, satuan, stokMinimum, masaKedaluwarsa, createdAt) VALUES ('produk11','Indomie Goreng Iga Penyet','Goreng','dus',30,365,CURRENT_TIMESTAMP)`).run(); console.log('OK');"
```

Atau buka file DB di **DB Browser for SQLite** dan jalankan SQL berikut.

### Contoh tiap tabel (salin & ubah nilainya)

```sql
-- PRODUK (master barang)
INSERT INTO Produk (id, namaProduk, kategori, satuan, stokMinimum, masaKedaluwarsa, createdAt)
VALUES ('produk11', 'Indomie Goreng Iga Penyet', 'Goreng', 'dus', 30, 365, CURRENT_TIMESTAMP);

-- STOK (stok harus menunjuk produk yang ada)
INSERT INTO Stok (id, produkId, jumlahStok, lokasiRak, statusStok, tanggalUpdate)
VALUES ('stok11', 'produk11', 75, 'A-06', 'NORMAL', CURRENT_TIMESTAMP);

-- PARAMETER STOK (batas minimum tiap produk)
INSERT INTO ParameterStok (id, produkId, batasMinimum, hariPeringatanExpired, aktif)
VALUES ('parameter11', 'produk11', 30, 30, 1);   -- aktif: 1 = true, 0 = false

-- SUPPLIER
INSERT INTO Supplier (id, namaSupplier, kontak, alamat, createdAt)
VALUES ('supplier3', 'PT. Sumber Pangan', '021-9999', 'Bekasi', CURRENT_TIMESTAMP);

-- PELANGGAN
INSERT INTO Pelanggan (id, namaPelanggan, alamat, kontak, createdAt)
VALUES ('pelanggan6', 'Toko Berkah', 'Jl. Mawar No. 1', '0812-0000', CURRENT_TIMESTAMP);

-- BARANG MASUK
INSERT INTO BarangMasuk (id, produkId, supplierId, tanggalMasuk, jumlahMasuk, batch, tanggalExpired, statusPenerimaan, catatan, dicatatOlehId, approvedById)
VALUES ('barangmasuk6', 'produk11', 'supplier1', CURRENT_TIMESTAMP, 100, 'B-2026-006', '2027-06-01', 'PENDING', NULL, 'user3', NULL);

-- PERMINTAAN BARANG
INSERT INTO PermintaanBarang (id, pelangganId, produkId, tanggalPermintaan, jumlahPermintaan, statusPermintaan)
VALUES ('permintaan3', 'pelanggan6', 'produk11', CURRENT_TIMESTAMP, 40, 'PENDING');

-- BARANG KELUAR
INSERT INTO BarangKeluar (id, produkId, permintaanId, tanggalKeluar, jumlahKeluar, tujuan, statusPengeluaran, catatan, dicatatOlehId, approvedById)
VALUES ('barangkeluar3', 'produk11', 'permintaan3', CURRENT_TIMESTAMP, 40, 'Toko Berkah', 'PENDING', NULL, 'user3', NULL);

-- RETUR BARANG
INSERT INTO ReturBarang (id, produkId, barangKeluarId, jenisRetur, tanggalRetur, jumlahRetur, alasanRetur, statusRetur, dicatatOlehId)
VALUES ('retur3', 'produk11', 'barangkeluar3', 'DARI_PELANGGAN', CURRENT_TIMESTAMP, 3, 'Rusak', 'PENDING', 'user3');

-- ALERT STOK
INSERT INTO AlertStok (id, produkId, jenisAlert, pesan, waktuAlert, status)
VALUES ('alert4', 'produk11', 'STOK_MINIMUM', 'Stok menipis', CURRENT_TIMESTAMP, 'AKTIF');

-- MONITORING STOK
INSERT INTO MonitoringStok (id, produkId, waktuMonitor, stokAktual, stokMinimum, status)
VALUES ('monitoring11', 'produk11', CURRENT_TIMESTAMP, 75, 30, 'NORMAL');
```

> **Catatan tipe SQLite:** tanggal pakai teks `'2027-06-01'` atau
> `CURRENT_TIMESTAMP`; boolean pakai `1`/`0`; kolom opsional boleh `NULL`.

---

## Cara 3 — Tambah di file seed (paling rapi, bisa diulang)

Edit `prisma/seed.ts`, tambahkan object baru ke list yang sesuai (mis.
`produkList`), lalu jalankan ulang:

```bash
npm run db:seed
```

> **Perhatian:** seed **menghapus semua data lama** lalu mengisi ulang. Cocok
> untuk data awal/contoh, **bukan** untuk menambah tanpa menghapus. Untuk
> menambah tanpa hapus, gunakan Cara 1 atau Cara 2.

---

## Setelah memasukkan data

1. Refresh halaman dashboard (data dibaca langsung dari DB via Prisma).
2. Jika tidak muncul, pastikan `produkId`/relasi menunjuk ID yang benar.
3. Hentikan & jalankan ulang `npm run dev` bila perlu.
