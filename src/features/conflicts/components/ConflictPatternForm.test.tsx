import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { Mock } from 'vitest'

const { mockMutateAsync, mockUseBuildConflictSchedule } = vi.hoisted(() => {
  const mockMutateAsync = vi.fn().mockResolvedValue({})
  const mockUseBuildConflictSchedule = vi.fn(() => ({
    mutateAsync: mockMutateAsync,
    isPending: false,
  }))
  return { mockMutateAsync, mockUseBuildConflictSchedule }
})

vi.mock('../api/conflicts', () => ({
  useBuildConflictSchedule: mockUseBuildConflictSchedule,
}))

vi.mock('../../../utils/constants', () => ({
  USER_CONFLICT_REASONS: ['personal', 'work'],
  SPACE_CONFLICT_REASONS: ['maintenance', 'other'],
  DAYS_OF_WEEK: ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'],
}))

vi.mock('../../../utils/stringUtils', () => ({
  firstLetterUpcase: (s: string) => s.charAt(0).toUpperCase() + s.slice(1),
}))

vi.mock('../../../components/ui', () => ({
  Button: ({ children, onClick, disabled, type }: any) => (
    <button onClick={onClick} disabled={disabled} type={type}>{children}</button>
  ),
  Card: ({ children, className }: any) => <div className={className}>{children}</div>,
}))

import { ConflictPatternForm } from './ConflictPatternForm'

// Returns the browser's UTC offset in "+HH:MM" / "-HH:MM" format,
// exactly as the component computes it.
function expectedTzOffset(): string {
  const offset = new Date().getTimezoneOffset()
  const sign = offset <= 0 ? '+' : '-'
  const abs = Math.abs(offset)
  return `${sign}${String(Math.floor(abs / 60)).padStart(2, '0')}:${String(abs % 60).padStart(2, '0')}`
}

const defaultProps = {
  userId: 7,
  invalidateKey: ['conflicts', { userId: 7 }] as unknown[],
  onSuccess: vi.fn(),
  onCancel: vi.fn(),
}

async function fillAndSubmitForm(
  startTime = '19:00',
  endTime = '21:00',
  startDate = '2026-08-01',
  endDate = '2026-12-31',
) {
  const user = userEvent.setup()
  const { container } = render(<ConflictPatternForm {...defaultProps} />)

  // Labels in this form don't use `for`, so query inputs by type and position
  const [startDateInput, endDateInput] = container.querySelectorAll('input[type="date"]')
  const [startTimeInput, endTimeInput] = container.querySelectorAll('input[type="time"]')

  fireEvent.change(startDateInput, { target: { value: startDate } })
  fireEvent.change(endDateInput, { target: { value: endDate } })
  fireEvent.change(startTimeInput, { target: { value: startTime } })
  fireEvent.change(endTimeInput, { target: { value: endTime } })

  // Pick one day of week and a category
  await user.click(screen.getByRole('checkbox', { name: /monday/i }))
  await user.click(screen.getByRole('radio', { name: /personal/i }))

  await user.click(screen.getByRole('button', { name: /save pattern/i }))
}

describe('ConflictPatternForm', () => {
  beforeEach(() => {
    mockMutateAsync.mockClear()
    mockUseBuildConflictSchedule.mockClear()
  })

  it('sends start_time and end_time as plain HH:MM and utc_offset separately', async () => {
    await fillAndSubmitForm('19:00', '21:00')

    expect(mockMutateAsync).toHaveBeenCalledOnce()
    const payload = (mockMutateAsync as Mock).mock.calls[0][0]
    const tz = expectedTzOffset()
    expect(payload.start_time).toBe('19:00')
    expect(payload.end_time).toBe('21:00')
    expect(payload.utc_offset).toBe(tz)
  })

  it('utc_offset is a valid UTC-offset string', async () => {
    await fillAndSubmitForm('10:30', '12:00')

    const payload = (mockMutateAsync as Mock).mock.calls[0][0]
    // Must match ±HH:MM
    expect(payload.utc_offset).toMatch(/^[+-]\d{2}:\d{2}$/)
    // Times must be plain HH:MM with no suffix
    expect(payload.start_time).toBe('10:30')
    expect(payload.end_time).toBe('12:00')
  })

  it('sends raw date strings and array days_of_week unchanged', async () => {
    await fillAndSubmitForm('19:00', '21:00', '2026-08-01', '2026-12-31')

    const payload = (mockMutateAsync as Mock).mock.calls[0][0]
    expect(payload.start_date).toBe('2026-08-01')
    expect(payload.end_date).toBe('2026-12-31')
    expect(payload.days_of_week).toContain('monday')
  })
})
