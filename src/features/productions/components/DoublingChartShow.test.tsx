import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

// Mock downloadCsv so we can assert on what it's called with
const { mockDownloadCsv } = vi.hoisted(() => ({ mockDownloadCsv: vi.fn() }))
vi.mock('../../../utils/csvUtils', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../../utils/csvUtils')>()
  return { ...actual, downloadCsv: mockDownloadCsv }
})

vi.mock('@tanstack/react-router', () => ({
  Link: ({ children, className }: any) => <span className={className}>{children}</span>,
}))

import { DoublingChartShow } from './DoublingChartShow'
import type { ChartPlay } from './DoublingChartShow'

// ─── shared test data ─────────────────────────────────────────────────────────

const play: ChartPlay = {
  id: 1,
  title: 'Hamlet',
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
          on_stages: [
            { character_id: 1, nonspeaking: false, offstage: false, character: { id: 1, name: 'Hamlet' } },
            { character_id: 2, nonspeaking: true,  offstage: false, character: { id: 2, name: 'Ghost' } },
            { character_id: 4, nonspeaking: false, offstage: true,  character: { id: 4, name: 'Horatio' } },
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
          on_stages: [
            { character_id: 1, nonspeaking: false, offstage: false, character: { id: 1, name: 'Hamlet' } },
            { character_id: 3, nonspeaking: false, offstage: false, character: { id: 3, name: 'Claudius' } },
          ],
        }],
      }],
    },
  ],
}

// Alice plays Hamlet (speaking) and Ghost (nonspeaking).
// Claudius is uncast (user_id: null).
const castings: any[] = [
  { id: 1, user_id: 10, character_id: 1, character: { id: 1, name: 'Hamlet', new_line_count: null, original_line_count: null }, production_id: 1, theater_id: null, specialization_id: null, character_group_id: null, start_date: null, end_date: null, created_at: '', updated_at: '', specialization: null, theater: null, character_group: null, production: null, user: null },
  { id: 2, user_id: 10, character_id: 2, character: { id: 2, name: 'Ghost', new_line_count: null, original_line_count: null }, production_id: 1, theater_id: null, specialization_id: null, character_group_id: null, start_date: null, end_date: null, created_at: '', updated_at: '', specialization: null, theater: null, character_group: null, production: null, user: null },
  { id: 3, user_id: null, character_id: 3, character: { id: 3, name: 'Claudius', new_line_count: null, original_line_count: null }, production_id: 1, theater_id: null, specialization_id: null, character_group_id: null, start_date: null, end_date: null, created_at: '', updated_at: '', specialization: null, theater: null, character_group: null, production: null, user: null },
  { id: 4, user_id: 10, character_id: 4, character: { id: 4, name: 'Horatio', new_line_count: null, original_line_count: null }, production_id: 1, theater_id: null, specialization_id: null, character_group_id: null, start_date: null, end_date: null, created_at: '', updated_at: '', specialization: null, theater: null, character_group: null, production: null, user: null },
]

const actors: any[] = [
  { id: 10, email: 'alice@test.com', first_name: 'Alice', last_name: 'Smith' },
]

function renderChart(level: 'act' | 'scene' | 'french_scene' = 'act') {
  render(<DoublingChartShow level={level} play={play} castings={castings} actors={actors} />)
}

beforeEach(() => {
  mockDownloadCsv.mockReset()
})

// ─── rendering ────────────────────────────────────────────────────────────────

