'use client'

import { useEffect, useState, useTransition } from 'react'
import { toast } from 'sonner'
import { MessageSquare, Plus, User, Package, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
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
import { createKeluhan, updateStatusKeluhan } from './actions'

type PelangganItem = { id: string; namaPelanggan: string }
type ProdukItem = { id: string; namaProduk: string }

type KeluhanItem = {
  id: string
  tanggalKeluhan: string
  deskripsiKeluhan: string
  statusKeluhan: string
  pelanggan: { namaPelanggan: string } | null
  produk: { namaProduk: string } | null
}

const STATUS_STYLES: Record<string, string> = {
  OPEN: 'bg-red-100 text-red-800 border-red-200',
  DIPROSES: 'bg-amber-100 text-amber-800 border-amber-200',
  SELESAI: 'bg-green-100 text-green-800 border-green-200',
}

const FILTER_TABS = ['Semua', 'OPEN', 'DIPROSES', 'SELESAI']

function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${STATUS_STYLES[status] ?? 'bg-gray-100 text-gray-700 border-gray-200'}`}>
      {status}
    </span>
  )
}

export default function KeluhanPage() {
  const [keluhan, setKeluhan] = useState<KeluhanItem[]>([])
  const [pelangganList, setPelangganList] = useState<PelangganItem[]>([])
  const [produkList, setProdukList] = useState<ProdukItem[]>([])
  const [activeFilter, setActiveFilter] = useState('Semua')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [isPending, startTransition] = useTransition()

  const fetchData = async () => {
    const res = await fetch('/api/keluhan')
    if (res.ok) {
      const data = await res.json()
      setKeluhan(data.keluhan ?? [])
      setPelangganList(data.pelangganList ?? [])
      setProdukList(data.produkList ?? [])
    }
  }

  useEffect(() => { fetchData() }, [])

  const filtered = activeFilter === 'Semua'
    ? keluhan
    : keluhan.filter(k => k.statusKeluhan === activeFilter)

  const counts = {
    total: keluhan.length,
    open: keluhan.filter(k => k.statusKeluhan === 'OPEN').length,
    diproses: keluhan.filter(k => k.statusKeluhan === 'DIPROSES').length,
    selesai: keluhan.filter(k => k.statusKeluhan === 'SELESAI').length,
  }

  const handleCreate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    startTransition(async () => {
      const result = await createKeluhan(formData)
      if (result?.error) {
        toast.error(result.error)
      } else {
        toast.success('Keluhan berhasil dicatat')
        setDialogOpen(false)
        fetchData()
      }
    })
  }

  const handleStatusUpdate = (id: string, status: string) => {
    startTransition(async () => {
      const result = await updateStatusKeluhan(id, status)
      if (result?.error) {
        toast.error(result.error)
      } else {
        toast.success(`Keluhan diubah ke ${status}`)
        fetchData()
      }
    })
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-orange-100">
            <MessageSquare className="h-6 w-6 text-orange-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Keluhan Pelanggan</h1>
            <p className="text-sm text-gray-500">Pantau dan tangani keluhan persediaan dari pelanggan</p>
          </div>
        </div>
        <Button onClick={() => setDialogOpen(true)} className="gap-2 bg-orange-600 hover:bg-orange-700">
          <Plus className="h-4 w-4" />
          Catat Keluhan
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl border bg-white p-4 shadow-sm">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-gray-400" />
            <p className="text-sm text-gray-500">Total Keluhan</p>
          </div>
          <p className="text-3xl font-bold text-gray-900 mt-1">{counts.total}</p>
        </div>
        <div className="rounded-xl border bg-red-50 border-red-200 p-4 shadow-sm">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-red-500" />
            <p className="text-sm text-red-700 font-medium">Open</p>
          </div>
          <p className="text-3xl font-bold text-red-800 mt-1">{counts.open}</p>
          <p className="text-xs text-red-600 mt-0.5">Belum ditangani</p>
        </div>
        <div className="rounded-xl border bg-amber-50 border-amber-200 p-4 shadow-sm">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-amber-500" />
            <p className="text-sm text-amber-700 font-medium">Diproses</p>
          </div>
          <p className="text-3xl font-bold text-amber-800 mt-1">{counts.diproses}</p>
          <p className="text-xs text-amber-600 mt-0.5">Sedang ditangani</p>
        </div>
        <div className="rounded-xl border bg-green-50 border-green-200 p-4 shadow-sm">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-green-500" />
            <p className="text-sm text-green-700 font-medium">Selesai</p>
          </div>
          <p className="text-3xl font-bold text-green-800 mt-1">{counts.selesai}</p>
          <p className="text-xs text-green-600 mt-0.5">Sudah diselesaikan</p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 flex-wrap">
        {FILTER_TABS.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveFilter(tab)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-colors ${
              activeFilter === tab
                ? 'bg-orange-600 text-white border-orange-600'
                : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
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
              <TableHead className="font-semibold">Tanggal</TableHead>
              <TableHead className="font-semibold">Pelanggan</TableHead>
              <TableHead className="font-semibold">Produk</TableHead>
              <TableHead className="font-semibold">Deskripsi</TableHead>
              <TableHead className="font-semibold">Status</TableHead>
              <TableHead className="font-semibold text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-10 text-gray-400">
                  Tidak ada keluhan ditemukan
                </TableCell>
              </TableRow>
            ) : (
              filtered.map(item => (
                <TableRow key={item.id} className="hover:bg-gray-50">
                  <TableCell className="text-sm whitespace-nowrap">
                    {item.tanggalKeluhan
                      ? new Date(item.tanggalKeluhan).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })
                      : '-'}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5 text-sm">
                      <User className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                      {item.pelanggan?.namaPelanggan ?? '-'}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5 text-sm">
                      <Package className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                      {item.produk?.namaProduk ?? '-'}
                    </div>
                  </TableCell>
                  <TableCell>
                    <p className="text-sm text-gray-600 max-w-[220px] truncate" title={item.deskripsiKeluhan}>
                      {item.deskripsiKeluhan}
                    </p>
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={item.statusKeluhan} />
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      {item.statusKeluhan === 'OPEN' && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-amber-600 border-amber-300 hover:bg-amber-50"
                          disabled={isPending}
                          onClick={() => handleStatusUpdate(item.id, 'DIPROSES')}
                        >
                          Proses
                        </Button>
                      )}
                      {item.statusKeluhan === 'DIPROSES' && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-green-600 border-green-300 hover:bg-green-50"
                          disabled={isPending}
                          onClick={() => handleStatusUpdate(item.id, 'SELESAI')}
                        >
                          Selesai
                        </Button>
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
              <MessageSquare className="h-5 w-5 text-orange-600" />
              Catat Keluhan Pelanggan
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="pelanggan_id">Pelanggan <span className="text-red-500">*</span></Label>
              <Select name="pelanggan_id" required>
                <SelectTrigger id="pelanggan_id">
                  <SelectValue placeholder="Pilih pelanggan..." />
                </SelectTrigger>
                <SelectContent>
                  {pelangganList.map(p => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.namaPelanggan}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="produk_id">Produk <span className="text-red-500">*</span></Label>
              <Select name="produk_id" required>
                <SelectTrigger id="produk_id">
                  <SelectValue placeholder="Pilih produk..." />
                </SelectTrigger>
                <SelectContent>
                  {produkList.map(p => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.namaProduk}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="deskripsi">Deskripsi Keluhan <span className="text-red-500">*</span></Label>
              <Textarea
                id="deskripsi"
                name="deskripsi"
                placeholder="Jelaskan keluhan secara detail..."
                rows={4}
                required
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Batal
              </Button>
              <Button type="submit" disabled={isPending} className="bg-orange-600 hover:bg-orange-700">
                {isPending ? 'Menyimpan...' : 'Catat Keluhan'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
