import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

const { mockUseSuspenseQuery, mockUseMutation, mockUseQueryClient } = vi.hoisted(() => ({
  mockUseSuspenseQuery: vi.fn(),
  mockUseMutation: vi.fn(),
  mockUseQueryClient: vi.fn(),
}))

vi.mock('@tanstack/react-query', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@tanstack/react-query')>()
  return {
    ...actual,
    useSuspenseQuery: mockUseSuspenseQuery,
    useMutation: mockUseMutation,
    useQueryClient: mockUseQueryClient,
  }
})

vi.mock('@tanstack/react-router', () => ({
  useNavigate: () => vi.fn(),
}))

vi.mock('./queries', () => ({
  phaseQueryOptions: (id: number) => ({ queryKey: ['phases', id] }),
  updatePhaseFn: vi.fn(),
  deletePhaseFn: vi.fn(),
}))

vi.mock('../../components/ui', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../components/ui')>()
  return {
    ...actual,
    Button: ({ children, onClick, type, variant }: any) => (
      <button type={type ?? 'button'} onClick={onClick} data-variant={variant}>
        {children}
      </button>
    ),
    ConfirmDialog: ({ message, onConfirm, onCancel, confirmLabel }: any) => (
      <div role="dialog">
        <p>{message}</p>
        <button onClick={onConfirm}>{confirmLabel}</button>
        <button onClick={onCancel}>Cancel</button>
      </div>
    ),
  }
})

import { PhaseDetailPage } from './PhaseDetailPage'

const mockMutate = vi.fn()
const mockMutateAsync = vi.fn()
const mockInvalidate = vi.fn()
const mockRemove = vi.fn()

function makePhase(overrides = {}) {
  return {
    id: 1,
    name: 'Rehearsals',
    position: 3,
    created_at: '',
    updated_at: '',
    ...overrides,
  }
}

function setup(phase = makePhase()) {
  mockUseSuspenseQuery.mockReturnValue({ data: phase })
  mockUseMutation.mockReturnValue({ mutate: mockMutate, mutateAsync: mockMutateAsync, isPending: false })
  mockUseQueryClient.mockReturnValue({ invalidateQueries: mockInvalidate, removeQueries: mockRemove })
  render(<PhaseDetailPage phaseId={phase.id} />)
}

beforeEach(() => {
  mockMutate.mockReset()
  mockMutateAsync.mockReset()
  mockInvalidate.mockReset()
  mockRemove.mockReset()
  mockUseSuspenseQuery.mockReset()
  mockUseMutation.mockReset()
  mockUseQueryClient.mockReset()
})

describe('PhaseDetailPage — display', () => {
  it('shows the phase name', () => {
    setup()
    expect(screen.getByText('Rehearsals')).toBeInTheDocument()
  })

  it('shows the position', () => {
    setup()
    expect(screen.getByText(/3/)).toBeInTheDocument()
  })

  it('shows "not set" when position is null', () => {
    setup(makePhase({ position: null }))
    expect(screen.getByText(/not set/i)).toBeInTheDocument()
  })

  it('shows a Delete button', () => {
    setup()
    expect(screen.getByRole('button', { name: /delete/i })).toBeInTheDocument()
  })
})

describe('PhaseDetailPage — editing name', () => {
  it('shows an input when the name heading is double-clicked', async () => {
    setup()
    fireEvent.dblClick(screen.getByText('Rehearsals'))
    expect(screen.getByRole('textbox')).toBeInTheDocument()
  })

  it('calls updateMutation with the new name on save', async () => {
    const user = userEvent.setup()
    setup()
    fireEvent.dblClick(screen.getByText('Rehearsals'))
    const input = screen.getByRole('textbox')
    await user.clear(input)
    await user.type(input, 'New Name')
    await user.click(screen.getByRole('button', { name: /^save$/i }))
    expect(mockMutate).toHaveBeenCalledWith(
      expect.objectContaining({ id: 1, name: 'New Name' })
    )
  })

  it('hides the input and shows the name again on cancel', async () => {
    const user = userEvent.setup()
    setup()
    fireEvent.dblClick(screen.getByText('Rehearsals'))
    await user.click(screen.getByRole('button', { name: /^cancel$/i }))
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument()
  })
})

describe('PhaseDetailPage — delete', () => {
  it('shows a confirm dialog when Delete is clicked', async () => {
    const user = userEvent.setup()
    setup()
    await user.click(screen.getByRole('button', { name: /delete/i }))
    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })

  it('calls delete mutation on confirm', async () => {
    const user = userEvent.setup()
    setup()
    await user.click(screen.getByRole('button', { name: /delete/i }))
    // Confirm button is inside the dialog
    const dialog = screen.getByRole('dialog')
    const confirmButton = within(dialog).getByRole('button', { name: /delete/i })
    await user.click(confirmButton)
    expect(mockMutate).toHaveBeenCalled()
  })

  it('dismisses confirm dialog on cancel', async () => {
    const user = userEvent.setup()
    setup()
    await user.click(screen.getByRole('button', { name: /delete/i }))
    await user.click(screen.getByRole('button', { name: /^cancel$/i }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })
})
