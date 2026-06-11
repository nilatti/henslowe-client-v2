import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

const mockCreateAsync = vi.fn().mockResolvedValue(undefined)
const mockIsPlayAdmin = vi.fn().mockReturnValue(true)

vi.mock('../api/frenchScenes', () => ({
  useCreateSong: () => ({ mutateAsync: mockCreateAsync, isPending: false }),
}))

vi.mock('../../../hooks/useUserRole', () => ({
  useIsPlayAdmin: () => mockIsPlayAdmin(),
}))

vi.mock('./SongItem', () => ({
  SongItem: ({ song }: { song: { title: string } }) => <li>{song.title}</li>,
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

beforeEach(() => {
  mockCreateAsync.mockReset().mockResolvedValue(undefined)
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
    renderManager([
      { id: 1, french_scene_id: 1, title: 'Consider Yourself', characters: [], created_at: '', updated_at: '' },
      { id: 2, french_scene_id: 1, title: 'Food, Glorious Food', characters: [], created_at: '', updated_at: '' },
    ])
    expect(screen.getByText('Consider Yourself')).toBeInTheDocument()
    expect(screen.getByText('Food, Glorious Food')).toBeInTheDocument()
    expect(screen.getByText('Songs (2)')).toBeInTheDocument()
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
