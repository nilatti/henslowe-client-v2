import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

const { mockUseQuery, mockUseAuth, mockMutateOverride } = vi.hoisted(() => ({
  mockUseQuery: vi.fn(),
  mockUseAuth: vi.fn(),
  mockMutateOverride: vi.fn(),
}))

vi.mock('@tanstack/react-query', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@tanstack/react-query')>()
  return { ...actual, useQuery: mockUseQuery }
})

vi.mock('../../jobs/api/jobs', () => ({
  useCreateJob: () => ({ mutateAsync: vi.fn().mockResolvedValue({}) }),
}))

vi.mock('../api/users', () => ({
  useUpdatePaidOverride: () => ({ mutateAsync: mockMutateOverride }),
}))

vi.mock('@tanstack/react-router', () => ({
  Link: ({ children, to, className }: any) => <a href={to} className={className}>{children}</a>,
}))

vi.mock('../../specializations/queries', () => ({
  specializationsQueryOptions: () => ({ queryKey: ['specializations'] }),
}))

vi.mock('../../theaters/api/theaters', () => ({
  theatersQueryOptions: () => ({ queryKey: ['theaters'] }),
}))

vi.mock('../../productions/api/productions', () => ({
  productionsQueryOptions: () => ({ queryKey: ['productions'] }),
}))

vi.mock('../../../hooks/useUserRole', () => ({
  userAllJobsQueryOptions: (userId: number) => ({ queryKey: ['jobs', { userId }] }),
}))

