import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { Mock } from 'vitest'

const { mockUseSuspenseQuery } = vi.hoisted(() => ({
  mockUseSuspenseQuery: vi.fn(),
}))

vi.mock('@tanstack/react-query', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@tanstack/react-query')>()
  return { ...actual, useSuspenseQuery: mockUseSuspenseQuery }
})

const mockPublishMutateAsync = vi.fn()

vi.mock('../api/rehearsals', () => ({
  productionRehearsalsQueryOptions: (id: number) => ({ queryKey: ['rehearsals', { productionId: id }] }),
  productionUserConflictsQueryOptions: (id: number) => ({ queryKey: ['productions', id, 'user_conflicts'] }),
  productionSpaceConflictsQueryOptions: (id: number) => ({ queryKey: ['productions', id, 'space_conflicts'] }),
  usePublishRehearsalCalendar: () => ({ mutateAsync: mockPublishMutateAsync, isPending: false }),
}))

vi.mock('../../jobs/api/jobs', () => ({
  productionJobsQueryOptions: (id: number) => ({ queryKey: ['jobs', { productionId: id }] }),
}))

vi.mock('../../productions/api/productions', () => ({
  productionSkeletonQueryOptions: (id: number) => ({ queryKey: ['productions', id, 'skeleton'] }),
}))

vi.mock('../../../hooks/useUserRole', () => ({
  useUserRoleForProduction: vi.fn(),
  useIsSuperAdmin: vi.fn(),
}))

vi.mock('./RehearsalShow', () => ({ RehearsalShow: () => null }))
vi.mock('./RehearsalForm', () => ({
  RehearsalForm: ({ onCancel }: any) => (
    <div data-testid="rehearsal-form">
      <button onClick={onCancel}>Cancel form</button>
    </div>
  ),
}))
vi.mock('./RehearsalPatternCreator', () => ({
  RehearsalPatternCreator: ({ onClose }: any) => (
    <div data-testid="pattern-creator">
      <button onClick={onClose}>Close pattern</button>
    </div>
  ),
}))

vi.mock('../../../components/ui', () => ({
  Button: ({ children, onClick, disabled }: any) => (
    <button onClick={onClick} disabled={disabled}>{children}</button>
  ),
  Card: ({ children, className }: any) => <div className={className}>{children}</div>,
  ConfirmDialog: ({ message, onConfirm, onCancel }: any) => (
    <div data-testid="confirm-dialog">
      <p>{message}</p>
      <button onClick={onConfirm}>Confirm</button>
      <button onClick={onCancel}>Cancel</button>
    </div>
  ),
}))

import { RehearsalSchedule } from './RehearsalSchedule'
import { useUserRoleForProduction, useIsSuperAdmin } from '../../../hooks/useUserRole'

function setupQueries(rehearsals: any[] = []) {
  mockUseSuspenseQuery.mockImplementation(({ queryKey }: { queryKey: unknown[] }) => {
    if (queryKey[0] === 'rehearsals') return { data: rehearsals }
    if (queryKey[0] === 'jobs') return { data: [] }
    if (queryKey[0] === 'productions' && queryKey[2] === 'user_conflicts') return { data: [] }
    if (queryKey[0] === 'productions' && queryKey[2] === 'space_conflicts') return { data: [] }
    if (queryKey[0] === 'productions' && queryKey[2] === 'skeleton') return { data: { default_space_id: null } }
    throw new Error(`Unexpected queryKey: ${JSON.stringify(queryKey)}`)
  })
}

function renderSchedule(opts: { isAdmin?: boolean; rehearsals?: any[] } = {}) {
  const { isAdmin = false, rehearsals = [] } = opts
  setupQueries(rehearsals)
  ;(useUserRoleForProduction as Mock).mockReturnValue(isAdmin ? 'admin' : 'member')
  ;(useIsSuperAdmin as Mock).mockReturnValue(false)
  render(<RehearsalSchedule productionId={1} playId={10} theaterId={5} />)
}

beforeEach(() => {
  mockUseSuspenseQuery.mockReset()
  ;(useUserRoleForProduction as Mock).mockReset()
  ;(useIsSuperAdmin as Mock).mockReset()
  mockPublishMutateAsync.mockReset()
  mockPublishMutateAsync.mockResolvedValue(undefined)
})

describe('RehearsalSchedule — admin controls', () => {
  it('shows Add Rehearsal and Pattern generator buttons for admins', () => {
    renderSchedule({ isAdmin: true })
    expect(screen.getByRole('button', { name: /add rehearsal/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /pattern generator/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /publish rehearsal calendar/i })).toBeInTheDocument()
  })

  it('hides admin buttons for non-admins', () => {
    renderSchedule({ isAdmin: false })
    expect(screen.queryByRole('button', { name: /add rehearsal/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /pattern generator/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /publish rehearsal calendar/i })).not.toBeInTheDocument()
  })
})

describe('RehearsalSchedule — publish calendar', () => {
  it('opens a confirm dialog when Publish rehearsal calendar is clicked', async () => {
    const user = userEvent.setup()
    renderSchedule({ isAdmin: true })
    expect(screen.queryByTestId('confirm-dialog')).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /publish rehearsal calendar/i }))
    expect(screen.getByTestId('confirm-dialog')).toBeInTheDocument()
  })

  it('publishes and closes the dialog on confirm', async () => {
    const user = userEvent.setup()
    renderSchedule({ isAdmin: true })
    await user.click(screen.getByRole('button', { name: /publish rehearsal calendar/i }))
    await user.click(screen.getByRole('button', { name: /^confirm$/i }))
    expect(mockPublishMutateAsync).toHaveBeenCalledTimes(1)
    expect(screen.queryByTestId('confirm-dialog')).not.toBeInTheDocument()
  })

  it('closes the dialog without publishing on cancel', async () => {
    const user = userEvent.setup()
    renderSchedule({ isAdmin: true })
    await user.click(screen.getByRole('button', { name: /publish rehearsal calendar/i }))
    await user.click(screen.getByRole('button', { name: /^cancel$/i }))
    expect(mockPublishMutateAsync).not.toHaveBeenCalled()
    expect(screen.queryByTestId('confirm-dialog')).not.toBeInTheDocument()
  })
})

