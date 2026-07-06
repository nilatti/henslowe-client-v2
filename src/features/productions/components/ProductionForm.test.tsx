import { render } from '@testing-library/react'

const { mockUseSuspenseQuery, mockUseQuery, mockUseAdminTheaterIds } = vi.hoisted(() => ({
  mockUseSuspenseQuery: vi.fn(),
  mockUseQuery: vi.fn(),
  mockUseAdminTheaterIds: vi.fn(),
}))

vi.mock('@tanstack/react-query', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@tanstack/react-query')>()
  return { ...actual, useSuspenseQuery: mockUseSuspenseQuery, useQuery: mockUseQuery }
})

vi.mock('../../../hooks/useUserRole', () => ({
  useAdminTheaterIds: mockUseAdminTheaterIds,
}))

vi.mock('../api/productions', () => ({
  useCreateProduction: () => ({ mutateAsync: vi.fn() }),
  useUpdateProduction: () => ({ mutateAsync: vi.fn() }),
}))

vi.mock('../../plays/api/plays', () => ({
  canonicalPlaysQueryOptions: () => ({ queryKey: ['plays', 'canonical'] }),
}))

vi.mock('../../theaters/api/theaters', () => ({
  theatersQueryOptions: () => ({ queryKey: ['theaters'] }),
  theaterSkeletonQueryOptions: (id: number) => ({ queryKey: ['theaters', id, 'skeleton'] }),
}))

vi.mock('../../jobs/api/jobs', () => ({
  productionJobsQueryOptions: (id: number) => ({ queryKey: ['jobs', 'production', id] }),
}))

import { ProductionForm } from './ProductionForm'

const noop = () => {}

function setup(props: Partial<React.ComponentProps<typeof ProductionForm>> = {}) {
  mockUseAdminTheaterIds.mockReturnValue(null)
  mockUseSuspenseQuery.mockImplementation(({ queryKey }: { queryKey: unknown[] }) => {
    if (queryKey[0] === 'plays') return { data: [] }
    if (queryKey[0] === 'theaters') return { data: [] }
    throw new Error(`Unexpected suspense queryKey: ${JSON.stringify(queryKey)}`)
  })
  mockUseQuery.mockReturnValue({ data: undefined })
  return render(<ProductionForm onSuccess={noop} onCancel={noop} {...props} />)
}

function theaterSkeletonCall() {
  return mockUseQuery.mock.calls.find(([opts]) => opts.queryKey[0] === 'theaters')?.[0]
}

beforeEach(() => {
  mockUseSuspenseQuery.mockReset()
  mockUseQuery.mockReset()
  mockUseAdminTheaterIds.mockReset()
})

describe('ProductionForm — theater skeleton query', () => {
  it('disables the skeleton fetch when creating a production with no theater context yet, so it never hits theaters/0/theater_skeleton', () => {
    setup()
    const call = theaterSkeletonCall()
    expect(call.enabled).toBe(false)
  })

  it('fetches the dream theater skeleton using defaultTheaterId when creating a new production', () => {
    setup({ defaultTheaterId: 42 })
    const call = theaterSkeletonCall()
    expect(call.queryKey).toEqual(['theaters', 42, 'skeleton'])
    expect(call.enabled).toBe(true)
  })

  it('fetches the skeleton for the production\'s own theater when editing an existing production', () => {
    const production = {
      id: 1,
      theater_id: 7,
      start_date: null,
      end_date: null,
      lines_per_minute: null,
      audition_information: null,
      created_at: '',
      updated_at: '',
      play: { id: 1, title: 'Hamlet', has_lines: true },
      theater: { id: 7, name: 'City Theater' },
      default_space_id: null,
      default_space: null,
      default_call_users: [],
      default_call_user_ids: [],
      production_phases: [],
    }
    setup({ production, defaultTheaterId: 42 })
    const call = theaterSkeletonCall()
    expect(call.queryKey).toEqual(['theaters', 7, 'skeleton'])
    expect(call.enabled).toBe(true)
  })
})
