// ============================================================
// MIGRASI DATA — role 'superadmin' → 'admin'
// ============================================================
// Script sekali jalan untuk memperbarui record User lama yang
// masih menyimpan role 'superadmin' menjadi 'admin'.
// Tidak menghapus data lain. Jalankan: npm run db:fix-role
// ============================================================

import { PrismaClient } from '@prisma/client'
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3'
import path from 'path'

const DB_PATH = path.join(process.cwd(), 'prisma', 'dev.db')
const adapter = new PrismaBetterSqlite3({ url: `file:${DB_PATH}` })
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const prisma = new PrismaClient({ adapter } as any)

async function main() {
  const result = await prisma.user.updateMany({
    where: { role: 'superadmin' },
    data: { role: 'admin' },
  })
  console.log(`✅ ${result.count} user diperbarui dari role 'superadmin' → 'admin'`)
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(async () => { await prisma.$disconnect() })
