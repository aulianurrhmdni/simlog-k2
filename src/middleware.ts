import NextAuth from 'next-auth'
import { authConfig } from '@/lib/auth.config'
import { NextResponse } from 'next/server'

const { auth } = NextAuth(authConfig)

export default auth((req) => {
  const { nextUrl, auth: session } = req
  const isLoggedIn = !!session
  const path = nextUrl.pathname

  const isLoginPage = path === '/login'
  const isApi = path.startsWith('/api')

  if (isApi) return NextResponse.next()

  if (isLoginPage) {
    if (isLoggedIn) {
      return NextResponse.redirect(new URL('/dashboard', nextUrl))
    }
    return NextResponse.next()
  }

  if (!isLoggedIn && path !== '/login') {
    return NextResponse.redirect(new URL('/login', nextUrl))
  }

  const role = session?.user?.role as string | undefined

  // SuperAdmin — akses penuh
  if (role === 'superadmin') return NextResponse.next()

  // Hanya superadmin yang bisa akses manajemen user
  if (path.startsWith('/dashboard/users')) {
    return NextResponse.redirect(new URL('/dashboard', nextUrl))
  }

  // -------------------------------------------------------
  // Dashboard utama: inventory_control, warehouse_staff, manager_gudang
  // -------------------------------------------------------
  if (path === '/dashboard') {
    const allowed = ['inventory_control', 'warehouse_staff', 'manager_gudang']
    if (!allowed.includes(role ?? '')) {
      return NextResponse.redirect(new URL('/login', nextUrl))
    }
    return NextResponse.next()
  }

  // -------------------------------------------------------
  // Data Stok: semua role
  // -------------------------------------------------------
  if (path.startsWith('/dashboard/stok')) {
    const allowed = ['inventory_control', 'warehouse_staff', 'manager_gudang']
    if (!allowed.includes(role ?? '')) {
      return NextResponse.redirect(new URL('/dashboard', nextUrl))
    }
    return NextResponse.next()
  }

  // -------------------------------------------------------
  // Monitoring & Alert: inventory_control, manager_gudang
  // -------------------------------------------------------
  if (path.startsWith('/dashboard/monitoring')) {
    const allowed = ['inventory_control', 'manager_gudang']
    if (!allowed.includes(role ?? '')) {
      return NextResponse.redirect(new URL('/dashboard', nextUrl))
    }
    return NextResponse.next()
  }

  // -------------------------------------------------------
  // Master Produk: inventory_control saja
  // -------------------------------------------------------
  if (path.startsWith('/dashboard/produk')) {
    if (role !== 'inventory_control') {
      return NextResponse.redirect(new URL('/dashboard', nextUrl))
    }
    return NextResponse.next()
  }

  // -------------------------------------------------------
  // Barang Masuk: warehouse_staff input; inventory_control & manager_gudang approval
  // -------------------------------------------------------
  if (path.startsWith('/dashboard/barang-masuk')) {
    const allowed = ['warehouse_staff', 'inventory_control', 'manager_gudang']
    if (!allowed.includes(role ?? '')) {
      return NextResponse.redirect(new URL('/dashboard', nextUrl))
    }
    return NextResponse.next()
  }

  // -------------------------------------------------------
  // Barang Keluar: warehouse_staff input; inventory_control & manager_gudang approval
  // -------------------------------------------------------
  if (path.startsWith('/dashboard/barang-keluar')) {
    const allowed = ['warehouse_staff', 'inventory_control', 'manager_gudang']
    if (!allowed.includes(role ?? '')) {
      return NextResponse.redirect(new URL('/dashboard', nextUrl))
    }
    return NextResponse.next()
  }

  // -------------------------------------------------------
  // Retur Barang: warehouse_staff input; inventory_control & manager_gudang approval
  // -------------------------------------------------------
  if (path.startsWith('/dashboard/retur')) {
    const allowed = ['warehouse_staff', 'inventory_control', 'manager_gudang']
    if (!allowed.includes(role ?? '')) {
      return NextResponse.redirect(new URL('/dashboard', nextUrl))
    }
    return NextResponse.next()
  }

  // -------------------------------------------------------
  // Laporan: inventory_control, manager_gudang
  // -------------------------------------------------------
  if (path.startsWith('/dashboard/laporan')) {
    const allowed = ['inventory_control', 'manager_gudang']
    if (!allowed.includes(role ?? '')) {
      return NextResponse.redirect(new URL('/dashboard', nextUrl))
    }
    return NextResponse.next()
  }

  // -------------------------------------------------------
  // Pengadaan: inventory_control saja (menggantikan procurement_manager)
  // -------------------------------------------------------
  if (path.startsWith('/dashboard/pengadaan')) {
    if (role !== 'inventory_control') {
      return NextResponse.redirect(new URL('/dashboard', nextUrl))
    }
    return NextResponse.next()
  }

  // -------------------------------------------------------
  // Pengiriman & Keluhan — tidak diakses oleh siapapun lagi
  // Redirect ke dashboard
  // -------------------------------------------------------
  if (path.startsWith('/dashboard/pengiriman') || path.startsWith('/dashboard/keluhan')) {
    return NextResponse.redirect(new URL('/dashboard', nextUrl))
  }

  return NextResponse.next()
})

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
