import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

// Mock downloadCsv so we can assert on what it's called with
const { mockDownloadCsv } = vi.hoisted(() => ({ mockDownloadCsv: vi.fn() }))
vi.mock('../../../../utils/csvUtils', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../../../utils/csvUtils')>()
  return { ...actual, downloadCsv: mockDownloadCsv }
})

// Mock useSuspenseQuery so the component renders synchronously with test data
const { mockUseSuspenseQuery } = vi.hoisted(() => ({ mockUseSuspenseQuery: vi.fn() }))
vi.mock('@tanstack/react-query', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@tanstack/react-query')>()
  return { ...actual, useSuspenseQuery: mockUseSuspenseQuery }
})

vi.mock('@tanstack/react-router', () => ({
  Link: ({ children, to, params, className }: any) => (
    <a href={to} data-params={JSON.stringify(params ?? {})} className={className}>{children}</a>
  ),
}))

vi.mock('../../api/script', () => ({
  playScriptQueryOptions: vi.fn(() => ({ queryKey: ['script-test'], queryFn: vi.fn() })),
}))

import { CharacterMatrixChart } from './CharacterMatrixChart'

// ─── shared test data ─────────────────────────────────────────────────────────

// Act 1, scene 1.1, french scene 1.1.1:
//   Hamlet  — speaking
//   Gertrude — nonspeaking
//   Soldiers (group) — speaking
//
// Act 2, scene 2.1, french scene 2.1.1:
//   Hamlet  — speaking   (only)
const mockScript: any = {
  id: 1,
  title: 'Hamlet',
  canonical: false,
  production_id: null,
  characters: [
    { id: 1, name: 'Hamlet' },
    { id: 2, name: 'Gertrude' },
    { id: 3, name: 'Horatio' },
  ],
  character_groups: [
    { id: 100, name: 'Soldiers' },
  ],
  acts: [
    {
      id: 1,
      number: 1,
      scenes: [{
        id: 1,
        pretty_name: '1.1',
        french_scenes: [{
          id: 1,
          pretty_name: '1.1.1',
          lines: [], stage_directions: [], sound_cues: [],
          on_stages: [
            { character_id: 1,    character_group_id: null, nonspeaking: false, offstage: false },
            { character_id: 2,    character_group_id: null, nonspeaking: true,  offstage: false },
            { character_id: null, character_group_id: 100,  nonspeaking: false, offstage: false },
            { character_id: 3,    character_group_id: null, nonspeaking: false, offstage: true  },
          ],
        }],
      }],
    },
    {
      id: 2,
      number: 2,
      scenes: [{
        id: 2,
        pretty_name: '2.1',
        french_scenes: [{
          id: 2,
          pretty_name: '2.1.1',
          lines: [], stage_directions: [], sound_cues: [],
          on_stages: [
            { character_id: 1, character_group_id: null, nonspeaking: false, offstage: false },
          ],
        }],
      }],
    },
  ],
}

beforeEach(() => {
  mockDownloadCsv.mockReset()
  mockUseSuspenseQuery.mockReturnValue({ data: mockScript })
})

// ─── rendering ────────────────────────────────────────────────────────────────

