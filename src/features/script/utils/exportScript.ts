import { Document, Packer, Paragraph, TextRun, HeadingLevel } from 'docx'
import type { ScriptAct } from '../types/script'
import { mergeTextFromFrenchScenes, sortScriptItems } from './scriptUtils'

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
        if (item.new_content === ' ') continue
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
        if (item.new_content === ' ') continue
        const text = item.new_content ?? item.original_content
        children.push(
          new Paragraph({
            children: [new TextRun({ text, italics: true })],
            indent: INDENT_LEFT,
          })
        )
      } else {
        if (item.new_content === ' ') continue
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
          if (item.new_content !== ' ') {
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
          if (item.new_content !== ' ') {
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
          if (item.new_content !== ' ') {
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
