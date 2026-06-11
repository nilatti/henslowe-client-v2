import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

const mockCreateAsync = vi.fn().mockResolvedValue(undefined)
const mockMoveMutate = vi.fn()
const mockIsPlayAdmin = vi.fn().mockReturnValue(true)

vi.mock('../api/frenchScenes', () => ({
  useCreateSong: () => ({ mutateAsync: mockCreateAsync, isPending: false }),
  useMoveSong: () => ({ mutate: mockMoveMutate }),
}))

vi.mock('../../../hooks/useUserRole', () => ({
  useIsPlayAdmin: () => mockIsPlayAdmin(),
}))

// Expose isFirst/isLast/onMove so ordering and move tests can observe them
vi.mock('./SongItem', () => ({
  SongItem: ({ song, isFirst, isLast, onMove }: any) => (
    <li>
      {song.title}
      {onMove && (
        <>
          <button disabled={isFirst} onClick={() => onMove('up')} aria-label={`up-${song.title}`}>▲</button>
          <button disabled={isLast} onClick={() => onMove('down')} aria-label={`down-${song.title}`}>▼</button>
        </>
      )}
    </li>
  ),
}))

import { SongsManager } from './SongsManager'
import type { FrenchSceneDetail } from '../types/frenchScene'

function makeFrenchScene(songs: FrenchSceneDetail['songs'] = []): FrenchSceneDetail {
  return {
    id: 1,
    number: 'a',
    scene_id: 1,
    summary: null,
    start_page: null,
    end_page: null,
    original_line_count: null,
    new_line_count: null,
    created_at: '',
    updated_at: '',
    on_stages: [],
    entrance_exits: [],
    characters: [],
    songs,
  }
}

const playSkeleton = { id: 1, characters: [], character_groups: [] } as any

function renderManager(songs: FrenchSceneDetail['songs'] = []) {
  render(<SongsManager frenchScene={makeFrenchScene(songs)} playSkeleton={playSkeleton} />)
}

const song1 = { id: 1, french_scene_id: 1, title: 'Consider Yourself', position: 1, characters: [], character_groups: [], created_at: '', updated_at: '' }
const song2 = { id: 2, french_scene_id: 1, title: 'Food, Glorious Food', position: 2, characters: [], character_groups: [], created_at: '', updated_at: '' }
const song3 = { id: 3, french_scene_id: 1, title: 'Oliver!', position: 3, characters: [], character_groups: [], created_at: '', updated_at: '' }

beforeEach(() => {
  mockCreateAsync.mockReset().mockResolvedValue(undefined)
  mockMoveMutate.mockReset()
  mockIsPlayAdmin.mockReturnValue(true)
})

describe('SongsManager — display', () => {
  it('shows the song count', () => {
    renderManager()
    expect(screen.getByText('Songs (0)')).toBeInTheDocument()
  })

  it('shows the empty state when there are no songs', () => {
    renderManager()
    expect(screen.getByText('No songs yet.')).toBeInTheDocument()
  })

  it('renders a SongItem for each song', () => {
    renderManager([song1, song2])
    expect(screen.getByText('Consider Yourself')).toBeInTheDocument()
    expect(screen.getByText('Food, Glorious Food')).toBeInTheDocument()
    expect(screen.getByText('Songs (2)')).toBeInTheDocument()
  })
})

describe('SongsManager — ordering', () => {
  it('renders songs sorted by position, not insertion order', () => {
    renderManager([song3, song1, song2])
    const items = screen.getAllByRole('listitem')
    expect(items[0]).toHaveTextContent('Consider Yourself')
    expect(items[1]).toHaveTextContent('Food, Glorious Food')
    expect(items[2]).toHaveTextContent('Oliver!')
  })

  it('disables the up button for the first song', () => {
    renderManager([song1, song2])
    expect(screen.getByRole('button', { name: 'up-Consider Yourself' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'up-Food, Glorious Food' })).not.toBeDisabled()
  })

  it('disables the down button for the last song', () => {
    renderManager([song1, song2])
    expect(screen.getByRole('button', { name: 'down-Food, Glorious Food' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'down-Consider Yourself' })).not.toBeDisabled()
  })

  it('calls moveSong.mutate with the song id and direction "up"', async () => {
    const user = userEvent.setup()
    renderManager([song1, song2])
    await user.click(screen.getByRole('button', { name: 'up-Food, Glorious Food' }))
    expect(mockMoveMutate).toHaveBeenCalledWith({ id: 2, direction: 'up' })
  })

  it('calls moveSong.mutate with the song id and direction "down"', async () => {
    const user = userEvent.setup()
    renderManager([song1, song2])
    await user.click(screen.getByRole('button', { name: 'down-Consider Yourself' }))
    expect(mockMoveMutate).toHaveBeenCalledWith({ id: 1, direction: 'down' })
  })
})

describe('SongsManager — admin add song', () => {
  it('shows the Add Song button', () => {
    renderManager()
    expect(screen.getByRole('button', { name: 'Add Song' })).toBeInTheDocument()
  })

  it('shows the form when Add Song is clicked', async () => {
    const user = userEvent.setup()
    renderManager()
    await user.click(screen.getByRole('button', { name: 'Add Song' }))
    expect(screen.getByPlaceholderText('Song title')).toBeInTheDocument()
  })

  it('calls createAsync with the title on submit', async () => {
    const user = userEvent.setup()
    renderManager()
    await user.click(screen.getByRole('button', { name: 'Add Song' }))
    await user.type(screen.getByPlaceholderText('Song title'), 'Oliver!')
    await user.click(screen.getByRole('button', { name: 'Add' }))
    expect(mockCreateAsync).toHaveBeenCalledWith({ title: 'Oliver!' })
  })

  it('disables the Add button when title is empty', async () => {
    const user = userEvent.setup()
    renderManager()
    await user.click(screen.getByRole('button', { name: 'Add Song' }))
    expect(screen.getByRole('button', { name: 'Add' })).toBeDisabled()
  })

  it('hides the form when Cancel is clicked', async () => {
    const user = userEvent.setup()
    renderManager()
    await user.click(screen.getByRole('button', { name: 'Add Song' }))
    await user.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(screen.queryByPlaceholderText('Song title')).not.toBeInTheDocument()
  })
})

describe('SongsManager — non-admin', () => {
  it('hides the Add Song button for non-admins', () => {
    mockIsPlayAdmin.mockReturnValue(false)
    renderManager()
    expect(screen.queryByRole('button', { name: 'Add Song' })).not.toBeInTheDocument()
  })
})
