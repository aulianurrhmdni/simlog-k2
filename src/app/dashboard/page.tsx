import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { StatusBadge } from '@/components/ui/status-badge'
import {
  Package,
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  Bell,
  Clock,
  RefreshCw,
  BarChart3,
  Layers,
  Activity,
} from 'lucide-react'
import { Button, buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  await auth()

  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

  // ── Parallel data fetching ──────────────────────────────────────────────────
  const [
    totalProduk,
    barangMasukCount,
    barangKeluarCount,
    alerts,
    recentMasuk,
    recentKeluar,
    stokData,
  ] = await Promise.all([
    prisma.produk.count(),

    prisma.barangMasuk.count({
      where: { tanggalMasuk: { gte: startOfMonth } },
    }),

    prisma.barangKeluar.count({
      where: { tanggalKeluar: { gte: startOfMonth } },
    }),

    prisma.alertStok.findMany({
      where: { status: 'AKTIF' },
      include: { produk: true },
      orderBy: { waktuAlert: 'desc' },
      take: 10,
    }),

    prisma.barangMasuk.findMany({
      include: { produk: true, supplier: true },
      orderBy: { tanggalMasuk: 'desc' },
      take: 5,
    }),

    prisma.barangKeluar.findMany({
      include: { produk: true },
      orderBy: { tanggalKeluar: 'desc' },
      take: 5,
    }),

    prisma.stok.findMany({
      include: { produk: true },
      orderBy: { jumlahStok: 'asc' },
    }),
  ])

  // ── Stok menipis: jumlahStok <= produk.stokMinimum ─────────────────────────
  const stokMenipis = stokData.filter(
    (s) => s.jumlahStok <= s.produk.stokMinimum
  ).length

  // ── Top-5 products for the bar chart (lowest stock first) ─────────────────
  const chartData = stokData.slice(0, 5).map((s) => {
    const max = Math.max(s.produk.stokMinimum * 2, s.jumlahStok, 1)
    const percentage = Math.round((s.jumlahStok / max) * 100)
    const isLow = s.jumlahStok <= s.produk.stokMinimum
    return { ...s, percentage, isLow, max }
  })

  // ── Helpers ────────────────────────────────────────────────────────────────
  const fmt = (d: Date | string) =>
    new Date(d).toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })

  return (
    <div className="space-y-6">
      {/* ── Page header ─────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Dashboard</h2>
          <p className="text-slate-500 text-sm mt-0.5">
            Monitoring Inventaris Real-time PT CAHAYA INDOMIE
          </p>
        </div>
        {/* Realtime indicator */}
        <div className="flex items-center gap-2 rounded-full bg-green-50 border border-green-200 px-3 py-1.5">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500" />
          </span>
          <span className="text-xs font-semibold text-green-700">Live</span>
        </div>
      </div>

      {/* ── Stat cards ──────────────────────────────────────────────────── */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Total Produk */}
        <Card className="border-l-4 border-l-teal-500 bg-gradient-to-br from-white to-teal-50/40">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">
              Total Produk
            </CardTitle>
            <div className="rounded-md bg-teal-100 p-1.5">
              <Package className="h-4 w-4 text-teal-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-800">{totalProduk}</div>
            <p className="text-xs text-slate-500 mt-1">Item aktif dalam inventaris</p>
          </CardContent>
        </Card>

        {/* Stok Menipis */}
        <Card className="border-l-4 border-l-red-500 bg-gradient-to-br from-white to-red-50/40">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-red-600">
              Stok Menipis
            </CardTitle>
            <div className="rounded-md bg-red-100 p-1.5">
              <AlertTriangle className="h-4 w-4 text-red-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600">{stokMenipis}</div>
            <p className="text-xs text-slate-500 mt-1">Item perlu direorder segera</p>
          </CardContent>
        </Card>

        {/* Barang Masuk */}
        <Card className="border-l-4 border-l-emerald-500 bg-gradient-to-br from-white to-emerald-50/40">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-emerald-600">
              Barang Masuk
            </CardTitle>
            <div className="rounded-md bg-emerald-100 p-1.5">
              <ArrowDownRight className="h-4 w-4 text-emerald-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-emerald-600">{barangMasukCount}</div>
            <p className="text-xs text-slate-500 mt-1">Transaksi bulan ini</p>
          </CardContent>
        </Card>

        {/* Barang Keluar */}
        <Card className="border-l-4 border-l-amber-500 bg-gradient-to-br from-white to-amber-50/40">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-amber-600">
              Barang Keluar
            </CardTitle>
            <div className="rounded-md bg-amber-100 p-1.5">
              <ArrowUpRight className="h-4 w-4 text-amber-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-amber-600">{barangKeluarCount}</div>
            <p className="text-xs text-slate-500 mt-1">Transaksi bulan ini</p>
          </CardContent>
        </Card>
      </div>

      {/* ── Stock level bar chart + Quick actions ─────────────────────── */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Bar chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-slate-500" />
              <CardTitle className="text-base">Level Stok Produk</CardTitle>
            </div>
            <CardDescription>5 produk dengan stok terendah</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {chartData.length === 0 ? (
              <p className="text-sm text-slate-400 py-6 text-center">Belum ada data stok</p>
            ) : (
              chartData.map((item) => (
                <div key={item.id} className="space-y-1.5">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium truncate max-w-[55%]">
                      {item.produk.namaProduk}
                    </span>
                    <span
                      className={
                        item.isLow
                          ? 'font-semibold text-red-600'
                          : 'font-semibold text-emerald-600'
                      }
                    >
                      {item.jumlahStok}
                      <span className="text-slate-400 font-normal">
                        {' '}/ min {item.produk.stokMinimum} {item.produk.satuan}
                      </span>
                    </span>
                  </div>
                  <div className="h-2.5 w-full rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        item.isLow ? 'bg-red-500' : 'bg-emerald-500'
                      }`}
                      style={{ width: `${Math.min(item.percentage, 100)}%` }}
                    />
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Quick actions */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-slate-500" />
              <CardTitle className="text-base">Aksi Cepat</CardTitle>
            </div>
            <CardDescription>Navigasi ke modul utama</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <Link href="/dashboard/barang-masuk" className={cn(buttonVariants({ variant: 'default' }), "w-full justify-start gap-2 bg-emerald-600 hover:bg-emerald-700 text-white")}>
              <ArrowDownRight className="h-4 w-4" />
              Penerimaan Barang
            </Link>
            <Link href="/dashboard/stok" className={cn(buttonVariants({ variant: 'outline' }), "w-full justify-start gap-2 border-teal-200 text-teal-700 hover:bg-teal-50")}>
              <Layers className="h-4 w-4" />
              Kelola Stok
            </Link>
            <Link href="/dashboard/monitoring" className={cn(buttonVariants({ variant: 'outline' }), "w-full justify-start gap-2 border-blue-200 text-blue-700 hover:bg-blue-50")}>
              <RefreshCw className="h-4 w-4" />
              Monitoring Stok
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* ── Alert section ────────────────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-red-600" />
            <CardTitle>Alert Stok Terkini</CardTitle>
            {alerts.length > 0 && (
              <span className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-semibold text-red-800">
                {alerts.length} aktif
              </span>
            )}
          </div>
          <CardDescription>Notifikasi stok di bawah batas minimum</CardDescription>
        </CardHeader>
        <CardContent>
          {alerts.length === 0 ? (
            <p className="text-sm text-slate-400 py-8 text-center">
              Tidak ada alert aktif saat ini ✓
            </p>
          ) : (
            <div className="space-y-3">
              {alerts.map((alert) => (
                <div
                  key={alert.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-red-50 border border-red-100"
                >
                  <div className="flex items-center gap-3">
                    <div className="rounded-full bg-red-100 p-1.5 shrink-0">
                      <AlertTriangle className="h-4 w-4 text-red-600" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold">{alert.produk.namaProduk}</p>
                      <p className="text-xs text-slate-500">{alert.pesan}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <StatusBadge status={alert.jenisAlert} />
                    <span className="text-xs text-slate-400">
                      {fmt(alert.waktuAlert)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Recent transactions ──────────────────────────────────────────── */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Recent Barang Masuk */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <ArrowDownRight className="h-5 w-5 text-emerald-600" />
              <CardTitle className="text-base">Barang Masuk Terbaru</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            {recentMasuk.length === 0 ? (
              <p className="text-sm text-slate-400 py-4 text-center">Belum ada data</p>
            ) : (
              <div className="space-y-3 divide-y divide-slate-100">
                {recentMasuk.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between pt-3 first:pt-0"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-semibold truncate">
                        {item.produk.namaProduk}
                      </p>
                      <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                        <Clock className="h-3 w-3" />
                        {fmt(item.tanggalMasuk)}
                        {item.supplier && (
                          <span className="text-slate-300">· {item.supplier.namaSupplier}</span>
                        )}
                      </p>
                    </div>
                    <div className="text-right shrink-0 ml-2">
                      <p className="text-sm font-bold text-emerald-600">
                        +{item.jumlahMasuk}
                      </p>
                      <StatusBadge status={item.statusPenerimaan} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Barang Keluar */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <ArrowUpRight className="h-5 w-5 text-amber-600" />
              <CardTitle className="text-base">Barang Keluar Terbaru</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            {recentKeluar.length === 0 ? (
              <p className="text-sm text-slate-400 py-4 text-center">Belum ada data</p>
            ) : (
              <div className="space-y-3 divide-y divide-slate-100">
                {recentKeluar.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between pt-3 first:pt-0"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-semibold truncate">
                        {item.produk.namaProduk}
                      </p>
                      <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                        <Clock className="h-3 w-3" />
                        {fmt(item.tanggalKeluar)}
                        {item.tujuan && (
                          <span className="text-slate-300">· {item.tujuan}</span>
                        )}
                      </p>
                    </div>
                    <div className="text-right shrink-0 ml-2">
                      <p className="text-sm font-bold text-amber-600">
                        -{item.jumlahKeluar}
                      </p>
                      <StatusBadge status={item.statusPengeluaran} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
