import _ from 'lodash'
import { Link } from '@tanstack/react-router'
import {
  filterEmptyContent,
  getFrenchScenesFromPlay,
  getOnStagesFromAct,
  getOnStagesFromScene,
  getScenesFromPlay,
} from '../../../utils/playScriptUtils'
import { buildUserName } from '../../../utils/actorUtils'
import type { User } from '../../../utils/actorUtils'
import type { JobWithDetails } from '../../jobs/types/job'
import { Button } from '../../../components/ui'
import { downloadCsv, slugify } from '../../../utils/csvUtils'

interface ChartOnStage {
  character_id: number | null
  character_group_id?: number | null
  nonspeaking: boolean
  offstage: boolean
  character?: { id: number; name: string } | null
  character_group?: { id: number; name: string } | null
}

interface ChartFrenchScene {
  id: number
  on_stages?: ChartOnStage[]
  pretty_name?: string
  original_line_count?: number
  new_line_count?: number
}

interface ChartScene {
  id: number
  french_scenes: ChartFrenchScene[]
  original_line_count?: number
  new_line_count?: number
  pretty_name?: string
}

interface ChartAct {
  id: number
  number: number
  scenes: ChartScene[]
  original_line_count?: number
  new_line_count?: number
}

export interface ChartPlay {
  id: number
  title: string
  acts: ChartAct[]
}

interface DoublingChartShowProps {
  level: 'act' | 'scene' | 'french_scene'
  play: ChartPlay
  castings: JobWithDetails[]
  actors: User[]
}

interface CharacterCell {
  name: string
  id?: number
  nonspeaking: boolean
  offstage: boolean
}

interface BlockCell {
  characters: CharacterCell[]
  doublingProblem: boolean
}

