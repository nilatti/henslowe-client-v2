import { useState } from 'react'
import { Link } from '@tanstack/react-router'
import { useFreePlayStore } from '../store/freePlayStore'
import { DoublingChartShow } from '../../productions/components/DoublingChartShow'
import type { ChartPlay } from '../../productions/components/DoublingChartShow'
import { Tabs } from '../../../components/ui'
import type { JobWithDetails } from '../../jobs/types/job'

const TABS = [
  { id: 'act', label: 'Acts' },
  { id: 'scene', label: 'Scenes' },
  { id: 'french_scene', label: 'French Scenes' },
] as const

type TabId = (typeof TABS)[number]['id']

export function FreeDoublingChartContainer() {
  const { castings, fakeActorsArray, play } = useFreePlayStore()
  const [activeTab, setActiveTab] = useState<TabId>('act')

  const castingsWithActors = castings.filter(c => c.user)

  if (!castingsWithActors.length) {
    return (
      <div className="text-sm text-gray-700">
        You don't have any actors cast.
        <br />
        <Link to="/free/casting" className="text-blue-600 hover:underline">
          Go to cast some people
        </Link>{' '}
        and then come back here.
      </div>
    )
  }

  // Shape castings so DoublingChartShow can consume them via user_id
  const shapedCastings = castings.map(c => ({
    ...c,
    id: c.character_id,
    production_id: null,
    theater_id: null,
    user_id: c.user?.id ?? null,
    specialization_id: null,
    character_group_id: null,
    start_date: null,
    end_date: null,
    created_at: '',
    updated_at: '',
    specialization: null,
    theater: null,
    character_group: null,
    production: null,
  })) as unknown as JobWithDetails[]

  const chartPlay: ChartPlay = {
    id: play!.id,
    title: play!.title,
    acts: play!.acts as unknown as ChartPlay['acts'],
  }

  return (
    <div>
      <div className="p-3 mb-4 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
        <strong>Orange</strong> indicates one actor playing two characters in an
        act/scene/french scene. A character name in <strong>parentheses</strong>{' '}
        indicates that the character is onstage but (in your cut) doesn't talk.
      </div>

      <Tabs
        tabs={[...TABS]}
        activeTab={activeTab}
        onChange={id => setActiveTab(id as TabId)}
      />

      <DoublingChartShow
        level={activeTab}
        play={chartPlay}
        castings={shapedCastings}
        actors={fakeActorsArray}
      />
    </div>
  )
}
