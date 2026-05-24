'use client'

import { useEffect, useState, useTransition } from 'react'
import { toast } from 'sonner'
import { Truck, Plus, CalendarDays, MapPin, FileText } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { createPengiriman, updateStatusPengiriman } from './actions'

type PermintaanInfo = {
  id: string
  pelanggan: { namaPelanggan: string } | null
}

type PengirimanItem = {
  id: string
  tanggalJadwal: string | null
  tanggalKirim: string | null
  statusPengiriman: string
  catatan: string | null
  permintaan: {
    id: string
    pelanggan: { namaPelanggan: string } | null
  } | null
}

const STATUS_COLORS: Record<string, string> = {
  DIJADWALKAN: 'bg-amber-100 text-amber-800',
  DIKIRIM: 'bg-blue-100 text-blue-800',
  SELESAI: 'bg-green-100 text-green-800',
  GAGAL: 'bg-red-100 text-red-800',
}

const FILTER_TABS = ['Semua', 'DIJADWALKAN', 'DIKIRIM', 'SELESAI', 'GAGAL']

function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_COLORS[status] ?? 'bg-gray-100 text-gray-700'}`}>
      {status}
    </span>
  )
}

export default function PengirimanPage() {
  const [pengiriman, setPengiriman] = useState<PengirimanItem[]>([])
  const [permintaanList, setPermintaanList] = useState<PermintaanInfo[]>([])
  const [activeFilter, setActiveFilter] = useState('Semua')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [isPending, startTransition] = useTransition()

  const fetchData = async () => {
    const res = await fetch('/api/pengiriman')
    if (res.ok) {
      const data = await res.json()
      setPengiriman(data.pengiriman ?? [])
      setPermintaanList(data.permintaanList ?? [])
    }
  }

  useEffect(() => { fetchData() }, [])

  const filtered = activeFilter === 'Semua'
    ? pengiriman
    : pengiriman.filter(p => p.statusPengiriman === activeFilter)

  const counts = {
    total: pengiriman.length,
    dijadwalkan: pengiriman.filter(p => p.statusPengiriman === 'DIJADWALKAN').length,
    dikirim: pengiriman.filter(p => p.statusPengiriman === 'DIKIRIM').length,
    selesai: pengiriman.filter(p => p.statusPengiriman === 'SELESAI').length,
  }

  const handleCreate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    startTransition(async () => {
      const result = await createPengiriman(formData)
      if (result?.error) {
        toast.error(result.error)
      } else {
        toast.success('Pengiriman berhasil dibuat')
        setDialogOpen(false)
        fetchData()
      }
    })
  }

  const handleStatusUpdate = (id: string, status: string) => {
    startTransition(async () => {
      const result = await updateStatusPengiriman(id, status)
      if (result?.error) {
        toast.error(result.error)
      } else {
        toast.success(`Status diubah ke ${status}`)
        fetchData()
      }
    })
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-blue-100">
            <Truck className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Manajemen Pengiriman</h1>
            <p className="text-sm text-gray-500">Kelola jadwal dan status pengiriman barang</p>
          </div>
        </div>
        <Button onClick={() => setDialogOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Buat Pengiriman Baru
        </Button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl border bg-white p-4 shadow-sm">
          <p className="text-sm text-gray-500">Total Pengiriman</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">{counts.total}</p>
        </div>
        <div className="rounded-xl border bg-amber-50 p-4 shadow-sm border-amber-200">
          <p className="text-sm text-amber-700">Dijadwalkan</p>
          <p className="text-3xl font-bold text-amber-800 mt-1">{counts.dijadwalkan}</p>
        </div>
        <div className="rounded-xl border bg-blue-50 p-4 shadow-sm border-blue-200">
          <p className="text-sm text-blue-700">Sedang Dikirim</p>
          <p className="text-3xl font-bold text-blue-800 mt-1">{counts.dikirim}</p>
        </div>
        <div className="rounded-xl border bg-green-50 p-4 shadow-sm border-green-200">
          <p className="text-sm text-green-700">Selesai</p>
          <p className="text-3xl font-bold text-green-800 mt-1">{counts.selesai}</p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 flex-wrap">
        {FILTER_TABS.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveFilter(tab)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              activeFilter === tab
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* DataTable */}
      <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50">
              <TableHead className="font-semibold">Jadwal</TableHead>
              <TableHead className="font-semibold">Tujuan (Pelanggan)</TableHead>
              <TableHead className="font-semibold">Status</TableHead>
              <TableHead className="font-semibold">Catatan</TableHead>
              <TableHead className="font-semibold text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-10 text-gray-400">
                  Tidak ada data pengiriman
                </TableCell>
              </TableRow>
            ) : (
              filtered.map(item => (
                <TableRow key={item.id} className="hover:bg-gray-50">
                  <TableCell>
                    <div className="flex items-center gap-1.5 text-sm">
                      <CalendarDays className="h-3.5 w-3.5 text-gray-400" />
                      {item.tanggalJadwal
                        ? new Date(item.tanggalJadwal).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })
                        : '-'}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5 text-sm">
                      <MapPin className="h-3.5 w-3.5 text-gray-400" />
                      {item.permintaan?.pelanggan?.namaPelanggan ?? '-'}
                    </div>
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={item.statusPengiriman} />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5 text-sm text-gray-500 max-w-[200px] truncate">
                      <FileText className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                      {item.catatan ?? '-'}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      {item.statusPengiriman === 'DIJADWALKAN' && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-blue-600 border-blue-300 hover:bg-blue-50"
                          disabled={isPending}
                          onClick={() => handleStatusUpdate(item.id, 'DIKIRIM')}
                        >
                          Kirim
                        </Button>
                      )}
                      {item.statusPengiriman === 'DIKIRIM' && (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-green-600 border-green-300 hover:bg-green-50"
                            disabled={isPending}
                            onClick={() => handleStatusUpdate(item.id, 'SELESAI')}
                          >
                            Selesai
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-red-600 border-red-300 hover:bg-red-50"
                            disabled={isPending}
                            onClick={() => handleStatusUpdate(item.id, 'GAGAL')}
                          >
                            Gagal
                          </Button>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Create Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Truck className="h-5 w-5 text-blue-600" />
              Buat Pengiriman Baru
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="permintaan_id">Permintaan (Opsional)</Label>
              <Select name="permintaan_id">
                <SelectTrigger id="permintaan_id">
                  <SelectValue placeholder="Pilih permintaan..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Tanpa Permintaan</SelectItem>
                  {permintaanList.map(p => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.pelanggan?.namaPelanggan ?? p.id}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="tanggal_jadwal">Tanggal Jadwal</Label>
              <Input
                id="tanggal_jadwal"
                name="tanggal_jadwal"
                type="datetime-local"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="catatan">Catatan</Label>
              <Textarea
                id="catatan"
                name="catatan"
                placeholder="Tambahkan catatan pengiriman..."
                rows={3}
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Batal
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? 'Menyimpan...' : 'Buat Pengiriman'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