export function DoublingChartShow({ level, play, castings, actors }: DoublingChartShowProps) {
  if (!play.acts.length || !castings.length) {
    return <p className="text-sm text-gray-500 py-4">No casting data available yet.</p>
  }

  const tableWidth = 'max-content'

  function getOnStages(): ChartOnStage[][] {
    const blocks: ChartOnStage[][] = []
    const acts = filterEmptyContent(play.acts) as unknown as ChartAct[]
    if (level === 'act') {
      acts.forEach(act => {
        blocks.push(getOnStagesFromAct(act) as unknown as ChartOnStage[])
      })
    } else if (level === 'scene') {
      acts.forEach(act => {
        const scenes = filterEmptyContent(act.scenes) as unknown as ChartScene[]
        scenes.forEach(scene => {
          blocks.push(getOnStagesFromScene(scene) as unknown as ChartOnStage[])
        })
      })
    } else {
      acts.forEach(act => {
        const scenes = filterEmptyContent(act.scenes) as unknown as ChartScene[]
        scenes.forEach(scene => {
          scene.french_scenes.forEach(fs => {
            blocks.push(fs.on_stages ?? [])
          })
        })
      })
    }
    return blocks
  }

  function getColumnLabels(): string[] {
    const acts = filterEmptyContent(play.acts) as unknown as ChartAct[]
    if (level === 'act') {
      return acts.map(act => `Act ${act.number}`)
    } else if (level === 'scene') {
      const scenes = getScenesFromPlay(play) as unknown as ChartScene[]
      return (filterEmptyContent(scenes) as unknown as ChartScene[]).map(s => s.pretty_name ?? '')
    } else {
      const fss = getFrenchScenesFromPlay(play) as unknown as ChartFrenchScene[]
      return fss.map(fs => fs.pretty_name ?? '')
    }
  }

  function generateColumns(): React.ReactNode[] {
    const acts = filterEmptyContent(play.acts) as unknown as ChartAct[]
    const thClass = 'border border-gray-400 px-2 py-2 text-sm font-bold text-left bg-white'
    const linkClass = 'text-blue-600 hover:text-blue-800 hover:underline'

    if (level === 'act') {
      return acts.map(act => (
        <th key={act.id} className={thClass} style={{ minWidth: '70px' }}>
          <Link
            to="/plays/$playId/acts/$actId"
            params={{ playId: String(play.id), actId: String(act.id) }}
            className={linkClass}
          >
            Act {act.number}
          </Link>
        </th>
      ))
    } else if (level === 'scene') {
      return acts.flatMap(act => {
        const scenes = filterEmptyContent(act.scenes) as unknown as ChartScene[]
        return scenes.map(scene => (
          <th key={scene.id} className={thClass} style={{ minWidth: '70px' }}>
            <Link
              to="/plays/$playId/acts/$actId/scenes/$sceneId"
              params={{ playId: String(play.id), actId: String(act.id), sceneId: String(scene.id) }}
              className={linkClass}
            >
              {scene.pretty_name ?? ''}
            </Link>
          </th>
        ))
      })
    } else {
      return acts.flatMap(act => {
        const scenes = filterEmptyContent(act.scenes) as unknown as ChartScene[]
        return scenes.flatMap(scene =>
          scene.french_scenes.map(fs => (
            <th key={fs.id} className={thClass} style={{ minWidth: '70px' }}>
              <Link
                to="/plays/$playId/acts/$actId/scenes/$sceneId/french-scenes/$frenchSceneId"
                params={{ playId: String(play.id), actId: String(act.id), sceneId: String(scene.id), frenchSceneId: String(fs.id) }}
                className={linkClass}
              >
                {fs.pretty_name ?? ''}
              </Link>
            </th>
          ))
        )
      })
    }
  }

  function getActorBlockCells(actor: User, blocks: ChartOnStage[][]): BlockCell[] {
    const actorCharacterIds = castings
      .filter(c => c.user_id === actor.id)
      .map(c => c.character_id)
      .filter((id): id is number => id !== null)

    const actorCharacterGroupIds = castings
      .filter(c => c.user_id === actor.id)
      .map(c => c.character_group_id)
      .filter((id): id is number => id !== null)

    return blocks.map(block => {
      const matching = block.filter(os =>
        (os.character_id != null && _.includes(actorCharacterIds, os.character_id)) ||
        (os.character_group_id != null && _.includes(actorCharacterGroupIds, os.character_group_id))
      )
      const uniqChars = _.uniqBy(matching, os =>
        os.character?.id != null ? `char-${os.character.id}` : `group-${os.character_group?.id}`
      )
      return {
        characters: uniqChars.map(os => ({
          name: os.character?.name ?? os.character_group?.name ?? '',
          id: os.character?.id,
          nonspeaking: os.nonspeaking,
          offstage: os.offstage,
        })),
        doublingProblem: uniqChars.length > 1,
      }
    })
  }

  function renderCharacterLink(ch: CharacterCell): React.ReactNode {
    const nameEl = ch.id ? (
      <Link
        to="/plays/$playId/characters/$characterId"
        params={{ playId: String(play.id), characterId: String(ch.id) }}
        className="hover:underline"
      >
        {ch.name}
      </Link>
    ) : ch.name

    return (ch.nonspeaking || ch.offstage) ? <>({nameEl})</> : nameEl
  }

  function generateRow(actor: User): React.ReactNode {
    const blocks = getOnStages()
    const cells = getActorBlockCells(actor, blocks)

    return (
      <tr key={actor.id} className="odd:bg-white even:bg-teal-50 hover:bg-blue-50 transition-colors">
        <td
          className="border border-gray-400 px-2 py-1 text-sm font-medium sticky left-0 bg-inherit z-10"
          style={{ width: '220px', minWidth: '220px' }}
        >
          <Link
            to="/users/$userId"
            params={{ userId: String(actor.id) }}
            className="text-blue-600 hover:text-blue-800 hover:underline"
          >
            {buildUserName(actor)}
          </Link>
        </td>
        {cells.map(({ characters, doublingProblem }, i) => (
          <td
            key={i}
            className={`border border-gray-400 px-2 py-1 text-xs break-words ${
              doublingProblem ? 'bg-orange-400 text-white font-medium' : ''
            }`}
          >
            {characters.map((ch, j) => (
              <span key={ch.id ?? j}>
                {j > 0 && ', '}
                {renderCharacterLink(ch)}
              </span>
            ))}
          </td>
        ))}
      </tr>
    )
  }

  function generateUncastRow(): React.ReactNode {
    const blocks = getOnStages()
    const uncastCharacterIds = castings
      .filter(c => c.character && !c.character.name.match(/Could Not Find Character/) && !c.user_id)
      .map(c => c.character_id)
      .filter((id): id is number => id !== null)

    const uncastCharacterGroupIds = castings
      .filter(c => c.character_group && !c.user_id)
      .map(c => c.character_group_id)
      .filter((id): id is number => id !== null)

    const rowData = blocks.map((block, i) => {
      const uniqChars = _.uniqBy(
        block.filter(os =>
          (os.character_id != null && _.includes(uncastCharacterIds, os.character_id)) ||
          (os.character_group_id != null && _.includes(uncastCharacterGroupIds, os.character_group_id))
        ),
        os => os.character?.id != null ? `char-${os.character.id}` : `group-${os.character_group?.id}`,
      )
      return (
        <td key={i} className="border border-gray-400 px-2 py-1 text-xs break-words">
          {uniqChars.map((os, j) => (
            <span key={os.character?.id ?? os.character_group?.id ?? j}>
              {j > 0 && ', '}
              {os.character?.id ? (
                <Link
                  to="/plays/$playId/characters/$characterId"
                  params={{ playId: String(play.id), characterId: String(os.character.id) }}
                  className="hover:underline"
                >
                  {os.character.name}
                </Link>
              ) : (os.character?.name ?? os.character_group?.name ?? '')}
            </span>
          ))}
        </td>
      )
    })

    return (
      <tr key="uncast" className="odd:bg-white even:bg-teal-50 border-t-2 border-gray-400">
        <td
          className="border border-gray-400 px-2 py-1 text-sm font-medium italic sticky left-0 bg-inherit z-10"
          style={{ width: '220px', minWidth: '220px' }}
        >
          Still to cast
        </td>
        {rowData}
      </tr>
    )
  }

  function generateCsvRows(): string[][] {
    const blocks = getOnStages()
    const columnLabels = getColumnLabels()
    const header = ['Actor', ...columnLabels]

    const actorRows = actors.map(actor => {
      const cells = getActorBlockCells(actor, blocks)
      return [
        buildUserName(actor),
        ...cells.map(c =>
          _.join(
            c.characters.map(ch => (ch.nonspeaking || ch.offstage) ? `(${ch.name})` : ch.name),
            ', ',
          )
        ),
      ]
    })

    const uncastCharacterIds = castings
      .filter(c => c.character && !c.character.name.match(/Could Not Find Character/) && !c.user_id)
      .map(c => c.character_id)
      .filter((id): id is number => id !== null)

    const uncastCharacterGroupIds = castings
      .filter(c => c.character_group && !c.user_id)
      .map(c => c.character_group_id)
      .filter((id): id is number => id !== null)

    const uncastCells = blocks.map(block => {
      const uniqChars = _.uniqBy(
        block.filter(os =>
          (os.character_id != null && _.includes(uncastCharacterIds, os.character_id)) ||
          (os.character_group_id != null && _.includes(uncastCharacterGroupIds, os.character_group_id))
        ),
        os => os.character?.id != null ? `char-${os.character.id}` : `group-${os.character_group?.id}`,
      )
      return _.join(uniqChars.map(os => os.character?.name ?? os.character_group?.name ?? ''), ', ')
    })

    return [header, ...actorRows, ['Still to cast', ...uncastCells]]
  }

  function handleDownload() {
    const levelLabel = level === 'act' ? 'acts' : level === 'scene' ? 'scenes' : 'french-scenes'
    downloadCsv(generateCsvRows(), `${slugify(play.title)}-doubling-chart-${levelLabel}.csv`)
  }

  return (
    <div>
      <div className="flex justify-end mb-2">
        <Button variant="secondary" className="text-xs px-3 py-1.5" onClick={handleDownload}>
          Download CSV
        </Button>
      </div>
      <div className="w-full overflow-x-auto">
        <table
          className="border-collapse w-full"
          style={{
            width: tableWidth,
            tableLayout: 'auto',
          }}
        >
          <thead>
            <tr>
              <th
                className="border border-gray-400 px-2 py-2 text-sm font-bold text-left bg-white sticky left-0 z-10"
                style={{ width: '220px', minWidth: '220px' }}
              >
                Actor
              </th>
              {generateColumns()}
            </tr>
          </thead>
          <tbody>
            {actors.map(actor => generateRow(actor))}
            {generateUncastRow()}
          </tbody>
        </table>
      </div>
    </div>
  )
}
