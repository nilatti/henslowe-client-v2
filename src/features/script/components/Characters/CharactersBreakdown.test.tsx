import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

// ─── module mocks ─────────────────────────────────────────────────────────────

const { mockUseSuspenseQuery } = vi.hoisted(() => ({ mockUseSuspenseQuery: vi.fn() }))
vi.mock('@tanstack/react-query', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@tanstack/react-query')>()
  return { ...actual, useSuspenseQuery: mockUseSuspenseQuery }
})

vi.mock('../../../plays/api/plays', () => ({
  playQueryOptions: vi.fn(() => ({ queryKey: ['play-test'], queryFn: vi.fn() })),
}))

// Stub sub-components that have their own complex dependencies
vi.mock('./CharacterInfoTab', () => ({
  default: () => <div data-testid="character-info-tab" />,
}))
vi.mock('./NewCharacterForm', () => ({
  default: () => <div data-testid="new-character-form" />,
}))
vi.mock('./CharacterMatrixChart', () => ({
  CharacterMatrixChart: () => <div data-testid="character-matrix-chart" />,
}))

// Link is used in the non-embedded header; stub it to avoid RouterProvider
vi.mock('@tanstack/react-router', () => ({
  Link: ({ children }: { children: React.ReactNode }) => <span>{children}</span>,
}))

import CharactersBreakdown from './CharactersBreakdown'

// ─── shared test data ─────────────────────────────────────────────────────────

const mockPlay: any = {
  id: 1,
  title: 'Hamlet',
  canonical: false,
  author: { id: 1, first_name: 'William', last_name: 'Shakespeare' },
  characters: [
    { id: 1, name: 'Hamlet', age: null, gender: null, description: null, play_id: 1, lines: [], character_group_id: null, original_line_count: null, new_line_count: null, xml_id: null },
    { id: 2, name: 'Gertrude', age: null, gender: null, description: null, play_id: 1, lines: [], character_group_id: null, original_line_count: null, new_line_count: null, xml_id: null },
  ],
  character_groups: [],
}

beforeEach(() => {
  mockUseSuspenseQuery.mockReturnValue({ data: mockPlay })
})

// ─── toggle rendering ─────────────────────────────────────────────────────────

describe('CharactersBreakdown view toggle', () => {
  it('renders "Details" and "Scene Matrix" toggle buttons', () => {
    render(<CharactersBreakdown playId={1} embedded />)
    expect(screen.getByRole('button', { name: 'Details' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Scene Matrix' })).toBeInTheDocument()
  })

  it('shows the character sidebar (Details view) by default', () => {
    render(<CharactersBreakdown playId={1} embedded />)
    expect(screen.getByText('Hamlet')).toBeInTheDocument()
    expect(screen.getByText('Gertrude')).toBeInTheDocument()
    expect(screen.queryByTestId('character-matrix-chart')).not.toBeInTheDocument()
  })

  it('shows the matrix and hides the sidebar when "Scene Matrix" is clicked', async () => {
    const user = userEvent.setup()
    render(<CharactersBreakdown playId={1} embedded />)
    await user.click(screen.getByRole('button', { name: 'Scene Matrix' }))
    expect(screen.getByTestId('character-matrix-chart')).toBeInTheDocument()
    // Sidebar character list buttons should be gone
    expect(screen.queryByText('Add New Character')).not.toBeInTheDocument()
  })

  it('returns to the sidebar when "Details" is clicked after switching to matrix', async () => {
    const user = userEvent.setup()
    render(<CharactersBreakdown playId={1} embedded />)
    await user.click(screen.getByRole('button', { name: 'Scene Matrix' }))
    await user.click(screen.getByRole('button', { name: 'Details' }))
    expect(screen.queryByTestId('character-matrix-chart')).not.toBeInTheDocument()
    expect(screen.getByText('Add New Character')).toBeInTheDocument()
  })
})

// ─── details view ─────────────────────────────────────────────────────────────

describe('CharactersBreakdown details view', () => {
  it('renders a sidebar entry for each character', () => {
    render(<CharactersBreakdown playId={1} embedded />)
    expect(screen.getByText('Hamlet')).toBeInTheDocument()
    expect(screen.getByText('Gertrude')).toBeInTheDocument()
  })

  it('renders an "Add New Character" button in the sidebar', () => {
    render(<CharactersBreakdown playId={1} embedded />)
    expect(screen.getByText('Add New Character')).toBeInTheDocument()
  })

  it('renders the character detail panel for the first character by default', () => {
    render(<CharactersBreakdown playId={1} embedded />)
    expect(screen.getByTestId('character-info-tab')).toBeInTheDocument()
  })

  it('renders the new character form when "Add New Character" is clicked', async () => {
    const user = userEvent.setup()
    render(<CharactersBreakdown playId={1} embedded />)
    await user.click(screen.getByText('Add New Character'))
    expect(screen.getByTestId('new-character-form')).toBeInTheDocument()
  })
})

// ─── non-embedded header ──────────────────────────────────────────────────────

describe('CharactersBreakdown non-embedded header', () => {
  it('shows the play title when not embedded', () => {
    render(<CharactersBreakdown playId={1} />)
    // The non-embedded header renders the title in an h2
    expect(screen.getByRole('heading', { name: 'Hamlet' })).toBeInTheDocument()
  })

  it('does not render the play title when embedded', () => {
    render(<CharactersBreakdown playId={1} embedded />)
    // "Hamlet" still appears as a character sidebar entry but not as the big heading
    // The heading <h2> element with "Hamlet" should be absent
    const headings = screen.queryAllByRole('heading', { name: 'Hamlet' })
    expect(headings).toHaveLength(0)
  })
})