describe('RehearsalSchedule — form toggles', () => {
  it('toggles the rehearsal form when Add Rehearsal is clicked', async () => {
    const user = userEvent.setup()
    renderSchedule({ isAdmin: true })
    expect(screen.queryByTestId('rehearsal-form')).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /add rehearsal/i }))
    expect(screen.getByTestId('rehearsal-form')).toBeInTheDocument()
  })

  it('hides the rehearsal form when it calls onCancel', async () => {
    const user = userEvent.setup()
    renderSchedule({ isAdmin: true })
    await user.click(screen.getByRole('button', { name: /add rehearsal/i }))
    await user.click(screen.getByRole('button', { name: /cancel form/i }))
    expect(screen.queryByTestId('rehearsal-form')).not.toBeInTheDocument()
  })

  it('toggles the pattern creator when Pattern generator is clicked', async () => {
    const user = userEvent.setup()
    renderSchedule({ isAdmin: true })
    expect(screen.queryByTestId('pattern-creator')).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /pattern generator/i }))
    expect(screen.getByTestId('pattern-creator')).toBeInTheDocument()
  })

  it('hides the pattern creator when it calls onClose', async () => {
    const user = userEvent.setup()
    renderSchedule({ isAdmin: true })
    await user.click(screen.getByRole('button', { name: /pattern generator/i }))
    await user.click(screen.getByRole('button', { name: /close pattern/i }))
    expect(screen.queryByTestId('pattern-creator')).not.toBeInTheDocument()
  })
})

describe('RehearsalSchedule — empty state', () => {
  it('shows "No rehearsals this week" when there are none this week', () => {
    renderSchedule()
    expect(screen.getByText(/no rehearsals this week/i)).toBeInTheDocument()
  })
})

describe('RehearsalSchedule — removed elements', () => {
  it('does not render a "Rehearsal Schedule" heading', () => {
    renderSchedule()
    expect(screen.queryByRole('heading', { name: /rehearsal schedule/i })).not.toBeInTheDocument()
    expect(screen.queryByText('Rehearsal Schedule')).not.toBeInTheDocument()
  })

  it('does not render inline production or theater links', () => {
    renderSchedule()
    // The old component showed "productionTitle at theaterName" — neither should appear
    const links = screen.queryAllByRole('link')
    expect(links).toHaveLength(0)
  })
})

// Monday 2026-06-15 — used to pin `new Date()` so weekRehearsals filtering is deterministic
const FAKE_NOW = new Date('2026-06-15T10:00:00Z')

function makeWeekRehearsal(id: number): object {
  return {
    id,
    production_id: 1,
    space_id: null,
    space: null,
    start_time: '2026-06-15T19:00:00Z',
    end_time: '2026-06-15T22:00:00Z',
    title: null,
    notes: null,
    text_unit: null,
    acts: [],
    scenes: [],
    french_scenes: [],
    users: [],
    created_at: '',
    updated_at: '',
  }
}

describe('RehearsalSchedule — per-day add rehearsal', () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    vi.setSystemTime(FAKE_NOW)
  })

  afterEach(() => {
    vi.useRealTimers()
    mockUseSuspenseQuery.mockReset()
    ;(useUserRoleForProduction as Mock).mockReset()
    ;(useIsSuperAdmin as Mock).mockReset()
  })

  it('shows the per-day "+ Add rehearsal" button for admins when rehearsals exist this week', () => {
    renderSchedule({ isAdmin: true, rehearsals: [makeWeekRehearsal(99)] })
    expect(screen.getByRole('button', { name: /\+ add rehearsal/i })).toBeInTheDocument()
  })

  it('hides the per-day "+ Add rehearsal" button from non-admins', () => {
    renderSchedule({ isAdmin: false, rehearsals: [makeWeekRehearsal(99)] })
    expect(screen.queryByRole('button', { name: /\+ add rehearsal/i })).not.toBeInTheDocument()
  })

  it('shows a rehearsal form when the per-day "+ Add rehearsal" button is clicked', async () => {
    const user = userEvent.setup({ delay: null, advanceTimers: vi.advanceTimersByTime })
    renderSchedule({ isAdmin: true, rehearsals: [makeWeekRehearsal(99)] })
    expect(screen.queryByTestId('rehearsal-form')).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /\+ add rehearsal/i }))
    expect(screen.getByTestId('rehearsal-form')).toBeInTheDocument()
  })

  it('hides the per-day rehearsal form when Cancel is clicked', async () => {
    const user = userEvent.setup({ delay: null, advanceTimers: vi.advanceTimersByTime })
    renderSchedule({ isAdmin: true, rehearsals: [makeWeekRehearsal(99)] })
    await user.click(screen.getByRole('button', { name: /\+ add rehearsal/i }))
    expect(screen.getByTestId('rehearsal-form')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /cancel form/i }))
    expect(screen.queryByTestId('rehearsal-form')).not.toBeInTheDocument()
  })
})
