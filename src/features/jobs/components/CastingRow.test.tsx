import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

const mockMutate = vi.fn()

vi.mock('../api/jobs', () => ({
  useUpdateJob: () => ({ mutate: mockMutate, isPending: false }),
  useDeleteJob: () => ({ mutateAsync: vi.fn() }),
}))

vi.mock('@tanstack/react-router', () => ({
  Link: ({ children, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement> & { to?: string; params?: unknown }) => (
    <a {...props}>{children}</a>
  ),
}))

vi.mock('./UserCombobox', () => ({
  UserCombobox: ({ onChange, disabled }: { value: number; onChange: (id: number) => void; disabled?: boolean }) => (
    <button onClick={() => onChange(7)} disabled={disabled}>SelectActor</button>
  ),
}))

import { CastingRow } from './CastingRow'
import type { JobWithDetails } from '../types/job'

const actors = [
  { id: 7, email: 'bob@example.com', first_name: 'Bob', last_name: 'Apple', preferred_name: null, program_name: null, fake: false, gender: null },
]

const baseCasting = {
  id: 1,
  production_id: 1,
  user_id: 7,
  character_id: 3,
  character_group_id: null,
  specialization_id: null,
  theater_id: null,
  start_date: null,
  end_date: null,
  created_at: '',
  updated_at: '',
  character: { id: 3, name: 'Hamlet', new_line_count: 100, original_line_count: 120 },
  character_group: null,
  production: { id: 1, play: { id: 1, title: 'Hamlet' } },
  user: actors[0],
  specialization: null,
  theater: null,
  audition_submission: null,
} as JobWithDetails

function renderRow(casting = baseCasting, isAdmin = true) {
  render(
    <ul>
      <CastingRow casting={casting} actorsAndAuditioners={actors} isAdmin={isAdmin} invalidateKey={[]} />
    </ul>,
  )
}

beforeEach(() => mockMutate.mockReset())

describe('CastingRow — display', () => {
  it('shows the character name', () => {
    renderRow()
    expect(screen.getByText('Hamlet')).toBeInTheDocument()
  })

  it('shows the line count', () => {
    renderRow()
    expect(screen.getByText('(100 lines)')).toBeInTheDocument()
  })

  it('shows the cast actor name', () => {
    renderRow()
    expect(screen.getByText('Bob Apple')).toBeInTheDocument()
  })

  it('shows "Click to cast" when no actor is assigned and user is admin', () => {
    renderRow({ ...baseCasting, user_id: null, user: null })
    expect(screen.getByText('Click to cast')).toBeInTheDocument()
  })

  it('shows nothing for actor when not admin and no actor assigned', () => {
    renderRow({ ...baseCasting, user_id: null, user: null }, false)
    expect(screen.queryByText('Click to cast')).not.toBeInTheDocument()
  })
})

describe('CastingRow — editing', () => {
  it('shows UserCombobox after clicking "Click to cast"', async () => {
    const user = userEvent.setup()
    renderRow({ ...baseCasting, user_id: null, user: null })
    await user.click(screen.getByText('Click to cast'))
    expect(screen.getByText('SelectActor')).toBeInTheDocument()
  })

  it('shows UserCombobox after clicking "Change"', async () => {
    const user = userEvent.setup()
    renderRow()
    await user.click(screen.getByRole('button', { name: 'Change' }))
    expect(screen.getByText('SelectActor')).toBeInTheDocument()
  })

  it('calls updateJob.mutate immediately when an actor is selected', async () => {
    const user = userEvent.setup()
    renderRow()
    await user.click(screen.getByRole('button', { name: 'Change' }))
    await user.click(screen.getByText('SelectActor'))
    expect(mockMutate).toHaveBeenCalledWith(
      expect.objectContaining({ id: 1, user_id: 7 }),
    )
  })

  it('closes the editor after selecting an actor', async () => {
    const user = userEvent.setup()
    renderRow()
    await user.click(screen.getByRole('button', { name: 'Change' }))
    await user.click(screen.getByText('SelectActor'))
    expect(screen.queryByText('SelectActor')).not.toBeInTheDocument()
  })

  it('closes the editor without mutating when Cancel is clicked', async () => {
    const user = userEvent.setup()
    renderRow()
    await user.click(screen.getByRole('button', { name: 'Change' }))
    await user.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(screen.queryByText('SelectActor')).not.toBeInTheDocument()
    expect(mockMutate).not.toHaveBeenCalled()
  })

  it('shows no Change button for non-admin', () => {
    renderRow(baseCasting, false)
    expect(screen.queryByRole('button', { name: 'Change' })).not.toBeInTheDocument()
  })
})
