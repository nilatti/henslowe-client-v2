import { describe, it, expect, vi, beforeEach } from 'vitest'
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

vi.mock('@tanstack/react-router', () => ({
  Link: ({ children, to, params, hash, className }: any) => (
    <a data-to={to} data-params={JSON.stringify(params ?? {})} data-hash={hash ?? ''} className={className}>
      {children}
    </a>
  ),
  useNavigate: () => vi.fn(),
}))

vi.mock('../api/spaces', () => ({
  spaceQueryOptions: (id: number) => ({ queryKey: ['spaces', id] }),
  spaceRehearsalsQueryOptions: (id: number) => ({ queryKey: ['spaces', id, 'rehearsals'] }),
  useDeleteSpace: () => ({ mutateAsync: vi.fn() }),
}))

vi.mock('../../../hooks/useUserRole', () => ({
  useUserRoleForSpace: vi.fn().mockReturnValue('member'),
  useIsSuperAdmin: vi.fn().mockReturnValue(false),
}))

vi.mock('../../conflicts/components/ConflictsManager', () => ({
  ConflictsManager: () => <div data-testid="conflicts-manager" />,
}))

vi.mock('./SpaceForm', () => ({ SpaceForm: () => null }))

vi.mock('../../../components/ui', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../../components/ui')>()
  return {
    ...actual,
    Button: ({ children, onClick }: any) => <button onClick={onClick}>{children}</button>,
    Card: ({ children, className }: any) => <div className={className}>{children}</div>,
    ConfirmDialog: () => null,
    PageHeader: ({ title }: any) => <h1>{title}</h1>,
    Tabs: ({ tabs, activeTab, onChange }: any) => (
      <div>
        {tabs.map((t: any) => (
          <button key={t.id} onClick={() => onChange(t.id)} data-active={String(activeTab === t.id)}>
            {t.label}
          </button>
        ))}
      </div>
    ),
  }
})

import { SpaceDetail } from './SpaceDetail'
import { useUserRoleForSpace, useIsSuperAdmin } from '../../../hooks/useUserRole'

// ── helpers ───────────────────────────────────────────────────────────────────

function makeSpace(overrides: object = {}) {
  return {
    id: 1, name: 'Test Theater',
    street_address: null, city: null, state: null, zip: null,
    phone_number: null, website: null, seating_capacity: null,
    mission_statement: null, logo: null,
    created_at: '', updated_at: '',
    theaters: [], conflicts: [], conflict_patterns: [],
    ...overrides,
  }
}

function makeRehearsal(id: number, offsetDays: number) {
  const start = new Date()
  start.setDate(start.getDate() + offsetDays)
  const end = new Date(start)
  end.setHours(end.getHours() + 2)
  return {
    id,
    production_id: 42,
    start_time: start.toISOString(),
    end_time: end.toISOString(),
    title: null,
    notes: null,
    acts: [],
    scenes: [],
    french_scenes: [],
    production: { id: 42, play: { id: 99 } },
  }
}

function setupQueries(rehearsals: any[] = []) {
  mockUseSuspenseQuery.mockImplementation(({ queryKey }: { queryKey: unknown[] }) => {
    if (queryKey[0] === 'spaces' && queryKey.length === 2) return { data: makeSpace() }
    if (queryKey[0] === 'spaces' && queryKey[2] === 'rehearsals') return { data: rehearsals }
    throw new Error(`Unexpected queryKey: ${JSON.stringify(queryKey)}`)
  })
}

beforeEach(() => {
  mockUseSuspenseQuery.mockReset()
  ;(useUserRoleForSpace as Mock).mockReset().mockReturnValue('member')
  ;(useIsSuperAdmin as Mock).mockReset().mockReturnValue(false)
})

// ── tests ─────────────────────────────────────────────────────────────────────

describe('SpaceDetail — Rehearsals tab label', () => {
  it('renders a Rehearsals tab', () => {
    setupQueries()
    render(<SpaceDetail spaceId={1} />)
    expect(screen.getByRole('button', { name: /rehearsals/i })).toBeInTheDocument()
  })
})

describe('SpaceDetail — Rehearsals tab content', () => {
  async function openRehearsalsTab(rehearsals: any[] = []) {
    const user = userEvent.setup()
    setupQueries(rehearsals)
    const result = render(<SpaceDetail spaceId={1} />)
    await user.click(screen.getByRole('button', { name: /^rehearsals$/i }))
    return result
  }

  it('shows an empty-state message when there are no upcoming rehearsals', async () => {
    await openRehearsalsTab([])
    expect(screen.getByText(/no upcoming rehearsals scheduled at this space/i)).toBeInTheDocument()
  })

  it('does not show the table when there are no upcoming rehearsals', async () => {
    await openRehearsalsTab([])
    expect(screen.queryByRole('table')).not.toBeInTheDocument()
  })

  it('shows the rehearsal table when there are upcoming rehearsals', async () => {
    await openRehearsalsTab([makeRehearsal(1, 2)])
    expect(screen.queryByText(/no upcoming rehearsals scheduled/i)).not.toBeInTheDocument()
    expect(screen.getByRole('table')).toBeInTheDocument()
  })

  it('renders all five column headers', async () => {
    await openRehearsalsTab([makeRehearsal(1, 2)])
    expect(screen.getByText('Time')).toBeInTheDocument()
    expect(screen.getByText('Location')).toBeInTheDocument()
    expect(screen.getByText('Title')).toBeInTheDocument()
    expect(screen.getByText('Material')).toBeInTheDocument()
    expect(screen.getByText('Notes')).toBeInTheDocument()
  })

  it('renders one row per upcoming rehearsal', async () => {
    await openRehearsalsTab([makeRehearsal(1, 2), makeRehearsal(2, 5)])
    const rows = screen.getAllByRole('row')
    // 1 header row + 2 data rows
    expect(rows).toHaveLength(3)
  })

  it('time cell links to the production rehearsal schedule', async () => {
    const { container } = await openRehearsalsTab([makeRehearsal(1, 2)])
    const links = Array.from(container.querySelectorAll<HTMLElement>('a'))
    const timeLink = links.find(l => l.dataset.to === '/productions/$productionId/rehearsals')
    expect(timeLink).toBeDefined()
    expect(JSON.parse(timeLink!.dataset.params!)).toMatchObject({ productionId: '42' })
  })

  it('does not show past rehearsals', async () => {
    await openRehearsalsTab([makeRehearsal(1, -5)])
    expect(screen.getByText(/no upcoming rehearsals scheduled at this space/i)).toBeInTheDocument()
  })

  it('shows future rehearsals beyond 7 days (no end-date cap)', async () => {
    await openRehearsalsTab([makeRehearsal(1, 30)])
    expect(screen.getByRole('table')).toBeInTheDocument()
    expect(screen.queryByText(/no upcoming rehearsals/i)).not.toBeInTheDocument()
  })
})
