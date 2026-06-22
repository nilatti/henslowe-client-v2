import { render, screen } from '@testing-library/react'
import IndividualAccount from './IndividualAccount'

// --- hoisted mocks ---

const { mockUseSuspenseQuery } = vi.hoisted(() => ({
  mockUseSuspenseQuery: vi.fn(),
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
}))

vi.mock('../../../hooks/useAuth', () => ({
  useAuth: () => ({
    user: { id: 1, email: 'jane@example.com', first_name: 'Jane', last_name: 'Doe' },
  }),
}))

vi.mock('../api/billing', () => ({
  userSubscriptionsQueryOptions: (userId: number) => ({
    queryKey: ['subscriptions', { userId }],
  }),
  redirectToBillingPortal: vi.fn(),
}))

vi.mock('../../users/api/users', () => ({
  userQueryOptions: (userId: number) => ({ queryKey: ['users', userId] }),
}))

vi.mock('../../../utils/actorUtils', () => ({
  buildUserName: (user: any) => `${user.first_name} ${user.last_name}`,
}))

vi.mock('./SubscriptionItem', () => ({
  default: ({ subscription }: any) => (
    <li data-testid="subscription-item">{subscription.subscription_id}</li>
  ),
}))

// --- fixtures ---

const mockUser = { id: 1, email: 'jane@example.com', first_name: 'Jane', last_name: 'Doe' }

function makeSubscription(overrides: Record<string, unknown> = {}) {
  return {
    subscription_id: 'sub_1',
    status: 'active',
    current_period_start: 1700000000,
    current_period_end: 1702000000,
    cancel_at_period_end: false,
    ...overrides,
  }
}

const productionJob = {
  id: 10,
  production_id: 100,
  theater_id: 5,
  specialization: { title: 'Actor' },
  production: {
    id: 100,
    play: { id: 1, title: 'Hamlet' },
    theater: { id: 5, name: 'City Theater' },
  },
  theater: null,
  character: { name: 'Ophelia' },
  character_group: null,
  start_date: '2025-09-01',
  end_date: '2025-11-30',
  audition_submission: null,
}

const theaterJob = {
  id: 20,
  production_id: null,
  theater_id: 5,
  specialization: { title: 'Board Member' },
  theater: { id: 5, name: 'City Theater' },
  production: null,
  character: null,
  character_group: null,
  start_date: '2024-01-01',
  end_date: null,
  audition_submission: null,
}

const auditionJob = {
  id: 30,
  production_id: 200,
  theater_id: 7,
  specialization: { title: 'Auditioner' },
  production: {
    id: 200,
    play: { id: 2, title: 'The Glass Menagerie' },
    theater: { id: 7, name: 'Riverside Players' },
  },
  theater: null,
  character: null,
  character_group: null,
  start_date: null,
  end_date: null,
  audition_submission: { id: 1, video_url: null, notes: null },
}

function setup({
  subscriptions = [] as ReturnType<typeof makeSubscription>[],
  jobs = [] as typeof productionJob[],
} = {}) {
  mockUseSuspenseQuery.mockImplementation(({ queryKey }: { queryKey: unknown[] }) => {
    if (queryKey[0] === 'subscriptions') return { data: subscriptions }
    if (queryKey[0] === 'users') return { data: { ...mockUser, jobs } }
    throw new Error(`Unexpected queryKey: ${JSON.stringify(queryKey)}`)
  })
  render(<IndividualAccount />)
}

beforeEach(() => {
  mockUseSuspenseQuery.mockReset()
})

// --- tests ---