describe('CharacterMatrixChart rendering', () => {
  it('renders character names as row headers', () => {
    render(<CharacterMatrixChart playId={1} />)
    expect(screen.getByText('Hamlet')).toBeInTheDocument()
    expect(screen.getByText('Gertrude')).toBeInTheDocument()
    expect(screen.getByText('Soldiers')).toBeInTheDocument()
    expect(screen.getByText('Horatio')).toBeInTheDocument()
  })

  it('renders act column headers by default', () => {
    render(<CharacterMatrixChart playId={1} />)
    expect(screen.getByText('Act 1')).toBeInTheDocument()
    expect(screen.getByText('Act 2')).toBeInTheDocument()
  })

  it('shows X for a speaking character in the correct act column', () => {
    render(<CharacterMatrixChart playId={1} />)
    // Hamlet is speaking in both acts — should have two X cells
    const xCells = screen.getAllByText('X')
    // Hamlet×2 + Soldiers×1 = 3 X cells
    expect(xCells.length).toBeGreaterThanOrEqual(3)
  })

  it('shows (X) for an offstage character', () => {
    render(<CharacterMatrixChart playId={1} />)
    // Horatio is offstage in act 1, so there are multiple (X) cells
    const parenCells = screen.getAllByText('(X)')
    expect(parenCells.length).toBeGreaterThanOrEqual(2)
  })

  it('shows (X) for nonspeaking and offstage characters', () => {
    render(<CharacterMatrixChart playId={1} />)
    // Gertrude (nonspeaking) and Horatio (offstage) both render as (X)
    expect(screen.getAllByText('(X)').length).toBeGreaterThanOrEqual(2)
  })

  it('shows a Download CSV button', () => {
    render(<CharacterMatrixChart playId={1} />)
    expect(screen.getByRole('button', { name: /download csv/i })).toBeInTheDocument()
  })

  it('shows Acts / Scenes / French Scenes tabs', () => {
    render(<CharacterMatrixChart playId={1} />)
    expect(screen.getByRole('button', { name: 'Acts' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Scenes' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'French Scenes' })).toBeInTheDocument()
  })

  it('shows empty state when there are no characters', () => {
    mockUseSuspenseQuery.mockReturnValue({
      data: { ...mockScript, characters: [], character_groups: [] },
    })
    render(<CharacterMatrixChart playId={1} />)
    expect(screen.getByText(/no characters found/i)).toBeInTheDocument()
  })
})

// ─── tab switching ────────────────────────────────────────────────────────────

describe('CharacterMatrixChart tab switching', () => {
  it('switches to scene-level columns when "Scenes" tab is clicked', async () => {
    const user = userEvent.setup()
    render(<CharacterMatrixChart playId={1} />)
    await user.click(screen.getByRole('button', { name: 'Scenes' }))
    expect(screen.getByText('1.1')).toBeInTheDocument()
    expect(screen.getByText('2.1')).toBeInTheDocument()
  })

  it('switches to french-scene columns when "French Scenes" tab is clicked', async () => {
    const user = userEvent.setup()
    render(<CharacterMatrixChart playId={1} />)
    await user.click(screen.getByRole('button', { name: 'French Scenes' }))
    expect(screen.getByText('1.1.1')).toBeInTheDocument()
    expect(screen.getByText('2.1.1')).toBeInTheDocument()
  })
})

// ─── CSV download ─────────────────────────────────────────────────────────────

describe('CharacterMatrixChart CSV download', () => {
  it('calls downloadCsv once when the button is clicked', async () => {
    const user = userEvent.setup()
    render(<CharacterMatrixChart playId={1} />)
    await user.click(screen.getByRole('button', { name: /download csv/i }))
    expect(mockDownloadCsv).toHaveBeenCalledOnce()
  })

  it('CSV header row starts with "Character" then act labels', async () => {
    const user = userEvent.setup()
    render(<CharacterMatrixChart playId={1} />)
    await user.click(screen.getByRole('button', { name: /download csv/i }))
    const [rows] = mockDownloadCsv.mock.calls[0]
    expect(rows[0]).toEqual(['Character', 'Act 1', 'Act 2'])
  })

  it('rows are sorted alphabetically by character name', async () => {
    const user = userEvent.setup()
    render(<CharacterMatrixChart playId={1} />)
    await user.click(screen.getByRole('button', { name: /download csv/i }))
    const [rows] = mockDownloadCsv.mock.calls[0]
    const names = rows.slice(1).map((r: string[]) => r[0])
    expect(names).toEqual(['Gertrude', 'Hamlet', 'Horatio', 'Soldiers'])
  })

  it('places X for speaking character in act 1, X in act 2', async () => {
    const user = userEvent.setup()
    render(<CharacterMatrixChart playId={1} />)
    await user.click(screen.getByRole('button', { name: /download csv/i }))
    const [rows] = mockDownloadCsv.mock.calls[0]
    const hamletRow = rows.find((r: string[]) => r[0] === 'Hamlet')
    expect(hamletRow[1]).toBe('X')
    expect(hamletRow[2]).toBe('X')
  })

  it('places (X) for nonspeaking character, blank where absent', async () => {
    const user = userEvent.setup()
    render(<CharacterMatrixChart playId={1} />)
    await user.click(screen.getByRole('button', { name: /download csv/i }))
    const [rows] = mockDownloadCsv.mock.calls[0]
    const gertrudeRow = rows.find((r: string[]) => r[0] === 'Gertrude')
    expect(gertrudeRow[1]).toBe('(X)')
    expect(gertrudeRow[2]).toBe('')
  })

  it('places (X) for offstage character, blank where absent', async () => {
    const user = userEvent.setup()
    render(<CharacterMatrixChart playId={1} />)
    await user.click(screen.getByRole('button', { name: /download csv/i }))
    const [rows] = mockDownloadCsv.mock.calls[0]
    const horatioRow = rows.find((r: string[]) => r[0] === 'Horatio')
    expect(horatioRow[1]).toBe('(X)')
    expect(horatioRow[2]).toBe('')
  })

  it('places X for character group, blank where absent', async () => {
    const user = userEvent.setup()
    render(<CharacterMatrixChart playId={1} />)
    await user.click(screen.getByRole('button', { name: /download csv/i }))
    const [rows] = mockDownloadCsv.mock.calls[0]
    const soldiersRow = rows.find((r: string[]) => r[0] === 'Soldiers')
    expect(soldiersRow[1]).toBe('X')
    expect(soldiersRow[2]).toBe('')
  })

  it('includes play title slug and level in the filename', async () => {
    const user = userEvent.setup()
    render(<CharacterMatrixChart playId={1} />)
    await user.click(screen.getByRole('button', { name: /download csv/i }))
    const [, filename] = mockDownloadCsv.mock.calls[0]
    expect(filename).toMatch(/hamlet/)
    expect(filename).toMatch(/acts/)
    expect(filename).toMatch(/\.csv$/)
  })

  it('uses "scenes" in filename when Scenes tab is active', async () => {
    const user = userEvent.setup()
    render(<CharacterMatrixChart playId={1} />)
    await user.click(screen.getByRole('button', { name: 'Scenes' }))
    await user.click(screen.getByRole('button', { name: /download csv/i }))
    const [, filename] = mockDownloadCsv.mock.calls[0]
    expect(filename).toMatch(/scenes/)
  })
})
