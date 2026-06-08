'use client'

import { useEffect, useState, useTransition } from 'react'
import { createProdukBaru, getProdukBaruList } from './actions'
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
import { Package, Plus } from 'lucide-react'
import { toast } from 'sonner'

interface ProdukBaru {
  id: string
  namaProduk: string
  kategori: string
  lokasiRak: string | null
  createdAt: string | Date
}

const KATEGORI_LIST = ['Goreng', 'Kuah']

const KATEGORI_COLORS: Record<string, string> = {
  Goreng: 'bg-orange-50 text-orange-700 border-orange-200',
  Kuah: 'bg-blue-50 text-blue-700 border-blue-200',
}

interface VarianRasaClientProps {
  role: string
}

export function VarianRasaClient({ role }: VarianRasaClientProps) {
  const [data, setData] = useState<ProdukBaru[]>([])
  const [loading, setLoading] = useState(true)
  const [createOpen, setCreateOpen] = useState(false)
  const [createKategori, setCreateKategori] = useState('')
  const [isPending, startTransition] = useTransition()

  const canManage = role === 'admin' || role === 'inventory_control' || role === 'manager_gudang'

  async function fetchData() {
    setLoading(true)
    try {
      const result = await getProdukBaruList()
      setData(result as unknown as ProdukBaru[])
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
    startTransition(async () => {
      const result = await createProdukBaru(formData)
      if (result?.error) {
        toast.error('Gagal menambah produk', { description: result.error })
      } else {
        toast.success('Produk baru berhasil ditambahkan')
        setCreateOpen(false)
        setCreateKategori('')
        fetchData()
      }
    })
  }

  const kategoriCounts = KATEGORI_LIST.reduce<Record<string, number>>((acc, k) => {
    acc[k] = data.filter((v) => v.kategori === k).length
    return acc
  }, {})

  const columns = [
    {
      key: 'namaProduk',
      header: 'Nama Produk',
      render: (item: ProdukBaru) => (
        <span className="font-semibold text-slate-800">{item.namaProduk}</span>
      ),
    },
    {
      key: 'kategori',
      header: 'Kategori',
      render: (item: ProdukBaru) => (
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
      key: 'lokasiRak',
      header: 'Lokasi Rak',
      render: (item: ProdukBaru) =>
        item.lokasiRak ? (
          <span className="text-slate-700 font-medium">{item.lokasiRak}</span>
        ) : (
          <span className="text-slate-400">—</span>
        ),
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-teal-100 p-2">
            <Package className="h-6 w-6 text-teal-600" />
          </div>
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Tambah Produk Baru</h2>
            <p className="text-slate-500 text-sm mt-0.5">
              Kelola katalog produk PT CAHAYA INDOMIE
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
            Tambah Produk Baru
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
          <Card key={kat}>
            <CardHeader className="space-y-0 pb-1 pt-3 px-4">
              <CardTitle className="text-[11px] font-medium text-slate-500 leading-tight">{kat}</CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-3">
              <div className="text-xl font-bold text-slate-800">{kategoriCounts[kat] ?? 0}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {loading ? (
        <div className="h-64 flex items-center justify-center text-slate-400">
          Memuat data produk...
        </div>
      ) : (
        <DataTable
          data={data as unknown as Record<string, unknown>[]}
          columns={columns as never}
          searchPlaceholder="Cari nama produk, kategori..."
        />
      )}

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Tambah Produk Baru</DialogTitle>
            <DialogDescription>Isi data produk yang akan ditambahkan ke katalog.</DialogDescription>
          </DialogHeader>
          <form action={handleCreate} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="create-nama">Nama Produk <span className="text-red-500">*</span></Label>
              <Input
                id="create-nama"
                name="nama_produk"
                placeholder="Contoh: Goreng Rendang"
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Kategori <span className="text-red-500">*</span></Label>
              <Select
                value={createKategori}
                onValueChange={(val) => setCreateKategori(val || '')}
                items={KATEGORI_LIST.map((k) => ({ label: k, value: k }))}
                required
              >
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
              <Label htmlFor="create-lokasi">Lokasi Rak</Label>
              <Input
                id="create-lokasi"
                name="lokasi_rak"
                placeholder="Contoh: A1, B2"
              />
            </div>
            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setCreateOpen(false)} disabled={isPending}>
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
    </div>
  )
}
