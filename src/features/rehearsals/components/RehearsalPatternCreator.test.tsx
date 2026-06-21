import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'

const { mockMutateAsync, mockUseBuildRehearsalSchedule } = vi.hoisted(() => {
  const mockMutateAsync = vi.fn().mockResolvedValue({})
  return {
    mockMutateAsync,
    mockUseBuildRehearsalSchedule: vi.fn(() => ({ mutateAsync: mockMutateAsync, isPending: false })),
  }
})

vi.mock('../api/rehearsals', () => ({
  useBuildRehearsalSchedule: mockUseBuildRehearsalSchedule,
}))

vi.mock('@tanstack/react-query', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@tanstack/react-query')>()
  return { ...actual, useQuery: vi.fn(() => ({ data: null })) }
})

vi.mock('../../theaters/api/theaters', () => ({
  theaterSkeletonQueryOptions: (id: number) => ({ queryKey: ['theater', id, 'skeleton'] }),
}))

vi.mock('../../../utils/constants', () => ({
  DAYS_OF_WEEK: ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'],
}))

vi.mock('../../../components/ui', () => ({
  Button: ({ children, onClick, disabled, type }: any) => (
    <button onClick={onClick} disabled={disabled} type={type}>{children}</button>
  ),
  Card: ({ children, className }: any) => <div className={className}>{children}</div>,
}))

vi.mock('./people/RehearsalCallSelector', () => ({ default: () => null }))

import { RehearsalPatternCreator } from './RehearsalPatternCreator'

const defaultProps = {
  productionId: 1,
  theaterId: 5,
  actors: [],
  productionStaff: [],
  onClose: vi.fn(),
}

function renderCreator(props: Partial<typeof defaultProps> = {}) {
  return render(<RehearsalPatternCreator {...defaultProps} {...props} />)
}

function fillRequiredNonTimFields(container: HTMLElement) {
  const [startDateInput, endDateInput] = container.querySelectorAll<HTMLInputElement>('input[type="date"]')
  fireEvent.change(startDateInput, { target: { value: '2026-08-01' } })
  fireEvent.change(endDateInput, { target: { value: '2026-12-31' } })
  fireEvent.click(screen.getByRole('checkbox', { name: /monday/i }))
}

describe('RehearsalPatternCreator', () => {
  beforeEach(() => {
    mockMutateAsync.mockClear()
  })

  it('auto-sets end time to match start time when end time is empty', () => {
    const { container } = renderCreator()
    const [startTimeInput, endTimeInput] = container.querySelectorAll<HTMLInputElement>('input[type="time"]')

    fireEvent.change(startTimeInput, { target: { value: '19:00' } })

    expect(endTimeInput.value).toBe('19:00')
  })

  it('auto-bumps end time when start time moves later than end time', () => {
    const { container } = renderCreator()
    const [startTimeInput, endTimeInput] = container.querySelectorAll<HTMLInputElement>('input[type="time"]')

    fireEvent.change(startTimeInput, { target: { value: '19:00' } })
    fireEvent.change(endTimeInput, { target: { value: '21:00' } })
    fireEvent.change(startTimeInput, { target: { value: '22:00' } })

    expect(endTimeInput.value).toBe('22:00')
  })

  it('does not bump end time when start time moves earlier than end time', () => {
    const { container } = renderCreator()
    const [startTimeInput, endTimeInput] = container.querySelectorAll<HTMLInputElement>('input[type="time"]')

    fireEvent.change(startTimeInput, { target: { value: '19:00' } })
    fireEvent.change(endTimeInput, { target: { value: '21:00' } })
    fireEvent.change(startTimeInput, { target: { value: '18:00' } })

    expect(endTimeInput.value).toBe('21:00')
  })

  it('shows an error when end time is manually set before start time', () => {
    const { container } = renderCreator()
    const [startTimeInput, endTimeInput] = container.querySelectorAll<HTMLInputElement>('input[type="time"]')

    fireEvent.change(startTimeInput, { target: { value: '19:00' } })
    fireEvent.change(endTimeInput, { target: { value: '18:00' } })

    expect(screen.getByText(/end time must be after start time/i)).toBeInTheDocument()
  })

  it('disables the submit button when end time is before start time', () => {
    const { container } = renderCreator()
    const [startTimeInput, endTimeInput] = container.querySelectorAll<HTMLInputElement>('input[type="time"]')

    fillRequiredNonTimFields(container)
    fireEvent.change(startTimeInput, { target: { value: '19:00' } })
    fireEvent.change(endTimeInput, { target: { value: '18:00' } })

    expect(screen.getByRole('button', { name: /generate rehearsals/i })).toBeDisabled()
  })
})
