import { useEffect, useRef } from 'react'
import { useNavigate } from '@tanstack/react-router'
import api from '../api/client'
import type { AuthUser } from '../types/auth'

export function AuthCallbackPage() {
  const navigate = useNavigate()
  const handled = useRef(false)

  useEffect(() => {
    if (handled.current) return
    handled.current = true

    const params = new URLSearchParams(window.location.search)
    const error = params.get('error')

    if (error) {
      navigate({ to: '/' })
      return
    }

    // Cookie was set by the Rails OAuth callback. Fetch profile to confirm the
    // session is valid and populate the user stored in localStorage.
    api.get<AuthUser>('/api/v1/sessions/me')
      .then(({ data }) => {
        localStorage.setItem('auth_user', JSON.stringify({
          ...data,
          is_superadmin: data.role === 'superadmin',
        }))

        const redirectTo = localStorage.getItem('redirect_after_login') ?? '/'
        localStorage.removeItem('redirect_after_login')

        const safeRedirect = redirectTo.startsWith('/') && !redirectTo.startsWith('//')
          ? redirectTo
          : '/'

        // Full reload so AuthProvider re-initializes from the freshly stored user.
        window.location.href = safeRedirect
      })
      .catch(() => {
        navigate({ to: '/' })
      })
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
