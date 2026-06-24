import { Document, Packer, Paragraph, TextRun, HeadingLevel } from 'docx'
import _ from 'lodash'
import type { ScriptAct } from '../types/script'
import { mergeTextFromFrenchScenes, sortScriptItems, isLineCut } from './scriptUtils'
import { sortLines } from '../../../utils/playScriptUtils'
import type { PartLine, PartText } from '../components/PartScripts/types'

const PAGE_SIZE = { width: 12240, height: 15840 }
const MARGIN = { top: 1440, bottom: 1440, left: 1440, right: 1440 }
const INDENT_LEFT = { left: 720 }

type ItemWithType =
  | (ReturnType<typeof mergeTextFromFrenchScenes>['lines'][number] & {
      _type: 'line'
    })
  | (ReturnType<typeof mergeTextFromFrenchScenes>['stage_directions'][number] & {
      _type: 'stage_direction'
    })
  | (ReturnType<typeof mergeTextFromFrenchScenes>['sound_cues'][number] & {
      _type: 'sound_cue'
    })

function collectItems(act: ScriptAct): {
  sceneLabel: string
  sorted: ItemWithType[]
}[] {
  return act.scenes.map(scene => {
    const allItems: ItemWithType[] = []
    for (const fs of scene.french_scenes) {
      const merged = mergeTextFromFrenchScenes([fs])
      for (const l of merged.lines) allItems.push({ ...l, _type: 'line' })
      for (const sd of merged.stage_directions)
        allItems.push({ ...sd, _type: 'stage_direction' })
      for (const sc of merged.sound_cues) {
        if (sc.original_content?.trim()) allItems.push({ ...sc, _type: 'sound_cue' })
      }
    }
    const filtered = allItems.filter(item => item.original_content?.trim())
    return {
      sceneLabel: `Scene ${scene.pretty_name}`,
      sorted: sortScriptItems(filtered) as ItemWithType[],
    }
  })
}

export async function generateCutScript(
  act: ScriptAct,
  playTitle: string
): Promise<Blob> {
  const children: Paragraph[] = [
    new Paragraph({
      text: `${playTitle} — Act ${act.number} (Cut Script)`,
      heading: HeadingLevel.HEADING_1,
    }),
  ]

  for (const { sceneLabel, sorted } of collectItems(act)) {
    children.push(new Paragraph({ text: sceneLabel, heading: HeadingLevel.HEADING_2 }))

    for (const item of sorted) {
      if (item._type === 'line') {
        if (isLineCut(item)) continue
        const text = item.new_content ?? item.original_content
        children.push(
          new Paragraph({
            children: item.character
              ? [
                  new TextRun({ text: item.character.name, bold: true }),
                  new TextRun({ text: `  ${text}` }),
                ]
              : [new TextRun({ text })],
          })
        )
      } else if (item._type === 'stage_direction') {
        if (isLineCut(item)) continue
        const text = item.new_content ?? item.original_content
        children.push(
          new Paragraph({
            children: [new TextRun({ text, italics: true })],
            indent: INDENT_LEFT,
          })
        )
      } else {
        if (isLineCut(item)) continue
        const text = (item.new_content ?? item.original_content) ?? ''
        if (!text.trim()) continue
        children.push(
          new Paragraph({
            children: [new TextRun({ text: `[Sound: ${text}]`, italics: true })],
            indent: INDENT_LEFT,
          })
        )
      }
    }
  }

  const doc = new Document({
    sections: [{ properties: { page: { size: PAGE_SIZE, margin: MARGIN } }, children }],
  })
  return Packer.toBlob(doc)
}

