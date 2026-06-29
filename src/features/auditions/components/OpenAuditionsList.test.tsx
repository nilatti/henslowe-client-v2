import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { OpenAuditionsList } from './OpenAuditionsList'

// --- hoisted mocks ---

const { mockNavigate, mockUseSuspenseQuery, mockUseAuth } = vi.hoisted(() => ({
  mockNavigate: vi.fn(),
  mockUseSuspenseQuery: vi.fn(),
  mockUseAuth: vi.fn(),
}))

vi.mock('@tanstack/react-query', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@tanstack/react-query')>()
  return { ...actual, useSuspenseQuery: mockUseSuspenseQuery }
})

vi.mock('@tanstack/react-router', () => ({
  useNavigate: () => mockNavigate,
}))

vi.mock('../../../hooks/useAuth', () => ({
  useAuth: mockUseAuth,
}))

vi.mock('../api/auditions', () => ({
  openAuditionsQueryOptions: () => ({ queryKey: ['open_auditions'] }),
}))

vi.mock('../../users/api/users', () => ({
  userQueryOptions: (userId: number) => ({ queryKey: ['users', userId] }),
}))

// --- fixtures ---

const openAudition = {
  production_id: 5,
  play_title: 'Hamlet',
  theater_name: 'City Theater',
  theater_city: 'Portland',
  theater_state: 'OR',
  audition_start_date: '2026-07-01',
  audition_end_date: '2026-07-15',
  rehearsal_start_date: null,
  run_end_date: null,
}

const auditionerJobForProduction = {
  id: 42,
  production_id: 5,
  specialization: { title: 'Auditioner' },
  audition_submission: null,
}

const auditionerJobWithVideo = {
  ...auditionerJobForProduction,
  audition_submission: { video_url: 'https://youtu.be/abc', notes: null },
}

function setupUnauthenticated(auditions = [openAudition]) {
  mockUseAuth.mockReturnValue({ isAuthenticated: false, user: null })
  mockUseSuspenseQuery.mockImplementation(({ queryKey }: { queryKey: unknown[] }) => {
    if (queryKey[0] === 'open_auditions') return { data: auditions }
    throw new Error(`Unexpected queryKey: ${JSON.stringify(queryKey)}`)
  })
  render(<OpenAuditionsList />)
}

function setupAuthenticated(auditions = [openAudition], jobs: typeof auditionerJobForProduction[] = []) {
  mockUseAuth.mockReturnValue({ isAuthenticated: true, user: { id: 1 } })
  mockUseSuspenseQuery.mockImplementation(({ queryKey }: { queryKey: unknown[] }) => {
    if (queryKey[0] === 'open_auditions') return { data: auditions }
    if (queryKey[0] === 'users') return { data: { id: 1, jobs } }
    throw new Error(`Unexpected queryKey: ${JSON.stringify(queryKey)}`)
  })
  render(<OpenAuditionsList />)
}

beforeEach(() => {
  mockNavigate.mockReset()
  mockUseSuspenseQuery.mockReset()
  mockUseAuth.mockReset()
  localStorage.clear()
})

// --- tests ---

