import { useAuth } from '../../../hooks/useAuth'

export function LogoutButton() {
  const auth = useAuth()
  return (
    <button
      onClick={auth.logout}
      className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
    >
      Sign out
    </button>
  )
}
