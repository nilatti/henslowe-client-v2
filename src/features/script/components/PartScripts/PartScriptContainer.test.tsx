import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ActorWithJobs } from './types'
import type { PlayScript } from '../../types/script'

vi.mock('./PartScriptSelector', () => ({
  default: ({
    actors,
    characters,
    onFormSubmit,
  }: {
    actors: ActorWithJobs[]
    characters: { id: number; name: string }[]
    onFormSubmit: (actors: ActorWithJobs[], chars: { id: number; name: string }[]) => void
  }) => (
    <div>
      <span data-testid="selector">
        Selector ({actors.length} actors, {characters.length} chars)
      </span>
      <button onClick={() => onFormSubmit(actors.slice(0, 1), characters.slice(0, 1))}>
        Submit selection
      </button>
    </div>
  ),
}))

vi.mock('./PartScriptPresenter', () => ({
  default: ({ context }: { context: unknown[] }) => (
    <div data-testid="presenter">Presenter ({context.length} items)</div>
  ),
}))

import PartScriptContainer from './PartScriptContainer'

const mockActors: ActorWithJobs[] = [
  {
    id: 1,
    email: 'bob@example.com',
    first_name: 'Bob',
    last_name: 'Smith',
    preferred_name: null,
    fake: false,
    jobs: [{ character_id: 1 }],
  },
]

const mockPlay: PlayScript = {
  id: 1,
  title: 'Hamlet',
  canonical: true,
  production_id: null,
  characters: [{ id: 1, name: 'Hamlet' }],
  character_groups: [],
  acts: [],
}

function setup() {
  render(<PartScriptContainer actors={mockActors} play={mockPlay} />)
}

describe('PartScriptContainer — initial state', () => {
  it('shows the selector by default', () => {
    setup()
    expect(screen.getByTestId('selector')).toBeInTheDocument()
  })

  it('does not show the presenter initially', () => {
    setup()
    expect(screen.queryByTestId('presenter')).not.toBeInTheDocument()
  })

  it('passes actors and characters down to the selector', () => {
    setup()
    expect(screen.getByText(/1 actors, 1 chars/)).toBeInTheDocument()
  })
})

describe('PartScriptContainer — after selection', () => {
  it('hides the selector and shows the presenter after form is submitted', async () => {
    const user = userEvent.setup()
    setup()
    await user.click(screen.getByRole('button', { name: 'Submit selection' }))
    expect(screen.queryByTestId('selector')).not.toBeInTheDocument()
    expect(screen.getByTestId('presenter')).toBeInTheDocument()
  })

  it('passes the combined actors and characters as context to the presenter', async () => {
    const user = userEvent.setup()
    setup()
    await user.click(screen.getByRole('button', { name: 'Submit selection' }))
    // Mock submits 1 actor + 1 character = 2 context items
    expect(screen.getByText('Presenter (2 items)')).toBeInTheDocument()
  })

  it('shows a "Select roles and actors" button after submission', async () => {
    const user = userEvent.setup()
    setup()
    await user.click(screen.getByRole('button', { name: 'Submit selection' }))
    expect(
      screen.getByRole('button', { name: /Select roles and actors/i })
    ).toBeInTheDocument()
  })
})

describe('PartScriptContainer — going back to selector', () => {
  it('shows selector again when "Select roles and actors" is clicked', async () => {
    const user = userEvent.setup()
    setup()
    await user.click(screen.getByRole('button', { name: 'Submit selection' }))
    await user.click(screen.getByRole('button', { name: /Select roles and actors/i }))
    expect(screen.getByTestId('selector')).toBeInTheDocument()
    expect(screen.queryByTestId('presenter')).not.toBeInTheDocument()
  })
})
