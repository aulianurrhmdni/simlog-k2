'use client'

import { useState, useEffect, useTransition } from 'react'
import { toast } from 'sonner'
import { Package, Lock, Mail, Eye, EyeOff } from 'lucide-react'
import { login } from './actions'

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    startTransition(async () => {
      const result = await login(formData)
      if (result?.error) {
        toast.error(result.error, {
          description: 'Periksa kembali email dan kata sandi Anda.',
        })
      }
    })
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #134e4a 0%, #0f172a 50%, #115e59 100%)',
        position: 'relative',
        overflow: 'hidden',
        fontFamily: 'system-ui, -apple-system, sans-serif',
      }}
    >
      {/* Animated background blobs */}
      <div
        style={{
          position: 'absolute',
          top: '-120px',
          left: '-120px',
          width: '480px',
          height: '480px',
          borderRadius: '50%',
          background:
            'radial-gradient(circle, rgba(20,184,166,0.25) 0%, rgba(20,184,166,0) 70%)',
          animation: mounted ? 'blob1 8s ease-in-out infinite' : undefined,
          filter: 'blur(40px)',
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: '-100px',
          right: '-80px',
          width: '420px',
          height: '420px',
          borderRadius: '50%',
          background:
            'radial-gradient(circle, rgba(56,189,248,0.2) 0%, rgba(56,189,248,0) 70%)',
          animation: mounted ? 'blob2 10s ease-in-out infinite' : undefined,
          filter: 'blur(40px)',
        }}
      />
      <div
        style={{
          position: 'absolute',
          top: '40%',
          right: '15%',
          width: '280px',
          height: '280px',
          borderRadius: '50%',
          background:
            'radial-gradient(circle, rgba(20,184,166,0.15) 0%, rgba(20,184,166,0) 70%)',
          animation: mounted ? 'blob3 12s ease-in-out infinite' : undefined,
          filter: 'blur(30px)',
        }}
      />

      {/* Floating geometric shapes */}
      {mounted && (
        <>
          <div
            style={{
              position: 'absolute',
              top: '12%',
              left: '8%',
              width: '60px',
              height: '60px',
              border: '1px solid rgba(20,184,166,0.3)',
              borderRadius: '12px',
              transform: 'rotate(15deg)',
              animation: 'float1 6s ease-in-out infinite',
            }}
          />
          <div
            style={{
              position: 'absolute',
              top: '70%',
              left: '5%',
              width: '40px',
              height: '40px',
              border: '1px solid rgba(56,189,248,0.25)',
              borderRadius: '50%',
              animation: 'float2 8s ease-in-out infinite',
            }}
          />
          <div
            style={{
              position: 'absolute',
              top: '20%',
              right: '10%',
              width: '50px',
              height: '50px',
              border: '1px solid rgba(20,184,166,0.2)',
              transform: 'rotate(45deg)',
              animation: 'float3 7s ease-in-out infinite',
            }}
          />
          <div
            style={{
              position: 'absolute',
              bottom: '20%',
              left: '15%',
              width: '30px',
              height: '30px',
              background: 'rgba(20,184,166,0.1)',
              borderRadius: '6px',
              transform: 'rotate(20deg)',
              animation: 'float1 9s ease-in-out infinite 2s',
            }}
          />
        </>
      )}

      {/* CSS keyframes injected via style tag */}
      <style>{`
        @keyframes blob1 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(40px, -30px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.95); }
        }
        @keyframes blob2 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(-30px, 30px) scale(1.05); }
          66% { transform: translate(20px, -20px) scale(1.1); }
        }
        @keyframes blob3 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(15px, -15px) scale(1.08); }
        }
        @keyframes float1 {
          0%, 100% { transform: translateY(0) rotate(15deg); }
          50% { transform: translateY(-16px) rotate(20deg); }
        }
        @keyframes float2 {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-12px); }
        }
        @keyframes float3 {
          0%, 100% { transform: translateY(0) rotate(45deg); }
          50% { transform: translateY(-14px) rotate(50deg); }
        }
        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateY(24px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulse-ring {
          0%   { box-shadow: 0 0 0 0 rgba(20,184,166,0.4); }
          70%  { box-shadow: 0 0 0 12px rgba(20,184,166,0); }
          100% { box-shadow: 0 0 0 0 rgba(20,184,166,0); }
        }
        .login-card {
          animation: fadeSlideIn 0.7s cubic-bezier(0.16,1,0.3,1) both;
        }
        .login-input {
          background: rgba(255,255,255,0.07) !important;
          border: 1px solid rgba(255,255,255,0.12) !important;
          color: #f1f5f9 !important;
          border-radius: 10px !important;
          padding: 10px 14px !important;
          font-size: 14px !important;
          outline: none !important;
          transition: border-color 0.2s, background 0.2s, box-shadow 0.2s !important;
          width: 100% !important;
          box-sizing: border-box !important;
        }
        .login-input::placeholder { color: rgba(148,163,184,0.7) !important; }
        .login-input:focus {
          border-color: rgba(20,184,166,0.6) !important;
          background: rgba(20,184,166,0.08) !important;
          box-shadow: 0 0 0 3px rgba(20,184,166,0.15) !important;
        }
        .login-btn {
          width: 100%;
          padding: 11px;
          border-radius: 10px;
          border: none;
          cursor: pointer;
          font-size: 15px;
          font-weight: 600;
          letter-spacing: 0.3px;
          background: linear-gradient(135deg, #0d9488 0%, #0f766e 100%);
          color: #fff;
          transition: all 0.2s;
          box-shadow: 0 4px 20px rgba(13,148,136,0.4);
          animation: pulse-ring 2.5s ease-in-out infinite;
          position: relative;
          overflow: hidden;
        }
        .login-btn:hover:not(:disabled) {
          background: linear-gradient(135deg, #14b8a6 0%, #0d9488 100%);
          box-shadow: 0 6px 28px rgba(13,148,136,0.55);
          transform: translateY(-1px);
        }
        .login-btn:disabled {
          opacity: 0.7;
          cursor: not-allowed;
          transform: none;
        }
        .demo-table td, .demo-table th {
          padding: 5px 10px;
          text-align: left;
          font-size: 12px;
        }
        .demo-table th { color: rgba(148,163,184,0.8); font-weight: 500; }
        .demo-table td { color: rgba(226,232,240,0.9); }
        .demo-table tr + tr td { border-top: 1px solid rgba(255,255,255,0.05); }
      `}</style>

      {/* Main card */}
      <div
        className="login-card"
        style={{
          position: 'relative',
          zIndex: 10,
          width: '100%',
          maxWidth: '420px',
          margin: '24px 16px',
          background: 'rgba(15,23,42,0.65)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '20px',
          padding: '36px 32px 28px',
          boxShadow:
            '0 8px 40px rgba(0,0,0,0.5), 0 0 0 1px rgba(20,184,166,0.08) inset',
        }}
      >
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '68px',
              height: '68px',
              borderRadius: '18px',
              background: 'linear-gradient(135deg, #0d9488 0%, #0f766e 100%)',
              boxShadow: '0 8px 24px rgba(13,148,136,0.45)',
              marginBottom: '14px',
            }}
          >
            <Package size={34} color="#fff" strokeWidth={1.8} />
          </div>
          <h1
            style={{
              fontSize: '20px',
              fontWeight: 700,
              color: '#f1f5f9',
              margin: '0 0 4px',
              letterSpacing: '-0.3px',
            }}
          >
            Sistem Manajemen Inventory
          </h1>
          <p
            style={{
              fontSize: '13px',
              color: 'rgba(20,184,166,0.9)',
              margin: 0,
              fontWeight: 500,
              letterSpacing: '0.5px',
            }}
          >
            PT CAHAYA INDOMIE
          </p>
        </div>

        {/* Divider */}
        <div
          style={{
            height: '1px',
            background:
              'linear-gradient(90deg, transparent, rgba(20,184,166,0.3), transparent)',
            margin: '0 0 24px',
          }}
        />

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Email field */}
          <div>
            <label
              htmlFor="email"
              style={{
                display: 'block',
                fontSize: '13px',
                fontWeight: 500,
                color: 'rgba(203,213,225,0.9)',
                marginBottom: '6px',
              }}
            >
              Email
            </label>
            <div style={{ position: 'relative' }}>
              <div
                style={{
                  position: 'absolute',
                  left: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'rgba(148,163,184,0.7)',
                  display: 'flex',
                  alignItems: 'center',
                  pointerEvents: 'none',
                }}
              >
                <Mail size={15} />
              </div>
              <input
                id="email"
                name="email"
                type="email"
                required
                autoComplete="email"
                placeholder="user@cahayaindomie.com"
                className="login-input"
                style={{ paddingLeft: '36px' }}
              />
            </div>
          </div>

          {/* Password field */}
          <div>
            <label
              htmlFor="password"
              style={{
                display: 'block',
                fontSize: '13px',
                fontWeight: 500,
                color: 'rgba(203,213,225,0.9)',
                marginBottom: '6px',
              }}
            >
              Kata Sandi
            </label>
            <div style={{ position: 'relative' }}>
              <div
                style={{
                  position: 'absolute',
                  left: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'rgba(148,163,184,0.7)',
                  display: 'flex',
                  alignItems: 'center',
                  pointerEvents: 'none',
                }}
              >
                <Lock size={15} />
              </div>
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                required
                autoComplete="current-password"
                placeholder="••••••••"
                className="login-input"
                style={{ paddingLeft: '36px', paddingRight: '40px' }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'rgba(148,163,184,0.7)',
                  display: 'flex',
                  alignItems: 'center',
                  padding: '2px',
                  borderRadius: '4px',
                  transition: 'color 0.15s',
                }}
                onMouseOver={e => (e.currentTarget.style.color = 'rgba(20,184,166,0.9)')}
                onMouseOut={e => (e.currentTarget.style.color = 'rgba(148,163,184,0.7)')}
              >
                {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          {/* Submit button */}
          <button type="submit" disabled={isPending} className="login-btn" style={{ marginTop: '4px' }}>
            {isPending ? (
              <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                <svg
                  style={{ animation: 'spin 1s linear infinite' }}
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                >
                  <path d="M21 12a9 9 0 11-6.219-8.56" />
                </svg>
                Masuk...
              </span>
            ) : (
              'Masuk ke Sistem'
            )}
          </button>
        </form>



        {/* Footer */}
        <p
          style={{
            textAlign: 'center',
            fontSize: '11.5px',
            color: 'rgba(100,116,139,0.8)',
            margin: '20px 0 0',
          }}
        >
          © {new Date().getFullYear()} PT CAHAYA INDOMIE. Hak cipta dilindungi.
        </p>
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}
