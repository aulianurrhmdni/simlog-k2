'use client'

import { useEffect, useState, useTransition } from 'react'
import {
  createVarianRasa,
  updateVarianRasa,
  deleteVarianRasa,
  getVarianRasaList,
} from './actions'
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
import { Soup, Plus, Pencil, Trash2, Flame, Layers } from 'lucide-react'
import { toast } from 'sonner'

interface VarianRasa {
  id: string
  namaVarian: string
  kategori: string
  tingkatPedas: number
  deskripsi: string | null
  aktif: boolean
  createdAt: string | Date
  _count?: { produk: number }
}

const KATEGORI_LIST = ['Goreng', 'Kuah']
const PEDAS_LIST = ['0', '1', '2', '3', '4', '5']

const KATEGORI_COLORS: Record<string, string> = {
  Goreng: 'bg-orange-50 text-orange-700 border-orange-200',
  Kuah: 'bg-blue-50 text-blue-700 border-blue-200',
}

function PedasIndicator({ level }: { level: number }) {
  if (level <= 0) return <span className="text-slate-400 text-xs">Tidak pedas</span>
  return (
    <span className="inline-flex items-center gap-0.5" title={`Tingkat pedas ${level}/5`}>
      {Array.from({ length: level }).map((_, i) => (
        <Flame key={i} className="h-3.5 w-3.5 text-red-500" />
      ))}
    </span>
  )
}

interface VarianRasaClientProps {
  role: string
}