export async function generateMarkedScript(
  act: ScriptAct,
  playTitle: string
): Promise<Blob> {
  const children: Paragraph[] = [
    new Paragraph({
      text: `${playTitle} — Act ${act.number} (Cuts Marked)`,
      heading: HeadingLevel.HEADING_1,
    }),
  ]

  for (const { sceneLabel, sorted } of collectItems(act)) {
    children.push(new Paragraph({ text: sceneLabel, heading: HeadingLevel.HEADING_2 }))

    for (const item of sorted) {
      if (item._type === 'line') {
        if (item.new_content) {
          const runs: TextRun[] = []
          if (item.character) {
            runs.push(new TextRun({ text: item.character.name, bold: true }))
            runs.push(new TextRun({ text: '  ' }))
          }
          runs.push(new TextRun({ text: item.original_content, strike: true }))
          if (!isLineCut(item)) {
            runs.push(new TextRun({ text: ` ${item.new_content}`, underline: {} }))
          }
          children.push(new Paragraph({ children: runs }))
        } else {
          children.push(
            new Paragraph({
              children: item.character
                ? [
                    new TextRun({ text: item.character.name, bold: true }),
                    new TextRun({ text: `  ${item.original_content}` }),
                  ]
                : [new TextRun({ text: item.original_content })],
            })
          )
        }
      } else if (item._type === 'stage_direction') {
        if (item.new_content) {
          const runs: TextRun[] = [
            new TextRun({ text: item.original_content, italics: true, strike: true }),
          ]
          if (!isLineCut(item)) {
            runs.push(
              new TextRun({ text: ` ${item.new_content}`, italics: true, underline: {} })
            )
          }
          children.push(new Paragraph({ children: runs, indent: INDENT_LEFT }))
        } else {
          children.push(
            new Paragraph({
              children: [new TextRun({ text: item.original_content, italics: true })],
              indent: INDENT_LEFT,
            })
          )
        }
      } else {
        const originalText = item.original_content ?? ''
        if (!originalText.trim()) continue
        if (item.new_content) {
          const runs: TextRun[] = [
            new TextRun({
              text: `[Sound: ${originalText}]`,
              italics: true,
              strike: true,
            }),
          ]
          if (!isLineCut(item)) {
            runs.push(
              new TextRun({
                text: ` [Sound: ${item.new_content}]`,
                italics: true,
                underline: {},
              })
            )
          }
          children.push(new Paragraph({ children: runs, indent: INDENT_LEFT }))
        } else {
          children.push(
            new Paragraph({
              children: [
                new TextRun({ text: `[Sound: ${originalText}]`, italics: true }),
              ],
              indent: INDENT_LEFT,
            })
          )
        }
      }
    }
  }

  const doc = new Document({
    sections: [{ properties: { page: { size: PAGE_SIZE, margin: MARGIN } }, children }],
  })
  return Packer.toBlob(doc)
}

// ── Part script helpers ────────────────────────────────────────────────────

type IndexedPartLine = PartLine & { _idx: number }

function isPartLineCut(line: PartLine): boolean {
  return line.new_content != null && line.new_content.trim() === ''
}

function ellide(content: string): string {
  const words = content.split(' ')
  return `${words.length >= 3 ? '…' : ''}${words.slice(-3).join(' ')}`
}

function findClosestCue(
  i: number,
  lineIndex: number,
  lines: IndexedPartLine[],
  characterIds: number[],
  showCut: boolean
): PartLine | null | undefined {
  const testLine = lines[lineIndex - i]
  if (!testLine) return undefined
  const cid = testLine.character_id
  if (cid != null && characterIds.includes(cid)) return null
  if (testLine.number.match(/^SD/)) return testLine
  if (!showCut && isPartLineCut(testLine)) return null
  if (!showCut && testLine.new_content) return { ...testLine, new_content: ellide(testLine.new_content) }
  if (!testLine.new_content) return { ...testLine, original_content: ellide(testLine.original_content) }
  if (cid !== lines[lineIndex].character_id) return testLine
  const next = i + 1
  if (lineIndex - next < 0) return undefined
  // intentional missing return — mirrors display logic; _.compact filters undefined
  findClosestCue(next, lineIndex, lines, characterIds, showCut)
}

