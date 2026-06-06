import type { NextAuthConfig } from 'next-auth'

// Secret default supaya aplikasi jalan tanpa perlu set AUTH_SECRET di .env.
// Tetap bisa di-override lewat env kalau mau pakai kunci sendiri.
const AUTH_SECRET = process.env.AUTH_SECRET ?? 'teklog-global-inventory-secret-2026-jwt-key-xf8s'

export const authConfig = {
  secret: AUTH_SECRET,
  // Percayai host apa pun (localhost maupun IP saat diakses dari HP/jaringan)
  trustHost: true,
  pages: {
    signIn: '/login',
  },
  session: { strategy: 'jwt' },
  providers: [],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = (user as Record<string, unknown>).role as string
        token.name = user.name
      }
      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string
        session.user.role = token.role as string
        session.user.name = token.name as string
      }
      return session
    },
  },
} satisfies NextAuthConfig