vi.mock('../../../hooks/useAuth', () => ({
  useAuth: mockUseAuth,
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

import { AddJobToUserForm } from './AddJobToUserForm'

// ── fixtures ───────────────────────────────────────────────────────────────────

const theaters = [
  { id: 1, name: 'Theater One' },
  { id: 2, name: 'Theater Two' },
]

const productions = [
  { id: 10, play: { title: 'Play A' }, theater: { id: 1 } },
  { id: 20, play: { title: 'Play B' }, theater: { id: 2 } },
]

const specializations = [
  { id: 1, title: 'Actor',    production_admin: false, theater_admin: false },
  { id: 2, title: 'Director', production_admin: true,  theater_admin: false },
]

function theaterAdminJob(theaterId: number) {
  return {
    theater_id: theaterId,
    production_id: null,
    specialization: { title: 'Theater Admin' },
    end_date: '2099-01-01',
  }
}

function productionAdminJob(theaterId: number, productionId: number) {
  return {
    theater_id: theaterId,
    production_id: productionId,
    specialization: { title: 'Director' },
    end_date: '2099-01-01',
  }
}

function setupQueries(currentUserJobs: object[]) {
  mockUseQuery.mockImplementation(({ queryKey }: { queryKey: unknown[] }) => {
    if (queryKey[0] === 'theaters') return { data: theaters }
    if (queryKey[0] === 'productions') return { data: productions }
    if (queryKey[0] === 'specializations') return { data: specializations }
    if (queryKey[0] === 'jobs') return { data: currentUserJobs }
    return { data: [] }
  })
}

function defaultProps() {
  return {
    userId: 99,
    invalidateKey: ['users', 99] as unknown[],
    onSuccess: vi.fn(),
    onCancel: vi.fn(),
  }
}

beforeEach(() => {
  mockUseQuery.mockReset()
  mockMutateOverride.mockReset().mockResolvedValue({})
  mockUseAuth.mockReturnValue({ user: { id: 1, is_superadmin: false } })
})

// ── tests ─────────────────────────────────────────────────────────────────────

describe('AddJobToUserForm — overlap-based filtering for non-superadmins', () => {
  it('shows only theaters where the target user has a job', () => {
    // Viewer is admin at both theaters; target only has a job at Theater One.
    setupQueries([theaterAdminJob(1), theaterAdminJob(2)])
    render(
      <AddJobToUserForm
        {...defaultProps()}
        targetUserJobs={[{ theater_id: 1, production_id: null }]}
      />
    )
    expect(screen.getByRole('option', { name: 'Theater One' })).toBeInTheDocument()
    expect(screen.queryByRole('option', { name: 'Theater Two' })).not.toBeInTheDocument()
  })

  it('shows productions at overlapping theaters', () => {
    // Viewer is theater admin at Theater One. Play A is at Theater One, Play B at Theater Two.
    // Target has a job at Theater One → Play A should appear, Play B should not.
    setupQueries([theaterAdminJob(1)])
    render(
      <AddJobToUserForm
        {...defaultProps()}
        targetUserJobs={[{ theater_id: 1, production_id: null }]}
      />
    )
    expect(screen.getByRole('option', { name: 'Play A' })).toBeInTheDocument()
    expect(screen.queryByRole('option', { name: 'Play B' })).not.toBeInTheDocument()
  })

  it('shows a production where the target has a direct job even without theater-level overlap', () => {
    // Viewer is production admin (Director) on both productions but not theater admin.
    // Target only has a job at Play B → only Play B should appear.
    setupQueries([productionAdminJob(1, 10), productionAdminJob(2, 20)])
    render(
      <AddJobToUserForm
        {...defaultProps()}
        targetUserJobs={[{ theater_id: 2, production_id: 20 }]}
      />
    )
    expect(screen.queryByRole('option', { name: 'Play A' })).not.toBeInTheDocument()
    expect(screen.getByRole('option', { name: 'Play B' })).toBeInTheDocument()
  })

  it('shows no theaters or productions when there is no overlap', () => {
    // Viewer is admin only at Theater One; target only has jobs at Theater Two.
    setupQueries([theaterAdminJob(1)])
    render(
      <AddJobToUserForm
        {...defaultProps()}
        targetUserJobs={[{ theater_id: 2, production_id: null }]}
      />
    )
    expect(screen.queryByRole('option', { name: 'Theater One' })).not.toBeInTheDocument()
    expect(screen.queryByRole('option', { name: 'Theater Two' })).not.toBeInTheDocument()
    expect(screen.queryByRole('option', { name: 'Play A' })).not.toBeInTheDocument()
    expect(screen.queryByRole('option', { name: 'Play B' })).not.toBeInTheDocument()
  })
})

describe('AddJobToUserForm — superadmin bypasses overlap filter', () => {
  beforeEach(() => {
    mockUseAuth.mockReturnValue({ user: { id: 1, is_superadmin: true } })
    setupQueries([])
  })

  it('shows all theaters regardless of targetUserJobs', () => {
    render(
      <AddJobToUserForm
        {...defaultProps()}
        targetUserJobs={[{ theater_id: 1, production_id: null }]}
      />
    )
    expect(screen.getByRole('option', { name: 'Theater One' })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: 'Theater Two' })).toBeInTheDocument()
  })

  it('shows all productions regardless of targetUserJobs', () => {
    render(
      <AddJobToUserForm
        {...defaultProps()}
        targetUserJobs={[{ theater_id: 1, production_id: null }]}
      />
    )
    expect(screen.getByRole('option', { name: 'Play A' })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: 'Play B' })).toBeInTheDocument()
  })
})

describe('AddJobToUserForm — no targetUserJobs (base admin filtering only)', () => {
  it('shows theaters where the viewer is admin and excludes others', () => {
    // Viewer is admin only at Theater One.
    setupQueries([theaterAdminJob(1)])
    render(<AddJobToUserForm {...defaultProps()} />)
    expect(screen.getByRole('option', { name: 'Theater One' })).toBeInTheDocument()
    expect(screen.queryByRole('option', { name: 'Theater Two' })).not.toBeInTheDocument()
  })

  it('shows productions where the viewer is admin and excludes others', () => {
    // Viewer is production admin only for Play A.
    setupQueries([productionAdminJob(1, 10)])
    render(<AddJobToUserForm {...defaultProps()} />)
    expect(screen.getByRole('option', { name: 'Play A' })).toBeInTheDocument()
    expect(screen.queryByRole('option', { name: 'Play B' })).not.toBeInTheDocument()
  })
})

