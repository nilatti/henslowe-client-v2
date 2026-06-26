import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

const { mockUseSuspenseQuery, mockUseQuery, mockUpdatePaidOverride, mockCreateJob } = vi.hoisted(() => ({
  mockUseSuspenseQuery: vi.fn(),
  mockUseQuery: vi.fn(),
  mockUpdatePaidOverride: vi.fn().mockResolvedValue({}),
  mockCreateJob: vi.fn().mockResolvedValue({}),
}))

vi.mock('@tanstack/react-query', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@tanstack/react-query')>()
  return { ...actual, useSuspenseQuery: mockUseSuspenseQuery, useQuery: mockUseQuery }
})

vi.mock('@tanstack/react-router', () => ({
  Link: ({ children, to, className }: any) => (
    <a href={to} className={className}>{children}</a>
  ),
}))

vi.mock('../api/jobs', () => ({
  useCreateJob: () => ({ mutateAsync: mockCreateJob }),
  useUpdateJob: () => ({ mutateAsync: vi.fn() }),
  productionJobsQueryOptions: (id: number) => ({ queryKey: ['production-jobs', id] }),
}))

vi.mock('../../specializations/queries', () => ({
  specializationsQueryOptions: () => ({ queryKey: ['specializations'] }),
}))

vi.mock('../../users/api/users', () => ({
  usersQueryOptions: () => ({ queryKey: ['users'] }),
  useUpdatePaidOverride: () => ({ mutateAsync: mockUpdatePaidOverride, isPending: false }),
}))

vi.mock('../../productions/api/productions', () => ({
  productionSkeletonQueryOptions: (id: number) => ({ queryKey: ['productions', id, 'skeleton'] }),
}))

const { mockUseAuth } = vi.hoisted(() => ({ mockUseAuth: vi.fn() }))
vi.mock('../../../hooks/useAuth', () => ({ useAuth: mockUseAuth }))

// Renders user names so tests can assert which users are available in the list
vi.mock('./UserCombobox', () => ({
  UserCombobox: ({ onChange, users }: any) => (
    <div>
      {users.map((u: any) => (
        <span key={u.id} data-testid={`combobox-user-${u.id}`}>{u.first_name} {u.last_name}</span>
      ))}
      <button type="button" onClick={() => onChange(users[0]?.id ?? 0)}>select user</button>
    </div>
  ),
}))

vi.mock('../../../components/ui', async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual,
    Button: ({ children, type, onClick, disabled }: any) => (
      <button type={type ?? 'button'} onClick={onClick} disabled={disabled}>{children}</button>
    ),
  }
})

vi.mock('../../../utils/constants', () => ({
  AUDITIONER_SPECIALIZATION_ID: 99,
}))

import { JobForm } from './JobForm'

// ── shared fixtures ────────────────────────────────────────────────────────────

const phases = [
  { id: 10, name: 'Preproduction', position: 1 },
  { id: 20, name: 'Rehearsals', position: 2 },
]

const directorSpec = {
  id: 1,
  title: 'Director',
  default_start_phase_id: 10,
  default_end_phase_id: 20,
  default_start_phase: phases[0],
  default_end_phase: phases[1],
  production_admin: true,
  theater_admin: false,
  context: 'production' as const,
  description: null,
}

const stageMgrSpec = {
  id: 2,
  title: 'Stage Manager',
  default_start_phase_id: null,
  default_end_phase_id: null,
  default_start_phase: null,
  default_end_phase: null,
  production_admin: false,
  theater_admin: false,
  context: 'production' as const,
  description: null,
}

const specializations = [directorSpec, stageMgrSpec]

const productionSkeleton = {
  id: 5,
  production_phases: [
    { id: 100, production_id: 5, phase_id: 10, start_date: '2026-01-15', end_date: '2026-02-01', phase: phases[0] },
    { id: 101, production_id: 5, phase_id: 20, start_date: '2026-02-01', end_date: '2026-04-30', phase: phases[1] },
  ],
}

