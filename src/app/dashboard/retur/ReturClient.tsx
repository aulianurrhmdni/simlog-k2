'use client'

import { useEffect, useState } from 'react'
import { createRetur, approveReturIC, approveReturMG, rejectRetur, getReturData } from './actions'
import { DataTable } from '@/components/ui/data-table'
import { StatusBadge } from '@/components/ui/status-badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { RotateCcw, Plus, CheckCircle, XCircle } from 'lucide-react'
import { toast } from 'sonner'
import type { ReturBarang, Produk } from '@/lib/types/database'

interface ReturClientProps {
  role: string
}

interface BarangKeluarOption {
  id_keluar: string
  id_produk: string
  jumlah_keluar: number
  tujuan: string | null
  tanggal_keluar: string
  produk?: { nama_produk: string }
}

export function ReturClient({ role }: ReturClientProps) {
  const [data, setData] = useState<ReturBarang[]>([])
  const [produkList, setProdukList] = useState<Produk[]>([])
  const [barangKeluarList, setBarangKeluarList] = useState<BarangKeluarOption[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)

  // Form states
  const [selectedProdukId, setSelectedProdukId] = useState('')
  const [jenisRetur, setJenisRetur] = useState('DARI_PELANGGAN')
  const [selectedBarangKeluarId, setSelectedBarangKeluarId] = useState('')

  const canCreate = role === 'warehouse_staff' || role === 'admin'
  const canApproveIc = role === 'inventory_control' || role === 'admin'
  const canApproveMg = role === 'manager_gudang' || role === 'admin'
  const canReject = role === 'inventory_control' || role === 'manager_gudang' || role === 'admin'

  async function fetchData() {
    const res = await getReturData()
    if (res.success && res.data) {
      setData((res.data.retur as unknown as ReturBarang[]) ?? [])
      setProdukList((res.data.produk as unknown as Produk[]) ?? [])
      setBarangKeluarList((res.data.barangKeluar as unknown as BarangKeluarOption[]) ?? [])
    } else {
      toast.error('Gagal mengambil data', { description: res.error })
    }
    setLoading(false)
  }

  useEffect(() => { fetchData() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Filter barang keluar options based on selected product
  const filteredBarangKeluar = barangKeluarList.filter(
    k => k.id_produk === selectedProdukId
  )

  async function handleCreate(formData: FormData) {
    // Add programmatic fields because disabled/hidden HTML form fields might not submit
    formData.set('jenis_retur', jenisRetur)
    if (selectedProdukId) formData.set('id_produk', selectedProdukId)
    if (jenisRetur === 'DARI_PELANGGAN') {
      formData.set('id_barang_keluar', selectedBarangKeluarId)
    }

    const result = await createRetur(formData)
    if (result?.error) {
      toast.error('Gagal mencatat retur', { description: result.error })
    } else {
      toast.success('Retur berhasil dicatat & masuk antrean approval')
      setDialogOpen(false)
      // Reset form
      setSelectedProdukId('')
      setJenisRetur('DARI_PELANGGAN')
      setSelectedBarangKeluarId('')
      fetchData()
    }
  }

  async function handleApproveIC(id: string) {
    const result = await approveReturIC(id)
    if (result?.error) {
      toast.error('Gagal menyetujui tahap 1 (IC)', { description: result.error })
    } else {
      toast.success('Approval Tahap 1 (IC) Berhasil')
      fetchData()
    }
  }

  async function handleApproveMG(id: string) {
    const result = await approveReturMG(id)
    if (result?.error) {
      toast.error('Gagal menyetujui tahap akhir (MG)', { description: result.error })
    } else {
      toast.success('Approval Final (Manajer Gudang) Berhasil & Stok Diperbarui')
      fetchData()
    }
  }

  async function handleReject(id: string) {
    const result = await rejectRetur(id)
    if (result?.error) {
      toast.error('Gagal menolak retur', { description: result.error })
    } else {
      toast.warning('Pengajuan retur barang ditolak')
      fetchData()
    }
  }

  const columns = [
    {
      key: 'tanggal_retur', header: 'Tanggal',
      render: (item: ReturBarang) => new Date(item.tanggal_retur).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }),
    },
    {
      key: 'nama_produk', header: 'Produk',
      render: (item: ReturBarang) => <span className="font-medium">{(item.produk as unknown as Produk)?.nama_produk ?? '-'}</span>,
    },
    {
      key: 'jenis_retur', header: 'Jenis Retur',
      render: (item: ReturBarang) => (
        <span className={`text-xs font-semibold px-2 py-1 rounded-full ${item.jenis_retur === 'DARI_PELANGGAN' ? 'bg-blue-50 text-blue-700 border border-blue-200' : 'bg-orange-50 text-orange-700 border border-orange-200'}`}>
          {item.jenis_retur === 'DARI_PELANGGAN' ? 'Dari Pelanggan' : 'Ke Supplier'}
        </span>
      ),
    },
    { key: 'jumlah_retur', header: 'Jumlah' },
    { key: 'alasan_retur', header: 'Alasan' },
    {
      key: 'dicatat_oleh', header: 'Dicatat Oleh',
      render: (item: any) => item.dicatat_oleh ?? '-'
    },
    {
      key: 'status_retur', header: 'Status Approval',
      render: (item: ReturBarang) => {
        let badgeStatus = item.status_retur
        // Custom rendering helper
        if (badgeStatus === 'APPROVED_IC') badgeStatus = 'DISETUJUI_IC'
        if (badgeStatus === 'APPROVED_MG') badgeStatus = 'DISETUJUI_FINAL'
        return <StatusBadge status={badgeStatus} />
      },
    },
    {
      key: 'aksi', header: 'Aksi Approval', sortable: false, searchable: false,
      render: (item: any) => {
        const isPending = item.status_retur === 'PENDING'
        const isApprovedIc = item.status_retur === 'APPROVED_IC'

        if (isPending && canApproveIc) {
          return (
            <div className="flex gap-1">
              <Button variant="ghost" size="sm" className="text-green-600 hover:text-green-700" onClick={() => handleApproveIC(item.id_retur)}>
                <CheckCircle className="h-4 w-4 mr-1" /> Setujui IC
              </Button>
              {canReject && (
                <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700" onClick={() => handleReject(item.id_retur)}>
                  <XCircle className="h-4 w-4 mr-1" /> Tolak
                </Button>
              )}
            </div>
          )
        }

        if (isApprovedIc && canApproveMg) {
          return (
            <div className="flex gap-1">
              <Button variant="ghost" size="sm" className="text-purple-600 hover:text-purple-700" onClick={() => handleApproveMG(item.id_retur)}>
                <CheckCircle className="h-4 w-4 mr-1" /> Setujui MG
              </Button>
              {canReject && (
                <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700" onClick={() => handleReject(item.id_retur)}>
                  <XCircle className="h-4 w-4 mr-1" /> Tolak
                </Button>
              )}
            </div>
          )
        }

        return null
      },
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <RotateCcw className="h-6 w-6 text-purple-600" />
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Retur Barang</h2>
            <p className="text-slate-500">Pencatatan retur dari pelanggan atau ke supplier dengan approval 2 tahap</p>
          </div>
        </div>
        {canCreate && (
          <Button className="bg-teal-600 hover:bg-teal-700" onClick={() => setDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" /> Catat Retur
          </Button>
        )}
      </div>

      {loading ? (
        <div className="h-64 flex items-center justify-center text-slate-400">Memuat data...</div>
      ) : (
        <DataTable data={data as unknown as Record<string, unknown>[]} columns={columns as never} searchPlaceholder="Cari produk, alasan..." />
      )}

      <Dialog open={dialogOpen} onOpenChange={(open) => {
        setDialogOpen(open)
        if (!open) {
          setSelectedProdukId('')
          setJenisRetur('DARI_PELANGGAN')
          setSelectedBarangKeluarId('')
        }
      }}>
        <DialogContent>
          <DialogHeader><DialogTitle>Catat Retur Barang Baru</DialogTitle></DialogHeader>
          <form action={handleCreate} className="space-y-4">
            <div className="space-y-2">
              <Label>Jenis Retur</Label>
              <Select value={jenisRetur} onValueChange={(val) => setJenisRetur(val || '')} items={[
                { label: 'Dari Pelanggan (Barang Kembali ke Gudang)', value: 'DARI_PELANGGAN' },
                { label: 'Ke Supplier (Mengembalikan Barang Rusak)', value: 'KE_SUPPLIER' },
              ]}>
                <SelectTrigger><SelectValue placeholder="Pilih Jenis" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="DARI_PELANGGAN">Dari Pelanggan (Barang Kembali ke Gudang)</SelectItem>
                  <SelectItem value="KE_SUPPLIER">Ke Supplier (Mengembalikan Barang Rusak)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Produk</Label>
              <Select value={selectedProdukId} onValueChange={(val) => {
                setSelectedProdukId(val || '')
                setSelectedBarangKeluarId('')
              }} items={produkList.map((p) => ({ label: p.nama_produk, value: p.id_produk }))}>
                <SelectTrigger><SelectValue placeholder="Pilih produk" /></SelectTrigger>
                <SelectContent>
                  {produkList.map((p) => (
                    <SelectItem key={p.id_produk} value={p.id_produk}>{p.nama_produk}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {jenisRetur === 'DARI_PELANGGAN' && selectedProdukId && (
              <div className="space-y-2">
                <Label>Transaksi Barang Keluar Terkait (Validasi Kritis)</Label>
                <Select value={selectedBarangKeluarId} onValueChange={(val) => setSelectedBarangKeluarId(val || '')} items={filteredBarangKeluar.map((k) => ({ label: `Tujuan: ${k.tujuan || 'Gudang'} (${k.jumlah_keluar} dus) — ${new Date(k.tanggal_keluar).toLocaleDateString('id-ID')}`, value: k.id_keluar }))}>
                  <SelectTrigger><SelectValue placeholder="Pilih transaksi barang keluar" /></SelectTrigger>
                  <SelectContent>
                    {filteredBarangKeluar.length === 0 ? (
                      <SelectItem value="NONE" disabled>Tidak ditemukan data barang keluar untuk produk ini</SelectItem>
                    ) : (
                      filteredBarangKeluar.map((k) => (
                        <SelectItem key={k.id_keluar} value={k.id_keluar}>
                          Tujuan: {k.tujuan || 'Gudang'} ({k.jumlah_keluar} dus) — {new Date(k.tanggal_keluar).toLocaleDateString('id-ID')}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                <p className="text-xs text-amber-600 font-medium">
                  * Sistem wajib menolak jika tidak ada kecocokan data barang keluar yang disetujui.
                </p>
              </div>
            )}

            <div className="space-y-2">
              <Label>Jumlah Retur</Label>
              <Input name="jumlah_retur" type="number" min="1" required />
            </div>

            <div className="space-y-2">
              <Label>Alasan & Deskripsi Retur</Label>
              <Textarea name="alasan_retur" placeholder="Cth: Dus mie basah karena bocor di ekspedisi..." required />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Batal</Button>
              <Button type="submit" className="bg-teal-600 hover:bg-teal-700" disabled={jenisRetur === 'DARI_PELANGGAN' && !selectedBarangKeluarId}>
                Simpan & Ajukan
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
