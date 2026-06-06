'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Package,
  LayoutDashboard,
  Database,
  Activity,
  BoxIcon,
  Soup,
  ArrowDownCircle,
  ArrowUpCircle,
  RotateCcw,
  ShoppingCart,
  FileBarChart2,
  Users,
  Shield,
} from 'lucide-react'

interface MenuItem {
  label: string
  href: string
  icon: React.ReactNode
  roles?: string[]
}

interface MenuGroup {
  group: string
  items: MenuItem[]
}

const MENU_GROUPS: MenuGroup[] = [
  {
    group: 'INVENTARIS',
    items: [
      {
        label: 'Dashboard',
        href: '/dashboard',
        icon: <LayoutDashboard size={18} />,
        roles: ['admin', 'inventory_control', 'manager_gudang'],
      },
      {
        label: 'Data Stok',
        href: '/dashboard/stok',
        icon: <Database size={18} />,
        roles: ['admin', 'inventory_control', 'warehouse_staff', 'manager_gudang'],
      },
      {
        label: 'Monitoring & Alert',
        href: '/dashboard/monitoring',
        icon: <Activity size={18} />,
        roles: ['admin', 'inventory_control', 'manager_gudang'],
      },
      {
        label: 'Master Produk',
        href: '/dashboard/produk',
        icon: <BoxIcon size={18} />,
        roles: ['admin', 'inventory_control'],
      },
      {
        label: 'Varian Rasa',
        href: '/dashboard/varian-rasa',
        icon: <Soup size={18} />,
        roles: ['admin', 'inventory_control'],
      },
    ],
  },
  {
    group: 'OPERASIONAL',
    items: [
      {
        label: 'Barang Masuk',
        href: '/dashboard/barang-masuk',
        icon: <ArrowDownCircle size={18} />,
        roles: ['admin', 'warehouse_staff', 'inventory_control', 'manager_gudang'],
      },
      {
        label: 'Barang Keluar',
        href: '/dashboard/barang-keluar',
        icon: <ArrowUpCircle size={18} />,
        roles: ['admin', 'warehouse_staff', 'inventory_control', 'manager_gudang'],
      },
      {
        label: 'Retur Barang',
        href: '/dashboard/retur',
        icon: <RotateCcw size={18} />,
        roles: ['admin', 'warehouse_staff', 'inventory_control', 'manager_gudang'],
      },
    ],
  },
  {
    group: 'PENGADAAN',
    items: [
      {
        label: 'Pengadaan Barang',
        href: '/dashboard/pengadaan',
        icon: <ShoppingCart size={18} />,
        roles: ['admin', 'inventory_control'],
      },
    ],
  },
  {
    group: 'LAPORAN',
    items: [
      {
        label: 'Laporan Inventory',
        href: '/dashboard/laporan',
        icon: <FileBarChart2 size={18} />,
        roles: ['admin', 'inventory_control', 'manager_gudang'],
      },
    ],
  },
  {
    group: 'ADMIN',
    items: [
      {
        label: 'Manajemen User',
        href: '/dashboard/users',
        icon: <Users size={18} />,
        roles: ['admin'],
      },
    ],
  },
]

const ROLE_LABELS: Record<string, string> = {
  admin: 'Admin',
  inventory_control: 'Inventory Control Staf',
  warehouse_staff: 'Staf Gudang',
  manager_gudang: 'Manajer Gudang',
}

interface SidebarProps {
  role?: string
}