const paidUser    = { id: 1, email: 'alice@test.com', first_name: 'Alice', last_name: 'Smith',   fake: false, subscription_status: 'active' }
const unpaidUser  = { id: 2, email: 'bob@test.com',   first_name: 'Bob',   last_name: 'Jones',   fake: false, subscription_status: 'never subscribed' }
const fakeUser    = { id: 3, email: 'fake@fake.com',  first_name: 'Fake',  last_name: 'Actor',   fake: true,  subscription_status: undefined }
const overrideUser = { id: 4, email: 'cara@test.com', first_name: 'Cara',  last_name: 'Dean',    fake: false, subscription_status: 'canceled', paid_override: true }

function setupQueries(users = [paidUser, unpaidUser, fakeUser], overrides: { productionSkeleton?: any } = {}) {
  mockUseSuspenseQuery.mockImplementation(({ queryKey }: { queryKey: unknown[] }) => {
    if (queryKey[0] === 'specializations') return { data: specializations }
    if (queryKey[0] === 'users') return { data: users }
    throw new Error(`Unexpected useSuspenseQuery key: ${JSON.stringify(queryKey)}`)
  })
  mockUseQuery.mockImplementation(({ queryKey }: { queryKey: unknown[] }) => {
    if (String(queryKey[0]) === 'production-jobs') return { data: [] }
    if (queryKey[0] === 'productions') return { data: overrides.productionSkeleton ?? productionSkeleton }
    return { data: undefined }
  })
}

function setupAuth(overrides: { is_superadmin?: boolean; subscription_status?: string } = {}) {
  mockUseAuth.mockReturnValue({
    user: { id: 99, is_superadmin: overrides.is_superadmin ?? false, subscription_status: overrides.subscription_status ?? 'active' },
  })
}

beforeEach(() => {
  mockUseSuspenseQuery.mockReset()
  mockUseQuery.mockReset()
  mockUpdatePaidOverride.mockReset().mockResolvedValue({})
  mockCreateJob.mockReset().mockResolvedValue({})
  setupAuth()
})

// ── helper ─────────────────────────────────────────────────────────────────────

function getDateInputs(container: HTMLElement) {
  const inputs = container.querySelectorAll('input[type="date"]')
  return { startInput: inputs[0] as HTMLInputElement, endInput: inputs[1] as HTMLInputElement }
}

// ── phase date pre-population ──────────────────────────────────────────────────

describe('JobForm — phase date pre-population', () => {
  it('pre-fills start_date from default_start_phase when specializationId is provided', () => {
    setupQueries()
    const { container } = render(
      <JobForm productionId={5} theaterId={1} specializationId={1} invalidateKey={['jobs']} onSuccess={vi.fn()} onCancel={vi.fn()} />
    )
    expect(getDateInputs(container).startInput.value).toBe('2026-01-15')
  })

  it('pre-fills end_date from default_end_phase when specializationId is provided', () => {
    setupQueries()
    const { container } = render(
      <JobForm productionId={5} theaterId={1} specializationId={1} invalidateKey={['jobs']} onSuccess={vi.fn()} onCancel={vi.fn()} />
    )
    expect(getDateInputs(container).endInput.value).toBe('2026-04-30')
  })

  it('leaves end_date empty when specialization has no default phases', () => {
    setupQueries()
    const { container } = render(
      <JobForm productionId={5} theaterId={1} specializationId={2} invalidateKey={['jobs']} onSuccess={vi.fn()} onCancel={vi.fn()} />
    )
    expect(getDateInputs(container).endInput.value).toBe('')
  })

  it('updates dates when specialization is changed via the select', async () => {
    setupQueries()
    const user = userEvent.setup()
    render(
      <JobForm productionId={5} theaterId={1} invalidateKey={['jobs']} onSuccess={vi.fn()} onCancel={vi.fn()} />
    )
    const select = screen.getByRole('combobox')
    await user.selectOptions(select, '1')
    expect(screen.getAllByDisplayValue('2026-01-15').length).toBeGreaterThan(0)
  })

  it('does not override dates when editing an existing job', () => {
    setupQueries()
    const existingJob = {
      id: 42, user_id: 1, specialization_id: 1,
      start_date: '2025-06-01', end_date: '2025-12-01',
      production_id: 5, theater_id: 1,
      created_at: '', updated_at: '',
      specialization: null, theater: null, production: null,
      user: null, character: null, character_group: null, audition_submission: null,
    } as any
    const { container } = render(
      <JobForm job={existingJob} productionId={5} theaterId={1} invalidateKey={['jobs']} onSuccess={vi.fn()} onCancel={vi.fn()} />
    )
    const { startInput, endInput } = getDateInputs(container)
    expect(startInput.value).toBe('2025-06-01')
    expect(endInput.value).toBe('2025-12-01')
  })

  it('leaves end_date empty when production has no phases configured', () => {
    setupQueries([paidUser, unpaidUser, fakeUser], { productionSkeleton: { id: 5, production_phases: [] } })
    const { container } = render(
      <JobForm productionId={5} theaterId={1} specializationId={1} invalidateKey={['jobs']} onSuccess={vi.fn()} onCancel={vi.fn()} />
    )
    expect(getDateInputs(container).endInput.value).toBe('')
  })
})

