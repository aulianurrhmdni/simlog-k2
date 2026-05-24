import { cn } from '@/lib/utils'

const statusColors: Record<string, string> = {
  // Penerimaan
  PENDING: 'bg-amber-100 text-amber-800 border-amber-200',
  DITERIMA: 'bg-green-100 text-green-800 border-green-200',
  DITOLAK: 'bg-red-100 text-red-800 border-red-200',
  // Pengeluaran
  DIPROSES: 'bg-blue-100 text-blue-800 border-blue-200',
  SELESAI: 'bg-green-100 text-green-800 border-green-200',
  DIBATALKAN: 'bg-slate-100 text-slate-600 border-slate-200',
  // Pengiriman
  DIJADWALKAN: 'bg-purple-100 text-purple-800 border-purple-200',
  DIKIRIM: 'bg-blue-100 text-blue-800 border-blue-200',
  GAGAL: 'bg-red-100 text-red-800 border-red-200',
  // Alert
  AKTIF: 'bg-red-100 text-red-800 border-red-200',
  DIABAIKAN: 'bg-slate-100 text-slate-600 border-slate-200',
  // Keluhan
  OPEN: 'bg-amber-100 text-amber-800 border-amber-200',
  // Stok
  NORMAL: 'bg-green-100 text-green-800 border-green-200',
  RENDAH: 'bg-amber-100 text-amber-800 border-amber-200',
  KRITIS: 'bg-red-100 text-red-800 border-red-200',
  // Permintaan
  DISETUJUI: 'bg-green-100 text-green-800 border-green-200',
}

export function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors',
        statusColors[status] ?? 'bg-slate-100 text-slate-600 border-slate-200'
      )}
    >
      {status}
    </span>
  )
}