function cullPartLines(
  text: PartText,
  characterIds: number[],
  showCut: boolean
): PartLine[] {
  let bucket: PartLine[] = [
    ...text.lines,
    ...text.stage_directions,
    ...text.sound_cues,
  ].filter(l => l.original_content.trim() !== '')

  if (!showCut) {
    bucket = bucket.filter(l => l.new_content == null || !isPartLineCut(l))
  }

  const ordered = sortLines(bucket as Parameters<typeof sortLines>[0]) as PartLine[]
  const indexed: IndexedPartLine[] = ordered.map((l, i) => ({ ...l, _idx: i }))
  const charLines = indexed.filter(l => characterIds.includes(l.character_id ?? -1))
  const cueLines = _.compact(
    charLines.map(cl => {
      if (indexed[cl._idx - 1]?.character_id === cl.character_id) return undefined
      return findClosestCue(1, cl._idx, indexed, characterIds, showCut)
    })
  )
  return sortLines(
    [...charLines, ...cueLines] as Parameters<typeof sortLines>[0]
  ) as PartLine[]
}

function partLineParagraph(
  line: PartLine,
  characterIds: number[],
  marked: boolean
): Paragraph {
  const isTarget = characterIds.includes(line.character_id ?? -1)
  const numRun = new TextRun({ text: `${line.number}\t`, color: '999999', size: 18 })

  if (!isTarget) {
    const text = line.new_content?.trim() || line.original_content
    return new Paragraph({
      children: [numRun, new TextRun({ text, italics: true, color: '888888' })],
      indent: INDENT_LEFT,
    })
  }

  const nameRun = line.character
    ? new TextRun({ text: `${line.character.name}\t`, bold: true })
    : undefined

  if (!marked) {
    const text = line.new_content?.trim() || line.original_content
    const runs: TextRun[] = _.compact([numRun, nameRun, new TextRun({ text })])
    return new Paragraph({ children: runs })
  }

  if (isPartLineCut(line)) {
    const runs: TextRun[] = _.compact([
      numRun,
      nameRun,
      new TextRun({ text: line.original_content, strike: true, color: 'CC0000' }),
    ])
    return new Paragraph({ children: runs })
  }
  if (line.new_content?.trim()) {
    const runs: TextRun[] = _.compact([
      numRun,
      nameRun,
      new TextRun({ text: line.original_content, strike: true }),
      new TextRun({ text: ` ${line.new_content}`, underline: {} }),
    ])
    return new Paragraph({ children: runs })
  }
  const runs: TextRun[] = _.compact([numRun, nameRun, new TextRun({ text: line.original_content })])
  return new Paragraph({ children: runs })
}

export async function generateCutPartScript(
  text: PartText,
  characterIds: number[],
  name: string,
  playTitle: string
): Promise<Blob> {
  const culled = cullPartLines(text, characterIds, false)
  const children: Paragraph[] = [
    new Paragraph({
      text: `${playTitle} — Part Script for ${name} (Cut)`,
      heading: HeadingLevel.HEADING_1,
    }),
    ...culled.map(l => partLineParagraph(l, characterIds, false)),
  ]
  const doc = new Document({
    sections: [{ properties: { page: { size: PAGE_SIZE, margin: MARGIN } }, children }],
  })
  return Packer.toBlob(doc)
}

export async function generateMarkedPartScript(
  text: PartText,
  characterIds: number[],
  name: string,
  playTitle: string
): Promise<Blob> {
  const culled = cullPartLines(text, characterIds, true)
  const children: Paragraph[] = [
    new Paragraph({
      text: `${playTitle} — Part Script for ${name} (Cuts Marked)`,
      heading: HeadingLevel.HEADING_1,
    }),
    ...culled.map(l => partLineParagraph(l, characterIds, true)),
  ]
  const doc = new Document({
    sections: [{ properties: { page: { size: PAGE_SIZE, margin: MARGIN } }, children }],
  })
  return Packer.toBlob(doc)
}
