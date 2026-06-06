export interface AuthUser {
  id: number
  email: string
  first_name: string
  last_name: string
  role: string
  subscription_status: string
  is_superadmin: boolean
}

export interface AuthState {
  user: AuthUser | null
  token: string | null
  isAuthenticated: boolean
  logout: () => void
}
