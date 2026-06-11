import { useState } from 'react'
import { Link } from '@tanstack/react-router'
import { useAuth } from '../../../hooks/useAuth'
import { getSuperAdminRole } from '../../../utils/authorizationUtils'
import { buildUserName } from '../../../utils/actorUtils'
import { LogoutButton } from '../../auth/components/LogoutButton'

const activeClass = 'text-blue-600 font-medium text-sm'
const linkClass = 'text-gray-700 hover:text-gray-900 text-sm transition-colors'

export function FullAccessNavigation() {
  const [menuOpen, setMenuOpen] = useState(false)
  const { user } = useAuth()
  const superAdmin = user ? getSuperAdminRole(user) : false
  const userName = user ? buildUserName(user) : ''

  return (
    <header className="fixed top-0 left-0 right-0 z-10 bg-white border-b border-gray-200 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 flex items-center justify-between h-16">
        <Link
          to="/"
          className="font-semibold text-gray-900 text-base"
          activeProps={{ className: 'font-semibold text-blue-600 text-base' }}
        >
          Henslowe's Cloud
        </Link>

        {/* Hamburger (mobile only) */}
        <button
          className="lg:hidden p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100"
          onClick={() => setMenuOpen((o) => !o)}
          aria-label="Toggle navigation"
          aria-expanded={menuOpen}
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            {menuOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>

        {/* Desktop nav */}
        <nav className="hidden lg:flex items-center gap-3 flex-nowrap">
          <NavLinks superAdmin={superAdmin} userName={userName} />
        </nav>
      </div>

      {/* Mobile nav */}
      {menuOpen && (
        <nav
          className="lg:hidden border-t border-gray-100 bg-white px-4 pb-4 flex flex-col gap-3"
          onClick={() => setMenuOpen(false)}
        >
          <NavLinks superAdmin={superAdmin} userName={userName} />
        </nav>
      )}
    </header>
  )
}

function NavLinks({ superAdmin, userName }: { superAdmin: boolean; userName: string }) {
  return (
    <>
      <Link to="/" className={linkClass} activeProps={{ className: activeClass }}>
        Dashboard
      </Link>
      <Link to="/help" className={linkClass} activeProps={{ className: activeClass }}>
        Help
      </Link>
      <Link to="/faq" className={linkClass} activeProps={{ className: activeClass }}>
        FAQ
      </Link>
      <Link to="/getting-started" className={linkClass} activeProps={{ className: activeClass }}>
        Getting started
      </Link>
      <Link to="/productions" className={linkClass} activeProps={{ className: activeClass }}>
        Productions
      </Link>
      <Link to="/theaters" className={linkClass} activeProps={{ className: activeClass }}>
        Theaters
      </Link>
      <Link to="/spaces" className={linkClass} activeProps={{ className: activeClass }}>
        Spaces
      </Link>
      <Link to="/users" className={linkClass} activeProps={{ className: activeClass }}>
        Users
      </Link>
      {superAdmin && (
        <>
          <Link to="/authors" className={linkClass} activeProps={{ className: activeClass }}>
            Authors
          </Link>
          <Link to="/plays" className={linkClass} activeProps={{ className: activeClass }}>
            Plays
          </Link>
          <Link to="/specializations" className={linkClass} activeProps={{ className: activeClass }}>
            Specializations
          </Link>
          <Link to="/phases" className={linkClass} activeProps={{ className: activeClass }}>
            Phases
          </Link>
        </>
      )}
      <Link to="/account" className={linkClass} activeProps={{ className: activeClass }}>
        Your Account
      </Link>
      <span className="text-sm text-gray-600">Hi, {userName}</span>
      <LogoutButton />
    </>
  )
}
