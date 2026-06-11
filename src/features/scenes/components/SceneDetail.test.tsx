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

vi.mock('../api/scenes', () => ({
  sceneQueryOptions: (id: number) => ({ queryKey: ['scenes', id] }),
  useDeleteScene: () => ({ mutateAsync: vi.fn() }),
}))

vi.mock('../../acts/api/acts', () => ({
  actQueryOptions: (id: number) => ({ queryKey: ['acts', id] }),
}))

vi.mock('../../plays/api/plays', () => ({
  playSkeletonQueryOptions: (id: number) => ({ queryKey: ['plays', id, 'skeleton'] }),
}))

vi.mock('../../../hooks/useUserRole', () => ({
  useIsPlayAdmin: () => false,
}))

vi.mock('./SceneForm', () => ({ SceneForm: () => null }))
vi.mock('../../french_scenes/components/FrenchSceneForm', () => ({ FrenchSceneForm: () => null }))

import { SceneDetail } from './SceneDetail'

// ── helpers ───────────────────────────────────────────────────────────────────

function makeSceneData(id: number, number: number, actId: number) {
  return {
    id, number, act_id: actId, summary: null, heading: null,
    start_page: null, end_page: null, original_line_count: null,
    new_line_count: null, pretty_name: `${Math.ceil(actId / 10)}.${number}`,
    created_at: '', updated_at: '', french_scenes: [],
  }
}

function makeActData(id: number, number: number) {
  return {
    id, number, play_id: 1, summary: null, heading: null,
    start_page: null, end_page: null, original_line_count: null,
    new_line_count: null, created_at: '', updated_at: '', scenes: [],
  }
}

type SkeletonAct = { id: number; number: number; scenes: Array<{ id: number; number: number; prettyName: string }> }

function makeSkeleton(acts: SkeletonAct[]) {
  return {
    id: 1, title: 'Test Play', canonical: true, synopsis: null, text_notes: null,
    production_id: null, author: { id: 1, first_name: 'A', last_name: 'B' },
    characters: [], character_groups: [],
    acts: acts.map(a => ({
      id: a.id, number: a.number, summary: null,
      scenes: a.scenes.map(s => ({
        id: s.id, number: s.number, pretty_name: s.prettyName,
        heading: null, summary: null, french_scenes: [],
      })),
    })),
  }
}

// Play: Act 1 (scenes 1.1, 1.2) and Act 2 (scenes 2.1, 2.2)
const twoActSkeleton: SkeletonAct[] = [
  {
    id: 1, number: 1,
    scenes: [
      { id: 10, number: 1, prettyName: '1.1' },
      { id: 11, number: 2, prettyName: '1.2' },
    ],
  },
  {
    id: 2, number: 2,
    scenes: [
      { id: 20, number: 1, prettyName: '2.1' },
      { id: 21, number: 2, prettyName: '2.2' },
    ],
  },
]

function setup(sceneId: number, actId: number, sceneNumber: number) {
  const actNumber = twoActSkeleton.find(a => a.id === actId)!.number
  mockUseSuspenseQuery.mockImplementation(({ queryKey }: { queryKey: unknown[] }) => {
    if (queryKey[0] === 'scenes') return { data: makeSceneData(sceneId, sceneNumber, actId) }
    if (queryKey[0] === 'acts') return { data: makeActData(actId, actNumber) }
    if (queryKey[0] === 'plays') return { data: makeSkeleton(twoActSkeleton) }
    throw new Error(`Unexpected queryKey: ${JSON.stringify(queryKey)}`)
  })
  render(<SceneDetail playId={1} actId={actId} sceneId={sceneId} />)
}

beforeEach(() => { mockUseSuspenseQuery.mockReset() })

// ── tests ─────────────────────────────────────────────────────────────────────

describe('SceneDetail — prev/next navigation', () => {
  it('shows both prev and next for a middle scene within an act', () => {
    // Act 2, Scene 2.1 (first of act 2) — prev=1.2, next=2.2
    setup(20, 2, 1)
    expect(screen.getByText('← Scene 1.2')).toBeInTheDocument()
    expect(screen.getByText('Scene 2.2 →')).toBeInTheDocument()
  })

  it('hides prev link for the first scene of the play', () => {
    setup(10, 1, 1) // Scene 1.1 — very first
    expect(screen.queryByText(/← Scene/)).not.toBeInTheDocument()
    expect(screen.getByText('Scene 1.2 →')).toBeInTheDocument()
  })

  it('hides next link for the last scene of the play', () => {
    setup(21, 2, 2) // Scene 2.2 — very last
    expect(screen.getByText('← Scene 2.1')).toBeInTheDocument()
    expect(screen.queryByText(/Scene.*→/)).not.toBeInTheDocument()
  })

  it('next from last scene of act 1 goes to first scene of act 2', () => {
    setup(11, 1, 2) // Scene 1.2 — last of act 1
    expect(screen.getByText('← Scene 1.1')).toBeInTheDocument()
    const nextLink = screen.getByText('Scene 2.1 →').closest('a')!
    expect(JSON.parse(nextLink.dataset.params!)).toMatchObject({ sceneId: '20', actId: '2' })
  })

  it('prev from first scene of act 2 goes to last scene of act 1', () => {
    setup(20, 2, 1) // Scene 2.1 — first of act 2
    const prevLink = screen.getByText('← Scene 1.2').closest('a')!
    expect(JSON.parse(prevLink.dataset.params!)).toMatchObject({ sceneId: '11', actId: '1' })
  })
})
