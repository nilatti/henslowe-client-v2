import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'

const { mockUseSuspenseQuery, mockUseQuery, mockUseIsPlayAdmin } = vi.hoisted(() => ({
  mockUseSuspenseQuery: vi.fn(),
  mockUseQuery: vi.fn(),
  mockUseIsPlayAdmin: vi.fn(),
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

vi.mock('../api/plays', () => ({
  playSkeletonQueryOptions: (id: number) => ({ queryKey: ['plays', id, 'skeleton'] }),
  useDeletePlay: () => ({ mutateAsync: vi.fn() }),
}))

vi.mock('../../productions/api/productions', () => ({
  productionSkeletonQueryOptions: (id: number) => ({ queryKey: ['productions', id, 'skeleton'] }),
}))

vi.mock('../../../hooks/useUserRole', () => ({
  useIsPlayAdmin: mockUseIsPlayAdmin,
}))

vi.mock('./PlayForm', () => ({ PlayForm: () => null }))
vi.mock('../../script/components/Characters/CharactersBreakdown', () => ({ default: () => null }))
vi.mock('../../acts/components/ActsTab', () => ({ ActsTab: () => null }))

import { PlayDetail } from './PlayDetail'

function makePlaySkeleton(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: 1,
    title: 'Test Play',
    canonical: true,
    synopsis: null,
    text_notes: null,
    production_id: null,
    author: { id: 1, first_name: 'A', last_name: 'B' },
    characters: [],
    character_groups: [],
    acts: [],
    productions: [],
    ...overrides,
  }
}

function setup(play: ReturnType<typeof makePlaySkeleton>, productionSkeleton?: unknown) {
  mockUseIsPlayAdmin.mockReturnValue(false)
  mockUseSuspenseQuery.mockImplementation(({ queryKey }: { queryKey: unknown[] }) => {
    if (queryKey[0] === 'plays') return { data: play }
    throw new Error(`Unexpected suspense queryKey: ${JSON.stringify(queryKey)}`)
  })
  mockUseQuery.mockImplementation(({ queryKey }: { queryKey: unknown[] }) => {
    if (queryKey[0] === 'productions') return { data: productionSkeleton }
    throw new Error(`Unexpected queryKey: ${JSON.stringify(queryKey)}`)
  })
  return render(<PlayDetail playId={play.id} />)
}

beforeEach(() => {
  mockUseSuspenseQuery.mockReset()
  mockUseQuery.mockReset()
  mockUseIsPlayAdmin.mockReset()
})

describe('PlayDetail — canonical play productions list', () => {
  it('lists each real production as "[theater name], [year]"', () => {
    const play = makePlaySkeleton({
      canonical: true,
      productions: [
        { id: 10, start_date: '2024-03-01', end_date: '2024-04-01', theater: { id: 1, name: 'City Theater' } },
      ],
    })
    setup(play)
    expect(screen.getByText('Productions (1)')).toBeInTheDocument()
    expect(screen.getByText('City Theater, 2024')).toBeInTheDocument()
  })

  it('falls back to theater name alone when the production has no dates', () => {
    const play = makePlaySkeleton({
      canonical: true,
      productions: [{ id: 10, start_date: null, end_date: null, theater: { id: 1, name: 'City Theater' } }],
    })
    setup(play)
    expect(screen.getByText('City Theater')).toBeInTheDocument()
  })

  it('shows an empty message when a canonical play has no productions', () => {
    const play = makePlaySkeleton({ canonical: true, productions: [] })
    setup(play)
    expect(screen.getByText('No productions yet.')).toBeInTheDocument()
  })

  it('does not render a productions list for a non-canonical play', () => {
    const play = makePlaySkeleton({ canonical: false, productions: [] })
    setup(play)
    expect(screen.queryByText(/^Productions \(/)).not.toBeInTheDocument()
  })
})

describe('PlayDetail — production copy theater/year', () => {
  it('shows "[theater name], [year]" for the linked production', () => {
    const play = makePlaySkeleton({
      canonical: false,
      production_id: 7,
      productions: [],
    })
    setup(play, { theater: { id: 1, name: 'City Theater' }, start_date: '2023-01-01', end_date: '2023-06-01' })
    expect(screen.getByText('City Theater, 2023')).toBeInTheDocument()
  })

  it('shows just the theater name while the production is still loading', () => {
    const play = makePlaySkeleton({
      canonical: false,
      production_id: 7,
      productions: [],
    })
    setup(play, undefined)
    expect(screen.getByText('View production')).toBeInTheDocument()
  })
})
