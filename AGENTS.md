<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Catatan Revisi

> Setiap perubahan/perbaikan dicatat di sini secara ringkas.

## 2026-06-06 — Perbaikan performa: dev server sangat lambat dibuka
- **Masalah:** Halaman lambat sekali dibuka di mode development.
- **Akar masalah:** Script `dev` memakai `next dev --webpack`. Di Next.js 16 Turbopack sudah jadi bundler default dan jauh lebih cepat; flag `--webpack` memaksa jalur lambat.
- **Perbaikan:**
  - `package.json`: `"dev": "next dev --webpack"` → `"dev": "next dev"` (pakai Turbopack default).
  - `next.config.ts`: tambah `experimental.optimizePackageImports: ['lucide-react']` agar hanya ikon yang dipakai yang dikompilasi.
- **Hasil uji:** Turbopack "Ready in ~0.4s"; `/login` compile awal ~5.5s (cold) lalu ~0.1s (warm). `better-sqlite3` aman karena sudah masuk daftar auto-external Next.js.
- **Catatan:** Muncul peringatan deprecation `middleware` → `proxy` (belum diubah, tidak memengaruhi performa).
