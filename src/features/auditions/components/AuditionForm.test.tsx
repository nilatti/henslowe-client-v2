import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

const { mockUseSuspenseQuery, mockUseAuth, mockCreateJob, mockUpdateContact } = vi.hoisted(() => ({
  mockUseSuspenseQuery: vi.fn(),
  mockUseAuth: vi.fn(),
  mockCreateJob: vi.fn().mockResolvedValue({}),
  mockUpdateContact: vi.fn().mockResolvedValue({}),
}))

vi.mock('@tanstack/react-query', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@tanstack/react-query')>()
  return { ...actual, useSuspenseQuery: mockUseSuspenseQuery }
})

vi.mock('@tanstack/react-router', () => ({
  useNavigate: () => vi.fn(),
}))

vi.mock('../../../hooks/useAuth', () => ({
  useAuth: mockUseAuth,
}))

vi.mock('../../users/api/users', () => ({
  userQueryOptions: (userId: number) => ({ queryKey: ['users', userId] }),
}))

vi.mock('../api/auditions', () => ({
  useCreateAuditionerJob: () => ({ mutateAsync: mockCreateJob }),
  useUpdateAuditionerContact: () => ({ mutateAsync: mockUpdateContact }),
}))

vi.mock('../../conflicts/components/ConflictsManager', () => ({
  ConflictsManager: () => <div data-testid="conflicts-manager" />,
}))

vi.mock('../../users/components/HeadshotUpload', () => ({
  HeadshotUpload: ({ userId, currentUrl }: { userId: number; currentUrl: string | null | undefined }) => (
    <div data-testid="headshot-upload" data-user-id={userId} data-current-url={currentUrl ?? ''} />
  ),
}))

vi.mock('../../users/components/ResumeUpload', () => ({
  ResumeUpload: ({ userId, currentUrl }: { userId: number; currentUrl: string | null | undefined }) => (
    <div data-testid="resume-upload" data-user-id={userId} data-current-url={currentUrl ?? ''} />
  ),
}))

import { AuditionForm } from './AuditionForm'

const profile = {
  id: 1,
  first_name: 'Jane',
  middle_name: null,
  last_name: 'Doe',
  email: 'jane@example.com',
  phone_number: '555-1234',
  website: null,
  street_address: null,
  city: null,
  state: null,
  zip: null,
  gender: null,
  timezone: null,
  bio: null,
  emergency_contact_name: null,
  emergency_contact_number: null,
  headshot_url: 'https://example.com/headshot.png',
  resume_url: 'https://example.com/resume.pdf',
  jobs: [],
}

const defaultProps = {
  productionId: 5,
  playTitle: 'Hamlet',
  theaterName: 'City Theater',
  rehearsalStartDate: null,
  runEndDate: null,
}

function setup(profileOverrides: Partial<typeof profile> = {}) {
  mockUseAuth.mockReturnValue({ user: { id: 1 } })
  mockUseSuspenseQuery.mockImplementation(({ queryKey }: { queryKey: unknown[] }) => {
    if (queryKey[0] === 'users') return { data: { ...profile, ...profileOverrides } }
    throw new Error(`Unexpected queryKey: ${JSON.stringify(queryKey)}`)
  })
  return render(<AuditionForm {...defaultProps} />)
}

beforeEach(() => {
  mockCreateJob.mockClear()
  mockUpdateContact.mockClear()
  mockUseSuspenseQuery.mockReset()
  mockUseAuth.mockReset()
})

describe('AuditionForm — headshot and resume', () => {
  it('renders a headshot upload field labeled "Headshot"', () => {
    setup()
    const label = screen.getByText('Headshot')
    expect(label.tagName).toBe('LABEL')
  })

  it('renders a resume upload field labeled "Resume"', () => {
    setup()
    const label = screen.getByText('Resume')
    expect(label.tagName).toBe('LABEL')
  })

  it('passes the current user id and existing headshot_url to HeadshotUpload', () => {
    setup()
    const el = screen.getByTestId('headshot-upload')
    expect(el).toHaveAttribute('data-user-id', '1')
    expect(el).toHaveAttribute('data-current-url', 'https://example.com/headshot.png')
  })

  it('passes the current user id and existing resume_url to ResumeUpload', () => {
    setup()
    const el = screen.getByTestId('resume-upload')
    expect(el).toHaveAttribute('data-user-id', '1')
    expect(el).toHaveAttribute('data-current-url', 'https://example.com/resume.pdf')
  })

  it('passes an empty current url when the profile has no headshot or resume yet', () => {
    setup({ headshot_url: null, resume_url: null })
    expect(screen.getByTestId('headshot-upload')).toHaveAttribute('data-current-url', '')
    expect(screen.getByTestId('resume-upload')).toHaveAttribute('data-current-url', '')
  })
})

describe('AuditionForm — submission still works', () => {
  it('pre-fills the phone number from the profile', () => {
    setup()
    expect(screen.getByDisplayValue('555-1234')).toBeInTheDocument()
  })

  it('submits the audition and shows the confirmation message', async () => {
    const user = userEvent.setup()
    setup()
    await user.click(screen.getByRole('button', { name: /submit audition/i }))

    await waitFor(() => expect(mockCreateJob).toHaveBeenCalledOnce())
    expect(screen.getByText(/you're signed up to audition/i)).toBeInTheDocument()
  })

  it('sends the prefilled contact fields along with the submission', async () => {
    const user = userEvent.setup()
    setup()
    await user.click(screen.getByRole('button', { name: /submit audition/i }))

    await waitFor(() => expect(mockUpdateContact).toHaveBeenCalledOnce())
    expect(mockUpdateContact.mock.calls[0][0]).toMatchObject({ phone_number: '555-1234' })
  })
})
