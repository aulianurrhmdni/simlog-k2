'use client'

import { useEffect, useState, useTransition } from 'react'
import { createProduk, updateProduk, deleteProduk, getProdukList } from './actions'
import { DataTable } from '@/components/ui/data-table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Box,
  Plus,
  Pencil,
  Trash2,
  Package,
  Layers,
} from 'lucide-react'
import { toast } from 'sonner'

interface Stok {
  id: string
  produkId: string
  jumlahStok: number
  lokasiRak: string | null
  statusStok: string
  tanggalUpdate: string | Date
}

interface Produk {
  id: string
  namaProduk: string
  kategori: string
  satuan: string
  stokMinimum: number
  masaKedaluwarsa: number | null
  createdAt: string | Date
  stok: Stok[]
}

const KATEGORI_LIST = ['Goreng', 'Kuah']

const KATEGORI_COLORS: Record<string, string> = {
  Goreng: 'bg-orange-50 text-orange-700 border-orange-200',
  Kuah:   'bg-blue-50 text-blue-700 border-blue-200',
}

interface ProdukClientProps {
  role: string
}

export function ProdukClient({ role }: ProdukClientProps) {
  const [data, setData] = useState<Produk[]>([])
  const [loading, setLoading] = useState(true)
  const [filterKategori, setFilterKategori] = useState<string>('semua')

  // Dialog states
  const [createOpen, setCreateOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [selectedProduk, setSelectedProduk] = useState<Produk | null>(null)

  // Controlled values
  const [createKategori, setCreateKategori] = useState('')
  const [editKategori, setEditKategori] = useState('')

  const [isPending, startTransition] = useTransition()

  const canManage = role === 'admin' || role === 'inventory_control'

  async function fetchData() {
    setLoading(true)
    try {
      const result = await getProdukList()
      setData(result as unknown as Produk[])
    } catch {
      toast.error('Gagal memuat data produk')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  async function handleCreate(formData: FormData) {
    formData.set('kategori', createKategori)
    formData.set('satuan', 'dus') // enforce dus
    startTransition(async () => {
      const result = await createProduk(formData)
      if (result?.error) {
        toast.error('Gagal menambah produk', { description: result.error })
      } else {
        toast.success('Produk berhasil ditambahkan')
        setCreateOpen(false)
        setCreateKategori('')
        fetchData()
      }
    })
  }

  async function handleUpdate(formData: FormData) {
    formData.set('kategori', editKategori)
    formData.set('satuan', 'dus') // enforce dus
    startTransition(async () => {
      const result = await updateProduk(formData)
      if (result?.error) {
        toast.error('Gagal memperbarui produk', { description: result.error })
      } else {
        toast.success('Produk berhasil diperbarui')
        setEditOpen(false)
        setSelectedProduk(null)
        fetchData()
      }
    })
  }

  async function handleDelete() {
    if (!selectedProduk) return
    startTransition(async () => {
      const result = await deleteProduk(selectedProduk.id)
      if (result?.error) {
        toast.error('Gagal menghapus produk', { description: result.error })
      } else {
        toast.success('Produk berhasil dihapus')
        setDeleteOpen(false)
        setSelectedProduk(null)
        fetchData()
      }
    })
  }

  function openEdit(produk: Produk) {
    setSelectedProduk(produk)
    setEditKategori(produk.kategori)
    setEditOpen(true)
  }

  function openDelete(produk: Produk) {
    setSelectedProduk(produk)
    setDeleteOpen(true)
  }

  const filteredData =
    filterKategori === 'semua'
      ? data
      : data.filter((p) => p.kategori === filterKategori)

  const kategoriCounts = KATEGORI_LIST.reduce<Record<string, number>>((acc, k) => {
    acc[k] = data.filter((p) => p.kategori === k).length
    return acc
  }, {})

  const columns = [
    {
      key: 'namaProduk',
      header: 'Nama Produk',
      render: (item: Produk) => (
        <span className="font-semibold text-slate-800">{item.namaProduk}</span>
      ),
    },
    {
      key: 'kategori',
      header: 'Kategori',
      render: (item: Produk) => (
        <span
          className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${
            KATEGORI_COLORS[item.kategori] ?? 'bg-slate-100 text-slate-700 border-slate-200'
          }`}
        >
          {item.kategori}
        </span>
      ),
    },
    {
      key: 'satuan',
      header: 'Satuan',
      render: () => <span className="text-slate-600">dus</span>,
    },
    {
      key: 'stokMinimum',
      header: 'Stok Min (dus)',
      render: (item: Produk) => (
        <span className="font-medium">{item.stokMinimum}</span>
      ),
    },
    {
      key: 'masaKedaluwarsa',
      header: 'Masa Kadaluwarsa',
      render: (item: Produk) =>
        item.masaKedaluwarsa != null ? (
          <span className="text-slate-600">{item.masaKedaluwarsa} hari</span>
        ) : (
          <span className="text-slate-400">—</span>
        ),
    },
    {
      key: 'stok',
      header: 'Stok Saat Ini',
      sortable: false,
      render: (item: Produk) => {
        const stokAktual = item.stok?.[0]?.jumlahStok ?? 0
        const isLow = stokAktual <= item.stokMinimum
        return (
          <span
            className={`inline-flex items-center gap-1 font-bold ${
              isLow ? 'text-red-600' : 'text-emerald-600'
            }`}
          >
            {stokAktual}
            {isLow && (
              <span className="text-[10px] font-medium bg-red-100 text-red-600 rounded-full px-1.5 py-0.5">
                RENDAH
              </span>
            )}
          </span>
        )
      },
    },
    ...(canManage
      ? [
          {
            key: 'aksi',
            header: 'Aksi',
            sortable: false,
            searchable: false,
            render: (item: Produk) => (
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-teal-600 hover:text-teal-700 hover:bg-teal-50"
                  onClick={() => openEdit(item)}
                >
                  <Pencil className="h-3.5 w-3.5 mr-1" />
                  Edit
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-red-500 hover:text-red-600 hover:bg-red-50"
                  onClick={() => openDelete(item)}
                >
                  <Trash2 className="h-3.5 w-3.5 mr-1" />
                  Hapus
                </Button>
              </div>
            ),
          },
        ]
      : []),
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-teal-100 p-2">
            <Box className="h-6 w-6 text-teal-600" />
          </div>
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Master Data Produk</h2>
            <p className="text-slate-500 text-sm mt-0.5">
              Kelola katalog produk mie instan PT CAHAYA INDOMIE
            </p>
          </div>
        </div>
        {canManage && (
          <Button
            className="bg-teal-600 hover:bg-teal-700 text-white"
            onClick={() => {
              setCreateKategori('')
              setCreateOpen(true)
            }}
          >
            <Plus className="h-4 w-4 mr-2" />
            Tambah Produk
          </Button>
        )}
      </div>

      <div className="grid gap-3 grid-cols-2 sm:grid-cols-3">
        <Card className="border-l-4 border-l-teal-500 bg-gradient-to-br from-white to-teal-50/40">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 pt-3 px-4">
            <CardTitle className="text-xs font-medium text-slate-500">Total Produk</CardTitle>
            <Package className="h-4 w-4 text-teal-500" />
          </CardHeader>
          <CardContent className="px-4 pb-3">
            <div className="text-2xl font-bold text-slate-800">{data.length}</div>
          </CardContent>
        </Card>
        {KATEGORI_LIST.map((kat) => (
          <Card
            key={kat}
            className={`cursor-pointer transition-all border-l-4 ${
              filterKategori === kat
                ? 'ring-2 ring-teal-400 border-l-teal-500'
                : 'border-l-slate-200 hover:border-l-teal-400'
            }`}
            onClick={() => setFilterKategori(filterKategori === kat ? 'semua' : kat)}
          >
            <CardHeader className="space-y-0 pb-1 pt-3 px-4">
              <CardTitle className="text-[11px] font-medium text-slate-500 leading-tight">{kat}</CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-3">
              <div className="text-xl font-bold text-slate-800">{kategoriCounts[kat] ?? 0}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-sm text-slate-500 font-medium">Filter:</span>
        <Badge
          variant={filterKategori === 'semua' ? 'default' : 'outline'}
          className={`cursor-pointer ${filterKategori === 'semua' ? 'bg-teal-600 text-white' : 'hover:bg-slate-100'}`}
          onClick={() => setFilterKategori('semua')}
        >
          Semua ({data.length})
        </Badge>
        {KATEGORI_LIST.map((kat) => (
          <Badge
            key={kat}
            variant={filterKategori === kat ? 'default' : 'outline'}
            className={`cursor-pointer ${
              filterKategori === kat ? 'bg-teal-600 text-white' : 'hover:bg-slate-100'
            }`}
            onClick={() => setFilterKategori(filterKategori === kat ? 'semua' : kat)}
          >
            {kat} ({kategoriCounts[kat] ?? 0})
          </Badge>
        ))}
        {filterKategori !== 'semua' && (
          <Button
            variant="ghost"
            size="sm"
            className="text-slate-400 h-6 px-2 text-xs"
            onClick={() => setFilterKategori('semua')}
          >
            <Layers className="h-3 w-3 mr-1" /> Reset filter
          </Button>
        )}
      </div>

      {loading ? (
        <div className="h-64 flex items-center justify-center text-slate-400">
          Memuat data produk...
        </div>
      ) : (
        <DataTable
          data={filteredData as unknown as Record<string, unknown>[]}
          columns={columns as never}
          searchPlaceholder="Cari nama produk, kategori..."
        />
      )}

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Tambah Produk Baru</DialogTitle>
            <DialogDescription>Isi data produk mie instan yang akan ditambahkan ke katalog.</DialogDescription>
          </DialogHeader>
          <form action={handleCreate} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="create-nama">Nama Produk <span className="text-red-500">*</span></Label>
              <Input
                id="create-nama"
                name="nama_produk"
                placeholder="Contoh: Indomie Goreng Spesial 85g"
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Kategori <span className="text-red-500">*</span></Label>
              <Select value={createKategori} onValueChange={(val) => setCreateKategori(val || '')} required>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih kategori produk" />
                </SelectTrigger>
                <SelectContent>
                  {KATEGORI_LIST.map((k) => (
                    <SelectItem key={k} value={k}>{k}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Satuan</Label>
              <Input value="dus" disabled className="bg-slate-100" />
              <p className="text-xs text-slate-400">Satuan produk PT CAHAYA INDOMIE secara konsisten adalah dus.</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="create-stokmin">Stok Minimum (dus)</Label>
                <Input
                  id="create-stokmin"
                  name="stok_minimum"
                  type="number"
                  min="0"
                  placeholder="0"
                  defaultValue={0}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="create-masa">Masa Kadaluwarsa (hari)</Label>
                <Input
                  id="create-masa"
                  name="masa_kedaluwarsa"
                  type="number"
                  min="1"
                  placeholder="365"
                />
              </div>
            </div>
            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setCreateOpen(false)}
                disabled={isPending}
              >
                Batal
              </Button>
              <Button
                type="submit"
                className="bg-teal-600 hover:bg-teal-700"
                disabled={isPending || !createKategori}
              >
                {isPending ? 'Menyimpan...' : 'Simpan Produk'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Produk</DialogTitle>
            <DialogDescription>Perbarui informasi produk yang dipilih.</DialogDescription>
          </DialogHeader>
          {selectedProduk && (
            <form action={handleUpdate} className="space-y-4">
              <input type="hidden" name="id" value={selectedProduk.id} />
              <div className="space-y-2">
                <Label htmlFor="edit-nama">Nama Produk <span className="text-red-500">*</span></Label>
                <Input
                  id="edit-nama"
                  name="nama_produk"
                  defaultValue={selectedProduk.namaProduk}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Kategori <span className="text-red-500">*</span></Label>
                <Select value={editKategori} onValueChange={(val) => setEditKategori(val || '')} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih kategori" />
                  </SelectTrigger>
                  <SelectContent>
                    {KATEGORI_LIST.map((k) => (
                      <SelectItem key={k} value={k}>{k}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Satuan</Label>
                <Input value="dus" disabled className="bg-slate-100" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-stokmin">Stok Minimum (dus)</Label>
                  <Input
                    id="edit-stokmin"
                    name="stok_minimum"
                    type="number"
                    min="0"
                    defaultValue={selectedProduk.stokMinimum}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-masa">Masa Kadaluwarsa (hari)</Label>
                  <Input
                    id="edit-masa"
                    name="masa_kedaluwarsa"
                    type="number"
                    min="1"
                    defaultValue={selectedProduk.masaKedaluwarsa ?? ''}
                  />
                </div>
              </div>
              <DialogFooter className="pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEditOpen(false)}
                  disabled={isPending}
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  className="bg-teal-600 hover:bg-teal-700"
                  disabled={isPending || !editKategori}
                >
                  {isPending ? 'Memperbarui...' : 'Perbarui Produk'}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-red-600">Hapus Produk</DialogTitle>
            <DialogDescription>
              Tindakan ini tidak dapat dibatalkan. Seluruh data terkait produk ini (stok, transaksi) akan ikut terhapus.
            </DialogDescription>
          </DialogHeader>
          <div className="rounded-lg bg-red-50 border border-red-200 p-3">
            <p className="text-sm font-semibold text-red-700">
              {selectedProduk?.namaProduk}
            </p>
            <p className="text-xs text-red-500 mt-0.5">
              {selectedProduk?.kategori} · dus
            </p>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteOpen(false)}
              disabled={isPending}
            >
              Batal
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isPending}
            >
              {isPending ? 'Menghapus...' : 'Ya, Hapus Produk'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