describe('DoublingChartShow rendering', () => {
  it('shows a "Download CSV" button', () => {
    renderChart()
    expect(screen.getByRole('button', { name: /download csv/i })).toBeInTheDocument()
  })

  it('renders column headers for acts', () => {
    renderChart('act')
    expect(screen.getByText('Act 1')).toBeInTheDocument()
    expect(screen.getByText('Act 2')).toBeInTheDocument()
  })

  it('renders column headers for scenes', () => {
    renderChart('scene')
    expect(screen.getByText('1.1')).toBeInTheDocument()
    expect(screen.getByText('2.1')).toBeInTheDocument()
  })

  it('renders column headers for french scenes', () => {
    renderChart('french_scene')
    expect(screen.getByText('1.1.1')).toBeInTheDocument()
    expect(screen.getByText('2.1.1')).toBeInTheDocument()
  })

  it('renders the actor name as a row header', () => {
    renderChart()
    expect(screen.getByText('Alice Smith')).toBeInTheDocument()
  })

  it('renders a "Still to cast" row', () => {
    renderChart()
    expect(screen.getByText('Still to cast')).toBeInTheDocument()
  })

  it('shows empty state when there are no castings', () => {
    render(<DoublingChartShow level="act" play={play} castings={[]} actors={[]} />)
    expect(screen.getByText(/no casting data available/i)).toBeInTheDocument()
  })
})

// ─── CSV download — acts level ────────────────────────────────────────────────

describe('DoublingChartShow CSV download (acts)', () => {
  it('calls downloadCsv once when the button is clicked', async () => {
    const user = userEvent.setup()
    renderChart('act')
    await user.click(screen.getByRole('button', { name: /download csv/i }))
    expect(mockDownloadCsv).toHaveBeenCalledOnce()
  })

  it('passes the correct header row', async () => {
    const user = userEvent.setup()
    renderChart('act')
    await user.click(screen.getByRole('button', { name: /download csv/i }))
    const [rows] = mockDownloadCsv.mock.calls[0]
    expect(rows[0]).toEqual(['Actor', 'Act 1', 'Act 2'])
  })

  it('includes speaking, nonspeaking, and offstage characters for the actor row', async () => {
    const user = userEvent.setup()
    renderChart('act')
    await user.click(screen.getByRole('button', { name: /download csv/i }))
    const [rows] = mockDownloadCsv.mock.calls[0]
    // Alice plays Hamlet (speaking) + Ghost (nonspeaking) + Horatio (offstage) in Act 1
    const aliceRow = rows.find((r: string[]) => r[0] === 'Alice Smith')
    expect(aliceRow).toBeDefined()
    expect(aliceRow[1]).toContain('Hamlet')
    expect(aliceRow[1]).toContain('(Ghost)')
    expect(aliceRow[1]).toContain('(Horatio)')
    // Only Hamlet appears in Act 2 for Alice
    expect(aliceRow[2]).toBe('Hamlet')
  })

  it('wraps an offstage character in parentheses in the CSV', async () => {
    const user = userEvent.setup()
    renderChart('act')
    await user.click(screen.getByRole('button', { name: /download csv/i }))
    const [rows] = mockDownloadCsv.mock.calls[0]
    const aliceRow = rows.find((r: string[]) => r[0] === 'Alice Smith')
    expect(aliceRow[1]).toContain('(Horatio)')
  })

  it('lists uncast characters in the Still to cast row', async () => {
    const user = userEvent.setup()
    renderChart('act')
    await user.click(screen.getByRole('button', { name: /download csv/i }))
    const [rows] = mockDownloadCsv.mock.calls[0]
    const uncastRow = rows.find((r: string[]) => r[0] === 'Still to cast')
    expect(uncastRow).toBeDefined()
    // Claudius is uncast and only in Act 2
    expect(uncastRow[1]).toBe('')
    expect(uncastRow[2]).toBe('Claudius')
  })

  it('uses a slug of the play title in the filename', async () => {
    const user = userEvent.setup()
    renderChart('act')
    await user.click(screen.getByRole('button', { name: /download csv/i }))
    const [, filename] = mockDownloadCsv.mock.calls[0]
    expect(filename).toMatch(/hamlet/)
    expect(filename).toMatch(/acts/)
    expect(filename).toMatch(/\.csv$/)
  })
})

// ─── CSV download — scenes / french scenes filenames ─────────────────────────

