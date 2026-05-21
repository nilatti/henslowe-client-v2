import { useState } from 'react'
import { useSuspenseQuery } from '@tanstack/react-query'
import { useUserRoleForProduction } from '../../../../hooks/useUserRole'
import { stageExitsQueryOptions, useCreateStageExit, useUpdateStageExit, useDeleteStageExit } from '../../api/stageExits'
import { StageExitShow } from './StageExitShow'
import { StageExitForm } from './StageExitForm'
import { Button, ErrorMessage } from '../../../../components/ui'

interface StageExitsListProps {
  productionId: number
}

export function StageExitsList({ productionId }: StageExitsListProps) {
  const { data: stageExits } = useSuspenseQuery(stageExitsQueryOptions(productionId))
  const role = useUserRoleForProduction(productionId)
  const isAdmin = role === 'admin'

  const create = useCreateStageExit(productionId)
  const update = useUpdateStageExit(productionId)
  const del = useDeleteStageExit(productionId)

  const [addingNew, setAddingNew] = useState(false)

  const anyError = create.error || update.error || del.error

  return (
    <div>
      {isAdmin && (
        <p className="text-xs text-gray-500 mb-2 italic">Click a name to edit</p>
      )}

      {anyError && (
        <ErrorMessage message={(anyError as Error).message || 'An error occurred'} />
      )}

      <ul className="divide-y divide-gray-100">
        {stageExits.map(se => (
          <StageExitShow
            key={se.id}
            stageExit={se}
            isAdmin={isAdmin}
            onUpdate={data => update.mutate(data)}
            onDelete={id => del.mutate(id)}
            isUpdating={update.isPending && update.variables?.id === se.id}
            isDeleting={del.isPending && del.variables === se.id}
          />
        ))}
      </ul>

      {isAdmin && (
        <div className="mt-3">
          {addingNew ? (
            <StageExitForm
              onSubmit={data => {
                create.mutate(data, { onSuccess: () => setAddingNew(false) })
              }}
              onCancel={() => setAddingNew(false)}
              isPending={create.isPending}
            />
          ) : (
            <Button variant="secondary" onClick={() => setAddingNew(true)}>
              Add Stage Exit
            </Button>
          )}
        </div>
      )}
    </div>
  )
}
