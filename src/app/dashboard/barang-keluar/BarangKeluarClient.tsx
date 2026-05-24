'use client'

import { useEffect, useState } from 'react'
import { createBarangKeluar, approveBarangKeluar, rejectBarangKeluar, getBarangKeluarData } from './actions'
import { DataTable } from '@/components/ui/data-table'
import { StatusBadge } from '@/components/ui/status-badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { ArrowUpFromLine, Plus, CheckCircle, XCircle } from 'lucide-react'
import { toast } from 'sonner'
import type { BarangKeluar, Produk } from '@/lib/types/database'

interface BarangKeluarClientProps {
  role: string
}

export function BarangKeluarClient({ role }: BarangKeluarClientProps) {
  const [data, setData] = useState<BarangKeluar[]>([])
  const [produkList, setProdukList] = useState<Produk[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)

  const canCreate = role === 'warehouse_staff' || role === 'superadmin'
  const canApprove = role === 'inventory_control' || role === 'manager_gudang' || role === 'superadmin'

  async function fetchData() {
    const res = await getBarangKeluarData()
    if (res.success && res.data) {
      setData((res.data.keluar as unknown as BarangKeluar[]) ?? [])
      setProdukList((res.data.produk as unknown as Produk[]) ?? [])
    } else {
      toast.error('Gagal mengambil data', { description: res.error })
    }
    setLoading(false)
  }

  useEffect(() => { fetchData() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  async function handleCreate(formData: FormData) {
    const result = await createBarangKeluar(formData)
    if (result?.error) {
      toast.error('Gagal mencatat barang keluar', { description: result.error })
    } else {
      toast.success('Barang keluar berhasil dicatat, menunggu approval')
      setDialogOpen(false)
      fetchData()
    }
  }

  async function handleApprove(id: string) {
    const result = await approveBarangKeluar(id)
    if (result?.error) {
      toast.error('Gagal menyetujui transaksi', { description: result.error })
    } else {
      toast.success('Transaksi barang keluar disetujui & stok dikurangi')
      fetchData()
    }
  }

  async function handleReject(id: string) {
    const result = await rejectBarangKeluar(id)
    if (result?.error) {
      toast.error('Gagal menolak transaksi', { description: result.error })
    } else {
      toast.warning('Transaksi barang keluar ditolak')
      fetchData()
    }
  }

  const columns = [
    {
      key: 'tanggal_keluar', header: 'Tanggal',
      render: (item: BarangKeluar) => new Date(item.tanggal_keluar).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }),
    },
    {
      key: 'nama_produk', header: 'Produk',
      render: (item: BarangKeluar) => <span className="font-medium">{(item.produk as unknown as Produk)?.nama_produk ?? '-'}</span>,
    },
    { key: 'jumlah_keluar', header: 'Jumlah' },
    { key: 'tujuan', header: 'Tujuan' },
    {
      key: 'status_pengeluaran', header: 'Status',
      render: (item: BarangKeluar) => <StatusBadge status={item.status_pengeluaran} />,
    },
    ...(canApprove
      ? [
          {
            key: 'aksi', header: 'Aksi', sortable: false, searchable: false,
            render: (item: BarangKeluar) => item.status_pengeluaran === 'PENDING' ? (
              <div className="flex gap-1">
                <Button variant="ghost" size="sm" className="text-green-600 hover:text-green-700" onClick={() => handleApprove(item.id_keluar)}>
                  <CheckCircle className="h-4 w-4 mr-1" /> Setujui
                </Button>
                <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700" onClick={() => handleReject(item.id_keluar)}>
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
          <ArrowUpFromLine className="h-6 w-6 text-amber-600" />
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Pengeluaran Barang Keluar</h2>
            <p className="text-slate-500">Catat dan kelola barang keluar dari gudang</p>
          </div>
        </div>
        {canCreate && (
          <Button className="bg-teal-600 hover:bg-teal-700" onClick={() => setDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" /> Catat Barang Keluar
          </Button>
        )}
      </div>

      {loading ? (
        <div className="h-64 flex items-center justify-center text-slate-400">Memuat data...</div>
      ) : (
        <DataTable data={data as unknown as Record<string, unknown>[]} columns={columns as never} searchPlaceholder="Cari produk, tujuan..." />
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Catat Barang Keluar</DialogTitle></DialogHeader>
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
              <Label>Jumlah Keluar</Label>
              <Input name="jumlah_keluar" type="number" min="1" required />
            </div>
            <div className="space-y-2">
              <Label>Tujuan</Label>
              <Input name="tujuan" placeholder="Nama toko / distributor" />
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
