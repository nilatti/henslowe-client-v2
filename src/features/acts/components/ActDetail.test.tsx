import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'

const { mockUseSuspenseQuery, mockIsPlayAdmin } = vi.hoisted(() => ({
  mockUseSuspenseQuery: vi.fn(),
  mockIsPlayAdmin: vi.fn(() => false),
}))

vi.mock('@tanstack/react-query', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@tanstack/react-query')>()
  return { ...actual, useSuspenseQuery: mockUseSuspenseQuery, useQuery: () => ({ data: undefined }) }
})

vi.mock('../../rehearsals/hooks/useRehearsalTimeLabels', () => ({
  useRehearsalTimeLabels: () => ({ acts: new Map(), scenes: new Map(), frenchScenes: new Map() }),
}))

vi.mock('@tanstack/react-router', () => ({
  Link: ({ children, to, params, className }: any) => (
    <a data-to={to} data-params={JSON.stringify(params ?? {})} className={className}>
      {children}
    </a>
  ),
  useNavigate: () => vi.fn(),
}))

vi.mock('../api/acts', () => ({
  actQueryOptions: (id: number) => ({ queryKey: ['acts', id] }),
  useDeleteAct: () => ({ mutateAsync: vi.fn() }),
}))

vi.mock('../../scenes/api/scenes', () => ({
  useReorderScenes: () => ({ mutate: vi.fn() }),
}))

vi.mock('../../plays/api/plays', () => ({
  playSkeletonQueryOptions: (id: number) => ({ queryKey: ['plays', id, 'skeleton'] }),
}))

vi.mock('../../../hooks/useUserRole', () => ({
  useIsPlayAdmin: () => mockIsPlayAdmin(),
}))

vi.mock('./ActForm', () => ({ ActForm: () => null }))
vi.mock('../../scenes/components/SceneForm', () => ({ SceneForm: () => null }))

import { ActDetail } from './ActDetail'

// ── helpers ───────────────────────────────────────────────────────────────────

function makeActData(id: number, number: number) {
  return {
    id, number, play_id: 1, summary: null, heading: null,
    start_page: null, end_page: null, original_line_count: 0,
    new_line_count: 0, created_at: '', updated_at: '',
    scenes: [{ id: 100, number: 1, french_scenes: [] }, { id: 101, number: 2, french_scenes: [] }],
  }
}

function makeActSkeleton(acts: Array<{ id: number; number: number }>, canonical = true) {
  return {
    id: 1, title: 'Test Play', canonical, synopsis: null, text_notes: null,
    production_id: null, author: { id: 1, first_name: 'A', last_name: 'B' },
    characters: [], character_groups: [],
    acts: acts.map(a => ({ ...a, summary: null, scenes: [] })),
  }
}

function setup(actId: number, acts: Array<{ id: number; number: number }>, canonical = true) {
  mockUseSuspenseQuery.mockImplementation(({ queryKey }: { queryKey: unknown[] }) => {
    if (queryKey[0] === 'acts') return { data: makeActData(actId, acts.find(a => a.id === actId)!.number) }
    if (queryKey[0] === 'plays') return { data: makeActSkeleton(acts, canonical) }
    throw new Error(`Unexpected queryKey: ${JSON.stringify(queryKey)}`)
  })
  render(<ActDetail playId={1} actId={actId} />)
}

beforeEach(() => {
  mockUseSuspenseQuery.mockReset()
  mockIsPlayAdmin.mockReturnValue(false)
})

// ── tests ─────────────────────────────────────────────────────────────────────

const threeActs = [{ id: 1, number: 1 }, { id: 2, number: 2 }, { id: 3, number: 3 }]

describe('ActDetail — prev/next navigation', () => {
  it('shows both prev and next links for a middle act', () => {
    setup(2, threeActs)
    expect(screen.getByText('← Act 1')).toBeInTheDocument()
    expect(screen.getByText('Act 3 →')).toBeInTheDocument()
  })

  it('hides the prev link for the first act', () => {
    setup(1, threeActs)
    expect(screen.queryByText(/← Act/)).not.toBeInTheDocument()
    expect(screen.getByText('Act 2 →')).toBeInTheDocument()
  })

  it('hides the next link for the last act', () => {
    setup(3, threeActs)
    expect(screen.getByText('← Act 2')).toBeInTheDocument()
    expect(screen.queryByText(/Act.*→/)).not.toBeInTheDocument()
  })

  it('shows no navigation when there is only one act', () => {
    setup(1, [{ id: 1, number: 1 }])
    expect(screen.queryByText(/← Act/)).not.toBeInTheDocument()
    expect(screen.queryByText(/Act.*→/)).not.toBeInTheDocument()
  })

  it('links prev and next to the correct act IDs', () => {
    setup(2, threeActs)
    const prevLink = screen.getByText('← Act 1').closest('a')!
    const nextLink = screen.getByText('Act 3 →').closest('a')!
    expect(JSON.parse(prevLink.dataset.params!)).toMatchObject({ actId: '1' })
    expect(JSON.parse(nextLink.dataset.params!)).toMatchObject({ actId: '3' })
  })
})

describe('ActDetail — reordering scenes', () => {
  const handles = () => screen.queryAllByRole('button', { name: /drag to reorder scene/i })

  it("shows a drag handle on each scene for admins of a production copy", () => {
    mockIsPlayAdmin.mockReturnValue(true)
    setup(1, threeActs, false)
    expect(handles()).toHaveLength(2)
  })

  it('hides drag handles on canonical plays, even for admins', () => {
    mockIsPlayAdmin.mockReturnValue(true)
    setup(1, threeActs, true)
    expect(handles()).toHaveLength(0)
  })

  it('hides drag handles from non-admins', () => {
    setup(1, threeActs, false)
    expect(handles()).toHaveLength(0)
  })
})
