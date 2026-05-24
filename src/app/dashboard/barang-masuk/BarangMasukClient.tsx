'use client'

import { useEffect, useState } from 'react'
import { createBarangMasuk, verifyBarangMasuk, getBarangMasukData } from './actions'
import { DataTable } from '@/components/ui/data-table'
import { StatusBadge } from '@/components/ui/status-badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { ArrowDownToLine, Plus, CheckCircle, XCircle } from 'lucide-react'
import { toast } from 'sonner'
import type { BarangMasuk, Produk, Supplier } from '@/lib/types/database'

interface BarangMasukClientProps {
  role: string
}

export function BarangMasukClient({ role }: BarangMasukClientProps) {
  const [data, setData] = useState<BarangMasuk[]>([])
  const [produkList, setProdukList] = useState<Produk[]>([])
  const [supplierList, setSupplierList] = useState<Supplier[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)

  const canCreate = role === 'warehouse_staff' || role === 'superadmin'
  const canApprove = role === 'inventory_control' || role === 'manager_gudang' || role === 'superadmin'

  async function fetchData() {
    const res = await getBarangMasukData()
    if (res.success && res.data) {
      setData((res.data.masuk as unknown as BarangMasuk[]) ?? [])
      setProdukList((res.data.produk as unknown as Produk[]) ?? [])
      setSupplierList((res.data.supplier as unknown as Supplier[]) ?? [])
    } else {
      toast.error('Gagal mengambil data', { description: res.error })
    }
    setLoading(false)
  }

  useEffect(() => { fetchData() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  async function handleCreate(formData: FormData) {
    const result = await createBarangMasuk(formData)
    if (result?.error) {
      toast.error('Gagal mencatat barang masuk', { description: result.error })
    } else {
      toast.success('Barang masuk berhasil dicatat')
      setDialogOpen(false)
      fetchData()
    }
  }

  async function handleVerify(id: string, status: string, id_produk: string, jumlah: number) {
    const result = await verifyBarangMasuk(id, status, id_produk, jumlah)
    if (result?.error) {
      toast.error('Gagal verifikasi', { description: result.error })
    } else {
      toast.success(status === 'DITERIMA' ? 'Barang diterima & stok diperbarui' : 'Barang ditolak')
      fetchData()
    }
  }

  const columns = [
    {
      key: 'tanggal_masuk', header: 'Tanggal',
      render: (item: BarangMasuk) => new Date(item.tanggal_masuk).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }),
    },
    {
      key: 'nama_produk', header: 'Produk',
      render: (item: BarangMasuk) => <span className="font-medium">{(item.produk as unknown as Produk)?.nama_produk ?? '-'}</span>,
    },
    {
      key: 'nama_supplier', header: 'Supplier',
      render: (item: BarangMasuk) => (item.supplier as unknown as Supplier)?.nama_supplier ?? '-',
    },
    { key: 'jumlah_masuk', header: 'Jumlah' },
    { key: 'batch', header: 'Batch' },
    {
      key: 'tanggal_expired', header: 'Expired',
      render: (item: BarangMasuk) => item.tanggal_expired ? new Date(item.tanggal_expired).toLocaleDateString('id-ID') : '-',
    },
    {
      key: 'status_penerimaan', header: 'Status',
      render: (item: BarangMasuk) => <StatusBadge status={item.status_penerimaan} />,
    },
    ...(canApprove
      ? [
          {
            key: 'aksi', header: 'Aksi', sortable: false, searchable: false,
            render: (item: BarangMasuk) => item.status_penerimaan === 'PENDING' ? (
              <div className="flex gap-1">
                <Button variant="ghost" size="sm" className="text-green-600 hover:text-green-700" onClick={() => handleVerify(item.id_masuk, 'DITERIMA', item.id_produk, item.jumlah_masuk)}>
                  <CheckCircle className="h-4 w-4 mr-1" /> Terima
                </Button>
                <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700" onClick={() => handleVerify(item.id_masuk, 'DITOLAK', item.id_produk, item.jumlah_masuk)}>
                  <XCircle className="h-4 w-4 mr-1" /> Tolak
                </Button>
              </div>
            ) : null,
          }
        ]
      : [])
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <ArrowDownToLine className="h-6 w-6 text-teal-600" />
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Penerimaan Barang Masuk</h2>
            <p className="text-slate-500">Catat dan verifikasi barang masuk dari supplier</p>
          </div>
        </div>
        {canCreate && (
          <Button className="bg-teal-600 hover:bg-teal-700" onClick={() => setDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" /> Catat Barang Masuk
          </Button>
        )}
      </div>

      {loading ? (
        <div className="h-64 flex items-center justify-center text-slate-400">Memuat data...</div>
      ) : (
        <DataTable data={data as unknown as Record<string, unknown>[]} columns={columns as never} searchPlaceholder="Cari produk, supplier, batch..." />
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Catat Barang Masuk Baru</DialogTitle></DialogHeader>
          <form action={handleCreate} className="space-y-4">
            <div className="space-y-2">
              <Label>Produk</Label>
              <Select name="id_produk" required>
                <SelectTrigger><SelectValue placeholder="Pilih produk" /></SelectTrigger>
                <SelectContent>
                  {produkList.map((p) => (
                    <SelectItem key={p.id_produk} value={p.id_produk}>{p.nama_produk}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Supplier</Label>
              <Select name="id_supplier" required>
                <SelectTrigger><SelectValue placeholder="Pilih supplier" /></SelectTrigger>
                <SelectContent>
                  {supplierList.map((s) => (
                    <SelectItem key={s.id_supplier} value={s.id_supplier}>{s.nama_supplier}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Jumlah Masuk</Label>
                <Input name="jumlah_masuk" type="number" min="1" required />
              </div>
              <div className="space-y-2">
                <Label>Batch</Label>
                <Input name="batch" placeholder="B-001" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Tanggal Expired</Label>
              <Input name="tanggal_expired" type="date" />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Batal</Button>
              <Button type="submit" className="bg-teal-600 hover:bg-teal-700">Simpan</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
