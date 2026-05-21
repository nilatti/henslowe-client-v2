import { useState, Suspense } from 'react'
import { useSuspenseQuery } from '@tanstack/react-query'
import { useUserRoleForProduction } from '../../../../hooks/useUserRole'
import {
  entranceExitsQueryOptions,
  useCreateEntranceExit,
  useUpdateEntranceExit,
  useDeleteEntranceExit,
} from '../../api/entranceExits'
import { stageExitsQueryOptions } from '../../api/stageExits'
import { EntranceExitShow } from './EntranceExitShow'
import { EntranceExitForm } from './EntranceExitForm'
import type { EntranceExitFormData } from './EntranceExitForm'
import { Button, ErrorMessage, LoadingSpinner } from '../../../../components/ui'
import type { PlayCharacter } from '../../../plays/types/play'

interface EntranceExitsListProps {
  frenchSceneId: number
  productionId: number
  characters: PlayCharacter[]
}

function EntranceExitsListInner({
  frenchSceneId,
  productionId,
  characters,
}: EntranceExitsListProps) {
  const { data: entranceExits } = useSuspenseQuery(
    entranceExitsQueryOptions(frenchSceneId)
  )
  const { data: stageExits } = useSuspenseQuery(stageExitsQueryOptions(productionId))

  const role = useUserRoleForProduction(productionId)
  const isAdmin = role === 'admin'

  const create = useCreateEntranceExit(frenchSceneId)
  const update = useUpdateEntranceExit(frenchSceneId)
  const del = useDeleteEntranceExit(frenchSceneId)

  const [addingNew, setAddingNew] = useState(false)

  const anyError = create.error || update.error || del.error

  const sorted = [...entranceExits].sort((a, b) => {
    if (a.line == null && b.line == null) return 0
    if (a.line == null) return 1
    if (b.line == null) return -1
    return a.line - b.line
  })

  function handleCreate(data: EntranceExitFormData) {
    if (!data.stage_exit_id || !data.category) return
    create.mutate(
      {
        category: data.category as 'Enter' | 'Exit',
        line: data.line,
        page: data.page,
        notes: data.notes === '' ? null : data.notes,
        stage_exit_id: data.stage_exit_id as number,
        character_ids: data.character_ids,
      },
      { onSuccess: () => setAddingNew(false) }
    )
  }

  return (
    <div>
      <h3 className="text-sm font-semibold text-gray-900 mb-3">
        Entrances &amp; Exits ({entranceExits.length})
      </h3>

      {anyError && (
        <ErrorMessage
          message={(anyError as Error).message || 'An error occurred'}
        />
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
              <th className="px-3 py-2">Line</th>
              <th className="px-3 py-2">Page</th>
              <th className="px-3 py-2">Characters</th>
              <th className="px-3 py-2">Enter or Exit?</th>
              <th className="px-3 py-2">Stage Exit</th>
              <th className="px-3 py-2">Notes</th>
              <th className="px-3 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {sorted.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-3 py-4 text-sm text-gray-400 italic">
                  No entrances or exits listed
                </td>
              </tr>
            ) : (
              sorted.map(ee => (
                <EntranceExitShow
                  key={ee.id}
                  entranceExit={ee}
                  characters={characters}
                  stageExits={stageExits}
                  isAdmin={isAdmin}
                  onUpdate={data => update.mutate(data)}
                  onDelete={id => del.mutate(id)}
                  isUpdating={update.isPending && update.variables?.id === ee.id}
                  isDeleting={del.isPending && del.variables === ee.id}
                />
              ))
            )}
          </tbody>
        </table>
      </div>

      {isAdmin && (
        <div className="mt-4">
          {addingNew ? (
            <div className="border border-gray-200 rounded-md p-4 bg-gray-50">
              <EntranceExitForm
                frenchSceneId={frenchSceneId}
                characters={characters}
                stageExits={stageExits}
                onSubmit={handleCreate}
                onCancel={() => setAddingNew(false)}
                isPending={create.isPending}
              />
            </div>
          ) : (
            <Button variant="secondary" onClick={() => setAddingNew(true)}>
              Add New Entrance/Exit
            </Button>
          )}
        </div>
      )}
    </div>
  )
}

export function EntranceExitsList(props: EntranceExitsListProps) {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <EntranceExitsListInner {...props} />
    </Suspense>
  )
}
