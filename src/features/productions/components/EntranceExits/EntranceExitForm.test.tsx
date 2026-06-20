import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

let lastExcludeIds: Set<number> = new Set()
const mockComboboxOnSelect = vi.fn()

vi.mock('../../../french_scenes/components/CharacterCombobox', () => ({
  CharacterCombobox: ({
    onSelect,
    excludeCharacterIds,
  }: {
    onSelect: (type: string, id: number) => void
    excludeCharacterIds: Set<number>
  }) => {
    lastExcludeIds = excludeCharacterIds
    mockComboboxOnSelect.mockImplementation(onSelect)
    return <button onClick={() => onSelect('character', 5)}>AddCharacter</button>
  },
}))

import { EntranceExitForm } from './EntranceExitForm'
import type { PlayCharacter } from '../../../plays/types/play'

const characters: PlayCharacter[] = [
  { id: 1, name: 'Hamlet', age: null, gender: null, description: null, original_line_count: null, new_line_count: null, character_group_id: null, play_id: 10 },
  { id: 2, name: 'Ophelia', age: null, gender: null, description: null, original_line_count: null, new_line_count: null, character_group_id: null, play_id: 10 },
  { id: 5, name: 'Horatio', age: null, gender: null, description: null, original_line_count: null, new_line_count: null, character_group_id: null, play_id: 10 },
]

const stageExits = [{ id: 1, name: 'Stage Left', production_id: 1 }]

function renderForm(
  onSubmit = vi.fn(),
  entranceExit?: React.ComponentProps<typeof EntranceExitForm>['entranceExit'],
) {
  render(
    <EntranceExitForm
      frenchSceneId={1}
      characters={characters}
      stageExits={stageExits}
      entranceExit={entranceExit}
      onSubmit={onSubmit}
      onCancel={vi.fn()}
    />,
  )
  return { onSubmit }
}

beforeEach(() => {
  lastExcludeIds = new Set()
  mockComboboxOnSelect.mockReset()
})

describe('EntranceExitForm — character selection', () => {
  it('shows the AddCharacter combobox', () => {
    renderForm()
    expect(screen.getByText('AddCharacter')).toBeInTheDocument()
  })

  it('shows no character tags when none are pre-selected', () => {
    renderForm()
    expect(screen.queryByRole('listitem')).not.toBeInTheDocument()
  })

  it('shows tags for pre-selected characters', () => {
    renderForm(vi.fn(), {
      id: 1,
      french_scene_id: 1,
      category: 'Enter',
      line: null,
      page: null,
      notes: '',
      stage_exit_id: 1,
      stage_exit: stageExits[0],
      characters: [{ id: 1, name: 'Hamlet' }],
    })
    expect(screen.getByText('Hamlet')).toBeInTheDocument()
  })

  it('adds a character tag when selected from the combobox', async () => {
    const user = userEvent.setup()
    renderForm()
    await user.click(screen.getByText('AddCharacter'))
    expect(screen.getByText('Horatio')).toBeInTheDocument()
  })

  it('removes a character tag when × is clicked', async () => {
    const user = userEvent.setup()
    renderForm(vi.fn(), {
      id: 1,
      french_scene_id: 1,
      category: 'Enter',
      line: null,
      page: null,
      notes: '',
      stage_exit_id: 1,
      stage_exit: stageExits[0],
      characters: [{ id: 1, name: 'Hamlet' }],
    })
    await user.click(screen.getByText('×'))
    expect(screen.queryByText('Hamlet')).not.toBeInTheDocument()
  })

  it('passes already-selected character IDs to excludeCharacterIds', async () => {
    const user = userEvent.setup()
    renderForm()
    await user.click(screen.getByText('AddCharacter'))
    // After selecting Horatio (id 5), it should be in excludeCharacterIds
    expect(lastExcludeIds.has(5)).toBe(true)
  })

  it('submits with the correct character_ids', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()
    // Pre-fill required fields so the form can submit
    renderForm(onSubmit, {
      id: 1,
      french_scene_id: 1,
      category: 'Enter',
      line: null,
      page: null,
      notes: '',
      stage_exit_id: 1,
      stage_exit: stageExits[0],
      characters: [],
    })
    await user.click(screen.getByText('AddCharacter'))
    await user.click(screen.getByRole('button', { name: 'Save' }))
    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({ character_ids: [5] }),
    )
  })
})
