import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'

const { mockUseSuspenseQuery } = vi.hoisted(() => ({
  mockUseSuspenseQuery: vi.fn(),
}))

vi.mock('@tanstack/react-query', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@tanstack/react-query')>()
  return { ...actual, useSuspenseQuery: mockUseSuspenseQuery }
})

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

vi.mock('../../plays/api/plays', () => ({
  playSkeletonQueryOptions: (id: number) => ({ queryKey: ['plays', id, 'skeleton'] }),
}))

vi.mock('../../../hooks/useUserRole', () => ({
  useIsPlayAdmin: () => false,
}))

vi.mock('./ActForm', () => ({ ActForm: () => null }))
vi.mock('../../scenes/components/SceneForm', () => ({ SceneForm: () => null }))

import { ActDetail } from './ActDetail'

// ── helpers ───────────────────────────────────────────────────────────────────

function makeActData(id: number, number: number) {
  return {
    id, number, play_id: 1, summary: null, heading: null,
    start_page: null, end_page: null, original_line_count: null,
    new_line_count: null, created_at: '', updated_at: '', scenes: [],
  }
}

function makeActSkeleton(acts: Array<{ id: number; number: number }>) {
  return {
    id: 1, title: 'Test Play', canonical: true, synopsis: null, text_notes: null,
    production_id: null, author: { id: 1, first_name: 'A', last_name: 'B' },
    characters: [], character_groups: [],
    acts: acts.map(a => ({ ...a, summary: null, scenes: [] })),
  }
}

function setup(actId: number, acts: Array<{ id: number; number: number }>) {
  mockUseSuspenseQuery.mockImplementation(({ queryKey }: { queryKey: unknown[] }) => {
    if (queryKey[0] === 'acts') return { data: makeActData(actId, acts.find(a => a.id === actId)!.number) }
    if (queryKey[0] === 'plays') return { data: makeActSkeleton(acts) }
    throw new Error(`Unexpected queryKey: ${JSON.stringify(queryKey)}`)
  })
  render(<ActDetail playId={1} actId={actId} />)
}

beforeEach(() => { mockUseSuspenseQuery.mockReset() })

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
