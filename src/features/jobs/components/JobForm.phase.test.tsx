import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

// ── mock tanstack-form so we can control what renders ──────────────────────────
// We test the getPhaseDate / applyPhaseDefaults logic by rendering the real form
// with mocked queries, so we need the real @tanstack/react-form but controlled data.

const { mockUseSuspenseQuery, mockUseQuery } = vi.hoisted(() => ({
  mockUseSuspenseQuery: vi.fn(),
  mockUseQuery: vi.fn(),
}))

vi.mock('@tanstack/react-query', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@tanstack/react-query')>()
  return { ...actual, useSuspenseQuery: mockUseSuspenseQuery, useQuery: mockUseQuery }
})

vi.mock('@tanstack/react-router', () => ({}))

vi.mock('../api/jobs', () => ({
  useCreateJob: () => ({ mutateAsync: vi.fn() }),
  useUpdateJob: () => ({ mutateAsync: vi.fn() }),
  productionJobsQueryOptions: (id: number) => ({ queryKey: ['production-jobs', id] }),
}))

vi.mock('../../specializations/queries', () => ({
  specializationsQueryOptions: () => ({ queryKey: ['specializations'] }),
}))

vi.mock('../../users/api/users', () => ({
  usersQueryOptions: () => ({ queryKey: ['users'] }),
}))

vi.mock('../../productions/api/productions', () => ({
  productionSkeletonQueryOptions: (id: number) => ({ queryKey: ['productions', id, 'skeleton'] }),
}))

vi.mock('../../../hooks/useAuth', () => ({
  useAuth: () => ({ user: { is_superadmin: false, subscription_status: 'active' } }),
}))

vi.mock('./UserCombobox', () => ({
  UserCombobox: ({ onChange }: any) => (
    <button onClick={() => onChange(1)}>select user</button>
  ),
}))

vi.mock('../../../components/ui', () => ({
  Button: ({ children, type, onClick, disabled }: any) => (
    <button type={type ?? 'button'} onClick={onClick} disabled={disabled}>{children}</button>
  ),
}))

vi.mock('../../../utils/constants', () => ({
  AUDITIONER_SPECIALIZATION_ID: 99,
}))

import { JobForm } from './JobForm'

// ── shared fixtures ────────────────────────────────────────────────────────────

const phases = [
  { id: 10, name: 'Preproduction', position: 1 },
  { id: 20, name: 'Rehearsals', position: 2 },
]

const specializations = [
  {
    id: 1,
    title: 'Director',
    default_start_phase_id: 10,
    default_end_phase_id: 20,
    default_start_phase: phases[0],
    default_end_phase: phases[1],
    production_admin: true,
    theater_admin: false,
  },
  {
    id: 2,
    title: 'Stage Manager',
    default_start_phase_id: null,
    default_end_phase_id: null,
    default_start_phase: null,
    default_end_phase: null,
    production_admin: false,
    theater_admin: false,
  },
]

const productionSkeleton = {
  id: 5,
  production_phases: [
    { id: 100, production_id: 5, phase_id: 10, start_date: '2026-01-15', end_date: '2026-02-01', phase: phases[0] },
    { id: 101, production_id: 5, phase_id: 20, start_date: '2026-02-01', end_date: '2026-04-30', phase: phases[1] },
  ],
}

const users = [
  { id: 1, email: 'a@test.com', first_name: 'Alice', last_name: 'Smith', fake: false },
]

function setupQueries(overrides: { productionSkeleton?: any; editing?: boolean } = {}) {
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

beforeEach(() => {
  mockUseSuspenseQuery.mockReset()
  mockUseQuery.mockReset()
})

// ── tests ─────────────────────────────────────────────────────────────────────

function getDateInputs(container: HTMLElement) {
  const inputs = container.querySelectorAll('input[type="date"]')
  return {
    startInput: inputs[0] as HTMLInputElement,
    endInput: inputs[1] as HTMLInputElement,
  }
}

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
    const { container } = render(
      <JobForm productionId={5} theaterId={1} invalidateKey={['jobs']} onSuccess={vi.fn()} onCancel={vi.fn()} />
    )
    const select = screen.getByRole('combobox')
    await user.selectOptions(select, '1')
    expect(getDateInputs(container).startInput.value).toBe('2026-01-15')
  })

  it('does not override dates when editing an existing job', () => {
    setupQueries({ editing: true })
    const existingJob = {
      id: 42,
      user_id: 1,
      specialization_id: 1,
      start_date: '2025-06-01',
      end_date: '2025-12-01',
      production_id: 5,
      theater_id: 1,
      created_at: '',
      updated_at: '',
      specialization: null,
      theater: null,
      production: null,
      user: null,
      character: null,
      character_group: null,
    } as any
    const { container } = render(
      <JobForm job={existingJob} productionId={5} theaterId={1} invalidateKey={['jobs']} onSuccess={vi.fn()} onCancel={vi.fn()} />
    )
    const { startInput, endInput } = getDateInputs(container)
    expect(startInput.value).toBe('2025-06-01')
    expect(endInput.value).toBe('2025-12-01')
  })

  it('leaves end_date empty when production has no phases configured', () => {
    setupQueries({ productionSkeleton: { id: 5, production_phases: [] } })
    const { container } = render(
      <JobForm productionId={5} theaterId={1} specializationId={1} invalidateKey={['jobs']} onSuccess={vi.fn()} onCancel={vi.fn()} />
    )
    expect(getDateInputs(container).endInput.value).toBe('')
  })
})