// ── dream theater ──────────────────────────────────────────────────────────────

describe('JobForm — dream theater mode', () => {
  it('shows an info banner when isDreamTheater is true', () => {
    setupQueries()
    render(
      <JobForm productionId={5} theaterId={1} isDreamTheater invalidateKey={['jobs']} onSuccess={vi.fn()} onCancel={vi.fn()} />
    )
    expect(screen.getByText(/dream theater/i)).toBeInTheDocument()
    expect(screen.getByText(/placeholder actors/i)).toBeInTheDocument()
  })

  it('shows only fake users in the combobox when isDreamTheater is true', () => {
    setupQueries()
    render(
      <JobForm productionId={5} theaterId={1} isDreamTheater invalidateKey={['jobs']} onSuccess={vi.fn()} onCancel={vi.fn()} />
    )
    expect(screen.getByTestId('combobox-user-3')).toBeInTheDocument()  // fakeUser
    expect(screen.queryByTestId('combobox-user-1')).not.toBeInTheDocument()
    expect(screen.queryByTestId('combobox-user-2')).not.toBeInTheDocument()
  })

  it('shows all non-fake users when isDreamTheater is false', () => {
    setupQueries()
    render(
      <JobForm productionId={5} theaterId={1} specializationId={2} invalidateKey={['jobs']} onSuccess={vi.fn()} onCancel={vi.fn()} />
    )
    expect(screen.getByTestId('combobox-user-1')).toBeInTheDocument()
    expect(screen.getByTestId('combobox-user-2')).toBeInTheDocument()
    expect(screen.queryByTestId('combobox-user-3')).not.toBeInTheDocument()
  })

  it('does not show a payment warning in dream theater mode even for admin roles', () => {
    setupQueries([unpaidUser, fakeUser])
    render(
      <JobForm productionId={5} theaterId={1} specializationId={1} isDreamTheater invalidateKey={['jobs']} onSuccess={vi.fn()} onCancel={vi.fn()} />
    )
    expect(screen.queryByText(/subscription required/i)).not.toBeInTheDocument()
  })
})

// ── payment warning ────────────────────────────────────────────────────────────

