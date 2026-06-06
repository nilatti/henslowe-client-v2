import _ from 'lodash'
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

interface ChartOnStage {
  character_id: number
  nonspeaking: boolean
  character?: { id: number; name: string } | null
}

interface ChartFrenchScene {
  on_stages?: ChartOnStage[]
  pretty_name?: string
  original_line_count?: number
  new_line_count?: number
}

interface ChartScene {
  french_scenes: ChartFrenchScene[]
  original_line_count?: number
  new_line_count?: number
  pretty_name?: string
}

interface ChartAct {
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

  function generateColumns(): React.ReactNode[] {
    const acts = filterEmptyContent(play.acts) as unknown as ChartAct[]
    if (level === 'act') {
      return acts.map(act => (
        <th key={crypto.randomUUID()} className="border border-gray-400 px-2 py-2 text-sm font-bold text-left bg-white">
          Act {act.number}
        </th>
      ))
    } else if (level === 'scene') {
      const scenes = getScenesFromPlay(play) as unknown as ChartScene[]
      return (filterEmptyContent(scenes) as unknown as ChartScene[]).map(scene => (
        <th key={crypto.randomUUID()} className="border border-gray-400 px-2 py-2 text-sm font-bold text-left bg-white">
          {scene.pretty_name ?? ''}
        </th>
      ))
    } else {
      const fss = getFrenchScenesFromPlay(play) as unknown as ChartFrenchScene[]
      return fss.map(fs => (
        <th key={crypto.randomUUID()} className="border border-gray-400 px-2 py-2 text-sm font-bold text-left bg-white" style={{ minWidth: '70px' }}>
          {fs.pretty_name ?? ''}
        </th>
      ))
    }
  }

  function generateRow(actor: User): React.ReactNode {
    const blocks = getOnStages()
    const actorCharacterIds = castings
      .filter(c => c.user_id === actor.id)
      .map(c => c.character_id)
      .filter((id): id is number => id !== null)

    const rowData = blocks.map(block => {
      const blockCharacters: ChartOnStage[] = []
      block.forEach(onStage => {
        if (_.includes(actorCharacterIds, onStage.character_id)) {
          blockCharacters.push(onStage)
        }
      })
      const uniqBlockCharacters = _.uniqBy(blockCharacters, os => os.character?.id)
      const names = _.map(uniqBlockCharacters, os =>
        os.nonspeaking ? `(${os.character?.name ?? ''})` : (os.character?.name ?? '')
      )
      const doublingProblem = uniqBlockCharacters.length > 1

      return (
        <td
          key={crypto.randomUUID()}
          className={`border border-gray-400 px-2 py-1 text-xs break-words ${
            doublingProblem ? 'bg-orange-400 text-white font-medium' : ''
          }`}
        >
          {_.join(names, ', ')}
        </td>
      )
    })

    return (
      <tr key={crypto.randomUUID()} className="odd:bg-white even:bg-teal-50 hover:bg-blue-50 transition-colors">
        <td
          className="border border-gray-400 px-2 py-1 text-sm font-medium sticky left-0 bg-inherit z-10"
          style={{ width: '220px', minWidth: '220px' }}
        >
          {buildUserName(actor)}
        </td>
        {rowData}
      </tr>
    )
  }

  function generateUncastRow(): React.ReactNode {
    const blocks = getOnStages()
    const uncastCharacterIds = castings
      .filter(c => c.character && !c.character.name.match(/Could Not Find Character/) && !c.user_id)
      .map(c => c.character_id)
      .filter((id): id is number => id !== null)

    const rowData = blocks.map(block => {
      const blockChars: ChartOnStage[] = []
      block.forEach(onStage => {
        if (_.includes(uncastCharacterIds, onStage.character_id)) {
          blockChars.push(onStage)
        }
      })
      const uniqChars = _.uniqBy(blockChars, os => os.character?.id)
      const names = _.map(uniqChars, os => os.character?.name ?? '')

      return (
        <td key={crypto.randomUUID()} className="border border-gray-400 px-2 py-1 text-xs break-words">
          {_.join(names, ', ')}
        </td>
      )
    })

    return (
      <tr key={crypto.randomUUID()} className="odd:bg-white even:bg-teal-50 border-t-2 border-gray-400">
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

  return (
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
  )
}
