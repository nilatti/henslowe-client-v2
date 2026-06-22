import { describe, it, expect, vi } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useSubscription } from './useSubscription'

const mockUseAuth = vi.fn()
vi.mock('./useAuth', () => ({ useAuth: () => mockUseAuth() }))

describe('useSubscription', () => {
  it('isActive is true when subscription_status is active', () => {
    mockUseAuth.mockReturnValue({ user: { subscription_status: 'active' } })
    const { result } = renderHook(() => useSubscription())
    expect(result.current.isActive).toBe(true)
    expect(result.current.isFree).toBe(false)
  })

  it('isActive is false when subscription_status is never subscribed', () => {
    mockUseAuth.mockReturnValue({ user: { subscription_status: 'never subscribed' } })
    const { result } = renderHook(() => useSubscription())
    expect(result.current.isActive).toBe(false)
    expect(result.current.isFree).toBe(true)
  })

  it('isActive is false when subscription_status is canceled', () => {
    mockUseAuth.mockReturnValue({ user: { subscription_status: 'canceled' } })
    const { result } = renderHook(() => useSubscription())
    expect(result.current.isActive).toBe(false)
  })

  it('isActive is false when user is null (not logged in)', () => {
    mockUseAuth.mockReturnValue({ user: null })
    const { result } = renderHook(() => useSubscription())
    expect(result.current.isActive).toBe(false)
    expect(result.current.isFree).toBe(true)
  })
})
