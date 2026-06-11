import { useState } from 'react'
import { useSuspenseQuery } from '@tanstack/react-query'
import { playScriptQueryOptions } from '../../api/script'
import { Button, Tabs } from '../../../../components/ui'
import { downloadCsv, slugify } from '../../../../utils/csvUtils'

type Level = 'act' | 'scene' | 'french_scene'

const TABS = [
  { id: 'act', label: 'Acts' },
  { id: 'scene', label: 'Scenes' },
  { id: 'french_scene', label: 'French Scenes' },
] as const

interface MatrixOnStage {
  character_id: number | null
  character_group_id: number | null
  nonspeaking: boolean
  offstage: boolean
}

interface MatrixFrenchScene {
  id: number
  pretty_name: string
  on_stages: MatrixOnStage[]
}

interface MatrixScene {
  id: number
  pretty_name: string
  french_scenes: MatrixFrenchScene[]
}

interface MatrixAct {
  id: number
  number: number
  scenes: MatrixScene[]
}

type MatrixRow =
  | { kind: 'character'; id: number; name: string }
  | { kind: 'character_group'; id: number; name: string }

interface Column {
  label: string
  onStages: MatrixOnStage[]
}

interface Props {
  playId: number
}

export function CharacterMatrixChart({ playId }: Props) {
  const { data: script } = useSuspenseQuery(playScriptQueryOptions(playId))
  const [level, setLevel] = useState<Level>('act')

  const acts = script.acts as unknown as MatrixAct[]

  const rows: MatrixRow[] = [
    ...script.characters.map(c => ({ kind: 'character' as const, id: c.id, name: c.name })),
    ...script.character_groups.map(cg => ({ kind: 'character_group' as const, id: cg.id, name: cg.name })),
  ].sort((a, b) => a.name.localeCompare(b.name))

  function getAllOnStages(fss: MatrixFrenchScene[]): MatrixOnStage[] {
    return fss.flatMap(fs => fs.on_stages ?? [])
  }

  function buildColumns(): Column[] {
    if (level === 'act') {
      return acts.map(act => ({
        label: `Act ${act.number}`,
        onStages: getAllOnStages(act.scenes.flatMap(s => s.french_scenes)),
      }))
    } else if (level === 'scene') {
      return acts.flatMap(act =>
        act.scenes.map(scene => ({
          label: scene.pretty_name,
          onStages: getAllOnStages(scene.french_scenes),
        })),
      )
    } else {
      return acts.flatMap(act =>
        act.scenes.flatMap(scene =>
          scene.french_scenes.map(fs => ({
            label: fs.pretty_name,
            onStages: fs.on_stages ?? [],
          })),
        ),
      )
    }
  }

  function getCellValue(row: MatrixRow, onStages: MatrixOnStage[]): string {
    const matching = onStages.filter(os =>
      row.kind === 'character' ? os.character_id === row.id : os.character_group_id === row.id,
    )
    if (matching.length === 0) return ''
    if (matching.some(os => !os.nonspeaking && !os.offstage)) return 'X'
    return '(X)'
  }

  const columns = buildColumns()

  function generateCsvRows(): string[][] {
    const header = ['Character', ...columns.map(c => c.label)]
    const dataRows = rows.map(row => [row.name, ...columns.map(col => getCellValue(row, col.onStages))])
    return [header, ...dataRows]
  }

  function handleDownload() {
    const levelLabel = level === 'act' ? 'acts' : level === 'scene' ? 'scenes' : 'french-scenes'
    downloadCsv(generateCsvRows(), `${slugify(script.title)}-character-matrix-${levelLabel}.csv`)
  }

  if (rows.length === 0) {
    return <p className="text-sm text-gray-500 py-4">No characters found.</p>
  }

  return (
    <div>
      <div className="flex items-start justify-between">
        <Tabs tabs={[...TABS]} activeTab={level} onChange={id => setLevel(id as Level)} />
        <div className="mb-6 ml-2 shrink-0">
          <Button variant="secondary" className="text-xs px-3 py-1.5" onClick={handleDownload}>
            Download CSV
          </Button>
        </div>
      </div>
      <div className="w-full overflow-x-auto">
        <table
          className="border-collapse"
          style={{ width: 'max-content', tableLayout: 'auto' }}
        >
          <thead>
            <tr>
              <th
                className="border border-gray-400 px-2 py-2 text-sm font-bold text-left bg-white sticky left-0 z-10"
                style={{ width: '200px', minWidth: '200px' }}
              >
                Character
              </th>
              {columns.map((col, i) => (
                <th
                  key={i}
                  className="border border-gray-400 px-2 py-2 text-sm font-bold text-center bg-white"
                  style={{ minWidth: '60px' }}
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map(row => {
              const cells = columns.map(col => getCellValue(row, col.onStages))
              return (
                <tr key={`${row.kind}-${row.id}`} className="odd:bg-white even:bg-teal-50 hover:bg-blue-50 transition-colors">
                  <td
                    className="border border-gray-400 px-2 py-1 text-sm font-medium sticky left-0 bg-inherit z-10"
                    style={{ width: '200px', minWidth: '200px' }}
                  >
                    {row.name}
                  </td>
                  {cells.map((val, i) => (
                    <td
                      key={i}
                      className="border border-gray-400 px-2 py-1 text-xs text-center"
                    >
                      {val}
                    </td>
                  ))}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-gray-500 mt-2">
        X = speaking role &nbsp;·&nbsp; (X) = nonspeaking or offstage
      </p>
    </div>
  )
}
