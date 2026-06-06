'use client'

import { useEffect, useState, useTransition } from 'react'
import { getUserList, createUser, updateUser, deleteUser } from './actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Users, Plus, Pencil, Trash2, Shield, Eye, EyeOff } from 'lucide-react'
import { toast } from 'sonner'

interface User {
  id: string
  email: string
  name: string
  role: string
  createdAt: string | Date
}

const ROLES = [
  { value: 'superadmin', label: 'Admin' },
  { value: 'inventory_control', label: 'Inventory Control Staf' },
  { value: 'warehouse_staff', label: 'Staf Gudang' },
  { value: 'manager_gudang', label: 'Manajer Gudang' },
]

const ROLE_COLORS: Record<string, string> = {
  superadmin: 'bg-yellow-100 text-yellow-700 border-yellow-250',
  inventory_control: 'bg-blue-100 text-blue-700 border-blue-250',
  warehouse_staff: 'bg-emerald-100 text-emerald-700 border-emerald-250',
  manager_gudang: 'bg-purple-100 text-purple-700 border-purple-250',
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [isPending, startTransition] = useTransition()

  // Dialog states
  const [createOpen, setCreateOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)

  // Form states
  const [formName, setFormName] = useState('')
  const [formEmail, setFormEmail] = useState('')
  const [formRole, setFormRole] = useState('')
  const [formPassword, setFormPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  async function fetchData() {
    setLoading(true)
    const res = await getUserList()
    if (res.success && res.data) {
      setUsers(res.data as User[])
    } else {
      toast.error('Gagal memuat data', { description: res.error })
    }
    setLoading(false)
  }

  useEffect(() => { fetchData() }, [])

  function resetForm() {
    setFormName('')
    setFormEmail('')
    setFormRole('')
    setFormPassword('')
    setShowPassword(false)
  }

  function openCreate() {
    resetForm()
    setCreateOpen(true)
  }

  function openEdit(user: User) {
    setSelectedUser(user)
    setFormName(user.name)
    setFormEmail(user.email)
    setFormRole(user.role)
    setFormPassword('')
    setShowPassword(false)
    setEditOpen(true)
  }

  function openDelete(user: User) {
    setSelectedUser(user)
    setDeleteOpen(true)
  }

  function handleCreate() {
    const fd = new FormData()
    fd.set('name', formName)
    fd.set('email', formEmail)
    fd.set('role', formRole)
    fd.set('password', formPassword)
    startTransition(async () => {
      const res = await createUser(fd)
      if (res?.error) {
        toast.error('Gagal membuat user', { description: res.error })
      } else {
        toast.success('User berhasil ditambahkan')
        setCreateOpen(false)
        resetForm()
        fetchData()
      }
    })
  }

  function handleUpdate() {
    if (!selectedUser) return
    const fd = new FormData()
    fd.set('id', selectedUser.id)
    fd.set('name', formName)
    fd.set('email', formEmail)
    fd.set('role', formRole)
    fd.set('password', formPassword)
    startTransition(async () => {
      const res = await updateUser(fd)
      if (res?.error) {
        toast.error('Gagal memperbarui user', { description: res.error })
      } else {
        toast.success('User berhasil diperbarui')
        setEditOpen(false)
        setSelectedUser(null)
        resetForm()
        fetchData()
      }
    })
  }

  function handleDelete() {
    if (!selectedUser) return
    startTransition(async () => {
      const res = await deleteUser(selectedUser.id)
      if (res?.error) {
        toast.error('Gagal menghapus user', { description: res.error })
      } else {
        toast.success('User berhasil dihapus')
        setDeleteOpen(false)
        setSelectedUser(null)
        fetchData()
      }
    })
  }

  const getRoleLabel = (role: string) => ROLES.find(r => r.value === role)?.label ?? role

  const fmt = (d: Date | string) =>
    new Date(d).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-yellow-100 p-2">
            <Users className="h-6 w-6 text-yellow-600" />
          </div>
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Manajemen Pengguna</h2>
            <p className="text-slate-500 text-sm mt-0.5">Kelola akun dan hak akses pengguna sistem</p>
          </div>
        </div>
        <Button className="bg-teal-600 hover:bg-teal-700 text-white" onClick={openCreate}>
          <Plus className="h-4 w-4 mr-2" /> Tambah User
        </Button>
      </div>

      {/* Summary */}
      <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-6">
        {ROLES.map(r => {
          const count = users.filter(u => u.role === r.value).length
          return (
            <Card key={r.value} className="border-l-4 border-l-slate-200">
              <CardHeader className="space-y-0 pb-1 pt-3 px-4">
                <CardTitle className="text-[11px] font-medium text-slate-500 leading-tight">{r.label}</CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-3">
                <div className="text-xl font-bold text-slate-800">{count}</div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-yellow-600" />
            <CardTitle className="text-base">Daftar Pengguna</CardTitle>
          </div>
          <CardDescription>Total {users.length} pengguna terdaftar</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="h-48 flex items-center justify-center text-slate-400">Memuat data pengguna...</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50">
                    <TableHead>Nama</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Dibuat</TableHead>
                    <TableHead className="text-center">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-12 text-slate-400">
                        Belum ada pengguna terdaftar
                      </TableCell>
                    </TableRow>
                  ) : (
                    users.map(user => (
                      <TableRow key={user.id} className="hover:bg-slate-50/60">
                        <TableCell className="font-semibold text-sm">{user.name}</TableCell>
                        <TableCell className="text-sm text-slate-600">{user.email}</TableCell>
                        <TableCell>
                          <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${ROLE_COLORS[user.role] ?? 'bg-slate-100 text-slate-700 border-slate-200'}`}>
                            {getRoleLabel(user.role)}
                          </span>
                        </TableCell>
                        <TableCell className="text-sm text-slate-500">{fmt(user.createdAt)}</TableCell>
                        <TableCell>
                          <div className="flex items-center justify-center gap-1">
                            <Button variant="ghost" size="sm" className="text-teal-600 hover:text-teal-700 hover:bg-teal-50" onClick={() => openEdit(user)}>
                              <Pencil className="h-3.5 w-3.5 mr-1" /> Edit
                            </Button>
                            <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-600 hover:bg-red-50" onClick={() => openDelete(user)}>
                              <Trash2 className="h-3.5 w-3.5 mr-1" /> Hapus
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Tambah Pengguna Baru</DialogTitle>
            <DialogDescription>Isi data pengguna yang akan ditambahkan ke sistem.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nama Lengkap <span className="text-red-500">*</span></Label>
              <Input value={formName} onChange={e => setFormName(e.target.value)} placeholder="Masukkan nama lengkap" />
            </div>
            <div className="space-y-2">
              <Label>Email <span className="text-red-500">*</span></Label>
              <Input type="email" value={formEmail} onChange={e => setFormEmail(e.target.value)} placeholder="user@cahayaindomie.com" />
            </div>
            <div className="space-y-2">
              <Label>Role <span className="text-red-500">*</span></Label>
              <Select value={formRole} onValueChange={(val) => setFormRole(val || '')}>
                <SelectTrigger><SelectValue placeholder="Pilih role" /></SelectTrigger>
                <SelectContent>
                  {ROLES.map(r => (
                    <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Password <span className="text-red-500">*</span></Label>
              <div className="relative">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  value={formPassword}
                  onChange={e => setFormPassword(e.target.value)}
                  placeholder="Masukkan password"
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
          </div>
          <DialogFooter className="pt-2">
            <Button variant="outline" onClick={() => setCreateOpen(false)} disabled={isPending}>Batal</Button>
            <Button className="bg-teal-600 hover:bg-teal-700" onClick={handleCreate}
              disabled={isPending || !formName || !formEmail || !formRole || !formPassword}>
              {isPending ? 'Menyimpan...' : 'Simpan'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Pengguna</DialogTitle>
            <DialogDescription>Perbarui data pengguna. Kosongkan password jika tidak ingin mengubahnya.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nama Lengkap <span className="text-red-500">*</span></Label>
              <Input value={formName} onChange={e => setFormName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Email <span className="text-red-500">*</span></Label>
              <Input type="email" value={formEmail} onChange={e => setFormEmail(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Role <span className="text-red-500">*</span></Label>
              <Select value={formRole} onValueChange={(val) => setFormRole(val || '')}>
                <SelectTrigger><SelectValue placeholder="Pilih role" /></SelectTrigger>
                <SelectContent>
                  {ROLES.map(r => (
                    <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Password Baru <span className="text-slate-400 text-xs font-normal">(opsional)</span></Label>
              <div className="relative">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  value={formPassword}
                  onChange={e => setFormPassword(e.target.value)}
                  placeholder="Kosongkan jika tidak diubah"
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
          </div>
          <DialogFooter className="pt-2">
            <Button variant="outline" onClick={() => setEditOpen(false)} disabled={isPending}>Batal</Button>
            <Button className="bg-teal-600 hover:bg-teal-700" onClick={handleUpdate}
              disabled={isPending || !formName || !formEmail || !formRole}>
              {isPending ? 'Memperbarui...' : 'Perbarui'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-red-600">Hapus Pengguna</DialogTitle>
            <DialogDescription>Tindakan ini tidak dapat dibatalkan.</DialogDescription>
          </DialogHeader>
          <div className="rounded-lg bg-red-50 border border-red-200 p-3">
            <p className="text-sm font-semibold text-red-700">{selectedUser?.name}</p>
            <p className="text-xs text-red-500 mt-0.5">{selectedUser?.email} · {getRoleLabel(selectedUser?.role ?? '')}</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)} disabled={isPending}>Batal</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isPending}>
              {isPending ? 'Menghapus...' : 'Ya, Hapus User'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
