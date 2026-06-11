import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

const mockUpdateAsync = vi.fn().mockResolvedValue(undefined)
const mockDeleteAsync = vi.fn().mockResolvedValue(undefined)

vi.mock('../api/frenchScenes', () => ({
  useUpdateSong: () => ({ mutateAsync: mockUpdateAsync, isPending: false }),
  useDeleteSong: () => ({ mutateAsync: mockDeleteAsync }),
}))

vi.mock('./CharacterCombobox', () => ({
  CharacterCombobox: ({ onSelect }: { onSelect: (type: string, id: number) => void }) => (
    <div>
      <button onClick={() => onSelect('character', 99)}>MockCombobox</button>
      <button onClick={() => onSelect('character_group', 88)}>MockComboboxGroup</button>
    </div>
  ),
}))

import { SongItem } from './SongItem'
import type { Song } from '../types/frenchScene'

const baseSong: Song = {
  id: 1,
  french_scene_id: 1,
  title: 'Consider Yourself',
  position: 1,
  characters: [{ id: 10, name: 'Oliver' }],
  character_groups: [],
  created_at: '',
  updated_at: '',
}

const playSkeleton = {
  id: 1,
  characters: [],
  character_groups: [],
} as any

function renderItem(
  song: Song = baseSong,
  isAdmin = true,
  extra: { isFirst?: boolean; isLast?: boolean; onMove?: (dir: 'up' | 'down') => void } = {},
) {
  render(
    <ul>
      <SongItem
        song={song}
        frenchSceneId={1}
        playSkeleton={playSkeleton}
        isAdmin={isAdmin}
        {...extra}
      />
    </ul>,
  )
}

beforeEach(() => {
  mockUpdateAsync.mockReset().mockResolvedValue(undefined)
  mockDeleteAsync.mockReset().mockResolvedValue(undefined)
})

describe('SongItem — display', () => {
  it('shows the song title', () => {
    renderItem()
    expect(screen.getByText('Consider Yourself')).toBeInTheDocument()
  })

  it('shows assigned characters as pills', () => {
    renderItem()
    expect(screen.getByText('Oliver')).toBeInTheDocument()
  })

  it('shows no characters when the list is empty', () => {
    renderItem({ ...baseSong, characters: [] })
    expect(screen.queryByText('Oliver')).not.toBeInTheDocument()
  })

  it('shows character group pills with a (group) badge', () => {
    renderItem({ ...baseSong, character_groups: [{ id: 20, name: 'Ensemble' }] })
    expect(screen.getByText('Ensemble')).toBeInTheDocument()
    expect(screen.getByText('(group)')).toBeInTheDocument()
  })
})

describe('SongItem — admin title editing', () => {
  it('switches to an input when title is clicked', async () => {
    const user = userEvent.setup()
    renderItem()
    await user.click(screen.getByText('Consider Yourself'))
    expect(screen.getByRole('textbox')).toHaveValue('Consider Yourself')
  })

  it('calls mutateAsync with new title on save', async () => {
    const user = userEvent.setup()
    renderItem()
    await user.click(screen.getByText('Consider Yourself'))
    const input = screen.getByRole('textbox')
    await user.clear(input)
    await user.type(input, 'Food, Glorious Food')
    await user.click(screen.getByRole('button', { name: 'Save' }))
    expect(mockUpdateAsync).toHaveBeenCalledWith({ id: 1, title: 'Food, Glorious Food' })
  })

  it('cancels editing on Escape without calling mutateAsync', async () => {
    const user = userEvent.setup()
    renderItem()
    await user.click(screen.getByText('Consider Yourself'))
    await user.keyboard('{Escape}')
    expect(screen.getByText('Consider Yourself')).toBeInTheDocument()
    expect(mockUpdateAsync).not.toHaveBeenCalled()
  })

  it('does not call mutateAsync if title is unchanged', async () => {
    const user = userEvent.setup()
    renderItem()
    await user.click(screen.getByText('Consider Yourself'))
    await user.click(screen.getByRole('button', { name: 'Save' }))
    expect(mockUpdateAsync).not.toHaveBeenCalled()
  })
})

