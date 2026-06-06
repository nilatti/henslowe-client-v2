import { describe, it, expect } from 'vitest'
import {
  calculateLineCount,
  calculateRunTime,
  determineTypeOfLine,
  filterEmptyContent,
  getLinesForCharacter,
  sortLines,
  isCut,
  isEdited,
  isUnedited,
} from './playScriptUtils'

describe('calculateLineCount', () => {
  it('returns "0.00" for empty array', () => {
    expect(calculateLineCount([])).toBe('0.00')
  })

  it('returns a numeric string for non-empty lines', () => {
    const lines = [
      { original_content: 'To be or not to be that is the question' },
      { original_content: 'Whether tis nobler in the mind to suffer' },
    ] as any[]
    const result = calculateLineCount(lines)
    expect(typeof result).toBe('string')
    expect(parseFloat(result)).toBeGreaterThan(0)
  })

  it('uses new_content when present', () => {
    const withNew = [
      { original_content: 'original long line here', new_content: 'hi' },
    ] as any[]
    const withoutNew = [
      { original_content: 'original long line here' },
    ] as any[]
    // shorter new_content should produce a smaller syllable count
    expect(parseFloat(calculateLineCount(withNew))).toBeLessThan(
      parseFloat(calculateLineCount(withoutNew)),
    )
  })
})

describe('calculateRunTime', () => {
  it('returns 0 for empty lines', () => {
    expect(calculateRunTime([], 10)).toBe(0)
  })

  it('returns a non-negative integer', () => {
    const lines = [{ original_content: 'To be or not to be' }] as any[]
    const result = calculateRunTime(lines, 1)
    expect(typeof result).toBe('number')
    expect(result).toBeGreaterThanOrEqual(0)
  })
})

describe('determineTypeOfLine', () => {
  it('classifies entrance as stage_direction', () => {
    expect(determineTypeOfLine({ kind: 'entrance', original_content: '' } as any)).toBe('stage_direction')
  })

  it('classifies exit as stage_direction', () => {
    expect(determineTypeOfLine({ kind: 'exit', original_content: '' } as any)).toBe('stage_direction')
  })

  it('classifies business as stage_direction', () => {
    expect(determineTypeOfLine({ kind: 'business', original_content: '' } as any)).toBe('stage_direction')
  })

  it('classifies flourish as sound_cue', () => {
    expect(determineTypeOfLine({ kind: 'flourish', original_content: '' } as any)).toBe('sound_cue')
  })

  it('classifies music as sound_cue', () => {
    expect(determineTypeOfLine({ kind: 'music', original_content: '' } as any)).toBe('sound_cue')
  })

  it('classifies dialogue as line', () => {
    expect(determineTypeOfLine({ kind: 'dialogue', original_content: 'To be' } as any)).toBe('line')
  })

  it('classifies undefined kind as line', () => {
    expect(determineTypeOfLine({ original_content: 'Some text' } as any)).toBe('line')
  })
})

describe('filterEmptyContent', () => {
  it('keeps items without original_line_count (treat as not empty)', () => {
    const items = [{}, {}] as any[]
    expect(filterEmptyContent(items)).toHaveLength(2)
  })

  it('removes items with original_line_count > 0 but new_line_count = 0', () => {
    const items = [
      { original_line_count: 10, new_line_count: 5 },
      { original_line_count: 10, new_line_count: 0 },
    ]
    expect(filterEmptyContent(items)).toHaveLength(1)
  })

  it('keeps items where both counts are > 0', () => {
    const items = [
      { original_line_count: 10, new_line_count: 5 },
      { original_line_count: 8, new_line_count: 3 },
    ]
    expect(filterEmptyContent(items)).toHaveLength(2)
  })
})

describe('getLinesForCharacter', () => {
  const lines = [
    { character_id: 1, original_content: 'Line A' },
    { character_id: 2, original_content: 'Line B' },
    { character_id: 1, original_content: 'Line C' },
  ] as any[]

  it('returns lines for the given character', () => {
    const result = getLinesForCharacter(lines, 1)
    expect(result).toHaveLength(2)
    expect(result.every(l => l.character_id === 1)).toBe(true)
  })

  it('returns empty array when character has no lines', () => {
    expect(getLinesForCharacter(lines, 99)).toHaveLength(0)
  })
})

describe('isCut / isEdited / isUnedited', () => {
  const cut = { original_content: 'x', new_content: '' }
  const edited = { original_content: 'x', new_content: 'y' }
  const unedited = { original_content: 'x', new_content: null }

  it('isCut returns true only for empty-string new_content', () => {
    expect(isCut(cut as any)).toBe(true)
    expect(isCut(edited as any)).toBe(false)
    expect(isCut(unedited as any)).toBe(false)
  })

  it('isEdited returns true only for non-empty new_content', () => {
    expect(isEdited(edited as any)).toBe(true)
    expect(isEdited(cut as any)).toBe(false)
    expect(isEdited(unedited as any)).toBe(false)
  })

  it('isUnedited returns true only for null new_content', () => {
    expect(isUnedited(unedited as any)).toBe(true)
    expect(isUnedited(cut as any)).toBe(false)
    expect(isUnedited(edited as any)).toBe(false)
  })
})

describe('sortLines', () => {
  it('sorts lines by act, scene, line number', () => {
    const lines = [
      { number: '2.1.5', original_content: 'later' },
      { number: '1.1.1', original_content: 'first' },
      { number: '1.2.1', original_content: 'second scene' },
    ] as any[]
    const sorted = sortLines(lines)
    expect(sorted[0].original_content).toBe('first')
    expect(sorted[1].original_content).toBe('second scene')
    expect(sorted[2].original_content).toBe('later')
  })

  it('handles epilogue lines (EPI prefix)', () => {
    const lines = [
      { number: 'EPI.1', original_content: 'epilogue' },
      { number: '1.1.1', original_content: 'act one' },
    ] as any[]
    const sorted = sortLines(lines)
    expect(sorted[0].original_content).toBe('act one')
    expect(sorted[1].original_content).toBe('epilogue')
  })
})
