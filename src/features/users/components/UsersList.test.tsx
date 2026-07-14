import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

const { mockUseSuspenseQuery, mockUseIsSuperAdmin } = vi.hoisted(() => ({
  mockUseSuspenseQuery: vi.fn(),
  mockUseIsSuperAdmin: vi.fn(),
}))

vi.mock('@tanstack/react-query', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@tanstack/react-query')>()
  return { ...actual, useSuspenseQuery: mockUseSuspenseQuery }
})

vi.mock('@tanstack/react-router', () => ({
  Link: ({ children, to, params, className }: any) => (
    <a href={to} data-params={JSON.stringify(params ?? {})} className={className}>
      {children}
    </a>
  ),
  useNavigate: () => vi.fn(),
}))

const { mockMutateOverride } = vi.hoisted(() => ({ mockMutateOverride: vi.fn() }))

vi.mock('../api/users', () => ({
  usersQueryOptions: () => ({ queryKey: ['users'] }),
  useDeleteUser: () => ({ mutateAsync: vi.fn() }),
  useUpdatePaidOverride: () => ({ mutate: mockMutateOverride }),
}))

vi.mock('../../../hooks/useUserRole', () => ({
  useIsSuperAdmin: mockUseIsSuperAdmin,
}))

vi.mock('../../../components/ui', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../../components/ui')>()
  return {
    ...actual,
    Button: ({ children, onClick }: any) => <button onClick={onClick}>{children}</button>,
    ConfirmDialog: () => null,
    PageHeader: ({ title, action }: any) => (
      <div>
        <h1>{title}</h1>
        {action}
      </div>
    ),
  }
})

vi.mock('../../../utils/actorUtils', () => ({
  buildUserName: (user: any) =>
    user.preferred_name
      ? `${user.preferred_name} ${user.last_name}`
      : `${user.first_name} ${user.last_name}`,
}))

import { UsersList } from './UsersList'

// ── fixtures ───────────────────────────────────────────────────────────────────

const alice = { id: 1, first_name: 'Alice', last_name: 'Smith', preferred_name: null, email: 'alice@example.com' }
const bob   = { id: 2, first_name: 'Robert', last_name: 'Jones', preferred_name: 'Bob', email: 'robert@example.com' }
const diana = { id: 3, first_name: 'Diana', last_name: 'Brown', preferred_name: null, email: 'diana@theater.org' }
const fake  = { id: 4, first_name: 'Fake', last_name: 'Actor', preferred_name: null, email: 'fake@fake.com', fake: true }

function setup(users = [alice, bob, diana, fake]) {
  mockUseSuspenseQuery.mockReturnValue({ data: users })
  render(<UsersList />)
  return screen.getByPlaceholderText(/search/i)
}

beforeEach(() => {
  mockUseSuspenseQuery.mockReset()
  mockUseIsSuperAdmin.mockReturnValue(false)
  mockMutateOverride.mockReset()
})

// ── initial render ─────────────────────────────────────────────────────────────

describe('UsersList initial render', () => {
  it('renders all non-fake users', () => {
    setup()
    expect(screen.getByText('Alice Smith')).toBeInTheDocument()
    expect(screen.getByText('Bob Jones')).toBeInTheDocument()
    expect(screen.getByText('Diana Brown')).toBeInTheDocument()
  })

  it('excludes fake users', () => {
    setup()
    expect(screen.queryByText('Fake Actor')).not.toBeInTheDocument()
  })

  it('renders the search input', () => {
    setup()
    expect(screen.getByPlaceholderText(/search/i)).toBeInTheDocument()
  })
})

// ── search filtering ───────────────────────────────────────────────────────────