export function VarianRasaClient({ role }: VarianRasaClientProps) {
  const [data, setData] = useState<VarianRasa[]>([])
  const [loading, setLoading] = useState(true)
  const [filterKategori, setFilterKategori] = useState<string>('semua')

  const [createOpen, setCreateOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [selected, setSelected] = useState<VarianRasa | null>(null)

  const [createKategori, setCreateKategori] = useState('')
  const [createPedas, setCreatePedas] = useState('0')
  const [editKategori, setEditKategori] = useState('')
  const [editPedas, setEditPedas] = useState('0')

  const [isPending, startTransition] = useTransition()

  const canManage = role === 'admin' || role === 'inventory_control'

  async function fetchData() {
    setLoading(true)
    try {
      const result = await getVarianRasaList()
      setData(result as unknown as VarianRasa[])
    } catch {
      toast.error('Gagal memuat data varian rasa')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  async function handleCreate(formData: FormData) {
    formData.set('kategori', createKategori)
    formData.set('tingkat_pedas', createPedas)
    startTransition(async () => {
      const result = await createVarianRasa(formData)
      if (result?.error) {
        toast.error('Gagal menambah varian rasa', { description: result.error })
      } else {
        toast.success('Varian rasa berhasil ditambahkan')
        setCreateOpen(false)
        setCreateKategori('')
        setCreatePedas('0')
        fetchData()
      }
    })
  }

  async function handleUpdate(formData: FormData) {
    formData.set('kategori', editKategori)
    formData.set('tingkat_pedas', editPedas)
    startTransition(async () => {
      const result = await updateVarianRasa(formData)
      if (result?.error) {
        toast.error('Gagal memperbarui varian rasa', { description: result.error })
      } else {
        toast.success('Varian rasa berhasil diperbarui')
        setEditOpen(false)
        setSelected(null)
        fetchData()
      }
    })
  }

  async function handleDelete() {
    if (!selected) return
    startTransition(async () => {
      const result = await deleteVarianRasa(selected.id)
      if (result?.error) {
        toast.error('Gagal menghapus varian rasa', { description: result.error })
      } else {
        toast.success('Varian rasa berhasil dihapus')
        setDeleteOpen(false)
        setSelected(null)
        fetchData()
      }
    })
  }

  function openEdit(v: VarianRasa) {
    setSelected(v)
    setEditKategori(v.kategori)
    setEditPedas(String(v.tingkatPedas))
    setEditOpen(true)
  }

  function openDelete(v: VarianRasa) {
    setSelected(v)
    setDeleteOpen(true)
  }

  const filteredData =
    filterKategori === 'semua'
      ? data
      : data.filter((v) => v.kategori === filterKategori)

  const kategoriCounts = KATEGORI_LIST.reduce<Record<string, number>>((acc, k) => {
    acc[k] = data.filter((v) => v.kategori === k).length
    return acc
  }, {})

  const columns = [
    {
      key: 'namaVarian',
      header: 'Nama Varian',
      render: (item: VarianRasa) => (
        <span className="font-semibold text-slate-800">{item.namaVarian}</span>
      ),
    },
    {
      key: 'kategori',
      header: 'Kategori',
      render: (item: VarianRasa) => (
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
      key: 'tingkatPedas',
      header: 'Tingkat Pedas',
      render: (item: VarianRasa) => <PedasIndicator level={item.tingkatPedas} />,
    },
    {
      key: 'deskripsi',
      header: 'Deskripsi',
      render: (item: VarianRasa) =>
        item.deskripsi ? (
          <span className="text-slate-600 text-sm">{item.deskripsi}</span>
        ) : (
          <span className="text-slate-400">—</span>
        ),
    },
    {
      key: 'produk',
      header: 'Dipakai Produk',
      sortable: false,
      render: (item: VarianRasa) => (
        <span className="text-slate-600">{item._count?.produk ?? 0} produk</span>
      ),
    },
    {
      key: 'aktif',
      header: 'Status',
      render: (item: VarianRasa) =>
        item.aktif ? (
          <span className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700">
            Aktif
          </span>
        ) : (
          <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-500">
            Nonaktif
          </span>
        ),
    },
    ...(canManage
      ? [
          {
            key: 'aksi',
            header: 'Aksi',
            sortable: false,
            searchable: false,
            render: (item: VarianRasa) => (
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
            <Soup className="h-6 w-6 text-teal-600" />
          </div>
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Varian Rasa Indomie</h2>
            <p className="text-slate-500 text-sm mt-0.5">
              Kelola katalog varian rasa Indomie PT CAHAYA INDOMIE
            </p>
          </div>
        </div>
        {canManage && (
          <Button
            className="bg-teal-600 hover:bg-teal-700 text-white"
            onClick={() => {
              setCreateKategori('')
              setCreatePedas('0')
              setCreateOpen(true)
            }}
          >
            <Plus className="h-4 w-4 mr-2" />
            Tambah Varian Rasa
          </Button>
        )}
      </div>

      <div className="grid gap-3 grid-cols-2 sm:grid-cols-3">
        <Card className="border-l-4 border-l-teal-500 bg-gradient-to-br from-white to-teal-50/40">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 pt-3 px-4">
            <CardTitle className="text-xs font-medium text-slate-500">Total Varian</CardTitle>
            <Soup className="h-4 w-4 text-teal-500" />
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
          Memuat data varian rasa...
        </div>
      ) : (
        <DataTable
          data={filteredData as unknown as Record<string, unknown>[]}
          columns={columns as never}
          searchPlaceholder="Cari nama varian, kategori..."
        />
      )}

      {/* Create dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Tambah Varian Rasa Baru</DialogTitle>
            <DialogDescription>Isi data varian rasa Indomie yang akan ditambahkan ke katalog.</DialogDescription>
          </DialogHeader>
          <form action={handleCreate} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="create-nama">Nama Varian <span className="text-red-500">*</span></Label>
              <Input
                id="create-nama"
                name="nama_varian"
                placeholder="Contoh: Goreng Rendang"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
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
                <Label>Tingkat Pedas (0–5)</Label>
                <Select
                  value={createPedas}
                  onValueChange={(val) => setCreatePedas(val || '0')}
                  items={PEDAS_LIST.map((p) => ({ label: p === '0' ? '0 (tidak pedas)' : p, value: p }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="0" />
                  </SelectTrigger>
                  <SelectContent>
                    {PEDAS_LIST.map((p) => (
                      <SelectItem key={p} value={p}>{p === '0' ? '0 (tidak pedas)' : p}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="create-deskripsi">Deskripsi</Label>
              <Input
                id="create-deskripsi"
                name="deskripsi"
                placeholder="Deskripsi singkat varian rasa (opsional)"
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
                {isPending ? 'Menyimpan...' : 'Simpan Varian'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Varian Rasa</DialogTitle>
            <DialogDescription>Perbarui informasi varian rasa yang dipilih.</DialogDescription>
          </DialogHeader>
          {selected && (
            <form action={handleUpdate} className="space-y-4">
              <input type="hidden" name="id" value={selected.id} />
              <div className="space-y-2">
                <Label htmlFor="edit-nama">Nama Varian <span className="text-red-500">*</span></Label>
                <Input id="edit-nama" name="nama_varian" defaultValue={selected.namaVarian} required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Kategori <span className="text-red-500">*</span></Label>
                  <Select
                    value={editKategori}
                    onValueChange={(val) => setEditKategori(val || '')}
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
                  <Label>Tingkat Pedas (0–5)</Label>
                  <Select
                    value={editPedas}
                    onValueChange={(val) => setEditPedas(val || '0')}
                    items={PEDAS_LIST.map((p) => ({ label: p === '0' ? '0 (tidak pedas)' : p, value: p }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="0" />
                    </SelectTrigger>
                    <SelectContent>
                      {PEDAS_LIST.map((p) => (
                        <SelectItem key={p} value={p}>{p === '0' ? '0 (tidak pedas)' : p}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-deskripsi">Deskripsi</Label>
                <Input id="edit-deskripsi" name="deskripsi" defaultValue={selected.deskripsi ?? ''} />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="edit-aktif"
                  name="aktif"
                  value="true"
                  defaultChecked={selected.aktif}
                  className="h-4 w-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500"
                />
                <Label htmlFor="edit-aktif" className="cursor-pointer">Varian aktif</Label>
              </div>
              <DialogFooter className="pt-2">
                <Button type="button" variant="outline" onClick={() => setEditOpen(false)} disabled={isPending}>
                  Batal
                </Button>
                <Button
                  type="submit"
                  className="bg-teal-600 hover:bg-teal-700"
                  disabled={isPending || !editKategori}
                >
                  {isPending ? 'Memperbarui...' : 'Perbarui Varian'}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete dialog */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-red-600">Hapus Varian Rasa</DialogTitle>
            <DialogDescription>
              Tindakan ini tidak dapat dibatalkan. Produk yang memakai varian ini tidak terhapus, tetapi tautan varian-nya akan dikosongkan.
            </DialogDescription>
          </DialogHeader>
          <div className="rounded-lg bg-red-50 border border-red-200 p-3">
            <p className="text-sm font-semibold text-red-700">{selected?.namaVarian}</p>
            <p className="text-xs text-red-500 mt-0.5">{selected?.kategori}</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)} disabled={isPending}>
              Batal
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isPending}>
              {isPending ? 'Menghapus...' : 'Ya, Hapus Varian'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
