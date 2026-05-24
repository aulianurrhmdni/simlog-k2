'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { updateStok } from './actions'
import { StatusBadge } from '@/components/ui/status-badge'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Pencil, RefreshCw, Layers } from 'lucide-react'
import type { Prisma } from '@prisma/client'

type StokWithProduk = Prisma.StokGetPayload<{ include: { produk: true } }>

interface StokClientProps {
  stokList: StokWithProduk[]
  role?: string
}

export function StokClient({ stokList, role }: StokClientProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const canEdit = role === 'superadmin' || role === 'manager_gudang'
  const [editTarget, setEditTarget] = useState<StokWithProduk | null>(null)

  // controlled dialog fields
  const [jumlahStok, setJumlahStok] = useState('')
  const [lokasiRak, setLokasiRak] = useState('')
  const [statusStok, setStatusStok] = useState('')

  function openEdit(item: StokWithProduk) {
    setEditTarget(item)
    setJumlahStok(String(item.jumlahStok))
    setLokasiRak(item.lokasiRak ?? '')
    setStatusStok(item.statusStok)
  }

  function handleSave() {
    if (!editTarget) return
    const fd = new FormData()
    fd.set('id_stok', editTarget.id)
    fd.set('jumlah_stok', jumlahStok)
    fd.set('lokasi_rak', lokasiRak)
    fd.set('status_stok', statusStok)

    startTransition(async () => {
      const res = await updateStok(fd)
      if (res?.error) {
        toast.error(res.error)
      } else {
        toast.success('Stok berhasil diperbarui')
        setEditTarget(null)
        router.refresh()
      }
    })
  }

  function jumlahColor(s: StokWithProduk) {
    if (s.statusStok === 'KRITIS') return 'text-red-600 font-bold'
    if (s.statusStok === 'RENDAH') return 'text-amber-600 font-semibold'
    return 'text-emerald-700 font-semibold'
  }

  const fmt = (d: Date | string) =>
    new Date(d).toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })

  return (
    <>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Manajemen Stok</h2>
          <p className="text-slate-500 text-sm mt-0.5">
            Pantau dan perbarui kondisi stok gudang
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => router.refresh()}
          className="gap-2"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Layers className="h-5 w-5 text-teal-600" />
            <CardTitle className="text-base">Data Stok Produk</CardTitle>
          </div>
          <CardDescription>
            Total {stokList.length} record — klik ikon pensil untuk mengubah
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50">
                  <TableHead>Nama Produk</TableHead>
                  <TableHead>Kategori</TableHead>
                  <TableHead className="text-right">Jumlah Stok</TableHead>
                  <TableHead>Lokasi Rak</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Terakhir Update</TableHead>
                  {canEdit && <TableHead className="text-center">Aksi</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {stokList.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-12 text-slate-400">
                      Belum ada data stok
                    </TableCell>
                  </TableRow>
                ) : (
                  stokList.map((item) => (
                    <TableRow key={item.id} className="hover:bg-slate-50/60">
                      <TableCell className="font-medium">
                        {item.produk.namaProduk}
                      </TableCell>
                      <TableCell className="text-slate-500">
                        {item.produk.kategori}
                      </TableCell>
                      <TableCell className={`text-right ${jumlahColor(item)}`}>
                        {item.jumlahStok.toLocaleString('id-ID')}{' '}
                        <span className="text-xs font-normal text-slate-400">
                          {item.produk.satuan}
                        </span>
                      </TableCell>
                      <TableCell className="text-slate-500">
                        {item.lokasiRak ?? (
                          <span className="text-slate-300 italic">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={item.statusStok} />
                      </TableCell>
                      <TableCell className="text-slate-500 text-sm">
                        {fmt(item.tanggalUpdate)}
                      </TableCell>
                      {canEdit && (
                        <TableCell className="text-center">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEdit(item)}
                            className="h-8 w-8 hover:bg-teal-50 hover:text-teal-700"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      )}
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* ── Edit Dialog ─────────────────────────────────────────────────── */}
      <Dialog open={!!editTarget} onOpenChange={(o) => !o && setEditTarget(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Stok</DialogTitle>
            <DialogDescription>
              {editTarget?.produk.namaProduk} — perbarui jumlah, lokasi, dan status stok
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="jumlah_stok">Jumlah Stok</Label>
              <Input
                id="jumlah_stok"
                type="number"
                min={0}
                value={jumlahStok}
                onChange={(e) => setJumlahStok(e.target.value)}
                placeholder="Masukkan jumlah stok"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="lokasi_rak">Lokasi Rak</Label>
              <Input
                id="lokasi_rak"
                value={lokasiRak}
                onChange={(e) => setLokasiRak(e.target.value)}
                placeholder="cth. A1-001"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="status_stok">Status Stok</Label>
              <Select value={statusStok} onValueChange={(val) => setStatusStok(val || '')}>
                <SelectTrigger id="status_stok">
                  <SelectValue placeholder="Pilih status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="NORMAL">NORMAL</SelectItem>
                  <SelectItem value="RENDAH">RENDAH</SelectItem>
                  <SelectItem value="KRITIS">KRITIS</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEditTarget(null)}
              disabled={isPending}
            >
              Batal
            </Button>
            <Button
              onClick={handleSave}
              disabled={isPending}
              className="bg-teal-600 hover:bg-teal-700 text-white"
            >
              {isPending ? 'Menyimpan…' : 'Simpan'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
