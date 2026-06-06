import { Outlet } from '@tanstack/react-router'
import type { ReactNode } from 'react'
import { FullAccessNavigation } from './FullAccessNavigation'
import { Footer } from '../../free/components/Footer'
import { AppErrorBoundary } from '../../../components/AppErrorBoundary'

export function FullAccessShell({ children }: { children?: ReactNode } = {}) {
  return (
    <div className="min-h-screen flex flex-col">
      <FullAccessNavigation />
      {/* pt-16 clears the fixed navbar */}
      <div className="pt-16 flex-1 flex flex-col">
        <main className="flex-1 p-6">
          <AppErrorBoundary>
            {children ?? <Outlet />}
          </AppErrorBoundary>
        </main>
      </div>
      <Footer />
    </div>
  )
}
