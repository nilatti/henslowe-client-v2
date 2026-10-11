import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'

const mockReorder = vi.fn()

vi.mock('../api/script', () => ({
  useUpdateLine: () => ({ mutate: vi.fn(), isPending: false }),
  useUpdateStageDirection: () => ({ mutate: vi.fn() }),
  useUpdateSoundCue: () => ({ mutate: vi.fn() }),
  useReorderScriptItems: () => ({ mutate: mockReorder }),
}))

vi.mock('../../french_scenes/components/CharacterCombobox', () => ({
  CharacterCombobox: () => null,
}))

import { ScriptViewer } from './ScriptViewer'
import { mergeTextFromFrenchScenes } from '../utils/scriptUtils'
import type { ScriptFrenchScene } from '../types/script'

const line = (id: number, number: string, fsId: number, position: number | null = null) => ({
  id, number, kind: null, original_content: `Line ${number}`, new_content: null,
  character_id: null, character_group_id: null, french_scene_id: fsId, xml_id: null, position,
})

const fsA: ScriptFrenchScene = {
  id: 1, number: 'a', pretty_name: '01.01.a', stage_directions: [], sound_cues: [],
  // Reordered: 1.1.2 now comes before 1.1.1.
  lines: [line(1, '1.1.1', 1, 2), line(2, '1.1.2', 1, 1)],
}
const fsB: ScriptFrenchScene = {
  id: 2, number: 'b', pretty_name: '01.01.b', stage_directions: [], sound_cues: [],
  lines: [line(3, '1.1.3', 2)],
}

function renderViewer(opts: { frenchScenes?: ScriptFrenchScene[]; isEditable?: boolean; showCut?: boolean; canDrag?: boolean } = {}) {
  const { frenchScenes = [fsA, fsB], isEditable = true, showCut = true, canDrag = true } = opts
  render(
    <ScriptViewer
      text={mergeTextFromFrenchScenes(frenchScenes)}
      frenchScenes={frenchScenes}
      allFrenchScenes={[fsA, fsB]}
      canDrag={canDrag}
      showCut={showCut}
      isEditable={isEditable}
      playId={1}
    />
  )
}

const handles = () => screen.queryAllByRole('button', { name: /drag to reorder/i })

describe('ScriptViewer', () => {
  beforeEach(() => mockReorder.mockClear())

  it('shows items in position order while keeping their numbers', () => {
    renderViewer({ isEditable: false })
    const numbers = screen.getAllByText(/^1\.1\.\d$/).map(el => el.textContent)
    expect(numbers).toEqual(['1.1.2', '1.1.1', '1.1.3'])
  })

  it('shows a drag handle per item and French scene headings in edit mode', () => {
    renderViewer()
    expect(handles()).toHaveLength(3)
    expect(screen.getByText('French Scene 01.01.a')).toBeInTheDocument()
    expect(screen.getByText('French Scene 01.01.b')).toBeInTheDocument()
  })

  it('omits headings when a single French scene is loaded', () => {
    renderViewer({ frenchScenes: [fsA] })
    expect(handles()).toHaveLength(2)
    expect(screen.queryByText(/^French Scene/)).not.toBeInTheDocument()
  })

  it('has no drag handles when read-only', () => {
    renderViewer({ isEditable: false })
    expect(handles()).toHaveLength(0)
  })

  it('turns off dragging while cut text is hidden', () => {
    renderViewer({ showCut: false })
    expect(handles()).toHaveLength(0)
  })

  it('turns off dragging but keeps Move… when dragging is not allowed', () => {
    renderViewer({ canDrag: false })
    expect(handles()).toHaveLength(0)
    expect(screen.getAllByRole('button', { name: 'Move…' })).toHaveLength(3)
  })

  it('moves an item after the line with the entered number', () => {
    renderViewer({ frenchScenes: [fsA] })
    // Line 1.1.1 is shown second, after 1.1.2.
    fireEvent.click(screen.getAllByRole('button', { name: 'Move…' })[1])
    fireEvent.change(screen.getByLabelText('Line number'), { target: { value: '1.1.3' } })
    fireEvent.click(screen.getByRole('button', { name: 'Move' }))
    expect(mockReorder).toHaveBeenCalledWith([
      { id: 1, items: [{ type: 'line', id: 2 }] },
      { id: 2, items: [{ type: 'line', id: 3 }, { type: 'line', id: 1 }] },
    ])
    expect(screen.getByText('Moved 1.1.1 after 1.1.3')).toBeInTheDocument()
  })

  it('reports an unknown line number', () => {
    renderViewer()
    fireEvent.click(screen.getAllByRole('button', { name: 'Move…' })[0])
    fireEvent.change(screen.getByLabelText('Line number'), { target: { value: '9.9.9' } })
    fireEvent.click(screen.getByRole('button', { name: 'Move' }))
    expect(screen.getByRole('alert')).toHaveTextContent('No line 9.9.9 in this play')
    expect(mockReorder).not.toHaveBeenCalled()
  })

  it('has no Move… button when read-only', () => {
    renderViewer({ isEditable: false })
    expect(screen.queryByRole('button', { name: 'Move…' })).not.toBeInTheDocument()
  })
})
