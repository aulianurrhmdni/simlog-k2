'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createLaporan, getLaporanExportData } from './actions'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { FileBarChart2, Download, FileText, Calendar } from 'lucide-react'
import { toast } from 'sonner'

interface Laporan {
  id: string
  jenisLaporan: string
  tanggalLaporan: string | Date
  periodeAwal: string | Date | null
  periodeAkhir: string | Date | null
  dibuatOleh?: { name: string | null } | null
}

interface LaporanClientProps {
  role: string
  laporanList: Laporan[]
}

export function LaporanClient({ role, laporanList }: LaporanClientProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [jenisLaporan, setJenisLaporan] = useState('Laporan Stok Saat Ini')
  const [downloadingId, setDownloadingId] = useState<string | null>(null)

  const canExport = role === 'superadmin' || role === 'manager_gudang'

  async function handleDownload(item: Laporan) {
    setDownloadingId(item.id)
    try {
      const res = await getLaporanExportData(item.jenisLaporan, item.periodeAwal, item.periodeAkhir)
      if (res.error) {
        toast.error('Gagal mengambil data laporan', { description: res.error })
        return
      }

      if (!res.data || res.data.length === 0) {
        toast.warning('Data tidak ditemukan', {
          description: 'Tidak ada catatan transaksi untuk periode yang dipilih.',
        })
        return
      }

      // Dynamic import to keep bundle small
      const XLSX = await import('xlsx')
      const ws = XLSX.utils.json_to_sheet(res.data)

      // Auto-fit column widths
      const maxLens = res.data.reduce((acc: any, row: any) => {
        Object.keys(row).forEach((key) => {
          const len = String(row[key] ?? '').length
          acc[key] = Math.max(acc[key] || 10, len)
        })
        return acc
      }, {})
      ws['!cols'] = Object.keys(maxLens).map((key) => ({ wch: maxLens[key] + 3 }))

      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, 'Data Laporan')

      const cleanName = item.jenisLaporan.replace(/\s+/g, '_')
      const timestamp = new Date().toISOString().slice(0, 10)
      XLSX.writeFile(wb, `${cleanName}_${timestamp}.xlsx`)

      toast.success('Unduh berhasil', {
        description: `Laporan ${item.jenisLaporan} telah berhasil diekspor ke Excel.`,
      })
    } catch (e: any) {
      toast.error('Gagal mengunduh file', { description: e.message })
    } finally {
      setDownloadingId(null)
    }
  }

  async function handleSubmit(formData: FormData) {
    formData.set('jenis_laporan', jenisLaporan)
    startTransition(async () => {
      const res = await createLaporan(formData)
      if (res?.error) {
        toast.error('Gagal mengekspor laporan', { description: res.error })
      } else {
        toast.success('Laporan berhasil diekspor & disimpan ke basis data')
        router.refresh()
      }
    })
  }

  const fmt = (d: Date | string) =>
    new Date(d).toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })

  const fmtDateOnly = (d: Date | string | null) => {
    if (!d) return '-'
    return new Date(d).toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-teal-100 p-2">
            <FileBarChart2 className="h-6 w-6 text-teal-600" />
          </div>
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Laporan Inventory</h2>
            <p className="text-slate-500 text-sm mt-0.5">
              Ekspor dan cetak laporan inventaris PT CAHAYA INDOMIE secara berkala
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Export Form */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-base">Ekspor Laporan Baru</CardTitle>
            <CardDescription>
              {canExport
                ? 'Pilih kriteria laporan dan ekspor ke database real-time.'
                : 'Role Anda tidak diizinkan mengekspor laporan.'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {canExport ? (
              <form action={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <Label>Jenis Laporan</Label>
                  <Select value={jenisLaporan} onValueChange={(val) => setJenisLaporan(val || '')}>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih Jenis Laporan" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Laporan Stok Saat Ini">Laporan Stok Saat Ini</SelectItem>
                      <SelectItem value="Laporan Alur Barang Masuk">Laporan Alur Barang Masuk</SelectItem>
                      <SelectItem value="Laporan Alur Barang Keluar">Laporan Alur Barang Keluar</SelectItem>
                      <SelectItem value="Laporan Retur Barang">Laporan Retur Barang</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="periode_awal">Periode Awal</Label>
                  <Input type="date" id="periode_awal" name="periode_awal" />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="periode_akhir">Periode Akhir</Label>
                  <Input type="date" id="periode_akhir" name="periode_akhir" />
                </div>

                <Button
                  type="submit"
                  disabled={isPending}
                  className="w-full bg-teal-600 hover:bg-teal-700 text-white gap-2 mt-4"
                >
                  <Download className="h-4 w-4" />
                  {isPending ? 'Mengekspor…' : 'Ekspor Laporan'}
                </Button>
              </form>
            ) : (
              <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 text-center text-slate-500 text-sm">
                Akses ekspor dan cetak laporan dinonaktifkan untuk role Staf Gudang / Inventory Control.
              </div>
            )}
          </CardContent>
        </Card>

        {/* History Table */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Riwayat Laporan Diekspor</CardTitle>
            <CardDescription>Daftar ekspor laporan inventaris PT CAHAYA INDOMIE</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50">
                    <TableHead>Jenis Laporan</TableHead>
                    <TableHead>Periode</TableHead>
                    <TableHead>Diekspor Pada</TableHead>
                    <TableHead>Oleh</TableHead>
                    <TableHead className="text-center">Unduh</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {laporanList.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-12 text-slate-400">
                        Belum ada laporan yang diekspor
                      </TableCell>
                    </TableRow>
                  ) : (
                    laporanList.map((item) => (
                      <TableRow key={item.id} className="hover:bg-slate-50/60">
                        <TableCell className="font-semibold text-slate-800 flex items-center gap-2">
                          <FileText className="h-4 w-4 text-teal-600 shrink-0" />
                          {item.jenisLaporan}
                        </TableCell>
                        <TableCell className="text-slate-600 text-sm">
                          {item.periodeAwal || item.periodeAkhir ? (
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3 text-slate-400" />
                              {fmtDateOnly(item.periodeAwal)} - {fmtDateOnly(item.periodeAkhir)}
                            </span>
                          ) : (
                            <span className="text-slate-400 italic">Semua Waktu</span>
                          )}
                        </TableCell>
                        <TableCell className="text-slate-500 text-xs">{fmt(item.tanggalLaporan)}</TableCell>
                        <TableCell className="text-slate-700 font-medium text-sm">
                          {item.dibuatOleh?.name ?? 'Sistem'}
                        </TableCell>
                        <TableCell className="text-center">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-teal-600 hover:text-teal-700 hover:bg-teal-50"
                            disabled={downloadingId === item.id}
                            onClick={() => handleDownload(item)}
                          >
                            {downloadingId === item.id ? (
                              <svg
                                className="animate-spin h-4 w-4"
                                fill="none"
                                viewBox="0 0 24 24"
                              >
                                <circle
                                  className="opacity-25"
                                  cx="12"
                                  cy="12"
                                  r="10"
                                  stroke="currentColor"
                                  strokeWidth="4"
                                />
                                <path
                                  className="opacity-75"
                                  fill="currentColor"
                                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                />
                              </svg>
                            ) : (
                              <Download className="h-4 w-4" />
                            )}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
