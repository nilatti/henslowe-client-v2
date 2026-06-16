import { useState } from 'react'
import { Link } from '@tanstack/react-router'
import { LoginButton } from '../../auth/components/LoginButton'

const activeClass = 'text-blue-600 font-medium'
const linkClass = 'text-gray-700 hover:text-gray-900 text-sm transition-colors'

export function PublicNavigation() {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <header className="fixed top-0 left-0 right-0 z-10 bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 flex items-center justify-between h-16">
        <Link
          to="/free"
          className="font-semibold text-gray-900 text-base shrink-0"
          activeProps={{ className: activeClass }}
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
        <nav className="hidden lg:flex items-center gap-4">
          <NavLinks />
        </nav>
      </div>

      {/* Mobile nav */}
      {menuOpen && (
        <nav className="lg:hidden border-t border-gray-100 bg-white px-4 pb-4 flex flex-col gap-3">
          <NavLinks />
        </nav>
      )}
    </header>
  )
}

function NavLinks() {
  return (
    <>
      <Link to="/free" className={linkClass} activeProps={{ className: activeClass }}>
        Home
      </Link>
      <Link to="/free/casting" className={linkClass} activeProps={{ className: activeClass }}>
        Cast
      </Link>
      <Link to="/free/cut" className={linkClass} activeProps={{ className: activeClass }}>
        Cut
      </Link>
      <Link to="/free/word-cloud" className={linkClass} activeProps={{ className: activeClass }}>
        Word clouds
      </Link>
      <Link to="/free/doubling" className={linkClass} activeProps={{ className: activeClass }}>
        Doubling chart
      </Link>
      <Link to="/free/part-scripts" className={linkClass} activeProps={{ className: activeClass }}>
        Part scripts
      </Link>
      <Link to="/auditions" className={linkClass} activeProps={{ className: activeClass }}>
        Open auditions
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
      <Link to={'/subscriptions' as never} className={linkClass} activeProps={{ className: activeClass }}>
        Subscribe
      </Link>
      <LoginButton />
    </>
  )
}
