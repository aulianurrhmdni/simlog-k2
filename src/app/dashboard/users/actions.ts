'use server'

import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import bcrypt from 'bcryptjs'
import { revalidatePath } from 'next/cache'

// Only admin can perform these actions
async function requireAdmin() {
  const session = await auth()
  if (!session?.user) return { error: 'Unauthorized' }
  if (session.user.role !== 'admin') return { error: 'Forbidden: Hanya Admin yang dapat mengakses' }
  return { session }
}

export async function getUserList() {
  const check = await requireAdmin()
  if ('error' in check) return { error: check.error }

  const users = await prisma.user.findMany({
    orderBy: { createdAt: 'desc' },
    select: { id: true, email: true, name: true, role: true, createdAt: true },
  })
  return { success: true, data: users }
}

export async function createUser(formData: FormData) {
  const check = await requireAdmin()
  if ('error' in check) return { error: check.error }

  const email = formData.get('email') as string
  const name = formData.get('name') as string
  const role = formData.get('role') as string
  const password = formData.get('password') as string

  const VALID_ROLES = ['admin', 'inventory_control', 'warehouse_staff', 'manager_gudang']

  if (!email || !name || !role || !password) {
    return { error: 'Semua field wajib diisi' }
  }

  if (!VALID_ROLES.includes(role)) {
    return { error: 'Role tidak valid' }
  }

  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) return { error: 'Email sudah terdaftar' }

  const hashed = await bcrypt.hash(password, 10)
  await prisma.user.create({
    data: { email, name, role, password: hashed },
  })

  revalidatePath('/dashboard/users')
  return { success: true }
}

export async function updateUser(formData: FormData) {
  const check = await requireAdmin()
  if ('error' in check) return { error: check.error }

  const id = formData.get('id') as string
  const email = formData.get('email') as string
  const name = formData.get('name') as string
  const role = formData.get('role') as string
  const password = formData.get('password') as string

  if (!id || !email || !name || !role) {
    return { error: 'ID, Email, Nama, dan Role wajib diisi' }
  }

  const VALID_ROLES = ['admin', 'inventory_control', 'warehouse_staff', 'manager_gudang']
  if (!VALID_ROLES.includes(role)) {
    return { error: 'Role tidak valid' }
  }

  // Check email uniqueness (excluding current user)
  const existing = await prisma.user.findFirst({
    where: { email, NOT: { id } },
  })
  if (existing) return { error: 'Email sudah digunakan oleh user lain' }

  const updateData: Record<string, unknown> = { email, name, role }

  // Only update password if provided
  if (password && password.trim().length > 0) {
    updateData.password = await bcrypt.hash(password, 10)
  }

  await prisma.user.update({ where: { id }, data: updateData })

  revalidatePath('/dashboard/users')
  return { success: true }
}

export async function deleteUser(id: string) {
  const check = await requireAdmin()
  if ('error' in check) return { error: check.error }

  // Prevent deleting self
  if (check.session.user.id === id) {
    return { error: 'Tidak dapat menghapus akun sendiri' }
  }

  await prisma.user.delete({ where: { id } })

  revalidatePath('/dashboard/users')
  return { success: true }
}
