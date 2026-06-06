'use client'

import { useState, useEffect } from 'react'
import { useTheme } from 'next-themes'
import { Bell, Sun, Moon, LogOut, ChevronDown, Menu, Shield, User } from 'lucide-react'
import { logout } from '@/app/dashboard/actions'

interface HeaderProps {
  email?: string | null
  role?: string
  name?: string | null
}

const ROLE_LABELS: Record<string, string> = {
  admin: 'Admin',
  inventory_control: 'Inventory Control Staf',
  warehouse_staff: 'Staf Gudang',
  manager_gudang: 'Manajer Gudang',
}

const ROLE_COLORS: Record<string, { bg: string; text: string }> = {
  admin: { bg: '#fef9c3', text: '#854d0e' },
  inventory_control: { bg: '#dbeafe', text: '#1e40af' },
  warehouse_staff: { bg: '#d1fae5', text: '#065f46' },
  manager_gudang: { bg: '#ede9fe', text: '#5b21b6' },
}

function getInitials(name?: string | null): string {
  if (!name) return '?'
  return name
    .split(' ')
    .map(w => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

export function Header({ email, role, name }: HeaderProps) {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [currentTime, setCurrentTime] = useState(new Date())
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [alertCount] = useState(3)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  const dateStr = currentTime.toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
  const timeStr = currentTime.toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  })

  const roleColor = ROLE_COLORS[role ?? ''] ?? ROLE_COLORS['viewer']

  async function handleLogout() {
    setDropdownOpen(false)
    await logout()
  }

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md shadow-sm">
      <div className="flex items-center h-16 px-4 lg:px-6 gap-3">
        {/* Left: Hamburger (mobile) */}
        <button className="md:hidden p-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
          <Menu size={20} />
        </button>

        {/* Left: Breadcrumb */}
        <div className="hidden sm:flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
          <span className="text-teal-600 dark:text-teal-400 font-semibold">PT CAHAYA INDOMIE</span>
          <ChevronDown size={14} className="rotate-[-90deg] opacity-50" />
          <span className="text-slate-700 dark:text-slate-200 font-medium">Dashboard</span>
        </div>

        {/* Center: Realtime Clock */}
        <div className="flex-1 flex justify-center">
          {mounted && (
            <div className="flex flex-col items-center select-none">
              <span className="text-xs text-slate-400 dark:text-slate-500 leading-tight">{dateStr}</span>
              <span className="text-base font-mono font-bold text-teal-600 dark:text-teal-400 leading-tight tracking-wider">
                {timeStr}
              </span>
            </div>
          )}
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-2">
          {/* Alert Bell */}
          <button
            className="relative p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="Notifikasi Alert Stok"
          >
            <Bell size={20} />
            {alertCount > 0 && (
              <span
                className="absolute top-1 right-1 flex items-center justify-center"
                style={{
                  minWidth: '16px',
                  height: '16px',
                  background: '#ef4444',
                  borderRadius: '8px',
                  fontSize: '10px',
                  fontWeight: 700,
                  color: '#fff',
                  lineHeight: 1,
                  padding: '0 3px',
                  border: '1.5px solid white',
                }}
              >
                {alertCount}
              </span>
            )}
          </button>

          {/* Theme Toggle */}
          {mounted && (
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="Toggle tema"
            >
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>
          )}

          {/* User dropdown */}
          <div className="relative">
            <button
              onClick={() => setDropdownOpen(prev => !prev)}
              className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              {/* Avatar */}
              <div
                className="flex items-center justify-center w-8 h-8 rounded-full text-white text-sm font-bold"
                style={{
                  background: 'linear-gradient(135deg, #0d9488 0%, #0f766e 100%)',
                  boxShadow: '0 2px 8px rgba(13,148,136,0.4)',
                }}
              >
                {getInitials(name)}
              </div>
              <div className="hidden sm:flex flex-col items-start">
                <span className="text-sm font-semibold text-slate-700 dark:text-slate-200 leading-tight max-w-[120px] truncate">
                  {name ?? email ?? 'User'}
                </span>
                <span
                  className="text-xs font-medium leading-tight"
                  style={{ color: roleColor.text }}
                >
                  {ROLE_LABELS[role ?? ''] ?? role ?? 'Staff'}
                </span>
              </div>
              <ChevronDown
                size={14}
                className="text-slate-400 dark:text-slate-500 transition-transform"
                style={{ transform: dropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}
              />
            </button>

            {/* Dropdown menu */}
            {dropdownOpen && (
              <>
                {/* Backdrop */}
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setDropdownOpen(false)}
                />
                <div
                  className="absolute right-0 top-12 z-20 w-60 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 overflow-hidden"
                  style={{
                    background: 'rgba(255,255,255,0.95)',
                    backdropFilter: 'blur(12px)',
                  }}
                >
                  {/* User info section */}
                  <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800">
                    <div className="flex items-center gap-3">
                      <div
                        className="flex items-center justify-center w-10 h-10 rounded-full text-white font-bold"
                        style={{
                          background: 'linear-gradient(135deg, #0d9488 0%, #0f766e 100%)',
                        }}
                      >
                        {getInitials(name)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate">
                          {name ?? 'User'}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{email}</p>
                      </div>
                    </div>
                    <div className="mt-2">
                      <span
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold"
                        style={{ background: roleColor.bg, color: roleColor.text }}
                      >
                        <Shield size={10} />
                        {ROLE_LABELS[role ?? ''] ?? role}
                      </span>
                    </div>
                  </div>

                  {/* Menu items */}
                  <div className="py-1">
                    <button
                      onClick={() => setDropdownOpen(false)}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-left"
                    >
                      <User size={15} className="text-slate-400" />
                      Profil Saya
                    </button>
                  </div>

                  {/* Logout */}
                  <div className="border-t border-slate-100 dark:border-slate-700 py-1">
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors text-left"
                    >
                      <LogOut size={15} />
                      Keluar dari Sistem
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
