'use client'

import { useEffect, useState } from 'react'
import { dismissAlert, resolveAlert, getMonitoringData } from './actions'
import { DataTable } from '@/components/ui/data-table'
import { StatusBadge } from '@/components/ui/status-badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Activity, Bell, CheckCircle, XCircle } from 'lucide-react'
import { toast } from 'sonner'
import type { AlertStok, MonitoringStok, Produk } from '@/lib/types/database'

export default function MonitoringPage() {
  const [alerts, setAlerts] = useState<AlertStok[]>([])
  const [monitoring, setMonitoring] = useState<MonitoringStok[]>([])
  const [loading, setLoading] = useState(true)
  const [activeAlertCount, setActiveAlertCount] = useState(0)

  async function fetchData() {
    const res = await getMonitoringData()
    if (res.success && res.data) {
      const alertData = (res.data.alerts as unknown as AlertStok[]) ?? []
      setAlerts(alertData)
      setActiveAlertCount(alertData.filter((a) => a.status === 'AKTIF').length)
      setMonitoring((res.data.monitoring as unknown as MonitoringStok[]) ?? [])
    } else {
      toast.error('Gagal mengambil data', { description: res.error })
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchData()
    // Real-time updates removed due to migration from Supabase to Prisma (SQLite)
    // Polling could be added here if needed: const interval = setInterval(fetchData, 5000); return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function handleDismiss(id: string) {
    const result = await dismissAlert(id)
    if (result?.error) toast.error(result.error)
    else { toast.success('Alert diabaikan'); fetchData() }
  }

  async function handleResolve(id: string) {
    const result = await resolveAlert(id)
    if (result?.error) toast.error(result.error)
    else { toast.success('Alert diselesaikan'); fetchData() }
  }

  const alertColumns = [
    {
      key: 'waktu_alert', header: 'Waktu',
      render: (item: AlertStok) => new Date(item.waktu_alert).toLocaleString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
    },
    {
      key: 'nama_produk', header: 'Produk',
      render: (item: AlertStok) => <span className="font-medium">{(item.produk as unknown as Produk)?.nama_produk ?? '-'}</span>,
    },
    {
      key: 'jenis_alert', header: 'Jenis Alert',
      render: (item: AlertStok) => <StatusBadge status={item.jenis_alert} />,
    },
    { key: 'pesan', header: 'Pesan' },
    {
      key: 'status', header: 'Status',
      render: (item: AlertStok) => <StatusBadge status={item.status} />,
    },
    {
      key: 'aksi', header: 'Aksi', sortable: false, searchable: false,
      render: (item: AlertStok) => item.status === 'AKTIF' ? (
        <div className="flex gap-1">
          <Button variant="ghost" size="sm" className="text-green-600" onClick={() => handleResolve(item.id_alert)}>
            <CheckCircle className="h-4 w-4 mr-1" /> Selesai
          </Button>
          <Button variant="ghost" size="sm" className="text-slate-400" onClick={() => handleDismiss(item.id_alert)}>
            <XCircle className="h-4 w-4 mr-1" /> Abaikan
          </Button>
        </div>
      ) : null,
    },
  ]

  const monitoringColumns = [
    {
      key: 'waktu_monitor', header: 'Waktu Monitor',
      render: (item: MonitoringStok) => new Date(item.waktu_monitor).toLocaleString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
    },
    {
      key: 'nama_produk', header: 'Produk',
      render: (item: MonitoringStok) => <span className="font-medium">{(item.produk as unknown as Produk)?.nama_produk ?? '-'}</span>,
    },
    { key: 'stok_aktual', header: 'Stok Aktual' },
    { key: 'stok_minimum', header: 'Stok Minimum' },
    {
      key: 'status', header: 'Status',
      render: (item: MonitoringStok) => <StatusBadge status={item.status} />,
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Activity className="h-6 w-6 text-teal-600" />
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Monitoring & Alert Stok</h2>
          <p className="text-slate-500">Pantau alert stok minimum dan expired secara real-time</p>
        </div>
        {activeAlertCount > 0 && (
          <span className="inline-flex items-center rounded-full bg-red-100 px-3 py-1 text-sm font-semibold text-red-800">
            <Bell className="h-3.5 w-3.5 mr-1" /> {activeAlertCount} Alert Aktif
          </span>
        )}
      </div>

      {loading ? (
        <div className="h-64 flex items-center justify-center text-slate-400">Memuat data...</div>
      ) : (
        <Tabs defaultValue="alerts">
          <TabsList>
            <TabsTrigger value="alerts">Alert Stok ({alerts.length})</TabsTrigger>
            <TabsTrigger value="monitoring">Monitoring Stok ({monitoring.length})</TabsTrigger>
          </TabsList>
          <TabsContent value="alerts" className="mt-4">
            <DataTable data={alerts as unknown as Record<string, unknown>[]} columns={alertColumns as never} searchPlaceholder="Cari alert..." />
          </TabsContent>
          <TabsContent value="monitoring" className="mt-4">
            <DataTable data={monitoring as unknown as Record<string, unknown>[]} columns={monitoringColumns as never} searchPlaceholder="Cari produk..." />
          </TabsContent>
        </Tabs>
      )}
    </div>
  )
}
