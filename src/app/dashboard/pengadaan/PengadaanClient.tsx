'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { ShoppingCart, Plus, User, Package, Hash, CheckCircle, XCircle } from 'lucide-react'
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
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { createPermintaan, updateStatusPermintaan } from './actions'

type PelangganItem = { id: string; namaPelanggan: string }
type ProdukItem = { id: string; namaProduk: string }

type PermintaanItem = {
  id: string
  tanggalPermintaan: string | Date
  jumlahPermintaan: number
  statusPermintaan: string
  pelanggan: { namaPelanggan: string } | null
  produk: { namaProduk: string } | null
}

interface PengadaanClientProps {
  role: string
  permintaan: PermintaanItem[]
  pelangganList: PelangganItem[]
  produkList: ProdukItem[]
}

const STATUS_PILL_STYLES: Record<string, string> = {
  PENDING: 'bg-amber-100 text-amber-800 border-amber-200',
  DISETUJUI: 'bg-green-100 text-green-800 border-green-200',
  DITOLAK: 'bg-red-100 text-red-800 border-red-200',
}

const FILTER_TABS = ['Semua', 'PENDING', 'DISETUJUI', 'DITOLAK']

function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${STATUS_PILL_STYLES[status] ?? 'bg-gray-100 text-gray-700 border-gray-200'}`}>
      {status}
    </span>
  )
}

export function PengadaanClient({ role, permintaan, pelangganList, produkList }: PengadaanClientProps) {
  const router = useRouter()
  const [activeFilter, setActiveFilter] = useState('Semua')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  // Mode pemilihan pelanggan: pilih dari daftar atau input manual
  const [pelangganMode, setPelangganMode] = useState<'existing' | 'baru'>('existing')

  const canManage = role === 'admin' || role === 'inventory_control'

  const filtered = activeFilter === 'Semua'
    ? permintaan
    : permintaan.filter(p => p.statusPermintaan === activeFilter)

  const counts = {
    pending: permintaan.filter(p => p.statusPermintaan === 'PENDING').length,
    disetujui: permintaan.filter(p => p.statusPermintaan === 'DISETUJUI').length,
    ditolak: permintaan.filter(p => p.statusPermintaan === 'DITOLAK').length,
  }

  const handleCreate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    startTransition(async () => {
      const result = await createPermintaan(formData)
      if (result?.error) {
        toast.error(result.error)
      } else {
        toast.success('Permintaan berhasil dibuat')
        setDialogOpen(false)
        router.refresh()
      }
    })
  }

  const handleStatusUpdate = (id: string, status: string) => {
    startTransition(async () => {
      const result = await updateStatusPermintaan(id, status)
      if (result?.error) {
        toast.error(result.error)
      } else {
        toast.success(`Permintaan ${status.toLowerCase()}`)
        router.refresh()
      }
    })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-teal-100">
            <ShoppingCart className="h-6 w-6 text-teal-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Permintaan & Pengadaan</h1>
            <p className="text-sm text-slate-500">Kelola pesanan pelanggan PT CAHAYA INDOMIE</p>
          </div>
        </div>
        {canManage && (
          <Button onClick={() => setDialogOpen(true)} className="bg-teal-600 hover:bg-teal-700 text-white gap-2">
            <Plus className="h-4 w-4" />
            Buat Permintaan
          </Button>
        )}
      </div>

      {/* Stat Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-xl border bg-amber-50/50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/30 p-4 shadow-sm">
          <p className="text-sm text-amber-700 dark:text-amber-400 font-medium">Pending</p>
          <p className="text-3xl font-bold text-amber-800 dark:text-amber-300 mt-1">{counts.pending}</p>
          <p className="text-xs text-amber-600 dark:text-amber-500 mt-0.5">Menunggu persetujuan</p>
        </div>
        <div className="rounded-xl border bg-green-50/50 dark:bg-green-950/20 border-green-200 dark:border-green-900/30 p-4 shadow-sm">
          <p className="text-sm text-green-700 dark:text-green-400 font-medium">Disetujui</p>
          <p className="text-3xl font-bold text-green-800 dark:text-green-300 mt-1">{counts.disetujui}</p>
          <p className="text-xs text-green-600 dark:text-green-500 mt-0.5">Permintaan disetujui</p>
        </div>
        <div className="rounded-xl border bg-red-50/50 dark:bg-red-950/20 border-red-200 dark:border-red-900/30 p-4 shadow-sm">
          <p className="text-sm text-red-700 dark:text-red-400 font-medium">Ditolak</p>
          <p className="text-3xl font-bold text-red-800 dark:text-red-300 mt-1">{counts.ditolak}</p>
          <p className="text-xs text-red-600 dark:text-red-500 mt-0.5">Permintaan ditolak</p>
        </div>
      </div>

      {/* Filter Pills */}
      <div className="flex gap-2 flex-wrap">
        {FILTER_TABS.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveFilter(tab)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-colors ${
              activeFilter === tab
                ? 'bg-teal-600 text-white border-teal-600'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-350 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-850'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* DataTable */}
      <div className="rounded-xl border bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50 dark:bg-slate-950/40">
              <TableHead className="font-semibold">Tanggal</TableHead>
              <TableHead className="font-semibold">Pelanggan</TableHead>
              <TableHead className="font-semibold">Produk</TableHead>
              <TableHead className="font-semibold">Jumlah (dus)</TableHead>
              <TableHead className="font-semibold">Status</TableHead>
              {canManage && <TableHead className="font-semibold text-right">Aksi</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={canManage ? 6 : 5} className="text-center py-10 text-slate-400">
                  Tidak ada data permintaan
                </TableCell>
              </TableRow>
            ) : (
              filtered.map(item => (
                <TableRow key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-950/20">
                  <TableCell className="text-sm">
                    {item.tanggalPermintaan
                      ? new Date(item.tanggalPermintaan).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })
                      : '-'}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5 text-sm">
                      <User className="h-3.5 w-3.5 text-slate-450" />
                      {item.pelanggan?.namaPelanggan ?? '-'}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5 text-sm">
                      <Package className="h-3.5 w-3.5 text-slate-450" />
                      {item.produk?.namaProduk ?? '-'}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5 text-sm font-semibold text-teal-650">
                      <Hash className="h-3.5 w-3.5 text-slate-400" />
                      {item.jumlahPermintaan}
                    </div>
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={item.statusPermintaan} />
                  </TableCell>
                  {canManage && (
                    <TableCell className="text-right">
                      {item.statusPermintaan === 'PENDING' ? (
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-green-600 hover:text-green-700 hover:bg-green-50"
                            disabled={isPending}
                            onClick={() => handleStatusUpdate(item.id, 'DISETUJUI')}
                          >
                            <CheckCircle className="h-4 w-4 mr-1" /> Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            disabled={isPending}
                            onClick={() => handleStatusUpdate(item.id, 'DITOLAK')}
                          >
                            <XCircle className="h-4 w-4 mr-1" /> Tolak
                          </Button>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-450 italic">Selesai diproses</span>
                      )}
                    </TableCell>
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Create Dialog */}
      <Dialog open={dialogOpen} onOpenChange={(open) => {
        setDialogOpen(open)
        if (!open) setPelangganMode('existing')
      }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5 text-teal-600" />
              Buat Permintaan Barang Baru
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="pelanggan_id">Pelanggan <span className="text-red-500">*</span></Label>
                <button
                  type="button"
                  onClick={() => setPelangganMode(pelangganMode === 'existing' ? 'baru' : 'existing')}
                  className="text-xs font-medium text-teal-600 hover:text-teal-700"
                >
                  {pelangganMode === 'existing' ? '+ Input pelanggan manual' : '← Pilih dari daftar'}
                </button>
              </div>
              {pelangganMode === 'existing' ? (
                <Select name="pelanggan_id" required items={pelangganList.map(p => ({ label: p.namaPelanggan, value: p.id }))}>
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
              ) : (
                <>
                  <Input
                    name="pelanggan_nama"
                    placeholder="Ketik nama pelanggan baru..."
                    required
                  />
                  <p className="text-xs text-slate-400">
                    Pelanggan baru akan otomatis tersimpan ke daftar pelanggan.
                  </p>
                </>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="produk_id">Produk <span className="text-red-500">*</span></Label>
              <Select name="produk_id" required items={produkList.map(p => ({ label: p.namaProduk, value: p.id }))}>
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
              <Label htmlFor="jumlah">Jumlah Permintaan (dus) <span className="text-red-500">*</span></Label>
              <Input
                id="jumlah"
                name="jumlah"
                type="number"
                min="1"
                placeholder="Masukkan jumlah..."
                required
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Batal
              </Button>
              <Button type="submit" disabled={isPending} className="bg-teal-600 hover:bg-teal-700 text-white">
                {isPending ? 'Menyimpan...' : 'Buat Permintaan'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