// ── payment warning ────────────────────────────────────────────────────────────

describe('AddJobToUserForm — payment warning', () => {
  async function selectContextAndRole(theaterId: number, specializationId: number) {
    const ue = userEvent.setup()
    const contextSelect = screen.getAllByRole('combobox')[0]
    const roleSelect    = screen.getAllByRole('combobox')[1]
    await ue.selectOptions(contextSelect, `theater:${theaterId}`)
    await ue.selectOptions(roleSelect, String(specializationId))
    return ue
  }

  it('shows payment warning when target user is unsubscribed and role is admin', async () => {
    mockUseAuth.mockReturnValue({ user: { id: 1, is_superadmin: true } })
    setupQueries([theaterAdminJob(1)])
    render(
      <AddJobToUserForm
        {...defaultProps()}
        targetUserSubscriptionStatus="never subscribed"
        targetUserPaidOverride={false}
      />
    )
    await selectContextAndRole(1, 2)  // theater:1, Director (production_admin)
    expect(screen.getByText(/subscription required/i)).toBeInTheDocument()
  })

  it('does not show warning when target user is subscribed', async () => {
    mockUseAuth.mockReturnValue({ user: { id: 1, is_superadmin: true } })
    setupQueries([theaterAdminJob(1)])
    render(
      <AddJobToUserForm
        {...defaultProps()}
        targetUserSubscriptionStatus="active"
        targetUserPaidOverride={false}
      />
    )
    await selectContextAndRole(1, 2)
    expect(screen.queryByText(/subscription required/i)).not.toBeInTheDocument()
  })

  it('does not show warning when target user has paid_override', async () => {
    mockUseAuth.mockReturnValue({ user: { id: 1, is_superadmin: true } })
    setupQueries([theaterAdminJob(1)])
    render(
      <AddJobToUserForm
        {...defaultProps()}
        targetUserSubscriptionStatus="canceled"
        targetUserPaidOverride={true}
      />
    )
    await selectContextAndRole(1, 2)
    expect(screen.queryByText(/subscription required/i)).not.toBeInTheDocument()
  })

  it('does not show warning for a non-admin role', async () => {
    mockUseAuth.mockReturnValue({ user: { id: 1, is_superadmin: true } })
    setupQueries([theaterAdminJob(1)])
    render(
      <AddJobToUserForm
        {...defaultProps()}
        targetUserSubscriptionStatus="never subscribed"
        targetUserPaidOverride={false}
      />
    )
    await selectContextAndRole(1, 1)  // Actor (not admin)
    expect(screen.queryByText(/subscription required/i)).not.toBeInTheDocument()
  })

  it('shows subscribe link for non-superadmin', async () => {
    setupQueries([theaterAdminJob(1)])
    render(
      <AddJobToUserForm
        {...defaultProps()}
        targetUserSubscriptionStatus="never subscribed"
        targetUserPaidOverride={false}
      />
    )
    await selectContextAndRole(1, 2)
    const link = screen.getByRole('link', { name: /subscribe here/i })
    expect(link).toHaveAttribute('href', '/subscriptions')
  })

  it('shows "Add anyway" button for superadmin', async () => {
    mockUseAuth.mockReturnValue({ user: { id: 1, is_superadmin: true } })
    setupQueries([theaterAdminJob(1)])
    render(
      <AddJobToUserForm
        {...defaultProps()}
        targetUserSubscriptionStatus="never subscribed"
        targetUserPaidOverride={false}
      />
    )
    await selectContextAndRole(1, 2)
    expect(screen.getByRole('button', { name: /grant paid access/i })).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: /subscribe here/i })).not.toBeInTheDocument()
  })
})