describe('UsersList search filtering', () => {
  it('filters by first name', () => {
    const input = setup()
    fireEvent.change(input, { target: { value: 'alice' } })
    expect(screen.getByText('Alice Smith')).toBeInTheDocument()
    expect(screen.queryByText('Bob Jones')).not.toBeInTheDocument()
    expect(screen.queryByText('Diana Brown')).not.toBeInTheDocument()
  })

  it('filters by last name', () => {
    const input = setup()
    fireEvent.change(input, { target: { value: 'Brown' } })
    expect(screen.getByText('Diana Brown')).toBeInTheDocument()
    expect(screen.queryByText('Alice Smith')).not.toBeInTheDocument()
    expect(screen.queryByText('Bob Jones')).not.toBeInTheDocument()
  })

  it('filters by preferred name', () => {
    const input = setup()
    fireEvent.change(input, { target: { value: 'Bob' } })
    // Robert Jones has preferred_name "Bob"
    expect(screen.getByText('Bob Jones')).toBeInTheDocument()
    expect(screen.queryByText('Alice Smith')).not.toBeInTheDocument()
  })

  it('filters by email', () => {
    const input = setup()
    fireEvent.change(input, { target: { value: 'theater.org' } })
    expect(screen.getByText('Diana Brown')).toBeInTheDocument()
    expect(screen.queryByText('Alice Smith')).not.toBeInTheDocument()
    expect(screen.queryByText('Bob Jones')).not.toBeInTheDocument()
  })

  it('is case-insensitive', () => {
    const input = setup()
    fireEvent.change(input, { target: { value: 'ALICE' } })
    expect(screen.getByText('Alice Smith')).toBeInTheDocument()
    expect(screen.queryByText('Diana Brown')).not.toBeInTheDocument()
  })

  it('shows all users when search is cleared', () => {
    const input = setup()
    fireEvent.change(input, { target: { value: 'alice' } })
    fireEvent.change(input, { target: { value: '' } })
    expect(screen.getByText('Alice Smith')).toBeInTheDocument()
    expect(screen.getByText('Bob Jones')).toBeInTheDocument()
    expect(screen.getByText('Diana Brown')).toBeInTheDocument()
  })

  it('shows the no-match message when nothing matches', () => {
    const input = setup()
    fireEvent.change(input, { target: { value: 'zzznomatch' } })
    expect(screen.getByText(/no users match your search/i)).toBeInTheDocument()
  })

  it('does not show the no-match message when there are results', () => {
    const input = setup()
    fireEvent.change(input, { target: { value: 'alice' } })
    expect(screen.queryByText(/no users match/i)).not.toBeInTheDocument()
  })

  it('does not show a match-specific message on empty search with no users', () => {
    mockUseSuspenseQuery.mockReturnValue({ data: [] })
    render(<UsersList />)
    expect(screen.getByText(/no users found/i)).toBeInTheDocument()
    expect(screen.queryByText(/no users match/i)).not.toBeInTheDocument()
  })
})

// ── paid override column (superadmin only) ─────────────────────────────────────

describe('UsersList paid override column', () => {
  const withOverride = { ...alice, id: 10, paid_override: true,  subscription_status: 'never subscribed' }
  const withSub      = { ...bob,   id: 11, paid_override: false, subscription_status: 'active' }
  const withNeither  = { ...diana, id: 12, paid_override: false, subscription_status: 'never subscribed' }

  it('does not show paid override column for non-superadmins', () => {
    mockUseSuspenseQuery.mockReturnValue({ data: [withNeither] })
    render(<UsersList />)
    expect(screen.queryByRole('switch')).not.toBeInTheDocument()
  })

  it('shows paid override toggle for each user when superadmin', () => {
    mockUseIsSuperAdmin.mockReturnValue(true)
    mockUseSuspenseQuery.mockReturnValue({ data: [withOverride, withNeither] })
    render(<UsersList />)
    const toggles = screen.getAllByRole('switch')
    expect(toggles.length).toBe(2)
  })

  it('shows "override" label for user with paid_override and no active subscription', () => {
    mockUseIsSuperAdmin.mockReturnValue(true)
    mockUseSuspenseQuery.mockReturnValue({ data: [withOverride] })
    render(<UsersList />)
    expect(screen.getByText('override')).toBeInTheDocument()
  })

  it('shows "subscribed" label for user with active subscription', () => {
    mockUseIsSuperAdmin.mockReturnValue(true)
    mockUseSuspenseQuery.mockReturnValue({ data: [withSub] })
    render(<UsersList />)
    expect(screen.getByText('subscribed')).toBeInTheDocument()
  })

  it('hides the toggle for a user with an active subscription', () => {
    mockUseIsSuperAdmin.mockReturnValue(true)
    mockUseSuspenseQuery.mockReturnValue({ data: [withSub] })
    render(<UsersList />)
    expect(screen.queryByRole('switch')).not.toBeInTheDocument()
  })

  it('shows "free" label for user with neither', () => {
    mockUseIsSuperAdmin.mockReturnValue(true)
    mockUseSuspenseQuery.mockReturnValue({ data: [withNeither] })
    render(<UsersList />)
    expect(screen.getByText('free')).toBeInTheDocument()
  })

  it('calls updatePaidOverride when the toggle is clicked', async () => {
    mockUseIsSuperAdmin.mockReturnValue(true)
    mockUseSuspenseQuery.mockReturnValue({ data: [withNeither] })
    const ue = userEvent.setup()
    render(<UsersList />)
    await ue.click(screen.getByRole('switch'))
    expect(mockMutateOverride).toHaveBeenCalledWith({ id: withNeither.id, paid_override: true })
  })

  it('toggles paid_override off when already enabled', async () => {
    mockUseIsSuperAdmin.mockReturnValue(true)
    mockUseSuspenseQuery.mockReturnValue({ data: [withOverride] })
    const ue = userEvent.setup()
    render(<UsersList />)
    await ue.click(screen.getByRole('switch'))
    expect(mockMutateOverride).toHaveBeenCalledWith({ id: withOverride.id, paid_override: false })
  })
})
