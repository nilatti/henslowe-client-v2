import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { Mock } from 'vitest'

const { mockMutateAsync, mockUseCreateConflict, mockUseUpdateConflict } = vi.hoisted(() => {
  const mockMutateAsync = vi.fn().mockResolvedValue({})
  return {
    mockMutateAsync,
    mockUseCreateConflict: vi.fn(() => ({ mutateAsync: mockMutateAsync, isPending: false })),
    mockUseUpdateConflict: vi.fn(() => ({ mutateAsync: mockMutateAsync, isPending: false })),
  }
})

vi.mock('../api/conflicts', () => ({
  useCreateConflict: mockUseCreateConflict,
  useUpdateConflict: mockUseUpdateConflict,
}))

vi.mock('../../../utils/constants', () => ({
  USER_CONFLICT_REASONS: ['personal', 'work'],
  SPACE_CONFLICT_REASONS: ['maintenance', 'other'],
}))

vi.mock('../../../utils/stringUtils', () => ({
  firstLetterUpcase: (s: string) => s.charAt(0).toUpperCase() + s.slice(1),
}))

vi.mock('../../../components/ui', () => ({
  Button: ({ children, onClick, disabled, type }: any) => (
    <button onClick={onClick} disabled={disabled} type={type}>{children}</button>
  ),
}))

import { ConflictForm } from './ConflictForm'

const defaultProps = {
  userId: 7,
  invalidateKey: ['conflicts', { userId: 7 }] as unknown[],
  onSuccess: vi.fn(),
  onCancel: vi.fn(),
}

// Pin "now" early in the day so test datetime values (19:00+) are always after
// the form's default start/end regardless of the test runner's timezone.
const FAKE_NOW = new Date('2026-06-20T00:00:00Z')

beforeEach(() => {
  vi.useFakeTimers({ shouldAdvanceTime: true })
  vi.setSystemTime(FAKE_NOW)
  mockMutateAsync.mockClear()
})

afterEach(() => {
  vi.useRealTimers()
})

function renderForm(props: Partial<typeof defaultProps> = {}) {
  return render(<ConflictForm {...defaultProps} {...props} />)
}

describe('ConflictForm — time validation', () => {
  it('auto-bumps end time to match start time when start time moves later than end time', () => {
    const { container } = renderForm()
    const [startInput, endInput] = container.querySelectorAll<HTMLInputElement>('input[type="datetime-local"]')

    fireEvent.change(startInput, { target: { value: '2026-06-20T19:00' } })
    fireEvent.change(endInput, { target: { value: '2026-06-20T21:00' } })
    fireEvent.change(startInput, { target: { value: '2026-06-20T22:00' } })

    expect(endInput.value).toBe('2026-06-20T22:00')
  })

  it('does not bump end time when start time moves earlier than end time', () => {
    const { container } = renderForm()
    const [startInput, endInput] = container.querySelectorAll<HTMLInputElement>('input[type="datetime-local"]')

    fireEvent.change(startInput, { target: { value: '2026-06-20T19:00' } })
    fireEvent.change(endInput, { target: { value: '2026-06-20T21:00' } })
    fireEvent.change(startInput, { target: { value: '2026-06-20T18:00' } })

    expect(endInput.value).toBe('2026-06-20T21:00')
  })

  it('shows an error when end time is manually set before start time', async () => {
    const { container } = renderForm()
    const [startInput, endInput] = container.querySelectorAll<HTMLInputElement>('input[type="datetime-local"]')

    fireEvent.change(startInput, { target: { value: '2026-06-20T19:00' } })
    fireEvent.change(endInput, { target: { value: '2026-06-20T18:00' } })

    expect(await screen.findByText(/end time must be after start time/i)).toBeInTheDocument()
  })

  it('does not call mutateAsync when end time is before start time', async () => {
    const user = userEvent.setup({ delay: null, advanceTimers: vi.advanceTimersByTime })
    const { container } = renderForm()
    const [startInput, endInput] = container.querySelectorAll<HTMLInputElement>('input[type="datetime-local"]')

    fireEvent.change(startInput, { target: { value: '2026-06-20T19:00' } })
    fireEvent.change(endInput, { target: { value: '2026-06-20T18:00' } })
    await user.click(screen.getByRole('button', { name: /add conflict/i }))

    await waitFor(() => expect(mockMutateAsync).not.toHaveBeenCalled())
  })

  it('calls mutateAsync when times are valid', async () => {
    const user = userEvent.setup({ delay: null, advanceTimers: vi.advanceTimersByTime })
    const { container } = renderForm()
    const [startInput, endInput] = container.querySelectorAll<HTMLInputElement>('input[type="datetime-local"]')

    fireEvent.change(startInput, { target: { value: '2026-06-20T19:00' } })
    fireEvent.change(endInput, { target: { value: '2026-06-20T21:00' } })
    await user.click(screen.getByRole('radio', { name: /personal/i }))
    await user.click(screen.getByRole('button', { name: /add conflict/i }))

    await waitFor(() => expect(mockMutateAsync).toHaveBeenCalledOnce())
  })
})
