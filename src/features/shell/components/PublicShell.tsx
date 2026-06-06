import { Outlet } from '@tanstack/react-router'
import type { ReactNode } from 'react'
import { Link } from '@tanstack/react-router'
import { PublicNavigation } from './PublicNavigation'
import { PaypalButton } from './PaypalButton'
import { Footer } from '../../free/components/Footer'

export function PublicShell({ children }: { children?: ReactNode } = {}) {
  return (
    <div className="min-h-screen flex flex-col">
      <PublicNavigation />
      {/* offset for fixed nav */}
      <div className="pt-16 flex-1 flex flex-col">
        <div className="bg-amber-50 border-b border-amber-200 px-4 py-2 text-sm text-amber-800 w-full">
          Because you don't have an account, any changes you make to play texts won't save beyond your current session.{' '}
          <Link to={'/subscriptions' as never} className="underline hover:text-amber-900">
            Learn more about signing up for an account.
          </Link>
        </div>
        <div className="bg-blue-50 border-b border-blue-200 px-4 py-2 flex items-center gap-4 w-full">
          <PaypalButton />
        </div>
        <main className="flex-1 p-6">
          {children ?? <Outlet />}
        </main>
      </div>
      <Footer />
    </div>
  )
}
