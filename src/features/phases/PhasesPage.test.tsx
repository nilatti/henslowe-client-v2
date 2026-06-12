import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'

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

vi.mock('./queries', () => ({
  phasesQueryOptions: () => ({ queryKey: ['phases'] }),
}))

vi.mock('../../components/ui', () => ({
  Button: ({ children }: any) => <button>{children}</button>,
  PageHeader: ({ title, action }: any) => (
    <div>
      <h1>{title}</h1>
      {action}
    </div>
  ),
}))

import { PhasesPage } from './PhasesPage'

beforeEach(() => mockUseSuspenseQuery.mockReset())

describe('PhasesPage', () => {
  it('renders the Phases heading', () => {
    mockUseSuspenseQuery.mockReturnValue({ data: [] })
    render(<PhasesPage />)
    expect(screen.getByRole('heading', { name: /phases/i })).toBeInTheDocument()
  })

  it('shows empty state when no phases exist', () => {
    mockUseSuspenseQuery.mockReturnValue({ data: [] })
    render(<PhasesPage />)
    expect(screen.getByText(/no phases defined yet/i)).toBeInTheDocument()
  })

  it('renders a link for each phase', () => {
    mockUseSuspenseQuery.mockReturnValue({
      data: [
        { id: 1, name: 'Preproduction', position: 1, created_at: '', updated_at: '' },
        { id: 2, name: 'Rehearsals', position: 2, created_at: '', updated_at: '' },
      ],
    })
    render(<PhasesPage />)
    expect(screen.getByText('Preproduction')).toBeInTheDocument()
    expect(screen.getByText('Rehearsals')).toBeInTheDocument()
  })

  it('includes a New Phase link', () => {
    mockUseSuspenseQuery.mockReturnValue({ data: [] })
    render(<PhasesPage />)
    expect(screen.getByRole('button', { name: /new phase/i })).toBeInTheDocument()
  })

  it('links each phase to its detail page', () => {
    mockUseSuspenseQuery.mockReturnValue({
      data: [{ id: 7, name: 'Run', position: null, created_at: '', updated_at: '' }],
    })
    render(<PhasesPage />)
    const link = screen.getByText('Run').closest('a')!
    expect(JSON.parse(link.dataset.params!)).toMatchObject({ phaseId: '7' })
  })
})
