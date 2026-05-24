'use server'

import { signIn } from '@/lib/auth'
import { AuthError } from 'next-auth'

export async function login(formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  try {
    await signIn('credentials', { email, password, redirectTo: '/dashboard' })
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: 'Email atau kata sandi salah' }
    }
    // Re-throw redirect errors and other non-auth errors
    throw error
  }
}
