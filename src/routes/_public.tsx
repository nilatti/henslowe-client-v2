import { createFileRoute, Outlet } from '@tanstack/react-router'
import { PublicNavigation } from '../features/shell/components/PublicNavigation'
import { Footer } from '../features/free/components/Footer'

export const Route = createFileRoute('/_public')({
  component: PublicLayout,
})

function PublicLayout() {
  return (
    <div className="min-h-screen flex flex-col">
      <PublicNavigation />
      <div className="pt-16 flex-1 flex flex-col">
        <main className="flex-1 p-6">
          <Outlet />
        </main>
      </div>
      <Footer />
    </div>
  )
}
