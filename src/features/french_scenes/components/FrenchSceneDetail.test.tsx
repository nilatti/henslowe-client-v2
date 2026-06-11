import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'

const { mockUseSuspenseQuery, mockUseQuery } = vi.hoisted(() => ({
  mockUseSuspenseQuery: vi.fn(),
  mockUseQuery: vi.fn(() => ({ data: undefined })),
}))

vi.mock('@tanstack/react-query', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@tanstack/react-query')>()
  return { ...actual, useSuspenseQuery: mockUseSuspenseQuery, useQuery: mockUseQuery }
})

vi.mock('@tanstack/react-router', () => ({
  Link: ({ children, to, params, className }: any) => (
    <a data-to={to} data-params={JSON.stringify(params ?? {})} className={className}>
      {children}
    </a>
  ),
  useNavigate: () => vi.fn(),
}))

vi.mock('../api/frenchScenes', () => ({
  frenchSceneQueryOptions: (id: number) => ({ queryKey: ['french_scenes', id] }),
  useDeleteFrenchScene: () => ({ mutateAsync: vi.fn() }),
}))

vi.mock('../../plays/api/plays', () => ({
  playSkeletonQueryOptions: (id: number) => ({ queryKey: ['plays', id, 'skeleton'] }),
}))

vi.mock('../../productions/api/productions', () => ({
  productionSkeletonQueryOptions: (id: number) => ({ queryKey: ['productions', id, 'skeleton'] }),
}))

vi.mock('../../../hooks/useUserRole', () => ({
  useIsPlayAdmin: () => false,
}))

vi.mock('./FrenchSceneForm', () => ({ FrenchSceneForm: () => null }))
vi.mock('./OnStagesManager', () => ({ OnStagesManager: () => null }))
vi.mock('./SongsManager', () => ({ SongsManager: () => null }))
vi.mock('../../productions/components/EntranceExits/EntranceExitsList', () => ({
  EntranceExitsList: () => null,
}))

import { FrenchSceneDetail } from './FrenchSceneDetail'

// ── helpers ───────────────────────────────────────────────────────────────────

function makeFrenchSceneData(id: number, number: string, sceneId: number) {
  return {
    id, number, scene_id: sceneId, summary: null, start_page: null, end_page: null,
    original_line_count: null, new_line_count: null, pretty_name: null,
    created_at: '', updated_at: '', on_stages: [], entrance_exits: [], characters: [], songs: [],
  }
}

type SkeletonScene = { id: number; number: number; frenchScenes: Array<{ id: number; number: string }> }
type SkeletonAct = { id: number; number: number; scenes: SkeletonScene[] }

function makeSkeleton(acts: SkeletonAct[]) {
  return {
    id: 1, title: 'Test Play', canonical: true, synopsis: null, text_notes: null,
    production_id: null, author: { id: 1, first_name: 'A', last_name: 'B' },
    characters: [], character_groups: [],
    acts: acts.map(a => ({
      id: a.id, number: a.number, summary: null,
      scenes: a.scenes.map(s => ({
        id: s.id, number: s.number, pretty_name: `${a.number}.${s.number}`,
        heading: null, summary: null,
        french_scenes: s.frenchScenes.map(fs => ({ id: fs.id, number: fs.number })),
      })),
    })),
  }
}

// Play: Act 1 has Scene 1 (fs a,b) and Scene 2 (fs a); Act 2 has Scene 1 (fs a)
const skeleton: SkeletonAct[] = [
  {
    id: 1, number: 1,
    scenes: [
      { id: 10, number: 1, frenchScenes: [{ id: 1, number: 'a' }, { id: 2, number: 'b' }] },
      { id: 11, number: 2, frenchScenes: [{ id: 3, number: 'a' }] },
    ],
  },
  {
    id: 2, number: 2,
    scenes: [
      { id: 20, number: 1, frenchScenes: [{ id: 4, number: 'a' }] },
    ],
  },
]

function setup(frenchSceneId: number, actId: number, sceneId: number, fsNumber: string) {
  mockUseSuspenseQuery.mockImplementation(({ queryKey }: { queryKey: unknown[] }) => {
    if (queryKey[0] === 'french_scenes') return { data: makeFrenchSceneData(frenchSceneId, fsNumber, sceneId) }
    if (queryKey[0] === 'plays') return { data: makeSkeleton(skeleton) }
    throw new Error(`Unexpected queryKey: ${JSON.stringify(queryKey)}`)
  })
  render(<FrenchSceneDetail playId={1} actId={actId} sceneId={sceneId} frenchSceneId={frenchSceneId} />)
}

beforeEach(() => {
  mockUseSuspenseQuery.mockReset()
  mockUseQuery.mockReset().mockReturnValue({ data: undefined })
})

// ── tests ─────────────────────────────────────────────────────────────────────

describe('FrenchSceneDetail — prev/next navigation', () => {
  it('shows both prev and next for a middle french scene', () => {
    setup(2, 1, 10, 'b') // Act 1.1.b — prev=1.1.a, next=1.2.a
    expect(screen.getByText('← French Scene 1.1.a')).toBeInTheDocument()
    expect(screen.getByText('French Scene 1.2.a →')).toBeInTheDocument()
  })

  it('hides prev link for the first french scene of the play', () => {
    setup(1, 1, 10, 'a') // Act 1.1.a — very first
    expect(screen.queryByText(/← French Scene/)).not.toBeInTheDocument()
    expect(screen.getByText('French Scene 1.1.b →')).toBeInTheDocument()
  })

  it('hides next link for the last french scene of the play', () => {
    setup(4, 2, 20, 'a') // Act 2.1.a — very last
    expect(screen.getByText('← French Scene 1.2.a')).toBeInTheDocument()
    expect(screen.queryByText(/French Scene.*→/)).not.toBeInTheDocument()
  })

  it('next from last french scene of a scene crosses into the next scene', () => {
    setup(2, 1, 10, 'b') // Act 1.1.b — last of scene 1.1; next=1.2.a (different scene)
    const nextLink = screen.getByText('French Scene 1.2.a →').closest('a')!
    expect(JSON.parse(nextLink.dataset.params!)).toMatchObject({ frenchSceneId: '3', sceneId: '11', actId: '1' })
  })

  it('next from last french scene of last scene of act 1 crosses into act 2', () => {
    setup(3, 1, 11, 'a') // Act 1.2.a — last of act 1; next=2.1.a (different act!)
    expect(screen.getByText('← French Scene 1.1.b')).toBeInTheDocument()
    const nextLink = screen.getByText('French Scene 2.1.a →').closest('a')!
    expect(JSON.parse(nextLink.dataset.params!)).toMatchObject({ frenchSceneId: '4', sceneId: '20', actId: '2' })
  })
})