describe('JobForm — payment warning for admin roles', () => {
  it('shows a warning when an unsubscribed user is selected for an admin role', async () => {
    setupQueries([unpaidUser, fakeUser])
    const ue = userEvent.setup()
    render(
      <JobForm productionId={5} theaterId={1} specializationId={1} invalidateKey={['jobs']} onSuccess={vi.fn()} onCancel={vi.fn()} />
    )
    await ue.click(screen.getByRole('button', { name: /select user/i }))
    expect(await screen.findByText(/subscription required/i)).toBeInTheDocument()
  })

  it('shows a subscribe link for non-superadmin', async () => {
    setupQueries([unpaidUser, fakeUser])
    const ue = userEvent.setup()
    render(
      <JobForm productionId={5} theaterId={1} specializationId={1} invalidateKey={['jobs']} onSuccess={vi.fn()} onCancel={vi.fn()} />
    )
    await ue.click(screen.getByRole('button', { name: /select user/i }))
    const link = await screen.findByRole('link', { name: /subscribe here/i })
    expect(link).toHaveAttribute('href', '/subscriptions')
  })

  it('disables the submit button when warning is shown for non-superadmin', async () => {
    setupQueries([unpaidUser, fakeUser])
    const ue = userEvent.setup()
    render(
      <JobForm productionId={5} theaterId={1} specializationId={1} invalidateKey={['jobs']} onSuccess={vi.fn()} onCancel={vi.fn()} />
    )
    await ue.click(screen.getByRole('button', { name: /select user/i }))
    await screen.findByText(/subscription required/i)
    const submitBtn = screen.getByRole('button', { name: /add job/i })
    expect(submitBtn).toBeDisabled()
  })

  it('does not show a warning for a paid user', async () => {
    setupQueries([paidUser, fakeUser])
    const ue = userEvent.setup()
    render(
      <JobForm productionId={5} theaterId={1} specializationId={1} invalidateKey={['jobs']} onSuccess={vi.fn()} onCancel={vi.fn()} />
    )
    await ue.click(screen.getByRole('button', { name: /select user/i }))
    expect(screen.queryByText(/subscription required/i)).not.toBeInTheDocument()
  })

  it('does not show a warning for a user with paid_override', async () => {
    setupQueries([overrideUser, fakeUser])
    const ue = userEvent.setup()
    render(
      <JobForm productionId={5} theaterId={1} specializationId={1} invalidateKey={['jobs']} onSuccess={vi.fn()} onCancel={vi.fn()} />
    )
    await ue.click(screen.getByRole('button', { name: /select user/i }))
    expect(screen.queryByText(/subscription required/i)).not.toBeInTheDocument()
  })

  it('does not show a warning for a non-admin role', async () => {
    setupQueries([unpaidUser, fakeUser])
    const ue = userEvent.setup()
    render(
      // specializationId 2 = Stage Manager (production_admin: false, theater_admin: false)
      <JobForm productionId={5} theaterId={1} specializationId={2} invalidateKey={['jobs']} onSuccess={vi.fn()} onCancel={vi.fn()} />
    )
    await ue.click(screen.getByRole('button', { name: /select user/i }))
    expect(screen.queryByText(/subscription required/i)).not.toBeInTheDocument()
  })
})

// ── superadmin bypass ──────────────────────────────────────────────────────────

describe('JobForm — superadmin bypass', () => {
  beforeEach(() => setupAuth({ is_superadmin: true }))

  it('shows "Add anyway" button instead of subscribe link for superadmin', async () => {
    setupQueries([unpaidUser, fakeUser])
    const ue = userEvent.setup()
    render(
      <JobForm productionId={5} theaterId={1} specializationId={1} invalidateKey={['jobs']} onSuccess={vi.fn()} onCancel={vi.fn()} />
    )
    await ue.click(screen.getByRole('button', { name: /select user/i }))
    await screen.findByText(/subscription required/i)
    expect(screen.getByRole('button', { name: /grant paid access/i })).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: /subscribe here/i })).not.toBeInTheDocument()
  })

  it('calls updatePaidOverride then creates the job when "Add anyway" is clicked', async () => {
    setupQueries([unpaidUser, fakeUser])
    const ue = userEvent.setup()
    const onSuccess = vi.fn()
    render(
      <JobForm productionId={5} theaterId={1} specializationId={1} invalidateKey={['jobs']} onSuccess={onSuccess} onCancel={vi.fn()} />
    )
    await ue.click(screen.getByRole('button', { name: /select user/i }))
    await screen.findByText(/subscription required/i)
    await ue.click(screen.getByRole('button', { name: /grant paid access/i }))
    await waitFor(() => {
      expect(mockUpdatePaidOverride).toHaveBeenCalledWith({ id: unpaidUser.id, paid_override: true })
      expect(mockCreateJob).toHaveBeenCalled()
    })
  })
})
