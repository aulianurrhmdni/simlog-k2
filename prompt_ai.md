# 🤖 PROMPT AI — SRS Sistem Informasi Logistik Manajemen Persediaan Mie Instan

## Instruksi untuk AI

Kamu adalah seorang analis sistem informasi yang berpengalaman. Saya memiliki laporan **Perencanaan Sistem Informasi Logistik Area Manajemen Persediaan (Inventory) Pada Produk Mie Instan** yang disusun oleh Kelompok 2, Program Studi Teknik Logistik, Institut Teknologi Kalimantan, Semester Genap 2025–2026.

Berdasarkan **aktor**, **alur proses**, dan **diagram sistem** yang terdapat di dalam laporan tersebut, tolong jabarkan isi laporan secara lengkap mengikuti format SRS (Software Requirements Specification) seperti contoh berikut:

---

## 📄 SRS — Sistem Informasi Logistik Manajemen Persediaan Mie Instan
**Kelompok 2 | Teknik Logistik — Institut Teknologi Kalimantan**
**Semester Genap 2025–2026**

---

### 1. PENDAHULUAN
- **1.1 Tujuan** — Jelaskan tujuan dikembangkannya sistem informasi ini, termasuk masalah yang ingin diselesaikan dalam pengelolaan persediaan mie instan.
- **1.2 Audiens yang Dituju** — Sebutkan siapa saja pengguna sistem (aktor-aktor yang terlibat berdasarkan Use Case Diagram).
- **1.3 Batasan Produk** — Jelaskan batasan-batasan sistem, termasuk ruang lingkup area manajemen persediaan (inventory) yang dicakup.
- **1.4 Referensi** — Gunakan referensi dari daftar pustaka laporan yang tersedia ([1] s.d. [15]).
- **1.5 Fungsi Produk** — Jabarkan fungsi-fungsi utama sistem berdasarkan proses bisnis dan UML diagram.
- **1.6 Penggolongan Karakteristik Pengguna** — Identifikasi peran dan hak akses setiap aktor dalam sistem.
- **1.7 Lingkungan Operasi** — Deskripsikan platform dan infrastruktur teknis yang mendukung sistem (berbasis web/desktop, database, dll).
- **1.8 Metode Pengembangan** — Sebutkan metode SDLC yang digunakan beserta tahapan-tahapannya (merujuk ke Bab 3 laporan).

---

### 2. KEBUTUHAN ANTARMUKA EKSTERNAL
- **2.1 Antarmuka Pengguna** — Jelaskan tampilan dan fungsional sistem berdasarkan Bab 5.1 laporan.
- **2.2 Antarmuka Perangkat Keras** — Deskripsikan kebutuhan perangkat keras untuk menjalankan sistem.
- **2.3 Antarmuka Perangkat Lunak** — Sebutkan teknologi, framework, dan database yang digunakan.
- **2.4 Antarmuka Komunikasi** — Jelaskan bagaimana sistem berkomunikasi antar modul atau dengan pengguna (notifikasi, laporan, dll).

---

### 3. KEBUTUHAN FUNGSIONAL

Buat tabel fitur utama sistem berdasarkan Use Case Diagram dan Activity Diagram, dengan format:

| No | Fitur | Pelaku |
|----|-------|--------|
| 1  | [Nama Fitur] | [Aktor] |
| ... | ... | ... |

Kemudian jabarkan:
- **3.1 User Story** — Skenario kebutuhan dari sudut pandang setiap aktor.
- **3.2 Use Case Diagram** — Ringkasan interaksi aktor dengan sistem (merujuk ke Bab 4.1.1).
- **3.3 Use Case Description** — Narasi detail setiap use case.
- **3.4 Sequence Diagram** — Alur interaksi untuk proses **Memantau Stok Real-Time** (merujuk ke Gambar 1, Bab 4.1.3).
- **3.5 Activity Diagram** — Diagram alur aktivitas per fitur (merujuk ke Bab 4.1.2).
- **3.6 Class Diagram** — Ringkasan kelas, atribut, dan relasi sistem kontrol inventaris (merujuk ke Gambar 2 dan Tabel 1, Bab 4.1.4).
- **3.7 DFD (Data Flow Diagram)** — Ringkasan aliran data dari Context Diagram, Level 0, hingga Level 1 (merujuk ke Bab 4.2).
- **3.8 Entity Relationship Diagram (ERD)** — Struktur dan relasi entitas database sistem (merujuk ke Bab 4.3).

---

### 4. KEBUTUHAN NON-FUNGSIONAL

Buat tabel kebutuhan non-fungsional, contoh format:

| No | Aspek | Keterangan |
|----|-------|------------|
| 1  | Keamanan | [Deskripsikan] |
| 2  | Kinerja | [Deskripsikan] |
| 3  | Ketersediaan | [Deskripsikan] |
| 4  | Skalabilitas | [Deskripsikan] |

---

### 5. KEBUTUHAN CONSTRAINTS

Buat tabel kendala/batasan sistem, contoh format:

| No | Parameter | Keterangan |
|----|-----------|------------|
| 1  | Konektivitas | [Deskripsikan] |
| 2  | Platform | [Deskripsikan] |
| 3  | Data | [Deskripsikan] |

---

## 📌 Konteks Tambahan untuk AI

Berikut adalah informasi yang sudah tersedia dari dokumen laporan:

### Struktur Laporan (Daftar Isi)
- Bab 1: Deskripsi Kasus
- Bab 2: Proses Bisnis (Flowchart & Narasi)
- Bab 3: SDLC (Metode Pengembangan & Tahapan)
- Bab 4: Perancangan Sistem
  - 4.1 UML Diagram (Use Case, Activity, Sequence, Class Diagram)
  - 4.2 DFD (Context, Level 0, Level 1)
  - 4.3 ERD
- Bab 5: Kinerja Sistem (Tampilan, Fungsional, Kesimpulan & Saran)

### Diagram yang Tersedia
- **Gambar 1**: Sequence Diagram — Proses Memantau Stok Real-Time (Hal. 8)
- **Gambar 2**: Class Diagram — Sistem Kontrol Inventaris (Hal. 10)
- **Tabel 1**: Daftar Kelas dan Atribut Class Diagram Sistem Kontrol Inventaris (Hal. 11)

### Referensi Utama yang Digunakan
Laporan menggunakan 15 referensi ilmiah yang mencakup topik:
- Manajemen persediaan (Safety Stock, Reorder Point, EOQ)
- Pengembangan sistem informasi inventory berbasis web
- Metode waterfall dan RAD dalam pengembangan sistem
- UML dan pemodelan sistem informasi

---

> **Catatan:** Sesuaikan seluruh isi SRS dengan konten aktual dari sistem informasi manajemen persediaan mie instan ini. Gunakan bahasa Indonesia yang formal dan teknis. Jika ada bagian yang membutuhkan data lebih lanjut dari dokumen asli (seperti nama aktor spesifik, atribut kelas, atau entitas ERD), sebutkan sebagai `[Data dari dokumen asli]` dan minta klarifikasi.
