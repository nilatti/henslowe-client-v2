import type { ReactNode } from 'react'
import { useAuth } from '../../../hooks/useAuth'
import { LoginButton } from './LoginButton'

export function PleaseSignIn({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-4">
        <p className="text-gray-600 text-lg">You aren't signed in!</p>
        <LoginButton />
      </div>
    )
  }
  return <>{children}</>
}
