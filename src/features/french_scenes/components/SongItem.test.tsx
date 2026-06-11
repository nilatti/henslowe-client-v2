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
    <button onClick={() => onSelect('character', 99)}>MockCombobox</button>
  ),
}))

import { SongItem } from './SongItem'
import type { Song } from '../types/frenchScene'

const baseSong: Song = {
  id: 1,
  french_scene_id: 1,
  title: 'Consider Yourself',
  characters: [{ id: 10, name: 'Oliver' }],
  created_at: '',
  updated_at: '',
}

const playSkeleton = {
  id: 1,
  characters: [],
  character_groups: [],
} as any

function renderItem(song: Song = baseSong, isAdmin = true) {
  render(
    <ul>
      <SongItem song={song} frenchSceneId={1} playSkeleton={playSkeleton} isAdmin={isAdmin} />
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

  it('calls mutateAsync with new character id when combobox selects', async () => {
    const user = userEvent.setup()
    renderItem()
    await user.click(screen.getByText('+ Add character'))
    await user.click(screen.getByText('MockCombobox'))
    expect(mockUpdateAsync).toHaveBeenCalledWith({ id: 1, character_ids: [10, 99] })
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
    // Two "Delete" buttons now: the item's and the dialog's confirm button
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

  it('shows no Delete button', () => {
    renderItem(baseSong, false)
    expect(screen.queryByRole('button', { name: 'Delete' })).not.toBeInTheDocument()
  })

  it('shows no "+ Add character" button', () => {
    renderItem(baseSong, false)
    expect(screen.queryByText('+ Add character')).not.toBeInTheDocument()
  })
})
