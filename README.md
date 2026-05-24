# Sistem Informasi Logistik — Manajemen Persediaan (Inventory)

Proyek ini dibangun menggunakan [Next.js](https://nextjs.org) (App Router), Prisma ORM, dan SQLite (Better-SQLite3) sebagai basis data lokal. Autentikasi dikelola menggunakan NextAuth (Auth.js).

## Prasyarat
- Node.js (v18 atau terbaru)
- npm / yarn / pnpm

## Setup Proyek

1. **Install dependensi**
   ```bash
   npm install
   ```

2. **Setup Database Prisma**
   Jalankan migrasi dan generate Prisma Client:
   ```bash
   npm run db:push
   npm run postinstall
   ```

3. **Seeding Database**
   Untuk mengisi database dengan data awal (termasuk user default):
   ```bash
   npm run db:seed
   ```
   *Catatan: Akun SuperAdmin akan dibuat (email: admin@teklog.com, password: adminpassword).*

4. **Menjalankan Development Server**
   ```bash
   npm run dev
   ```

5. **Prisma Studio (Opsional)**
   Anda dapat melihat isi database secara visual melalui Prisma Studio:
   ```bash
   npm run db:studio
   ```

Buka [http://localhost:3000](http://localhost:3000) di browser untuk melihat hasilnya.

## Teknologi Utama
- **Frontend:** Next.js 14, React, Tailwind CSS, shadcn/ui
- **Backend/API:** Next.js Server Actions & API Routes
- **Database:** Prisma ORM, SQLite (via `better-sqlite3`)
- **Autentikasi:** NextAuth.js
