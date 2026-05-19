import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useUpdateRehearsal } from '../../api/rehearsals'
import {
  playActOnStagesQueryOptions,
  playSceneOnStagesQueryOptions,
  playFrenchSceneOnStagesQueryOptions,
  type TextUnitWithOnStages,
} from '../../api/rehearsals'
import type { RehearsalWithDetails, RehearsalUser } from '../../types/rehearsal'
import { TextUnitSelector } from './TextUnitSelector'
import { PlayContentCheckboxes } from './PlayContentCheckboxes'
import { ExtraUsersPanel } from './ExtraUsersPanel'
import { Button, Card } from '../../../../components/ui'
import {
  markContentScheduled,
  markContentRecommended,
  buildCallList,
  getCalledActors,
  detectExtraUsers,
  buildFinalUserIds,
} from '../../utils/contentUtils'
import { unavailableUsers } from '../../../../utils/rehearsalUtils'

interface RehearsalContentManagerProps {
  rehearsal: RehearsalWithDetails
  productionId: number
  playId: number
  actors: RehearsalUser[]
  staffUsers: RehearsalUser[]
  onClose: () => void
}

export function RehearsalContentManager({
  rehearsal,
  productionId,
  playId,
  actors,
  staffUsers,
  onClose,
}: RehearsalContentManagerProps) {
  const updateRehearsal = useUpdateRehearsal(productionId)

  const actsQuery = useQuery({
    ...playActOnStagesQueryOptions(playId),
    enabled: rehearsal.text_unit === 'acts',
  })
  const scenesQuery = useQuery({
    ...playSceneOnStagesQueryOptions(playId),
    enabled: rehearsal.text_unit === 'scenes',
  })
  const frenchScenesQuery = useQuery({
    ...playFrenchSceneOnStagesQueryOptions(playId),
    enabled: rehearsal.text_unit === 'french_scenes',
  })

  const rawPlayContent =
    rehearsal.text_unit === 'acts'
      ? actsQuery.data
      : rehearsal.text_unit === 'scenes'
      ? scenesQuery.data
      : frenchScenesQuery.data

  const isLoading =
    rehearsal.text_unit === 'acts'
      ? actsQuery.isLoading
      : rehearsal.text_unit === 'scenes'
      ? scenesQuery.isLoading
      : frenchScenesQuery.isLoading

  const [playContent, setPlayContent] = useState<TextUnitWithOnStages[]>([])
  const [extraUsers, setExtraUsers] = useState<RehearsalUser[]>([])
  const [showExtraUsers, setShowExtraUsers] = useState(false)

  const unavailableActors = unavailableUsers(actors, rehearsal as never) as RehearsalUser[]

  useEffect(() => {
    if (!rawPlayContent) return

    const rehearsalContentIds: number[] =
      ((rehearsal as any)[rehearsal.text_unit ?? 'acts'] as { id: number }[] | undefined)
        ?.map(item => item.id) ?? []

    let processed: TextUnitWithOnStages[] = rawPlayContent.map(item => ({
      ...item,
      heading: item.pretty_name ?? `Act ${item.number}`,
    }))
    processed = markContentScheduled(processed, rehearsalContentIds)
    processed = markContentRecommended(processed, unavailableActors)
    processed = processed.map(item => ({
      ...item,
      furtherInfo: buildCallList(item, actors),
    }))

    setPlayContent(processed)
  }, [rawPlayContent, rehearsal.id])

  const handleToggle = (id: number) => {
    setPlayContent(prev =>
      prev.map(item =>
        item.id === id ? { ...item, isScheduled: !item.isScheduled } : item
      )
    )
  }

  const handleSchedule = () => {
    const selected = playContent.filter(item => item.isScheduled)
    const newCalledActors = getCalledActors(selected, actors)

    const rehearsalActors = rehearsal.users.filter(u =>
      actors.some(a => a.id === u.id)
    )
    const extras = detectExtraUsers(rehearsalActors, newCalledActors)

    if (extras.length > 0) {
      setExtraUsers(extras)
      setShowExtraUsers(true)
    } else {
      submitContent([])
    }
  }

  const submitContent = async (confirmedExtraUsers: RehearsalUser[]) => {
    const selected = playContent.filter(item => item.isScheduled)
    const calledActors = getCalledActors(selected, actors)
    const userIds = buildFinalUserIds(calledActors, confirmedExtraUsers, staffUsers)

    const singularKey = rehearsal.text_unit
      ? `${rehearsal.text_unit.slice(0, -1)}_ids`
      : 'act_ids'

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await updateRehearsal.mutateAsync({
      id: rehearsal.id,
      text_unit: rehearsal.text_unit,
      user_ids: userIds,
      [singularKey]: selected.map(item => item.id),
    } as any)
    onClose()
  }

  if (!rehearsal.text_unit) {
    return (
      <TextUnitSelector
        rehearsal={rehearsal}
        productionId={productionId}
        onClose={onClose}
      />
    )
  }

  if (isLoading) {
    return (
      <Card className="p-6 text-center text-sm text-gray-500">
        Loading content...
      </Card>
    )
  }

  if (showExtraUsers && extraUsers.length > 0) {
    return (
      <ExtraUsersPanel
        extraUsers={extraUsers}
        onConfirm={confirmed => {
          setShowExtraUsers(false)
          submitContent(confirmed)
        }}
      />
    )
  }

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-gray-900 capitalize">
          Select content ({rehearsal.text_unit.replace('_', ' ')})
        </h3>
        <div className="flex gap-2">
          <Button onClick={handleSchedule} disabled={updateRehearsal.isPending}>
            {updateRehearsal.isPending ? 'Saving...' : 'Save content'}
          </Button>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
        </div>
      </div>
      {playContent.length === 0 ? (
        <p className="text-sm text-gray-400 italic">No content found for this play.</p>
      ) : (
        <PlayContentCheckboxes playContent={playContent} onChange={handleToggle} />
      )}
    </Card>
  )
}
