import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

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

const theaters = [
  { id: 10, name: 'City Theater', fake: false },
  { id: 42, name: "Verify's Dream Theater", fake: true },
]

function setup(props: Partial<React.ComponentProps<typeof ProductionForm>> = {}) {
  mockUseAdminTheaterIds.mockReturnValue(null)
  mockUseSuspenseQuery.mockImplementation(({ queryKey }: { queryKey: unknown[] }) => {
    if (queryKey[0] === 'plays') return { data: [] }
    if (queryKey[0] === 'theaters') return { data: theaters }
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

describe('ProductionForm — audition information visibility', () => {
  it('shows audition information by default when creating a production with no theater selected', () => {
    setup()
    expect(screen.getByText('Audition information')).toBeInTheDocument()
  })

  it('hides audition information when creating a production for a fake/dream theater', async () => {
    const user = userEvent.setup()
    setup()
    const theaterSelect = screen.getAllByRole('combobox')[1]
    await user.selectOptions(theaterSelect, "Verify's Dream Theater")
    expect(screen.queryByText('Audition information')).not.toBeInTheDocument()
  })

  it('shows audition information when creating a production for a real theater', async () => {
    const user = userEvent.setup()
    setup()
    const theaterSelect = screen.getAllByRole('combobox')[1]
    await user.selectOptions(theaterSelect, 'City Theater')
    expect(screen.getByText('Audition information')).toBeInTheDocument()
  })

  it('hides audition information when editing a production that belongs to a fake/dream theater', () => {
    const production = {
      id: 1,
      theater_id: 42,
      start_date: null,
      end_date: null,
      lines_per_minute: null,
      audition_information: null,
      created_at: '',
      updated_at: '',
      play: { id: 1, title: 'Hamlet', has_lines: true },
      theater: { id: 42, name: "Verify's Dream Theater", fake: true },
      default_space_id: null,
      default_space: null,
      default_call_users: [],
      default_call_user_ids: [],
      production_phases: [],
    }
    setup({ production })
    expect(screen.queryByText('Audition information')).not.toBeInTheDocument()
  })

  it('shows audition information when editing a production that belongs to a real theater', () => {
    const production = {
      id: 1,
      theater_id: 10,
      start_date: null,
      end_date: null,
      lines_per_minute: null,
      audition_information: null,
      created_at: '',
      updated_at: '',
      play: { id: 1, title: 'Hamlet', has_lines: true },
      theater: { id: 10, name: 'City Theater', fake: false },
      default_space_id: null,
      default_space: null,
      default_call_users: [],
      default_call_user_ids: [],
      production_phases: [],
    }
    setup({ production })
    expect(screen.getByText('Audition information')).toBeInTheDocument()
  })
})