export function Sidebar({ role }: SidebarProps) {
  const pathname = usePathname()

  function isActive(href: string): boolean {
    if (href === '/dashboard') return pathname === '/dashboard'
    return pathname.startsWith(href)
  }

  const filteredGroups = MENU_GROUPS.map(group => ({
    ...group,
    items: group.items.filter(item => !item.roles || item.roles.includes(role ?? '')),
  })).filter(group => group.items.length > 0)

  return (
    <aside
      style={{
        width: '248px',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        background: 'linear-gradient(180deg, #0f172a 0%, #0d1b2a 100%)',
        borderRight: '1px solid rgba(255,255,255,0.06)',
        overflowY: 'auto',
        overflowX: 'hidden',
      }}
    >
      {/* Brand header */}
      <div
        style={{
          padding: '20px 18px 16px',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          background: 'rgba(13,148,136,0.08)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #0d9488 0%, #0f766e 100%)',
              boxShadow: '0 4px 14px rgba(13,148,136,0.4)',
              flexShrink: 0,
            }}
          >
            <Package size={22} color="#fff" strokeWidth={1.8} />
          </div>
          <div>
            <div
              style={{
                fontSize: '15px',
                fontWeight: 800,
                color: '#f1f5f9',
                lineHeight: 1.1,
                letterSpacing: '-0.3px',
              }}
            >
              CAHAYA INDOMIE
            </div>
            <div
              style={{
                fontSize: '10px',
                color: 'rgba(20,184,166,0.8)',
                fontWeight: 500,
                letterSpacing: '0.3px',
              }}
            >
              PT CAHAYA INDOMIE
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav style={{ flex: 1, padding: '12px 10px', overflowY: 'auto' }}>
        {filteredGroups.map(group => (
          <div key={group.group} style={{ marginBottom: '6px' }}>
            {/* Group label */}
            <div
              style={{
                padding: '8px 10px 4px',
                fontSize: '9.5px',
                fontWeight: 700,
                color: 'rgba(100,116,139,0.7)',
                letterSpacing: '1px',
                textTransform: 'uppercase',
              }}
            >
              {group.group}
            </div>

            {/* Items */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
              {group.items.map(item => {
                const active = isActive(item.href)
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '8px 10px',
                      borderRadius: '8px',
                      textDecoration: 'none',
                      fontSize: '13.5px',
                      fontWeight: active ? 600 : 400,
                      color: active ? '#2dd4bf' : 'rgba(203,213,225,0.75)',
                      background: active
                        ? 'rgba(20,184,166,0.12)'
                        : 'transparent',
                      borderLeft: active
                        ? '2px solid #14b8a6'
                        : '2px solid transparent',
                      transition: 'all 0.15s ease',
                      position: 'relative',
                    }}
                    onMouseOver={e => {
                      if (!active) {
                        ;(e.currentTarget as HTMLAnchorElement).style.background =
                          'rgba(255,255,255,0.05)'
                        ;(e.currentTarget as HTMLAnchorElement).style.color =
                          'rgba(203,213,225,0.95)'
                      }
                    }}
                    onMouseOut={e => {
                      if (!active) {
                        ;(e.currentTarget as HTMLAnchorElement).style.background =
                          'transparent'
                        ;(e.currentTarget as HTMLAnchorElement).style.color =
                          'rgba(203,213,225,0.75)'
                      }
                    }}
                  >
                    {/* Icon */}
                    <span
                      style={{
                        color: active ? '#2dd4bf' : 'rgba(100,116,139,0.8)',
                        flexShrink: 0,
                        display: 'flex',
                        alignItems: 'center',
                        transition: 'color 0.15s',
                      }}
                    >
                      {item.icon}
                    </span>

                    {/* Label */}
                    <span style={{ flex: 1, lineHeight: 1.2 }}>{item.label}</span>

                    {/* Active dot indicator */}
                    {active && (
                      <span
                        style={{
                          width: '6px',
                          height: '6px',
                          borderRadius: '50%',
                          background: '#14b8a6',
                          flexShrink: 0,
                          boxShadow: '0 0 6px rgba(20,184,166,0.7)',
                        }}
                      />
                    )}
                  </Link>
                )
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div
        style={{
          padding: '14px 16px',
          borderTop: '1px solid rgba(255,255,255,0.06)',
          background: 'rgba(0,0,0,0.2)',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '8px',
          }}
        >
          <Shield size={13} color="rgba(20,184,166,0.7)" />
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              padding: '2px 8px',
              borderRadius: '20px',
              fontSize: '11px',
              fontWeight: 600,
              background:
                role === 'admin'
                  ? 'rgba(234,179,8,0.15)'
                  : role === 'manager_gudang'
                  ? 'rgba(59,130,246,0.15)'
                  : 'rgba(20,184,166,0.12)',
              color:
                role === 'admin'
                  ? '#fbbf24'
                  : role === 'manager_gudang'
                  ? '#93c5fd'
                  : '#2dd4bf',
            }}
          >
            {ROLE_LABELS[role ?? ''] ?? (role ?? 'User')}
          </span>
        </div>
        <p
          style={{
            fontSize: '10px',
            color: 'rgba(71,85,105,0.8)',
            margin: 0,
            lineHeight: 1.4,
          }}
        >
          © {new Date().getFullYear()} PT CAHAYA INDOMIE
        </p>
      </div>
    </aside>
  )
}
