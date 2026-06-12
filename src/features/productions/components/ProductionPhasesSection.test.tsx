import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

const { mockUseSuspenseQuery, mockUseMutation } = vi.hoisted(() => ({
  mockUseSuspenseQuery: vi.fn(),
  mockUseMutation: vi.fn(),
}))

vi.mock('@tanstack/react-query', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@tanstack/react-query')>()
  return {
    ...actual,
    useSuspenseQuery: mockUseSuspenseQuery,
    useMutation: mockUseMutation,
  }
})

vi.mock('../../phases/queries', () => ({
  phasesQueryOptions: () => ({ queryKey: ['phases'] }),
  useUpsertProductionPhases: () => ({ mutateAsync: mockMutateAsync, isPending: false }),
}))

vi.mock('../../../components/ui', () => ({
  Button: ({ children, onClick, disabled }: any) => (
    <button onClick={onClick} disabled={disabled}>{children}</button>
  ),
}))

const mockMutateAsync = vi.fn()

const phases = [
  { id: 1, name: 'Preproduction', position: 1, created_at: '', updated_at: '' },
  { id: 2, name: 'Rehearsals', position: 2, created_at: '', updated_at: '' },
]

const productionPhases = [
  { id: 10, production_id: 5, phase_id: 1, start_date: '2026-01-01', end_date: '2026-02-01', phase: phases[0] },
]

import { ProductionPhasesSection } from './ProductionPhasesSection'

beforeEach(() => {
  mockMutateAsync.mockReset()
  mockUseSuspenseQuery.mockReturnValue({ data: phases })
  mockUseMutation.mockReturnValue({ mutateAsync: mockMutateAsync, isPending: false })
})

describe('ProductionPhasesSection — display', () => {
  it('renders phase names for admins', () => {
    render(<ProductionPhasesSection productionId={5} productionPhases={productionPhases} isAdmin={true} />)
    expect(screen.getByText('Preproduction')).toBeInTheDocument()
    expect(screen.getByText('Rehearsals')).toBeInTheDocument()
  })

  it('shows formatted date range for phases that have dates', () => {
    render(<ProductionPhasesSection productionId={5} productionPhases={productionPhases} isAdmin={false} />)
    expect(screen.getByText(/Jan 1, 2026/)).toBeInTheDocument()
    expect(screen.getByText(/Feb 1, 2026/)).toBeInTheDocument()
  })

  it('returns null when phases list is empty', () => {
    mockUseSuspenseQuery.mockReturnValue({ data: [] })
    const { container } = render(
      <ProductionPhasesSection productionId={5} productionPhases={[]} isAdmin={true} />
    )
    expect(container.firstChild).toBeNull()
  })

  it('shows Edit phases button for admins', () => {
    render(<ProductionPhasesSection productionId={5} productionPhases={productionPhases} isAdmin={true} />)
    expect(screen.getByRole('button', { name: /edit phases/i })).toBeInTheDocument()
  })

  it('hides Edit phases button for non-admins', () => {
    render(<ProductionPhasesSection productionId={5} productionPhases={productionPhases} isAdmin={false} />)
    expect(screen.queryByRole('button', { name: /edit phases/i })).not.toBeInTheDocument()
  })

  it('hides unset phases from non-admins', () => {
    render(<ProductionPhasesSection productionId={5} productionPhases={productionPhases} isAdmin={false} />)
    // Rehearsals (phase id 2) has no productionPhase, should not be shown to non-admin
    expect(screen.queryByText('Rehearsals')).not.toBeInTheDocument()
  })
})

describe('ProductionPhasesSection — editing', () => {
  it('shows date inputs when Edit phases is clicked', async () => {
    const user = userEvent.setup()
    render(<ProductionPhasesSection productionId={5} productionPhases={productionPhases} isAdmin={true} />)
    await user.click(screen.getByRole('button', { name: /edit phases/i }))
    const dateInputs = screen.getAllByDisplayValue(/./)
    expect(dateInputs.length).toBeGreaterThan(0)
  })

  it('calls upsert with phase dates on Save', async () => {
    mockMutateAsync.mockResolvedValue({})
    const user = userEvent.setup()
    render(<ProductionPhasesSection productionId={5} productionPhases={productionPhases} isAdmin={true} />)
    await user.click(screen.getByRole('button', { name: /edit phases/i }))
    await user.click(screen.getByRole('button', { name: /^save$/i }))
    expect(mockMutateAsync).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({ phase_id: 1 }),
      ])
    )
  })

  it('cancels editing without saving', async () => {
    const user = userEvent.setup()
    render(<ProductionPhasesSection productionId={5} productionPhases={productionPhases} isAdmin={true} />)
    await user.click(screen.getByRole('button', { name: /edit phases/i }))
    await user.click(screen.getByRole('button', { name: /^cancel$/i }))
    expect(mockMutateAsync).not.toHaveBeenCalled()
    expect(screen.getByRole('button', { name: /edit phases/i })).toBeInTheDocument()
  })
})
