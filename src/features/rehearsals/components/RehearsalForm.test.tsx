import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { Mock } from 'vitest'

const { mockMutateAsync, mockUseCreateRehearsal, mockUseUpdateRehearsal, mockProduction } = vi.hoisted(() => {
  const mockMutateAsync = vi.fn().mockResolvedValue({})
  return {
    mockMutateAsync,
    mockProduction: { current: null as { default_rehearsal_block_length: number | null; default_rehearsal_break_length: number | null } | null },
    mockUseCreateRehearsal: vi.fn(() => ({ mutateAsync: mockMutateAsync, isPending: false })),
    mockUseUpdateRehearsal: vi.fn(() => ({ mutateAsync: mockMutateAsync, isPending: false })),
  }
})

vi.mock('../api/rehearsals', () => ({
  useCreateRehearsal: mockUseCreateRehearsal,
  useUpdateRehearsal: mockUseUpdateRehearsal,
}))

vi.mock('../../theaters/api/theaters', () => ({
  theaterSkeletonQueryOptions: (id: number) => ({ queryKey: ['theater', id, 'skeleton'] }),
}))

vi.mock('../../productions/api/productions', () => ({
  productionSkeletonQueryOptions: (id: number) => ({ queryKey: ['productions', id, 'skeleton'] }),
}))

vi.mock('@tanstack/react-query', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@tanstack/react-query')>()
  return {
    ...actual,
    useQuery: vi.fn(({ queryKey }: { queryKey: unknown[] }) =>
      ({ data: queryKey[0] === 'productions' ? mockProduction.current : null })),
  }
})

vi.mock('../../../components/ui', async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual,
    Button: ({ children, onClick, disabled, type }: any) => (
      <button onClick={onClick} disabled={disabled} type={type}>{children}</button>
    ),
  }
})

import { RehearsalForm } from './RehearsalForm'
import type { RehearsalWithDetails } from '../types/rehearsal'

const defaultProps = {
  productionId: 1,
  theaterId: 5,
  onSuccess: vi.fn(),
  onCancel: vi.fn(),
}

// Pin "now" early in the day so test datetime values (19:00+) are always after
// the form's default start_time/end_time regardless of the test runner's timezone.
const FAKE_NOW = new Date('2026-06-20T00:00:00Z')

beforeEach(() => {
  vi.useFakeTimers({ shouldAdvanceTime: true })
  vi.setSystemTime(FAKE_NOW)
  mockMutateAsync.mockClear()
  mockProduction.current = null
})

afterEach(() => {
  vi.useRealTimers()
})

function renderForm(props: Partial<typeof defaultProps> = {}) {
  return render(<RehearsalForm {...defaultProps} {...props} />)
}

describe('RehearsalForm — time validation', () => {
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
    await user.click(screen.getByRole('button', { name: /create rehearsal/i }))

    await waitFor(() => expect(mockMutateAsync).not.toHaveBeenCalled())
  })

  it('calls mutateAsync when times are valid', async () => {
    const user = userEvent.setup({ delay: null, advanceTimers: vi.advanceTimersByTime })
    const { container } = renderForm()
    const [startInput, endInput] = container.querySelectorAll<HTMLInputElement>('input[type="datetime-local"]')

    fireEvent.change(startInput, { target: { value: '2026-06-20T19:00' } })
    fireEvent.change(endInput, { target: { value: '2026-06-20T21:00' } })
    await user.click(screen.getByRole('button', { name: /create rehearsal/i }))

    await waitFor(() => expect(mockMutateAsync).toHaveBeenCalledOnce())
  })
})

describe('RehearsalForm — default block length', () => {
  function editStart(startInput: HTMLInputElement, value: string) {
    fireEvent.focus(startInput)
    fireEvent.change(startInput, { target: { value } })
    fireEvent.blur(startInput)
  }

  it('sets end time to start time plus the block length, without the break, when start time loses focus', () => {
    mockProduction.current = { default_rehearsal_block_length: 90, default_rehearsal_break_length: 10 }
    const { container } = renderForm()
    const [startInput, endInput] = container.querySelectorAll<HTMLInputElement>('input[type="datetime-local"]')

    editStart(startInput, '2026-06-20T19:00')

    expect(endInput.value).toBe('2026-06-20T20:30')
  })

  it('does not apply the block length until start time loses focus', () => {
    mockProduction.current = { default_rehearsal_block_length: 60, default_rehearsal_break_length: null }
    const { container } = renderForm()
    const [startInput, endInput] = container.querySelectorAll<HTMLInputElement>('input[type="datetime-local"]')

    fireEvent.change(endInput, { target: { value: '2026-06-20T23:00' } })
    fireEvent.focus(startInput)
    fireEvent.change(startInput, { target: { value: '2026-06-20T18:00' } })
    expect(endInput.value).toBe('2026-06-20T23:00')

    fireEvent.blur(startInput)
    expect(endInput.value).toBe('2026-06-20T19:00')
  })

  it('leaves end time alone when start time loses focus without changing', () => {
    mockProduction.current = { default_rehearsal_block_length: 60, default_rehearsal_break_length: null }
    const { container } = renderForm()
    const [startInput, endInput] = container.querySelectorAll<HTMLInputElement>('input[type="datetime-local"]')

    editStart(startInput, '2026-06-20T19:00')
    fireEvent.change(endInput, { target: { value: '2026-06-20T22:00' } })
    fireEvent.focus(startInput)
    fireEvent.blur(startInput)

    expect(endInput.value).toBe('2026-06-20T22:00')
  })

  it('applies the block length when editing an existing rehearsal', () => {
    mockProduction.current = { default_rehearsal_block_length: 120, default_rehearsal_break_length: 15 }
    const rehearsal = {
      id: 9, start_time: '2026-06-20T17:00:00Z', end_time: '2026-06-20T18:00:00Z',
      title: null, notes: null, space_id: null,
    } as unknown as RehearsalWithDetails
    const { container } = render(<RehearsalForm {...defaultProps} playId={1} rehearsal={rehearsal} />)
    const [startInput, endInput] = container.querySelectorAll<HTMLInputElement>('input[type="datetime-local"]')

    editStart(startInput, '2026-06-21T10:15')

    expect(endInput.value).toBe('2026-06-21T12:15')
  })

  it('leaves end time alone if the start time is cleared', () => {
    mockProduction.current = { default_rehearsal_block_length: 60, default_rehearsal_break_length: null }
    const { container } = renderForm()
    const [startInput, endInput] = container.querySelectorAll<HTMLInputElement>('input[type="datetime-local"]')

    editStart(startInput, '2026-06-20T19:00')
    editStart(startInput, '')

    expect(endInput.value).toBe('2026-06-20T20:00')
  })

  it('does nothing on blur when the production has no block length', () => {
    const { container } = renderForm()
    const [startInput, endInput] = container.querySelectorAll<HTMLInputElement>('input[type="datetime-local"]')

    fireEvent.change(endInput, { target: { value: '2026-06-20T23:00' } })
    editStart(startInput, '2026-06-20T19:00')

    expect(endInput.value).toBe('2026-06-20T23:00')
  })
})