describe('SongItem — admin character management', () => {
  it('shows a remove button on each character pill', () => {
    renderItem()
    expect(screen.getByTitle('Remove Oliver')).toBeInTheDocument()
  })

  it('calls mutateAsync with updated character_ids when removing a character', async () => {
    const user = userEvent.setup()
    renderItem()
    await user.click(screen.getByTitle('Remove Oliver'))
    expect(mockUpdateAsync).toHaveBeenCalledWith({ id: 1, character_ids: [] })
  })

  it('shows a remove button on each character group pill', () => {
    renderItem({ ...baseSong, character_groups: [{ id: 20, name: 'Ensemble' }] })
    expect(screen.getByTitle('Remove Ensemble')).toBeInTheDocument()
  })

  it('calls mutateAsync with updated character_group_ids when removing a group', async () => {
    const user = userEvent.setup()
    renderItem({ ...baseSong, character_groups: [{ id: 20, name: 'Ensemble' }] })
    await user.click(screen.getByTitle('Remove Ensemble'))
    expect(mockUpdateAsync).toHaveBeenCalledWith({ id: 1, character_group_ids: [] })
  })

  it('shows "+ Add character" button', () => {
    renderItem()
    expect(screen.getByText('+ Add character')).toBeInTheDocument()
  })

  it('shows the combobox when "+ Add character" is clicked', async () => {
    const user = userEvent.setup()
    renderItem()
    await user.click(screen.getByText('+ Add character'))
    expect(screen.getByText('MockCombobox')).toBeInTheDocument()
  })

  it('calls mutateAsync with new character_id when combobox selects a character', async () => {
    const user = userEvent.setup()
    renderItem()
    await user.click(screen.getByText('+ Add character'))
    await user.click(screen.getByText('MockCombobox'))
    expect(mockUpdateAsync).toHaveBeenCalledWith({ id: 1, character_ids: [10, 99] })
  })

  it('calls mutateAsync with new character_group_id when combobox selects a group', async () => {
    const user = userEvent.setup()
    renderItem({ ...baseSong, character_groups: [{ id: 20, name: 'Ensemble' }] })
    await user.click(screen.getByText('+ Add character'))
    await user.click(screen.getByText('MockComboboxGroup'))
    expect(mockUpdateAsync).toHaveBeenCalledWith({ id: 1, character_group_ids: [20, 88] })
  })
})

describe('SongItem — move buttons', () => {
  const onMove = vi.fn()

  beforeEach(() => onMove.mockReset())

  it('shows up and down buttons when onMove is provided and user is admin', () => {
    renderItem(baseSong, true, { onMove })
    expect(screen.getByTitle('Move up')).toBeInTheDocument()
    expect(screen.getByTitle('Move down')).toBeInTheDocument()
  })

  it('disables the up button when isFirst', () => {
    renderItem(baseSong, true, { onMove, isFirst: true })
    expect(screen.getByTitle('Move up')).toBeDisabled()
    expect(screen.getByTitle('Move down')).not.toBeDisabled()
  })

  it('disables the down button when isLast', () => {
    renderItem(baseSong, true, { onMove, isLast: true })
    expect(screen.getByTitle('Move down')).toBeDisabled()
    expect(screen.getByTitle('Move up')).not.toBeDisabled()
  })

  it('calls onMove("up") when up button is clicked', async () => {
    const user = userEvent.setup()
    renderItem(baseSong, true, { onMove })
    await user.click(screen.getByTitle('Move up'))
    expect(onMove).toHaveBeenCalledWith('up')
  })

  it('calls onMove("down") when down button is clicked', async () => {
    const user = userEvent.setup()
    renderItem(baseSong, true, { onMove })
    await user.click(screen.getByTitle('Move down'))
    expect(onMove).toHaveBeenCalledWith('down')
  })

  it('does not show move buttons when onMove is not provided', () => {
    renderItem(baseSong, true, {})
    expect(screen.queryByTitle('Move up')).not.toBeInTheDocument()
    expect(screen.queryByTitle('Move down')).not.toBeInTheDocument()
  })
})

describe('SongItem — admin delete', () => {
  it('shows a Delete button', () => {
    renderItem()
    expect(screen.getByRole('button', { name: 'Delete' })).toBeInTheDocument()
  })

  it('shows a confirm dialog when Delete is clicked', async () => {
    const user = userEvent.setup()
    renderItem()
    await user.click(screen.getByRole('button', { name: 'Delete' }))
    expect(screen.getByText(/Delete "Consider Yourself"\?/)).toBeInTheDocument()
  })

  it('calls deleteAsync on confirm', async () => {
    const user = userEvent.setup()
    renderItem()
    await user.click(screen.getByRole('button', { name: 'Delete' }))
    const buttons = screen.getAllByRole('button', { name: 'Delete' })
    await user.click(buttons.at(-1)!)
    expect(mockDeleteAsync).toHaveBeenCalledWith(1)
  })
})

describe('SongItem — non-admin', () => {
  it('title is not clickable to edit', async () => {
    const user = userEvent.setup()
    renderItem(baseSong, false)
    await user.click(screen.getByText('Consider Yourself'))
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument()
  })

  it('shows no remove button on character pills', () => {
    renderItem(baseSong, false)
    expect(screen.queryByTitle('Remove Oliver')).not.toBeInTheDocument()
  })

  it('shows no remove button on group pills', () => {
    renderItem({ ...baseSong, character_groups: [{ id: 20, name: 'Ensemble' }] }, false)
    expect(screen.queryByTitle('Remove Ensemble')).not.toBeInTheDocument()
  })

  it('shows no Delete button', () => {
    renderItem(baseSong, false)
    expect(screen.queryByRole('button', { name: 'Delete' })).not.toBeInTheDocument()
  })

  it('shows no "+ Add character" button', () => {
    renderItem(baseSong, false)
    expect(screen.queryByText('+ Add character')).not.toBeInTheDocument()
  })

  it('shows no move buttons', () => {
    renderItem(baseSong, false, { onMove: vi.fn() })
    expect(screen.queryByTitle('Move up')).not.toBeInTheDocument()
  })
})
