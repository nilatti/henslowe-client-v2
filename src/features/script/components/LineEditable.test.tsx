import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

const mockMutate = vi.fn()

vi.mock('../api/script', () => ({
  useUpdateLine: () => ({ mutate: mockMutate, isPending: false }),
}))

vi.mock('../../french_scenes/components/CharacterCombobox', () => ({
  CharacterCombobox: ({ onSelect }: { onSelect: (type: string, id: number) => void }) => (
    <button onClick={() => onSelect('character', 3)}>SelectCharacter</button>
  ),
}))

import { LineEditable } from './LineEditable'
import type { ScriptLine } from '../types/script'

const characters = [
  { id: 3, name: 'Hamlet' },
  { id: 4, name: 'Ophelia' },
]

const baseLine: ScriptLine = {
  id: 1,
  number: '1.1.1',
  kind: null,
  original_content: 'To be or not to be',
  new_content: null,
  character_id: 3,
  character_group_id: null,
  french_scene_id: 1,
  xml_id: null,
  character: { id: 3, name: 'Hamlet' },
}

function renderLine(line: ScriptLine = baseLine) {
  render(
    <LineEditable
      line={line}
      showCharacter
      showCut={false}
      playId={1}
      characters={characters}
    />,
  )
}

beforeEach(() => mockMutate.mockReset())

describe('LineEditable — character display', () => {
  it('shows the character name', () => {
    renderLine()
    expect(screen.getByText('Hamlet')).toBeInTheDocument()
  })

  it('shows "Set character" when no character is assigned', () => {
    renderLine({ ...baseLine, character_id: null, character: null })
    expect(screen.getByText('Set character')).toBeInTheDocument()
  })

  it('does not show CharacterCombobox initially', () => {
    renderLine()
    expect(screen.queryByText('SelectCharacter')).not.toBeInTheDocument()
  })
})

describe('LineEditable — character editing', () => {
  it('shows CharacterCombobox after double-clicking the character name', async () => {
    const user = userEvent.setup()
    renderLine()
    await user.dblClick(screen.getByText('Hamlet'))
    expect(screen.getByText('SelectCharacter')).toBeInTheDocument()
  })

  it('shows CharacterCombobox after double-clicking "Set character"', async () => {
    const user = userEvent.setup()
    renderLine({ ...baseLine, character_id: null, character: null })
    await user.dblClick(screen.getByText('Set character'))
    expect(screen.getByText('SelectCharacter')).toBeInTheDocument()
  })

  it('calls updateLine.mutate with the selected character', async () => {
    const user = userEvent.setup()
    renderLine()
    await user.dblClick(screen.getByText('Hamlet'))
    await user.click(screen.getByText('SelectCharacter'))
    expect(mockMutate).toHaveBeenCalledWith(
      expect.objectContaining({ character_id: 3, character: { id: 3, name: 'Hamlet' } }),
    )
  })

  it('closes the combobox after selecting a character', async () => {
    const user = userEvent.setup()
    renderLine()
    await user.dblClick(screen.getByText('Hamlet'))
    await user.click(screen.getByText('SelectCharacter'))
    expect(screen.queryByText('SelectCharacter')).not.toBeInTheDocument()
  })

  it('shows "Clear character" button when a character is assigned', async () => {
    const user = userEvent.setup()
    renderLine()
    await user.dblClick(screen.getByText('Hamlet'))
    expect(screen.getByText('Clear character')).toBeInTheDocument()
  })

  it('does not show "Clear character" when no character is assigned', async () => {
    const user = userEvent.setup()
    renderLine({ ...baseLine, character_id: null, character: null })
    await user.dblClick(screen.getByText('Set character'))
    expect(screen.queryByText('Clear character')).not.toBeInTheDocument()
  })

  it('calls updateLine.mutate with null character when "Clear character" is clicked', async () => {
    const user = userEvent.setup()
    renderLine()
    await user.dblClick(screen.getByText('Hamlet'))
    await user.click(screen.getByText('Clear character'))
    expect(mockMutate).toHaveBeenCalledWith(
      expect.objectContaining({ character_id: null, character: null }),
    )
  })

  it('closes the combobox when Escape is pressed', async () => {
    const user = userEvent.setup()
    renderLine()
    await user.dblClick(screen.getByText('Hamlet'))
    expect(screen.getByText('SelectCharacter')).toBeInTheDocument()
    screen.getByText('SelectCharacter').focus()
    await user.keyboard('{Escape}')
    expect(screen.queryByText('SelectCharacter')).not.toBeInTheDocument()
  })
})
