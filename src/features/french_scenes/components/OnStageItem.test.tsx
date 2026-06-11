import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

const mockMutateAsync = vi.fn().mockResolvedValue(undefined)

vi.mock('../api/frenchScenes', () => ({
  useUpdateOnStage: () => ({ mutateAsync: mockMutateAsync }),
  useDeleteOnStage: () => ({ mutateAsync: vi.fn().mockResolvedValue(undefined) }),
}))

import { OnStageItem } from './OnStageItem'
import type { OnStage } from '../types/frenchScene'

const baseOnStage: OnStage = {
  id: 1,
  french_scene_id: 1,
  character_id: 1,
  character_group_id: null,
  user_id: null,
  category: null,
  description: null,
  nonspeaking: false,
  offstage: false,
  character: { id: 1, name: 'Hamlet' },
  character_group: null,
  user: null,
}

function renderItem(overrides: Partial<OnStage> = {}, isAdmin = true) {
  render(
    <ul>
      <OnStageItem
        onStage={{ ...baseOnStage, ...overrides }}
        frenchSceneId={1}
        isAdmin={isAdmin}
      />
    </ul>,
  )
}

beforeEach(() => {
  mockMutateAsync.mockReset().mockResolvedValue(undefined)
})

describe('OnStageItem — offstage toggle (admin)', () => {
  it('shows "Onstage" button when offstage is false', () => {
    renderItem({ offstage: false })
    expect(screen.getByRole('button', { name: /onstage/i })).toBeInTheDocument()
  })

  it('shows "Offstage" button when offstage is true', () => {
    renderItem({ offstage: true })
    // The toggle button title is "Toggle onstage/offstage" and label is "Offstage"
    expect(screen.getByTitle(/toggle onstage\/offstage/i)).toBeInTheDocument()
    expect(screen.getByTitle(/toggle onstage\/offstage/i).textContent).toBe('Offstage')
  })

  it('calls mutateAsync with offstage: true when toggling from onstage', async () => {
    const user = userEvent.setup()
    renderItem({ offstage: false })
    await user.click(screen.getByTitle(/toggle onstage\/offstage/i))
    expect(mockMutateAsync).toHaveBeenCalledWith({ id: 1, offstage: true })
  })

  it('calls mutateAsync with offstage: false when toggling from offstage', async () => {
    const user = userEvent.setup()
    renderItem({ offstage: true })
    await user.click(screen.getByTitle(/toggle onstage\/offstage/i))
    expect(mockMutateAsync).toHaveBeenCalledWith({ id: 1, offstage: false })
  })
})

describe('OnStageItem — offstage display (non-admin)', () => {
  it('shows an "Offstage" text label when offstage is true', () => {
    renderItem({ offstage: true }, false)
    expect(screen.getByText('Offstage')).toBeInTheDocument()
    expect(screen.queryByTitle(/toggle onstage\/offstage/i)).not.toBeInTheDocument()
  })

  it('shows no offstage indicator when offstage is false', () => {
    renderItem({ offstage: false }, false)
    expect(screen.queryByText('Offstage')).not.toBeInTheDocument()
  })
})