describe('IndividualAccount', () => {
  describe('user info', () => {
    it('renders the user name and email', () => {
      setup()
      expect(screen.getByText('Jane Doe')).toBeInTheDocument()
      expect(screen.getByText('jane@example.com')).toBeInTheDocument()
    })

    it('links to the user detail page', () => {
      setup()
      const link = screen.getByText(/view and edit your contact info/i)
      expect(link.closest('a')).toHaveAttribute('href', '/users/1')
    })
  })

  describe('subscriptions', () => {
    it('renders subscription items when present', () => {
      setup({ subscriptions: [makeSubscription({ subscription_id: 'sub_abc' })] })
      expect(screen.getByTestId('subscription-item')).toHaveTextContent('sub_abc')
    })

    it('shows sign-up prompt when no subscriptions', () => {
      setup({ subscriptions: [] })
      expect(screen.getByText(/you aren't subscribed/i)).toBeInTheDocument()
      expect(screen.getByRole('link', { name: /sign up now/i })).toHaveAttribute(
        'href',
        '/subscriptions'
      )
    })

    it('shows the update payment button when there is an active subscription', () => {
      setup({ subscriptions: [makeSubscription({ status: 'active' })] })
      expect(
        screen.getByRole('button', { name: /update payment information/i })
      ).toBeInTheDocument()
    })

    it('does not show the update payment button when no active subscription', () => {
      setup({ subscriptions: [makeSubscription({ status: 'canceled' })] })
      expect(
        screen.queryByRole('button', { name: /update payment information/i })
      ).not.toBeInTheDocument()
    })
  })

  describe('productions', () => {
    it('renders a production job with play title and role', () => {
      setup({ jobs: [productionJob] })
      expect(screen.getByText('Hamlet')).toBeInTheDocument()
      expect(screen.getByText(/Actor — Ophelia/)).toBeInTheDocument()
    })

    it('links to the production page', () => {
      setup({ jobs: [productionJob] })
      const link = screen.getByText('Hamlet').closest('a')
      expect(link).toHaveAttribute('href', '/productions/$productionId')
      expect(link).toHaveAttribute(
        'data-params',
        JSON.stringify({ productionId: '100' })
      )
    })

    it('shows the theater name on production jobs', () => {
      setup({ jobs: [productionJob] })
      const link = screen.getByText('Hamlet').closest('a')
      expect(link).toHaveTextContent('City Theater')
    })

    it('shows formatted dates when present', () => {
      setup({ jobs: [productionJob] })
      expect(screen.getByText(/Sep 2025.*Nov 2025/)).toBeInTheDocument()
    })

    it('shows empty state when there are no production jobs', () => {
      setup({ jobs: [] })
      expect(screen.getByText('No productions yet.')).toBeInTheDocument()
    })

    it('does not include auditioner jobs in productions', () => {
      setup({ jobs: [auditionJob] })
      expect(screen.getByText('No productions yet.')).toBeInTheDocument()
    })

    it('shows character group name when no character is set', () => {
      const jobWithGroup = {
        ...productionJob,
        character: null,
        character_group: { name: 'Ensemble' },
      }
      setup({ jobs: [jobWithGroup] })
      expect(screen.getByText(/Actor — Ensemble/)).toBeInTheDocument()
    })
  })

  describe('theaters', () => {
    it('renders a theater job with theater name and role', () => {
      setup({ jobs: [theaterJob] })
      expect(screen.getByText('City Theater')).toBeInTheDocument()
      expect(screen.getByText('Board Member')).toBeInTheDocument()
    })

    it('links to the theater page', () => {
      setup({ jobs: [theaterJob] })
      const link = screen.getByText('City Theater').closest('a')
      expect(link).toHaveAttribute('href', '/theaters/$theaterId')
      expect(link).toHaveAttribute(
        'data-params',
        JSON.stringify({ theaterId: '5' })
      )
    })

    it('shows formatted start date when present', () => {
      setup({ jobs: [theaterJob] })
      expect(screen.getByText(/Jan 2024/)).toBeInTheDocument()
    })

    it('shows empty state when there are no theater jobs', () => {
      setup({ jobs: [] })
      expect(screen.getByText('No theater affiliations yet.')).toBeInTheDocument()
    })

    it('does not include production jobs in theaters', () => {
      setup({ jobs: [productionJob] })
      expect(screen.getByText('No theater affiliations yet.')).toBeInTheDocument()
    })
  })

  describe('auditions', () => {
    it('renders an audition job with play title and theater', () => {
      setup({ jobs: [auditionJob] })
      expect(screen.getByText('The Glass Menagerie')).toBeInTheDocument()
      expect(screen.getByText('Riverside Players')).toBeInTheDocument()
    })

    it('links to the audition detail page', () => {
      setup({ jobs: [auditionJob] })
      const link = screen.getByText('The Glass Menagerie').closest('a')
      expect(link).toHaveAttribute('href', '/auditions/30')
    })

    it('shows empty state with browse link when no auditions', () => {
      setup({ jobs: [] })
      expect(
        screen.getByText(/you haven't submitted any auditions yet/i)
      ).toBeInTheDocument()
      expect(
        screen.getByRole('link', { name: /browse open auditions/i })
      ).toHaveAttribute('href', '/auditions')
    })

    it('does not include non-auditioner jobs in auditions', () => {
      setup({ jobs: [productionJob] })
      expect(
        screen.getByText(/you haven't submitted any auditions yet/i)
      ).toBeInTheDocument()
    })
  })
})