describe('DoublingChartShow CSV download filename by level', () => {
  it.each([
    ['scene', /scenes/],
    ['french_scene', /french-scenes/],
  ] as const)('level=%s produces a filename containing %s', async (level, pattern) => {
    const user = userEvent.setup()
    renderChart(level)
    await user.click(screen.getByRole('button', { name: /download csv/i }))
    const [, filename] = mockDownloadCsv.mock.calls[0]
    expect(filename).toMatch(pattern)
  })

  it('scenes header row contains scene pretty names', async () => {
    const user = userEvent.setup()
    renderChart('scene')
    await user.click(screen.getByRole('button', { name: /download csv/i }))
    const [rows] = mockDownloadCsv.mock.calls[0]
    expect(rows[0]).toEqual(['Actor', '1.1', '2.1'])
  })

  it('french_scene header row contains french scene pretty names', async () => {
    const user = userEvent.setup()
    renderChart('french_scene')
    await user.click(screen.getByRole('button', { name: /download csv/i }))
    const [rows] = mockDownloadCsv.mock.calls[0]
    expect(rows[0]).toEqual(['Actor', '1.1.1', '2.1.1'])
  })
})

// ─── character groups ─────────────────────────────────────────────────────────

// Act 1: Hamlet (char) + Ensemble (group) both on-stage → Alice has a doubling problem
// Act 2: Townspeople (group) on-stage, uncast
const playWithGroups: ChartPlay = {
  id: 2,
  title: 'Test Play',
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
          on_stages: [
            { character_id: 1, character_group_id: null, nonspeaking: false, offstage: false, character: { id: 1, name: 'Hamlet' }, character_group: null },
            { character_id: null, character_group_id: 10, nonspeaking: false, offstage: false, character: null, character_group: { id: 10, name: 'Ensemble' } },
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
          on_stages: [
            { character_id: null, character_group_id: 20, nonspeaking: false, offstage: false, character: null, character_group: { id: 20, name: 'Townspeople' } },
          ],
        }],
      }],
    },
  ],
} as unknown as ChartPlay

// Alice (id 10) plays Hamlet AND is in Ensemble; Townspeople is uncast
const castingsWithGroups: any[] = [
  { id: 1, user_id: 10, character_id: 1, character: { id: 1, name: 'Hamlet', new_line_count: null, original_line_count: null }, production_id: 1, theater_id: null, specialization_id: null, character_group_id: null, start_date: null, end_date: null, created_at: '', updated_at: '', specialization: null, theater: null, character_group: null, production: null, user: null },
  { id: 2, user_id: 10, character_id: null, character: null, production_id: 1, theater_id: null, specialization_id: null, character_group_id: 10, start_date: null, end_date: null, created_at: '', updated_at: '', specialization: null, theater: null, character_group: { id: 10, name: 'Ensemble' }, production: null, user: null },
  { id: 3, user_id: null, character_id: null, character: null, production_id: 1, theater_id: null, specialization_id: null, character_group_id: 20, start_date: null, end_date: null, created_at: '', updated_at: '', specialization: null, theater: null, character_group: { id: 20, name: 'Townspeople' }, production: null, user: null },
]