describe('OpenAuditionsList', () => {
  describe('empty state', () => {
    it('shows message when no auditions are open', () => {
      setupAuthenticated([])
      expect(
        screen.getByText(/no productions are currently holding open auditions/i)
      ).toBeInTheDocument()
    })
  })

  describe('production info', () => {
    it('shows the play title', () => {
      setupAuthenticated()
      expect(screen.getByText('Hamlet')).toBeInTheDocument()
    })

    it('shows the theater name and location', () => {
      setupAuthenticated()
      expect(screen.getByText(/City Theater/)).toBeInTheDocument()
      expect(screen.getByText(/Portland, OR/)).toBeInTheDocument()
    })

    it('shows the audition date range', () => {
      setupAuthenticated()
      expect(screen.getByText(/Auditions:/)).toBeInTheDocument()
    })

    it('falls back to "Untitled Production" when play title is null', () => {
      setupAuthenticated([{ ...openAudition, play_title: null }])
      expect(screen.getByText('Untitled Production')).toBeInTheDocument()
    })
  })

  describe('unauthenticated user', () => {
    it('shows the Audition button', () => {
      setupUnauthenticated()
      expect(screen.getByRole('button', { name: 'Audition' })).toBeInTheDocument()
    })

    it('stores /auditions/apply/:productionId in localStorage on click', async () => {
      const user = userEvent.setup()
      // prevent jsdom from throwing on href assignment
      Object.defineProperty(window, 'location', {
        value: { href: '' },
        writable: true,
      })
      setupUnauthenticated()
      await user.click(screen.getByRole('button', { name: 'Audition' }))
      expect(localStorage.getItem('redirect_after_login')).toBe('/auditions/apply/5')
    })

    it('does not navigate via router on click', async () => {
      const user = userEvent.setup()
      Object.defineProperty(window, 'location', { value: { href: '' }, writable: true })
      setupUnauthenticated()
      await user.click(screen.getByRole('button', { name: 'Audition' }))
      expect(mockNavigate).not.toHaveBeenCalled()
    })
  })

  describe('authenticated user — not yet applied', () => {
    it('shows the Audition button', () => {
      setupAuthenticated()
      expect(screen.getByRole('button', { name: 'Audition' })).toBeInTheDocument()
    })

    it('does not show the Applied badge', () => {
      setupAuthenticated()
      expect(screen.queryByText('Applied')).not.toBeInTheDocument()
    })

    it('navigates to /auditions/apply/$productionId on click', async () => {
      const user = userEvent.setup()
      setupAuthenticated()
      await user.click(screen.getByRole('button', { name: 'Audition' }))
      expect(mockNavigate).toHaveBeenCalledWith({
        to: '/auditions/apply/$productionId',
        params: { productionId: '5' },
      })
    })

    it('does not set redirect_after_login in localStorage', async () => {
      const user = userEvent.setup()
      setupAuthenticated()
      await user.click(screen.getByRole('button', { name: 'Audition' }))
      expect(localStorage.getItem('redirect_after_login')).toBeNull()
    })
  })

  describe('authenticated user — already applied', () => {
    it('shows the Applied badge', () => {
      setupAuthenticated([openAudition], [auditionerJobForProduction])
      expect(screen.getByText('Applied')).toBeInTheDocument()
    })

    it('shows the Update button instead of Audition', () => {
      setupAuthenticated([openAudition], [auditionerJobForProduction])
      expect(screen.getByRole('button', { name: 'Update' })).toBeInTheDocument()
      expect(screen.queryByRole('button', { name: 'Audition' })).not.toBeInTheDocument()
    })

    it('navigates to /auditions/apply/$productionId on Update click', async () => {
      const user = userEvent.setup()
      setupAuthenticated([openAudition], [auditionerJobForProduction])
      await user.click(screen.getByRole('button', { name: 'Update' }))
      expect(mockNavigate).toHaveBeenCalledWith({
        to: '/auditions/apply/$productionId',
        params: { productionId: '5' },
      })
    })

    it('shows a video link when a video URL has been submitted', () => {
      setupAuthenticated([openAudition], [auditionerJobWithVideo])
      const link = screen.getByRole('link', { name: /view submitted video/i })
      expect(link).toHaveAttribute('href', 'https://youtu.be/abc')
    })

    it('does not show a video link when no video has been submitted', () => {
      setupAuthenticated([openAudition], [auditionerJobForProduction])
      expect(screen.queryByRole('link', { name: /view submitted video/i })).not.toBeInTheDocument()
    })
  })

  describe('multiple productions', () => {
    const anotherAudition = {
      production_id: 9,
      play_title: 'Macbeth',
      theater_name: 'River Stage',
      theater_city: null,
      theater_state: null,
      audition_start_date: null,
      audition_end_date: null,
      rehearsal_start_date: null,
      run_end_date: null,
    }
    const jobForOther = { id: 99, production_id: 9, specialization: { title: 'Auditioner' }, audition_submission: null }

    it('shows Applied only for productions where the user has applied', () => {
      setupAuthenticated([openAudition, anotherAudition], [auditionerJobForProduction])
      const badges = screen.getAllByText('Applied')
      expect(badges).toHaveLength(1)
      expect(screen.getByRole('button', { name: 'Audition' })).toBeInTheDocument()
    })

    it('routes to the correct productionId for each row', async () => {
      const user = userEvent.setup()
      setupAuthenticated([openAudition, anotherAudition], [jobForOther])
      // First production (Hamlet, id=5) — not applied
      const buttons = screen.getAllByRole('button')
      const hamletBtn = buttons.find(b => b.textContent === 'Audition')!
      await user.click(hamletBtn)
      expect(mockNavigate).toHaveBeenCalledWith({
        to: '/auditions/apply/$productionId',
        params: { productionId: '5' },
      })
    })
  })
})
