import { useEffect } from 'react'
import { useNavigate } from '@tanstack/react-router'
import type { AuthUser } from '../types/auth'

export function AuthCallbackPage() {
  const navigate = useNavigate()

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const token = params.get('token')
    const error = params.get('error')

    if (error || !token) {
      navigate({ to: '/' })
      return
    }

    const role = params.get('role') ?? 'regular'
    const user: AuthUser = {
      id: Number(params.get('id')),
      email: params.get('email') ?? '',
      first_name: params.get('first_name') ?? '',
      last_name: params.get('last_name') ?? '',
      role,
      subscription_status: params.get('subscription_status') ?? 'never subscribed',
      is_superadmin: role === 'superadmin',
    }

    if (!user.id || !user.email) {
      navigate({ to: '/' })
      return
    }

    localStorage.setItem('auth_token', token)
    localStorage.setItem('auth_user', JSON.stringify(user))

    const redirectTo = sessionStorage.getItem('redirect_after_login') ?? '/'
    sessionStorage.removeItem('redirect_after_login')

    // Full reload so AuthProvider re-initializes from the freshly stored token.
    // Client-side navigate() won't work here because the storage event only
    // fires cross-tab, so AuthProvider's in-memory state is still null.
    window.location.href = redirectTo
  }, [navigate])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-gray-500 text-sm">Signing you in...</p>
      </div>
    </div>
  )
}
