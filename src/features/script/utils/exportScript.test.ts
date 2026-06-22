import { describe, it, expect, vi, beforeEach } from 'vitest'

// Capture Paragraph constructor calls so tests can assert on document content
// without parsing a binary .docx file.
const { paragraphs } = vi.hoisted(() => {
  const paragraphs: { text?: string; children?: any[]; indent?: any; heading?: any }[] = []
  return { paragraphs }
})

vi.mock('docx', () => {
  class Paragraph {
    [key: string]: any
    constructor(opts: { text?: string; children?: any[]; indent?: any; heading?: any }) {
      Object.assign(this, opts)
      paragraphs.push(this)
    }
  }
  class TextRun {
    [key: string]: any
    constructor(opts: { text: string; [key: string]: any }) {
      Object.assign(this, opts)
    }
  }
  class Document {
    [key: string]: any
    constructor(opts: any) { Object.assign(this, opts) }
  }
  const Packer = {
    toBlob: () =>
      Promise.resolve(
        new Blob(['docx'], {
          type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        })
      ),
  }
  const HeadingLevel = { HEADING_1: 1, HEADING_2: 2 }
  return { Paragraph, TextRun, Document, Packer, HeadingLevel }
})

import { generateCutScript, generateMarkedScript } from './exportScript'
import type { ScriptAct, ScriptLine, ScriptStageDirection } from '../types/script'

function allTexts(): string[] {
  return paragraphs.flatMap(p => {
    const out: string[] = []
    if (p.text) out.push(p.text)
    if (p.children) p.children.forEach((r: any) => { if (typeof r.text === 'string') out.push(r.text) })
    return out
  })
}

function allRuns(): any[] {
  return paragraphs.flatMap(p => p.children ?? [])
}

function makeLine(overrides: Partial<ScriptLine> = {}): ScriptLine {
  return {
    id: 1, number: '1.1.1', kind: null,
    original_content: 'Original text', new_content: null,
    character_id: null, character_group_id: null, french_scene_id: 1,
    xml_id: null, character: null, character_group: null,
    ...overrides,
  }
}

function makeSd(overrides: Partial<ScriptStageDirection> = {}): ScriptStageDirection {
  return {
    id: 10, number: 'SD 1.1.2', kind: null,
    original_content: 'Stage direction', new_content: null,
    french_scene_id: 1, xml_id: null,
    ...overrides,
  }
}

function makeAct(lines: ScriptLine[] = [], stage_directions: ScriptStageDirection[] = []): ScriptAct {
  return {
    id: 1, number: 1,
    scenes: [{
      id: 1, number: 1, pretty_name: '1',
      french_scenes: [{
        id: 1, number: '1', pretty_name: '1',
        lines, stage_directions, sound_cues: [],
      }],
    }],
  }
}

beforeEach(() => {
  paragraphs.length = 0
})

describe('generateCutScript', () => {
  it('returns a Blob', async () => {
    await expect(generateCutScript(makeAct(), 'Hamlet')).resolves.toBeInstanceOf(Blob)
  })

  it('includes the play title in the heading paragraph', async () => {
    await generateCutScript(makeAct(), 'A Midsummer Night\'s Dream')
    expect(allTexts().join(' ')).toContain("A Midsummer Night's Dream")
  })

  it('excludes cut lines (new_content is empty string)', async () => {
    const cut = makeLine({ number: '1.1.1', original_content: 'Cut this out', new_content: '' })
    await generateCutScript(makeAct([cut]), 'Hamlet')
    expect(allTexts().join(' ')).not.toContain('Cut this out')
  })

  it('includes unedited lines using original_content', async () => {
    const line = makeLine({ number: '1.1.1', original_content: 'Keep this line' })
    await generateCutScript(makeAct([line]), 'Hamlet')
    expect(allTexts().join(' ')).toContain('Keep this line')
  })

  it('uses new_content for edited lines, not original_content', async () => {
    const line = makeLine({ number: '1.1.1', original_content: 'Old text', new_content: 'New text' })
    await generateCutScript(makeAct([line]), 'Hamlet')
    const texts = allTexts().join(' ')
    expect(texts).toContain('New text')
    expect(texts).not.toContain('Old text')
  })

  it('emits the character name as a bold TextRun', async () => {
    const line = makeLine({
      number: '1.1.1', original_content: 'My line',
      character_id: 5, character: { id: 5, name: 'Ophelia' },
    })
    await generateCutScript(makeAct([line]), 'Hamlet')
    const boldRuns = allRuns().filter((r: any) => r.bold)
    expect(boldRuns.some((r: any) => r.text === 'Ophelia')).toBe(true)
  })

  it('includes uncut stage directions', async () => {
    const sd = makeSd({ number: 'SD 1.1.2', original_content: 'Enter Hamlet' })
    await generateCutScript(makeAct([], [sd]), 'Hamlet')
    expect(allTexts().join(' ')).toContain('Enter Hamlet')
  })

  it('excludes cut stage directions', async () => {
    const sd = makeSd({ number: 'SD 1.1.2', original_content: 'Exit all', new_content: '' })
    await generateCutScript(makeAct([], [sd]), 'Hamlet')
    expect(allTexts().join(' ')).not.toContain('Exit all')
  })

  it('handles an empty act without throwing', async () => {
    await expect(generateCutScript(makeAct(), 'Hamlet')).resolves.toBeInstanceOf(Blob)
  })
})

describe('generateMarkedScript', () => {
  it('returns a Blob', async () => {
    await expect(generateMarkedScript(makeAct(), 'Hamlet')).resolves.toBeInstanceOf(Blob)
  })

  it('shows unedited lines without strikethrough', async () => {
    const line = makeLine({ number: '1.1.1', original_content: 'Keep as is' })
    await generateMarkedScript(makeAct([line]), 'Hamlet')
    const strikeRuns = allRuns().filter((r: any) => r.strike)
    expect(strikeRuns.some((r: any) => r.text.includes('Keep as is'))).toBe(false)
  })

  it('shows edited lines: original with strikethrough, new with underline', async () => {
    const line = makeLine({
      number: '1.1.1', original_content: 'Old text', new_content: 'New text',
    })
    await generateMarkedScript(makeAct([line]), 'Hamlet')
    const strikeRuns = allRuns().filter((r: any) => r.strike)
    const underlineRuns = allRuns().filter((r: any) => r.underline)
    expect(strikeRuns.some((r: any) => r.text === 'Old text')).toBe(true)
    expect(underlineRuns.some((r: any) => r.text.includes('New text'))).toBe(true)
  })

  it('shows edited stage directions: original with strikethrough, new with underline', async () => {
    const sd = makeSd({
      number: 'SD 1.1.2', original_content: 'Old direction', new_content: 'New direction',
    })
    await generateMarkedScript(makeAct([], [sd]), 'Hamlet')
    const strikeRuns = allRuns().filter((r: any) => r.strike)
    const underlineRuns = allRuns().filter((r: any) => r.underline)
    expect(strikeRuns.some((r: any) => r.text === 'Old direction')).toBe(true)
    expect(underlineRuns.some((r: any) => r.text.includes('New direction'))).toBe(true)
  })

  it('handles an empty act without throwing', async () => {
    await expect(generateMarkedScript(makeAct(), 'Hamlet')).resolves.toBeInstanceOf(Blob)
  })
})
