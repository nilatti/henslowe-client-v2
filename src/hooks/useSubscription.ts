import { useAuth } from './useAuth'

export function useSubscription() {
  const { user } = useAuth()
  const isActive = user?.subscription_status === 'active'
  const isFree = !isActive
  return { isActive, isFree }
}
