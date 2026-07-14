import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'

const { mockUseSuspenseQuery, mockUseQuery } = vi.hoisted(() => ({
  mockUseSuspenseQuery: vi.fn(),
  mockUseQuery: vi.fn(),
}))

vi.mock('@tanstack/react-query', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@tanstack/react-query')>()
  return {
    ...actual,
    useSuspenseQuery: mockUseSuspenseQuery,
    useQuery: mockUseQuery,
  }
})

vi.mock('@tanstack/react-router', () => ({
  Link: ({ children, to, params, className }: any) => (
    <a href={`${to}?${JSON.stringify(params)}`} className={className}>
      {children}
    </a>
  ),
}))

import { DoublingChartContainer } from './DoublingChartContainer'

const production = {
  id: 1,
  theater_id: 1,
  play: { id: 10, title: 'Hamlet', canonical: false },
  play_id: 10,
}

const hamlet = {
  id: 1,
  user_id: 100,
  user: { id: 100, first_name: 'Jane', last_name: 'Doe', email: 'jane@test.com', fake: false },
  specialization_id: 2,
  specialization: { title: 'Actor' },
  character_id: 1,
  character_group_id: null,
  character: { id: 1, name: 'Hamlet', new_line_count: 120, original_line_count: 100 },
  character_group: null,
}

const ghost = {
  id: 2,
  user_id: 100,
  user: { id: 100, first_name: 'Jane', last_name: 'Doe', email: 'jane@test.com', fake: false },
  specialization_id: 2,
  specialization: { title: 'Actor' },
  character_id: 2,
  character_group_id: null,
  character: { id: 2, name: 'Ghost', new_line_count: 10, original_line_count: 10 },
  character_group: null,
}

const guards = {
  id: 3,
  user_id: 100,
  user: { id: 100, first_name: 'Jane', last_name: 'Doe', email: 'jane@test.com', fake: false },
  specialization_id: 2,
  specialization: { title: 'Actor' },
  character_id: null,
  character_group_id: 50,
  character: null,
  character_group: { id: 50, name: 'Guards' },
}

const jobs = [hamlet, ghost, guards]

beforeEach(() => {
  vi.clearAllMocks()
  mockUseSuspenseQuery.mockImplementation((opts: { queryKey: unknown[] }) => {
    const key = opts.queryKey[0]
    if (key === 'productions') return { data: production }
    if (key === 'jobs') return { data: jobs }
    return { data: undefined }
  })
  mockUseQuery.mockReturnValue({ data: { id: 10, title: 'Hamlet', acts: [] } })
})

vi.mock('../api/productions', () => ({
  productionSkeletonQueryOptions: () => ({ queryKey: ['productions', 1, 'skeleton'] }),
}))
vi.mock('../../jobs/api/jobs', () => ({
  productionJobsQueryOptions: () => ({ queryKey: ['jobs', { productionId: 1 }] }),
}))
vi.mock('../../script/api/script', () => ({
  playScriptQueryOptions: () => ({ queryKey: ['plays', 10, 'script'] }),
}))

describe('DoublingChartContainer casting summary', () => {
  it('shows a total line count next to the actor name', () => {
    render(<DoublingChartContainer productionId={1} />)
    // Jane Doe plays Hamlet (120 lines) + Ghost (10 lines) = 130
    expect(screen.getByText('(130 lines)')).toBeInTheDocument()
  })

  it('shows a line count next to each character name', () => {
    render(<DoublingChartContainer productionId={1} />)
    expect(screen.getByText('(120 lines)')).toBeInTheDocument()
    expect(screen.getByText('(10 lines)')).toBeInTheDocument()
  })

  it('does not show a line count for a character group', () => {
    render(<DoublingChartContainer productionId={1} />)
    const guardsLink = screen.getByText('Guards')
    expect(guardsLink.parentElement?.textContent).toBe('Guards')
  })

  it('makes the character group name a link, like character names', () => {
    render(<DoublingChartContainer productionId={1} />)
    const guardsLink = screen.getByText('Guards').closest('a')
    expect(guardsLink).not.toBeNull()
    expect(guardsLink?.getAttribute('href')).toContain('"characterId":"50"')

    const hamletLink = screen.getByText('Hamlet').closest('a')
    expect(hamletLink?.getAttribute('href')).toContain('"characterId":"1"')
  })
})