describe('DoublingChartShow character group rendering', () => {
  it('shows character group name in the actor row', () => {
    render(<DoublingChartShow level="act" play={playWithGroups} castings={castingsWithGroups} actors={actors} />)
    expect(screen.getByText('Alice Smith').closest('tr')).toHaveTextContent('Ensemble')
  })

  it('shows the character alongside the character group in the same cell', () => {
    render(<DoublingChartShow level="act" play={playWithGroups} castings={castingsWithGroups} actors={actors} />)
    const aliceRow = screen.getByText('Alice Smith').closest('tr')!
    expect(aliceRow).toHaveTextContent('Hamlet')
    expect(aliceRow).toHaveTextContent('Ensemble')
  })

  it('flags the doubling problem when actor has both a character and a character group in the same block', () => {
    render(<DoublingChartShow level="act" play={playWithGroups} castings={castingsWithGroups} actors={actors} />)
    const aliceRow = screen.getByText('Alice Smith').closest('tr')!
    // first td is name, second is Act 1 (where both Hamlet and Ensemble are on-stage)
    const cells = aliceRow.querySelectorAll('td')
    expect(cells[1].className).toContain('bg-orange-400')
  })

  it('does not flag doubling when actor only has a character group in a block', () => {
    // Only Ensemble (character group) is on-stage in Act 1 for this casting
    const singleGroupCastings: any[] = [
      { id: 2, user_id: 10, character_id: null, character: null, production_id: 1, theater_id: null, specialization_id: null, character_group_id: 10, start_date: null, end_date: null, created_at: '', updated_at: '', specialization: null, theater: null, character_group: { id: 10, name: 'Ensemble' }, production: null, user: null },
    ]
    render(<DoublingChartShow level="act" play={playWithGroups} castings={singleGroupCastings} actors={actors} />)
    const aliceRow = screen.getByText('Alice Smith').closest('tr')!
    const cells = aliceRow.querySelectorAll('td')
    expect(cells[1].className).not.toContain('bg-orange-400')
  })

  it('shows uncast character group in the Still to cast row', () => {
    render(<DoublingChartShow level="act" play={playWithGroups} castings={castingsWithGroups} actors={actors} />)
    const uncastRow = screen.getByText('Still to cast').closest('tr')!
    expect(uncastRow).toHaveTextContent('Townspeople')
  })

  it('does not show cast character group in the Still to cast row', () => {
    render(<DoublingChartShow level="act" play={playWithGroups} castings={castingsWithGroups} actors={actors} />)
    const uncastRow = screen.getByText('Still to cast').closest('tr')!
    expect(uncastRow).not.toHaveTextContent('Ensemble')
  })
})

describe('DoublingChartShow character group CSV', () => {
  it('includes character group name in the actor CSV row', async () => {
    const user = userEvent.setup()
    render(<DoublingChartShow level="act" play={playWithGroups} castings={castingsWithGroups} actors={actors} />)
    await user.click(screen.getByRole('button', { name: /download csv/i }))
    const [rows] = mockDownloadCsv.mock.calls[0]
    const aliceRow = rows.find((r: string[]) => r[0] === 'Alice Smith')
    expect(aliceRow[1]).toContain('Ensemble')
  })

  it('includes the regular character alongside the character group in the actor CSV row', async () => {
    const user = userEvent.setup()
    render(<DoublingChartShow level="act" play={playWithGroups} castings={castingsWithGroups} actors={actors} />)
    await user.click(screen.getByRole('button', { name: /download csv/i }))
    const [rows] = mockDownloadCsv.mock.calls[0]
    const aliceRow = rows.find((r: string[]) => r[0] === 'Alice Smith')
    expect(aliceRow[1]).toContain('Hamlet')
    expect(aliceRow[1]).toContain('Ensemble')
  })

  it('includes uncast character group in the Still to cast CSV row', async () => {
    const user = userEvent.setup()
    render(<DoublingChartShow level="act" play={playWithGroups} castings={castingsWithGroups} actors={actors} />)
    await user.click(screen.getByRole('button', { name: /download csv/i }))
    const [rows] = mockDownloadCsv.mock.calls[0]
    const uncastRow = rows.find((r: string[]) => r[0] === 'Still to cast')
    expect(uncastRow[2]).toBe('Townspeople')
  })

  it('does not include cast character group in the Still to cast CSV row', async () => {
    const user = userEvent.setup()
    render(<DoublingChartShow level="act" play={playWithGroups} castings={castingsWithGroups} actors={actors} />)
    await user.click(screen.getByRole('button', { name: /download csv/i }))
    const [rows] = mockDownloadCsv.mock.calls[0]
    const uncastRow = rows.find((r: string[]) => r[0] === 'Still to cast')
    expect(uncastRow[1]).not.toContain('Ensemble')
  })
})
