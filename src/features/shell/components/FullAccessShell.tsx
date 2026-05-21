import { Outlet } from '@tanstack/react-router'
import { FullAccessNavigation } from './FullAccessNavigation'
import { Footer } from '../../free/components/Footer'

export function FullAccessShell() {
  return (
    <div className="min-h-screen flex flex-col">
      <FullAccessNavigation />
      {/* pt-16 clears the fixed navbar */}
      <div className="pt-16 flex-1 flex flex-col">
        <main className="flex-1 p-6">
          <Outlet />
        </main>
      </div>
      <Footer />
    </div>
  )
}
